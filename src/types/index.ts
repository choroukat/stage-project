export interface Employee {
  id: string;
  name: string;
  department: string;
  email: string;
  skills: string[];
  skill_count: number;
}

export interface Training {
  id: string;
  title: string;
  provider: string;
  skill_acquired: string;
}

export interface Certificate {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  training_id: string;
  training_title: string;
  provider: string;
  skill_acquired: string;
  start_date: string;
  end_date: string;
  issue_date: string;
  status: 'issued' | 'failed' | 'in_progress' | 'pending' | string;
  score: number;
  homework_score: number;
  assignment_score: number;
  quiz_score: number;
  exam_score: number;
}

export interface ClassificationMetrics {
  accuracy: number;
  f1_weighted: number;
  f1_failed: number;
  cv_f1_mean: number;
  cv_f1_std: number;
  n_train: number;
  n_test: number;
  n_failed_test: number;
  confusion_matrix: number[][];
  leakage_cols_removed: string[];
}

export interface RegressionMetrics {
  r2: number;
  mae: number;
  cv_r2_mean: number;
  cv_r2_std: number;
  score_mean: number;
  score_std: number;
  n_train: number;
  n_test: number;
  leakage_cols_removed: string[];
}

export interface FeatureImportance {
  name: string;
  label: string;
  importance: number;
  type: 'numeric' | 'categorical';
  rank: number;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
}

export interface MLAnalytics {
  dept_summary: {
    department: string;
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    avg_score: number;
  }[];
  prov_summary: {
    provider: string;
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
    avg_score: number;
  }[];
  correlation: {
    labels: string[];
    matrix: number[][];
  };
  features: FeatureImportance[];
  roc_curve: RocPoint[];
  auc: number;
}

export interface DatasetSummary {
  total_employees: number;
  total_trainings: number;
  total_certificates: number;
  status_distribution: Record<string, number>;
  department_distribution: Record<string, number>;
  provider_distribution: Record<string, number>;
  score_statistics: {
    mean: number;
    min: number;
    max: number;
    count: number;
  };
  sample_certificates: Certificate[];
  employees: Employee[];
  all_employees_summary: Employee[];
  trainings: Training[];
  all_trainings_summary: Training[];
}

export interface KNNNeighbor {
  employee_id: string;
  employee_name: string;
  department: string;
  similarity: number;
  score_moyen: number;
  skills: string[];
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: string | number;
  impact: number;
  direction: 'positive' | 'negative' | 'neutral';
}

export interface PredictionOutput {
  employee_id: string;
  employee_name: string;
  department: string;
  certification: string;
  provider: string;
  probabilite_reussite: number;
  probabilite_echec: number;
  prediction_reussite: 'Réussite' | 'Échec';
  score_predit: number;
  score_historique: number;
  source_score: string;
  niveau_confiance: 'Élevé' | 'Moyen' | 'Faible' | 'Faible (nouvel employé)';
  alerte: 'none' | 'watch' | 'warning' | 'critical';
  alerte_label: string;
  recommandation: string;
  est_nouveau_employe: boolean;
  top_features: string[];
  explication: string;
  knn_neighbors?: KNNNeighbor[];
  feature_contributions: FeatureContribution[];
}

export interface ProjectMatch {
  employee_id: string;
  employee_name: string;
  department: string;
  email: string;
  compatibility_score: number;
  matching_skills: string[];
  missing_skills: string[];
  total_skills: number;
}

export interface ConfusionMatrixStats {
  threshold: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  accuracy: number;
  sensitivity: number; // recall
  specificity: number;
  precision: number;   // PPV
  npv: number;         // Negative Predictive Value
  f1: number;
}

export type ActiveTab =
  | 'powerbi'
  | 'react_agent'
  | 'portals'
  | 'evaluation'
  | 'inference'
  | 'matcher'
  | 'python'
  | 'eda'
  | 'explorer'
  | 'explainer';

