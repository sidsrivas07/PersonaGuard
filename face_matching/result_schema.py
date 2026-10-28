"""
Structured result types for the face-matching pipeline.

These dataclasses define the shape of every result object that
flows through the pipeline.  They are designed to be easily
serializable to JSON so that a future backend API can consume
them directly.

No raw images, biometric embeddings, or personal data appear
in these structures — only metadata, scores, and coordinates.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ── Per-face detection result ─────────────────────────────────────────

@dataclass
class DetectedFace:
    """
    A single face located within an image.

    Attributes
    ----------
    bbox : list[float]
        Bounding box ``[x1, y1, x2, y2]`` in pixel coordinates.
    detection_confidence : float
        Model's confidence that this region contains a face (0–1).
    face_index : int
        Position among all accepted faces in the same image,
        ordered by descending confidence.
    _internal_face : object
        Raw InsightFace ``Face`` object.  **Not serialized.**
        The leading underscore signals that this is an implementation
        detail, not part of the public interface.
    """

    bbox: List[float]
    detection_confidence: float
    face_index: int
    _internal_face: object = field(default=None, repr=False, compare=False)

    def to_dict(self) -> Dict[str, Any]:
        """JSON-safe dictionary (excludes internal model object)."""
        return {
            "bbox": [round(v, 1) for v in self.bbox],
            "detection_confidence": round(self.detection_confidence, 4),
            "face_index": self.face_index,
        }


# ── Per-candidate matching result ─────────────────────────────────────

@dataclass
class MatchResult:
    """
    Result of comparing **one candidate image** against the reference.

    If the candidate contains multiple faces, only the face with the
    *highest* similarity to the reference is reported here (the
    ``num_faces_detected`` field indicates how many faces existed).

    Attributes
    ----------
    candidate_image_path : str
        Path to the candidate image that was processed.
    num_faces_detected : int
        Total faces found in the candidate image.
    face_bbox : list[float] | None
        Bounding box of the best-matching face, or ``None``.
    face_index : int | None
        Index of the best-matching face, or ``None``.
    similarity_score : float | None
        Cosine similarity to the reference (−1 to 1), or ``None``.
    is_match : bool
        ``True`` if similarity_score ≥ configured threshold.
    model_version : str
        Model identifier recorded for reproducibility.
    processing_status : str
        ``"success"``, ``"no_faces"``, or ``"error"``.
    error_info : str | None
        Human-readable error description when ``processing_status``
        is ``"error"``.
    """

    candidate_image_path: str
    num_faces_detected: int
    face_bbox: Optional[List[float]]
    face_index: Optional[int]
    similarity_score: Optional[float]
    is_match: bool
    model_version: str
    processing_status: str          # "success" | "no_faces" | "error"
    error_info: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "candidate_image_path": self.candidate_image_path,
            "num_faces_detected": self.num_faces_detected,
            "face_bbox": (
                [round(v, 1) for v in self.face_bbox]
                if self.face_bbox else None
            ),
            "face_index": self.face_index,
            "similarity_score": (
                round(self.similarity_score, 4)
                if self.similarity_score is not None else None
            ),
            "is_match": self.is_match,
            "model_version": self.model_version,
            "processing_status": self.processing_status,
        }
        if self.error_info:
            result["error_info"] = self.error_info
        return result


# ── Full pipeline result ──────────────────────────────────────────────

@dataclass
class PipelineResult:
    """
    Aggregate output of a complete face-matching pipeline run.

    Contains reference-image metadata, configuration summary,
    and a list of ``MatchResult`` objects — one per candidate.
    """

    reference_image_path: str
    reference_faces_detected: int
    reference_face_used: int          # index of the face selected
    matches: List[MatchResult]
    config_summary: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reference_image_path": self.reference_image_path,
            "reference_faces_detected": self.reference_faces_detected,
            "reference_face_used": self.reference_face_used,
            "matches": [m.to_dict() for m in self.matches],
            "config_summary": self.config_summary,
        }

    def get_positive_matches(self) -> List[MatchResult]:
        """Return only candidates that exceeded the matching threshold."""
        return [m for m in self.matches if m.is_match]

    def get_errors(self) -> List[MatchResult]:
        """Return only candidates that encountered processing errors."""
        return [m for m in self.matches if m.processing_status == "error"]
