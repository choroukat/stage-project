import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Brain,
  Wrench,
  Search,
  MessageSquare,
  Shield,
  Clock
} from 'lucide-react';

interface AgentMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  thought?: string;
  selectedAgent?: string;
  toolName?: string;
  toolInput?: any;
  observation?: string;
}

export const ReactAgentStudio: React.FC = () => {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'm-init',
      sender: 'agent',
      text: `Bonjour ! Je suis l'Agent Superviseur ReAct de NTT DATA (PFE Chorouk Abouhiat).
J'orchestre **5 agents intelligents** et **24 outils spécialisés** connectés à MongoDB Atlas et aux modèles ML.

Vous pouvez me poser vos questions en **Français**, **Darija marocaine (الدارجة)**, **Anglais** ou **Arabe** !
*Exemple : "Quels employés ont des certifications AWS qui expirent dans 30 jours ?" ou "Chkun li 3ndu certif ghadi tsali ?"*`,
      timestamp: 'Maintenant'
    }
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('Tous');

  // The 24 Tools Catalog from Backend/tools/
  const toolsCatalog = [
    { name: 'certificates_expiring_in_months', agent: 'certificate_agent', desc: 'Identifie les certifications arrivant à échéance sous N mois.' },
    { name: 'expired_certificates', agent: 'certificate_agent', desc: 'Liste les certificats déjà expirés dans l\'historique.' },
    { name: 'count_certificates_by_employee', agent: 'certificate_agent', desc: 'Compte le nombre total de certificats obtenus par un collaborateur.' },
    { name: 'average_score_by_department', agent: 'certificate_agent', desc: 'Calcule le score moyen d\'examen pour chaque département.' },
    { name: 'employee_score_evolution', agent: 'certificate_agent', desc: 'Historique temporel de progression des notes d\'un employé.' },
    { name: 'failed_certificates', agent: 'certificate_agent', desc: 'Extrait les examens échoués pour planifier un repassage.' },
    { name: 'get_employees_by_skill', agent: 'employee_agent', desc: 'Recherche les profils possédant une ou plusieurs compétences clés.' },
    { name: 'get_top_skilled_employees', agent: 'employee_agent', desc: 'Classe les employés les plus multi-certifiés de NTT DATA.' },
    { name: 'get_department_stats', agent: 'employee_agent', desc: 'Statistiques complètes d\'effectifs et de compétences par pôle.' },
    { name: 'recommend_skills_by_department', agent: 'employee_agent', desc: 'Recommande les compétences prioritaires à acquérir par pôle.' },
    { name: 'tool_predict_score_and_success', agent: 'prediction_agent', desc: 'Modèle ML : Prédit la probabilité de succès (RandomForest) et la note (GradientBoosting).' },
    { name: 'tool_employee_ml_profile', agent: 'prediction_agent', desc: 'Profilage ML complet avec features importances et score historique.' },
    { name: 'knn_profile_imputation', agent: 'prediction_agent', desc: 'Cold-Start : Imputation par les K=5 plus proches voisins par similarité cosinus.' },
    { name: 'tool_recommend_best_certification', agent: 'prediction_agent', desc: 'Recommande le meilleur parcours certifiant pour maximiser la réussite.' },
    { name: 'tool_best_employees_for_project', agent: 'prediction_agent', desc: 'Staffing de projet : matching des profils par similarité cosinus de compétences.' },
    { name: 'get_trainings_by_skill', agent: 'training_agent', desc: 'Filtre le catalogue des 899 formations par compétence ciblée.' },
    { name: 'compare_training_providers', agent: 'training_agent', desc: 'Compare le taux de réussite entre AWS, Microsoft, Scrum.org, MongoDB, etc.' },
    { name: 'missing_skills_by_department', agent: 'training_agent', desc: 'Détecte les lacunes de compétences (Skill Gaps) par département.' },
    { name: 'get_employee_complete_profile', agent: 'general_agent', desc: 'Fiche collaborateur à 360° unifiant compétences, formations et certifications.' },
    { name: 'expiring_skills_report', agent: 'general_agent', desc: 'Rapport consolidé d\'audit des compétences à risque d\'expiration.' },
    { name: 'promotion_ready_employees', agent: 'general_agent', desc: 'Identifie les collaborateurs prêts pour une promotion ou passage senior.' },
    { name: 'departments_with_skill_gaps', agent: 'general_agent', desc: 'Classe les départements selon leur niveau d\'écart avec la cible.' },
    { name: 'compare_employees_for_project', agent: 'general_agent', desc: 'Benchmark comparatif direct entre deux profils pour un rôle précis.' },
    { name: 'underqualified_employees', agent: 'general_agent', desc: 'Détecte les employés nécessitant un plan de formation d\'urgence.' }
  ];

  const samplePrompts = [
    { label: 'Expirations 30J (FR)', text: 'Quels employés ont des certifications qui expirent dans 30 jours ?' },
    { label: 'Expirations 30J (Darija 🇲🇦)', text: 'Chkun houma les certifs li ghadi tsali f 30 jours ?' },
    { label: 'Prédiction Examen (ML)', text: 'Prédire la réussite à l\'examen pour un score de 76 en examen blanc et 5 compétences.' },
    { label: 'Cold-Start Nouvel Employé', text: 'Comment résoudre le cold-start pour un nouvel employé recruté en Data & IA ?' },
    { label: 'Recherche Experts AWS/Python', text: 'Trouve-moi les profils du pôle Data & IA qui maîtrisent Python et AWS.' }
  ];

  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || loading) return;

    const userMsg: AgentMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/agent-react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();

      const agentMsg: AgentMessage = {
        id: `a-${Date.now()}`,
        sender: 'agent',
        text: data.final_answer || 'Réponse reçue.',
        thought: data.thought,
        selectedAgent: data.selected_agent,
        toolName: data.tool_name,
        toolInput: data.tool_input,
        observation: data.observation,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'agent',
          text: `Erreur de traitement : ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 border border-purple-500/30 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                LANGCHAIN REACT SUPERVISOR
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                24 Outils Spécialisés · LLaMA 3.3 / Gemini
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Console des Agents ReAct Multi-Agents (LangChain)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Architecture ReAct (<em>Reasoning + Acting</em>) développée pour NTT DATA Tétouan. L'agent analyse la question, choisit dynamiquement l'outil parmi les 24 fonctions de la plateforme, interroge MongoDB Atlas ou Scikit-Learn, et formule une réponse multilingue (Français, Darija 🇲🇦, Anglais, Arabe).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 shrink-0 text-xs font-mono">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <span className="text-slate-400 block text-[10px]">Statut Orchestrateur</span>
              <span className="text-white font-bold">5 Agents Prêts</span>
            </div>
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Questions rapides :
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-purple-950/40 text-slate-300 hover:text-purple-200 border border-slate-800 hover:border-purple-500/30 text-xs font-mono transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chat Conversation Column */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col h-[650px]">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl p-4 text-xs font-sans leading-relaxed space-y-3 ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-600/20'
                      : 'bg-slate-950/90 text-slate-200 border border-slate-800/80 rounded-bl-xs'
                  }`}
                >
                  {/* If ReAct trace exists, show Thought / Action / Observation steps */}
                  {m.thought && (
                    <div className="space-y-2 pb-3 border-b border-slate-800/80 font-mono text-[11px]">
                      {/* Thought */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30 text-purple-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-purple-300">
                          <Brain className="w-3.5 h-3.5" />
                          <span>1. Pensée de l'Agent (Thought) :</span>
                        </div>
                        <p className="leading-snug">{m.thought}</p>
                      </div>

                      {/* Action & Tool */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-cyan-200 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>2. Outil Exécuté (Action) :</span>
                        </div>
                        <p className="font-bold">{m.toolName} (Agent : {m.selectedAgent})</p>
                        {m.toolInput && (
                          <div className="text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded">
                            Arguments : {JSON.stringify(m.toolInput)}
                          </div>
                        )}
                      </div>

                      {/* Observation */}
                      {m.observation && (
                        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-emerald-200 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>3. Données Observées (Observation) :</span>
                          </div>
                          <p className="leading-snug">{m.observation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Final message text */}
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  <span className="text-[10px] opacity-60 font-mono block text-right">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-4 bg-slate-950 border border-purple-500/30 rounded-2xl max-w-sm text-xs font-mono text-purple-300">
                <RotateCcw className="w-4 h-4 animate-spin text-purple-400" />
                <span>Raisonnement ReAct en cours (sélection d'outil)...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="pt-4 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Posez une question en Français, Darija marocaine, Anglais ou Arabe..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-sans text-white focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2"
              >
                <span>Envoyer</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* 24 Tools Catalog Column */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col h-[650px]">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-purple-400" />
                <span>Catalogue des 24 Outils</span>
              </h3>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                LangChain
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cliquez sur un outil pour tester un exemple de prompt associé.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-3 scrollbar-thin">
            {toolsCatalog.map((tool) => (
              <button
                key={tool.name}
                onClick={() => handleSendMessage(`Exécute l'outil ${tool.name} pour analyser les données.`)}
                className="w-full text-left p-3 rounded-xl bg-slate-950/70 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-purple-300 group-hover:text-purple-200 truncate">
                    {tool.name}
                  </span>
                  <span className="text-[9px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded shrink-0">
                    {tool.agent}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  {tool.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
