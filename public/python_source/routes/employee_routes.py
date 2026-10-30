from fastapi import APIRouter, HTTPException
from database.mongodb import employees_collection
from agents.employee_agent import run_employee_agent

# =============================================================
# EMPLOYEE ROUTER
# CORRECTION CRITIQUE : /ask doit être déclaré AVANT /{email}
# Sinon FastAPI capture "ask" comme valeur d'email → 404
# =============================================================

router = APIRouter(prefix="/employees", tags=["Employees"])


# ── AI AGENT (EN PREMIER) ────────────────────────────────────
@router.post("/ask", summary="Interroger l'agent IA Employés")
def ask_employee_agent(data: dict):
    """
    Body : { "question": "Combien d'employés sont dans le département IT ?" }
    """
    question = data.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    response = run_employee_agent(question)
    return {"question": question, "response": response}


# ── CRUD (APRÈS /ask) ─────────────────────────────────────────
@router.post("/add", summary="Ajouter un employé")
def add_employee(employee: dict):
    if not employee:
        raise HTTPException(status_code=400, detail="Employee data is required")
    employees_collection.insert_one(employee)
    return {"message": "Employee added successfully"}


@router.get("/", summary="Lister tous les employés")
def get_employees():
    return list(employees_collection.find({}, {"_id": 0}))


# /{email} EN DERNIER — capture tout, y compris "ask" si mal placé
@router.get("/{email}", summary="Récupérer un employé par email")
def get_employee(email: str):
    emp = employees_collection.find_one({"email": email}, {"_id": 0})
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@router.delete("/{email}", summary="Supprimer un employé par email")
def delete_employee(email: str):
    result = employees_collection.delete_one({"email": email})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"message": "Employee deleted successfully"}