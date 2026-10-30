"""
routes/history_routes.py
=========================
Endpoints pour la gestion de l'historique des actions.

L'historique enregistre TOUTES les actions effectuées sur la plateforme :
  - Ajout / suppression d'employés
  - Upload de CV
  - Ajout / suppression de formations
  - Envoi d'emails
  - Connexions / déconnexions
  - Questions posées aux chatbots

Routes disponibles :
  GET  /history/              → Liste de tous les logs (paginée)
  GET  /history/user/{email}  → Logs d'un utilisateur spécifique
  POST /history/log           → Enregistrer une action (appelé par le backend)
  DELETE /history/clear       → Vider l'historique (admin seulement)
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from database.mongodb import history_collection, clean_docs

router = APIRouter(
    prefix="/history",
    tags=["Historique des actions"]
)


# ================================================================
# HELPER — Enregistrer une action (utilisé internalement)
# ================================================================

def log_action(
    action: str,
    user_email: str,
    user_name: str,
    details: Optional[dict] = None,
    status: str = "success"
):
    """
    Enregistre une action dans l'historique MongoDB.

    Appelée depuis les autres routes pour tracer les actions.

    Args:
        action (str): Type d'action (ex: 'add_employee', 'delete_cert', 'send_email')
        user_email (str): Email de l'utilisateur qui a effectué l'action
        user_name (str): Nom de l'utilisateur
        details (dict): Informations supplémentaires sur l'action
        status (str): 'success' | 'failed' | 'pending'

    Exemples d'actions :
        log_action("add_employee", "hr1@nttdata.com", "HR User 1",
                   {"employee_name": "Alice Martin", "department": "IT"})
    """
    try:
        history_collection.insert_one({
            "action":      action,
            "user_email":  user_email,
            "user_name":   user_name,
            "details":     details or {},
            "status":      status,
            "timestamp":   datetime.utcnow(),
            "timestamp_str": datetime.utcnow().strftime("%d/%m/%Y à %H:%M:%S")
        })
    except Exception as e:
        logger.error(f"Erreur log action : {e}")


# ── Labels lisibles pour les actions ─────────────────────────
ACTION_LABELS = {
    "login":            "Connexion",
    "logout":           "Déconnexion",
    "add_employee":     "Ajout d'un employé",
    "delete_employee":  "Suppression d'un employé",
    "upload_cv":        "Upload d'un CV",
    "add_certificate":  "Ajout d'un certificat",
    "delete_certificate": "Suppression d'un certificat",
    "add_training":     "Ajout d'une formation",
    "delete_training":  "Suppression d'une formation",
    "send_email":       "Envoi d'un email",
    "bulk_email":       "Envoi groupé d'emails",
    "ask_general":      "Question à l'agent général",
    "ask_employee":     "Question à l'agent employés",
    "ask_certificate":  "Question à l'agent certificats",
    "ask_training":     "Question à l'agent formations",
}


# ================================================================
# ENDPOINTS
# ================================================================

@router.get(
    "/",
    summary="Lister tous les logs d'actions",
    description="Retourne l'historique paginé de toutes les actions effectuées sur la plateforme."
)
def get_all_history(
    limit: int  = Query(50,  ge=1, le=200, description="Nombre max d'entrées"),
    skip:  int  = Query(0,   ge=0,         description="Nombre d'entrées à ignorer (pagination)"),
    action: Optional[str] = Query(None,    description="Filtrer par type d'action"),
    status: Optional[str] = Query(None,    description="Filtrer par statut : success | failed")
):
    """
    Retourne l'historique de toutes les actions, du plus récent au plus ancien.
    Supporte la pagination et le filtrage par action ou statut.
    """
    query = {}

    if action:
        query["action"] = action
    if status:
        query["status"] = status

    logs = list(
        history_collection
        .find(query, {"_id": 0})
        .sort("timestamp", -1)
        .skip(skip)
        .limit(limit)
    )

    total = history_collection.count_documents(query)

    # Enrichir les logs avec les labels lisibles
    for log in logs:
        log["action_label"] = ACTION_LABELS.get(log.get("action", ""), log.get("action", ""))
        # Convertir le datetime en string s'il n'est pas déjà converti
        if isinstance(log.get("timestamp"), datetime):
            log["timestamp"] = log["timestamp"].isoformat()

    return {
        "total": total,
        "returned": len(logs),
        "skip": skip,
        "limit": limit,
        "logs": logs
    }


@router.get(
    "/user/{user_email}",
    summary="Lister les actions d'un utilisateur spécifique"
)
def get_user_history(
    user_email: str,
    limit: int = Query(50, ge=1, le=200)
):
    """
    Retourne l'historique des actions d'un utilisateur identifié par son email.

    Args:
        user_email: Email de l'utilisateur
        limit: Nombre maximum de résultats
    """
    logs = list(
        history_collection
        .find({"user_email": user_email}, {"_id": 0})
        .sort("timestamp", -1)
        .limit(limit)
    )

    for log in logs:
        log["action_label"] = ACTION_LABELS.get(log.get("action", ""), log.get("action", ""))
        if isinstance(log.get("timestamp"), datetime):
            log["timestamp"] = log["timestamp"].isoformat()

    return {
        "user_email": user_email,
        "total": len(logs),
        "logs": logs
    }


@router.post(
    "/log",
    summary="Enregistrer une action manuellement"
)
def log_action_endpoint(data: dict):
    """
    Enregistre une action dans l'historique.

    Body attendu :
    ```json
    {
        "action": "add_employee",
        "user_email": "hr1@nttdata.com",
        "user_name": "HR User 1",
        "details": { "employee_name": "Alice Martin" },
        "status": "success"
    }
    ```
    """
    action     = data.get("action", "").strip()
    user_email = data.get("user_email", "").strip()
    user_name  = data.get("user_name", "Unknown")

    if not action or not user_email:
        raise HTTPException(
            status_code=400,
            detail="Les champs 'action' et 'user_email' sont obligatoires"
        )

    log_action(
        action     = action,
        user_email = user_email,
        user_name  = user_name,
        details    = data.get("details"),
        status     = data.get("status", "success")
    )

    return {"message": "Action enregistrée dans l'historique"}


@router.get(
    "/stats",
    summary="Statistiques de l'historique"
)
def get_history_stats():
    """
    Retourne des statistiques sur les actions effectuées.
    Utile pour le tableau de bord.
    """
    total = history_collection.count_documents({})

    # Comptage par type d'action
    pipeline = [
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    by_action = list(history_collection.aggregate(pipeline))

    # Comptage par utilisateur
    pipeline_user = [
        {"$group": {"_id": "$user_email", "count": {"$sum": 1}, "name": {"$first": "$user_name"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    by_user = list(history_collection.aggregate(pipeline_user))

    return {
        "total_actions": total,
        "by_action": [
            {
                "action": item["_id"],
                "label": ACTION_LABELS.get(item["_id"], item["_id"]),
                "count": item["count"]
            }
            for item in by_action
        ],
        "by_user": [
            {
                "email": item["_id"],
                "name": item["name"],
                "count": item["count"]
            }
            for item in by_user
        ]
    }


@router.delete(
    "/clear",
    summary="Vider l'historique (admin seulement)"
)
def clear_history():
    """
    Supprime tous les logs de l'historique.
    ⚠️ Action irréversible — à utiliser avec précaution.
    """
    result = history_collection.delete_many({})
    logger.warning(f"⚠️ Historique vidé — {result.deleted_count} entrées supprimées")

    return {
        "message": f"Historique vidé : {result.deleted_count} entrées supprimées"
    }