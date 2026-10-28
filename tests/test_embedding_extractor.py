"""
Tests for the embedding_extractor module.

Uses mock DetectedFace objects with synthetic embedding data.
No model loading or real images required.
"""

import numpy as np
import pytest

from face_matching.embedding_extractor import (
    EmbeddingExtractor,
    EmbeddingExtractionError,
)
from face_matching.result_schema import DetectedFace


class _MockInternalFace:
    """Simulates an InsightFace ``Face`` object for testing."""

    def __init__(self, embedding):
        self.embedding = embedding


def _make_detected(embedding, bbox=None):
    """Build a DetectedFace with a mocked internal face."""
    return DetectedFace(
        bbox=bbox or [0.0, 0.0, 100.0, 100.0],
        detection_confidence=0.99,
        face_index=0,
        _internal_face=_MockInternalFace(embedding),
    )


class TestExtractEmbedding:

    def setup_method(self):
        self.extractor = EmbeddingExtractor()

    def test_valid_embedding_returns_512d(self):
        raw = np.random.randn(512).astype(np.float32)
        face = _make_detected(raw)
        result = self.extractor.extract_embedding(face)
        assert result.shape == (512,)

    def test_output_is_l2_normalised(self):
        raw = np.random.randn(512).astype(np.float32) * 5.0
        face = _make_detected(raw)
        result = self.extractor.extract_embedding(face)
        assert abs(np.linalg.norm(result) - 1.0) < 1e-5

    def test_already_normalised_stays_normalised(self):
        raw = np.random.randn(512).astype(np.float32)
        raw /= np.linalg.norm(raw)
        face = _make_detected(raw)
        result = self.extractor.extract_embedding(face)
        assert abs(np.linalg.norm(result) - 1.0) < 1e-5

    def test_none_face_raises_error(self):
        with pytest.raises(EmbeddingExtractionError):
            self.extractor.extract_embedding(None)

    def test_no_internal_face_raises_error(self):
        face = DetectedFace(
            bbox=[0, 0, 100, 100],
            detection_confidence=0.99,
            face_index=0,
            _internal_face=None,
        )
        with pytest.raises(EmbeddingExtractionError, match="no internal"):
            self.extractor.extract_embedding(face)

    def test_none_embedding_raises_error(self):
        face = _make_detected(embedding=None)
        with pytest.raises(EmbeddingExtractionError, match="No embedding"):
            self.extractor.extract_embedding(face)

    def test_output_dtype_is_float32(self):
        raw = np.random.randn(512).astype(np.float64)
        face = _make_detected(raw)
        result = self.extractor.extract_embedding(face)
        assert result.dtype == np.float32


class TestEmbeddingsAreCompatible:

    def setup_method(self):
        self.extractor = EmbeddingExtractor()

    def test_same_shape_compatible(self):
        a = np.random.randn(512).astype(np.float32)
        b = np.random.randn(512).astype(np.float32)
        assert self.extractor.embeddings_are_compatible(a, b) is True

    def test_different_shapes_incompatible(self):
        a = np.random.randn(512).astype(np.float32)
        b = np.random.randn(256).astype(np.float32)
        assert self.extractor.embeddings_are_compatible(a, b) is False

    def test_none_is_incompatible(self):
        a = np.random.randn(512).astype(np.float32)
        assert self.extractor.embeddings_are_compatible(a, None) is False
        assert self.extractor.embeddings_are_compatible(None, a) is False

    def test_2d_arrays_incompatible(self):
        a = np.random.randn(1, 512).astype(np.float32)
        b = np.random.randn(1, 512).astype(np.float32)
        assert self.extractor.embeddings_are_compatible(a, b) is False
