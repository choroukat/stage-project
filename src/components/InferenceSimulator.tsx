import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  Training, 
  Certificate, 
  PredictionOutput 
} from '../types';
import { predictCertificationOutcome } from '../services/mlEngine';
import { 
  Sparkles, 
  Sliders, 
  UserCheck, 
  UserPlus, 
  Clock, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  Copy, 
  Check, 
  BarChart3, 
  Users
} from 'lucide-react';

interface InferenceSimulatorProps {
  employees: Employee[];
  allEmployeesSummary: Employee[];
  trainings: Training[];
  certificates: Certificate[];
}

export const InferenceSimulator: React.FC<InferenceSimulatorProps> = ({
  employees,
  allEmployeesSummary,
  trainings,
  certificates
}) => {
  // Mode selection
  const [mode, setMode] = useState<'existing' | 'custom'>('existing');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || 'EMP-1000');
  
  // Custom candidate state
  const [customName, setCustomName] = useState<string>('Alexandre Moreau');
  const [customDept, setCustomDept] = useState<string>('Data & AI');
  const [customSkillsInput, setCustomSkillsInput] = useState<string>('Python, Machine Learning, SQL');
  const [customPriorScore, setCustomPriorScore] = useState<number>(75);

  // Training selection
  const [selectedTrainingId, setSelectedTrainingId] = useState<string>(trainings[0]?.id || 'TRN-1');
  const [selectedProvider, setSelectedProvider] = useState<string>('NTT DATA');
  const [durationDays, setDurationDays] = useState<number>(30);

  // Score adjustments (simulating continuous assignments/quizzes/exams)
  const [useCustomScores, setUseCustomScores] = useState<boolean>(false);
  const [scoreExam, setScoreExam] = useState<number>(78);
  const [scoreQuiz, setScoreQuiz] = useState<number>(82);
  const [scoreAssignment, setScoreAssignment] = useState<number>(76);
  const [scoreHomework, setScoreHomework] = useState<number>(80);
  const [threshold, setThreshold] = useState<number>(0.50);

  // Copy payload state
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Filtered employee list
  const filteredEmployees = useMemo(() => {
    return allEmployeesSummary.filter(emp => {
      const matchDept = selectedDeptFilter === 'all' || emp.department === selectedDeptFilter;
      const matchQuery = !searchEmployeeQuery || 
        emp.name.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
        emp.skills.some(s => s.toLowerCase().includes(searchEmployeeQuery.toLowerCase()));
      return matchDept && matchQuery;
    });
  }, [allEmployeesSummary, selectedDeptFilter, searchEmployeeQuery]);

  // Active target employee
  const activeEmployee: Employee = useMemo(() => {
    if (mode === 'custom') {
      const parsedSkills = customSkillsInput.split(',').map(s => s.trim()).filter(Boolean);
      return {
        id: 'SIM-9999',
        name: customName || 'Custom Candidate',
        department: customDept,
        email: 'simulated.candidate@nttdata.com',
        skills: parsedSkills,
        skill_count: parsedSkills.length
      };
    }
    const found = allEmployeesSummary.find(e => e.id === selectedEmployeeId);
    return found || employees[0] || {
      id: 'EMP-1000',
      name: 'Aicha Benkiran',
      department: 'Data & AI',
      email: 'aicha.benkiran@nttdata.com',
      skills: ['AWS', 'MongoDB'],
      skill_count: 2
    };
  }, [mode, selectedEmployeeId, allEmployeesSummary, employees, customName, customDept, customSkillsInput]);

  // Active training course
  const activeTraining: Training = useMemo(() => {
    const found = trainings.find(t => t.id === selectedTrainingId);
    return found || trainings[0] || {
      id: 'TRN-1',
      title: 'Docker & Kubernetes',
      provider: 'DeepLearning.AI',
      skill_acquired: 'Docker'
    };
  }, [trainings, selectedTrainingId]);

  // Compute live prediction
  const prediction: PredictionOutput = useMemo(() => {
    return predictCertificationOutcome(activeEmployee, activeTraining, {
      durationDays,
      provider: selectedProvider || activeTraining.provider,
      scoreHomework: useCustomScores ? scoreHomework : undefined,
      scoreAssignment: useCustomScores ? scoreAssignment : undefined,
      scoreQuiz: useCustomScores ? scoreQuiz : undefined,
      scoreExam: useCustomScores ? scoreExam : undefined,
      allEmployees: allEmployeesSummary,
      allCertificates: certificates,
      threshold
    });
  }, [
    activeEmployee,
    activeTraining,
    durationDays,
    selectedProvider,
    useCustomScores,
    scoreHomework,
    scoreAssignment,
    scoreQuiz,
    scoreExam,
    allEmployeesSummary,
    certificates,
    threshold
  ]);

  // Presets
  const applyPreset = (preset: 'senior_ml' | 'cold_start' | 'borderline' | 'cloud_architect') => {
    if (preset === 'senior_ml') {
      setMode('custom');
      setCustomName('Dr. Tariq Berrada');
      setCustomDept('Data & AI');
      setCustomSkillsInput('Python, Machine Learning, TensorFlow, PyTorch, Docker, Kubernetes, SQL');
      setSelectedProvider('DeepLearning.AI');
      setDurationDays(35);
      setUseCustomScores(true);
      setScoreExam(92);
      setScoreQuiz(94);
      setScoreAssignment(90);
      setScoreHomework(88);
    } else if (preset === 'cold_start') {
      setMode('custom');
      setCustomName('Nour El Fassi (New Hire)');
      setCustomDept('Software Engineering');
      setCustomSkillsInput('React, JavaScript, Git');
      setSelectedProvider('NTT DATA');
      setDurationDays(28);
      setUseCustomScores(false);
    } else if (preset === 'borderline') {
      setMode('custom');
      setCustomName('Mehdi Chraibi');
      setCustomDept('Consulting');
      setCustomSkillsInput('Agile, PMO');
      setSelectedProvider('Amazon'); // AWS is harder
      setDurationDays(14); // Rushed
      setUseCustomScores(true);
      setScoreExam(54);
      setScoreQuiz(58);
      setScoreAssignment(60);
      setScoreHomework(52);
    } else if (preset === 'cloud_architect') {
      setMode('custom');
      setCustomName('Fatima Zahra Alami');
      setCustomDept('Cloud & DevOps');
      setCustomSkillsInput('AWS, Terraform, Kubernetes, Linux, Docker, Python');
      setSelectedProvider('Amazon');
      setDurationDays(45);
      setUseCustomScores(true);
      setScoreExam(86);
      setScoreQuiz(88);
      setScoreAssignment(84);
      setScoreHomework(85);
    }
  };

  const copyPayload = () => {
    const payload = {
      employee_id: activeEmployee.id,
      training_title: activeTraining.title,
      provider: selectedProvider,
      duration_days: durationDays,
      custom_scores: useCustomScores ? {
        exam: scoreExam,
        quiz: scoreQuiz,
        assignment: scoreAssignment,
        homework: scoreHomework
      } : null,
      prediction_result: {
        probability_pass: prediction.probabilite_reussite,
        predicted_score: prediction.score_predit,
        risk_alert: prediction.alerte_label,
        confidence: prediction.niveau_confiance
      }
    };
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header & Preset Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold text-blue-400">
                Interactive Inference Engine
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">
                Real-Time Dual Model Scoring
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              What-If Certification Prediction & Risk Simulation
            </h2>
            <p className="text-xs text-slate-300">
              Test hypothetical profiles or actual employees to foresee certification success probability, predicted exam score, and prescriptive HR intervention paths.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 font-mono mr-1">Presets:</span>
            <button
              onClick={() => applyPreset('senior_ml')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              Senior AI Lead
            </button>
            <button
              onClick={() => applyPreset('cold_start')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              Cold-Start New Hire
            </button>
            <button
              onClick={() => applyPreset('borderline')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-colors"
            >
              At-Risk Candidate
            </button>
            <button
              onClick={() => applyPreset('cloud_architect')}
              className="px-2.5 py-1 text-xs font-mono rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500/20 transition-colors"
            >
              Cloud Architect
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Parameter Inputs & Candidate Configuration */}
        <div className="lg:col-span-5 space-y-6">
          {/* Candidate Mode Toggle */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                1. Select Target Candidate
              </span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setMode('existing')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    mode === 'existing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span>Existing ({allEmployeesSummary.length})</span>
                </button>
                <button
                  onClick={() => setMode('custom')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors ${
                    mode === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Custom / New Hire</span>
                </button>
              </div>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Departments</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Finance & Controlling">Finance & Controlling</option>
                    <option value="RH & Learning">RH & Learning</option>
                    <option value="Sales">Sales</option>
                    <option value="PMO">PMO</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Search name, ID, skill..."
                    value={searchEmployeeQuery}
                    onChange={(e) => setSearchEmployeeQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>

                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 max-h-48"
                  size={6}
                >
                  {filteredEmployees.slice(0, 50).map((emp) => (
                    <option key={emp.id} value={emp.id} className="py-1">
                      {emp.id} — {emp.name} ({emp.department}) [{emp.skills?.slice(0, 3).join(', ') || 'No skills'}]
                    </option>
                  ))}
                </select>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{activeEmployee.name}</span>
                    <span className="text-[11px] font-mono text-blue-400">{activeEmployee.department}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {activeEmployee.skills?.map(s => (
                      <span key={s} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Candidate Full Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Department</label>
                  <select
                    value={customDept}
                    onChange={(e) => setCustomDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Data & AI">Data & AI</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Finance & Controlling">Finance & Controlling</option>
                    <option value="RH & Learning">RH & Learning</option>
                    <option value="Sales">Sales</option>
                    <option value="PMO">PMO</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Skills Portfolio (comma-separated)</label>
                  <input
                    type="text"
                    value={customSkillsInput}
                    onChange={(e) => setCustomSkillsInput(e.target.value)}
                    placeholder="Python, AWS, Docker, Kubernetes"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Training & Exam Selection */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              2. Target Certification Course
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Certification Title</label>
                <select
                  value={selectedTrainingId}
                  onChange={(e) => setSelectedTrainingId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {trainings.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.skill_acquired})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Certifying Provider</label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="NTT DATA">NTT DATA Academy</option>
                    <option value="Amazon">Amazon Web Services</option>
                    <option value="Microsoft">Microsoft Learn</option>
                    <option value="DeepLearning.AI">DeepLearning.AI</option>
                    <option value="Scrum.org">Scrum.org</option>
                    <option value="Coursera">Coursera</option>
                    <option value="Udemy">Udemy</option>
                    <option value="Kaggle">Kaggle</option>
                    <option value="MongoDB University">MongoDB University</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Duration:</span>
                    <span className="text-white font-bold tabular-nums">{durationDays} days</span>
                  </div>
                  <input
                    type="range"
                    min="7"
                    max="90"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded cursor-pointer mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Continuous Assessment Component Scores */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                3. Milestone Performance Sliders
              </span>
              <button
                onClick={() => setUseCustomScores(!useCustomScores)}
                className={`text-[11px] font-mono px-2.5 py-1 rounded transition-colors ${
                  useCustomScores 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {useCustomScores ? 'Custom Scores Active' : 'Use Historical Baseline'}
              </button>
            </div>

            {useCustomScores ? (
              <div className="space-y-3.5 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Practice Exam (40% Weight)</span>
                    <span className="text-blue-400 font-bold tabular-nums">{scoreExam}/100</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={scoreExam}
                    onChange={(e) => setScoreExam(parseInt(e.target.value))}
                    className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Continuous Quizzes (20% Weight)</span>
                    <span className="text-cyan-400 font-bold tabular-nums">{scoreQuiz}/100</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={scoreQuiz}
                    onChange={(e) => setScoreQuiz(parseInt(e.target.value))}
                    className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Coding Assignment (20% Weight)</span>
                    <span className="text-indigo-400 font-bold tabular-nums">{scoreAssignment}/100</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={scoreAssignment}
                    onChange={(e) => setScoreAssignment(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Homework & Labs (20% Weight)</span>
                    <span className="text-purple-400 font-bold tabular-nums">{scoreHomework}/100</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={scoreHomework}
                    onChange={(e) => setScoreHomework(parseInt(e.target.value))}
                    className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  Components are defaulted to the candidate's historical baseline score ({prediction.score_historique.toFixed(1)}/100).
                </p>
                <p className="text-[11px] text-slate-500">
                  Toggle custom scores above to simulate specific exam scores or interim homework submissions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Prediction Outcomes & SHAP Explainability */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Prediction Scoreboard */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${
                  prediction.prediction_reussite === 'Réussite' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Model Prediction Output
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-colors"
                >
                  {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPayload ? 'Copied JSON' : 'Export API Payload'}</span>
                </button>
              </div>
            </div>

            {/* Probability & Continuous Score Big Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pass Probability */}
              <div className={`p-5 rounded-xl border ${
                prediction.prediction_reussite === 'Réussite'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}>
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Classification Outcome</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    prediction.prediction_reussite === 'Réussite'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {prediction.prediction_reussite}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono text-white tabular-nums">
                    {(prediction.probabilite_reussite * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-slate-400 font-mono">prob. success</span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      prediction.prediction_reussite === 'Réussite' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${prediction.probabilite_reussite * 100}%` }}
                  />
                </div>
              </div>

              {/* Predicted Continuous Score */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="text-slate-400">Continuous Exam Forecast</span>
                  <span className="text-purple-400 font-mono text-[11px]">Gradient Boosting</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold font-mono text-purple-300 tabular-nums">
                    {prediction.score_predit}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">/ 100 (±0.58 pts)</span>
                </div>

                <div className="text-[11px] text-slate-400 mt-3 flex items-center justify-between">
                  <span>Historical ref: {prediction.score_historique.toFixed(1)}/100</span>
                  <span className="text-cyan-400 font-mono">{prediction.niveau_confiance}</span>
                </div>
              </div>
            </div>

            {/* Operational Risk Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              prediction.alerte === 'none' 
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : prediction.alerte === 'watch'
                ? 'bg-blue-950/30 border-blue-500/30 text-blue-200'
                : prediction.alerte === 'warning'
                ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
            }`}>
              <div className="mt-0.5 shrink-0">
                {prediction.alerte === 'none' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase font-mono tracking-wider">
                    Risk Triage: {prediction.alerte_label}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className="text-[11px] opacity-80">{prediction.source_score}</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {prediction.recommandation}
                </p>
              </div>
            </div>

            {/* Feature Contribution Waterfall (SHAP-Style Breakdown) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Feature Attribution Waterfall</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Impact on Predicted Score</span>
              </div>

              <div className="space-y-2 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                {prediction.feature_contributions.map((fc) => (
                  <div key={fc.feature} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        fc.direction === 'positive' ? 'bg-emerald-400' : fc.direction === 'negative' ? 'bg-rose-400' : 'bg-slate-500'
                      }`} />
                      <span className="text-slate-300">{fc.label}</span>
                      <span className="text-slate-400 font-mono text-[11px]">({fc.value})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold tabular-nums ${
                        fc.impact > 0 ? 'text-emerald-400' : fc.impact < 0 ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {fc.impact > 0 ? `+${fc.impact}` : `${fc.impact}`} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cold-Start KNN Neighbors List (if applicable) */}
            {prediction.knn_neighbors && prediction.knn_neighbors.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono text-amber-400 uppercase tracking-wider font-bold">
                    Cold-Start Peer Imputation Topology (K=5 Nearest Neighbors)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Because this candidate has no completed certifications, the engine computed cosine similarity across skill vectors of peers in {activeEmployee.department}:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {prediction.knn_neighbors.map((n) => (
                    <div key={n.employee_id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200">{n.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{n.employee_id} · {n.department}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-cyan-400 font-mono font-bold tabular-nums">{(n.similarity * 100).toFixed(0)}% sim</div>
                        <div className="text-[10px] text-slate-400 font-mono">{n.score_moyen} avg</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
