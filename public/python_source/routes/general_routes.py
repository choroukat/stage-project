from fastapi import APIRouter, HTTPException
from agents.general_agent import run_general_agent
# =============================================================
# GENERAL ROUTER — Endpoint pour l'agent IA RH global
# Préfixe : /general
# Cet agent croise les données employés + formations + certificats
# =============================================================
router = APIRouter(prefix="/general", tags=["General Agent"])
# =============================================================
# AI AGENT — Endpoint pour interroger l'agent général
# =============================================================
@router.post("/ask", summary="Interroger l'agent IA RH général")
def ask_general_agent(data: dict):
    """
    Envoie une question en langage naturel à l'agent IA général.
    L'agent RH global croise les données de toutes les collections
    (employés, formations, certificats) pour répondre à des questions
    complexes d'analyse et de recommandation.
    Exemples de questions :
    - "Quels sont les employés prêts pour une promotion ?"
    - "Quel est le meilleur employé pour un projet Python ?"
    - "Quels départements ont des gaps de compétences critiques ?"
    - "Compare Alice et Bob pour un projet Machine Learning"
    Body attendu :
    ```json
    { "question": "Quels employés sont sous-qualifiés dans le département IT ?" }
    ```
    """
    question = data.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    response = run_general_agent(question)
    return {
        "question": question,
        "response": response
    }
