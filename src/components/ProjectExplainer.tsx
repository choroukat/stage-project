import React, { useState } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  ShieldAlert, 
  Binary, 
  Users, 
  Send, 
  Check, 
  Copy, 
  FileText, 
  BookOpen, 
  ChevronRight, 
  GraduationCap,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';

interface ProjectExplainerProps {
  onNavigateTab?: (tab: any) => void;
}

interface QuestionPreset {
  id: string;
  topic: string;
  title: string;
  badge: string;
  badgeColor: string;
}

const PRESET_TOPICS: QuestionPreset[] = [
  {
    id: 'leakage',
    topic: 'leakage',
    title: 'Audit du Data Leakage : Pourquoi 100% était faux et comment la fuite a été résolue',
    badge: 'Audit Critique',
    badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30'
  },
  {
    id: 'models',
    topic: 'models',
    title: 'Architecture ML : Random Forest + SMOTE (95.18%) et Gradient Boosting (R²=0.994)',
    badge: 'Modélisation',
    badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-500/30'
  },
  {
    id: 'knn',
    topic: 'knn',
    title: 'Résolution du Cold-Start : Imputation KNN sur les pairs pour nouveaux employés',
    badge: 'Cold-Start KNN',
    badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-500/30'
  },
  {
    id: 'jury',
    topic: 'jury',
    title: 'Questions probables du Jury de Soutenance PFE & Réponses types recommandées',
    badge: 'Prépa Soutenance',
    badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
  }
];

export const ProjectExplainer: React.FC<ProjectExplainerProps> = () => {
  const [activeTopic, setActiveTopic] = useState<string>('leakage');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'topics' | 'briefing'>('topics');

  // Trigger explanation for topic or custom question
  const fetchExplanation = async (questionText: string, topicKey?: string) => {
    setLoading(true);
    setChatResponse(null);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, topic: topicKey })
      });
      const data = await res.json();
      setChatResponse(data.answer || 'Aucune réponse générée.');
    } catch (err) {
      setChatResponse("Erreur de connexion avec le moteur d'explication. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: QuestionPreset) => {
    setActiveTopic(preset.id);
    fetchExplanation(preset.title, preset.topic);
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;
    fetchExplanation(customQuestion);
    setCustomQuestion('');
  };

  const copyAnswer = () => {
    if (!chatResponse) return;
    navigator.clipboard.writeText(chatResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold text-blue-400">
                PFE Defense & Methodology Assistant
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">
                NTT DATA HR Intelligence Platform
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Assistant Explicatif & Préparation de Soutenance PFE
            </h2>
            <p className="text-xs text-slate-300">
              Explication scientifique et pédagogique des choix d'ingénierie ML, de la correction du data leakage, et simulation des questions du jury.
            </p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setViewMode('topics')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'topics' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mode Questions & Sujets
            </button>
            <button
              onClick={() => setViewMode('briefing')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'briefing' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fiche Synthétique PFE
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'topics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Preset Topics & Live Question Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-md">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                Thématiques Majeures du PFE
              </span>

              <div className="space-y-2">
                {PRESET_TOPICS.map((preset) => {
                  const isSelected = activeTopic === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${preset.badgeColor}`}>
                          {preset.badge}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                      <div className="font-semibold text-slate-100 text-xs leading-snug">
                        {preset.title}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Question Input */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-md">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Poser une question spécifique au projet</span>
              </span>

              <form onSubmit={handleSubmitQuestion} className="space-y-3">
                <textarea
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ex : Comment le seuil tau influence la recall de la classe échec ? Pourquoi pas XGBoost ? Quels sont les enjeux éthiques ?"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans resize-none"
                />

                <button
                  type="submit"
                  disabled={loading || !customQuestion.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold font-mono transition-colors shadow-md shadow-blue-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{loading ? 'Analyse en cours...' : 'Demander une explication'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Structured Explanation Panel */}
          <div className="lg:col-span-7 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Explication Technique & Méthodologique
                </h3>
              </div>

              {chatResponse && (
                <button
                  onClick={copyAnswer}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-mono px-2.5 py-1 rounded bg-slate-950 border border-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copié !' : 'Copier l\'explication'}</span>
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3 font-mono text-xs text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
                <p>Synthèse de l'expertise Data Science & analyse des métriques...</p>
              </div>
            ) : chatResponse ? (
              <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3 text-slate-300 font-sans">
                <div className="whitespace-pre-line leading-relaxed">
                  {chatResponse}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center space-y-3 font-mono text-xs text-slate-400">
                <p>Sélectionnez un sujet à gauche ou posez une question technique sur le projet.</p>
                <button
                  onClick={() => handleSelectPreset(PRESET_TOPICS[0])}
                  className="px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors"
                >
                  Voir l'audit du Data Leakage (Sujet Recommandé)
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fiche de Soutenance / Executive Briefing */
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 shadow-xl space-y-8">
          <div className="border-b border-slate-800 pb-5">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-blue-400" />
              <span className="text-xs uppercase font-mono font-bold text-blue-400">
                Projet de Fin d'Études · Fiche de Synthèse pour le Jury
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Plateforme d'Intelligence RH et Prédiction de Compétences — NTT DATA
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Étudiante : Chorouk · Entreprise d'accueil : NTT DATA Maroc
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center font-mono text-xs">1</span>
                <span>Problématique Métier & Contexte</span>
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                NTT DATA investit massivement dans les montées en compétences de ses 1 906 collaborateurs. Le coût des certifications (AWS, Microsoft, MongoDB, Kubernetes) est élevé. L'enjeu est d'anticiper les risques d'échec, d'adapter les parcours et de matcher immédiatement les talents aux appels d'offres clients.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-xs">2</span>
                <span>Données & Préparation</span>
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Exploitation de 11 809 enregistrements de certifications réelles, 1 906 profils employés et 899 formations. Ingénierie de 26 features : 4 scores d'évaluation continue, durée, historique individuel, département et organisme certificateur.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-xs">3</span>
                <span>Modélisation ML & Rigueur Anti-Leakage</span>
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Découverte et élimination de la fuite de données causée par le délai de certification. Déploiement d'un Random Forest avec SMOTE (95.18% d'accuracy, F1 = 0.9507) et d'un Gradient Boosting Regressor pour la note continue ($R^2 = 0.9942$, MAE = 0.29 pts).
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-xs">4</span>
                <span>Innovations Algorithmiques</span>
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Résolution du cold-start pour les nouveaux embauchés via KNN sur l'espace vectoriel des compétences, et moteur de staffing de projet calculant la similarité cosinus avec identification immédiate des lacunes de compétences (*skill gaps*).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
