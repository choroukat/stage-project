# 📊 Guide Power BI & Architecture Décisionnelle RH — NTT DATA Tétouan
**Projet de Fin d'Études (PFE) — Intelligence RH & Machine Learning**  
**Auteure :** Chorouk Abouhiat  
**Organisme d'accueil :** NTT DATA Morocco (Pôle Data & IA — Site de Tétouan)  

---

## 📌 1. Vue d'Ensemble & Objectifs Décisionnels

Ce document constitue la spécification technique et fonctionnelle complète pour le déploiement du tableau de bord exécutif **Power BI HR Intelligence** de NTT DATA.

### Objectifs Métier :
1. **Centraliser et fiabiliser** le suivi des **11 809 certifications**, **1 906 employés** et **899 formations** réparties sur 10 départements.
2. **Anticiper les expirations critiques** à 30, 60 et 90 jours pour éviter toute rupture de conformité chez les partenaires technologiques (AWS, Microsoft, Google Cloud, Scrum.org, MongoDB).
3. **Cartographier les compétences & Skill Gaps** pour orienter la politique de formation et accélérer le staffing des projets clients.
4. **Intégrer les prédictions Machine Learning** (probabilité de succès à 95.18% et note estimée R² = 0.9942) pour optimiser les investissements formation.

---

## 🏗️ 2. Modèle de Données Dimensionnel (Star Schema)

Le modèle Power BI repose sur un schéma en étoile optimisé pour les performances de calcul DAX et la granularité temporelle :

```
             ┌─────────────────────────┐
             │      Dim_Employees      │
             │─────────────────────────│
             │ PK Employee_ID          │
             │    Full_Name            │
             │    Department           │
             │    Email                │
             │    Role                 │
             │    Joined_Date          │
             │    Employability_Score  │
             └────────────┬────────────┘
                          │ 1
                          │
                          │ *
             ┌────────────┴────────────┐            ┌─────────────────────────┐
             │   Fact_Certifications   │ *        1 │      Dim_Trainings      │
             │─────────────────────────│────────────│─────────────────────────│
             │ PK Certificate_ID       │            │ PK Training_ID          │
             │ FK Employee_ID          │            │    Title                │
             │ FK Training_ID          │            │    Skill_Name           │
             │ FK Provider_ID          │            │    Category             │
             │ FK Date_Issue_ID        │            │    Duration_Days        │
             │ FK Date_Expiry_ID       │            └─────────────────────────┘
             │    Exam_Score           │
             │    Status (issued/fail) │
             │    Days_To_Expire       │
             │    Is_Expired (0/1)     │
             │    Expiring_30D (0/1)   │
             │    Score_Quiz           │
             │    Score_Exam           │
             │    Score_Homework       │
             │    Score_Assignment     │
             └────────────┬────────────┘
                          │ *
             ┌────────────┴────────────┐            ┌─────────────────────────┐
             │ 1                       │ 1          │       Dim_Calendar      │
┌────────────┴────────────┐ ┌──────────┴──────────┐ │─────────────────────────│
│      Dim_Providers      │ │ Fact_ML_Predictions │ │ PK Date_Key (YYYYMMDD)  │
│─────────────────────────│ │─────────────────────│ │    Full_Date            │
│ PK Provider_ID          │ │ FK Employee_ID      │ │    Year                 │
│    Provider_Name        │ │ FK Training_ID      │ │    Quarter              │
│    Official_Partner     │ │    Pred_Success_Pct │ │    Month_Name           │
│    Certification_Type   │ │    Pred_Final_Score │ │    Month_Number         │
└─────────────────────────┘ │    Confidence_Score │ │    Week_Number          │
                            │    Risk_Level       │ └─────────────────────────┘
                            └─────────────────────┘
```

---

## 🧮 3. Mesures DAX Fondamentales (À copier dans Power BI)

Créez une table dédiée `_Measures` pour regrouper les indicateurs de performance clés (KPIs) :

### 1. Volumétrie & Totaux
```dax
Total Employés = 
DISTINCTCOUNT(Dim_Employees[Employee_ID])

Total Certifications = 
COUNTROWS(Fact_Certifications)

Certifications Délivrées = 
CALCULATE(
    COUNTROWS(Fact_Certifications),
    Fact_Certifications[Status] = "issued"
)

Certifications Échouées = 
CALCULATE(
    COUNTROWS(Fact_Certifications),
    Fact_Certifications[Status] = "failed"
)
```

### 2. Taux de Réussite & Scores Moyens
```dax
Taux de Réussite (%) = 
VAR TotalTentes = [Certifications Délivrées] + [Certifications Échouées]
RETURN
DIVIDE([Certifications Délivrées], TotalTentes, 0) * 100

Score Moyen Examen = 
AVERAGE(Fact_Certifications[Exam_Score])

Score Moyen Département = 
CALCULATE(
    AVERAGE(Fact_Certifications[Exam_Score]),
    ALLEXCEPT(Dim_Employees, Dim_Employees[Department])
)
```

### 3. Alertes Critiques d'Expiration (30 / 60 / 90 Jours)
```dax
Certifications Expirant dans 30J = 
CALCULATE(
    COUNTROWS(Fact_Certifications),
    Fact_Certifications[Days_To_Expire] > 0,
    Fact_Certifications[Days_To_Expire] <= 30,
    Fact_Certifications[Status] = "issued"
)

Certifications Expirant dans 60J = 
CALCULATE(
    COUNTROWS(Fact_Certifications),
    Fact_Certifications[Days_To_Expire] > 30,
    Fact_Certifications[Days_To_Expire] <= 60,
    Fact_Certifications[Status] = "issued"
)

Certifications Déjà Expirées = 
CALCULATE(
    COUNTROWS(Fact_Certifications),
    Fact_Certifications[Days_To_Expire] <= 0,
    NOT(ISBLANK(Fact_Certifications[Date_Expiry]))
)
```

### 4. Indicateurs Métier & Machine Learning
```dax
Taux d'Employabilité Moyen = 
AVERAGE(Dim_Employees[Employability_Score])

Score Prédit Moyen (ML) = 
AVERAGE(Fact_ML_Predictions[Pred_Final_Score])

Candidats à Haut Risque d'Échec = 
CALCULATE(
    COUNTROWS(Fact_ML_Predictions),
    Fact_ML_Predictions[Pred_Success_Pct] < 0.65
)
```

---

## 🔄 4. Script Power Query (M) pour Ingestion & Nettoyage

Si vous importez les données depuis l'export API REST `/dashboard/employees-stats` ou depuis MongoDB Atlas :

```powerquery
// Étape 1 : Connexion au point de terminaison ou fichier CSV
let
    Source = Csv.Document(File.Contents("C:\NTT_DATA_HR\data_certificates.csv"), [Delimiter=",", Columns=12, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"En-têtes promus" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Types modifiés" = Table.TransformColumnTypes(#"En-têtes promus",{
        {"id", type text},
        {"employee_id", type text},
        {"training_id", type text},
        {"provider", type text},
        {"issue_date", type date},
        {"expiry_date", type date},
        {"score_final", type number},
        {"status", type text}
    }),
    
    // Calcul de la colonne personnalisée : Jours restants avant expiration
    #"Jours Restants Ajoutés" = Table.AddColumn(#"Types modifiés", "Days_To_Expire", each 
        if [expiry_date] <> null then 
            Duration.Days([expiry_date] - DateTime.Date(DateTime.LocalNow()))
        else 9999, Int64.Type),
        
    // Indicateur Alerte 30 Jours
    #"Alerte 30J Ajoutée" = Table.AddColumn(#"Jours Restants Ajoutés", "Expiring_30D", each 
        if [Days_To_Expire] > 0 and [Days_To_Expire] <= 30 then 1 else 0, Int64.Type)
in
    #"Alerte 30J Ajoutée"
```

---

## 🖥️ 5. Conception des 4 Pages du Rapport Power BI

### Page 1 : Vue d'Ensemble Exécutive RH (Executive Summary)
- **Bandeau KPI Haut :** Total Collaborateurs (1 906), Certifications Actives (10 575), Taux de Réussite Global (99.6%), Alertes Expiration 30J (badge rouge clignotant).
- **Graphique 1 (Treemap / Donut) :** Répartition des certifications par Département (Software Engineering 2529, RH & Learning 3169, Data & AI 1833, Sales 1793, Infrastructure 1210...).
- **Graphique 2 (Colonnes empilées) :** Top 9 Organismes Certificateurs (NTT DATA, Scrum.org, MongoDB University, Coursera, Udemy, Kaggle, Microsoft, DeepLearning.AI, Amazon).
- **Filtres interactifs (Slicers) :** Département, Organisme, Statut, Année d'obtention.

### Page 2 : Cartographie des Compétences & Skill Gap Analysis
- **Matrice croisée :** Département × Compétences clés (Python, Docker, Kubernetes, AWS, React, Scikit-Learn, Azure...).
- **Radar Chart :** Niveau de maturité par pôle technique vs seuil cible requis.
- **Top Talents :** Liste filtrable des employés multi-certifiés prêts pour le staffing immédiat de projets d'envergure.

### Page 3 : Tour de Contrôle des Alertes & Risque d'Expiration
- **Table dynamique avec mise en forme conditionnelle :**
  - Rouge : Expiration sous 30 jours (action immédiate requise).
  - Orange : Expiration entre 31 et 60 jours (formation de recyclage à planifier).
  - Vert : Certification valide (> 90 jours).
- **Bouton d'action Power Automate :** Déclencher l'envoi de rappel par email au manager et au collaborateur en un clic.

### Page 4 : Performance & Monitoring Machine Learning
- **Courbe ROC & Matrice de Confusion :** Modèle Random Forest SMOTE (Accuracy 95.18%, F1 failed 0.7574).
- **Graphique de Dispersion (Scatter Plot) :** Notes prédites vs Notes réelles (R² = 0.9942, MAE = 0.2899).
- **Simulateur d'aide à la décision :** Tableau des employés en formation avec probabilité estimée de réussite pour allouer du tutorat préventif aux profils à risque.

---

## 🚀 6. Instructions d'Installation & Rafraîchissement

1. **Ouvrir Power BI Desktop** (version 2024 ou ultérieure).
2. Importer le modèle ou se connecter à la source de données (fichiers CSV du dossier `/public/data/` ou connecteur MongoDB Atlas BI / ODBC).
3. Créer les relations 1-à-Plusieurs indiquées dans le schéma en étoile.
4. Créer la table `_Measures` et coller les formules DAX fournies ci-dessus.
5. Configurer la planification du rafraîchissement automatique quotidien via le portail **Power BI Service**.

---
*Document rédigé par Chorouk Abouhiat pour NTT DATA Morocco.*
