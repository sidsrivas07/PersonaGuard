"""
Central configuration for the face-matching pipeline.

Every tuneable parameter lives here so that thresholds, model choices,
and validation rules can be adjusted in one place without touching
business logic.

Typical usage:
    config = FaceMatchConfig()                          # all defaults
    config = FaceMatchConfig(similarity_threshold=0.55) # stricter matching
"""

from dataclasses import dataclass, field
from typing import Tuple, List


@dataclass
class FaceMatchConfig:
    """
    All configurable parameters for the face-matching module.

    Attributes
    ----------
    model_name : str
        InsightFace model pack.  ``"buffalo_l"`` bundles a RetinaFace
        detector and an ArcFace (w600k_r50) recognition model.
    det_size : tuple[int, int]
        Input resolution for the detection model.
        Larger → more accurate on small faces, but slower.
    providers : list[str]
        ONNX Runtime execution providers in priority order.
        Add ``"CUDAExecutionProvider"`` *before* ``"CPUExecutionProvider"``
        to use a compatible NVIDIA GPU.
    similarity_threshold : float
        Cosine-similarity cutoff for declaring a *possible* match.
        Typical operating points for ArcFace:
            0.30  –  permissive  (catches more, more false positives)
            0.45  –  balanced
            0.60  –  strict      (fewer matches, fewer false positives)
    supported_formats : tuple[str, ...]
        Allowed image file extensions (lower-case, with leading dot).
    max_image_dimension : int
        Maximum width or height in pixels.  Images exceeding this are
        rejected to avoid excessive memory usage.
    min_detection_confidence : float
        Floor for face-detection confidence.  Detections below this
        value are discarded.
    model_version_tag : str
        Human-readable string recorded in every result for
        reproducibility and auditing.
    """

    # --- Model -----------------------------------------------------------
    model_name: str = "buffalo_l"
    det_size: Tuple[int, int] = (640, 640)
    providers: List[str] = field(
        default_factory=lambda: ["CPUExecutionProvider"]
    )

    # --- Matching --------------------------------------------------------
    similarity_threshold: float = 0.45

    # --- Image validation ------------------------------------------------
    supported_formats: Tuple[str, ...] = (
        ".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff", ".tif",
    )
    max_image_dimension: int = 4096  # pixels

    # --- Detection -------------------------------------------------------
    min_detection_confidence: float = 0.5

    # --- Metadata --------------------------------------------------------
    model_version_tag: str = "insightface-buffalo_l-v1"
