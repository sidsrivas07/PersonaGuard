"""
Image loading and validation utilities.

Handles all filesystem interaction for reading images.  Validates
file existence, format, readability, and dimensions *before*
returning the image as a NumPy array suitable for face processing.

All errors surface as ``ImageLoadError`` so that calling code
can distinguish "bad input" from "model failure".
"""

import os

import cv2
import numpy as np
from typing import Optional

from .config import FaceMatchConfig


class ImageLoadError(Exception):
    """Raised when an image cannot be loaded or fails validation."""


def load_image(
    image_path: str,
    config: Optional[FaceMatchConfig] = None,
) -> np.ndarray:
    """
    Load an image from disk and validate it for face processing.

    Parameters
    ----------
    image_path : str
        Absolute or relative path to the image file.
    config : FaceMatchConfig, optional
        Validation rules (supported formats, max dimensions).
        Uses defaults when omitted.

    Returns
    -------
    np.ndarray
        The image in BGR colour order (OpenCV convention).

    Raises
    ------
    ImageLoadError
        If the file is missing, empty, unsupported, unreadable,
        or exceeds the dimension limit.
    """
    if config is None:
        config = FaceMatchConfig()

    # 1. Non-empty string check
    if not image_path or not isinstance(image_path, str):
        raise ImageLoadError("Image path must be a non-empty string.")

    # 2. File existence
    if not os.path.isfile(image_path):
        raise ImageLoadError(f"File not found: {image_path}")

    # 3. Extension check
    ext = os.path.splitext(image_path)[1].lower()
    if ext not in config.supported_formats:
        raise ImageLoadError(
            f"Unsupported image format '{ext}'. "
            f"Supported formats: {', '.join(config.supported_formats)}"
        )

    # 4. Non-zero size
    if os.path.getsize(image_path) == 0:
        raise ImageLoadError(f"File is empty (0 bytes): {image_path}")

    # 5. Decode with OpenCV
    try:
        image = cv2.imread(image_path)
    except Exception as e:
        raise ImageLoadError(
            f"OpenCV failed to read the image: {image_path}. Error: {e}"
        ) from e

    if image is None:
        raise ImageLoadError(
            f"Could not decode image (file may be corrupted or "
            f"not a valid image): {image_path}"
        )

    # 6. Dimension check
    height, width = image.shape[:2]
    if height == 0 or width == 0:
        raise ImageLoadError(
            f"Image has invalid dimensions ({width}×{height}): {image_path}"
        )

    if max(height, width) > config.max_image_dimension:
        raise ImageLoadError(
            f"Image dimensions ({width}×{height}) exceed the maximum "
            f"allowed ({config.max_image_dimension}px). "
            f"Resize or use a smaller image."
        )

    return image


def validate_image_path(
    image_path: str,
    config: Optional[FaceMatchConfig] = None,
) -> bool:
    """
    Quick pre-flight check without loading the full image.

    Returns ``True`` when the path *looks* valid (exists, non-empty,
    supported extension).  Does **not** guarantee that the file is a
    decodable image.
    """
    if config is None:
        config = FaceMatchConfig()

    if not image_path or not isinstance(image_path, str):
        return False
    if not os.path.isfile(image_path):
        return False

    ext = os.path.splitext(image_path)[1].lower()
    if ext not in config.supported_formats:
        return False
    if os.path.getsize(image_path) == 0:
        return False

    return True
