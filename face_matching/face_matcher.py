"""
Face comparison module.

Compares facial embeddings using **cosine similarity** and applies
a configurable threshold to decide whether two faces are a
*possible match*.

This module contains NO model loading, image I/O, or filesystem
access.  It operates purely on numerical vectors, which makes it
trivial to unit-test independently.

Key concepts
------------
Cosine similarity
    Measures the angle between two vectors.
    For L2-normalised vectors (which our extractor guarantees)
    it equals the dot product.
    Range: −1.0 (opposite)  →  0.0 (unrelated)  →  1.0 (identical).

Threshold
    The minimum similarity needed to call a pair a "possible match".
    This is **not** a probability.  A threshold of 0.45 does *not*
    mean "45 % confident".
"""

from typing import Optional

import numpy as np

from .config import FaceMatchConfig


class FaceMatcher:
    """
    Compare facial embeddings and decide whether they match.

    Example
    -------
    >>> matcher = FaceMatcher()
    >>> sim = matcher.compute_similarity(emb_a, emb_b)
    >>> print(matcher.is_match(sim))   # True or False
    """

    def __init__(self, config: Optional[FaceMatchConfig] = None):
        self.config = config or FaceMatchConfig()

    def compute_similarity(
        self,
        embedding_a: np.ndarray,
        embedding_b: np.ndarray,
    ) -> float:
        """
        Cosine similarity between two facial embeddings.

        For L2-normalised vectors this is simply the dot product.

        Parameters
        ----------
        embedding_a, embedding_b : np.ndarray
            512-D float32 vectors.

        Returns
        -------
        float
            Similarity in [−1.0, 1.0].  Higher ⇒ more similar.

        Raises
        ------
        ValueError
            If the embedding shapes do not match.
        """
        if embedding_a.shape != embedding_b.shape:
            raise ValueError(
                f"Embedding shapes do not match: "
                f"{embedding_a.shape} vs {embedding_b.shape}"
            )

        similarity = float(np.dot(embedding_a, embedding_b))

        # Clamp to valid range (guards against float-point drift)
        return max(-1.0, min(1.0, similarity))

    def is_match(
        self,
        similarity: float,
        threshold: Optional[float] = None,
    ) -> bool:
        """
        Does the similarity score meet the matching threshold?

        Parameters
        ----------
        similarity : float
            Cosine similarity value.
        threshold : float, optional
            Override the default from ``config``.

        Returns
        -------
        bool
            ``True`` ⇒ *possible* match (warrants human review).
            ``False`` ⇒ unlikely to be the same person.
        """
        if threshold is None:
            threshold = self.config.similarity_threshold
        return similarity >= threshold

    def describe_similarity(self, similarity: float) -> str:
        """
        Human-readable label for a similarity score.

        Useful in demos, reports, and CLI output.
        """
        if similarity >= 0.60:
            return "Strong possible match"
        elif similarity >= 0.45:
            return "Moderate possible match"
        elif similarity >= 0.30:
            return "Weak similarity — likely different people"
        else:
            return "No meaningful similarity"
