"""
services/certificate_generator.py
===================================
Génère un certificat PDF personnalisé sur le template NTT DATA.
Le template (2000×1414 px) a :
  - Titre « CERTIFICATE OF ACHIEVEMENT » en haut à gauche (y≈60-180)
  - Médaille dorée en haut à droite
  - Bande décorative bleu marine / bleu clair sur la droite
  - Texte "This certificate is proudly presented to" vers y≈270
  - Ligne de signature sous le nom vers y≈490
  - Corps du texte (training program / skills in) vers y≈530–640
  - "Given this ___ of ___ , ___" vers y≈720
  - Logo NTT DATA en bas à gauche vers y≈870

Utilisé par : services/email_service.py
"""

import io
import os
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
from loguru import logger


# ── Chemin vers le template image ─────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(BASE_DIR, "..", "assets", "certificate_template.jpg")

# ── Couleurs (palette NTT DATA du template) ───────────────────
COLOR_DARK_BLUE   = (10, 25, 60)        # bleu marine très foncé du titre
COLOR_MEDIUM_BLUE = (15, 30, 80)        # bleu marine texte secondaire
COLOR_ACCENT_BLUE = (0, 100, 200)       # bleu NTT DATA (logo)
COLOR_GREY_TEXT   = (80, 100, 130)      # texte grisé (dates, ID)


# ================================================================
# HELPERS FONT
# ================================================================

def _load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    font_candidates = []
    if bold:
        font_candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
        ]
    else:
        font_candidates = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
        ]
    for path in font_candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def _center_x_in_zone(draw, text, font, zone_x_start, zone_width):
    """Centre le texte dans une zone horizontale."""
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    return zone_x_start + max(0, (zone_width - text_w) // 2)


# ================================================================
# GÉNÉRATEUR PRINCIPAL
# ================================================================

def generate_certificate_image(
    employee_name: str,
    training_title: str,
    skill_acquired: str,
    issue_date: str,
    expiry_date: str,
    certificate_id: str,
    score: float = None,
) -> bytes:
    """
    Génère le certificat PNG en superposant les infos de l'employé
    sur le template NTT DATA (2000×1414 px).
    """
    # ── Chargement du template ─────────────────────────────────
    if os.path.exists(TEMPLATE_PATH):
        img = Image.open(TEMPLATE_PATH).convert("RGB")
        logger.info(f"✅ Template chargé : {TEMPLATE_PATH}")
    else:
        logger.warning(f"⚠️ Template introuvable ({TEMPLATE_PATH}) — template par défaut")
        img = _create_fallback_template()

    draw        = ImageDraw.Draw(img)
    img_w, img_h = img.size   # 2000 × 1414

    # Zone blanche : x de 0 à ~1480 px (bande décorative commence vers 1490)
    WHITE_ZONE_W = 1460

    # ── Polices ─────────────────────────────────────────────────
    font_name    = _load_font(58, bold=True)   # Nom employé
    font_title   = _load_font(30, bold=True)   # Titre formation
    font_skill   = _load_font(28, bold=False)  # Compétence
    font_body    = _load_font(26, bold=False)  # Corps texte
    font_date    = _load_font(24, bold=False)  # Date "Given this"
    font_small   = _load_font(20, bold=False)  # Expiry, ID
    font_score   = _load_font(24, bold=True)   # Score

    # ── NOM DE L'EMPLOYÉ ────────────────────────────────────────
    # Centré dans la zone blanche, sous "This certificate is proudly presented to"
    # Le texte original y≈270, la ligne de signature est y≈490
    # On place le nom vers y=380 (milieu entre 270 et 490)
    name_y = int(img_h * 0.355)
    name_x = _center_x_in_zone(draw, employee_name, font_name, 50, WHITE_ZONE_W)
    draw.text((name_x, name_y), employee_name, font=font_name, fill=COLOR_DARK_BLUE)

    # ── TITRE DE LA FORMATION ────────────────────────────────────
    # Sur la ligne "training program ___" → y ≈ 0.548 * 1414 ≈ 775
    # Le tiret est à x≈350 (après "training program ")
    training_y = int(img_h * 0.548)
    training_x = int(img_w * 0.366)   # après "training program"
    # Tronquer si trop long
    max_train_w = WHITE_ZONE_W - training_x - 40
    draw.text((training_x, training_y), training_title, font=font_title, fill=COLOR_DARK_BLUE)

    # ── COMPÉTENCE ACQUISE ───────────────────────────────────────
    # Sur la ligne "skills in ___" → y ≈ 0.608 * 1414 ≈ 860
    skill_y = int(img_h * 0.608)
    skill_x = int(img_w * 0.238)   # après "skills in"
    draw.text((skill_x, skill_y), skill_acquired, font=font_skill, fill=COLOR_MEDIUM_BLUE)

    # ── SCORE ────────────────────────────────────────────────────
    if score is not None:
        score_text = f"Score obtenu : {score:.1f}%"
        score_y    = int(img_h * 0.658)
        draw.text((60, score_y), score_text, font=font_score, fill=COLOR_ACCENT_BLUE)

    # ── DATE "Given this ___ of ___, ___" ────────────────────────
    try:
        dt    = datetime.strptime(issue_date, "%d/%m/%Y")
        day   = str(dt.day)
        month = dt.strftime("%B")
        year  = str(dt.year)
    except Exception:
        day, month, year = issue_date, "", ""

    given_y = int(img_h * 0.717)
    given_text = f"Given this  {day}  of  {month} ,  {year}"
    draw.text((60, given_y), given_text, font=font_date, fill=COLOR_DARK_BLUE)

    # ── DATE D'EXPIRATION ─────────────────────────────────────────
    if expiry_date:
        exp_y = int(img_h * 0.762)
        draw.text((60, exp_y), f"Valid until : {expiry_date}", font=font_small, fill=COLOR_GREY_TEXT)

    # ── ID CERTIFICAT (bas de page, avant le logo) ────────────────
    id_y = int(img_h * 0.932)
    draw.text((60, id_y), f"Certificate ID : {certificate_id}", font=font_small, fill=COLOR_GREY_TEXT)

    # ── Export PNG ────────────────────────────────────────────────
    buf = io.BytesIO()
    img.save(buf, format="PNG", dpi=(150, 150))
    buf.seek(0)
    return buf.getvalue()


def generate_certificate_pdf(
    employee_name: str,
    training_title: str,
    skill_acquired: str,
    issue_date: str,
    expiry_date: str,
    certificate_id: str,
    score: float = None,
) -> bytes:
    """
    Génère le certificat en PDF (converti depuis l'image PNG).
    C'est ce PDF qui est attaché dans l'email.
    """
    try:
        from reportlab.lib.pagesizes import landscape, A4
        from reportlab.pdfgen import canvas as rl_canvas

        img_bytes = generate_certificate_image(
            employee_name=employee_name,
            training_title=training_title,
            skill_acquired=skill_acquired,
            issue_date=issue_date,
            expiry_date=expiry_date,
            certificate_id=certificate_id,
            score=score,
        )

        pdf_buf    = io.BytesIO()
        page_w, page_h = landscape(A4)   # 841.9 × 595.3 pts

        c = rl_canvas.Canvas(pdf_buf, pagesize=(page_w, page_h))
        tmp_img_buf = io.BytesIO(img_bytes)
        c.drawImage(tmp_img_buf, x=0, y=0, width=page_w, height=page_h,
                    preserveAspectRatio=False)
        c.save()

        pdf_buf.seek(0)
        logger.success(f"✅ PDF généré pour {employee_name} — {certificate_id}")
        return pdf_buf.getvalue()

    except ImportError:
        logger.warning("⚠️ reportlab non installé — envoi du PNG")
        return generate_certificate_image(
            employee_name=employee_name,
            training_title=training_title,
            skill_acquired=skill_acquired,
            issue_date=issue_date,
            expiry_date=expiry_date,
            certificate_id=certificate_id,
            score=score,
        )

    except Exception as e:
        logger.error(f"Erreur génération PDF : {e}")
        raise


# ================================================================
# TEMPLATE FALLBACK
# ================================================================

def _create_fallback_template() -> Image.Image:
    """Template de secours si le fichier image est absent."""
    img  = Image.new("RGB", (2000, 1414), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Bandes décoratives droite
    for x0, x1, col in [
        (1490, 1660, (10, 25, 60)),
        (1665, 1830, (176, 196, 222)),
        (1835, 2000, (10, 25, 60)),
    ]:
        draw.rectangle([x0, 0, x1, 1414], fill=col)

    # Titre
    font_big  = _load_font(100, bold=True)
    font_sub  = _load_font(60, bold=True)
    font_body = _load_font(32)

    draw.text((60, 80),  "CERTIFICATE",     font=font_big,  fill=(10, 25, 60))
    draw.text((60, 195), "OF ACHIEVEMENT",  font=font_sub,  fill=(10, 25, 60))
    draw.text((60, 370), "This certificate is proudly presented to",
              font=font_body, fill=(10, 25, 60))
    draw.line([(60, 490), (1050, 490)], fill=(10, 25, 60), width=3)
    draw.text((60, 530), "In recognition of the successful completion of the",
              font=font_body, fill=(10, 25, 60))
    draw.text((60, 580), "training program", font=font_body, fill=(10, 25, 60))
    draw.line([(330, 600), (1050, 600)], fill=(10, 25, 60), width=2)
    draw.text((60, 640), "demonstrating valuable knowledge and practical",
              font=font_body, fill=(10, 25, 60))
    draw.text((60, 690), "skills in", font=font_body, fill=(10, 25, 60))
    draw.line([(240, 710), (1050, 710)], fill=(10, 25, 60), width=2)
    draw.text((60, 740), "along with dedication and commitment.",
              font=font_body, fill=(10, 25, 60))
    draw.text((60, 860), "NTT DATA", font=_load_font(55, bold=True), fill=(0, 100, 200))
    return img
