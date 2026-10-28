"""
End-to-end face-matching pipeline.

Orchestrates the full workflow::

    reference image  →  load  →  detect faces  →  extract embedding
                                                         ↓
    candidate images →  load  →  detect faces  →  extract embeddings
                                                         ↓
                                                  compare each vs ref
                                                         ↓
                                                  structured results

This is the **primary entry point** for the face-matching module.
Future backend services will call
:meth:`FaceMatchPipeline.match_against_candidates`.
"""

import logging
from typing import List, Optional

from .config import FaceMatchConfig
from .image_loader import load_image, ImageLoadError
from .face_detector import FaceDetector, FaceDetectionError
from .embedding_extractor import EmbeddingExtractor, EmbeddingExtractionError
from .face_matcher import FaceMatcher
from .result_schema import DetectedFace, MatchResult, PipelineResult

logger = logging.getLogger(__name__)


class FaceMatchPipeline:
    """
    Orchestrate the face-matching workflow.

    Initialises the detector, extractor, and matcher **once**,
    then reuses them across all processing calls.

    Example
    -------
    >>> pipeline = FaceMatchPipeline()
    >>> results = pipeline.match_against_candidates(
    ...     reference_path="ref.jpg",
    ...     candidate_paths=["img1.jpg", "img2.jpg"],
    ... )
    >>> for m in results.get_positive_matches():
    ...     print(m.candidate_image_path, m.similarity_score)
    """

    def __init__(self, config: Optional[FaceMatchConfig] = None):
        self.config = config or FaceMatchConfig()
        self.detector = FaceDetector(self.config)
        self.extractor = EmbeddingExtractor()
        self.matcher = FaceMatcher(self.config)

    # ── Reference processing ──────────────────────────────────────────

    def process_reference(self, reference_path: str, face_index: int = 0):
        """
        Load, detect, and extract the embedding for the reference face.

        Parameters
        ----------
        reference_path : str
            Path to the reference photograph.
        face_index : int
            Which detected face to use (0 = highest confidence).

        Returns
        -------
        tuple[np.ndarray, list[DetectedFace]]
            ``(embedding, all_detected_faces)``.

        Raises
        ------
        ImageLoadError
            If the image cannot be loaded.
        ValueError
            If no faces are detected or ``face_index`` is out of range.
        """
        logger.info("Processing reference image: %s", reference_path)

        image = load_image(reference_path, self.config)
        faces = self.detector.detect_faces(image)

        if len(faces) == 0:
            raise ValueError(
                f"No faces detected in the reference image: "
                f"{reference_path}. "
                f"Ensure the image contains a clearly visible face."
            )

        if len(faces) > 1:
            logger.warning(
                "Multiple faces (%d) detected in the reference image. "
                "Using face at index %d (highest confidence by default). "
                "Pass face_index= to select a different face.",
                len(faces),
                face_index,
            )

        if face_index >= len(faces):
            raise ValueError(
                f"face_index={face_index} is out of range. "
                f"Only {len(faces)} face(s) detected in the "
                f"reference image."
            )

        selected = faces[face_index]
        embedding = self.extractor.extract_embedding(selected)

        logger.info(
            "Reference face selected — index=%d  confidence=%.3f  "
            "bbox=%s",
            selected.face_index,
            selected.detection_confidence,
            [round(v, 1) for v in selected.bbox],
        )

        return embedding, faces

    # ── Full pipeline ─────────────────────────────────────────────────

    def match_against_candidates(
        self,
        reference_path: str,
        candidate_paths: List[str],
        face_index: int = 0,
    ) -> PipelineResult:
        """
        Compare the reference face against every candidate image.

        Parameters
        ----------
        reference_path : str
            Path to the reference photograph.
        candidate_paths : list[str]
            Paths to candidate images.
        face_index : int
            Which face in the reference to use.

        Returns
        -------
        PipelineResult
            Contains one ``MatchResult`` per candidate.
        """
        ref_embedding, ref_faces = self.process_reference(
            reference_path, face_index
        )

        results: List[MatchResult] = []
        for candidate_path in candidate_paths:
            result = self._process_single_candidate(
                candidate_path, ref_embedding
            )
            results.append(result)

        return PipelineResult(
            reference_image_path=reference_path,
            reference_faces_detected=len(ref_faces),
            reference_face_used=face_index,
            matches=results,
            config_summary={
                "model_version": self.config.model_version_tag,
                "similarity_threshold": self.config.similarity_threshold,
                "det_size": list(self.config.det_size),
                "min_detection_confidence": (
                    self.config.min_detection_confidence
                ),
            },
        )

    # ── Single-candidate processing ───────────────────────────────────

    def _process_single_candidate(
        self,
        candidate_path: str,
        ref_embedding,
    ) -> MatchResult:
        """
        Process one candidate image and return the best-matching face.
        """
        model_ver = self.config.model_version_tag

        # ── Load image ────────────────────────────────────────────────
        try:
            image = load_image(candidate_path, self.config)
        except ImageLoadError as exc:
            return MatchResult(
                candidate_image_path=candidate_path,
                num_faces_detected=0,
                face_bbox=None,
                face_index=None,
                similarity_score=None,
                is_match=False,
                model_version=model_ver,
                processing_status="error",
                error_info=str(exc),
            )

        # ── Detect faces ──────────────────────────────────────────────
        try:
            faces = self.detector.detect_faces(image)
        except FaceDetectionError as exc:
            return MatchResult(
                candidate_image_path=candidate_path,
                num_faces_detected=0,
                face_bbox=None,
                face_index=None,
                similarity_score=None,
                is_match=False,
                model_version=model_ver,
                processing_status="error",
                error_info=str(exc),
            )

        if len(faces) == 0:
            return MatchResult(
                candidate_image_path=candidate_path,
                num_faces_detected=0,
                face_bbox=None,
                face_index=None,
                similarity_score=None,
                is_match=False,
                model_version=model_ver,
                processing_status="no_faces",
            )

        # ── Compare each detected face with the reference ─────────────
        best_similarity = -2.0
        best_face: Optional[DetectedFace] = None

        for face in faces:
            try:
                cand_emb = self.extractor.extract_embedding(face)
                sim = self.matcher.compute_similarity(
                    ref_embedding, cand_emb
                )
                if sim > best_similarity:
                    best_similarity = sim
                    best_face = face
            except EmbeddingExtractionError as exc:
                logger.warning(
                    "Embedding extraction failed for face %d in %s: %s",
                    face.face_index,
                    candidate_path,
                    exc,
                )
                continue

        # ── No usable embeddings ──────────────────────────────────────
        if best_face is None:
            return MatchResult(
                candidate_image_path=candidate_path,
                num_faces_detected=len(faces),
                face_bbox=None,
                face_index=None,
                similarity_score=None,
                is_match=False,
                model_version=model_ver,
                processing_status="error",
                error_info=(
                    "Faces detected but no valid embeddings "
                    "could be extracted."
                ),
            )

        # ── Return best match ─────────────────────────────────────────
        return MatchResult(
            candidate_image_path=candidate_path,
            num_faces_detected=len(faces),
            face_bbox=best_face.bbox,
            face_index=best_face.face_index,
            similarity_score=best_similarity,
            is_match=self.matcher.is_match(best_similarity),
            model_version=model_ver,
            processing_status="success",
        )
