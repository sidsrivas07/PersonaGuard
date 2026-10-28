"""
Face detection module using InsightFace.

Wraps InsightFace's ``FaceAnalysis`` to locate faces in images.
The model is loaded **lazily** on the first call to
:meth:`detect_faces` and reused for every subsequent call,
avoiding the 2–4 s initialisation cost on every image.

InsightFace's detection step also computes facial embeddings
internally.  Those embeddings are carried inside
``DetectedFace._internal_face`` and accessed later by the
:class:`EmbeddingExtractor`.
"""

import logging
from typing import List, Optional

import numpy as np

from .config import FaceMatchConfig
from .result_schema import DetectedFace

logger = logging.getLogger(__name__)


class FaceDetectionError(Exception):
    """Raised when the detection model cannot be loaded or fails."""


class FaceDetector:
    """
    Detect faces in images using InsightFace (RetinaFace + ArcFace).

    The underlying ONNX models are loaded once on first use, then
    cached in memory for the lifetime of this object.

    Example
    -------
    >>> detector = FaceDetector()
    >>> faces = detector.detect_faces(image_bgr)
    >>> print(f"Found {len(faces)} face(s)")
    """

    def __init__(self, config: Optional[FaceMatchConfig] = None):
        self.config = config or FaceMatchConfig()
        self._app = None  # lazy-loaded FaceAnalysis instance

    # ── Lazy model loading ────────────────────────────────────────────

    def _ensure_model_loaded(self) -> None:
        """
        Download (if necessary) and initialise the InsightFace models.

        On the very first invocation the ``buffalo_l`` model pack
        (~300 MB) is fetched from the InsightFace CDN and cached at
        ``~/.insightface/models/``.
        """
        if self._app is not None:
            return

        try:
            from insightface.app import FaceAnalysis
        except ImportError:
            raise FaceDetectionError(
                "The 'insightface' package is not installed.\n"
                "Install it with:  pip install insightface onnxruntime"
            )

        try:
            logger.info(
                "Loading face model '%s' "
                "(first run may download ~300 MB) …",
                self.config.model_name,
            )

            self._app = FaceAnalysis(
                name=self.config.model_name,
                # Only load the two modules we actually need.
                allowed_modules=["detection", "recognition"],
                providers=self.config.providers,
            )
            self._app.prepare(ctx_id=0, det_size=self.config.det_size)

            logger.info("Face model loaded successfully.")

        except Exception as exc:
            raise FaceDetectionError(
                f"Failed to initialise face model "
                f"'{self.config.model_name}'.\n"
                f"Possible causes:\n"
                f"  • Model download failed (check your internet).\n"
                f"  • Incompatible ONNX Runtime version.\n"
                f"Original error: {exc}"
            ) from exc

    # ── Public API ────────────────────────────────────────────────────

    def detect_faces(self, image: np.ndarray) -> List[DetectedFace]:
        """
        Detect all faces in a BGR image.

        Parameters
        ----------
        image : np.ndarray
            Image in BGR colour order (OpenCV convention).

        Returns
        -------
        list[DetectedFace]
            Faces sorted by detection confidence (highest first).
            Only faces above ``config.min_detection_confidence`` are
            included.

        Raises
        ------
        FaceDetectionError
            If the model fails during processing.
        """
        self._ensure_model_loaded()

        try:
            raw_faces = self._app.get(image)
        except Exception as exc:
            raise FaceDetectionError(
                f"Detection failed during image processing: {exc}"
            ) from exc

        # Filter by confidence and wrap in our dataclass
        detected: List[DetectedFace] = []
        for i, face in enumerate(raw_faces):
            confidence = float(face.det_score)
            if confidence >= self.config.min_detection_confidence:
                detected.append(
                    DetectedFace(
                        bbox=face.bbox.tolist(),
                        detection_confidence=confidence,
                        face_index=i,
                        _internal_face=face,
                    )
                )

        # Sort by confidence — most prominent face first
        detected.sort(key=lambda f: f.detection_confidence, reverse=True)

        # Re-index after sorting so indices are contiguous 0, 1, 2 …
        for idx, face in enumerate(detected):
            face.face_index = idx

        return detected

    @property
    def is_loaded(self) -> bool:
        """``True`` if the ONNX models have been initialised."""
        return self._app is not None
