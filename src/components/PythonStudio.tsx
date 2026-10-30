import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Copy,
  Check,
  Code2,
  FileCode,
  Folder,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  Download
} from 'lucide-react';

interface PythonModule {
  path: string;
  name: string;
  category: string;
  size: number;
  lines: number;
  snippet: string;
}

export const PythonStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cli' | 'explorer' | 'scratchpad'>('cli');

  // CLI Simulation State
  const [cliTask, setCliTask] = useState<'ml_predict' | 'knn_cold_start' | 'expiration_alerts' | 'cv_parse'>('ml_predict');
  const [examScore, setExamScore] = useState<number>(75);
  const [quizScore, setQuizScore] = useState<number>(80);
  const [hwScore, setHwScore] = useState<number>(78);
  const [assignScore, setAssignScore] = useState<number>(82);
  const [skillsCount, setSkillsCount] = useState<number>(5);
  const [knnDept, setKnnDept] = useState<string>('Data & AI');
  const [knnSkills, setKnnSkills] = useState<string>('Python,Docker,AWS,Machine Learning');
  const [alertDays, setAlertDays] = useState<number>(30);
  const [cvText, setCvText] = useState<string>(
    'Chorouk Abouhiat, Ingénieure Data & IA chez NTT DATA Tétouan. Compétences clés : Python, FastAPI, MongoDB, Docker, Scikit-learn, LangChain, Llama, AWS, Power BI.'
  );

  const [cliRunning, setCliRunning] = useState<boolean>(false);
  const [cliOutput, setCliOutput] = useState<any>(null);
  const [cliExecutionTime, setCliExecutionTime] = useState<number | null>(null);

  // Python Modules Explorer State
  const [modules, setModules] = useState<PythonModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>('ML/train_models.py');
  const [fileContent, setFileContent] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Scratchpad State
  const [scratchpadCode, setScratchpadCode] = useState<string>(`# NTT DATA HR Intelligence — Scratchpad Python 3.10
# Calcul rapide de la similarité cosinus entre deux vecteurs de compétences

import math

def cosine_similarity(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    return dot / (norm_a * norm_b) if norm_a and norm_b else 0.0

# Compétences : [Python, AWS, Docker, MongoDB, LangChain]
candidate_skills = [1, 1, 1, 0, 1]
job_requirements = [1, 1, 0, 0, 1]

score = cosine_similarity(candidate_skills, job_requirements)
print(f"Similarité Cosinus : {score * 100:.2f}%")
print(f"Statut d'admissibilité : {'Retenu pour le projet' if score > 0.70 else 'Formation requise'}")
`);
  const [scratchpadOutput, setScratchpadOutput] = useState<string>('');
  const [scratchpadRunning, setScratchpadRunning] = useState<boolean>(false);

  // Load modules
  useEffect(() => {
    fetch('/api/python-modules')
      .then((r) => r.json())
      .then((data) => {
        if (data.modules && data.modules.length > 0) {
          setModules(data.modules);
          const first = data.modules.find((m: any) => m.path === 'ML/train_models.py') || data.modules[0];
          setSelectedModule(first.path);
        }
      })
      .catch((e) => console.warn('Could not load modules:', e));
  }, []);

  // Load selected module content
  useEffect(() => {
    if (!selectedModule) return;
    fetch(`/api/python-file?file=${encodeURIComponent(selectedModule)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.content) setFileContent(data.content);
      })
      .catch(() => {});
  }, [selectedModule]);

  // Run CLI Task
  const handleRunCli = async () => {
    setCliRunning(true);
    setCliOutput(null);

    let args: string[] = [];
    if (cliTask === 'ml_predict') {
      args = [
        '--exam', String(examScore),
        '--quiz', String(quizScore),
        '--hw', String(hwScore),
        '--assign', String(assignScore),
        '--skills', String(skillsCount)
      ];
    } else if (cliTask === 'knn_cold_start') {
      args = [
        '--dept', knnDept,
        '--declared_skills', knnSkills
      ];
    } else if (cliTask === 'expiration_alerts') {
      args = ['--days', String(alertDays)];
    } else if (cliTask === 'cv_parse') {
      args = ['--text', cvText];
    }

    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: cliTask, args })
      });
      const data = await res.json();
      setCliExecutionTime(data.executionTimeMs);
      if (data.stdout) {
        try {
          const parsed = JSON.parse(data.stdout);
          setCliOutput(parsed);
        } catch {
          setCliOutput({ raw: data.stdout });
        }
      } else {
        setCliOutput({ error: data.error || data.stderr || 'Erreur lors de l\'exécution' });
      }
    } catch (err: any) {
      setCliOutput({ error: err.message || 'Échec de connexion au runtime Python' });
    } finally {
      setCliRunning(false);
    }
  };

  // Run Scratchpad
  const handleRunScratchpad = async () => {
    setScratchpadRunning(true);
    setScratchpadOutput('');

    try {
      const res = await fetch('/api/run-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: scratchpadCode })
      });
      const data = await res.json();
      if (data.stdout || data.stderr) {
        setScratchpadOutput((data.stdout || '') + (data.stderr ? `\n[STDERR]\n${data.stderr}` : ''));
      } else if (data.error) {
        setScratchpadOutput(`Error: ${data.error}`);
      } else {
        setScratchpadOutput('Script exécuté sans sortie standard.');
      }
    } catch (err: any) {
      setScratchpadOutput(`Erreur de communication : ${err.message}`);
    } finally {
      setScratchpadRunning(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-yellow-950/20 to-slate-900 border border-yellow-500/30 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                PYTHON 3.10 PRODUCTION RUNTIME
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg">
                FastAPI · Scikit-learn · LangChain
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Studio & Pipeline Python Live (NTT DATA)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Exécutez les scripts Python réels du projet : pipelines d'entraînement ML (SMOTE + Gradient Boosting), imputation Cold-Start KNN, moteur d'alertes 30j et explorez le code source complet de Chorouk Abouhiat.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3 shrink-0 text-xs font-mono">
            <Cpu className="w-4 h-4 text-yellow-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">Interpréteur</span>
              <span className="text-white font-bold">Python 3.10 (Linux x64)</span>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'cli'
                ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulateur CLI Python (Live Runner)</span>
          </button>
          <button
            onClick={() => setActiveTab('explorer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'explorer'
                ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Explorateur de Code Source ({modules.length} Fichiers .py)</span>
          </button>
          <button
            onClick={() => setActiveTab('scratchpad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'scratchpad'
                ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Terminal Scratchpad Interactif</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1 : SIMULATEUR CLI PYTHON ───────────────────────────────── */}
      {activeTab === 'cli' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Task Configuration */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-yellow-400" />
                <span>Sélectionner la Tâche Python CLI</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Appelle <code>public/python_source/live_runner.py</code> directement via le processus Python système.
              </p>
            </div>

            {/* Task Radio Selection */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCliTask('ml_predict')}
                className={`p-3 rounded-xl text-left border text-xs font-mono transition-all ${
                  cliTask === 'ml_predict'
                    ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">1. ML Predict</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Classification & Régression</div>
              </button>

              <button
                onClick={() => setCliTask('knn_cold_start')}
                className={`p-3 rounded-xl text-left border text-xs font-mono transition-all ${
                  cliTask === 'knn_cold_start'
                    ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">2. KNN Cold-Start</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Similarité Cosinus Pairs</div>
              </button>

              <button
                onClick={() => setCliTask('expiration_alerts')}
                className={`p-3 rounded-xl text-left border text-xs font-mono transition-all ${
                  cliTask === 'expiration_alerts'
                    ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">3. Alertes 30J</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Scan Certifs Expirantes</div>
              </button>

              <button
                onClick={() => setCliTask('cv_parse')}
                className={`p-3 rounded-xl text-left border text-xs font-mono transition-all ${
                  cliTask === 'cv_parse'
                    ? 'bg-yellow-500/15 border-yellow-500/50 text-yellow-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold">4. Parseur CV</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Extraction Compétences</div>
              </button>
            </div>

            {/* Task Dynamic Parameters */}
            <div className="space-y-4 pt-2">
              {cliTask === 'ml_predict' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 flex justify-between">
                      <span>Note Examen Blanc (40% coef)</span>
                      <span className="text-yellow-400 font-bold">{examScore}/100</span>
                    </label>
                    <input
                      type="range"
                      min="40"
                      max="100"
                      value={examScore}
                      onChange={(e) => setExamScore(Number(e.target.value))}
                      className="w-full accent-yellow-400 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block">Quiz (20%)</label>
                      <input
                        type="number"
                        value={quizScore}
                        onChange={(e) => setQuizScore(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block">Devoirs (20%)</label>
                      <input
                        type="number"
                        value={hwScore}
                        onChange={(e) => setHwScore(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white mt-1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block">Projets (20%)</label>
                      <input
                        type="number"
                        value={assignScore}
                        onChange={(e) => setAssignScore(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block">Compétences Antérieures</label>
                      <input
                        type="number"
                        value={skillsCount}
                        onChange={(e) => setSkillsCount(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {cliTask === 'knn_cold_start' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 block">Département Cible</label>
                    <select
                      value={knnDept}
                      onChange={(e) => setKnnDept(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white mt-1"
                    >
                      <option value="Data & AI">Data & AI</option>
                      <option value="Cloud & DevOps">Cloud & DevOps</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-300 block">Compétences Déclarées (Séparées par virgules)</label>
                    <input
                      type="text"
                      value={knnSkills}
                      onChange={(e) => setKnnSkills(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white mt-1"
                    />
                  </div>
                </div>
              )}

              {cliTask === 'expiration_alerts' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 flex justify-between">
                      <span>Seuil d'Expiration (Jours)</span>
                      <span className="text-yellow-400 font-bold">{alertDays} jours</span>
                    </label>
                    <input
                      type="range"
                      min="7"
                      max="90"
                      value={alertDays}
                      onChange={(e) => setAlertDays(Number(e.target.value))}
                      className="w-full accent-yellow-400 mt-1"
                    />
                  </div>
                </div>
              )}

              {cliTask === 'cv_parse' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 block">Texte Brut du CV à Analyser</label>
                    <textarea
                      rows={4}
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-white mt-1 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleRunCli}
              disabled={cliRunning}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
            >
              {cliRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Exécution Python en cours...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Exécuter la Commande Python CLI</span>
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Live Terminal Output */}
          <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                  <span className="text-white font-bold">Terminal Python (Sortie JSON Standard)</span>
                </div>
                {cliExecutionTime !== null && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    ⏱️ {cliExecutionTime} ms
                  </span>
                )}
              </div>

              <div className="mt-4 bg-slate-900/90 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-yellow-200/90 max-h-[420px] overflow-y-auto">
                {cliOutput ? (
                  <pre className="whitespace-pre-wrap leading-relaxed">
                    {JSON.stringify(cliOutput, null, 2)}
                  </pre>
                ) : (
                  <div className="text-slate-500 text-center py-12">
                    Cliquez sur "Exécuter la Commande Python CLI" pour lancer le script.
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-900 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>CLI Script : public/python_source/live_runner.py</span>
              <span className="text-emerald-400">Status 0 (OK)</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2 : EXPLORATEUR DE CODE SOURCE PYTHON ───────────────────── */}
      {activeTab === 'explorer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* File Tree Selector */}
          <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider px-2">
              Fichiers Python du Projet ({modules.length})
            </h3>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {modules.map((m) => {
                const isSelected = selectedModule === m.path;
                return (
                  <button
                    key={m.path}
                    onClick={() => setSelectedModule(m.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-mono transition-all ${
                      isSelected
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-yellow-400' : 'text-slate-400'}`} />
                      <span className="truncate">{m.path}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 ml-2 shrink-0">
                      {m.lines}l
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-mono text-white">
                <FileCode className="w-4 h-4 text-yellow-400" />
                <span className="font-bold">{selectedModule}</span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copié !' : 'Copier le code'}</span>
              </button>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800/80 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
              <pre>{fileContent || 'Chargement du fichier Python...'}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3 : TERMINAL SCRATCHPAD INTERACTIF ──────────────────────── */}
      {activeTab === 'scratchpad' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-mono font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-yellow-400" />
                <span>Éditeur Python 3.10 Libre</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Standard Lib Python</span>
            </div>

            <textarea
              rows={16}
              value={scratchpadCode}
              onChange={(e) => setScratchpadCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-yellow-100/90 leading-relaxed resize-none focus:outline-none focus:border-yellow-500"
            />

            <button
              onClick={handleRunScratchpad}
              disabled={scratchpadRunning}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold font-mono text-xs transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50"
            >
              {scratchpadRunning ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Exécution Python en cours...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Exécuter le Code avec Python 3.10</span>
                </>
              )}
            </button>
          </div>

          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono text-slate-300 font-bold">
                  Console Output (stdout / stderr)
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Live Process</span>
              </div>

              <div className="mt-4 bg-slate-900/90 rounded-xl p-4 border border-slate-800/80 font-mono text-xs text-emerald-400 min-h-[300px] max-h-[400px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {scratchpadOutput || '# Cliquez sur "Exécuter le Code" pour voir la sortie console ici...'}
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-900">
              Timeout de sécurité : 15s · Isolation de processus par exécution
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
