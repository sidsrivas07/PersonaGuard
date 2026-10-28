"""
PersonaGuard Face-Matching Module
=================================

A modular computer-vision component for detecting faces in images
and determining whether they match a reference photograph.

Designed for **privacy-conscious, consent-based** digital-footprint
auditing.  Does **not** identify arbitrary people, perform covert
surveillance, or treat similarity as proof of identity.

Quick start
-----------
::

    from face_matching import FaceMatchPipeline, FaceMatchConfig

    config = FaceMatchConfig(similarity_threshold=0.50)
    pipeline = FaceMatchPipeline(config)

    results = pipeline.match_against_candidates(
        reference_path="reference.jpg",
        candidate_paths=["candidate1.jpg", "candidate2.jpg"],
    )

    for match in results.get_positive_matches():
        print(
            f"Possible match: {match.candidate_image_path} "
            f"(similarity: {match.similarity_score:.3f})"
        )
"""

from .config import FaceMatchConfig
from .result_schema import DetectedFace, MatchResult, PipelineResult
from .image_loader import load_image, validate_image_path, ImageLoadError
from .face_detector import FaceDetector, FaceDetectionError
from .embedding_extractor import EmbeddingExtractor, EmbeddingExtractionError
from .face_matcher import FaceMatcher
from .pipeline import FaceMatchPipeline

__all__ = [
    # Primary entry points
    "FaceMatchPipeline",
    "FaceMatchConfig",
    # Result types
    "DetectedFace",
    "MatchResult",
    "PipelineResult",
    # Lower-level components
    "FaceDetector",
    "EmbeddingExtractor",
    "FaceMatcher",
    # Utilities
    "load_image",
    "validate_image_path",
    # Exceptions
    "ImageLoadError",
    "FaceDetectionError",
    "EmbeddingExtractionError",
]

__version__ = "0.1.0"
