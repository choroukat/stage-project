# =============================================================================
# ml/train_models.py
# Rôle : Entraîner les 3 modèles ML et sauvegarder les .pkl
#
# Usage : python train_models.py
#
# Ce script fait TOUT en une fois :
#   - Modèle 1 : Régression du score final        → score_model.pkl
#   - Modèle 2 : Classification réussite/échec    → success_model.pkl
#   - Modèle 3 : Recommandation de formation      → recommender_model.pkl
#
# À relancer quand les données MongoDB changent significativement.
# =============================================================================

import os, sys, json
import numpy as np
import joblib

# Algorithmes
from sklearn.ensemble        import RandomForestRegressor, RandomForestClassifier
from sklearn.linear_model    import LogisticRegression
from sklearn.neighbors       import KNeighborsClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.pipeline        import Pipeline
from sklearn.preprocessing   import StandardScaler, LabelEncoder
from sklearn.metrics         import (r2_score, mean_absolute_error,
                                      accuracy_score, f1_score,
                                      classification_report)

# Nos fonctions de preprocessing
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.preprocessing import (
    load_certificates, load_employees,
    prepare_regression, prepare_classification, prepare_recommendation,
    MODELS_DIR
)

os.makedirs(MODELS_DIR, exist_ok=True)

print("\n" + "="*60)
print("   ENTRAÎNEMENT DES 3 MODÈLES ML")
print("="*60)


# ==========================================================================
# ██████  MODÈLE 1 — RÉGRESSION : Prédire le score final
# ==========================================================================
print("\n\n📊 MODÈLE 1 — Régression du score final")
print("-"*50)

df_cert = load_certificates()
X_reg, y_reg, feat_reg = prepare_regression(df_cert)

X_tr, X_te, y_tr, y_te = train_test_split(X_reg, y_reg,
                                            test_size=0.2, random_state=42)

reg_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model",  RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=5,
        random_state=42,
        n_jobs=-1
    ))
])

# Cross-validation (R² sur 5 folds)
cv_r2 = cross_val_score(reg_model, X_tr, y_tr, cv=5, scoring="r2", n_jobs=-1)
print(f"  CV R² : {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")

reg_model.fit(X_tr, y_tr)
y_pred_reg = reg_model.predict(X_te)

r2  = r2_score(y_te, y_pred_reg)
mae = mean_absolute_error(y_te, y_pred_reg)
print(f"  Test R²  : {r2:.4f}  (objectif ≥ 0.85)")
print(f"  Test MAE : {mae:.2f} points")

# Sauvegarder
joblib.dump(reg_model, os.path.join(MODELS_DIR, "score_model.pkl"))
with open(os.path.join(MODELS_DIR, "score_features.json"), "w") as f:
    json.dump(feat_reg, f, indent=2)

metrics_reg = {"r2": round(r2, 4), "mae": round(mae, 4),
               "cv_r2_mean": round(cv_r2.mean(), 4)}
with open(os.path.join(MODELS_DIR, "score_metrics.json"), "w") as f:
    json.dump(metrics_reg, f, indent=2)

print("  ✅ score_model.pkl sauvegardé")


# ==========================================================================
# ██████  MODÈLE 2 — CLASSIFICATION : Prédire réussite/échec
# ==========================================================================
print("\n\n🎯 MODÈLE 2 — Classification réussite/échec")
print("-"*50)

X_cls, y_cls, feat_cls = prepare_classification(df_cert)

X_tr2, X_te2, y_tr2, y_te2 = train_test_split(
    X_cls, y_cls, test_size=0.2, random_state=42, stratify=y_cls
)

# On compare Logistic Regression vs Random Forest
# Le déséquilibre ~250:1 → class_weight='balanced' est OBLIGATOIRE
candidates = {
    "LogisticRegression": Pipeline([
        ("scaler", StandardScaler()),
        ("model", LogisticRegression(
            class_weight="balanced", max_iter=1000, random_state=42
        ))
    ]),
    "RandomForest": Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestClassifier(
            n_estimators=200, max_depth=10,
            class_weight="balanced", random_state=42, n_jobs=-1
        ))
    ])
}

cv_strat = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
best_cls_name, best_cls_score, best_cls_model = None, -1, None

for name, pipe in candidates.items():
    scores = cross_val_score(pipe, X_tr2, y_tr2,
                             cv=cv_strat, scoring="f1_weighted", n_jobs=-1)
    print(f"  {name:<22} F1 CV : {scores.mean():.4f} ± {scores.std():.4f}")
    if scores.mean() > best_cls_score:
        best_cls_score = scores.mean()
        best_cls_name  = name
        best_cls_model = pipe

print(f"\n  → Meilleur : {best_cls_name}")
best_cls_model.fit(X_tr2, y_tr2)
y_pred_cls = best_cls_model.predict(X_te2)

acc = accuracy_score(y_te2, y_pred_cls)
f1  = f1_score(y_te2, y_pred_cls, average="weighted")
print(f"  Test Accuracy : {acc*100:.2f}%  (objectif ≥ 85%)")
print(f"  Test F1-score : {f1:.4f}")
print()
print(classification_report(y_te2, y_pred_cls,
                             target_names=["Échoué (0)", "Réussi (1)"]))

# Sauvegarder
joblib.dump(best_cls_model, os.path.join(MODELS_DIR, "success_model.pkl"))
with open(os.path.join(MODELS_DIR, "success_features.json"), "w") as f:
    json.dump(feat_cls, f, indent=2)

metrics_cls = {"model": best_cls_name, "accuracy": round(acc, 4),
               "f1_weighted": round(f1, 4), "cv_f1_mean": round(best_cls_score, 4)}
with open(os.path.join(MODELS_DIR, "success_metrics.json"), "w") as f:
    json.dump(metrics_cls, f, indent=2)

print("  ✅ success_model.pkl sauvegardé")


# ==========================================================================
# ██████  MODÈLE 3 — RECOMMANDATION : Prochaine formation
# ==========================================================================
print("\n\n🔮 MODÈLE 3 — Recommandation de formation")
print("-"*50)

df_emp = load_employees()
X_rec, y_rec, feat_rec, label_classes = prepare_recommendation(df_cert, df_emp)

# Encoder le target (skill_acquired) en entiers pour sklearn
le = LabelEncoder()
y_rec_enc = le.fit_transform(y_rec)

X_tr3, X_te3, y_tr3, y_te3 = train_test_split(
    X_rec, y_rec_enc, test_size=0.2, random_state=42, stratify=y_rec_enc
)

# KNN : bonne baseline pour la recommandation basée profil similaire
# k=7 pour avoir assez de voisins même avec des classes rares
rec_model = Pipeline([
    ("scaler", StandardScaler()),
    ("model", KNeighborsClassifier(n_neighbors=7, metric="cosine", n_jobs=-1))
])

# Pour la recommandation on évalue le Top-1 accuracy (classification standard)
# et on calculera le Top-3 à la prédiction
rec_model.fit(X_tr3, y_tr3)
y_pred_rec = rec_model.predict(X_te3)

acc_rec = accuracy_score(y_te3, y_pred_rec) 
print(f"  Top-1 Accuracy : {acc_rec*100:.2f}%")

# Top-3 accuracy : on regarde si le bon label est dans les 3 premières prédictions
proba = rec_model.predict_proba(X_te3)
top3_correct = sum(
    y_te3[i] in np.argsort(proba[i])[-3:]
    for i in range(len(y_te3))
)
top3_acc = top3_correct / len(y_te3)
print(f"  Top-3 Accuracy : {top3_acc*100:.2f}%  (objectif ≥ 75%)")

# Sauvegarder modèle + LabelEncoder + features
joblib.dump(rec_model, os.path.join(MODELS_DIR, "recommender_model.pkl"))
joblib.dump(le,        os.path.join(MODELS_DIR, "recommender_encoder.pkl"))
with open(os.path.join(MODELS_DIR, "recommender_features.json"), "w") as f:
    json.dump(feat_rec, f, indent=2)
with open(os.path.join(MODELS_DIR, "recommender_classes.json"), "w") as f:
    json.dump(label_classes, f, indent=2)

metrics_rec = {"top1_accuracy": round(acc_rec, 4),
               "top3_accuracy": round(top3_acc, 4),
               "n_skills": len(label_classes)}
with open(os.path.join(MODELS_DIR, "recommender_metrics.json"), "w") as f:
    json.dump(metrics_rec, f, indent=2)

print("  ✅ recommender_model.pkl sauvegardé")


# ==========================================================================
print("\n\n" + "="*60)
print("   ✅ TOUS LES MODÈLES ENTRAÎNÉS ET SAUVEGARDÉS")
print(f"   Dossier : {MODELS_DIR}")
print("="*60)
print("\nRésumé :")
print(f"  score_model.pkl      → R²={r2:.3f}, MAE={mae:.2f}")
print(f"  success_model.pkl    → Accuracy={acc*100:.1f}%, F1={f1:.3f}")
print(f"  recommender_model.pkl → Top-3={top3_acc*100:.1f}%")
print("\nLance maintenant : python evaluate_models.py")