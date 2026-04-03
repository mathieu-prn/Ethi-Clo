"""
Clothes Label OCR — Tesseract-based fabric composition reader.

This script processes images of clothing labels and extracts:
  - Fabric/material composition (e.g. "60% Cotton, 40% Polyester")
  - Care instructions (wash, dry, iron symbols described as text)
  - Country of origin / Made-in information
  - Brand name (if visible)
  - Size information

Usage:
    python label_ocr.py <image_path>              # Single image
    python label_ocr.py <folder_path>              # All images in a folder
    python label_ocr.py <image_path> --json        # Output as JSON
    python label_ocr.py <image_path> --debug       # Save preprocessed images for inspection

Requirements:
    - Tesseract OCR installed and on PATH
      Windows: https://github.com/UB-Mannheim/tesseract/wiki
      Linux:   sudo apt install tesseract-ocr
    - pip install -r requirements.txt
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import pytesseract
from PIL import Image


# ---------------------------------------------------------------------------
#  Tesseract availability check
# ---------------------------------------------------------------------------
def _check_tesseract() -> str:
    """Verify Tesseract is installed and return its path."""
    # Common Windows install locations
    common_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Tesseract-OCR\tesseract.exe"),
    ]

    # Check if already on PATH
    tess_path = shutil.which("tesseract")
    if tess_path:
        return tess_path

    # Try common install locations
    for p in common_paths:
        if os.path.isfile(p):
            pytesseract.pytesseract.tesseract_cmd = p
            return p

    print(
        "\n❌ ERROR: Tesseract OCR is not installed or not on PATH.\n"
        "\n"
        "  Install it from: https://github.com/UB-Mannheim/tesseract/wiki\n"
        "  Then either:\n"
        "    • Add the install folder to your PATH, or\n"
        "    • Use --tesseract-cmd \"C:\\...\\tesseract.exe\"\n",
        file=sys.stderr,
    )
    sys.exit(1)


def _detect_languages(tesseract_path: str) -> str:
    """Detect available Tesseract languages and return a lang string."""
    try:
        result = subprocess.run(
            [tesseract_path, "--list-langs"],
            capture_output=True, text=True, timeout=10,
        )
        output = result.stdout + result.stderr
        available = set()
        for line in output.splitlines():
            lang = line.strip().lower()
            if lang and not lang.startswith("list") and len(lang) <= 10:
                available.add(lang)

        # Prefer eng+fra, fallback to eng only
        if "fra" in available and "eng" in available:
            return "eng+fra"
        elif "eng" in available:
            print("  ⚠ French language data not installed — using English only",
                  file=sys.stderr)
            return "eng"
        elif available:
            lang = next(iter(available))
            print(f"  ⚠ Using detected language: {lang}", file=sys.stderr)
            return lang
        else:
            return "eng"  # fallback
    except Exception:
        return "eng"


# ---------------------------------------------------------------------------
#  Known fabric / material keywords (English + French)
# ---------------------------------------------------------------------------
FABRIC_KEYWORDS: list[str] = [
    # English
    "cotton", "polyester", "nylon", "spandex", "elastane", "lycra",
    "wool", "silk", "linen", "rayon", "viscose", "acrylic", "cashmere",
    "modal", "tencel", "lyocell", "hemp", "bamboo", "jute", "leather",
    "suede", "denim", "fleece", "satin", "chiffon", "velvet", "organza",
    "tulle", "lace", "microfiber", "polypropylene", "kevlar", "polyamide",
    "polyurethane", "acetate", "cupro", "ramie", "alpaca", "angora",
    "mohair", "down", "fur", "rubber", "latex", "metallic",
    "shell", "padding", "lining",  # garment parts often on labels
    # French
    "coton", "polyester", "nylon", "élasthanne", "elasthanne", "laine",
    "soie", "lin", "rayonne", "viscose", "acrylique", "cachemire",
    "chanvre", "bambou", "cuir", "daim", "jean", "satin", "velours",
    "dentelle", "microfibre", "polyamide", "polyuréthane", "acétate",
    "ramie", "alpaga", "angora", "mohair", "duvet", "fourrure",
    "caoutchouc", "farciment", "folre", "doublure",
    # Spanish
    "algodón", "algodon", "poliéster", "poliester", "poliamida",
    "elastano", "seda", "lana",
    # German
    "polyamid", "baumwolle", "seide", "wolle", "leinen",
    "elasthan", "viskose", "obermaterial", "wattierung", "futter",
    "polsterung",
    # Italian
    "cotone", "poliestere", "poliammide", "seta",
    # Albanian / Balkan
    "poliamide", "poliestër", "poliester",
    # Czech
    "polyamid", "vrchový", "podšívka", "polstrování",
    # Catalan
    "poliamida",
]

CARE_KEYWORDS: list[str] = [
    # English
    "wash", "machine wash", "hand wash", "dry clean", "do not wash",
    "tumble dry", "hang dry", "line dry", "drip dry", "flat dry",
    "do not dry", "do not tumble", "iron", "do not iron", "steam",
    "bleach", "do not bleach", "chlorine", "non-chlorine",
    "dry clean only", "professional", "delicate", "gentle",
    "cold", "warm", "hot", "cool",
    # French
    "laver", "lavage", "lavage machine", "lavage à la main",
    "nettoyage à sec", "ne pas laver", "séchage", "sèche-linge",
    "sécher à plat", "repasser", "ne pas repasser", "blanchir",
    "ne pas blanchir", "délicat", "froid", "tiède", "chaud",
]

COUNTRY_PATTERNS: list[str] = [
    r"made\s+in\s+[\w\s]+",
    r"fabriqué\s+(?:en|au|aux)\s+[\w\s]+",
    r"hecho\s+en\s+[\w\s]+",
    r"hergestellt\s+in\s+[\w\s]+",
    r"fabbricato\s+in\s+[\w\s]+",
    r"product\s+of\s+[\w\s]+",
    r"manufactured\s+in\s+[\w\s]+",
    r"importé\s+(?:de|du|des)\s+[\w\s]+",
    r"country\s+of\s+origin[:\s]+[\w\s]+",
    r"origine[:\s]+[\w\s]+",
]

SIZE_PATTERNS: list[str] = [
    r"\b(?:size|taille|sz)[:\s]*(\w+)\b",
    r"\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b",
    r"\b(\d{2,3})\s*(?:cm|in|EU|US|UK)\b",
]


# ---------------------------------------------------------------------------
#  Data class for structured results
# ---------------------------------------------------------------------------
@dataclass
class LabelResult:
    """Structured result from a clothing label OCR scan."""
    file: str
    raw_text: str = ""
    composition: list[dict[str, str]] = field(default_factory=list)
    care_instructions: list[str] = field(default_factory=list)
    country_of_origin: Optional[str] = None
    sizes: list[str] = field(default_factory=list)
    confidence: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)


# ---------------------------------------------------------------------------
#  Image preprocessing pipeline
# ---------------------------------------------------------------------------
class ImagePreprocessor:
    """Applies a multi-stage preprocessing pipeline optimised for fabric labels."""

    def __init__(self, debug: bool = False, debug_dir: str = "debug_output"):
        self.debug = debug
        self.debug_dir = debug_dir
        if debug:
            os.makedirs(debug_dir, exist_ok=True)

    def _save_debug(self, name: str, image: np.ndarray) -> None:
        if self.debug:
            path = os.path.join(self.debug_dir, name)
            cv2.imwrite(path, image)

    def preprocess(self, image_path: str) -> list[np.ndarray]:
        """Return multiple preprocessed variants to maximise OCR accuracy."""

        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Cannot read image: {image_path}")

        self._save_debug("01_original.png", img)

        # --- Try to crop to label ROI (white rectangle) --------------------------
        cropped = self._detect_label_roi(img)
        if cropped is not None:
            img = cropped
            self._save_debug("02_roi_cropped.png", img)

        # --- Upscale small images ------------------------------------------------
        h, w = img.shape[:2]
        scale = 1
        if max(h, w) < 1200:
            scale = 2
        if max(h, w) < 600:
            scale = 3
        if scale > 1:
            img = cv2.resize(img, None, fx=scale, fy=scale,
                             interpolation=cv2.INTER_CUBIC)
            self._save_debug("03_upscaled.png", img)

        # --- Grayscale -----------------------------------------------------------
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        self._save_debug("04_gray.png", gray)

        # --- Denoise -------------------------------------------------------------
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        self._save_debug("05_denoised.png", denoised)

        # --- Normalization (CLAHE) - Essential for fabric labels -----------------
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        normalized = clahe.apply(denoised)
        self._save_debug("06_normalized_clahe.png", normalized)

        # --- Advanced Sharpening (Unsharp Mask) ----------------------------------
        # Blending the normalized image with a Gaussian blurred version to sharpen edges
        sharpened = self._unsharp_mask(normalized, sigma=1.0, strength=1.5)
        self._save_debug("07_sharpened_unsharp.png", sharpened)

        # --- Multiple thresholding strategies ------------------------------------
        variants: list[np.ndarray] = []

        # 1. Raw grayscale (sometimes Tesseract handles this best)
        variants.append(gray.copy())

        # 2. Normalized grayscale
        variants.append(normalized.copy())

        # 3. Sharpened grayscale
        variants.append(sharpened.copy())

        # 4. Otsu (on sharpened)
        _, otsu = cv2.threshold(sharpened, 0, 255,
                                cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        self._save_debug("08_otsu.png", otsu)
        variants.append(otsu)

        # 5. Adaptive (Gaussian)
        adaptive_gauss = cv2.adaptiveThreshold(
            sharpened, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 15, 8
        )
        self._save_debug("09_adaptive_gauss.png", adaptive_gauss)
        variants.append(adaptive_gauss)

        # 6. Adaptive (Mean)
        adaptive_mean = cv2.adaptiveThreshold(
            sharpened, 255, cv2.ADAPTIVE_THRESH_MEAN_C,
            cv2.THRESH_BINARY, 15, 10
        )
        self._save_debug("10_adaptive_mean.png", adaptive_mean)
        variants.append(adaptive_mean)

        # 7. Inverted (for white text on dark labels)
        _, otsu_inv = cv2.threshold(sharpened, 0, 255,
                                     cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        self._save_debug("11_otsu_inverted.png", otsu_inv)
        variants.append(otsu_inv)

        # 8. CLAHE + Threshold
        _, clahe_bin = cv2.threshold(normalized, 0, 255,
                                     cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        self._save_debug("12_clahe_binary.png", clahe_bin)
        variants.append(clahe_bin)

        # --- Optional deskew on thresholded variants -----------------------------
        for i, v in enumerate(variants):
            deskewed = self._deskew(v)
            if deskewed is not None:
                variants[i] = deskewed

        return variants

    def _detect_label_roi(self, img: np.ndarray) -> Optional[np.ndarray]:
        """Try to detect and crop to the white label area in the image."""
        try:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Bright regions are likely the white label
            _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)

            # Clean up
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

            contours, _ = cv2.findContours(
                thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            if not contours:
                return None

            # Find the biggest contour that's roughly rectangular
            img_area = img.shape[0] * img.shape[1]
            best = None
            best_area = 0
            for cnt in contours:
                area = cv2.contourArea(cnt)
                # Label should be at least 5% of image, less than 95%
                if area < img_area * 0.05 or area > img_area * 0.95:
                    continue
                # Check if roughly rectangular
                peri = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * peri, True)
                if len(approx) >= 4 and area > best_area:
                    best = cnt
                    best_area = area

            if best is None:
                return None

            x, y, w, h = cv2.boundingRect(best)
            # Add small padding
            pad = 10
            x = max(0, x - pad)
            y = max(0, y - pad)
            w = min(img.shape[1] - x, w + 2 * pad)
            h = min(img.shape[0] - y, h + 2 * pad)

            cropped = img[y:y+h, x:x+w]
            return cropped
        except Exception:
            return None

    @staticmethod
    def _unsharp_mask(image: np.ndarray, sigma: float = 1.0, strength: float = 1.5) -> np.ndarray:
        """Apply unsharp mask to highlight edges without introducing much noise."""
        blurred = cv2.GaussianBlur(image, (0, 0), sigma)
        sharpened = cv2.addWeighted(image, 1.0 + strength, blurred, -strength, 0)
        return sharpened

    @staticmethod
    def _deskew(image: np.ndarray, max_angle: float = 15.0) -> Optional[np.ndarray]:
        """Deskew a binary image if the text is slightly rotated."""
        coords = np.column_stack(np.where(image > 0))
        if len(coords) < 50:
            return None
        try:
            angle = cv2.minAreaRect(coords)[-1]
            if angle < -45:
                angle = -(90 + angle)
            else:
                angle = -angle
            if abs(angle) > max_angle or abs(angle) < 0.5:
                return None
            h, w = image.shape[:2]
            center = (w // 2, h // 2)
            matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(
                image, matrix, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_REPLICATE,
            )
            return rotated
        except Exception:
            return None


# ---------------------------------------------------------------------------
#  OCR Engine
# ---------------------------------------------------------------------------
class LabelOCR:
    """Tesseract-based OCR engine specialised for clothing labels."""

    # PSM modes to try for best results
    PSM_MODES: list[int] = [6, 4, 3]

    def __init__(self, tesseract_cmd: Optional[str] = None,
                 lang: str = "auto", debug: bool = False):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

        # Verify Tesseract is available
        tess_path = tesseract_cmd or _check_tesseract()

        # Auto-detect languages if needed
        if lang == "auto":
            self.lang = _detect_languages(tess_path)
        else:
            self.lang = lang

        self.preprocessor = ImagePreprocessor(debug=debug)
        self._debug = debug

    def scan(self, image_path: str) -> LabelResult:
        """Run OCR on a clothing label image and return structured data."""
        result = LabelResult(file=os.path.basename(image_path))

        try:
            variants = self.preprocessor.preprocess(image_path)
        except FileNotFoundError as e:
            print(f"  ✗ {e}", file=sys.stderr)
            return result

        # Try every variant × PSM mode combination, keep the best
        best_text = ""
        best_conf = 0.0
        first_error = None

        for vi, variant in enumerate(variants):
            for psm in self.PSM_MODES:
                config = f"--oem 3 --psm {psm}"
                try:
                    # Get detailed data with confidence scores
                    data = pytesseract.image_to_data(
                        variant, lang=self.lang, config=config,
                        output_type=pytesseract.Output.DICT,
                    )
                    # Calculate mean confidence (ignore -1 = not a word)
                    confs = [c for c in data["conf"] if int(c) > 0]
                    mean_conf = sum(confs) / len(confs) if confs else 0.0

                    text = pytesseract.image_to_string(
                        variant, lang=self.lang, config=config,
                    ).strip()

                    if self._debug:
                        print(f"\n    [DEBUG] variant={vi} psm={psm} "
                              f"conf={mean_conf:.1f} chars={len(text)}",
                              file=sys.stderr)

                    # Score: combine confidence with how many fabric keywords found
                    fabric_hits = sum(
                        1 for kw in FABRIC_KEYWORDS
                        if kw.lower() in text.lower()
                    )
                    # Also count percentage patterns as a relevancy signal
                    pct_hits = len(re.findall(r'\d+\s*%', text))
                    score = mean_conf + fabric_hits * 10 + pct_hits * 5

                    if score > best_conf and len(text) > 5:
                        best_conf = score
                        best_text = text

                except pytesseract.TesseractNotFoundError:
                    print(
                        "\n❌ Tesseract executable not found!\n"
                        "   Install from: https://github.com/UB-Mannheim/tesseract/wiki\n"
                        "   Or specify path with --tesseract-cmd\n",
                        file=sys.stderr,
                    )
                    sys.exit(1)
                except Exception as e:
                    if first_error is None:
                        first_error = e
                    continue

        # If we got nothing at all, report the error
        if not best_text and first_error:
            print(f"\n  ⚠ OCR failed: {first_error}", file=sys.stderr)

        result.raw_text = best_text
        result.confidence = round(best_conf, 2)

        # --- Post-process --------------------------------------------------------
        self._extract_composition(result)
        self._extract_care(result)
        self._extract_country(result)
        self._extract_sizes(result)

        return result

    # -- Composition parser ---------------------------------------------------
    @staticmethod
    def _extract_composition(result: LabelResult) -> None:
        """Parse fabric percentages from raw text."""
        text = result.raw_text

        # Common OCR corrections
        corrections = {
            "c0tton": "cotton", "cott0n": "cotton", "cotlon": "cotton",
            "p0lyester": "polyester", "po1yester": "polyester",
            "p0lyamide": "polyamide", "po1yamide": "polyamide",
            "polyam1de": "polyamide",
            "e1astane": "elastane", "e1asthanne": "elasthanne",
            "ny1on": "nylon",
            "viscosé": "viscose", "vis cose": "viscose",
            "po1yuréthane": "polyuréthane",
            "poliéster": "poliester", "poliestér": "poliester",
            "poliamída": "poliamida",
        }
        text_clean = text.lower()
        for wrong, right in corrections.items():
            text_clean = text_clean.replace(wrong, right)

        # Pattern: "60% cotton" or "cotton 60%" or "60 % cotton"
        patterns = [
            r"(\d{1,3})\s*%\s*([a-zéèêëàâäùûüôöïîç]+(?:\s+[a-zéèêëàâäùûüôöïîç]+)?)",
            r"([a-zéèêëàâäùûüôöïîç]+(?:\s+[a-zéèêëàâäùûüôöïîç]+)?)\s*(\d{1,3})\s*%",
        ]

        seen = set()
        for pat in patterns:
            for match in re.finditer(pat, text_clean):
                groups = match.groups()
                if groups[0].isdigit():
                    pct, material = groups[0], groups[1]
                else:
                    material, pct = groups[0], groups[1]

                material = material.strip()
                # Validate it's a known fabric
                if any(kw in material for kw in FABRIC_KEYWORDS):
                    key = material
                    if key not in seen:
                        seen.add(key)
                        result.composition.append({
                            "material": material.capitalize(),
                            "percentage": f"{pct}%",
                        })

        # Fallback: just find fabric keywords without percentages
        if not result.composition:
            for kw in FABRIC_KEYWORDS:
                if kw in text_clean and kw not in seen:
                    seen.add(kw)
                    result.composition.append({
                        "material": kw.capitalize(),
                        "percentage": "unknown",
                    })

    # -- Care instructions parser ---------------------------------------------
    @staticmethod
    def _extract_care(result: LabelResult) -> None:
        text_lower = result.raw_text.lower()
        found: list[str] = []
        # Sort longest first so "machine wash" is matched before "wash"
        sorted_kw = sorted(CARE_KEYWORDS, key=len, reverse=True)
        matched_positions: set[int] = set()

        for kw in sorted_kw:
            start = text_lower.find(kw)
            if start != -1 and start not in matched_positions:
                found.append(kw.capitalize())
                # Mark all positions of this match as used
                for i in range(start, start + len(kw)):
                    matched_positions.add(i)

        # Temperature patterns (e.g. "30°C", "40°")
        for m in re.finditer(r"(\d{2,3})\s*°?\s*[cCfF]?", result.raw_text):
            temp = m.group(0).strip()
            if temp not in found:
                found.append(f"Temperature: {temp}")

        result.care_instructions = found

    # -- Country of origin parser ---------------------------------------------
    @staticmethod
    def _extract_country(result: LabelResult) -> None:
        text = result.raw_text
        for pat in COUNTRY_PATTERNS:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                country = m.group(0).strip()
                # Clean up trailing noise
                country = re.sub(r"[.\n\r]+$", "", country).strip()
                result.country_of_origin = country
                return

    # -- Size parser ----------------------------------------------------------
    @staticmethod
    def _extract_sizes(result: LabelResult) -> None:
        text = result.raw_text
        sizes: list[str] = []
        for pat in SIZE_PATTERNS:
            for m in re.finditer(pat, text, re.IGNORECASE):
                val = m.group(1) if m.lastindex else m.group(0)
                val = val.strip()
                if val and val not in sizes:
                    sizes.append(val)
        result.sizes = sizes


# ---------------------------------------------------------------------------
#  CLI
# ---------------------------------------------------------------------------
def process_path(path: str, ocr: LabelOCR) -> list[LabelResult]:
    """Process a single image or all images in a directory."""
    IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}
    results: list[LabelResult] = []

    p = Path(path)
    if p.is_file() and p.suffix.lower() in IMAGE_EXTS:
        files = [p]
    elif p.is_dir():
        files = [f for f in p.iterdir() if f.suffix.lower() in IMAGE_EXTS]
        if not files:
            print(f"No image files found in {path}", file=sys.stderr)
            return results
    else:
        print(f"Invalid path or unsupported format: {path}", file=sys.stderr)
        return results

    print(f"\n🏷️  Clothes Label OCR — Processing {len(files)} image(s)...\n")

    for f in sorted(files):
        print(f"  📸 {f.name} ... ", end="", flush=True)
        result = ocr.scan(str(f))
        results.append(result)
        if result.composition:
            print(f"✓ Found {len(result.composition)} material(s)")
        else:
            print("⚠ No composition detected")

    return results


def print_results(results: list[LabelResult], as_json: bool = False) -> None:
    """Pretty-print or JSON-dump results."""
    if as_json:
        data = [r.to_dict() for r in results]
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return

    for r in results:
        print(f"\n{'='*60}")
        print(f"  📄 File: {r.file}")
        print(f"  🎯 Confidence score: {r.confidence}")
        print(f"{'='*60}")

        if r.composition:
            print("\n  🧵 Fabric Composition:")
            for comp in r.composition:
                print(f"     • {comp['material']}: {comp['percentage']}")
        else:
            print("\n  🧵 Fabric Composition: not detected")

        if r.care_instructions:
            print("\n  🧺 Care Instructions:")
            for care in r.care_instructions:
                print(f"     • {care}")

        if r.country_of_origin:
            print(f"\n  🌍 Origin: {r.country_of_origin}")

        if r.sizes:
            print(f"\n  📏 Size(s): {', '.join(r.sizes)}")

        if r.raw_text.strip():
            print(f"\n  📝 Raw OCR Text:")
            for line in r.raw_text.strip().splitlines():
                line = line.strip()
                if line:
                    print(f"     | {line}")

        print()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="OCR reader for clothing labels — extracts fabric "
                    "composition, care instructions, origin and sizes.",
    )
    parser.add_argument(
        "path",
        help="Path to a label image or a folder of images",
    )
    parser.add_argument(
        "--json", action="store_true",
        help="Output results as JSON",
    )
    parser.add_argument(
        "--debug", action="store_true",
        help="Save preprocessed images to debug_output/ for inspection",
    )
    parser.add_argument(
        "--lang", default="auto",
        help="Tesseract language(s) to use (default: auto-detect)",
    )
    parser.add_argument(
        "--tesseract-cmd", default=None,
        help="Path to tesseract executable (if not on PATH)",
    )

    args = parser.parse_args()

    ocr = LabelOCR(
        tesseract_cmd=args.tesseract_cmd,
        lang=args.lang,
        debug=args.debug,
    )

    results = process_path(args.path, ocr)
    if results:
        print_results(results, as_json=args.json)
    else:
        print("No results.", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
