"""
Integration tests for the end-to-end pipeline.

These tests need:
  1. ``insightface`` installed with models downloaded.
  2. At least one image in ``tests/test_images/reference/``.
  3. At least one image in ``tests/test_images/candidates/``.

All tests are skipped automatically when prerequisites are missing.
"""

import json
import os

import pytest

insightface = pytest.importorskip("insightface", reason="insightface not installed")

from face_matching.pipeline import FaceMatchPipeline
from face_matching.config import FaceMatchConfig
from face_matching.image_loader import ImageLoadError

# ── Paths ────────────────────────────────────────────────────────────

TEST_IMAGES_DIR = os.path.join(os.path.dirname(__file__), "test_images")
REFERENCE_DIR = os.path.join(TEST_IMAGES_DIR, "reference")
CANDIDATES_DIR = os.path.join(TEST_IMAGES_DIR, "candidates")


def _image_files(directory):
    """List non-hidden files in a directory."""
    if not os.path.isdir(directory):
        return []
    return sorted(
        os.path.join(directory, f)
        for f in os.listdir(directory)
        if not f.startswith(".")
        and os.path.isfile(os.path.join(directory, f))
    )


def _has_both_sets():
    return bool(_image_files(REFERENCE_DIR)) and bool(_image_files(CANDIDATES_DIR))


requires_images = pytest.mark.skipif(
    not _has_both_sets(),
    reason="Need images in both tests/test_images/reference/ and candidates/",
)


# ── Tests ────────────────────────────────────────────────────────────

class TestPipelineIntegration:

    @requires_images
    def test_full_pipeline_produces_results(self):
        pipeline = FaceMatchPipeline()
        ref = _image_files(REFERENCE_DIR)[0]
        cands = _image_files(CANDIDATES_DIR)

        results = pipeline.match_against_candidates(ref, cands)

        assert results.reference_image_path == ref
        assert len(results.matches) == len(cands)

        for m in results.matches:
            assert m.processing_status in ("success", "no_faces", "error")
            assert isinstance(m.model_version, str)

    @requires_images
    def test_results_are_json_serializable(self):
        pipeline = FaceMatchPipeline()
        ref = _image_files(REFERENCE_DIR)[0]
        cands = _image_files(CANDIDATES_DIR)

        results = pipeline.match_against_candidates(ref, cands)
        json_str = json.dumps(results.to_dict(), indent=2)
        assert len(json_str) > 0

        # Round-trip check
        parsed = json.loads(json_str)
        assert parsed["reference_image_path"] == ref
        assert len(parsed["matches"]) == len(cands)

    @requires_images
    def test_positive_matches_subset_of_all(self):
        pipeline = FaceMatchPipeline()
        ref = _image_files(REFERENCE_DIR)[0]
        cands = _image_files(CANDIDATES_DIR)

        results = pipeline.match_against_candidates(ref, cands)
        positives = results.get_positive_matches()

        assert len(positives) <= len(results.matches)
        for m in positives:
            assert m.is_match is True
            assert m.similarity_score >= pipeline.config.similarity_threshold


class TestPipelineErrorHandling:

    def test_invalid_reference_raises_error(self):
        pipeline = FaceMatchPipeline()
        with pytest.raises((ImageLoadError, ValueError)):
            pipeline.match_against_candidates(
                reference_path="nonexistent_image.jpg",
                candidate_paths=["also_nonexistent.jpg"],
            )

    @requires_images
    def test_invalid_candidate_returns_error_result(self):
        """Invalid candidates should produce error results, not crash."""
        pipeline = FaceMatchPipeline()
        ref = _image_files(REFERENCE_DIR)[0]

        results = pipeline.match_against_candidates(
            reference_path=ref,
            candidate_paths=["this_file_does_not_exist.jpg"],
        )

        assert len(results.matches) == 1
        assert results.matches[0].processing_status == "error"
        assert results.matches[0].is_match is False

    @requires_images
    def test_empty_candidate_list(self):
        pipeline = FaceMatchPipeline()
        ref = _image_files(REFERENCE_DIR)[0]

        results = pipeline.match_against_candidates(
            reference_path=ref,
            candidate_paths=[],
        )

        assert len(results.matches) == 0
