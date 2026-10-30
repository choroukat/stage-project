import os
from pathlib import Path
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv

root = Path(__file__).resolve().parents[1]
backend_env = root / ".env"
workspace_env = root.parent / ".env"

if backend_env.exists():
    load_dotenv(backend_env, override=True)
elif workspace_env.exists():
    load_dotenv(workspace_env, override=True)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "nova_db")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is missing")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

employees_col = db["employees"]
certificates_col = db["certificates"]
trainings_col = db["trainings"]

employees_col.delete_many({})
certificates_col.delete_many({})
trainings_col.delete_many({})

employees = [
    {
        "employee_id": "EMP-1001",
        "employee_name": "Aya Bensalem",
        "email": "aya.bensalem@nttdata.com",
        "department": "Ressources Humaines",
        "job_title": "HR Business Partner",
        "location": "Tanger",
        "skills": ["Communication", "Recruitment", "HR Analytics", "Leadership"],
        "skill_1": "Communication",
        "skill_2": "Recruitment",
        "skill_3": "HR Analytics",
        "skill_4": "Leadership",
        "skill_5": "Culture",
        "skill_count": 5,
        "joined_at": "2021-05-12",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1002",
        "employee_name": "Karim Bensouda",
        "email": "karim.bensouda@nttdata.com",
        "department": "IT & Digital",
        "job_title": "Senior Product Manager",
        "location": "Casablanca",
        "skills": ["Python", "SQL", "Agile", "Cloud", "Docker"],
        "skill_1": "Python",
        "skill_2": "SQL",
        "skill_3": "Agile",
        "skill_4": "Cloud",
        "skill_5": "Docker",
        "skill_count": 5,
        "joined_at": "2020-02-18",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1003",
        "employee_name": "Salma El Idrissi",
        "email": "salma.elidrissi@nttdata.com",
        "department": "Data & AI",
        "job_title": "Data Analyst",
        "location": "Rabat",
        "skills": ["Python", "Power BI", "SQL", "Statistics", "Machine Learning"],
        "skill_1": "Python",
        "skill_2": "Power BI",
        "skill_3": "SQL",
        "skill_4": "Statistics",
        "skill_5": "Machine Learning",
        "skill_count": 5,
        "joined_at": "2022-09-04",
        "created_at": datetime.utcnow().isoformat(),
    },
]

employees_col.insert_many(employees)

trainings = [
    {"training_id": "TRN-001", "training_title": "Python for Data Science", "provider": "Coursera", "skill_acquired": "Python"},
    {"training_id": "TRN-002", "training_title": "SQL Fundamentals", "provider": "Udemy", "skill_acquired": "SQL"},
    {"training_id": "TRN-003", "training_title": "Power BI Advanced", "provider": "Microsoft Learn", "skill_acquired": "Power BI"},
]
trainings_col.insert_many(trainings)

base_time = datetime.utcnow()
certificates = []
for idx, emp in enumerate(employees, start=1):
    training = trainings[(idx - 1) % len(trainings)]
    issue_date = base_time - timedelta(days=30 * ((idx % 9) + 1))
    expiry_date = issue_date + timedelta(days=365)
    status = "issued" if idx % 3 != 0 else "failed"
    if idx % 5 == 0:
        status = "expired"
    score = 78 + (idx * 3) % 18
    certificate = {
        "certificate_id": f"CERT-{1000 + idx}",
        "employee_id": emp["employee_id"],
        "employee_name": emp["employee_name"],
        "department": emp["department"],
        "training_title": training["training_title"],
        "provider": training["provider"],
        "skill_acquired": training["skill_acquired"],
        "status": status,
        "issue_date": issue_date,
        "expiry_date": expiry_date,
        "score": score,
        "homework_score": min(100, score - 5),
        "quiz_score": min(100, score + 2),
        "assignment_score": min(100, score + 4),
        "exam_score": min(100, score + 7),
        "scores": {
            "total": score,
            "homework": min(100, score - 5),
            "quiz": min(100, score + 2),
            "assignment": min(100, score + 4),
            "exam": min(100, score + 7),
        },
        "created_at": datetime.utcnow().isoformat(),
    }
    certificates.append(certificate)

certificates_col.insert_many(certificates)

print(f"employees={len(employees)}")
print(f"trainings={len(trainings)}")
print(f"certificates={len(certificates)}")
