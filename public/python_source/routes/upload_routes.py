"""
routes/upload_routes.py
========================
Endpoints pour l'upload et le parsing de CV.

Routes disponibles :
  POST /upload/cv           → Upload un CV, retourne les données extraites
  POST /upload/cv/save      → Upload un CV ET sauvegarde l'employé dans MongoDB

Utilisé par : Frontend — section "Ajouter un employé"
"""

import os
import uuid
import tempfile
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from loguru import logger

from database.mongodb import employees_collection, clean_doc
from services.cv_parser import parse_cv
from services.auth_service import get_current_user

router = APIRouter(
    prefix="/upload",
    tags=["Upload & CV Parsing"]
)

# Taille maximale du fichier : 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc"}


# ================================================================
# HELPERS
# ================================================================

def _validate_file(file: UploadFile) -> str:
    """
    Valide le fichier uploadé (type et taille).
    Retourne l'extension du fichier.

    Raises:
        HTTPException: Si le fichier est invalide
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant")

    ext = file.filename.lower().split(".")[-1]

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté : .{ext}. "
                   f"Formats acceptés : {', '.join(ALLOWED_EXTENSIONS)}"
        )

    return ext


async def _save_temp_file(file: UploadFile) -> tuple[str, int]:
    """
    Sauvegarde le fichier uploadé dans un répertoire temporaire.

    Returns:
        tuple: (chemin_temporaire, taille_en_bytes)
    """
    content = await file.read()
    file_size = len(content)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux : {file_size // 1024} KB. "
                   f"Maximum : {MAX_FILE_SIZE // (1024*1024)} MB"
        )

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Le fichier est vide")

    # Créer un fichier temporaire
    ext = file.filename.lower().split(".")[-1]
    tmp_path = os.path.join(
        tempfile.gettempdir(),
        f"cv_{uuid.uuid4().hex}.{ext}"
    )

    with open(tmp_path, "wb") as f:
        f.write(content)

    return tmp_path, file_size


def _cleanup_temp_file(path: str):
    """Supprime le fichier temporaire."""
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


# ================================================================
# ENDPOINTS
# ================================================================

@router.post(
    "/cv",
    summary="Uploader et analyser un CV",
    description="""
    Upload un CV (PDF ou DOCX) et retourne les informations extraites.
    
    Le CV est analysé par l'IA (LLaMA 3 via Groq) qui extrait :
    - Nom, email, téléphone
    - Département, poste
    - Compétences, années d'expérience
    - Certifications, langues, formation
    
    ⚠️ L'employé N'EST PAS sauvegardé — uniquement l'extraction.
    Pour sauvegarder, utiliser POST /upload/cv/save
    """
)
async def upload_and_parse_cv(
    file: UploadFile = File(
        ...,
        description="CV au format PDF ou DOCX (max 10 MB)"
    )
):
    """
    Upload un CV et retourne les données extraites par l'IA.
    Le résultat peut être affiché dans le formulaire pour confirmation.
    """
    tmp_path = None

    try:
        # Validation du fichier
        _validate_file(file)

        # Sauvegarde temporaire
        tmp_path, file_size = await _save_temp_file(file)

        logger.info(f"📄 CV uploadé : {file.filename} ({file_size} bytes)")

        # Parsing du CV
        result = parse_cv(tmp_path, file.filename)

        if result["success"]:
            return {
                "success": True,
                "filename": file.filename,
                "file_size_kb": round(file_size / 1024, 1),
                "text_length": result["raw_text_length"],
                "employee_data": result["employee_data"],
                "message": "CV analysé avec succès"
            }
        else:
            raise HTTPException(
                status_code=422,
                detail=result["error"] or "Impossible d'analyser ce CV"
            )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Erreur inattendue upload CV : {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur : {str(e)}"
        )

    finally:
        _cleanup_temp_file(tmp_path)


@router.post(
    "/cv/save",
    summary="Uploader un CV et sauvegarder l'employé",
    description="""
    Upload un CV, extrait les données et les sauvegarde directement
    dans la base de données MongoDB.
    
    Retourne les données sauvegardées avec l'ID généré.
    """
)
async def upload_cv_and_save_employee(
    file: UploadFile = File(
        ...,
        description="CV au format PDF ou DOCX (max 10 MB)"
    )
):
    """
    Upload un CV, extrait les données et sauvegarde l'employé automatiquement.
    """
    tmp_path = None

    try:
        # Validation et sauvegarde temporaire
        _validate_file(file)
        tmp_path, file_size = await _save_temp_file(file)

        logger.info(f"📄 CV à sauvegarder : {file.filename}")

        # Parsing
        result = parse_cv(tmp_path, file.filename)

        if not result["success"]:
            raise HTTPException(
                status_code=422,
                detail=result["error"] or "Impossible d'analyser ce CV"
            )

        employee_data = result["employee_data"]

        # Enrichissement avant sauvegarde
        employee_data["employee_id"] = f"EMP-{uuid.uuid4().hex[:8].upper()}"
        employee_data["created_at"]  = datetime.utcnow().isoformat()
        employee_data["source"]      = "cv_upload"

        # Sauvegarde dans MongoDB
        employees_collection.insert_one(employee_data)
        clean_doc(employee_data)  # Supprimer l'_id MongoDB

        logger.success(f"✅ Employé créé depuis CV : {employee_data.get('employee_name')}")

        return {
            "success": True,
            "message": "Employé créé avec succès depuis le CV",
            "employee_id": employee_data["employee_id"],
            "employee_data": employee_data
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Erreur sauvegarde employé depuis CV : {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur serveur : {str(e)}"
        )

    finally:
        _cleanup_temp_file(tmp_path)