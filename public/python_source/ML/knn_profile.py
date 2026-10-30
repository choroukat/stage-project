"""
ML/knn_profile.py
=================
Module KNN pour estimer le score historique d'un employé sans historique.

ALGORITHME :
  1. Charger tous les employés ayant au moins 1 certification terminée
  2. Convertir chaque employé en vecteur binaire de skills (vocabulaire commun)
  3. Calculer la similarité cosinus entre l'employé cible et tous les autres
  4. Filtrer : même département en priorité, sinon tous
  5. Prendre les K plus proches (K=5 par défaut)
  6. Retourner la moyenne pondérée de leurs scores (poids = similarité)

UTILISÉ PAR : predictor.py → _compute_historical_score()
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


def find_similar_employees(
    target_skills: list,
    target_dept: str,
    all_employees_with_scores: list,
    k: int = 5,
    same_dept_only: bool = True
) -> dict:
    """
    Trouve les K employés les plus similaires à un employé cible
    et retourne un score historique estimé par moyenne pondérée.

    Paramètres
    ----------
    target_skills : list
        Liste de skills de l'employé cible, ex. ["Python", "SQL", "Docker"]

    target_dept : str
        Département de l'employé cible, ex. "Data & AI"

    all_employees_with_scores : list
        Liste de dicts, chacun ayant :
          - "employee_id"  : str
          - "employee_name": str
          - "skills"       : list
          - "department"   : str
          - "score_moyen"  : float  (moyenne réelle de ses certifications)

    k : int
        Nombre de voisins à considérer (défaut : 5)

    same_dept_only : bool
        Si True, filtre d'abord sur le même département.
        Si aucun voisin trouvé dans le département, élargit à tous.

    Retourne
    --------
    dict avec :
      - "score_estime"     : float  (score proxy pour le modèle ML)
      - "nb_voisins"       : int    (nombre de voisins effectivement utilisés)
      - "voisins"          : list   (détail des K voisins trouvés)
      - "source"           : str    (explication lisible pour le manager)
      - "dept_filtre"      : bool   (True si filtré sur le département)
    """
    if not all_employees_with_scores:
        return {
            "score_estime": 70.0,
            "nb_voisins": 0,
            "voisins": [],
            "source": "aucun pair disponible — valeur par défaut utilisée",
            "dept_filtre": False,
        }

    # ── Construire le vocabulaire global de skills ────────────────────────────
    all_skills_set = set(target_skills)
    for emp in all_employees_with_scores:
        all_skills_set.update(emp.get("skills", []))
    vocab = sorted(all_skills_set)

    if not vocab:
        return {
            "score_estime": 70.0,
            "nb_voisins": 0,
            "voisins": [],
            "source": "vocabulaire de skills vide",
            "dept_filtre": False,
        }

    # ── Vecteur de l'employé cible ────────────────────────────────────────────
    target_vec = np.array(
        [1.0 if s in target_skills else 0.0 for s in vocab]
    ).reshape(1, -1)

    # ── Filtrage par département ──────────────────────────────────────────────
    candidates = [
        emp for emp in all_employees_with_scores
        if emp.get("department") == target_dept
    ] if same_dept_only else all_employees_with_scores

    # Fallback : si trop peu de candidats dans le département, élargir
    if len(candidates) < k:
        candidates = all_employees_with_scores
        dept_filtre = False
    else:
        dept_filtre = same_dept_only

    # ── Calcul de la similarité cosinus pour chaque candidat ─────────────────
    scored = []
    for emp in candidates:
        emp_skills = emp.get("skills", [])
        emp_vec = np.array(
            [1.0 if s in emp_skills else 0.0 for s in vocab]
        ).reshape(1, -1)

        if emp_vec.sum() == 0:
            sim = 0.0
        else:
            sim = float(cosine_similarity(target_vec, emp_vec)[0][0])

        scored.append({
            "employee_id":   emp.get("employee_id"),
            "employee_name": emp.get("employee_name"),
            "department":    emp.get("department"),
            "similarite":    round(sim, 3),
            "score_moyen":   emp.get("score_moyen", 70.0),
            "skills":        emp_skills,
        })

    # ── Trier par similarité décroissante et prendre les K meilleurs ──────────
    scored.sort(key=lambda x: x["similarite"], reverse=True)
    top_k = [e for e in scored[:k] if e["similarite"] > 0]

    if not top_k:
        return {
            "score_estime": 70.0,
            "nb_voisins": 0,
            "voisins": [],
            "source": "aucun voisin avec skills communs — valeur par défaut",
            "dept_filtre": dept_filtre,
        }

    # ── Moyenne PONDÉRÉE par similarité ──────────────────────────────────────
    # Un voisin avec similarité 0.9 pèse plus qu'un voisin à 0.3
    similarities = np.array([e["similarite"] for e in top_k])
    scores       = np.array([e["score_moyen"] for e in top_k])

    if similarities.sum() == 0:
        score_estime = float(np.mean(scores))
    else:
        score_estime = float(np.average(scores, weights=similarities))

    score_estime = round(score_estime, 2)

    # ── Construction de la réponse ────────────────────────────────────────────
    noms_voisins = [e["employee_name"] for e in top_k[:3]]
    source = (
        f"estimation basée sur {len(top_k)} collègue(s) similaire(s) "
        f"({', '.join(noms_voisins)}{'...' if len(top_k) > 3 else ''})"
        + (f" dans {target_dept}" if dept_filtre else " — tous départements")
    )

    return {
        "score_estime": score_estime,
        "nb_voisins":   len(top_k),
        "voisins":      top_k,
        "source":       source,
        "dept_filtre":  dept_filtre,
    }