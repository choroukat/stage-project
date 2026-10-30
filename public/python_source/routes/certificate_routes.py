from fastapi import APIRouter, HTTPException
from database.mongodb import get_collection
from agents.certificate_agent import run_certificate_agent

# =============================================================
# CERTIFICATE ROUTER
# CORRECTION CRITIQUE : /ask doit être déclaré AVANT /{certificate_id}
# =============================================================

router = APIRouter(prefix="/certificates", tags=["Certificates"])


# ── AI AGENT (EN PREMIER) ────────────────────────────────────
@router.post("/ask", summary="Interroger l'agent IA Certificats")
def ask_certificate_agent(data: dict):
    """
    Body : { "question": "Quels employés ont des certificats qui expirent dans 3 mois ?" }
    """
    question = data.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    response = run_certificate_agent(question)
    return {"question": question, "response": response}


# ── CRUD (APRÈS /ask) ─────────────────────────────────────────
@router.post("/add", summary="Ajouter un certificat")
def add_certificate(certificate: dict):
    if not certificate:
        raise HTTPException(status_code=400, detail="Certificate data is required")
    get_collection("certificates").insert_one(certificate)
    return {"message": "Certificate added successfully"}


@router.get("/", summary="Lister tous les certificats")
def get_certificates():
    return list(get_collection("certificates").find({}, {"_id": 0}))


# /{certificate_id} EN DERNIER
@router.get("/{certificate_id}", summary="Récupérer un certificat par ID")
def get_certificate(certificate_id: str):
    cert = get_collection("certificates").find_one({"certificate_id": certificate_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@router.delete("/{certificate_id}", summary="Supprimer un certificat par ID")
def delete_certificate(certificate_id: str):
    result = get_collection("certificates").delete_one({"certificate_id": certificate_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"message": "Certificate deleted successfully"}
