# =============================================================================
# Backend/ML/preprocessing.py
#
# Rôle : Charger les données depuis MongoDB Atlas (ou CSV en fallback),
#        nettoyer, fusionner les 3 collections, et produire les DataFrames
#        prêts pour l'entraînement des modèles ML.
#
# Utilisé par : train_models.py
# =============================================================================

import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime

# ── Chemins ──────────────────────────────────────────────────────────────────
ML_DIR   = os.path.dirname(os.path.abspath(__file__))          # Backend/ML/
BACK_DIR = os.path.dirname(ML_DIR)                             # Backend/
DATA_DIR = os.path.join(ML_DIR, "data")                        # Backend/ML/data/
MODELS_DIR = os.path.join(ML_DIR, "models")                    # Backend/ML/models/

os.makedirs(MODELS_DIR, exist_ok=True)


# =============================================================================
# ÉTAPE 1 — CHARGEMENT DES DONNÉES
# MongoDB Atlas en priorité, CSV local en fallback automatique
# =============================================================================

def _load_from_mongo(collection: str) -> pd.DataFrame | None:
    """
    Tente de charger une collection MongoDB.
    Retourne None si la connexion échoue → on utilise le CSV.
    """
    try:
        sys.path.insert(0, BACK_DIR)
        from database.mongodb import db
        docs = list(db[collection].find({}, {"_id": 0}))
        if not docs:
            return None
        df = pd.DataFrame(docs)
        print(f"  [MongoDB] '{collection}' : {len(df)} documents chargés")
        return df
    except Exception as e:
        print(f"  [MongoDB] Non disponible ({e}) — fallback CSV")
        return None


def load_certificates() -> pd.DataFrame:
    """Charge la collection certificates."""
    df = _load_from_mongo("certificates")
    if df is None:
        path = os.path.join(DATA_DIR, "data_certificates.csv")
        df = pd.read_csv(path, sep=";", encoding="utf-8")
        print(f"  [CSV] certificates : {len(df)} lignes")
    return df


def load_employees() -> pd.DataFrame:
    """Charge la collection employees."""
    df = _load_from_mongo("employees")
    if df is None:
        path = os.path.join(DATA_DIR, "data_employees.csv")
        df = pd.read_csv(path, sep=";", encoding="utf-8")
        print(f"  [CSV] employees : {len(df)} lignes")
    return df


def load_trainings() -> pd.DataFrame:
    """Charge la collection trainings."""
    df = _load_from_mongo("trainings")
    if df is None:
        path = os.path.join(DATA_DIR, "data_trainings.csv")
        df = pd.read_csv(path, sep=";", encoding="utf-8")
        print(f"  [CSV] trainings : {len(df)} lignes")
    return df


# =============================================================================
# ÉTAPE 2 — NETTOYAGE ET FUSION
# On croise les 3 collections pour créer une table plate d'entraînement.
# Chaque ligne = 1 certificat terminé (issued ou failed) avec toutes ses infos.
# =============================================================================

def build_training_dataframe() -> pd.DataFrame:
    """
    Charge, nettoie et fusionne les 3 collections.
    Retourne un DataFrame propre avec toutes les features + labels.

    IMPORTANT : on garde seulement 'issued' et 'failed'.
    'in_progress' et 'pending' sont exclus car on ne connaît pas leur résultat.
    """
    print("\n[1/4] Chargement des données...")
    df_certs  = load_certificates()
    df_emps   = load_employees()

    # ── Normalisation des noms de colonnes ───────────────────────────────────
    # MongoDB peut retourner des noms différents du CSV — on uniformise
    df_certs.columns  = [c.lower().strip() for c in df_certs.columns]
    df_emps.columns   = [c.lower().strip() for c in df_emps.columns]

    print("\n[2/4] Nettoyage des certificats...")

    # Garder uniquement issued et failed (résultats connus)
    df = df_certs[df_certs["status"].isin(["issued", "failed"])].copy()
    print(f"  issued: {(df['status']=='issued').sum()} | failed: {(df['status']=='failed').sum()}")

    # ── Conversion des scores en float ───────────────────────────────────────
    for col in ["score", "homework_score", "assignment_score", "quiz_score", "exam_score"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0)

    # ── Calcul de la durée de formation (en jours) ───────────────────────────
    # Format des dates : DD/MM/YYYY
    def parse_date(s):
        if pd.isna(s) or str(s).strip() == "":
            return pd.NaT
        for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S"]:
            try:
                return pd.to_datetime(s, format=fmt)
            except Exception:
                pass
        return pd.NaT

    df["start_dt"] = df["start_date"].apply(parse_date)
    df["end_dt"]   = df["end_date"].apply(parse_date)

    df["duration_days"] = (df["end_dt"] - df["start_dt"]).dt.days
    df["duration_days"] = df["duration_days"].clip(lower=0).fillna(30)

    print("\n[3/4] Fusion avec les profils employés...")

    # ── Calcul du skill_count depuis employees ────────────────────────────────
    # Les skills sont dans skill_1 ... skill_10 (CSV) ou skills[] (MongoDB)
    skill_cols = [c for c in df_emps.columns if c.startswith("skill_")]

    if skill_cols:
        # Format CSV : colonnes skill_1 ... skill_10
        def count_skills(row):
            return sum(1 for c in skill_cols if pd.notna(row.get(c)) and str(row.get(c)).strip() != "")
        df_emps["skill_count"] = df_emps.apply(count_skills, axis=1)

        def get_skills_list(row):
            return [str(row[c]).strip() for c in skill_cols
                    if pd.notna(row.get(c)) and str(row.get(c)).strip() != ""]
        df_emps["skills_list"] = df_emps.apply(get_skills_list, axis=1)

    elif "skills" in df_emps.columns:
        # Format MongoDB : colonne 'skills' contient une liste
        df_emps["skills_list"] = df_emps["skills"].apply(
            lambda x: x if isinstance(x, list) else []
        )
        df_emps["skill_count"] = df_emps["skills_list"].apply(len)
    else:
        df_emps["skill_count"] = 0
        df_emps["skills_list"] = [[] for _ in range(len(df_emps))]

    # Garder seulement employee_id + skill_count pour la fusion
    df_emp_mini = df_emps[["employee_id", "skill_count"]].drop_duplicates("employee_id")
    df = df.merge(df_emp_mini, on="employee_id", how="left")
    df["skill_count"] = df["skill_count"].fillna(5)  # valeur médiane par défaut

    # ── Calcul du nb de certifications passées avant celle-ci ────────────────
    # Pour chaque ligne, compter combien de certs cet employé a DÉJÀ eu
    cert_count = (
        df_certs[df_certs["status"].isin(["issued", "failed"])]
        .groupby("employee_id")
        .size()
        .reset_index(name="nb_certifs_passees")
    )
    df = df.merge(cert_count, on="employee_id", how="left")
    df["nb_certifs_passees"] = df["nb_certifs_passees"].fillna(1)

    print("\n[4/4] Construction des features finales...")

    # ── Nettoyage des colonnes catégorielles ─────────────────────────────────
    df["department"] = df["department"].fillna("Unknown").str.strip()
    df["provider"]   = df["provider"].fillna("Unknown").str.strip()

    # ── Label binaire pour la classification ─────────────────────────────────
    # issued = 1 (réussite), failed = 0 (échec)
    df["label"] = (df["status"] == "issued").astype(int)

    # ── Sélection des colonnes finales ───────────────────────────────────────
    features_base = [
        "homework_score",    # score devoirs (0-100)
        "assignment_score",  # score travaux pratiques (0-100)
        "quiz_score",        # score quiz (0-100)
        "exam_score",        # score examen (0-100)
        "duration_days",     # durée de la formation en jours
        "skill_count",       # nb de skills de l'employé
        "nb_certifs_passees",# expérience en certifications
        "department",        # département (catégorielle → One-Hot)
        "provider",          # organisme de formation (catégorielle → One-Hot)
    ]

    df_final = df[features_base + ["score", "label", "employee_id", "status"]].copy()
    df_final = df_final.dropna(subset=["homework_score", "quiz_score", "exam_score"])

    print(f"  Dataset final : {len(df_final)} lignes × {len(features_base)} features")
    print(f"  issued={df_final['label'].sum()} | failed={(df_final['label']==0).sum()}")

    return df_final


# =============================================================================
# ÉTAPE 3 — PRÉPARATION POUR CHAQUE MODÈLE
# Ces fonctions sont appelées par train_models.py
# =============================================================================

def prepare_classification(df: pd.DataFrame):
    """
    Prépare X et y pour le modèle de classification (issued / failed).

    Retourne :
        X          : DataFrame avec features encodées (One-Hot pour dept/provider)
        y          : Series 0/1
        feat_names : liste des noms de colonnes dans l'ordre exact
    """
    features_num = [
        "homework_score", "assignment_score", "quiz_score",
        "exam_score", "duration_days", "skill_count", "nb_certifs_passees"
    ]
    features_cat = ["department", "provider"]

    X_num = df[features_num].copy()
    X_cat = pd.get_dummies(df[features_cat], prefix=features_cat, dtype=int)
    X = pd.concat([X_num, X_cat], axis=1)

    y = df["label"]

    feat_names = list(X.columns)
    return X, y, feat_names


def prepare_regression(df: pd.DataFrame):
    """
    Prépare X et y pour le modèle de régression (prédire le score final).
    On utilise seulement les scores INTERMÉDIAIRES (pas le score final)
    pour prédire le score total — sinon c'est de la triche.

    Retourne :
        X          : DataFrame avec features encodées
        y          : Series (score final 0-100)
        feat_names : liste des noms de colonnes
    """
    features_num = [
        "homework_score", "assignment_score", "quiz_score",
        "duration_days", "skill_count", "nb_certifs_passees"
        # exam_score EXCLU ici — trop corrélé au score final,
        # en pratique on ne le connaît pas encore quand on prédit
    ]
    features_cat = ["department", "provider"]

    X_num = df[features_num].copy()
    X_cat = pd.get_dummies(df[features_cat], prefix=features_cat, dtype=int)
    X = pd.concat([X_num, X_cat], axis=1)

    y = df["score"]  # score total réel (label pour la régression)

    feat_names = list(X.columns)
    return X, y, feat_names


# =============================================================================
# UTILITAIRE — Vocabulaire des skills (pour le recommandeur)
# =============================================================================

def build_skills_vocabulary() -> list:
    """
    Construit la liste de TOUS les skills uniques présents chez les employés.
    Utilisé par le recommandeur (similarité cosinus).
    """
    df_emps = load_employees()
    df_emps.columns = [c.lower().strip() for c in df_emps.columns]

    skill_cols = [c for c in df_emps.columns if c.startswith("skill_")]
    all_skills = set()

    if skill_cols:
        for col in skill_cols:
            vals = df_emps[col].dropna().astype(str).str.strip()
            all_skills.update(v for v in vals if v not in ("", "nan"))
    elif "skills" in df_emps.columns:
        for skills_list in df_emps["skills"]:
            if isinstance(skills_list, list):
                all_skills.update(skills_list)

    return sorted(all_skills)


# =============================================================================
# TEST RAPIDE — Lance ce fichier directement pour vérifier
# python Backend/ML/preprocessing.py
# =============================================================================

if __name__ == "__main__":
    print("=" * 55)
    print("  TEST PREPROCESSING")
    print("=" * 55)

    df = build_training_dataframe()

    print("\n─── Aperçu du dataset ───")
    print(df.head(3).to_string())

    print("\n─── Statistiques des features numériques ───")
    num_cols = ["homework_score", "assignment_score", "quiz_score",
                "exam_score", "duration_days", "skill_count"]
    print(df[num_cols].describe().round(2).to_string())

    X_cls, y_cls, feat_cls = prepare_classification(df)
    print(f"\n─── Classification ───")
    print(f"  X shape : {X_cls.shape}")
    print(f"  Features : {feat_cls}")
    print(f"  y distribution : {y_cls.value_counts().to_dict()}")

    X_reg, y_reg, feat_reg = prepare_regression(df)
    print(f"\n─── Régression ───")
    print(f"  X shape : {X_reg.shape}")
    print(f"  y (score) : min={y_reg.min():.1f} max={y_reg.max():.1f} moy={y_reg.mean():.1f}")

    vocab = build_skills_vocabulary()
    print(f"\n─── Vocabulaire skills : {len(vocab)} skills uniques ───")
    print(f"  {vocab[:10]} ...")

    print("\n✅ preprocessing.py OK")