"""
Tests for the face_matcher module.

These tests use SYNTHETIC embeddings — no model loading, no images,
no filesystem access.  They validate the mathematical correctness
of cosine similarity and the threshold decision logic.
"""

import numpy as np
import pytest

from face_matching.face_matcher import FaceMatcher
from face_matching.config import FaceMatchConfig


def _random_normed(dim=512):
    """Return a random L2-normalised vector."""
    v = np.random.randn(dim).astype(np.float32)
    return v / np.linalg.norm(v)


class TestComputeSimilarity:

    def setup_method(self):
        self.matcher = FaceMatcher(FaceMatchConfig(similarity_threshold=0.45))

    def test_identical_vectors_return_one(self):
        emb = _random_normed()
        assert abs(self.matcher.compute_similarity(emb, emb) - 1.0) < 1e-5

    def test_opposite_vectors_return_minus_one(self):
        emb = _random_normed()
        assert abs(self.matcher.compute_similarity(emb, -emb) - (-1.0)) < 1e-5

    def test_orthogonal_vectors_return_zero(self):
        a = np.zeros(512, dtype=np.float32); a[0] = 1.0
        b = np.zeros(512, dtype=np.float32); b[1] = 1.0
        assert abs(self.matcher.compute_similarity(a, b)) < 1e-5

    def test_result_is_python_float(self):
        emb = _random_normed()
        sim = self.matcher.compute_similarity(emb, emb)
        assert isinstance(sim, float)

    def test_mismatched_shapes_raise_error(self):
        a = np.random.randn(512).astype(np.float32)
        b = np.random.randn(256).astype(np.float32)
        with pytest.raises(ValueError, match="shapes do not match"):
            self.matcher.compute_similarity(a, b)


class TestIsMatch:

    def setup_method(self):
        self.matcher = FaceMatcher(FaceMatchConfig(similarity_threshold=0.45))

    def test_above_threshold(self):
        assert self.matcher.is_match(0.50) is True

    def test_exactly_at_threshold(self):
        assert self.matcher.is_match(0.45) is True

    def test_below_threshold(self):
        assert self.matcher.is_match(0.44) is False

    def test_custom_threshold_higher(self):
        assert self.matcher.is_match(0.50, threshold=0.55) is False

    def test_custom_threshold_lower(self):
        assert self.matcher.is_match(0.30, threshold=0.25) is True


class TestDescribeSimilarity:

    def setup_method(self):
        self.matcher = FaceMatcher()

    def test_strong(self):
        assert "Strong" in self.matcher.describe_similarity(0.65)

    def test_moderate(self):
        assert "Moderate" in self.matcher.describe_similarity(0.50)

    def test_weak(self):
        desc = self.matcher.describe_similarity(0.35)
        assert "Weak" in desc or "different" in desc.lower()

    def test_none(self):
        desc = self.matcher.describe_similarity(0.10)
        assert "No" in desc
