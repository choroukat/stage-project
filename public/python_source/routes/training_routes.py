from fastapi import APIRouter, HTTPException
from database.mongodb import get_collection
from agents.training_agent import run_training_agent

# =============================================================
# TRAINING ROUTER
# CORRECTION CRITIQUE : /ask doit être déclaré AVANT /{training_id}
# =============================================================

router = APIRouter(prefix="/trainings", tags=["Trainings"])


# ── AI AGENT (EN PREMIER) ────────────────────────────────────
@router.post("/ask", summary="Interroger l'agent IA Formations")
def ask_training_agent(data: dict):
    """
    Body : { "question": "Quelles formations sont disponibles pour Python ?" }
    """
    question = data.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    response = run_training_agent(question)
    return {"question": question, "response": response}


# ── CRUD (APRÈS /ask) ─────────────────────────────────────────
@router.post("/add", summary="Ajouter une formation")
def add_training(training: dict):
    if not training:
        raise HTTPException(status_code=400, detail="Training data is required")
    get_collection("trainings").insert_one(training)
    return {"message": "Training added successfully"}


@router.get("/", summary="Lister toutes les formations")
def get_trainings():
    return list(get_collection("trainings").find({}, {"_id": 0}))


# /{training_id} EN DERNIER
@router.get("/{training_id}", summary="Récupérer une formation par ID")
def get_training(training_id: str):
    tr = get_collection("trainings").find_one({"training_id": training_id}, {"_id": 0})
    if not tr:
        raise HTTPException(status_code=404, detail="Training not found")
    return tr


@router.delete("/{training_id}", summary="Supprimer une formation par ID")
def delete_training(training_id: str):
    result = get_collection("trainings").delete_one({"training_id": training_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Training not found")
    return {"message": "Training deleted successfully"}