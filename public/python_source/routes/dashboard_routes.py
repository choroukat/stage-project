from datetime import datetime

from fastapi import APIRouter

from database.mongodb import get_collection
from tools.certificate_tools import certificates_by_month, department_with_most_certificates
from tools.employee_tools import get_department_stats, get_skills_distribution

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _parse_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        try:
            return datetime.fromisoformat(value)
        except Exception:
            return None
    return None


@router.get("/employees-stats", summary="Dashboard Employés")
def get_employee_dashboard_stats():
    employees = get_collection("employees")
    certificates = get_collection("certificates")

    department_stats = get_department_stats(None)
    skills_distribution = get_skills_distribution(None)
    total_employees = employees.count_documents({})

    joined_months = {}
    for emp in employees.find({"joined_at": {"$exists": True, "$ne": None}}, {"joined_at": 1}):
        joined_at = _parse_date(emp.get("joined_at"))
        if not joined_at:
            continue
        month_key = joined_at.strftime("%Y-%m")
        joined_months[month_key] = joined_months.get(month_key, 0) + 1

    employee_growth = [
        {"month": month, "count": joined_months[month]}
        for month in sorted(joined_months.keys())
    ]

    certified_pipeline = [
        {"$match": {"status": {"$in": ["issued", "passed"]}}},
        {
            "$lookup": {
                "from": "employees",
                "localField": "employee_id",
                "foreignField": "employee_id",
                "as": "employee",
            }
        },
        {"$unwind": "$employee"},
        {
            "$group": {
                "_id": {"employee_id": "$employee_id", "department": "$employee.department"}
            }
        },
        {
            "$group": {
                "_id": "$_id.department",
                "certified_employees": {"$sum": 1}
            }
        },
        {"$sort": {"certified_employees": -1}}
    ]
    certified_by_department = list(certificates.aggregate(certified_pipeline))

    dept_totals = {item["_id"]: item["total_employees"] for item in department_stats}
    certification_rate_by_department = []
    seen_departments = set()

    for item in certified_by_department:
        department = item.get("_id") or "Autre"
        total = dept_totals.get(department, 0)
        certified = item.get("certified_employees", 0)
        rate = round(certified / total * 100, 1) if total else 0.0
        certification_rate_by_department.append({
            "department": department,
            "certified_employees": certified,
            "total_employees": total,
            "certification_rate": rate,
        })
        seen_departments.add(department)

    for department, total in dept_totals.items():
        if department not in seen_departments:
            certification_rate_by_department.append({
                "department": department,
                "certified_employees": 0,
                "total_employees": total,
                "certification_rate": 0.0,
            })

    certification_rate_by_department.sort(key=lambda x: x["total_employees"], reverse=True)

    return {
        "total_employees": total_employees,
        "department_stats": department_stats,
        "skills_distribution": skills_distribution,
        "employee_growth": employee_growth,
        "certification_rate_by_department": certification_rate_by_department,
    }


@router.get("/certificates-stats", summary="Dashboard Certificats")
def get_certificate_dashboard_stats():
    certificates = get_collection("certificates")

    status_pipeline = [
        {"$group": {"_id": {"$toLower": "$status"}, "count": {"$sum": 1}}}
    ]
    raw_status = list(certificates.aggregate(status_pipeline))
    status_counts = {"passed": 0, "in_progress": 0, "failed": 0, "expired": 0, "other": 0}

    for item in raw_status:
        status = item.get("_id", "") or ""
        count = item.get("count", 0)
        if status in ["issued", "passed"]:
            status_counts["passed"] += count
        elif "progress" in status:
            status_counts["in_progress"] += count
        elif status == "failed":
            status_counts["failed"] += count
        elif status == "expired":
            status_counts["expired"] += count
        else:
            status_counts["other"] += count

    certificates_by_month_data = []
    month_names = [
        "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
        "Juil", "Août", "Sep", "Oct", "Nov", "Déc"
    ]
    for item in certificates_by_month(None):
        month_number = item.get("_id")
        if isinstance(month_number, int) and 1 <= month_number <= 12:
            certificates_by_month_data.append({
                "month": month_names[month_number - 1],
                "count": item.get("count", 0),
                "month_number": month_number,
            })
    certificates_by_month_data.sort(key=lambda x: x["month_number"])

    top_skills_pipeline = [
        {"$group": {"_id": "$skill_acquired", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 8}
    ]
    top_skills = [
        {"skill": item.get("_id") or "Inconnu", "count": item.get("count", 0)}
        for item in certificates.aggregate(top_skills_pipeline)
    ]

    department_counts = department_with_most_certificates(None)

    return {
        "status_distribution": [
            {"status": "Passed", "count": status_counts["passed"]},
            {"status": "In Progress", "count": status_counts["in_progress"]},
            {"status": "Failed", "count": status_counts["failed"]},
            {"status": "Expired", "count": status_counts["expired"]},
            {"status": "Other", "count": status_counts["other"]},
        ],
        "certificates_by_month": certificates_by_month_data,
        "top_skills": top_skills,
        "department_certificate_counts": department_counts,
    }
