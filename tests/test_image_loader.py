"""
Tests for the image_loader module.

These tests run WITHOUT the InsightFace model — they only exercise
file-validation logic, so they complete in milliseconds.
"""

import cv2
import numpy as np
import pytest

from face_matching.image_loader import load_image, validate_image_path, ImageLoadError
from face_matching.config import FaceMatchConfig


# ── Helpers ──────────────────────────────────────────────────────────

def _write_valid_image(path, width=100, height=100):
    """Create a minimal valid JPEG at *path*."""
    img = np.zeros((height, width, 3), dtype=np.uint8)
    cv2.imwrite(str(path), img)


# ── load_image tests ─────────────────────────────────────────────────

class TestLoadImage:

    def test_missing_file_raises_error(self):
        with pytest.raises(ImageLoadError, match="File not found"):
            load_image("nonexistent_file_12345.jpg")

    def test_empty_string_raises_error(self):
        with pytest.raises(ImageLoadError, match="non-empty string"):
            load_image("")

    def test_none_raises_error(self):
        with pytest.raises(ImageLoadError):
            load_image(None)

    def test_unsupported_extension_raises_error(self, tmp_path):
        bad = tmp_path / "data.xyz"
        bad.write_text("not an image")
        with pytest.raises(ImageLoadError, match="Unsupported"):
            load_image(str(bad))

    def test_empty_file_raises_error(self, tmp_path):
        empty = tmp_path / "empty.jpg"
        empty.write_bytes(b"")
        with pytest.raises(ImageLoadError, match="empty"):
            load_image(str(empty))

    def test_corrupted_file_raises_error(self, tmp_path):
        corrupt = tmp_path / "corrupt.jpg"
        corrupt.write_bytes(b"this-is-not-a-jpeg")
        with pytest.raises(ImageLoadError, match="Could not decode"):
            load_image(str(corrupt))

    def test_valid_image_loads(self, tmp_path):
        img_path = tmp_path / "valid.jpg"
        _write_valid_image(img_path)

        result = load_image(str(img_path))
        assert isinstance(result, np.ndarray)
        assert result.shape[:2] == (100, 100)

    def test_png_format_loads(self, tmp_path):
        img_path = tmp_path / "valid.png"
        _write_valid_image(img_path)

        result = load_image(str(img_path))
        assert result is not None

    def test_oversized_image_raises_error(self, tmp_path):
        config = FaceMatchConfig(max_image_dimension=50)
        img_path = tmp_path / "big.jpg"
        _write_valid_image(img_path, width=100, height=100)

        with pytest.raises(ImageLoadError, match="exceed"):
            load_image(str(img_path), config)

    def test_image_within_dimension_limit(self, tmp_path):
        config = FaceMatchConfig(max_image_dimension=200)
        img_path = tmp_path / "ok.jpg"
        _write_valid_image(img_path, width=150, height=150)

        result = load_image(str(img_path), config)
        assert result.shape[:2] == (150, 150)


# ── validate_image_path tests ────────────────────────────────────────

class TestValidateImagePath:

    def test_valid_path_returns_true(self, tmp_path):
        img_path = tmp_path / "test.png"
        _write_valid_image(img_path)
        assert validate_image_path(str(img_path)) is True

    def test_missing_file_returns_false(self):
        assert validate_image_path("does_not_exist.jpg") is False

    def test_empty_string_returns_false(self):
        assert validate_image_path("") is False

    def test_none_returns_false(self):
        assert validate_image_path(None) is False

    def test_bad_extension_returns_false(self, tmp_path):
        f = tmp_path / "data.xyz"
        f.write_text("data")
        assert validate_image_path(str(f)) is False

    def test_empty_file_returns_false(self, tmp_path):
        f = tmp_path / "empty.jpg"
        f.write_bytes(b"")
        assert validate_image_path(str(f)) is False
