"""
Facial-embedding extraction module.

Extracts 512-dimensional numerical vectors from detected faces.
Two embeddings from the *same person* will have a high cosine
similarity (close to 1.0), while embeddings from *different
people* will differ (closer to 0.0 or below).

Implementation note
-------------------
InsightFace computes the embedding during the detection step
(``FaceAnalysis.get``).  This module does **not** re-run the
model; instead it accesses the pre-computed embedding through
``DetectedFace._internal_face`` and L2-normalises it.

Keeping extraction as a separate module means:
  • The conceptual pipeline stages (detect → embed → compare)
    are explicit in the code.
  • A future replacement model can be swapped in here without
    changing the detector or matcher.
"""

import numpy as np

from .result_schema import DetectedFace


class EmbeddingExtractionError(Exception):
    """Raised when an embedding cannot be retrieved."""


class EmbeddingExtractor:
    """
    Retrieve and normalise facial embeddings from detected faces.

    Example
    -------
    >>> extractor = EmbeddingExtractor()
    >>> embedding = extractor.extract_embedding(detected_face)
    >>> print(embedding.shape)   # (512,)
    """

    def extract_embedding(self, detected_face: DetectedFace) -> np.ndarray:
        """
        Extract the 512-D embedding vector from a detected face.

        Parameters
        ----------
        detected_face : DetectedFace
            Must have been produced by ``FaceDetector.detect_faces()``.

        Returns
        -------
        np.ndarray
            A 512-dimensional, L2-normalised float32 vector.

        Raises
        ------
        EmbeddingExtractionError
            If the face object is ``None``, lacks internal data,
            or has no embedding attribute.
        """
        if detected_face is None:
            raise EmbeddingExtractionError(
                "Cannot extract embedding from None."
            )

        internal = detected_face._internal_face
        if internal is None:
            raise EmbeddingExtractionError(
                "DetectedFace has no internal face data. "
                "Ensure it was produced by FaceDetector.detect_faces()."
            )

        embedding = getattr(internal, "embedding", None)
        if embedding is None:
            raise EmbeddingExtractionError(
                "No embedding available for this face. "
                "The recognition model may not have been loaded."
            )

        embedding = np.array(embedding, dtype=np.float32)
        embedding = self._l2_normalize(embedding)
        return embedding

    # ── Utilities ─────────────────────────────────────────────────────

    @staticmethod
    def _l2_normalize(vector: np.ndarray) -> np.ndarray:
        """
        L2-normalise a vector to unit length.

        After normalisation, ``cosine_similarity(a, b) == np.dot(a, b)``.
        """
        norm = np.linalg.norm(vector)
        if norm == 0:
            return vector          # zero vector — cannot normalise
        return vector / norm

    @staticmethod
    def embeddings_are_compatible(
        embedding_a: np.ndarray,
        embedding_b: np.ndarray,
    ) -> bool:
        """Check that two embeddings are non-``None`` and same shape."""
        return (
            embedding_a is not None
            and embedding_b is not None
            and embedding_a.shape == embedding_b.shape
            and len(embedding_a.shape) == 1
        )
