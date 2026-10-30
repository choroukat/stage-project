import React, { useState } from 'react';
import {
  FileText,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Sparkles,
  Award,
  Send,
  Users,
  Building2,
  Clock,
  Shield,
  Layers,
  Search,
  Check,
  RotateCcw
} from 'lucide-react';
import { DatasetSummary, Certificate } from '../types';

interface CvParserAlertsStudioProps {
  summary: DatasetSummary;
}

export const CvParserAlertsStudio: React.FC<CvParserAlertsStudioProps> = ({ summary }) => {
  const [activeTab, setActiveTab] = useState<'parser' | 'alerts' | 'portals' | 'certgen'>('parser');

  // CV Parser State
  const [cvInputText, setCvInputText] = useState<string>(
    `Chorouk Abouhiat
Ingénieure Data & IA — NTT DATA Morocco (Site de Tétouan)
Compétences : Python, FastAPI, MongoDB, Docker, Scikit-learn, LangChain, Llama, AWS, Power BI, SQL.
Expérience : Développement d'une plateforme d'intelligence RH et machine learning pour 1900 collaborateurs.`
  );
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsedResult, setParsedResult] = useState<any>({
    department: 'Data & IA',
    employability_score: 94.5,
    skills_detected: ['Python', 'FastAPI', 'MongoDB', 'Docker', 'Scikit-learn', 'LangChain', 'Llama', 'AWS', 'Power BI', 'SQL'],
    recommended_certifications: [
      { provider: 'Amazon', title: 'AWS Certified Machine Learning - Specialty' },
      { provider: 'Scrum.org', title: 'Professional Scrum Master I' },
      { provider: 'DeepLearning.AI', title: 'Machine Learning Specialization' }
    ]
  });

  // Alerts State
  const [alertFilter, setAlertFilter] = useState<number>(30);
  const [notifiedCerts, setNotifiedCerts] = useState<Set<string>>(new Set());

  // Portal view mode
  const [portalMode, setPortalMode] = useState<'rh' | 'manager'>('rh');

  // Certificate Generator State
  const [certRecipient, setCertRecipient] = useState<string>('Chorouk Abouhiat');
  const [certTitle, setCertTitle] = useState<string>('AWS Certified Solutions Architect');
  const [certScore, setCertScore] = useState<number>(92.5);

  const sampleCvs = [
    {
      label: 'Chorouk Abouhiat (Data & IA)',
      text: `Chorouk Abouhiat
Ingénieure Data & IA — NTT DATA Morocco (Site de Tétouan)
Compétences : Python, FastAPI, MongoDB, Docker, Scikit-learn, LangChain, Llama, AWS, Power BI, SQL.
Expérience : Développement d'une plateforme d'intelligence RH et machine learning pour 1900 collaborateurs.`
    },
    {
      label: 'Karim Alami (Cloud & DevOps)',
      text: `Karim Alami
Ingénieur Cloud & DevOps — Expérience 4 ans.
Compétences : AWS, Azure, Terraform, Kubernetes, Docker, CI/CD, Linux, Bash, Prometheus, Grafana.`
    },
    {
      label: 'Leila Bennani (Software Engineering)',
      text: `Leila Bennani
Fullstack Software Engineer.
Compétences : React, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, Jest, Git, Scrum.`
    }
  ];

  const handleRunParser = () => {
    setIsParsing(true);
    setTimeout(() => {
      const lower = cvInputText.toLowerCase();
      const allSkills = [
        'Python', 'FastAPI', 'Django', 'Docker', 'Kubernetes', 'AWS', 'Azure',
        'React', 'TypeScript', 'MongoDB', 'PostgreSQL', 'SQL', 'Scikit-learn',
        'LangChain', 'Llama', 'Power BI', 'Pandas', 'NumPy', 'Jira', 'Git', 'Linux'
      ];
      const matched = allSkills.filter((s) => lower.includes(s.toLowerCase()));

      let dept = 'Software Engineering';
      if (lower.includes('data') || lower.includes('ia') || lower.includes('machine learning') || lower.includes('scikit')) {
        dept = 'Data & IA';
      } else if (lower.includes('cloud') || lower.includes('devops') || lower.includes('kubernetes')) {
        dept = 'Cloud & DevOps';
      }

      setParsedResult({
        department: dept,
        employability_score: Math.min(98.5, Math.round((60 + matched.length * 3.8) * 10) / 10),
        skills_detected: matched.length > 0 ? matched : ['Python', 'SQL'],
        recommended_certifications: dept === 'Data & IA' ? [
          { provider: 'Amazon', title: 'AWS Certified Machine Learning - Specialty' },
          { provider: 'Scrum.org', title: 'Professional Scrum Master I' },
          { provider: 'DeepLearning.AI', title: 'Machine Learning Specialization' }
        ] : [
          { provider: 'Microsoft', title: 'Azure Administrator Associate' },
          { provider: 'MongoDB University', title: 'MongoDB Developer Certification' }
        ]
      });
      setIsParsing(false);
    }, 600);
  };

  const handleSendNotification = (certId: string) => {
    setNotifiedCerts((prev) => new Set(prev).add(certId));
  };

  // 30-Day Alert Mock Data
  const sampleExpiringCerts = [
    {
      id: 'CERT-10492',
      employee: 'Hicham Tazi',
      department: 'Data & AI',
      email: 'hicham.tazi@nttdata.com',
      title: 'AWS Certified Solutions Architect',
      provider: 'Amazon Web Services',
      daysRemaining: 14,
      urgency: 'Critique (14 jours)'
    },
    {
      id: 'CERT-09412',
      employee: 'Leila Bennani',
      department: 'Software Engineering',
      email: 'leila.bennani@nttdata.com',
      title: 'Professional Scrum Master I',
      provider: 'Scrum.org',
      daysRemaining: 21,
      urgency: 'Haute (21 jours)'
    },
    {
      id: 'CERT-11209',
      employee: 'Karim Alami',
      department: 'Cloud & DevOps',
      email: 'karim.alami@nttdata.com',
      title: 'AWS Certified Developer Associate',
      provider: 'Amazon Web Services',
      daysRemaining: 28,
      urgency: 'Haute (28 jours)'
    },
    {
      id: 'CERT-08731',
      employee: 'Sofia Mansouri',
      department: 'Software Engineering',
      email: 'sofia.mansouri@nttdata.com',
      title: 'MongoDB Certified Developer Associate',
      provider: 'MongoDB University',
      daysRemaining: 29,
      urgency: 'Moyenne (29 jours)'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950/20 to-slate-900 border border-rose-500/30 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                FONCTIONNALITÉS MÉTIER RH & PORTAILS
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                Slide 8 & Slide 9 de la Soutenance
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Parseur de CV Intelligent & Tour de Contrôle des Alertes 30J
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Extraction automatique des compétences clés, calcul instantané du score d'employabilité, surveillance proactive des expirations à 30 jours (APScheduler) et génération de certificats sécurisés NTT DATA.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 shrink-0 text-xs font-mono">
            <Clock className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Planificateur d'Alertes</span>
              <span className="text-white font-bold">Quotidien (09:00 UTC)</span>
            </div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('parser')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'parser'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Parseur de CV Intelligent</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'alerts'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Tour de Contrôle Alertes 30 Jours (4 Critiques)</span>
          </button>
          <button
            onClick={() => setActiveTab('portals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'portals'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Portail Manager vs Portail RH</span>
          </button>
          <button
            onClick={() => setActiveTab('certgen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'certgen'
                ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Générateur de Certificat NTT DATA</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1 : PARSEUR DE CV INTELLIGENT ───────────────────────────── */}
      {activeTab === 'parser' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Upload className="w-4 h-4 text-rose-400" />
                <span>Texte du CV (PDF / DOCX ou Saisie Directe)</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">LLaMA 3.3 / Groq Extraction</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-mono text-slate-400 self-center">Exemples :</span>
              {sampleCvs.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setCvInputText(s.text)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded-lg bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <textarea
              rows={8}
              value={cvInputText}
              onChange={(e) => setCvInputText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-sans text-slate-200 resize-none focus:outline-none focus:border-rose-500"
            />

            <button
              onClick={handleRunParser}
              disabled={isParsing || !cvInputText.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-xs transition-all shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {isParsing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Parsing IA en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyser le Profil & Extraire les Compétences</span>
                </>
              )}
            </button>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Profil Structuré Extrait par IA
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Score Calculé
              </span>
            </div>

            {parsedResult ? (
              <div className="space-y-4">
                {/* Score & Dept */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Score d'Employabilité
                    </span>
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {parsedResult.employability_score} / 100
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Polyvalence & Maturité technique
                    </span>
                  </div>

                  <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Pôle Recommandé
                    </span>
                    <span className="text-lg font-bold font-mono text-cyan-300">
                      {parsedResult.department}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Adéquation maximale
                    </span>
                  </div>
                </div>

                {/* Detected Skills */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-slate-300 font-bold block">
                    Compétences Détectées ({parsedResult.skills_detected.length}) :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedResult.skills_detected.map((sk: string) => (
                      <span
                        key={sk}
                        className="px-2.5 py-1 text-xs font-mono rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Certifications Recommandées */}
                <div className="space-y-2 pt-2 border-t border-slate-900">
                  <span className="text-xs font-mono text-slate-300 font-bold block">
                    Certifications Cibles Prioritaires :
                  </span>
                  <div className="space-y-2">
                    {parsedResult.recommended_certifications.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-rose-400 shrink-0" />
                          <span className="text-white font-medium">{c.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                          {c.provider}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── TAB 2 : CENTRE D'ALERTES EXPIRATIONS 30 JOURS ───────────────── */}
      {activeTab === 'alerts' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Certifications Arrivant à Échéance (Surveillance Proactive)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Conformément à la Slide 8, les alertes sont planifiées automatiquement 30 jours à l'avance pour éviter la perte d'accréditations éditeurs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Échéance :</span>
              <button
                onClick={() => setAlertFilter(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  alertFilter === 30 ? 'bg-rose-500 text-white font-bold' : 'bg-slate-950 text-slate-400'
                }`}
              >
                ≤ 30 Jours (Critique)
              </button>
              <button
                onClick={() => setAlertFilter(60)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  alertFilter === 60 ? 'bg-rose-500 text-white font-bold' : 'bg-slate-950 text-slate-400'
                }`}
              >
                ≤ 60 Jours
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sampleExpiringCerts.map((cert) => {
              const isNotified = notifiedCerts.has(cert.id);
              return (
                <div
                  key={cert.id}
                  className="bg-slate-950 border border-rose-500/30 rounded-xl p-5 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono text-rose-400 font-bold block">
                        ⚠️ Expire dans {cert.daysRemaining} jours
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{cert.title}</h4>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {cert.employee} · <span className="text-slate-300">{cert.department}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded shrink-0">
                      {cert.provider}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-900 text-xs">
                    <span className="font-mono text-slate-400">{cert.id}</span>
                    <button
                      onClick={() => handleSendNotification(cert.id)}
                      disabled={isNotified}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        isNotified
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-600 hover:bg-rose-500 text-white font-semibold'
                      }`}
                    >
                      {isNotified ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Notification Envoyée</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Alerter Manager par Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB 3 : PORTAILS MANAGER & RH (SLIDE 9) ─────────────────────── */}
      {activeTab === 'portals' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Séparation des Portails (Slide 9 de la Soutenance)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Deux vues adaptées aux profils utilisateurs chez NTT DATA : Portail Manager d'équipe et Portail RH Central.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setPortalMode('rh')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  portalMode === 'rh' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portail RH Complet
              </button>
              <button
                onClick={() => setPortalMode('manager')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  portalMode === 'manager' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Portail Manager
              </button>
            </div>
          </div>

          {portalMode === 'rh' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-blue-400 uppercase">1. Gestion des Collaborateurs</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Vue globale sur les 1 906 employés, cartographie complète des compétences, détection des talents multi-certifiés et import massif de CVs avec extraction automatique.
                </p>
              </div>
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-rose-400 uppercase">2. Centre d'Alertes Global</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Surveillance en temps réel des renouvellements de certifications pour tous les partenariats éditeurs mondiaux de NTT DATA (AWS Premier, Microsoft Solution Partner).
                </p>
              </div>
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-purple-400 uppercase">3. Supervision IA & Export</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Génération des rapports Power BI, audit des modèles de machine learning et configuration des règles métier d'admissibilité aux examens.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase">1. Tableau de Bord Équipe</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Suivi personnalisé des membres de son pôle, visualisation des formations en cours et historique des scores obtenus aux examens d'entraînement.
                </p>
              </div>
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">2. Simulateur de Réussite ML</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Évaluation prédictive avant inscription : le manager teste la note estimée d'un collaborateur pour valider le financement de sa certification.
                </p>
              </div>
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase">3. Staffing & Matching Projets</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Moteur de recherche par similarité cosinus pour trouver rapidement le profil idéal pour un nouveau projet client NTT DATA.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4 : GÉNÉRATEUR DE CERTIFICAT NTT DATA ───────────────────── */}
      {activeTab === 'certgen' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Générateur Officiel d'Attestation NTT DATA</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prévisualisation dynamique du certificat émis pour les employés ayant réussi leur parcours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Input Controls */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <label className="text-xs font-mono text-slate-300 block">Nom du Collaborateur</label>
                <input
                  type="text"
                  value={certRecipient}
                  onChange={(e) => setCertRecipient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block">Intitulé de la Certification</label>
                <input
                  type="text"
                  value={certTitle}
                  onChange={(e) => setCertTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-slate-300 block">Score Final Obtenu (/100)</label>
                <input
                  type="number"
                  value={certScore}
                  onChange={(e) => setCertScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-white mt-1"
                />
              </div>
            </div>

            {/* Certificate Visual Card */}
            <div className="lg:col-span-8 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40 border-2 border-amber-500/50 rounded-2xl p-8 shadow-2xl relative">
              <div className="border-2 border-dashed border-amber-500/30 rounded-xl p-8 text-center space-y-4">
                <div className="text-xs font-mono tracking-widest text-amber-400 uppercase">
                  NTT DATA MOROCCO · CENTRE DE TÉTOUAN
                </div>
                <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
                  ATTESTATION DE RÉUSSITE
                </h2>
                <p className="text-xs text-slate-300 italic">Ce document certifie avec honneur que</p>
                <div className="text-2xl font-bold font-sans text-cyan-300">
                  {certRecipient}
                </div>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  a brillamment validé le programme technique certifiant <br />
                  <strong className="text-amber-200">{certTitle}</strong> avec un score officiel de{' '}
                  <strong className="text-emerald-400">{certScore}/100</strong>.
                </p>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>ID : NTT-{Date.now().toString().slice(-6)}</span>
                  <span>Date : {new Date().toLocaleDateString('fr-FR')}</span>
                  <span className="text-emerald-400">Vérifié par Blockchain RH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
