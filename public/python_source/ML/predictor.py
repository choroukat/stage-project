"""
ML/predictor.py
===============
Moteur principal : charge les modèles, construit les features, prédit.

Cas gérés :
  - Employé avec historique  → score_historique = moyenne réelle
  - Nouvel employé (0 certif) → score_historique = KNN sur pairs
"""

import os, sys, json, joblib
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

ML_DIR     = os.path.dirname(os.path.abspath(__file__))
BACK_DIR   = os.path.dirname(ML_DIR)
MODELS_DIR = os.path.join(ML_DIR, "models")
DATA_DIR   = os.path.join(ML_DIR, "data")

sys.path.insert(0, BACK_DIR)
sys.path.insert(0, ML_DIR)

from knn_profile import find_similar_employees   # notre nouveau module

# ─────────────────────────────────────────────────────────────────────────────
# CHARGEMENT DES MODÈLES (singleton au démarrage)
# ─────────────────────────────────────────────────────────────────────────────
def _load_model(fname: str):
    path = os.path.join(MODELS_DIR, fname)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Modèle manquant : {path}\n"
            f"Lance d'abord : python ML/train_models.py"
        )
    return joblib.load(path)

def _load_json(fname: str):
    path = os.path.join(MODELS_DIR, fname)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Fichier manquant : {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)

_model_cls = _load_model("classification_model.pkl")
_feat_cls  = _load_json("classification_features.json")
_model_reg = _load_model("regression_model.pkl")
_feat_reg  = _load_json("regression_features.json")

# ─────────────────────────────────────────────────────────────────────────────
# ACCÈS DONNÉES — MongoDB avec fallback CSV
# ─────────────────────────────────────────────────────────────────────────────
def _get_db():
    try:
        from database.mongodb import db
        return db
    except Exception:
        return None

def _get_employee(employee_id: str) -> dict | None:
    db = _get_db()
    if db is not None:
        emp = db["employees"].find_one({"employee_id": employee_id}, {"_id": 0})

        return emp
    # Fallback CSV
    path = os.path.join(DATA_DIR, "data_employees.csv")
    if not os.path.exists(path):
        return None
    df  = pd.read_csv(path, sep=";", encoding="utf-8")
    row = df[df["employee_id"] == employee_id]
    if len(row) == 0:
        return None
    r = row.iloc[0].to_dict()
    skill_cols = [c for c in df.columns if c.startswith("skill_")]
    r["skills"] = [
        str(r[c]).strip() for c in skill_cols
        if pd.notna(r.get(c)) and str(r.get(c)).strip() not in ("", "nan")
    ]
    r["skill_count"] = len(r["skills"])
    return r

def _get_employee_certs(employee_id: str) -> list:
    """Retourne uniquement les certifications terminées (issued ou failed)."""
    db = _get_db()
    if db is not None:
        certs = list(db["certificates"].find(
            {"employee_id": employee_id, "status": {"$in": ["issued", "failed"]}},
            {"_id": 0}
        ))

        return certs
    path = os.path.join(DATA_DIR, "data_certificates.csv")
    if not os.path.exists(path):
        return []
    df = pd.read_csv(path, sep=";", encoding="utf-8")
    rows = df[
        (df["employee_id"] == employee_id) &
        (df["status"].isin(["issued", "failed"]))
    ]
    return rows.to_dict("records")

def _get_all_employees_with_scores() -> list:
    """
    Retourne tous les employés qui ont au moins 1 certification terminée,
    avec leur score moyen calculé. Utilisé par le KNN.
    """
    db = _get_db()
    if db is not None:
        employees = list(db["employees"].find({}, {"_id": 0}))

    else:
        path = os.path.join(DATA_DIR, "data_employees.csv")
        if not os.path.exists(path):
            return []
        df = pd.read_csv(path, sep=";", encoding="utf-8")
        skill_cols = [c for c in df.columns if c.startswith("skill_")]
        employees = []
        for _, row in df.iterrows():
            r = row.to_dict()
            r["skills"] = [
                str(row[c]).strip() for c in skill_cols
                if pd.notna(row[c]) and str(row[c]).strip() not in ("", "nan")
            ]
            r["skill_count"] = len(r["skills"])
            employees.append(r)

    result = []
    for emp in employees:
        eid   = emp.get("employee_id")
        certs = _get_employee_certs(eid)
        if not certs:
            continue   # on n'inclut que les employés avec historique

        scores = []
        for c in certs:
            s = c.get("score_total") or c.get("score") or 0
            try:
                s = float(s)
                if s > 0:
                    scores.append(s)
            except (ValueError, TypeError):
                pass

        if not scores:
            continue

        result.append({
            "employee_id":   eid,
            "employee_name": emp.get("employee_name", eid),
            "department":    emp.get("department", ""),
            "skills":        emp.get("skills", []),
            "skill_count":   emp.get("skill_count", 0),
            "score_moyen":   round(float(np.mean(scores)), 2),
            "nb_certifs":    len(certs),
        })
    return result

# ─────────────────────────────────────────────────────────────────────────────
# CALCUL DU SCORE HISTORIQUE
# Point central de la correction du leakage.
# ─────────────────────────────────────────────────────────────────────────────
def _compute_historical_score(employee_id: str, employee: dict) -> tuple[float, str]:
    """
    Retourne (score_historique, explication_texte).

    Logique :
      1. Si l'employé a des certifs → moyenne de ses vrais scores
      2. Sinon → KNN sur les pairs (même département, skills proches)
      3. Sinon → moyenne du département
      4. Sinon → 70.0 (valeur neutre par défaut)
    """
    certs = _get_employee_certs(employee_id)

    # ── CAS 1 : employé avec historique ──────────────────────────────────────
    scores_reels = []
    for c in certs:
        s = c.get("score_total") or c.get("score") or 0
        try:
            s = float(s)
            if s > 0:
                scores_reels.append(s)
        except (ValueError, TypeError):
            pass

    if scores_reels:
        mean = round(float(np.mean(scores_reels)), 2)
        return mean, f"moyenne de {len(scores_reels)} certification(s) réelle(s)"

    # ── CAS 2 : nouvel employé → KNN ─────────────────────────────────────────
    target_skills = employee.get("skills", [])
    target_dept   = employee.get("department", "")

    all_with_scores = _get_all_employees_with_scores()
    if all_with_scores:
        knn_result = find_similar_employees(
            target_skills=target_skills,
            target_dept=target_dept,
            all_employees_with_scores=all_with_scores,
            k=5,
            same_dept_only=True,
        )
        if knn_result["nb_voisins"] > 0:
            return knn_result["score_estime"], knn_result["source"]

    # ── CAS 3 : moyenne brute du département ─────────────────────────────────
    dept_scores = [
        emp["score_moyen"] for emp in all_with_scores
        if emp.get("department") == target_dept
    ]
    if dept_scores:
        mean = round(float(np.mean(dept_scores)), 2)
        return mean, f"moyenne du département {target_dept} ({len(dept_scores)} employés)"

    # ── CAS 4 : valeur par défaut ─────────────────────────────────────────────
    return 70.0, "estimation par défaut (données insuffisantes)"

# ─────────────────────────────────────────────────────────────────────────────
# CONSTRUCTION DU VECTEUR DE FEATURES
# ─────────────────────────────────────────────────────────────────────────────
def _build_feature_vector(
    employee_id: str,
    feature_list: list,
    score_historique: float,
    duration_days: float = 30.0,
    provider: str = ""
) -> pd.DataFrame:
    """
    Construit le vecteur attendu par le modèle.
    Features disponibles AVANT la certification — pas de leakage.
    """
    employee = _get_employee(employee_id)
    if employee is None:
        raise ValueError(f"Employé introuvable : {employee_id}")

    certs   = _get_employee_certs(employee_id)
    row     = {col: 0 for col in feature_list}

    # Features numériques
    row["duree_formation_jours"] = float(duration_days)
    row["skill_count"]           = float(employee.get("skill_count", len(employee.get("skills", []))))
    row["nb_certifs_passees"]    = float(len(certs))

    # Dériver les 4 scores individuels à partir du score historique moyen.
    # Pondérations basées sur la structure réelle des certifications :
    #   homework   20 %  →  score * 1.00  (pas de bonus/malus relatif)
    #   assignment 20 %  →  score * 1.00
    #   quiz       20 %  →  score * 1.00
    #   exam       40 %  →  score * 1.00
    # On distribue proportionnellement de sorte que la moyenne pondérée
    # (0.2*hw + 0.2*asgn + 0.2*quiz + 0.4*exam) == score_historique.
    # La façon la plus neutre est d'affecter le même score à tous les composants,
    # ce qui respecte automatiquement toute pondération convexe :
    #   0.2*h + 0.2*a + 0.2*q + 0.4*e  =  score  si h=a=q=e=score ✓
    hist = float(score_historique)
    row["score_homework"]   = hist
    row["score_assignment"] = hist
    row["score_quiz"]       = hist
    row["score_exam"]       = hist

    # One-Hot département
    dept_col = f"dept_{employee.get('department', '')}"
    if dept_col in row:
        row[dept_col] = 1

    # One-Hot provider
    if provider:
        prov_col = f"provider_{provider}"
        if prov_col in row:
            row[prov_col] = 1

    return pd.DataFrame([row])[feature_list]

# ─────────────────────────────────────────────────────────────────────────────
# FONCTION PUBLIQUE 1 — predict_certification()
# ─────────────────────────────────────────────────────────────────────────────
def predict_certification(
    employee_id: str,
    cert_name: str,
    duration_days: float = 30.0,
    provider: str = ""
) -> dict:
    """
    Prédit la réussite et le score estimé pour une certification.
    Fonctionne pour TOUS les employés, y compris les nouveaux.

    Paramètres
    ----------
    employee_id   : "EMP-1158"
    cert_name     : "Docker & Kubernetes"
    duration_days : durée en jours (30 par défaut)
    provider      : "Coursera", "Microsoft", etc.

    Retourne un dict complet exploitable par l'agent.
    """
    employee = _get_employee(employee_id)
    if employee is None:
        raise ValueError(f"Employé introuvable : {employee_id}")

    # Récupérer durée et provider depuis MongoDB si non fournis
    if not provider or duration_days == 30.0:
        db = _get_db()
        if db is not None:
            t = db["trainings"].find_one(
                {"training_title": {"$regex": cert_name, "$options": "i"}},
                {"provider": 1, "duration_days": 1}
            )
            if t:
                if not provider:
                    provider = t.get("provider", "")
                if duration_days == 30.0 and t.get("duration_days"):
                    duration_days = float(t["duration_days"])
    

    # Score historique (cœur du système — KNN si nouvel employé)
    score_historique, source_score = _compute_historical_score(employee_id, employee)
    est_nouveau = len(_get_employee_certs(employee_id)) == 0

    # ── Classification ────────────────────────────────────────────────────────
    X_cls = _build_feature_vector(
        employee_id, _feat_cls, score_historique, duration_days, provider
    )
    proba       = _model_cls.predict_proba(X_cls)[0]
    proba_echec = float(proba[0])
    proba_reuss = float(proba[1])
    prediction  = "Réussite" if proba_reuss >= 0.5 else "Échec"

    # ── Régression ────────────────────────────────────────────────────────────
    X_reg = _build_feature_vector(
        employee_id, _feat_reg, score_historique, duration_days, provider
    )
    score_predit = float(np.clip(_model_reg.predict(X_reg)[0], 0, 100))

    # ── Feature importances pour l'explication ────────────────────────────────
    importances = _model_cls.named_steps["model"].feature_importances_
    top_feats = [
        feat for feat, _ in
        sorted(zip(_feat_cls, importances), key=lambda x: x[1], reverse=True)[:3]
    ]

    # ── Niveau de confiance ───────────────────────────────────────────────────
    conf = max(proba_reuss, proba_echec)
    if est_nouveau:
        niveau_confiance = "Faible (nouvel employé)"
    elif conf >= 0.85:
        niveau_confiance = "Élevé"
    elif conf >= 0.70:
        niveau_confiance = "Moyen"
    else:
        niveau_confiance = "Faible"

    # ── Alerte RH ─────────────────────────────────────────────────────────────
    if proba_reuss >= 0.80:
        alerte, alerte_label = "none", "Aucune action requise"
        recommandation = "L'employé est bien positionné pour réussir."
    elif proba_reuss >= 0.60:
        alerte, alerte_label = "watch", "À surveiller"
        recommandation = "Prévoir des ressources supplémentaires ou un suivi régulier."
    elif proba_reuss >= 0.40:
        alerte, alerte_label = "warning", "Risque modéré"
        recommandation = "Planifier un entretien. Envisager une préparation renforcée."
    else:
        alerte, alerte_label = "critical", "Risque critique"
        recommandation = "Intervention RH recommandée. Envisager une formation préparatoire d'abord."

    # ── Explication lisible pour le LLM ──────────────────────────────────────
    nom = employee.get("employee_name", employee_id)
    explication = (
        f"{nom} a {proba_reuss*100:.0f}% de chances de réussir '{cert_name}'. "
        f"Score estimé : {score_predit:.0f}/100. "
        f"Référence utilisée : {score_historique:.1f}/100 ({source_score}). "
        f"Facteurs principaux : {', '.join(top_feats)}."
    )
    if est_nouveau:
        explication += (
            " Attention : cet employé n'a pas encore de certifications — "
            "la prédiction est basée sur des pairs similaires et doit être "
            "interprétée avec prudence."
        )

    return {
        "employee_id":          employee_id,
        "employee_name":        nom,
        "certification":        cert_name,
        "probabilite_reussite": round(proba_reuss, 3),
        "probabilite_echec":    round(proba_echec, 3),
        "prediction_reussite":  prediction,
        "score_predit":         round(score_predit, 1),
        "score_historique":     score_historique,
        "source_score":         source_score,
        "niveau_confiance":     niveau_confiance,
        "alerte":               alerte,
        "alerte_label":         alerte_label,
        "recommandation":       recommandation,
        "est_nouveau_employe":  est_nouveau,
        "top_features":         top_feats,
        "explication":          explication,
    }

# ─────────────────────────────────────────────────────────────────────────────
# FONCTION PUBLIQUE 2 — predict_best_employees_for_project()
# ─────────────────────────────────────────────────────────────────────────────
def predict_best_employees_for_project(skills_requis: list, top_n: int = 5) -> list:
    """Trouve les N employés les plus compatibles avec un projet via cosine similarity."""
    db = _get_db()
    if db is not None:
        employees = list(db["employees"].find({}, {"_id": 0}))

    else:
        employees = _get_all_employees_with_scores()

    if not employees:
        return []

    all_skills = set(skills_requis)
    for emp in employees:
        all_skills.update(emp.get("skills", []))
    vocab = sorted(all_skills)

    project_vec = np.array(
        [1.0 if s in skills_requis else 0.0 for s in vocab]
    ).reshape(1, -1)

    resultats = []
    for emp in employees:
        emp_skills = emp.get("skills", [])
        if isinstance(emp_skills, str):
            emp_skills = [emp_skills]
        emp_vec = np.array(
            [1.0 if s in emp_skills else 0.0 for s in vocab]
        ).reshape(1, -1)
        score = float(cosine_similarity(emp_vec, project_vec)[0][0]) if emp_vec.sum() > 0 else 0.0

        resultats.append({
            "employee_id":         emp.get("employee_id"),
            "employee_name":       emp.get("employee_name"),
            "department":          emp.get("department"),
            "score_compatibilite": round(score * 100, 1),
            "skills_communs":      [s for s in emp_skills if s in skills_requis],
            "skills_manquants":    [s for s in skills_requis if s not in emp_skills],
        })

    resultats.sort(key=lambda x: x["score_compatibilite"], reverse=True)
    return resultats[:top_n]

# ─────────────────────────────────────────────────────────────────────────────
# FONCTION PUBLIQUE 3 — get_employee_ml_profile()
# ─────────────────────────────────────────────────────────────────────────────
def get_employee_ml_profile(employee_id: str) -> dict:
    """Profil ML complet d'un employé, avec indicateur nouvel employé."""
    employee = _get_employee(employee_id)
    if employee is None:
        raise ValueError(f"Employé introuvable : {employee_id}")

    certs          = _get_employee_certs(employee_id)
    score_hist, src = _compute_historical_score(employee_id, employee)
    issued  = sum(1 for c in certs if c.get("status") == "issued")
    failed  = sum(1 for c in certs if c.get("status") == "failed")
    ongoing = sum(1 for c in certs if c.get("status") == "in_progress")

    return {
        "employee_id":       employee_id,
        "employee_name":     employee.get("employee_name"),
        "department":        employee.get("department"),
        "skills":            employee.get("skills", []),
        "skill_count":       employee.get("skill_count", 0),
        "nb_certifications": len(certs),
        "issued_count":      issued,
        "failed_count":      failed,
        "in_progress_count": ongoing,
        "score_historique":  score_hist,
        "source_score":      src,
        "taux_reussite":     round(issued / max(1, issued + failed) * 100, 1),
        "est_nouveau":       len(certs) == 0,
        "certifications":    [
            {
                "titre":       c.get("training_title"),
                "status":      c.get("status"),
                "score_total": float(c.get("score_total") or c.get("score") or 0),
                "skill_acquis": c.get("skill_acquired"),
            }
            for c in certs
        ],
    }

def get_models_metrics() -> dict:
    metrics = {}
    for fname, key in [
        ("classification_metrics.json", "classification"),
        ("regression_metrics.json",     "regression"),
    ]:
        path = os.path.join(MODELS_DIR, fname)
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                metrics[key] = json.load(f)
        else:
            metrics[key] = None
    return metrics