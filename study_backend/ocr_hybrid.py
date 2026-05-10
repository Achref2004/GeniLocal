# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════╗
║              OCR AVANCÉ OFFLINE - PaddleOCR                      ║
║                                                                  ║
║  • Lecture de tout type de document (Image, PDF, Word, etc.)     ║
║  • Détection manuscrit / imprimé                                 ║
║  • Détection tableau / texte / titre                             ║
║  • 100% hors ligne après premier téléchargement des modèles      ║
╚══════════════════════════════════════════════════════════════════╝

Installation requise :
    pip install paddlepaddle paddleocr opencv-python-headless
    pip install Pillow numpy PyMuPDF python-docx
"""

import os
import sys
import json
import csv
import argparse
import warnings
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import List, Optional
from enum import Enum

import cv2
import numpy as np
from PIL import Image

warnings.filterwarnings("ignore")

# ─────────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────────

# Langues par défaut
DEFAULT_LANGUAGES = ["fr", "en"]

# Seuil de confiance minimum (0-1)
CONFIDENCE_THRESHOLD = 0.3


# ─────────────────────────────────────────────────
#  ENUMS & STRUCTURES DE DONNÉES
# ─────────────────────────────────────────────────

class ContentType(Enum):
    """Type de contenu détecté."""
    TEXT = "texte"
    TABLE = "tableau"
    TITLE = "titre"
    IMAGE = "image"
    UNKNOWN = "inconnu"


class WritingType(Enum):
    """Type d'écriture détecté."""
    PRINTED = "imprimé"
    HANDWRITTEN = "manuscrit"
    MIXED = "mixte"
    UNKNOWN = "inconnu"


@dataclass
class OCRRegion:
    """Représente une zone de texte détectée."""
    text: str
    confidence: float
    bbox: List[int]  # [x1, y1, x2, y2]
    content_type: str = "texte"
    writing_type: str = "inconnu"
    page: int = 1


@dataclass
class OCRResult:
    """Résultat complet de l'OCR."""
    file_path: str
    total_pages: int = 1
    regions: List[OCRRegion] = field(default_factory=list)
    full_text: str = ""
    writing_type_global: str = "inconnu"
    content_types_detected: List[str] = field(default_factory=list)

    def to_dict(self):
        return {
            "fichier": self.file_path,
            "pages_total": self.total_pages,
            "type_ecriture_global": self.writing_type_global,
            "types_contenu_detectes": self.content_types_detected,
            "moteur": "PaddleOCR",
            "texte_complet": self.full_text,
            "regions": [asdict(r) for r in self.regions],
        }


# ─────────────────────────────────────────────────
#  CHARGEMENT DE DOCUMENTS
# ─────────────────────────────────────────────────

def load_document(file_path: str) -> List[np.ndarray]:
    """
    Charge un document et retourne une liste d'images (une par page).
    Supporte : images, PDF, DOCX.
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".tif", ".webp"]:
        return _load_image(file_path)
    elif ext == ".pdf":
        return _load_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return _load_docx(file_path)
    else:
        print(f"[!] Format '{ext}' non supporté directement. Tentative comme image...")
        return _load_image(file_path)


def _load_image(file_path: str) -> List[np.ndarray]:
    """Charge une image simple."""
    img = cv2.imread(file_path)
    if img is None:
        try:
            pil_img = Image.open(file_path).convert("RGB")
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            raise ValueError(f"Impossible de charger l'image : {file_path}\n{e}")
    return [img]


def _load_pdf(file_path: str) -> List[np.ndarray]:
    """Convertit chaque page PDF en image haute résolution (300 DPI)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError("PyMuPDF requis : pip install PyMuPDF")

    doc = fitz.open(file_path)
    images = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        mat = fitz.Matrix(300 / 72, 300 / 72)  # 300 DPI
        pix = page.get_pixmap(matrix=mat)
        img_data = np.frombuffer(pix.samples, dtype=np.uint8)
        img = img_data.reshape(pix.height, pix.width, pix.n)
        if pix.n == 4:
            img = cv2.cvtColor(img, cv2.COLOR_RGBA2BGR)
        elif pix.n == 3:
            img = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        images.append(img)
    doc.close()
    print(f"  [PDF] {len(images)} page(s) extraite(s)")
    return images


def _load_docx(file_path: str) -> List[np.ndarray]:
    """
    Extrait le contenu d'un fichier DOCX.
    Récupère les images intégrées et génère une image du texte.
    """
    try:
        from docx import Document
    except ImportError:
        raise ImportError("python-docx requis : pip install python-docx")

    doc = Document(file_path)
    images = []

    # Extraire les images intégrées
    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                image_data = rel.target_part.blob
                nparr = np.frombuffer(image_data, np.uint8)
                img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if img is not None:
                    images.append(img)
            except Exception:
                pass

    # Créer une image à partir du texte
    full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    if full_text.strip():
        text_img = _text_to_image(full_text)
        images.insert(0, text_img)

    if not images:
        raise ValueError("Aucun contenu extractible trouvé dans le fichier DOCX")

    print(f"  [DOCX] {len(images)} élément(s) extrait(s)")
    return images


def _text_to_image(text: str, width: int = 2480, font_scale: float = 1.0) -> np.ndarray:
    """Crée une image blanche avec le texte rendu (pour traitement DOCX)."""
    lines = text.split("\n")
    line_height = int(40 * font_scale)
    padding = 60
    height = max(200, len(lines) * line_height + 2 * padding)

    img = np.ones((height, width, 3), dtype=np.uint8) * 255

    y = padding
    for line in lines:
        if y + line_height > height - padding:
            break
        cv2.putText(img, line, (padding, y), cv2.FONT_HERSHEY_SIMPLEX,
                    font_scale, (0, 0, 0), 1, cv2.LINE_AA)
        y += line_height

    return img


# ─────────────────────────────────────────────────
#  PRÉTRAITEMENT D'IMAGES
# ─────────────────────────────────────────────────

def preprocess_image(img: np.ndarray) -> np.ndarray:
    """
    Prétraitement avancé pour améliorer la qualité OCR.
    Retourne une image BGR (3 canaux) optimisée.
    """
    if len(img.shape) == 2:
        gray = img.copy()
    else:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    h, w = gray.shape[:2]

    # 1. Redimensionner si trop petit
    if max(h, w) < 1000:
        scale = 1500 / max(h, w)
        gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

    # 2. Débruitage
    gray = cv2.fastNlMeansDenoising(gray, h=10)

    # 3. Amélioration du contraste (CLAHE)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)

    # 4. Correction de l'inclinaison
    gray = _deskew(gray)

    # PaddleOCR attend une image BGR 3 canaux
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


def _deskew(image: np.ndarray) -> np.ndarray:
    """Corrige l'inclinaison d'une image."""
    try:
        coords = np.column_stack(np.where(image < 128))
        if len(coords) < 100:
            return image
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) < 0.5 or abs(angle) > 15:
            return image
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(image, M, (w, h),
                              flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return image


# ─────────────────────────────────────────────────
#  DÉTECTION DU TYPE D'ÉCRITURE (manuscrit/imprimé)
# ─────────────────────────────────────────────────

def detect_writing_type(img: np.ndarray) -> WritingType:
    """
    Détecte si l'écriture est manuscrite ou imprimée en analysant :
    - La régularité des contours (variance des aires)
    - La régularité des hauteurs de caractères
    - La variance de l'épaisseur des traits (distance transform)
    """
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if len(contours) < 5:
        return WritingType.UNKNOWN

    # Coefficient de variation des aires
    areas = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > 10]
    if not areas:
        return WritingType.UNKNOWN
    mean_area = np.mean(areas)
    cv_area = np.std(areas) / mean_area if mean_area > 0 else 0

    # Coefficient de variation des hauteurs
    heights = [cv2.boundingRect(c)[3] for c in contours if cv2.boundingRect(c)[3] > 5]
    if not heights:
        return WritingType.UNKNOWN
    cv_height = np.std(heights) / np.mean(heights) if np.mean(heights) > 0 else 0

    # Coefficient de variation de l'épaisseur des traits
    dist = cv2.distanceTransform(binary, cv2.DIST_L2, 5)
    stroke_widths = dist[dist > 0]
    cv_stroke = (np.std(stroke_widths) / np.mean(stroke_widths)
                 if len(stroke_widths) > 0 and np.mean(stroke_widths) > 0 else 0)

    # Score combiné : manuscrit = irrégulier = CV élevé
    score = cv_area * 0.3 + cv_height * 0.4 + cv_stroke * 0.3

    if score > 1.2:
        return WritingType.HANDWRITTEN
    elif score > 0.7:
        return WritingType.MIXED
    else:
        return WritingType.PRINTED


# ─────────────────────────────────────────────────
#  DÉTECTION DU TYPE DE CONTENU (tableau/texte/titre)
# ─────────────────────────────────────────────────

def detect_content_type(img: np.ndarray) -> ContentType:
    """
    Détecte si la zone contient un tableau, du texte ou un titre.
    Utilise la morphologie pour trouver les lignes de tableau.
    """
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    h, w = gray.shape[:2]
    total_pixels = h * w

    binary = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY_INV, 15, 5)

    # --- Détection de tableau (lignes horizontales + verticales) ---
    horiz_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(w // 8, 40), 1))
    horizontal = cv2.morphologyEx(binary, cv2.MORPH_OPEN, horiz_kernel, iterations=2)

    vert_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(h // 8, 40)))
    vertical = cv2.morphologyEx(binary, cv2.MORPH_OPEN, vert_kernel, iterations=2)

    line_ratio = (cv2.countNonZero(horizontal) + cv2.countNonZero(vertical)) / total_pixels
    if line_ratio > 0.01:
        return ContentType.TABLE

    # --- Détection de titre (gros caractères, peu dense) ---
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        char_heights = [cv2.boundingRect(c)[3] for c in contours if cv2.boundingRect(c)[3] > 5]
        if char_heights:
            avg_h = np.mean(char_heights)
            density = len(contours) / (total_pixels / 10000)
            if avg_h > h * 0.15 and density < 5:
                return ContentType.TITLE

    # --- Texte ou image ---
    text_ratio = cv2.countNonZero(binary) / total_pixels
    if text_ratio < 0.005:
        return ContentType.IMAGE

    return ContentType.TEXT


# ─────────────────────────────────────────────────
#  MOTEUR OCR : PaddleOCR
# ─────────────────────────────────────────────────

def init_paddle(lang: str = "fr"):
    """
    Initialise PaddleOCR.
    Les modeles sont telecharges au premier lancement (~150 MB),
    ensuite tout fonctionne hors ligne.
    """
    try:
        from paddleocr import PaddleOCR
    except ImportError:
        raise ImportError(
            "PaddleOCR non installe.\n"
            "Installation :\n"
            "  pip install paddlepaddle paddleocr"
        )

    lang_map = {
        "fr": "french", "en": "en", "ar": "ar",
        "es": "es", "de": "german", "it": "it",
        "pt": "pt", "ru": "ru", "zh": "ch",
        "ja": "japan", "ko": "korean",
    }
    paddle_lang = lang_map.get(lang, "en")

    # Desactiver la verification de connectivite pour le mode offline
    os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"

    try:
        ocr = PaddleOCR(
            use_angle_cls=True,        # Detection de l'angle du texte
            lang=paddle_lang,
            use_gpu=False,
            show_log=False,
            drop_score=0.1,            # Accepter des scores plus bas pour le manuscrit
            use_space_char=True,       # Garder les espaces
            use_dilation=True,         # Dilatation pour relier les traits manuscrits
            det_db_thresh=0.3,
            det_db_box_thresh=0.4,
        )
        return ocr
    except Exception as e:
        raise RuntimeError(f"Erreur initialisation PaddleOCR : {e}")


def run_paddle_ocr(img: np.ndarray, engine) -> List[OCRRegion]:
    """Exécute PaddleOCR sur une image et retourne les régions détectées."""
    if engine is None:
        return []

    try:
        results = engine.ocr(img, cls=True)
        regions = []

        if results and results[0]:
            for line in results[0]:
                bbox_points = line[0]  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
                text = line[1][0]
                confidence = float(line[1][1])

                if confidence < CONFIDENCE_THRESHOLD:
                    continue

                # Convertir polygone → rectangle englobant
                xs = [p[0] for p in bbox_points]
                ys = [p[1] for p in bbox_points]
                bbox = [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]

                regions.append(OCRRegion(
                    text=text,
                    confidence=confidence,
                    bbox=bbox,
                ))

        return regions
    except Exception as e:
        print(f"[!] Erreur PaddleOCR : {e}")
        return []


# ─────────────────────────────────────────────────
#  ANALYSE DE LAYOUT
# ─────────────────────────────────────────────────

def analyze_layout(img: np.ndarray, regions: List[OCRRegion]) -> List[OCRRegion]:
    """Enrichit chaque région avec le type de contenu et le type d'écriture."""
    h, w = img.shape[:2]

    for region in regions:
        x1, y1, x2, y2 = region.bbox
        x1c, y1c = max(0, x1), max(0, y1)
        x2c, y2c = min(w, x2), min(h, y2)

        if x2c - x1c < 5 or y2c - y1c < 5:
            continue

        roi = img[y1c:y2c, x1c:x2c]
        region.content_type = detect_content_type(roi).value
        region.writing_type = detect_writing_type(roi).value

    return regions


# ─────────────────────────────────────────────────
#  FONCTION PRINCIPALE
# ─────────────────────────────────────────────────

def process_document(file_path: str,
                     languages: List[str] = None,
                     use_preprocessing: bool = True,
                     verbose: bool = True) -> OCRResult:
    """
    Traite un document complet avec PaddleOCR.

    Args:
        file_path       : Chemin vers le fichier (image, PDF, DOCX…)
        languages       : Langues pour l'OCR (ex: ["fr", "en"])
        use_preprocessing: Activer le prétraitement d'image
        verbose         : Afficher les messages de progression

    Returns:
        OCRResult contenant le texte extrait et les métadonnées
    """
    if languages is None:
        languages = DEFAULT_LANGUAGES

    file_path = str(Path(file_path).resolve())
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Fichier non trouvé : {file_path}")

    if verbose:
        print(f"\n{'='*60}")
        print(f"  OCR PaddleOCR - {Path(file_path).name}")
        print(f"{'='*60}")

    # 1. Charger le document
    if verbose:
        print("\n[1/4] Chargement du document...")
    images = load_document(file_path)

    # 2. Initialiser PaddleOCR
    if verbose:
        print("[2/4] Initialisation de PaddleOCR...")
    engine = init_paddle(languages[0])
    if verbose:
        print("  PaddleOCR [OK]")

    # 3. Traiter chaque page
    all_regions = []
    all_text_parts = []
    all_content_types = set()
    all_writing_types = []

    for page_idx, img in enumerate(images):
        page_num = page_idx + 1
        if verbose:
            print(f"\n[3/4] Page {page_num}/{len(images)}...")

        # Exécuter PaddleOCR sur l'image ORIGINALE (meilleur pour le manuscrit)
        if verbose:
            print(f"  -> OCR en cours (image originale)...")
        regions = run_paddle_ocr(img, engine)

        # Si peu de résultats, réessayer avec l'image prétraitée
        if use_preprocessing and len(regions) < 3:
            if verbose:
                print(f"  -> Deuxieme passe avec pretraitement...")
            ocr_img = preprocess_image(img)
            regions_preprocessed = run_paddle_ocr(ocr_img, engine)
            if len(regions_preprocessed) > len(regions):
                regions = regions_preprocessed

        if verbose:
            print(f"  -> {len(regions)} zone(s) detectee(s)")

        # Analyse du layout (type de contenu + écriture)
        if verbose:
            print(f"  -> Analyse du layout...")
        regions = analyze_layout(img, regions)

        for r in regions:
            r.page = page_num

        all_regions.extend(regions)
        all_text_parts.append("\n".join([r.text for r in regions]))

        for r in regions:
            all_content_types.add(r.content_type)
            all_writing_types.append(r.writing_type)

    # 4. Résultat global
    if verbose:
        print(f"\n[4/4] Construction du resultat...")

    # Type d'écriture dominant
    wt_counts = {}
    for wt in all_writing_types:
        wt_counts[wt] = wt_counts.get(wt, 0) + 1
    global_writing = max(wt_counts, key=wt_counts.get) if wt_counts else WritingType.UNKNOWN.value

    result = OCRResult(
        file_path=file_path,
        total_pages=len(images),
        regions=all_regions,
        full_text="\n\n--- Page ---\n\n".join(all_text_parts),
        writing_type_global=global_writing,
        content_types_detected=list(all_content_types),
    )

    if verbose:
        _print_summary(result)

    return result


# ─────────────────────────────────────────────────
#  AFFICHAGE DES RÉSULTATS
# ─────────────────────────────────────────────────

def _print_summary(result: OCRResult):
    """Affiche un résumé formaté des résultats."""
    print(f"\n{'='*60}")
    print(f"  RESULTATS")
    print(f"{'='*60}")
    print(f"  Fichier         : {Path(result.file_path).name}")
    print(f"  Pages           : {result.total_pages}")
    print(f"  Zones detectees : {len(result.regions)}")
    print(f"  Ecriture        : {result.writing_type_global}")
    print(f"  Types contenu   : {', '.join(result.content_types_detected)}")
    print(f"  Moteur          : PaddleOCR")
    print(f"{'-'*60}")

    for i, region in enumerate(result.regions):
        conf_bar = "#" * int(region.confidence * 10) + "." * (10 - int(region.confidence * 10))
        print(f"\n  [{i+1}] Page {region.page} | {region.content_type} | {region.writing_type}")
        print(f"      Confiance : [{conf_bar}] {region.confidence:.0%}")
        text_display = region.text[:120] + "..." if len(region.text) > 120 else region.text
        print(f"      Texte     : {text_display}")

    print(f"\n{'-'*60}")
    print(f"  TEXTE COMPLET :")
    print(f"{'-'*60}")
    print(result.full_text[:2000])
    if len(result.full_text) > 2000:
        print(f"\n  ... [{len(result.full_text) - 2000} caracteres de plus]")
    print(f"{'='*60}\n")


def save_result(result: OCRResult, output_path: str, fmt: str = "json"):
    """
    Sauvegarde les résultats.

    Args:
        result      : Résultat OCR
        output_path : Chemin du fichier de sortie
        fmt         : "json" ou "txt"
    """
    if fmt == "json":
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result.to_dict(), f, ensure_ascii=False, indent=2)
    elif fmt == "txt":
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"Fichier : {result.file_path}\n")
            f.write(f"Pages : {result.total_pages}\n")
            f.write(f"Écriture : {result.writing_type_global}\n")
            f.write(f"Types : {', '.join(result.content_types_detected)}\n")
            f.write(f"Moteur : PaddleOCR\n")
            f.write(f"\n{'='*60}\n\n")
            f.write(result.full_text)
    elif fmt == "csv":
        with open(output_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["page", "x1", "y1", "x2", "y2", "texte", "confiance", "type_contenu", "type_ecriture"])
            for r in result.regions:
                # Bbox = [x1, y1, x2, y2]
                writer.writerow([
                    r.page, 
                    r.bbox[0], r.bbox[1], r.bbox[2], r.bbox[3], 
                    r.text, 
                    f"{r.confidence:.4f}", 
                    r.content_type, 
                    r.writing_type
                ])

    print(f"\n[OK] Resultat sauvegarde : {output_path}")


# ─────────────────────────────────────────────────
#  CLI
# ─────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="OCR Avancé Offline - PaddleOCR",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python ocr_hybrid.py document.pdf
  python ocr_hybrid.py image.png --lang fr
  python ocr_hybrid.py scan.jpg -o resultat.json -f json
  python ocr_hybrid.py facture.pdf -o texte.txt -f txt
  python ocr_hybrid.py lettre.png --no-preprocess
        """
    )

    parser.add_argument("file", help="Fichier à traiter (image, PDF, DOCX…)")
    parser.add_argument("--lang", nargs="+", default=["fr", "en"],
                        help="Langues OCR (défaut: fr en)")
    parser.add_argument("--output", "-o", help="Fichier de sortie")
    parser.add_argument("--format", "-f", choices=["json", "txt", "csv", "tous"], default="tous",
                        help="Format de sortie (defaut: tous = json + csv)")
    parser.add_argument("--no-preprocess", action="store_true",
                        help="Désactiver le prétraitement")
    parser.add_argument("--quiet", "-q", action="store_true",
                        help="Mode silencieux")

    args = parser.parse_args()

    try:
        result = process_document(
            file_path=args.file,
            languages=args.lang,
            use_preprocessing=not args.no_preprocess,
            verbose=not args.quiet,
        )

        if args.output:
            if args.format == "tous":
                base_name = str(Path(args.output).with_suffix(''))
                save_result(result, f"{base_name}.json", "json")
                save_result(result, f"{base_name}.csv", "csv")
            else:
                save_result(result, args.output, args.format)
        elif args.quiet:
            print(result.full_text)

    except FileNotFoundError as e:
        print(f"\n[ERREUR] {e}")
        sys.exit(1)
    except ImportError as e:
        print(f"\n[ERREUR] Dépendance manquante : {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERREUR] {e}")
        sys.exit(1)


# ─────────────────────────────────────────────────
#  UTILISATION COMME MODULE
# ─────────────────────────────────────────────────
#
#  from ocr_hybrid import process_document, save_result
#
#  result = process_document("mon_document.pdf", languages=["fr"])
#  print(result.full_text)
#  save_result(result, "output.json")
#

if __name__ == "__main__":
    main()
