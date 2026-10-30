"""Populate MongoDB with realistic demo HR data for employees, trainings, and certificates.

Usage:
    cd Backend
    ..\.venv\Scripts\python.exe scripts/seed_demo_data.py
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[1]
backend_env = ROOT / ".env"
workspace_env = ROOT.parent / ".env"

if backend_env.exists():
    load_dotenv(backend_env, override=True)
elif workspace_env.exists():
    load_dotenv(workspace_env, override=True)

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "nova_db")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is missing. Add it to .env first.")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]

employees_col = db["employees"]
certificates_col = db["certificates"]
trainings_col = db["trainings"]

# Clean previous demo/test data to keep the workspace predictable.
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
    {
        "employee_id": "EMP-1004",
        "employee_name": "Nadia Khalil",
        "email": "nadia.khalil@nttdata.com",
        "department": "Talent Management",
        "job_title": "Learning Manager",
        "location": "Fès",
        "skills": ["Coaching", "Presentation", "Learning", "People Development"],
        "skill_1": "Coaching",
        "skill_2": "Presentation",
        "skill_3": "Learning",
        "skill_4": "People Development",
        "skill_5": "Mentoring",
        "skill_count": 5,
        "joined_at": "2023-01-15",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1005",
        "employee_name": "Youssef Chraibi",
        "email": "youssef.chraibi@nttdata.com",
        "department": "Software Engineering",
        "job_title": "Backend Engineer",
        "location": "Marrakech",
        "skills": ["Java", "Spring", "Docker", "Kubernetes", "SQL"],
        "skill_1": "Java",
        "skill_2": "Spring",
        "skill_3": "Docker",
        "skill_4": "Kubernetes",
        "skill_5": "SQL",
        "skill_count": 5,
        "joined_at": "2021-11-21",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1006",
        "employee_name": "Leila Fassi",
        "email": "leila.fassi@nttdata.com",
        "department": "Operations",
        "job_title": "Operations Lead",
        "location": "Rabat",
        "skills": ["Process", "Lean", "Excel", "Planning", "Risk Management"],
        "skill_1": "Process",
        "skill_2": "Lean",
        "skill_3": "Excel",
        "skill_4": "Planning",
        "skill_5": "Risk Management",
        "skill_count": 5,
        "joined_at": "2020-07-05",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1007",
        "employee_name": "Mehdi Tahiri",
        "email": "mehdi.tahiri@nttdata.com",
        "department": "Finance & Controlling",
        "job_title": "Financial Analyst",
        "location": "Casablanca",
        "skills": ["Excel", "Power BI", "Budgeting", "Forecasting", "Risk"],
        "skill_1": "Excel",
        "skill_2": "Power BI",
        "skill_3": "Budgeting",
        "skill_4": "Forecasting",
        "skill_5": "Risk",
        "skill_count": 5,
        "joined_at": "2022-04-01",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1008",
        "employee_name": "Amine Berrada",
        "email": "amine.berrada@nttdata.com",
        "department": "Cybersecurity",
        "job_title": "Security Analyst",
        "location": "Tanger",
        "skills": ["Security", "IAM", "Azure", "Network", "ISO 27001"],
        "skill_1": "Security",
        "skill_2": "IAM",
        "skill_3": "Azure",
        "skill_4": "Network",
        "skill_5": "ISO 27001",
        "skill_count": 5,
        "joined_at": "2023-08-12",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1009",
        "employee_name": "Amina Bouzid",
        "email": "amina.bouzid@nttdata.com",
        "department": "Cloud & Infrastructure",
        "job_title": "Cloud Engineer",
        "location": "Rabat",
        "skills": ["AWS", "Terraform", "Linux", "Docker", "Kubernetes"],
        "skill_1": "AWS",
        "skill_2": "Terraform",
        "skill_3": "Linux",
        "skill_4": "Docker",
        "skill_5": "Kubernetes",
        "skill_count": 5,
        "joined_at": "2021-06-10",
        "created_at": datetime.utcnow().isoformat(),
    },
    {
        "employee_id": "EMP-1010",
        "employee_name": "Hicham Benali",
        "email": "hicham.benali@nttdata.com",
        "department": "Learning & Development",
        "job_title": "Training Lead",
        "location": "Casablanca",
        "skills": ["Training", "Facilitation", "Assessment", "Communication", "Coaching"],
        "skill_1": "Training",
        "skill_2": "Facilitation",
        "skill_3": "Assessment",
        "skill_4": "Communication",
        "skill_5": "Coaching",
        "skill_count": 5,
        "joined_at": "2020-03-02",
        "created_at": datetime.utcnow().isoformat(),
    },
]

employees_col.insert_many(employees)

trainings = [
    {"training_id": "TRN-001", "training_title": "Python for Data Science", "provider": "Coursera", "skill_acquired": "Python"},
    {"training_id": "TRN-002", "training_title": "SQL Fundamentals", "provider": "Udemy", "skill_acquired": "SQL"},
    {"training_id": "TRN-003", "training_title": "Power BI Advanced", "provider": "Microsoft Learn", "skill_acquired": "Power BI"},
    {"training_id": "TRN-004", "training_title": "AWS Cloud Practitioner", "provider": "AWS Training", "skill_acquired": "AWS"},
    {"training_id": "TRN-005", "training_title": "Docker & Kubernetes", "provider": "LinkedIn Learning", "skill_acquired": "Docker"},
    {"training_id": "TRN-006", "training_title": "Machine Learning with Scikit-learn", "provider": "Coursera", "skill_acquired": "Machine Learning"},
    {"training_id": "TRN-007", "training_title": "Azure Fundamentals", "provider": "Microsoft Learn", "skill_acquired": "Azure"},
    {"training_id": "TRN-008", "training_title": "Scrum Mastery", "provider": "Scrum.org", "skill_acquired": "Agile"},
    {"training_id": "TRN-009", "training_title": "Terraform for DevOps", "provider": "Udemy", "skill_acquired": "Terraform"},
    {"training_id": "TRN-010", "training_title": "Communication & Leadership", "provider": "NTT DATA Academy", "skill_acquired": "Leadership"},
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
    cert = {
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
    certificates.append(cert)

# Add a few more certificates for better chart richness.
for idx in range(1, 9):
    emp = employees[idx % len(employees)]
    training = trainings[idx % len(trainings)]
    issue_date = base_time - timedelta(days=20 * idx)
    expiry_date = issue_date + timedelta(days=180)
    score = 65 + idx * 5
    certificates.append({
        "certificate_id": f"CERT-{1100 + idx}",
        "employee_id": emp["employee_id"],
        "employee_name": emp["employee_name"],
        "department": emp["department"],
        "training_title": training["training_title"],
        "provider": training["provider"],
        "skill_acquired": training["skill_acquired"],
        "status": "passed" if idx % 2 == 0 else "in_progress",
        "issue_date": issue_date,
        "expiry_date": expiry_date,
        "score": score,
        "homework_score": score - 4,
        "quiz_score": score + 3,
        "assignment_score": score + 2,
        "exam_score": score + 5,
        "scores": {
            "total": score,
            "homework": score - 4,
            "quiz": score + 3,
            "assignment": score + 2,
            "exam": score + 5,
        },
        "created_at": datetime.utcnow().isoformat(),
    })

certificates_col.insert_many(certificates)

print(f"✅ Demo data inserted: {len(employees)} employees, {len(trainings)} trainings, {len(certificates)} certificates")
print("Users created remain in the separate users collection.")
