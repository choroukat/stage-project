import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Copy,
  Check,
  Download,
  Database,
  Layers,
  Code2,
  FileText,
  AlertTriangle,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  ExternalLink,
  Filter
} from 'lucide-react';
import { MLAnalytics, DatasetSummary } from '../types';

interface PowerBIStudioProps {
  analytics: MLAnalytics;
  summary: DatasetSummary;
}

export const PowerBIStudio: React.FC<PowerBIStudioProps> = ({ analytics, summary }) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'schema' | 'dax' | 'powerquery' | 'readme'>('dashboard');
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [copiedReadme, setCopiedReadme] = useState<boolean>(false);
  const [copiedDax, setCopiedDax] = useState<string | null>(null);

  // Selected Department Filter in Dashboard simulator
  const [selectedDept, setSelectedDept] = useState<string>('Tous');

  useEffect(() => {
    fetch('/api/powerbi-readme')
      .then((r) => r.json())
      .then((data) => {
        if (data.content) setReadmeContent(data.content);
      })
      .catch(() => {
        // fallback
        fetch('/README_POWER_BI.md')
          .then((r) => r.text())
          .then((txt) => setReadmeContent(txt))
          .catch(() => {});
      });
  }, []);

  const handleCopyReadme = () => {
    navigator.clipboard.writeText(readmeContent);
    setCopiedReadme(true);
    setTimeout(() => setCopiedReadme(false), 2000);
  };

  const handleDownloadReadme = () => {
    const blob = new Blob([readmeContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'README_POWER_BI.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyDax = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedDax(key);
    setTimeout(() => setCopiedDax(null), 2000);
  };

  const daxFormulas = [
    {
      id: 'tx_reussite',
      title: 'Taux de Réussite aux Certifications (%)',
      category: 'KPIs Principaux',
      description: 'Calcule le ratio exact entre certifications délivrées et certifications tentées.',
      formula: `Taux de Réussite (%) = 
VAR TotalTentes = [Certifications Délivrées] + [Certifications Échouées]
RETURN
DIVIDE([Certifications Délivrées], TotalTentes, 0) * 100`
    },
    {
      id: 'alert_30j',
      title: 'Certifications Expirant dans ≤ 30 Jours (Critique)',
      category: 'Alertes & Conformité',
      description: 'Filtre les certificats valides dont la date d\'expiration intervient sous 30 jours.',
      formula: `Certifications Expirant dans 30J = 
CALCULATE(
    COUNTROWS(Fact_Certifications),
    Fact_Certifications[Days_To_Expire] > 0,
    Fact_Certifications[Days_To_Expire] <= 30,
    Fact_Certifications[Status] = "issued"
)`
    },
    {
      id: 'score_moyen',
      title: 'Score Moyen d\'Examen par Département',
      category: 'Performance',
      description: 'Score moyen continu calculé en ignorant les filtres individuels.',
      formula: `Score Moyen Département = 
CALCULATE(
    AVERAGE(Fact_Certifications[Exam_Score]),
    ALLEXCEPT(Dim_Employees, Dim_Employees[Department])
)`
    },
    {
      id: 'employabilite',
      title: 'Taux d\'Employabilité Moyen Collaborateurs',
      category: 'Compétences',
      description: 'Moyenne pondérée des scores d\'employabilité calculés par l\'algorithme de profilage.',
      formula: `Taux d'Employabilité Moyen = 
AVERAGE(Dim_Employees[Employability_Score])`
    },
    {
      id: 'risque_ml',
      title: 'Candidats Détectés à Haut Risque d\'Échec (ML)',
      category: 'Machine Learning',
      description: 'Identifie les employés dont la probabilité estimée par le modèle Random Forest est < 65%.',
      formula: `Candidats à Haut Risque d'Échec = 
CALCULATE(
    COUNTROWS(Fact_ML_Predictions),
    Fact_ML_Predictions[Pred_Success_Pct] < 0.65
)`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg">
                MICROSOFT POWER BI DESKTOP & SERVICE
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                Schéma en Étoile (Star Schema)
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Studio Power BI & Architecture Décisionnelle RH
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Spécification technique complète rédigée pour NTT DATA Tétouan : Modélisation décisionnelle, formules DAX prêtes à l'emploi, pipeline M-Query et fichier <code>README_POWER_BI.md</code> officiel.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleCopyReadme}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition-colors shadow-sm"
            >
              {copiedReadme ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
              <span>{copiedReadme ? 'README Copié !' : 'Copier README_POWER_BI.md'}</span>
            </button>
            <button
              onClick={handleDownloadReadme}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono transition-colors shadow-lg shadow-amber-600/20 font-semibold"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger le .md</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeSubTab === 'dashboard'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Tableau de Bord Exécutif Simulé</span>
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeSubTab === 'schema'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Schéma en Étoile (Star Schema)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('dax')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeSubTab === 'dax'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Formules DAX (5 Mesures Clés)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('powerquery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeSubTab === 'powerquery'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Power Query (M) Script</span>
          </button>
          <button
            onClick={() => setActiveSubTab('readme')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeSubTab === 'readme'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Visualiseur README_POWER_BI.md</span>
          </button>
        </div>
      </div>

      {/* ── SUBTAB 1 : TABLEAU DE BORD EXÉCUTIF POWER BI SIMULÉ ─────────── */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Slicer / Filters Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-mono text-slate-300 font-semibold">
                Filtre Interactif Département :
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="Tous">Tous les départements (10)</option>
                {analytics.dept_summary.map((d) => (
                  <option key={d.department} value={d.department}>
                    {d.department}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs font-mono text-slate-400">
              Source : MongoDB Atlas · Modèle Relationnel Star Schema
            </div>
          </div>

          {/* Top 4 KPI Cards (Power BI Card Visuals) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Total Collaborateurs</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {summary.total_employees.toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                100% actifs sur le site de Tétouan
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Certifications Délivrées</span>
                <Award className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-cyan-300">
                {summary.total_certificates.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Across 899 parcours certifiants
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-slate-400">Taux de Réussite Global</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                99.64%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Précision ML associée : 95.18%
              </span>
            </div>

            <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-rose-300">Alerte Expirations 30J</span>
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              </div>
              <div className="text-2xl font-bold font-mono text-rose-400">
                4 certificats
              </div>
              <span className="text-[10px] text-rose-300 font-mono">
                Action immédiate requise
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Répartition par Département (Dim_Employees)</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">10 Pôles</span>
              </div>
              <div className="space-y-3">
                {analytics.dept_summary
                  .filter((d) => selectedDept === 'Tous' || d.department === selectedDept)
                  .map((d) => {
                    const maxVal = 3200;
                    const pct = (d.total / maxVal) * 100;
                    return (
                      <div key={d.department} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-200">{d.department}</span>
                          <span className="text-slate-400">
                            {d.total.toLocaleString()} certifs ·{' '}
                            <span className="text-emerald-400">{d.pass_rate}% pass</span>
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Providers Breakdown */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Award className="w-4 h-4 text-cyan-400" />
                  <span>Top Organismes Certificateurs (Dim_Providers)</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">9 Partenaires</span>
              </div>
              <div className="space-y-3">
                {analytics.prov_summary.map((p) => {
                  const maxP = 2000;
                  const pct = (p.total / maxP) * 100;
                  return (
                    <div key={p.provider} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-200">{p.provider}</span>
                        <span className="text-slate-400">
                          {p.total.toLocaleString()} examens ·{' '}
                          <span className="text-cyan-400">{p.avg_score} pts avg</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-indigo-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 2 : SCHÉMA EN ÉTOILE (STAR SCHEMA) ───────────────────── */}
      {activeSubTab === 'schema' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Architecture Dimensionnelle en Étoile (Star Schema)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Modélisation conçue pour Power BI Desktop, optimisant le calcul des agrégations DAX et évitant les jointures relationnelles bidirectionnelles non nécessaires.
            </p>
          </div>

          {/* Visual Model Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Dim_Employees */}
            <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-blue-400">Dim_Employees</span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded">
                  1 906 Lignes (1)
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 Employee_ID (PK)</li>
                <li>Full_Name</li>
                <li>Department</li>
                <li>Email</li>
                <li>Role</li>
                <li>Joined_Date</li>
                <li>Employability_Score</li>
              </ul>
            </div>

            {/* Fact_Certifications */}
            <div className="bg-slate-950/90 border border-amber-500/50 rounded-xl p-4 space-y-3 shadow-lg shadow-amber-950/30 md:scale-105">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-amber-400">Fact_Certifications</span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded">
                  11 809 Lignes (*)
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 Certificate_ID (PK)</li>
                <li className="text-blue-400">🔗 Employee_ID (FK)</li>
                <li className="text-cyan-400">🔗 Training_ID (FK)</li>
                <li className="text-indigo-400">🔗 Provider_ID (FK)</li>
                <li className="text-emerald-400">🔗 Date_Issue_ID (FK)</li>
                <li>Exam_Score (Mesure)</li>
                <li>Days_To_Expire (Mesure)</li>
                <li>Status (issued/failed)</li>
                <li>Expiring_30D (Indicateur)</li>
              </ul>
            </div>

            {/* Dim_Trainings */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">Dim_Trainings</span>
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded">
                  899 Lignes (1)
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 Training_ID (PK)</li>
                <li>Title</li>
                <li>Skill_Acquired</li>
                <li>Category</li>
                <li>Duration_Days</li>
                <li>Target_Department</li>
              </ul>
            </div>
          </div>

          {/* Secondary Dimension Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Dim_Providers */}
            <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-indigo-400">Dim_Providers</span>
                <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded">
                  9 Partenaires (1)
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 Provider_ID (PK)</li>
                <li>Provider_Name</li>
                <li>Official_Partner (Yes/No)</li>
                <li>Accreditation_Level</li>
              </ul>
            </div>

            {/* Fact_ML_Predictions */}
            <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-purple-400">Fact_ML_Predictions</span>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">
                  Prédictions (*)
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-blue-400">🔗 Employee_ID (FK)</li>
                <li className="text-cyan-400">🔗 Training_ID (FK)</li>
                <li>Pred_Success_Pct (0.00-1.00)</li>
                <li>Pred_Final_Score (0-100)</li>
                <li>Risk_Level (Faible/Moyen/Élevé)</li>
              </ul>
            </div>

            {/* Dim_Calendar */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400">Dim_Calendar</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded">
                  Calendrier Continu
                </span>
              </div>
              <ul className="text-xs font-mono space-y-1.5 text-slate-300">
                <li className="text-amber-400 font-semibold">🔑 Date_Key (YYYYMMDD)</li>
                <li>Full_Date</li>
                <li>Year / Quarter</li>
                <li>Month_Name / Month_No</li>
                <li>Week_Number</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 3 : FORMULES DAX (CATALOGUE AVEC 1-CLIC COPY) ───────── */}
      {activeSubTab === 'dax' && (
        <div className="space-y-4">
          {daxFormulas.map((item) => (
            <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.category}
                    </span>
                    <h4 className="text-sm font-bold text-white font-mono">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <button
                  onClick={() => handleCopyDax(item.id, item.formula)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors shrink-0"
                >
                  {copiedDax === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{copiedDax === item.id ? 'Formule Copiée !' : 'Copier DAX'}</span>
                </button>
              </div>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-x-auto font-mono text-xs text-amber-200/90 leading-relaxed">
                <pre>{item.formula}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SUBTAB 4 : POWER QUERY M-CODE ─────────────────────────────────── */}
      {activeSubTab === 'powerquery' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Script Power Query (M) : Ingestion & Colonnes Calculées</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                À coller dans l'éditeur avancé de Power BI Desktop pour transformer l'export de certifications.
              </p>
            </div>
            <button
              onClick={() => {
                const code = `let
    Source = Csv.Document(File.Contents("C:\\NTT_DATA_HR\\data_certificates.csv"), [Delimiter=",", Columns=12, Encoding=65001, QuoteStyle=QuoteStyle.None]),
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
    #"Jours Restants Ajoutés" = Table.AddColumn(#"Types modifiés", "Days_To_Expire", each 
        if [expiry_date] <> null then 
            Duration.Days([expiry_date] - DateTime.Date(DateTime.LocalNow()))
        else 9999, Int64.Type),
    #"Alerte 30J Ajoutée" = Table.AddColumn(#"Jours Restants Ajoutés", "Expiring_30D", each 
        if [Days_To_Expire] > 0 and [Days_To_Expire] <= 30 then 1 else 0, Int64.Type)
in
    #"Alerte 30J Ajoutée"`;
                navigator.clipboard.writeText(code);
                setCopiedDax('m_query');
                setTimeout(() => setCopiedDax(null), 2000);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors"
            >
              {copiedDax === 'm_query' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDax === 'm_query' ? 'M-Code Copié !' : 'Copier Script M'}</span>
            </button>
          </div>

          <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 overflow-x-auto font-mono text-xs text-cyan-200/90 leading-relaxed">
            <pre>{`let
    Source = Csv.Document(File.Contents("C:\\NTT_DATA_HR\\data_certificates.csv"), [Delimiter=",", Columns=12, Encoding=65001, QuoteStyle=QuoteStyle.None]),
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
    #"Jours Restants Ajoutés" = Table.AddColumn(#"Types modifiés", "Days_To_Expire", each 
        if [expiry_date] <> null then 
            Duration.Days([expiry_date] - DateTime.Date(DateTime.LocalNow()))
        else 9999, Int64.Type),
    #"Alerte 30J Ajoutée" = Table.AddColumn(#"Jours Restants Ajoutés", "Expiring_30D", each 
        if [Days_To_Expire] > 0 and [Days_To_Expire] <= 30 then 1 else 0, Int64.Type)
in
    #"Alerte 30J Ajoutée"`}</pre>
          </div>
        </div>
      )}

      {/* ── SUBTAB 5 : README_POWER_BI.MD COMPLET ─────────────────────────── */}
      {activeSubTab === 'readme' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-bold text-white font-mono">README_POWER_BI.md</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReadme}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors"
              >
                {copiedReadme ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReadme ? 'Copié !' : 'Copier'}</span>
              </button>
              <button
                onClick={handleDownloadReadme}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-mono transition-colors font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 max-h-[600px] overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
            {readmeContent || 'Chargement du fichier README_POWER_BI.md...'}
          </div>
        </div>
      )}
    </div>
  );
};
