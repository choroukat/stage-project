import React from 'react';
import { ActiveTab } from '../types';
import {
  GraduationCap,
  BarChart3,
  Terminal,
  Bot,
  BrainCircuit,
  Sliders,
  Users2,
  FileText,
  PieChart,
  Database,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  totalEmployees: number;
  totalCertificates: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  totalEmployees,
  totalCertificates
}) => {
  const navSections = [
    {
      title: 'Décisionnel & IA Agents',
      items: [
        {
          id: 'powerbi' as ActiveTab,
          label: 'Power BI & Architecture RH',
          shortLabel: 'Power BI',
          icon: BarChart3,
          badge: 'README & DAX',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        },
        {
          id: 'react_agent' as ActiveTab,
          label: 'Agents ReAct LangChain',
          shortLabel: 'ReAct Agent',
          icon: Bot,
          badge: '24 Tools',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        }
      ]
    },
    {
      title: 'Machine Learning',
      items: [
        {
          id: 'evaluation' as ActiveTab,
          label: 'Évaluation des Modèles ML',
          shortLabel: 'Modèles ML',
          icon: BrainCircuit,
          badge: '95.18% Acc',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        },
        {
          id: 'inference' as ActiveTab,
          label: 'Simulateur & Cold-Start KNN',
          shortLabel: 'Inférence',
          icon: Sliders,
          badge: 'R² 0.994',
          badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
        },
        {
          id: 'matcher' as ActiveTab,
          label: 'Talent & Skill Gap Matcher',
          shortLabel: 'Matching',
          icon: Users2,
          badge: 'Employabilité',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }
      ]
    },
    {
      title: 'Opérations RH & Code',
      items: [
        {
          id: 'portals' as ActiveTab,
          label: 'Parseur CV & Alertes 30J',
          shortLabel: 'CV & Alertes',
          icon: FileText,
          badge: 'Alertes 30J',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
        },
        {
          id: 'python' as ActiveTab,
          label: 'Studio Python & CLI Live',
          shortLabel: 'Python',
          icon: Terminal,
          badge: 'Py 3.10',
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
        },
        {
          id: 'eda' as ActiveTab,
          label: 'Analyse Exploratoire (EDA)',
          shortLabel: 'EDA',
          icon: PieChart,
          badge: 'Corrélations',
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
        },
        {
          id: 'explorer' as ActiveTab,
          label: 'Explorateur MongoDB Atlas',
          shortLabel: 'Données',
          icon: Database,
          badge: '11.8k Certifs',
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
        },
        {
          id: 'explainer' as ActiveTab,
          label: 'Architecture & Questions Jury',
          shortLabel: 'Architecture',
          icon: Sparkles,
          badge: 'Expert Q&A',
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30'
        }
      ]
    }
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-blue-500/20 shrink-0 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent font-mono">
                NTT
              </span>
            </div>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight truncate">
                  NTT DATA
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                  PFE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Chorouk Abouhiat · Tétouan
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
          title={collapsed ? 'Agrandir la barre latérale' : 'Réduire la barre latérale'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Org Sub-Badge */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Pôle Data & IA · Maroc</span>
          </div>
          <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      )}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <h3 className="px-2.5 text-[10px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 shadow-md shadow-blue-950/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                    title={item.label}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'
                      }`}
                    />
                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="text-xs font-medium truncate">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 text-[9px] font-mono border rounded ${
                              isActive ? item.badgeColor : 'bg-slate-900 text-slate-400 border-slate-800'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom KPI Card */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Collaborateurs</span>
              <span className="text-white font-semibold">{totalEmployees.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Certifications</span>
              <span className="text-cyan-400 font-semibold">{totalCertificates.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Accuracy ML</span>
              <span className="text-emerald-400 font-semibold">95.18%</span>
            </div>
            <div className="pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Leakage-Free Audit v2.4</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-800/80 flex flex-col items-center gap-2 text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Online" />
        </div>
      )}
    </aside>
  );
};
