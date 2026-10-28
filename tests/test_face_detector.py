"""
Tests for the face_detector module.

These tests require the ``insightface`` package AND the model to be
downloaded.  They are skipped automatically when either is missing.

For tests that depend on user-supplied images, a skip marker checks
``tests/test_images/reference/`` for image files.
"""

import os

import numpy as np
import pytest

# Skip the entire module if insightface is not installed
insightface = pytest.importorskip("insightface", reason="insightface not installed")

from face_matching.face_detector import FaceDetector
from face_matching.config import FaceMatchConfig

# ── Paths ────────────────────────────────────────────────────────────

TEST_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "test_images")
REFERENCE_DIR = os.path.join(TEST_IMAGES_DIR, "reference")


def _has_reference_images() -> bool:
    if not os.path.isdir(REFERENCE_DIR):
        return False
    return any(
        not f.startswith(".")
        for f in os.listdir(REFERENCE_DIR)
        if os.path.isfile(os.path.join(REFERENCE_DIR, f))
    )


requires_images = pytest.mark.skipif(
    not _has_reference_images(),
    reason="No images in tests/test_images/reference/",
)


# ── Tests ────────────────────────────────────────────────────────────

class TestFaceDetector:

    def test_blank_image_yields_no_faces(self):
        """A solid-black image should produce zero detections."""
        detector = FaceDetector()
        blank = np.zeros((200, 200, 3), dtype=np.uint8)
        faces = detector.detect_faces(blank)
        assert len(faces) == 0

    def test_model_is_lazy_loaded(self):
        """The model should NOT load until detect_faces is called."""
        detector = FaceDetector()
        assert detector.is_loaded is False

    @requires_images
    def test_detect_faces_in_reference_images(self):
        """Reference images should each contain at least one face."""
        import cv2

        detector = FaceDetector()
        ref_files = [
            os.path.join(REFERENCE_DIR, f)
            for f in os.listdir(REFERENCE_DIR)
            if not f.startswith(".") and os.path.isfile(os.path.join(REFERENCE_DIR, f))
        ]

        for path in ref_files:
            image = cv2.imread(path)
            if image is None:
                continue  # not a valid image

            faces = detector.detect_faces(image)
            assert len(faces) > 0, f"No face detected in {path}"

            for face in faces:
                assert len(face.bbox) == 4
                assert 0.0 <= face.detection_confidence <= 1.0
                assert face.face_index >= 0

    @requires_images
    def test_faces_sorted_by_confidence(self):
        """Returned faces must be sorted highest-confidence first."""
        import cv2

        detector = FaceDetector()
        ref_files = [
            os.path.join(REFERENCE_DIR, f)
            for f in os.listdir(REFERENCE_DIR)
            if not f.startswith(".") and os.path.isfile(os.path.join(REFERENCE_DIR, f))
        ]

        for path in ref_files:
            image = cv2.imread(path)
            if image is None:
                continue
            faces = detector.detect_faces(image)
            for i in range(1, len(faces)):
                assert faces[i - 1].detection_confidence >= faces[i].detection_confidence
