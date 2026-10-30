# =============================================================================
# Backend/ML/train_models.py  (version finale — sans data leakage)
#
# Correction : suppression de 'delai_formation_certif_jours' qui causait
#              100% accuracy par data leakage (délai=0 ↔ failed exactement)
# =============================================================================

import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble        import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, StratifiedKFold, KFold, cross_val_score
from sklearn.preprocessing   import StandardScaler
from sklearn.pipeline        import Pipeline
from sklearn.metrics         import (
    accuracy_score, f1_score, classification_report,
    confusion_matrix, r2_score, mean_absolute_error
)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline      import Pipeline as ImbPipeline

# ── Chemins ──────────────────────────────────────────────────────────────────
ML_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_DIR   = os.path.join(ML_DIR, "data")
MODELS_DIR = os.path.join(ML_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ── Colonnes à exclure (data leakage) ────────────────────────────────────────
# 'delai_formation_certif_jours' : délai entre fin de formation et passage de
# la certification. En production, cette info n'existe pas AVANT la certification.
# De plus, dans le dataset, délai=0 correspond EXACTEMENT à label=0 (failed),
# ce qui crée une corrélation artificielle de 0.83 → accuracy trompeuse de 100%.
LEAKAGE_COLS = ["delai_formation_certif_jours"]

print("\n" + "="*60)
print("   ENTRAÎNEMENT DES MODÈLES ML — NTT DATA HR Platform")
print("="*60)
print("\n  ⚠  Colonnes exclues (data leakage) :", LEAKAGE_COLS)


# =============================================================================
# ÉTAPE 1 — Chargement des CSV
# =============================================================================

print("\n📦 Chargement des datasets...")

df_cls = pd.read_csv(os.path.join(DATA_DIR, "dataset_classification.csv"))
df_reg = pd.read_csv(os.path.join(DATA_DIR, "dataset_regression.csv"))

# Suppression des colonnes leakage si présentes
for col in LEAKAGE_COLS:
    if col in df_cls.columns:
        df_cls = df_cls.drop(columns=[col])
        print(f"  [classification] colonne '{col}' supprimée")
    if col in df_reg.columns:
        df_reg = df_reg.drop(columns=[col])
        print(f"  [regression] colonne '{col}' supprimée")

print(f"  Classification : {len(df_cls)} lignes × {df_cls.shape[1]} colonnes")
print(f"  Régression     : {len(df_reg)} lignes × {df_reg.shape[1]} colonnes")

y_cls   = df_cls["label_reussite"]
X_cls   = df_cls.drop(columns=["label_reussite"])
feat_cls = list(X_cls.columns)

y_reg   = df_reg["label_score"]
X_reg   = df_reg.drop(columns=["label_score"])
feat_reg = list(X_reg.columns)

print(f"\n  issued (1) : {(y_cls==1).sum()} | failed (0) : {(y_cls==0).sum()}")
print(f"  Ratio déséquilibre : {(y_cls==1).sum() // max((y_cls==0).sum(),1)}:1")
print("  → SMOTE va équilibrer les classes pendant l'entraînement")


# =============================================================================
# MODÈLE 1 — CLASSIFICATION
# =============================================================================

print("\n\n" + "─"*60)
print("  MODÈLE 1 — Classification (issued / failed)")
print("─"*60)

X_tr, X_te, y_tr, y_te = train_test_split(
    X_cls, y_cls, test_size=0.2, random_state=42, stratify=y_cls
)
print(f"\n  Train : {len(X_tr)} | Test : {len(X_te)}")
print(f"  Failed dans train : {(y_tr==0).sum()} | dans test : {(y_te==0).sum()}")

cls_pipeline = ImbPipeline([
    ("smote", SMOTE(random_state=42, k_neighbors=5)),
    ("scaler", StandardScaler()),
    ("model", RandomForestClassifier(
        n_estimators=200, max_depth=12,
        class_weight="balanced", random_state=42, n_jobs=-1
    ))
])

print("\n  Validation croisée (5 folds)...")
cv_f1 = cross_val_score(
    cls_pipeline, X_tr, y_tr,
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
    scoring="f1_weighted", n_jobs=-1
)
print(f"  F1 CV : {cv_f1.mean():.4f} ± {cv_f1.std():.4f}")

print("\n  Entraînement final...")
cls_pipeline.fit(X_tr, y_tr)

y_pred_cls = cls_pipeline.predict(X_te)
acc       = accuracy_score(y_te, y_pred_cls)
f1        = f1_score(y_te, y_pred_cls, average="weighted")
f1_failed = f1_score(y_te, y_pred_cls, pos_label=0, average="binary")

print(f"\n  ─── Résultats ───")
print(f"  Accuracy    : {acc*100:.2f}%")
print(f"  F1 weighted : {f1:.4f}   (objectif ≥ 0.85)")
print(f"  F1 failed   : {f1_failed:.4f}   (objectif ≥ 0.60)")
print()
print(classification_report(y_te, y_pred_cls, target_names=["failed (0)", "issued (1)"]))

cm = confusion_matrix(y_te, y_pred_cls)
print("  Matrice de confusion :")
print("                   Prédit failed   Prédit issued")
print(f"  Réel failed  :      {cm[0][0]:>5}          {cm[0][1]:>5}")
print(f"  Réel issued  :      {cm[1][0]:>5}          {cm[1][1]:>5}")

joblib.dump(cls_pipeline, os.path.join(MODELS_DIR, "classification_model.pkl"))
with open(os.path.join(MODELS_DIR, "classification_features.json"), "w") as f:
    json.dump(feat_cls, f, indent=2)
with open(os.path.join(MODELS_DIR, "classification_metrics.json"), "w") as f:
    json.dump({
        "accuracy": round(float(acc), 4),
        "f1_weighted": round(float(f1), 4),
        "f1_failed": round(float(f1_failed), 4),
        "cv_f1_mean": round(float(cv_f1.mean()), 4),
        "cv_f1_std": round(float(cv_f1.std()), 4),
        "n_train": int(len(X_tr)), "n_test": int(len(X_te)),
        "n_failed_test": int((y_te==0).sum()),
        "confusion_matrix": cm.tolist(),
        "leakage_cols_removed": LEAKAGE_COLS
    }, f, indent=2)

print("  ✅ classification_model.pkl sauvegardé")


# =============================================================================
# MODÈLE 2 — RÉGRESSION
# =============================================================================

print("\n\n" + "─"*60)
print("  MODÈLE 2 — Régression (prédire le score final)")
print("─"*60)

X_tr2, X_te2, y_tr2, y_te2 = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)
print(f"\n  Train : {len(X_tr2)} | Test : {len(X_te2)}")
print(f"  Score — min: {y_tr2.min():.1f} | max: {y_tr2.max():.1f} | moy: {y_tr2.mean():.1f}")

reg_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("model", GradientBoostingRegressor(
        n_estimators=200, max_depth=5,
        learning_rate=0.05, subsample=0.8, random_state=42
    ))
])

print("\n  Validation croisée (5 folds)...")
cv_r2 = cross_val_score(
    reg_pipeline, X_tr2, y_tr2,
    cv=KFold(n_splits=5, shuffle=True, random_state=42),
    scoring="r2", n_jobs=-1
)
print(f"  R² CV : {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")

print("\n  Entraînement final...")
reg_pipeline.fit(X_tr2, y_tr2)

y_pred_reg = reg_pipeline.predict(X_te2)
r2  = r2_score(y_te2, y_pred_reg)
mae = mean_absolute_error(y_te2, y_pred_reg)

print(f"\n  ─── Résultats ───")
print(f"  R²  : {r2:.4f}   (objectif ≥ 0.80)")
print(f"  MAE : {mae:.2f} points  (objectif ≤ 5)")
print("\n  Exemples réel vs prédit :")
for real, pred in zip(list(y_te2[:5]), list(y_pred_reg[:5])):
    diff = abs(real - pred)
    print(f"    Réel: {real:.1f}  →  Prédit: {pred:.1f}  (écart: {diff:.1f}) {'✓' if diff<=5 else '⚠'}")

joblib.dump(reg_pipeline, os.path.join(MODELS_DIR, "regression_model.pkl"))
with open(os.path.join(MODELS_DIR, "regression_features.json"), "w") as f:
    json.dump(feat_reg, f, indent=2)
with open(os.path.join(MODELS_DIR, "regression_metrics.json"), "w") as f:
    json.dump({
        "r2": round(float(r2), 4), "mae": round(float(mae), 4),
        "cv_r2_mean": round(float(cv_r2.mean()), 4),
        "cv_r2_std": round(float(cv_r2.std()), 4),
        "n_train": int(len(X_tr2)), "n_test": int(len(X_te2)),
        "score_mean": round(float(y_reg.mean()), 2),
        "score_std": round(float(y_reg.std()), 2),
        "leakage_cols_removed": LEAKAGE_COLS
    }, f, indent=2)

print("  ✅ regression_model.pkl sauvegardé")


# =============================================================================
# RÉSUMÉ FINAL
# =============================================================================

print("\n\n" + "="*60)
print("   ✅ ENTRAÎNEMENT TERMINÉ")
print("="*60)
print(f"""
  Résumé des performances (sans data leakage) :
  ┌──────────────────────────────────────────────────┐
  │  Classification  Acc={acc*100:.1f}%  F1={f1:.3f}  F1-failed={f1_failed:.3f}  │
  │  Régression      R²={r2:.4f}   MAE={mae:.2f} pts              │
  └──────────────────────────────────────────────────┘

  Fichiers dans : {MODELS_DIR}
  ├── classification_model.pkl
  ├── classification_features.json  ← features SANS delai_formation
  ├── classification_metrics.json
  ├── regression_model.pkl
  ├── regression_features.json      ← features SANS delai_formation
  └── regression_metrics.json
""")