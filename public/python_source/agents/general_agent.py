from langchain_groq import ChatGroq
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
import os
from dotenv import load_dotenv
from tools.generale_tools import (
    get_employee_complete_profile,
    missing_trainings_for_employee,
    best_employees_for_skill,
    training_highest_success_rate,
    compare_training_providers,
    average_certificate_delay,
    expiring_skills_report,
    employee_full_history,
    acquired_skills_not_in_profile,
    employee_department_gap,
    recommend_training_for_missing_skill,
    top_global_employees,
    best_department,
    critical_skill_gaps,
    compare_employees_for_project,
    best_employee_for_project,
    best_team_for_skill,
    employees_highest_scores,
    employees_most_certified,
    most_multiskilled_employees,
    underqualified_employees,
    promotion_ready_employees,
    departments_with_skill_gaps,
    employees_needing_training,
)

load_dotenv()

# Modèles Groq avec leurs limites de tokens de contexte
FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]

# GENERAL AGENT — Agent IA LangChain + Groq (LLaMA 3)
_general_agents = {}


def _make_llm(model: str):
    return ChatGroq(
        api_key=os.getenv("GROQ_API_KEY"),
        model=model,
        max_tokens=500,
        temperature=0,
        timeout=30,
        max_retries=0,
    )


def _is_token_error(err: str) -> bool:
    lower = err.lower()
    return any(k in lower for k in ["token", "context", "too many tokens", "maximum context", "rate limit", "429", "quota", "limit"])


def _build_general_agent(model: str = "llama-3.1-8b-instant"):
    """
    Construit et retourne l'agent général (singleton par modèle).
    CORRECTION : descriptions de tools courtes pour économiser les tokens.
    """
    if model in _general_agents:
        return _general_agents[model]

    llm = _make_llm(model)

    tools = [
        Tool(name="Get Employee Profile", func=get_employee_complete_profile, description="Profil complet d'un employé."),
        Tool(name="Employee History", func=employee_full_history, description="Historique d'un employé."),
        Tool(name="Missing Trainings", func=missing_trainings_for_employee, description="Formations manquantes d'un employé."),
        Tool(name="Department Gap", func=employee_department_gap, description="Écart d'un département."),
        Tool(name="Employees Needing Training", func=employees_needing_training, description="Employés à former."),
        Tool(name="Recommend Training", func=recommend_training_for_missing_skill, description="Formation recommandée pour un skill."),
        Tool(name="Best Employees For Skill", func=best_employees_for_skill, description="Meilleurs employés pour un skill."),
        Tool(name="Best Employee For Project", func=best_employee_for_project, description="Meilleur employé pour un projet."),
        Tool(name="Best Team For Skill", func=best_team_for_skill, description="Meilleure équipe pour un skill."),
        Tool(name="Top Global Employees", func=lambda inp: top_global_employees(int(inp) if inp.strip().isdigit() else 5), description="Top employés."),
    ]

    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=False,
        handle_parsing_errors=True,
        max_iterations=2,
        early_stopping_method="generate",
        return_intermediate_steps=False,
    )

    _general_agents[model] = agent
    return agent


def run_general_agent(query: str) -> str:
    """
    Lance l'agent général avec fallback automatique sur les modèles Groq.
    La version actuelle privilégie un contexte plus petit pour éviter les erreurs de tokens.
    """
    if not os.getenv("GROQ_API_KEY"):
        return "La clé Groq n'est pas configurée. Ajoutez GROQ_API_KEY pour activer l'agent."

    last_error = ""

    for model in FALLBACK_MODELS:
        try:
            agent = _build_general_agent(model)
            result = agent.run(query)
            if model != FALLBACK_MODELS[0]:
                result = f"[modèle de secours: {model}]\n{result}"
            return result

        except Exception as e:
            err = str(e)

            if _is_token_error(err):
                last_error = f"Contexte/tokens sur {model}"
                _general_agents.pop(model, None)
                continue

            if "rate_limit_exceeded" in err or "429" in err:
                last_error = f"Rate limit sur {model}"
                _general_agents.pop(model, None)
                continue

            if "decommissioned" in err or "deprecated" in err:
                last_error = f"Modèle supprimé: {model}"
                _general_agents.pop(model, None)
                continue

            if "Could not parse LLM output" in err or "parsing" in err.lower():
                return (
                    "Je n'ai pas pu analyser votre demande correctement. "
                    "Pouvez-vous reformuler votre question de façon plus précise ? "
                    f"(Erreur interne: {err[:100]})"
                )

            return f"Erreur agent général : {err}"

    return (
        "L'agent général a été simplifié pour éviter les erreurs de contexte/tokens.\n"
        f"Dernière erreur : {last_error}\n"
        "Essayez une question plus courte ou réessayez dans quelques minutes."
    )