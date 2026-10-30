"""
routes/prediction_routes.py  — VERSION CORRIGÉE
=================================================
Endpoints ML exposés au dashboard Manager.

Endpoints :
  POST /predict/employee       → prédiction directe (employé + formation)
  POST /predict/recommend      → recommandations de formation par département
  GET  /predict/profile/:id    → profil ML complet d'un employé
  GET  /predict/metrics        → métriques des modèles (accuracy, R², MAE…)
  GET  /predict/health         → vérifie que les .pkl existent
  POST /predict/ask            → chatbot agent IA (langage naturel)

CORRECTION par rapport à l'ancienne version :
  - Le router s'appelait "router" mais main.py l'importait comme "prediction_router" → CORRIGÉ
  - Les 3 endpoints /score /success /recommend n'existaient pas → REMPLACÉS
    par /employee (score + réussite ensemble) et /recommend (par employé)
  - prediction_chat_routes.py créait un doublon de /predict/ask → À SUPPRIMER
"""

import os, sys
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

# ── Nom corrigé : "prediction_router" (main.py fait : from ... import prediction_router)
prediction_router = APIRouter(prefix="/predict", tags=["Prédictions ML"])


# ─────────────────────────────────────────────────────────────────────────────
# Imports lazy — les modèles .pkl ne se chargent qu'au premier appel
# ─────────────────────────────────────────────────────────────────────────────
def _get_predictor():
    ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ML")
    sys.path.insert(0, ML_DIR)
    from predictor import predict_certification, get_employee_ml_profile, get_models_metrics
    return predict_certification, get_employee_ml_profile, get_models_metrics

def _get_agent():
    from agents.prediction_agent import run_prediction_agent
    return run_prediction_agent

def _resolve_employee(db, id_or_name: str) -> str:
    """
    Accepte un employee_id ('EMP-1158') ou un nom ('Alice').
    Retourne toujours l'employee_id.
    Lève ValueError si introuvable.
    """
    id_or_name = id_or_name.strip()
    if id_or_name.upper().startswith("EMP-"):
        return id_or_name
    # Résolution par nom
    emp = db["employees"].find_one(
        {"employee_name": {"$regex": id_or_name, "$options": "i"}},
        {"_id": 0, "employee_id": 1}
    )
    if not emp:
        raise ValueError(f"Employé introuvable : '{id_or_name}'. Utilisez l'ID (EMP-XXXX) ou le nom exact.")
    return emp["employee_id"]


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMAS
# ─────────────────────────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    """
    Formulaire Prédiction — onglet 1 du dashboard.
    Le manager saisit l'employé et la formation.
    Le modèle retourne : réussite (oui/non) + score prédit + niveau d'alerte.
    """
    employee_id: str               # "EMP-1158" ou nom "Alice Dupont"
    cert_name:   str               # "Docker & Kubernetes"
    duration_days: Optional[float] = 30.0
    provider:      Optional[str]   = ""

    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "employee_id": "EMP-1158",
                    "cert_name":   "Docker & Kubernetes",
                    "duration_days": 45,
                    "provider":    "MongoDB University"
                }
            ]
        }


class RecommendRequest(BaseModel):
    """
    Formulaire Recommandations — onglet 2 du dashboard.
    Le manager saisit l'employé (ID ou nom) + département.
    Le modèle retourne les formations à faire pour progresser dans ce département.
    """
    employee_id: str               # "EMP-1158" ou "Charaf Filali"
    department:  Optional[str] = ""  # Si vide → on prend celui de l'employé en base

    class Config:
        json_schema_extra = {
            "examples": [
                {"employee_id": "EMP-1000", "department": "Data & AI"},
                {"employee_id": "Aicha Benkiran", "department": ""},
            ]
        }


class AgentQuery(BaseModel):
    """Chatbot IA — question en langage naturel."""
    question: str

    class Config:
        json_schema_extra = {
            "examples": [
                {"question": "Est-ce que EMP-1158 va réussir la certification Docker & Kubernetes ?"},
                {"question": "Quelle formation recommandes-tu à Aicha Benkiran ?"},
                {"question": "Qui sont les meilleurs pour un projet Python, Docker, AWS ?"},
            ]
        }


# ─────────────────────────────────────────────────────────────────────────────
# POST /predict/employee  — Prédiction réussite + score
# ─────────────────────────────────────────────────────────────────────────────
@prediction_router.post(
    "/employee",
    summary="Prédire la réussite et le score d'un employé pour une formation"
)
async def predict_employee(body: PredictionRequest):
    """
    Appelle les deux modèles ML :
    - RandomForest (classification) → réussira / échouera + probabilité
    - GradientBoosting (régression) → score prédit sur 100

    Fonctionne pour tous les employés, y compris les nouveaux (KNN fallback).
    Accepte l'employee_id OU le nom complet de l'employé.
    """
    predict_fn, _, _ = _get_predictor()

    # Résolution nom → ID si nécessaire
    employee_id = body.employee_id.strip()
    if not employee_id.upper().startswith("EMP-"):
        try:
            from database.mongodb import db
            employee_id = _resolve_employee(db, employee_id)
        except Exception as e:
            raise HTTPException(status_code=404, detail=str(e))

    try:
        result = predict_fn(
            employee_id=employee_id,
            cert_name=body.cert_name,
            duration_days=body.duration_days or 30.0,
            provider=body.provider or "",
        )
        return {"status": "ok", "data": result}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Modèles ML non entraînés. Lance d'abord : python ML/train_models.py. Détail : {e}"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur prédiction : {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# POST /predict/recommend  — Recommandations de formation
# ─────────────────────────────────────────────────────────────────────────────
@prediction_router.post(
    "/recommend",
    summary="Recommander des formations pour progresser dans un département"
)
async def predict_recommend(body: RecommendRequest):
    """
    Logique :
    1. Récupère les compétences actuelles de l'employé depuis MongoDB
    2. Compare avec les compétences requises pour son département
    3. Identifie les skills manquants
    4. Cherche les formations disponibles pour ces skills
    5. Prédit la probabilité de réussite pour chaque formation (modèle ML)
    6. Retourne le top 3 trié par probabilité de réussite décroissante

    Accepte employee_id OU nom de l'employé.
    Si department est vide → utilise celui enregistré en base.
    """
    try:
        from database.mongodb import db
        from tools.prediction_tools import tool_recommend_best_certification
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Connexion base de données impossible : {e}")

    # Résolution employé
    try:
        employee_id = _resolve_employee(db, body.employee_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Récupération des données employé
    emp = db["employees"].find_one({"employee_id": employee_id}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employé introuvable : {employee_id}")

    current_skills = emp.get("skills", [])
    department     = body.department.strip() if body.department else emp.get("department", "")
    employee_name  = emp.get("employee_name", employee_id)

    # Map département → compétences cibles
    dept_skills_map = {
        "Data & AI":             ["Python", "SQL", "Machine Learning", "Deep Learning", "MongoDB", "Data Visualization"],
        "Software Engineering":  ["Git", "Docker", "Kubernetes", "MongoDB", "API Development"],
        "RH & Learning":         ["Communication", "Recruitment", "HR Analytics"],
        "HR & Learning":         ["Communication", "Recruitment", "HR Analytics"],
        "Finance & Controlling": ["Excel", "Risk Analysis", "Financial Modeling"],
        "Cloud & DevOps":        ["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
        "Cloud & Infrastructure":["Docker", "Kubernetes", "AWS", "Terraform", "CI/CD"],
        "Cybersecurity":         ["Network Security", "Penetration Testing", "SIEM"],
        "Infrastructure":        ["Linux", "VMware", "Networking", "Ansible"],
        "Sales":                 ["CRM", "Negotiation", "Presentation Skills"],
        "Management":            ["Leadership", "Project Management", "Agile", "Scrum"],
    }

    required_skills = dept_skills_map.get(department, [])
    missing_skills  = [s for s in required_skills if s not in current_skills]

    if not missing_skills:
        return {
            "status": "ok",
            "data": {
                "employee_id":       employee_id,
                "employee_name":     employee_name,
                "department":        department,
                "skills_actuels":    current_skills,
                "skills_manquants":  [],
                "message":           "Cet employé possède déjà toutes les compétences clés pour son département.",
                "recommendations":   []
            }
        }

    # Chercher les formations disponibles pour les skills manquants
    train_col = db["trainings"]
    predict_fn, _, _ = _get_predictor()
    recommendations  = []

    for skill in missing_skills[:4]:
        trainings = list(train_col.find(
            {"skill_acquired": {"$regex": skill, "$options": "i"}},
            {"_id": 0, "training_title": 1, "provider": 1, "skill_acquired": 1, "duration_days": 1}
        ).limit(2))

        for t in trainings:
            cert_name = t.get("training_title", "")
            if not cert_name:
                continue
            try:
                pred = predict_fn(
                    employee_id=employee_id,
                    cert_name=cert_name,
                    duration_days=float(t.get("duration_days") or 30),
                    provider=t.get("provider", ""),
                )
                recommendations.append({
                    "training_title":   cert_name,
                    "provider":         t.get("provider", ""),
                    "skill_suggested":  t.get("skill_acquired", skill),
                    "skill_manquant":   skill,
                    "will_succeed":     pred.get("will_succeed", False),
                    "probability":      pred.get("probabilite_reussite", 0),
                    "predicted_score":  pred.get("score_predit", 0),
                    "alert_level":      pred.get("alerte", "watch"),
                    "conseil":          pred.get("recommandation", ""),
                    "confidence":       int(pred.get("probabilite_reussite", 0) * 100),
                })
            except Exception:
                continue

    # Trier par probabilité décroissante
    recommendations.sort(key=lambda x: x["probability"], reverse=True)

    return {
        "status": "ok",
        "data": {
            "employee_id":      employee_id,
            "employee_name":    employee_name,
            "department":       department,
            "skills_actuels":   current_skills,
            "skills_manquants": missing_skills,
            "recommendations":  recommendations[:3],
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# GET /predict/profile/{employee_id}
# ─────────────────────────────────────────────────────────────────────────────
@prediction_router.get(
    "/profile/{employee_id}",
    summary="Profil ML complet d'un employé"
)
async def get_profile(employee_id: str):
    """
    Retourne : skills, certifications passées, score historique,
    taux de réussite, indicateur nouvel employé.
    """
    _, get_profile_fn, _ = _get_predictor()
    try:
        return get_profile_fn(employee_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# GET /predict/metrics  — Performance des modèles ML
# ─────────────────────────────────────────────────────────────────────────────
@prediction_router.get(
    "/metrics",
    summary="Métriques de performance des modèles ML entraînés"
)
async def get_metrics():
    """
    Retourne les métriques sauvegardées lors du dernier entraînement :
    - Classification : accuracy, F1-score, matrice de confusion, CV F1
    - Régression : R², MAE, CV R²

    Si les modèles ne sont pas encore entraînés → retourne null pour chaque clé.
    """
    _, _, get_metrics_fn = _get_predictor()
    return get_metrics_fn()


# ─────────────────────────────────────────────────────────────────────────────
# GET /predict/health
# ─────────────────────────────────────────────────────────────────────────────
@prediction_router.get(
    "/health",
    summary="Vérifier que les modèles ML sont entraînés et disponibles"
)
async def health_check():
    ML_DIR = os.path.join(os.path.dirname(__file__), "..", "ML", "models")
    models = {
        "classification_model.pkl":  "Modèle réussite/échec (RandomForest)",
        "regression_model.pkl":      "Modèle score prédit (GradientBoosting)",
        "classification_metrics.json": "Métriques classification",
        "regression_metrics.json":   "Métriques régression",
    }
    status = {
        name: os.path.exists(os.path.join(ML_DIR, name))
        for name in models
    }
    all_ok = all(status.values())
    return {
        "status": "healthy" if all_ok else "degraded — lance python ML/train_models.py",
        "models": {
            name: ("OK" if ok else "MANQUANT — lance python ML/train_models.py")
            for name, ok in status.items()
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# POST /predict/ask  — Chatbot agent IA
# ─────────────────────────────────────────────────────────────────────────────
@prediction_router.post(
    "/ask",
    summary="Chatbot IA — question en langage naturel"
)
async def ask_prediction_agent(body: AgentQuery):
    """
    L'agent LangChain (LLaMA 70B via Groq) reçoit la question,
    choisit le bon outil ML, et retourne une réponse en français.

    Questions supportées :
    - "Est-ce que EMP-1158 va réussir la certification Docker ?"
    - "Quel score va obtenir Aicha pour Python ?"
    - "Montre le profil ML de EMP-0042"
    - "Recommande une certification à Charaf Filali"
    - "Qui sont les meilleurs pour un projet Python, Docker, AWS ?"
    """
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="La question ne peut pas être vide.")

    run_agent = _get_agent()
    try:
        result = run_agent(question)
        return {"question": question, "response": result, "status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur agent : {str(e)}")