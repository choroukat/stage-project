import React, { useState, useMemo } from 'react';
import { Employee, ProjectMatch } from '../types';
import { matchEmployeesToProject } from '../services/mlEngine';
import { 
  Users, 
  Briefcase, 
  Check, 
  Plus, 
  X, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  BookOpen 
} from 'lucide-react';

interface TalentProjectMatcherProps {
  employees: Employee[];
  onSelectCandidateForTraining?: (employee: Employee, skillToAcquire?: string) => void;
}

const COMMON_SKILLS = [
  'Python', 'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 
  'SQL', 'MongoDB', 'Cybersecurity', 'Terraform', 'React', 
  'Linux', 'Agile', 'Scrum', 'Data & AI', 'DevOps', 'Java',
  'GCP', 'Azure', 'Deep Learning', 'Tableau', 'Kafka'
];

interface ProjectPreset {
  id: string;
  title: string;
  description: string;
  skills: string[];
}

const PRESET_PROJECTS: ProjectPreset[] = [
  {
    id: 'genai',
    title: 'GenAI & Autonomous Agent Orchestration',
    description: 'Building multi-agent autonomous reasoning workflows with LangChain, Python, vector databases, and containerized deployment.',
    skills: ['Python', 'Machine Learning', 'Docker', 'Kubernetes', 'AWS', 'MongoDB']
  },
  {
    id: 'cloud_sec',
    title: 'Zero-Trust Cloud & DevSecOps Platform',
    description: 'Hardening multi-cloud infrastructure with automated security policies, Kubernetes cluster protection, and Terraform IaC.',
    skills: ['Cybersecurity', 'AWS', 'Terraform', 'Kubernetes', 'Docker', 'Linux']
  },
  {
    id: 'lakehouse',
    title: 'Enterprise Real-Time Data Lakehouse',
    description: 'High-throughput stream analytics and predictive data pipelines connecting transactional stores and AI models.',
    skills: ['Python', 'SQL', 'Data & AI', 'MongoDB', 'AWS']
  },
  {
    id: 'microservices',
    title: 'Cloud-Native Microservices Modernization',
    description: 'Decomposing legacy monoliths into distributed containerized microservices with CI/CD and agile delivery.',
    skills: ['Software Engineering', 'Docker', 'Kubernetes', 'SQL', 'Scrum', 'DevOps']
  }
];

export const TalentProjectMatcher: React.FC<TalentProjectMatcherProps> = ({
  employees,
  onSelectCandidateForTraining
}) => {
  const [activePreset, setActivePreset] = useState<string>('genai');
  const [requiredSkills, setRequiredSkills] = useState<string[]>(PRESET_PROJECTS[0].skills);
  const [projectTitle, setProjectTitle] = useState<string>(PRESET_PROJECTS[0].title);
  const [customSkillInput, setCustomSkillInput] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [minMatchThreshold, setMinMatchThreshold] = useState<number>(30);

  // Apply a preset project
  const applyPreset = (preset: ProjectPreset) => {
    setActivePreset(preset.id);
    setProjectTitle(preset.title);
    setRequiredSkills(preset.skills);
  };

  // Toggle skill in requirements
  const toggleSkill = (skill: string) => {
    if (requiredSkills.includes(skill)) {
      setRequiredSkills(requiredSkills.filter(s => s !== skill));
    } else {
      setRequiredSkills([...requiredSkills, skill]);
    }
  };

  // Add custom skill
  const handleAddCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setCustomSkillInput('');
    }
  };

  // Candidate pool
  const candidatePool = useMemo(() => {
    if (deptFilter === 'all') return employees;
    return employees.filter(e => e.department === deptFilter);
  }, [employees, deptFilter]);

  // Compute matches via cosine similarity
  const matches: ProjectMatch[] = useMemo(() => {
    const rawMatches = matchEmployeesToProject(requiredSkills, candidatePool, 24);
    return rawMatches.filter(m => m.compatibility_score >= minMatchThreshold);
  }, [requiredSkills, candidatePool, minMatchThreshold]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold text-blue-400">
                Vector Space Optimization
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400 font-mono">
                Cosine Similarity Skill Projection
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Talent-to-Project Compatibility Matcher
            </h2>
            <p className="text-xs text-slate-300">
              Evaluates high-dimensional skill vectors across 1,906 employee profiles against enterprise project staffing criteria with gap analysis.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
            <span>Pool:</span>
            <span className="text-white font-bold tabular-nums">{candidatePool.length}</span>
            <span>engineers</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Project Requirement Controls */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Project Templates */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3 shadow-md">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              1. Industry Project Templates
            </span>

            <div className="space-y-2">
              {PRESET_PROJECTS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{preset.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skill Vector Requirements Builder */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                2. Required Skill Vector ({requiredSkills.length})
              </span>
              {requiredSkills.length > 0 && (
                <button
                  onClick={() => setRequiredSkills([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-mono"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Active Selected Skills */}
            <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2 bg-slate-950 rounded-xl border border-slate-800">
              {requiredSkills.length === 0 ? (
                <span className="text-xs text-slate-500 font-mono py-1 px-1">
                  Click skills below or type to add required technologies...
                </span>
              ) : (
                requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs font-mono"
                  >
                    <span>{s}</span>
                    <button
                      onClick={() => toggleSkill(s)}
                      className="hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Quick Skill Library Click-Add */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Click to add/remove common skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.map((s) => {
                  const active = requiredSkills.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                        active
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {active ? `✓ ${s}` : `+ ${s}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Skill Input */}
            <form onSubmit={handleAddCustomSkill} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Add custom skill (e.g. PySpark)..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-medium transition-colors"
              >
                Add
              </button>
            </form>

            {/* Department Filter & Threshold */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Filter Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
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
                </select>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>Min Match:</span>
                  <span className="text-white font-bold tabular-nums">{minMatchThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={minMatchThreshold}
                  onChange={(e) => setMinMatchThreshold(parseInt(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-800 h-1.5 rounded cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ranked Candidate Match Deck */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Matched Talent Ranking ({matches.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Sorted by Vector Cosine Similarity
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-semibold text-white">No Matching Candidates Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No employees matched the specified skill vector above the {minMatchThreshold}% threshold. Try lowering the threshold or adjusting skills.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match, idx) => {
                const isHighMatch = match.compatibility_score >= 70;
                return (
                  <div
                    key={match.employee_id}
                    className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                          idx === 0 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : idx < 3
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{match.employee_name}</span>
                            <span className="text-[11px] font-mono text-slate-400">({match.employee_id})</span>
                          </div>
                          <span className="text-xs text-slate-400">{match.department} · {match.email}</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className="text-right">
                          <div className={`text-lg font-bold font-mono tabular-nums ${
                            isHighMatch ? 'text-emerald-400' : 'text-blue-400'
                          }`}>
                            {match.compatibility_score.toFixed(1)}%
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">Compatibility</div>
                        </div>
                      </div>
                    </div>

                    {/* Skill Breakdown: Matched vs Gaps */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs font-mono">
                      {/* Matching Skills */}
                      <div>
                        <span className="text-[10px] uppercase text-emerald-400 tracking-wider block mb-1">
                          ✓ Matched Skills ({match.matching_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {match.matching_skills.map((s) => (
                            <span
                              key={s}
                              className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Missing Gaps */}
                      <div>
                        <span className="text-[10px] uppercase text-amber-400 tracking-wider block mb-1">
                          ⚠ Skill Gaps to Close ({match.missing_skills.length})
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {match.missing_skills.length === 0 ? (
                            <span className="text-[10px] text-emerald-400 py-0.5">100% skill coverage!</span>
                          ) : (
                            match.missing_skills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[10px]"
                              >
                                {s}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action: Upskill to close gaps */}
                    {match.missing_skills.length > 0 && onSelectCandidateForTraining && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => {
                            const emp = employees.find(e => e.id === match.employee_id);
                            if (emp) onSelectCandidateForTraining(emp, match.missing_skills[0]);
                          }}
                          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-mono py-1 px-2.5 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Simulate Training on {match.missing_skills[0]}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
