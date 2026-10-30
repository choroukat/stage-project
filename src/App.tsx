import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { PowerBIStudio } from './components/PowerBIStudio';
import { PythonStudio } from './components/PythonStudio';
import { ReactAgentStudio } from './components/ReactAgentStudio';
import { ModelEvaluationDeck } from './components/ModelEvaluationDeck';
import { InferenceSimulator } from './components/InferenceSimulator';
import { TalentProjectMatcher } from './components/TalentProjectMatcher';
import { CvParserAlertsStudio } from './components/CvParserAlertsStudio';
import { EdaAnalyticsStudio } from './components/EdaAnalyticsStudio';
import { DatasetExplorer } from './components/DatasetExplorer';
import { ProjectExplainer } from './components/ProjectExplainer';
import { 
  fetchDatasetSummary, 
  fetchMLAnalytics, 
  fetchClassificationMetrics, 
  fetchRegressionMetrics 
} from './services/dataService';
import { 
  DatasetSummary, 
  MLAnalytics, 
  ClassificationMetrics, 
  RegressionMetrics, 
  Employee,
  ActiveTab
} from './types';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('react_agent');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [mlAnalytics, setMlAnalytics] = useState<MLAnalytics | null>(null);
  const [clsMetrics, setClsMetrics] = useState<ClassificationMetrics | null>(null);
  const [regMetrics, setRegMetrics] = useState<RegressionMetrics | null>(null);

  const [preselectedEmployee, setPreselectedEmployee] = useState<Employee | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, analytics, classification, regression] = await Promise.all([
        fetchDatasetSummary(),
        fetchMLAnalytics(),
        fetchClassificationMetrics(),
        fetchRegressionMetrics()
      ]);
      setDatasetSummary(summary);
      setMlAnalytics(analytics);
      setClsMetrics(classification);
      setRegMetrics(regression);
    } catch (err: any) {
      console.error('Failed to load ML workbench data:', err);
      setError(err?.message || 'Error loading dataset resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectCandidateForTraining = (employee: Employee, _skillToAcquire?: string) => {
    setPreselectedEmployee(employee);
    setActiveTab('inference');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 font-mono">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Initialisation de la Plateforme NTT DATA</h2>
            <p className="text-xs text-slate-400">
              Chargement des 11 809 certifications, modèles ML et agents ReAct...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !datasetSummary || !mlAnalytics || !clsMetrics || !regMetrics) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 font-mono">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white">Échec d'Initialisation</h2>
          <p className="text-xs text-slate-400">{error || 'Erreur lors du chargement des données.'}</p>
          <button
            onClick={loadAllData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-mono mx-auto transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex selection:bg-blue-600/30">
      {/* Sleek Collapsible Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        totalEmployees={datasetSummary.total_employees}
        totalCertificates={datasetSummary.total_certificates}
      />

      {/* Main Content Area (Dynamic padding-left to respect sidebar width) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-72'
        }`}
      >
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          totalEmployees={datasetSummary.total_employees}
          totalCertificates={datasetSummary.total_certificates}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Viewport Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-8">
          {/* 1. Agents ReAct LangChain (24 Tools) */}
          {activeTab === 'react_agent' && (
            <ReactAgentStudio />
          )}

          {/* 2. Power BI Studio & Architecture Décisionnelle */}
          {activeTab === 'powerbi' && (
            <PowerBIStudio
              analytics={mlAnalytics}
              summary={datasetSummary}
            />
          )}

          {/* 3. Studio & Pipeline Python Live */}
          {activeTab === 'python' && (
            <PythonStudio />
          )}

          {/* 4. Évaluation des Modèles ML */}
          {activeTab === 'evaluation' && (
            <ModelEvaluationDeck
              clsMetrics={clsMetrics}
              regMetrics={regMetrics}
              analytics={mlAnalytics}
            />
          )}

          {/* 6. Simulateur d'Inférence & Cold-Start KNN */}
          {activeTab === 'inference' && (
            <InferenceSimulator
              employees={datasetSummary.employees}
              allEmployeesSummary={datasetSummary.all_employees_summary}
              trainings={datasetSummary.trainings}
              certificates={datasetSummary.sample_certificates}
            />
          )}

          {/* 7. Talent & Skill Matcher */}
          {activeTab === 'matcher' && (
            <TalentProjectMatcher
              employees={datasetSummary.all_employees_summary}
              onSelectCandidateForTraining={handleSelectCandidateForTraining}
            />
          )}

          {/* 8. Parseur CV & Alertes 30J */}
          {activeTab === 'portals' && (
            <CvParserAlertsStudio
              summary={datasetSummary}
            />
          )}

          {/* 9. Analyse Exploratoire (EDA) */}
          {activeTab === 'eda' && (
            <EdaAnalyticsStudio
              analytics={mlAnalytics}
              summary={datasetSummary}
            />
          )}

          {/* 10. Explorateur MongoDB Atlas */}
          {activeTab === 'explorer' && (
            <DatasetExplorer summary={datasetSummary} />
          )}

          {/* 11. Architecture & Soutenance (Jury Q&A) */}
          {activeTab === 'explainer' && (
            <ProjectExplainer onNavigateTab={setActiveTab} />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-5 mt-12 text-xs text-slate-400 font-mono">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-semibold font-sans">NTT DATA Morocco</span>
              <span>·</span>
              <span>Site de Tétouan · Pôle Data & IA</span>
              <span>·</span>
              <span>PFE Chorouk Abouhiat</span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span>SMOTE RandomForest (Acc: 95.18%)</span>
              <span>·</span>
              <span>Gradient Boosting Regressor (R²: 0.994)</span>
              <span>·</span>
              <span>24 Outils ReAct</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
