import React, { useState, useMemo } from 'react';
import { 
  ClassificationMetrics, 
  RegressionMetrics, 
  MLAnalytics 
} from '../types';
import { computeConfusionMatrixAtThreshold } from '../services/mlEngine';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  Sliders, 
  Info, 
  TrendingUp, 
  Binary, 
  BarChart, 
  Cpu, 
  Zap,
  Target
} from 'lucide-react';

interface ModelEvaluationDeckProps {
  clsMetrics: ClassificationMetrics;
  regMetrics: RegressionMetrics;
  analytics: MLAnalytics;
}

export const ModelEvaluationDeck: React.FC<ModelEvaluationDeckProps> = ({
  clsMetrics,
  regMetrics,
  analytics
}) => {
  const [threshold, setThreshold] = useState<number>(0.50);
  const [activeModelTab, setActiveModelTab] = useState<'classifier' | 'regressor'>('classifier');
  const [showLeakageDetails, setShowLeakageDetails] = useState<boolean>(true);

  // Recompute confusion matrix stats at current threshold
  const cmStats = useMemo(() => {
    return computeConfusionMatrixAtThreshold(threshold, clsMetrics.confusion_matrix);
  }, [threshold, clsMetrics.confusion_matrix]);

  return (
    <div className="space-y-8">
      {/* 1. Executive Model Architecture Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold text-blue-400 tracking-wider">
                Model Governance & Performance Hub
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Validated v2.4 (Leak-Free)
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Dual-Stage Predictive Workforce Architecture
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Ensemble of a SMOTE-balanced Random Forest Classifier for pass/fail prediction and a Gradient Boosting Regressor for continuous exam score forecasting across 11,809 historical certifications.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 p-2 rounded-xl border border-slate-800/80 shrink-0">
            <button
              onClick={() => setActiveModelTab('classifier')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeModelTab === 'classifier'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              <span>1. Random Forest (Success)</span>
            </button>
            <button
              onClick={() => setActiveModelTab('regressor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeModelTab === 'regressor'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>2. Gradient Boosting (Score)</span>
            </button>
          </div>
        </div>

        {/* Dataset sample size indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-400 block">Training Partition (80%)</span>
            <span className="text-slate-100 font-semibold text-sm tabular-nums">
              {clsMetrics.n_train.toLocaleString()} records
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Stratified Test Partition (20%)</span>
            <span className="text-slate-100 font-semibold text-sm tabular-nums">
              {clsMetrics.n_test.toLocaleString()} records
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Test Failed Class (0)</span>
            <span className="text-amber-400 font-semibold text-sm tabular-nums">
              {clsMetrics.n_failed_test} samples
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">5-Fold Stratified CV</span>
            <span className="text-cyan-400 font-semibold text-sm tabular-nums">
              μ={(clsMetrics.cv_f1_mean * 100).toFixed(1)}% ± {(clsMetrics.cv_f1_std * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Accuracy</span>
            <span className="text-emerald-400 font-medium">95.2%</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
            {(clsMetrics.accuracy * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Overall test classification
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${clsMetrics.accuracy * 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Weighted F1</span>
            <span className="text-cyan-400 font-medium">0.951</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
            {clsMetrics.f1_weighted.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Benchmark target ≥ 0.850
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${clsMetrics.f1_weighted * 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Failed Class F1</span>
            <span className="text-amber-400 font-medium">0.757</span>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono tracking-tight tabular-nums">
            {clsMetrics.f1_failed.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Minority class (target ≥ 0.60)
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${clsMetrics.f1_failed * 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 relative overflow-hidden">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Regressor R²</span>
            <span className="text-purple-400 font-medium">99.4%</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight tabular-nums">
            {regMetrics.r2.toFixed(4)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Variance explained (target ≥ 0.80)
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${regMetrics.r2 * 100}%` }} />
          </div>
        </div>

        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Regressor MAE</span>
            <span className="text-emerald-400 font-medium">0.29 pts</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight tabular-nums">
            {regMetrics.mae.toFixed(2)} <span className="text-xs text-slate-400 font-normal">pts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mean Absolute Error (target ≤ 5)
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(1 - regMetrics.mae / 5) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* 3. Deep Dive: Confusion Matrix with Decision Threshold Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Confusion Matrix & Threshold Tuning */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Confusion Matrix & Threshold Optimization
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation on test set ({clsMetrics.n_test} samples: 2,116 issued, 247 failed)
              </p>
            </div>

            {/* Threshold value pill */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Decision Threshold:</span>
              <span className="text-blue-400 font-bold tabular-nums">τ = {threshold.toFixed(2)}</span>
            </div>
          </div>

          {/* Interactive Threshold Slider */}
          <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" />
                <span>Adjust Classification Threshold (τ)</span>
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {threshold < 0.5 ? 'High Sensitivity (Early Warning)' : threshold > 0.5 ? 'High Precision (Conservative)' : 'Standard Balanced (0.50)'}
              </span>
            </div>

            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400 pt-1">
              <span>0.10 (Protect Budget / Flag all risks)</span>
              <span>0.50 (Calibrated Optimum)</span>
              <span>0.90 (High Confidence Only)</span>
            </div>
          </div>

          {/* 2x2 Matrix Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* True Negative */}
            <div className="bg-slate-950/90 rounded-xl border border-emerald-500/30 p-4 relative group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>True Negative (TN)</span>
                <span className="text-emerald-400 font-mono text-[11px]">Actual Failed → Predicted Failed</span>
              </div>
              <div className="text-3xl font-bold font-mono text-emerald-400 tabular-nums">
                {cmStats.tn}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {(cmStats.tn / (cmStats.tn + cmStats.fp) * 100).toFixed(1)}% of actual failures correctly trapped
              </div>
            </div>

            {/* False Positive */}
            <div className="bg-slate-950/90 rounded-xl border border-rose-500/30 p-4 relative group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>False Positive (FP)</span>
                <span className="text-rose-400 font-mono text-[11px]">Actual Failed → Predicted Issued</span>
              </div>
              <div className="text-3xl font-bold font-mono text-rose-400 tabular-nums">
                {cmStats.fp}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                False alarms (missed failure risks)
              </div>
            </div>

            {/* False Negative */}
            <div className="bg-slate-950/90 rounded-xl border border-amber-500/30 p-4 relative group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>False Negative (FN)</span>
                <span className="text-amber-400 font-mono text-[11px]">Actual Issued → Predicted Failed</span>
              </div>
              <div className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
                {cmStats.fn}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Cautious flags (unnecessary warnings)
              </div>
            </div>

            {/* True Positive */}
            <div className="bg-slate-950/90 rounded-xl border border-blue-500/30 p-4 relative group">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>True Positive (TP)</span>
                <span className="text-blue-400 font-mono text-[11px]">Actual Issued → Predicted Issued</span>
              </div>
              <div className="text-3xl font-bold font-mono text-blue-400 tabular-nums">
                {cmStats.tp}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {(cmStats.tp / (cmStats.tp + cmStats.fn) * 100).toFixed(1)}% of successes correctly identified
              </div>
            </div>
          </div>

          {/* Derived Real-Time Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Sensitivity (Recall)</span>
              <span className="text-white font-bold text-sm tabular-nums">{cmStats.sensitivity}%</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Specificity (TN Rate)</span>
              <span className="text-white font-bold text-sm tabular-nums">{cmStats.specificity}%</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Precision (PPV)</span>
              <span className="text-white font-bold text-sm tabular-nums">{cmStats.precision}%</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">F1 Score @ τ</span>
              <span className="text-cyan-400 font-bold text-sm tabular-nums">{(cmStats.f1 / 100).toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: ROC Curve & AUC Display */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart className="w-4 h-4 text-purple-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                ROC & Discriminant Power
              </h3>
            </div>
            <span className="text-xs font-mono bg-purple-950/60 border border-purple-500/30 text-purple-400 px-2.5 py-1 rounded-md font-bold">
              AUC = {analytics.auc.toFixed(3)}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Receiver Operating Characteristic showing true positive rate vs false positive rate across all cutoff levels.
          </p>

          {/* Precision SVG ROC Curve */}
          <div className="w-full h-56 bg-slate-950 rounded-xl p-4 border border-slate-800 relative flex flex-col justify-between">
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="100" y2="25" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="0" y1="75" x2="100" y2="75" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="25" y1="0" x2="25" y2="100" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />
              <line x1="75" y1="0" x2="75" y2="100" stroke="#334155" strokeDasharray="2,2" strokeWidth="0.5" />

              {/* Diagonal baseline (Random Classifier) */}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#64748b" strokeDasharray="3,3" strokeWidth="1" />

              {/* Area under curve */}
              <polygon
                points={`0,100 ${analytics.roc_curve.map(p => `${p.fpr * 100},${100 - p.tpr * 100}`).join(' ')} 100,100`}
                fill="url(#rocGradient)"
                opacity="0.25"
              />

              <defs>
                <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* ROC Curve Polyline */}
              <polyline
                points={analytics.roc_curve.map(p => `${p.fpr * 100},${100 - p.tpr * 100}`).join(' ')}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Current operating point on curve based on threshold */}
              <circle
                cx={Math.max(1, Math.min(99, (1 - cmStats.specificity / 100) * 100))}
                cy={Math.max(1, Math.min(99, 100 - cmStats.sensitivity))}
                r="4"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            </svg>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2">
              <span>0% FPR</span>
              <span className="text-blue-400 font-semibold">● Operating Point (τ = {threshold.toFixed(2)})</span>
              <span>100% FPR</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
              <Info className="w-3.5 h-3.5" />
              <span>Data Scientist Note on Imbalance</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Raw dataset has a ~25:1 ratio of passed to failed certifications. The <code className="text-cyan-300 font-mono">SMOTE(k=5)</code> synthetic oversampling step balances the class representation inside the pipeline without test set leakage.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Feature Importance & MDI Analysis */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Global Feature Importance (Mean Decrease in Impurity - MDI)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Relative predictive weight of input signals in the 200-tree Random Forest ensemble
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            26 Total Features Evaluated
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {analytics.features.map((feat) => {
            const pct = (feat.importance * 100).toFixed(1);
            const isTop = feat.rank <= 4;
            return (
              <div key={feat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-400 w-5">
                      #{feat.rank}
                    </span>
                    <span className={`font-medium ${isTop ? 'text-slate-200' : 'text-slate-400'}`}>
                      {feat.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      feat.type === 'numeric' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {feat.type}
                    </span>
                    <span className="font-mono font-bold text-slate-100 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      feat.rank === 1
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                        : isTop
                        ? 'bg-blue-500'
                        : 'bg-slate-600'
                    }`}
                    style={{ width: `${Math.max(2, feat.importance * 250)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Critical Data Leakage Post-Mortem & Forensic Audit */}
      <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 rounded-2xl border border-amber-500/30 p-6 shadow-md space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-mono font-bold text-amber-400">
                  Data Science Case Study · Data Leakage Incident & Resolution
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  RESOLVED
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Audit: Elimination of <code className="text-amber-300 font-mono">delai_formation_certif_jours</code>
              </h3>
            </div>
          </div>

          <button
            onClick={() => setShowLeakageDetails(!showLeakageDetails)}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono px-3 py-1.5 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 transition-colors whitespace-nowrap"
          >
            {showLeakageDetails ? 'Hide Forensic Details' : 'View Forensic Analysis'}
          </button>
        </div>

        {showLeakageDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>1. The Red Flag (100% Accuracy)</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                In earlier iterations, the classifier achieved an implausible <strong>100% Accuracy</strong> on both training and validation folds. In statistical machine learning, a perfect 1.00 score without error is virtually always symptom of target contamination.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                <span>2. Root Cause Discovery</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Analysis revealed that <code className="text-amber-300 font-mono">delai_formation_certif_jours</code> was calculated between course completion and certification issuance. When an employee failed, this delta was exactly <code className="text-amber-300 font-mono">0</code>. The model simply memorized: <code className="text-cyan-300 font-mono">delay == 0 ➔ failed</code> with <code className="text-cyan-300 font-mono">r = 0.83</code>.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>3. Production-Ready Remedy</span>
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                The column was strictly purged from both classification and regression feature pipelines. The model was retrained on pre-certification features only, reaching a genuine, robust <strong>95.18% accuracy</strong> that generalizes faithfully to new employees.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 6. Pipeline Hyperparameters & Cross-Validation Audit Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base font-bold text-white tracking-tight">
            Pipeline Configuration & Hyperparameter Lineage
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-left">
                <th className="py-2.5 px-3">Model Type</th>
                <th className="py-2.5 px-3">Estimator</th>
                <th className="py-2.5 px-3">Preprocessing Steps</th>
                <th className="py-2.5 px-3">Key Hyperparameters</th>
                <th className="py-2.5 px-3 text-right">Validation Scheme</th>
                <th className="py-2.5 px-3 text-right">CV Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Stage 1: Binary Classifier</td>
                <td className="py-3 px-3 text-cyan-300">RandomForestClassifier</td>
                <td className="py-3 px-3">SMOTE (k=5) + StandardScaler</td>
                <td className="py-3 px-3 text-slate-400">n_estimators=200, max_depth=12, class_weight='balanced'</td>
                <td className="py-3 px-3 text-right">5-Fold Stratified</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-400">F1 = 0.9500 ± 0.003</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Stage 2: Continuous Regressor</td>
                <td className="py-3 px-3 text-purple-300">GradientBoostingRegressor</td>
                <td className="py-3 px-3">StandardScaler</td>
                <td className="py-3 px-3 text-slate-400">n_estimators=200, max_depth=5, lr=0.05, subsample=0.8</td>
                <td className="py-3 px-3 text-right">5-Fold KFold</td>
                <td className="py-3 px-3 text-right font-bold text-purple-400">R² = 0.9972 ± 0.0002</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Cold-Start Imputation</td>
                <td className="py-3 px-3 text-amber-300">Cosine KNN Peer Imputer</td>
                <td className="py-3 px-3">Binary Multi-Hot Skill Vector Space</td>
                <td className="py-3 px-3 text-slate-400">k=5, department-constrained similarity weighting</td>
                <td className="py-3 px-3 text-right">Leave-One-Out Test</td>
                <td className="py-3 px-3 text-right font-bold text-amber-400">MAE = 1.84 pts</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
