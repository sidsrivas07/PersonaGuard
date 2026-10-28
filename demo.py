"""
PersonaGuard — Face-Matching Demonstration Script
==================================================

Usage examples::

    # Compare reference against individual files
    python demo.py -r ref.jpg -c img1.jpg img2.jpg img3.jpg

    # Compare reference against all images in a directory
    python demo.py -r ref.jpg -c ./tests/test_images/candidates/

    # Use a stricter threshold
    python demo.py -r ref.jpg -c ./tests/test_images/candidates/ -t 0.55

    # Output machine-readable JSON
    python demo.py -r ref.jpg -c ./tests/test_images/candidates/ --json

    # Verbose logging (shows model loading, timing)
    python demo.py -r ref.jpg -c ./tests/test_images/candidates/ -v
"""

import argparse
import glob
import json
import os
import sys
import time

from face_matching import FaceMatchPipeline, FaceMatchConfig


# ── Candidate collection ─────────────────────────────────────────────

def collect_candidate_paths(
    candidates_arg: list,
    config: FaceMatchConfig,
) -> list:
    """
    Resolve the ``--candidates`` arguments into a flat, deduplicated
    list of image file paths.

    Each argument can be a file path or a directory.  Directories are
    expanded to include every file whose extension is in
    ``config.supported_formats``.
    """
    paths: list = []

    for item in candidates_arg:
        if os.path.isdir(item):
            for ext in config.supported_formats:
                paths.extend(glob.glob(os.path.join(item, f"*{ext}")))
                paths.extend(
                    glob.glob(os.path.join(item, f"*{ext.upper()}"))
                )
        elif os.path.isfile(item):
            paths.append(item)
        else:
            print(f"  [WARNING] Skipping '{item}' — not a file or directory.")

    # Deduplicate while preserving order
    seen: set = set()
    unique: list = []
    for p in paths:
        norm = os.path.normpath(p)
        if norm not in seen:
            seen.add(norm)
            unique.append(p)

    return sorted(unique)


# ── Human-readable output ────────────────────────────────────────────

def print_results(pipeline_result, matcher) -> None:
    """Pretty-print the pipeline results to the console."""

    print("\n" + "=" * 70)
    print("  PERSONAGUARD — Face-Matching Results")
    print("=" * 70)

    pr = pipeline_result
    cs = pr.config_summary

    print(f"\n  Reference image : {pr.reference_image_path}")
    print(f"  Faces in ref    : {pr.reference_faces_detected}")
    print(f"  Face used       : index {pr.reference_face_used}")
    print(f"  Threshold       : {cs['similarity_threshold']}")
    print(f"  Model           : {cs['model_version']}")
    print(f"  Candidates      : {len(pr.matches)}")

    print("\n" + "-" * 70)

    positive_count = 0

    for i, match in enumerate(pr.matches):
        filename = os.path.basename(match.candidate_image_path)
        icon = {"success": "+", "no_faces": "o", "error": "x"}.get(
            match.processing_status, "?"
        )

        print(f"\n  [{icon}] Candidate {i + 1}: {filename}")

        if match.processing_status == "error":
            print(f"      Status : ERROR — {match.error_info}")
            continue

        if match.processing_status == "no_faces":
            print("      Status : No faces detected in this image.")
            continue

        # ── success ───────────────────────────────────────────────────
        sim = match.similarity_score
        desc = matcher.describe_similarity(sim)
        label = "POSSIBLE MATCH" if match.is_match else "No match"

        print(f"      Faces detected : {match.num_faces_detected}")
        print(f"      Best similarity: {sim:.4f}")
        print(f"      Assessment     : {desc}")
        print(f"      Result         : {label}")

        if match.face_bbox:
            bbox = [round(v, 1) for v in match.face_bbox]
            print(f"      Face region    : {bbox}")

        if match.is_match:
            positive_count += 1

    # ── Summary ───────────────────────────────────────────────────────
    print("\n" + "-" * 70)
    print(
        f"\n  Summary: {positive_count} possible match(es) "
        f"out of {len(pr.matches)} candidate(s)."
    )

    errors = pr.get_errors()
    if errors:
        print(f"  Errors : {len(errors)} candidate(s) could not be processed.")

    print(
        "\n  NOTE: Similarity scores indicate visual resemblance only.\n"
        "    A 'possible match' is NOT proof of identity.\n"
        "    Results must be reviewed by a human before any action is taken."
    )
    print("=" * 70 + "\n")


# ── Entry point ──────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="PersonaGuard Face-Matching Demo",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--reference", "-r",
        required=True,
        help="Path to the reference photograph.",
    )
    parser.add_argument(
        "--candidates", "-c",
        nargs="+",
        required=True,
        help=(
            "One or more candidate image files, or a directory "
            "containing images."
        ),
    )
    parser.add_argument(
        "--threshold", "-t",
        type=float,
        default=None,
        help="Similarity threshold (overrides the config default of 0.45).",
    )
    parser.add_argument(
        "--face-index", "-f",
        type=int,
        default=0,
        help=(
            "Index of the face to use in the reference image "
            "(default: 0 = highest confidence)."
        ),
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output results as JSON instead of human-readable text.",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging.",
    )

    args = parser.parse_args()

    # ── Logging ───────────────────────────────────────────────────────
    if args.verbose:
        import logging
        logging.basicConfig(
            level=logging.INFO,
            format="  [%(name)s] %(message)s",
        )

    # ── Config ────────────────────────────────────────────────────────
    config = FaceMatchConfig()
    if args.threshold is not None:
        config.similarity_threshold = args.threshold

    # ── Collect candidates ────────────────────────────────────────────
    candidate_paths = collect_candidate_paths(args.candidates, config)

    if not candidate_paths:
        print("\n  [ERROR] No valid candidate images found.")
        print(
            "  Provide image file paths or a directory containing "
            "supported images."
        )
        sys.exit(1)

    print(f"\n  Reference : {args.reference}")
    print(f"  Candidates: {len(candidate_paths)} image(s)")
    print(f"  Threshold : {config.similarity_threshold}")
    print(
        "\n  Loading face detection model "
        "(first run downloads ~300 MB)..."
    )

    # ── Run ───────────────────────────────────────────────────────────
    start = time.time()
    pipeline = FaceMatchPipeline(config)

    try:
        results = pipeline.match_against_candidates(
            reference_path=args.reference,
            candidate_paths=candidate_paths,
            face_index=args.face_index,
        )
    except Exception as exc:
        print(f"\n  [ERROR] Pipeline failed: {exc}")
        sys.exit(1)

    elapsed = time.time() - start

    # ── Output ────────────────────────────────────────────────────────
    if args.json:
        output = results.to_dict()
        output["processing_time_seconds"] = round(elapsed, 2)
        print(json.dumps(output, indent=2))
    else:
        print_results(results, pipeline.matcher)
        print(f"  Processing time: {elapsed:.2f}s\n")


if __name__ == "__main__":
    main()
