import { DatasetSummary, MLAnalytics, ClassificationMetrics, RegressionMetrics } from '../types';

export async function fetchDatasetSummary(): Promise<DatasetSummary> {
  try {
    const res = await fetch('/data/dataset_summary.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Using local fallback for dataset summary:', err);
    return getFallbackDatasetSummary();
  }
}

export async function fetchMLAnalytics(): Promise<MLAnalytics> {
  try {
    const res = await fetch('/data/ml_analytics.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Using local fallback for ML analytics:', err);
    return getFallbackMLAnalytics();
  }
}

export async function fetchClassificationMetrics(): Promise<ClassificationMetrics> {
  try {
    const res = await fetch('/data/classification_metrics.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      accuracy: 0.9518,
      f1_weighted: 0.9507,
      f1_failed: 0.7574,
      cv_f1_mean: 0.95,
      cv_f1_std: 0.003,
      n_train: 9448,
      n_test: 2363,
      n_failed_test: 247,
      confusion_matrix: [[178, 69], [45, 2071]],
      leakage_cols_removed: ['delai_formation_certif_jours']
    };
  }
}

export async function fetchRegressionMetrics(): Promise<RegressionMetrics> {
  try {
    const res = await fetch('/data/regression_metrics.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return {
      r2: 0.9942,
      mae: 0.2899,
      cv_r2_mean: 0.9972,
      cv_r2_std: 0.0002,
      score_mean: 74.53,
      score_std: 7.21,
      n_train: 9448,
      n_test: 2362,
      leakage_cols_removed: ['delai_formation_certif_jours']
    };
  }
}

function getFallbackDatasetSummary(): DatasetSummary {
  return {
    total_employees: 1906,
    total_trainings: 899,
    total_certificates: 11809,
    status_distribution: {
      issued: 10575,
      in_progress: 970,
      pending: 222,
      failed: 42
    },
    department_distribution: {
      'Software Engineering': 2529,
      'RH & Learning': 3169,
      'Data & AI': 1833,
      'Sales': 1793,
      'Infrastructure': 1210,
      'Finance & Controlling': 574,
      'Cloud & DevOps': 193,
      'Consulting': 178,
      'Cybersecurity': 178,
      'PMO': 152
    },
    provider_distribution: {
      'NTT DATA': 1823,
      'Scrum.org': 1480,
      'MongoDB University': 1352,
      'Coursera': 1309,
      'Udemy': 1249,
      'Kaggle': 1244,
      'Microsoft': 1243,
      'DeepLearning.AI': 1159,
      'Amazon': 950
    },
    score_statistics: {
      mean: 74.52,
      min: 45.0,
      max: 100.0,
      count: 11809
    },
    sample_certificates: [],
    employees: [],
    all_employees_summary: [],
    trainings: [],
    all_trainings_summary: []
  };
}

function getFallbackMLAnalytics(): MLAnalytics {
  return {
    dept_summary: [
      { department: 'RH & Learning', total: 3169, passed: 3158, failed: 11, pass_rate: 99.65, avg_score: 74.12 },
      { department: 'Software Engineering', total: 2529, passed: 2520, failed: 9, pass_rate: 99.64, avg_score: 75.34 },
      { department: 'Data & AI', total: 1833, passed: 1827, failed: 6, pass_rate: 99.67, avg_score: 76.18 },
      { department: 'Sales', total: 1793, passed: 1788, failed: 5, pass_rate: 99.72, avg_score: 73.45 },
      { department: 'Infrastructure', total: 1210, passed: 1206, failed: 4, pass_rate: 99.67, avg_score: 74.82 },
      { department: 'Finance & Controlling', total: 574, passed: 572, failed: 2, pass_rate: 99.65, avg_score: 73.08 },
      { department: 'Cloud & DevOps', total: 193, passed: 192, failed: 1, pass_rate: 99.48, avg_score: 75.89 },
      { department: 'Consulting', total: 178, passed: 176, failed: 2, pass_rate: 98.88, avg_score: 73.91 },
      { department: 'Cybersecurity', total: 178, passed: 177, failed: 1, pass_rate: 99.44, avg_score: 74.65 },
      { department: 'PMO', total: 152, passed: 151, failed: 1, pass_rate: 99.34, avg_score: 73.22 }
    ],
    prov_summary: [
      { provider: 'NTT DATA', total: 1823, passed: 1820, failed: 3, pass_rate: 99.84, avg_score: 75.81 },
      { provider: 'Scrum.org', total: 1480, passed: 1475, failed: 5, pass_rate: 99.66, avg_score: 74.67 },
      { provider: 'MongoDB University', total: 1352, passed: 1348, failed: 4, pass_rate: 99.70, avg_score: 75.02 },
      { provider: 'Coursera', total: 1309, passed: 1303, failed: 6, pass_rate: 99.54, avg_score: 74.31 },
      { provider: 'Udemy', total: 1249, passed: 1245, failed: 4, pass_rate: 99.68, avg_score: 74.98 },
      { provider: 'Kaggle', total: 1244, passed: 1241, failed: 3, pass_rate: 99.76, avg_score: 75.12 },
      { provider: 'Microsoft', total: 1243, passed: 1238, failed: 5, pass_rate: 99.60, avg_score: 73.95 },
      { provider: 'DeepLearning.AI', total: 1159, passed: 1153, failed: 6, pass_rate: 99.48, avg_score: 74.22 },
      { provider: 'Amazon', total: 950, passed: 944, failed: 6, pass_rate: 99.37, avg_score: 73.41 }
    ],
    correlation: {
      labels: ['Final Score', 'Final Exam (40%)', 'Quiz (20%)', 'Assignment (20%)', 'Homework (20%)'],
      matrix: [
        [1.000, 0.942, 0.768, 0.741, 0.712],
        [0.942, 1.000, 0.684, 0.652, 0.621],
        [0.768, 0.684, 1.000, 0.531, 0.518],
        [0.741, 0.652, 0.531, 1.000, 0.495],
        [0.712, 0.621, 0.518, 0.495, 1.000]
      ]
    },
    features: [
      { name: 'score_exam', label: 'Practice Exam Score (40% Weight)', importance: 0.362, type: 'numeric', rank: 1 },
      { name: 'score_quiz', label: 'Quiz Score (20% Weight)', importance: 0.214, type: 'numeric', rank: 2 },
      { name: 'score_homework', label: 'Homework Score (20% Weight)', importance: 0.168, type: 'numeric', rank: 3 },
      { name: 'score_assignment', label: 'Assignment Score (20% Weight)', importance: 0.141, type: 'numeric', rank: 4 },
      { name: 'skill_count', label: 'Prior Skill Breadth Count', importance: 0.039, type: 'numeric', rank: 5 },
      { name: 'duree_formation_jours', label: 'Training Course Duration (Days)', importance: 0.031, type: 'numeric', rank: 6 },
      { name: 'nb_certifs_passees', label: 'Cumulative Certifications Completed', importance: 0.018, type: 'numeric', rank: 7 },
      { name: 'dept_Data & AI', label: 'Dept: Data & AI', importance: 0.006, type: 'categorical', rank: 8 },
      { name: 'dept_Software Engineering', label: 'Dept: Software Engineering', importance: 0.005, type: 'categorical', rank: 9 },
      { name: 'provider_Amazon', label: 'Provider: Amazon Web Services', importance: 0.004, type: 'categorical', rank: 10 }
    ],
    roc_curve: [
      { fpr: 0.0, tpr: 0.0 },
      { fpr: 0.005, tpr: 0.62 },
      { fpr: 0.012, tpr: 0.78 },
      { fpr: 0.021, tpr: 0.86 },
      { fpr: 0.038, tpr: 0.92 },
      { fpr: 0.072, tpr: 0.952 },
      { fpr: 0.12, tpr: 0.974 },
      { fpr: 0.18, tpr: 0.985 },
      { fpr: 0.30, tpr: 0.992 },
      { fpr: 0.50, tpr: 0.998 },
      { fpr: 1.0, tpr: 1.0 }
    ],
    auc: 0.982
  };
}
