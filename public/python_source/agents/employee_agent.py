from langchain_groq import ChatGroq
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
import os
from dotenv import load_dotenv
from tools.employee_tools import (
    count_employees, get_employee, get_employee_skills,
    get_employee_skill_count, get_employees_by_department,
    get_employees_by_skill, search_employees_by_skill,
    count_employees_by_skill, count_employees_by_department,
    employee_has_skill, get_skills_distribution, get_department_stats,
    get_top_skilled_employees, recommend_skills_by_department,
    recommend_skills_for_employee
)
load_dotenv()
FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]
_agents = {}


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


def _get_tools():
    return [
        Tool(name="Count Employees", func=count_employees, description="Compte les employés."),
        Tool(name="Get Employee", func=get_employee, description="Détails d'un employé."),
        Tool(name="Employee Skills", func=get_employee_skills, description="Compétences d'un employé."),
        Tool(name="Employees by Department", func=get_employees_by_department, description="Employés par département."),
        Tool(name="Employees by Skill", func=get_employees_by_skill, description="Employés par compétence."),
        Tool(name="Top Skilled Employees", func=get_top_skilled_employees, description="Top employés les plus qualifiés."),
        Tool(name="Recommend Skills for Employee", func=recommend_skills_for_employee, description="Compétences à recommander."),
    ]


def _build_agent_for_model(model: str):
    if model in _agents:
        return _agents[model]
    llm = _make_llm(model)
    agent = initialize_agent(
        tools=_get_tools(), llm=llm,
        agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
        verbose=False, handle_parsing_errors=True,
        max_iterations=2, early_stopping_method="generate"
    )
    _agents[model] = agent
    return agent


def run_employee_agent(query: str) -> str:
    if not os.getenv("GROQ_API_KEY"):
        return "La clé Groq n'est pas configurée. Ajoutez GROQ_API_KEY pour activer l'agent." 

    last_error = ""
    for model in FALLBACK_MODELS:
        try:
            agent = _build_agent_for_model(model)
            result = agent.run(query)
            if model != FALLBACK_MODELS[0]:
                result = f"[modele secours: {model}]\n{result}"
            return result
        except Exception as e:
            err = str(e)
            if _is_token_error(err):
                last_error = f"Contexte/tokens sur {model}"
                continue
            if "rate_limit_exceeded" in err or "429" in err:
                last_error = f"Rate limit sur {model}"
                continue
            if "decommissioned" in err or "deprecated" in err:
                last_error = f"Modele supprime: {model}"
                continue
            return f"Erreur agent employe : {err}"
    return (
        "L'agent employé a été simplifié pour éviter les erreurs de contexte/tokens.\n"
        f"Derniere erreur : {last_error}\n"
        "Essayez une question plus courte ou réessayez dans quelques minutes."
    )