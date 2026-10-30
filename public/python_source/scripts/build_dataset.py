"""
build_dataset.py
================
Ce script construit le dataset d'entraînement ML depuis MongoDB Atlas.

PRINCIPE : on croise les 3 collections (certificates + employees + trainings)
pour créer un tableau où chaque ligne = 1 employé qui a passé 1 certification,
avec toutes les informations qu'on connaissait AVANT le résultat (features)
et le résultat lui-même (label).

RÉSULTAT : deux fichiers CSV sauvegardés dans ml/data/
    - dataset_classification.csv  → prédire réussite/échec
    - dataset_regression.csv      → prédire le score total

UTILISATION : python scripts/build_dataset.py
"""

import os
import pandas as pd
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime

# ============================================================
# ÉTAPE 0 — Chargement de la config
# ============================================================
# On lit le fichier .env pour récupérer l'URI MongoDB Atlas
# sans mettre le mot de passe en clair dans le code
load_dotenv()

MONGO_URI    = os.getenv("MONGO_URI")
MONGO_DB     = os.getenv("MONGO_DB_NAME", "nttdata_ai_agent")
OUTPUT_DIR   = os.path.join(os.path.dirname(__file__), "..", "ml", "data")

# ============================================================
# ÉTAPE 1 — Connexion à MongoDB Atlas et lecture des données
# ============================================================
# On se connecte une seule fois et on charge tout en mémoire.
# C'est plus efficace que de faire des requêtes séparées pour chaque ligne.

print("Connexion à MongoDB Atlas...")
client = MongoClient(MONGO_URI)
db     = client[MONGO_DB]

# Lecture des 3 collections complètes sous forme de listes Python
# {_id: 0} = on exclut l'ObjectId MongoDB qui n'est pas utile en ML
raw_certificates = list(db["certificates"].find({}, {"_id": 0}))
raw_employees    = list(db["employees"].find({}, {"_id": 0}))

print(f"  Certificats chargés  : {len(raw_certificates)}")
print(f"  Employés chargés     : {len(raw_employees)}")

# ============================================================
# ÉTAPE 2 — Conversion en DataFrames Pandas
# ============================================================
# Pandas est la bibliothèque standard pour manipuler des tableaux
# de données en Python (comme Excel mais en code).
# Chaque ligne d'un DataFrame = un document MongoDB.

df_certs = pd.DataFrame(raw_certificates)
df_emps  = pd.DataFrame(raw_employees)

# ============================================================
# ÉTAPE 3 — Nettoyage des dates
# ============================================================
# MongoDB renvoie les dates en format "datetime" Python.
# On les convertit proprement avec pd.to_datetime pour pouvoir
# calculer des durées (ex: combien de jours de formation).

date_cols = ["start_date", "end_date", "issue_date", "expiry_date"]
for col in date_cols:
    if col in df_certs.columns:
        # utc=True évite les erreurs de timezone
        df_certs[col] = pd.to_datetime(df_certs[col], utc=True, errors="coerce")

# ============================================================
# ÉTAPE 4 — Extraction des scores depuis le champ imbriqué
# ============================================================
# Dans MongoDB, "scores" est un sous-document : { total, homework, ... }
# Pandas stocke ça comme un dict dans une seule cellule.
# On "explose" ce dict en colonnes séparées pour pouvoir les utiliser.

# Vérification que la colonne scores existe
if "scores" in df_certs.columns:
    # json_normalize transforme {"total": 70, "quiz": 71} en colonnes
    scores_expanded = pd.json_normalize(df_certs["scores"])
    # On préfixe par "score_" pour éviter toute confusion de noms
    scores_expanded.columns = ["score_" + c for c in scores_expanded.columns]
    # On ajoute ces colonnes au DataFrame principal
    df_certs = pd.concat([df_certs.drop(columns=["scores"]), scores_expanded], axis=1)

# ============================================================
# ÉTAPE 5 — Création des features (variables d'entrée du modèle)
# ============================================================
# Les features = ce qu'on connaît AVANT le résultat.
# Le modèle va apprendre à partir de ces informations.

# --- Feature 1 : Durée de formation (en jours) ---
# Plus un employé a eu une longue formation, mieux il est préparé.
# On calcule la différence entre la date de fin et de début.
df_certs["duree_formation_jours"] = (
    df_certs["end_date"] - df_certs["start_date"]
).dt.days

# Sécurité : on remplace les valeurs négatives ou nulles par 0
df_certs["duree_formation_jours"] = (
    df_certs["duree_formation_jours"].clip(lower=0).fillna(0)
)

# --- Feature 2 : Délai entre fin de formation et passage du certificat ---
# Un délai court = l'employé est passé rapidement après sa formation.
# Un délai trop long peut vouloir dire qu'il a oublié du contenu.
df_certs["delai_formation_certif_jours"] = (
    df_certs["issue_date"] - df_certs["end_date"]
).dt.days

df_certs["delai_formation_certif_jours"] = (
    df_certs["delai_formation_certif_jours"].clip(lower=0).fillna(0)
)

# ============================================================
# ÉTAPE 6 — Enrichissement avec les données employés
# ============================================================
# On joint les données employés (skills, skill_count) avec les certificats.
# La clé de jointure = employee_id (présent dans les deux collections).

# On ne garde que les colonnes utiles des employés
df_emps_light = df_emps[["employee_id", "skill_count"]].copy()

# LEFT JOIN : toutes les certifications sont gardées,
# même si l'employé n'a pas de données supplémentaires
df = df_certs.merge(df_emps_light, on="employee_id", how="left")

# Valeur par défaut = 0 si un employé n'a pas de skill_count renseigné
df["skill_count"] = df["skill_count"].fillna(0)

# ============================================================
# ÉTAPE 7 — Calcul du nombre de certifications passées
# par chaque employé (expérience en certification)
# ============================================================
# Un employé qui a déjà passé 5 certifs est plus à l'aise qu'un débutant.
# On compte combien de fois chaque employee_id apparaît dans les données.

exp_map = df["employee_id"].value_counts().to_dict()
df["nb_certifs_passees"] = df["employee_id"].map(exp_map)

# ============================================================
# ÉTAPE 8 — Encodage des variables catégorielles
# ============================================================
# Le ML ne comprend que les chiffres, pas les textes.
# "Software Engineering" doit devenir un nombre.
#
# On utilise pd.get_dummies (One-Hot Encoding) :
# "Software Engineering" → colonne dept_Software_Engineering = 1, les autres = 0
# "Data & AI"            → colonne dept_Data___AI = 1, les autres = 0

dept_dummies = pd.get_dummies(
    df["department"],
    prefix="dept",
    dtype=int           # 0 ou 1, pas True/False
)
df = pd.concat([df, dept_dummies], axis=1)

# Même chose pour le provider de formation
provider_dummies = pd.get_dummies(
    df["provider"],
    prefix="provider",
    dtype=int
)
df = pd.concat([df, provider_dummies], axis=1)

# ============================================================
# ÉTAPE 9 — Création des labels (ce qu'on veut prédire)
# ============================================================
# LABEL A : Classification — Réussite ou échec (0 ou 1)
# Dans ta collection, status = "issued" veut dire réussi,
# toute autre valeur (failed, pending...) = échec.
df["label_reussite"] = (df["status"] == "issued").astype(int)

# LABEL B : Régression — Score total obtenu (nombre entre 0 et 100)
# Le score total est dans la colonne score_total après expansion.
# On renomme pour la clarté.
if "score_total" in df.columns:
    df["label_score"] = df["score_total"]
else:
    # Fallback si le nom est différent
    df["label_score"] = df.get("scores_total", 0)

# ============================================================
# ÉTAPE 10 — Sélection des colonnes finales
# ============================================================
# On garde UNIQUEMENT les colonnes utiles pour le ML.
# On exclut les infos d'identification (noms, IDs, dates brutes)
# car elles ne servent pas à la prédiction.

# Colonnes features numériques fixes
base_features = [
    "duree_formation_jours",        # durée de la formation
    "delai_formation_certif_jours", # délai avant de passer la certif
    "skill_count",                  # nombre de skills de l'employé
    "nb_certifs_passees",           # expérience en certification
    "score_homework",               # note devoirs
    "score_assignment",             # note assignments
    "score_quiz",                   # note quiz
    "score_exam",                   # note examen final
]

# Colonnes encodées (commencent par dept_ ou provider_)
dept_cols     = [c for c in df.columns if c.startswith("dept_")]
provider_cols = [c for c in df.columns if c.startswith("provider_")]

# Assemblage final des features
all_features = base_features + dept_cols + provider_cols

# On ne garde que les colonnes qui existent réellement dans le DataFrame
all_features = [c for c in all_features if c in df.columns]

# ============================================================
# ÉTAPE 11 — Gestion des valeurs manquantes
# ============================================================
# Certains scores peuvent être absents (NaN = "Not a Number").
# Le ML ne tolère pas les NaN → on les remplace par la médiane de la colonne.
# La médiane (valeur centrale) est plus robuste que la moyenne face aux outliers.

score_cols = [c for c in all_features if c.startswith("score_")]
for col in score_cols:
    median_val = df[col].median()
    df[col] = df[col].fillna(median_val)

# Remplacement des NaN restants dans toutes les features par 0
df[all_features] = df[all_features].fillna(0)

# ============================================================
# ÉTAPE 12 — Sauvegarde des datasets finaux
# ============================================================
# On crée deux fichiers CSV séparés :
# - Un pour la classification (réussite/échec)
# - Un pour la régression (score)
# Séparés car les modèles et les stratégies sont différents.

os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- Dataset Classification ---
# On inclut les features + le label binaire (0 ou 1)
df_classif = df[all_features + ["label_reussite"]].copy()

# On retire les lignes où le label est invalide (NaN)
df_classif = df_classif.dropna(subset=["label_reussite"])

path_classif = os.path.join(OUTPUT_DIR, "dataset_classification.csv")
df_classif.to_csv(path_classif, index=False)
print(f"\nDataset Classification sauvegardé : {path_classif}")
print(f"  Lignes : {len(df_classif)}")
print(f"  Réussis (1) : {df_classif['label_reussite'].sum()}")
print(f"  Échoués (0) : {(df_classif['label_reussite'] == 0).sum()}")

# --- Dataset Régression ---
# On garde seulement les lignes où le score est disponible et valide
df_regr = df[all_features + ["label_score"]].copy()
df_regr = df_regr.dropna(subset=["label_score"])
df_regr = df_regr[df_regr["label_score"] > 0]  # score 0 = données invalides

path_regr = os.path.join(OUTPUT_DIR, "dataset_regression.csv")
df_regr.to_csv(path_regr, index=False)
print(f"\nDataset Régression sauvegardé    : {path_regr}")
print(f"  Lignes      : {len(df_regr)}")
print(f"  Score moyen : {df_regr['label_score'].mean():.1f}/100")
print(f"  Score min   : {df_regr['label_score'].min():.1f}")
print(f"  Score max   : {df_regr['label_score'].max():.1f}")

# ============================================================
# RÉSUMÉ — Affichage des premières lignes pour vérification
# ============================================================
print("\n=== Aperçu du dataset Classification (5 premières lignes) ===")
print(df_classif.head().to_string())

print("\n=== Colonnes features utilisées ===")
for i, col in enumerate(all_features, 1):
    print(f"  {i:2}. {col}")

print("\nBuild dataset terminé avec succès.")
client.close()
