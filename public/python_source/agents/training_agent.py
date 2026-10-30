from langchain_groq import ChatGroq
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
import os
from dotenv import load_dotenv

from tools.training_tools import (
    count_trainings, get_training, get_trainings_by_skill,
    get_trainings_by_provider, get_all_providers, get_all_skills,
    recommend_trainings_by_skill, get_provider_trainings, get_recent_trainings,
    get_top_providers, count_trainings_by_skill, count_trainings_by_provider,
    get_all_trainings, most_trained_skills, least_trained_skills,
    missing_skills_by_department, required_skills_by_department,
    missing_training_skills_for_department, skills_needing_more_training,
    skill_priority_score, global_skill_training_gap
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
        Tool(name="Count Trainings", func=count_trainings, description="Compte les formations."),
        Tool(name="Get Training", func=get_training, description="Détails d'une formation."),
        Tool(name="Trainings By Skill", func=get_trainings_by_skill, description="Formations par compétence."),
        Tool(name="Trainings By Provider", func=get_trainings_by_provider, description="Formations par fournisseur."),
        Tool(name="Recommend Trainings", func=recommend_trainings_by_skill, description="Recommandations de formation."),
        Tool(name="Recent Trainings", func=get_recent_trainings, description="Formations récentes."),
        Tool(name="Top Providers", func=get_top_providers, description="Meilleurs fournisseurs."),
        Tool(name="Global Skill Gap", func=global_skill_training_gap, description="Écart global de compétences."),
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


def run_training_agent(query: str) -> str:
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
            return f"Erreur agent formation : {err}"
    return (
        "L'agent formation a été simplifié pour éviter les erreurs de contexte/tokens.\n"
        f"Derniere erreur : {last_error}\n"
        "Essayez une question plus courte ou réessayez dans quelques minutes."
    )