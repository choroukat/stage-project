"""
agents/prediction_agent.py
===========================
Agent LangChain qui reçoit la question du manager et choisit
quel outil appeler. Ce fichier change très peu — la logique
ML est dans predictor.py, pas ici.

SEUL CHANGEMENT par rapport à l'original :
  - L'agent est instancié PAR REQUÊTE (pas singleton global)
    pour éviter les collisions entre utilisateurs simultanés.
"""

from langchain_groq import ChatGroq
from langchain.agents import initialize_agent, Tool, AgentType
import os
from dotenv import load_dotenv

from tools.prediction_tools import (
    tool_predict_score_and_success,
    tool_employee_ml_profile,
    tool_recommend_best_certification,
    tool_best_employees_for_project,
)

load_dotenv()

FALLBACK_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]

SYSTEM_PROMPT = """Tu es un assistant RH spécialisé en prédictions ML pour un système de gestion des certifications NTT DATA.
Tu aides les managers à prendre des décisions basées sur les données.

Questions que tu peux traiter :
- "Est-ce que [employé] va réussir la certification [X] ?" → utilise Predict Score And Success
- "Quel score va obtenir [employé] pour [certification] ?" → utilise Predict Score And Success
- "Montre le profil ML de [employé]" → utilise Employee ML Profile
- "Quelle certification recommander à [employé] ?" → utilise Recommend Best Certification
- "Qui sont les meilleurs employés pour un projet [skills] ?" → utilise Best Employees For Project

IMPORTANT — Nouvel employé :
Quand le résultat indique "est_nouveau_employe: true" ou "est_nouveau: true",
explique clairement au manager que la prédiction est basée sur des pairs similaires
et qu'elle a une fiabilité moindre qu'un employé avec de l'historique.

Réponds toujours en français, de façon claire et structurée.
Explique les résultats en langage naturel adapté à un manager RH.
Ne répète pas les données JSON brutes — traduis-les en réponse utile.
"""


def _build_tools():
    return [
        Tool(
            name="Predict Score And Success",
            func=tool_predict_score_and_success,
            description=(
                "Prédit si un employé va réussir une certification et son score estimé. "
                "Fonctionne aussi pour les nouveaux employés sans historique. "
                "Input : 'employee_id, nom_certification'. "
                "Exemple : 'EMP-1158, Docker & Kubernetes'."
            )
        ),
        Tool(
            name="Employee ML Profile",
            func=tool_employee_ml_profile,
            description=(
                "Profil ML complet d'un employé : skills, certifications, score de référence. "
                "Indique si l'employé est nouveau (sans historique). "
                "Input : employee_id (ex: 'EMP-1158') ou nom de l'employé."
            )
        ),
        Tool(
            name="Recommend Best Certification",
            func=tool_recommend_best_certification,
            description=(
                "Recommande les 3 meilleures certifications pour un employé "
                "basé sur ses skills manquants et sa probabilité de réussite ML. "
                "Input : employee_id ou nom de l'employé."
            )
        ),
        Tool(
            name="Best Employees For Project",
            func=tool_best_employees_for_project,
            description=(
                "Trouve les meilleurs employés pour un projet selon leurs skills. "
                "Input : skills séparés par virgule. "
                "Exemple : 'Python, Docker, AWS' ou 'Python, Docker | 3' pour top 3."
            )
        ),
    ]


def run_prediction_agent(query: str) -> str:
    """
    Point d'entrée principal.
    Les paramètres ont été réduits pour éviter les erreurs causées par les limites de contexte.
    """
    if not os.getenv("GROQ_API_KEY"):
        return "La clé Groq n'est pas configurée. Ajoutez GROQ_API_KEY pour activer l'agent."

    last_error = ""

    for model in FALLBACK_MODELS:
        try:
            llm = ChatGroq(
                api_key=os.getenv("GROQ_API_KEY"),
                model=model,
                max_tokens=500,
                temperature=0,
                timeout=30,
                max_retries=0,
            )

            agent = initialize_agent(
                tools=_build_tools(),
                llm=llm,
                agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
                verbose=False,
                handle_parsing_errors=True,
                max_iterations=2,
                early_stopping_method="generate",
                return_intermediate_steps=False,
                agent_kwargs={"prefix": SYSTEM_PROMPT},
            )

            result = agent.run(query)
            if model != FALLBACK_MODELS[0]:
                result = f"[modèle de secours : {model}]\n{result}"
            return result

        except Exception as e:
            err = str(e)
            lower = err.lower()
            if any(k in lower for k in ["token", "context", "too many tokens", "maximum context", "rate limit", "429", "quota", "limit"]):
                last_error = f"Contexte/tokens sur {model}"
                continue
            if "rate_limit_exceeded" in err or "429" in err:
                last_error = f"Rate limit sur {model}"
                continue
            if "decommissioned" in err or "deprecated" in err:
                last_error = f"Modèle retiré : {model}"
                continue
            if "Could not parse LLM output" in err or "parsing" in err.lower():
                return (
                    "Je n'ai pas pu interpréter votre demande. Essayez :\n"
                    "- 'Prédit la réussite de EMP-1158 pour Docker'\n"
                    "- 'Montre le profil ML de Alice'\n"
                    "- 'Recommande une certification à EMP-0042'\n"
                    "- 'Qui sont les meilleurs pour un projet Python, Docker ?'"
                )
            return f"Erreur agent : {err}"

    return (
        "L'agent de prédiction a été simplifié pour éviter les erreurs de contexte/tokens.\n"
        f"Dernière erreur : {last_error}\n"
        "Réessayez avec une question plus courte dans quelques minutes."
    )