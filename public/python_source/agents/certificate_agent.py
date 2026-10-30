from langchain_groq import ChatGroq
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
import os
from dotenv import load_dotenv
# Agent IA spécialisé sur les certificats : utilise les données de certificats pour répondre à des questions complexes et la il apport  les tools de certificat_tools.py
from tools.certificate_tools import (
    count_certificates, get_certificate, get_certificates_by_employee,
    certificates_expiring_in_months, expired_certificates, is_certificate_valid,
    certificates_without_expiry, average_score_by_department, employee_average_score,
    best_score_for_training, employee_score_evolution, training_duration,
    count_certificates_by_employee, certificates_by_skill, failed_certificates,
    employees_with_failed_certificates, certificates_between_dates,
    valid_certificates_by_skill, department_with_most_certificates, certificates_by_month
)
# load_dotenv() est appelé dans main.py, mais on le rappelle ici pour s'assurer que les variables d'environnement sont chargées lorsque ce module est utilisé 
load_dotenv()
# le premierer modèle de la liste est le principal, les autres sont des fallback en cas de problème de quota ou de suppression du modèle principal par Groq
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


# Outils réduits pour limiter le contexte et éviter les erreurs de tokens.
def _get_tools():
    return [
        Tool(name="Count Certificates", func=count_certificates, description="Compte les certificats."),
        Tool(name="Get Certificate", func=get_certificate, description="Récupère un certificat par ID ou titre."),
        Tool(name="Employee Certificates", func=get_certificates_by_employee, description="Certificats d'un employé."),
        Tool(name="Certificates Expiring", func=certificates_expiring_in_months, description="Certificats proches d'expirer."),
        Tool(name="Expired Certificates", func=expired_certificates, description="Certificats expirés."),
        Tool(name="Validate Certificate", func=is_certificate_valid, description="Vérifie la validité d'un certificat."),
        Tool(name="Certificates By Skill", func=certificates_by_skill, description="Certificats par compétence."),
        Tool(name="Certificates Between Dates", func=certificates_between_dates, description="Certificats entre deux dates."),
        Tool(name="Department With Most Certificates", func=department_with_most_certificates, description="Départements avec le plus de certificats."),
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


def run_certificate_agent(query: str) -> str:
    if not os.getenv("GROQ_API_KEY"):
        return "La clé Groq n'est pas configurée. Ajoutez GROQ_API_KEY dans votre environnement pour activer l'agent." 

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
            return f"Erreur agent certificat : {err}"
    return (
        "L'agent certificat a été simplifié pour éviter les erreurs de contexte/tokens.\n"
        f"Derniere erreur : {last_error}\n"
        "Essayez une question plus courte ou réessayez dans quelques minutes."
    )

