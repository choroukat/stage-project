import React from 'react';
import { 
  Binary, 
  Cpu, 
  Users, 
  BarChart3, 
  Database, 
  Code2, 
  CheckCircle2, 
  Layers,
  GraduationCap,
  Menu,
  Sparkles,
  Bot,
  Terminal,
  FileText
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  totalEmployees: number;
  totalCertificates: number;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  totalEmployees,
  totalCertificates,
  onToggleSidebar,
  sidebarCollapsed
}) => {
  const getTabLabel = (tab: ActiveTab) => {
    switch (tab) {
      case 'powerbi': return 'Studio Power BI & Architecture RH';
      case 'react_agent': return 'Agents ReAct LangChain (24 Tools)';
      case 'portals': return 'Portails RH & Parseur CV (Alertes 30J)';
      case 'evaluation': return 'Évaluation des Modèles ML';
      case 'inference': return 'Simulateur d\'Inférence & KNN';
      case 'matcher': return 'Talent & Skill Gap Matcher';
      case 'python': return 'Studio & CLI Python Live';
      case 'eda': return 'EDA & Corrélations';
      case 'explorer': return 'Explorateur MongoDB Atlas';
      case 'explainer': return 'Architecture & Audit';
      default: return 'HR Intelligence';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Sidebar Toggle + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Ouvrir / Réduire la barre latérale"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white font-sans truncate">
                {getTabLabel(activeTab)}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-mono">
                NTT DATA Tétouan
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400">
              PFE Chorouk Abouhiat · 1 906 Employés · 11 809 Certifications · 24 Outils ReAct
            </p>
          </div>
        </div>

        {/* Right: Quick Launch Shortcuts + Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => onSelectTab('react_agent')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'react_agent'
                ? 'bg-purple-500 text-slate-950 font-bold shadow-md shadow-purple-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span>Agent ReAct</span>
          </button>

          <button
            onClick={() => onSelectTab('powerbi')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'powerbi'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Power BI</span>
          </button>

          <button
            onClick={() => onSelectTab('python')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
              activeTab === 'python'
                ? 'bg-yellow-500 text-slate-950 font-bold shadow-md shadow-yellow-500/20'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-yellow-400" />
            <span>Python Live</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modèles Calibrés</span>
            <span className="sm:hidden">95.2%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
