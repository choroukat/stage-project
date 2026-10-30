"""
scripts/create_users.py
========================
Crée les utilisateurs RH et Management dans MongoDB Atlas.

Lancer depuis le dossier Backend/ :
    python scripts/create_users.py

Chaque utilisateur stocké dans la collection "users" contient :
  - full_name, email, hashed_password, role
  - department, phone, joined_at        ← utilisés par la section Profil du dashboard
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.mongodb import users_col
from services.auth_service import hash_password
from datetime import datetime

# ── Supprimer les anciens utilisateurs ────────────────────────
users_col.delete_many({})
print("🗑️  Anciens utilisateurs supprimés.")

# ── Définition des utilisateurs ───────────────────────────────
users_to_create = []

# ── Utilisateurs RH ──────────────────────────────────────────
hr_users = [
    {
        "full_name":   "Aya Bensalem",
        "email":       "hr1@nttdata.com",
        "password":    "hr11234",
        "department":  "Ressources Humaines",
        "phone":       "+212 6 61 00 00 01",
        "joined_at":   "2022-03-15",
        "location":    "Tanger, Maroc",
    },
    {
        "full_name":   "Fatima Zohra El Amrani",
        "email":       "hr2@nttdata.com",
        "password":    "hr21234",
        "department":  "Ressources Humaines",
        "phone":       "+212 6 61 00 00 02",
        "joined_at":   "2021-09-01",
        "location":    "Casablanca, Maroc",
    },
    {
        "full_name":   "Nadia Khalil",
        "email":       "hr3@nttdata.com",
        "password":    "hr31234",
        "department":  "Talent Management",
        "phone":       "+212 6 61 00 00 03",
        "joined_at":   "2023-01-10",
        "location":    "Rabat, Maroc",
    },
    {
        "full_name":   "Hicham Benali",
        "email":       "hr4@nttdata.com",
        "password":    "hr41234",
        "department":  "Learning & Development",
        "phone":       "+212 6 61 00 00 04",
        "joined_at":   "2020-06-20",
        "location":    "Tanger, Maroc",
    },
    {
        "full_name":   "Sara Idrissi",
        "email":       "hr5@nttdata.com",
        "password":    "hr51234",
        "department":  "Ressources Humaines",
        "phone":       "+212 6 61 00 00 05",
        "joined_at":   "2022-11-05",
        "location":    "Fès, Maroc",
    },
]

# ── Utilisateurs Management ────────────────────────────────────
manager_users = [
    {
        "full_name":   "Karim Bensouda",
        "email":       "manager1@nttdata.com",
        "password":    "manager11234",
        "department":  "IT & Digital",
        "phone":       "+212 6 62 00 00 01",
        "joined_at":   "2019-04-01",
        "location":    "Tanger, Maroc",
    },
    {
        "full_name":   "Mehdi Tahiri",
        "email":       "manager2@nttdata.com",
        "password":    "manager21234",
        "department":  "Finance & Controlling",
        "phone":       "+212 6 62 00 00 02",
        "joined_at":   "2018-07-15",
        "location":    "Casablanca, Maroc",
    },
    {
        "full_name":   "Leila Fassi",
        "email":       "manager3@nttdata.com",
        "password":    "manager31234",
        "department":  "Operations",
        "phone":       "+212 6 62 00 00 03",
        "joined_at":   "2020-02-28",
        "location":    "Rabat, Maroc",
    },
    {
        "full_name":   "Youssef Chraibi",
        "email":       "manager4@nttdata.com",
        "password":    "manager41234",
        "department":  "Software Engineering",
        "phone":       "+212 6 62 00 00 04",
        "joined_at":   "2021-05-10",
        "location":    "Tanger, Maroc",
    },
    {
        "full_name":   "Amina Berrada",
        "email":       "manager5@nttdata.com",
        "password":    "manager51234",
        "department":  "Data & AI",
        "phone":       "+212 6 62 00 00 05",
        "joined_at":   "2022-08-22",
        "location":    "Marrakech, Maroc",
    },
]

# ── Construction des documents MongoDB ────────────────────────
plain_passwords = []  # Pour affichage final

for u in hr_users:
    plain_passwords.append({"email": u["email"], "password": u["password"]})
    users_to_create.append({
        "full_name":         u["full_name"],
        "email":             u["email"],
        "hashed_password":   hash_password(u["password"]),
        "role":              "hr",
        "department":        u["department"],
        "phone":             u["phone"],
        "joined_at":         u["joined_at"],
        "location":          u["location"],
        "created_at":        datetime.utcnow().isoformat(),
        "last_login":        None,
    })

for u in manager_users:
    plain_passwords.append({"email": u["email"], "password": u["password"]})
    users_to_create.append({
        "full_name":         u["full_name"],
        "email":             u["email"],
        "hashed_password":   hash_password(u["password"]),
        "role":              "management",
        "department":        u["department"],
        "phone":             u["phone"],
        "joined_at":         u["joined_at"],
        "location":          u["location"],
        "created_at":        datetime.utcnow().isoformat(),
        "last_login":        None,
    })

# ── Insertion dans MongoDB ────────────────────────────────────
users_col.insert_many(users_to_create)

print(f"\n✅ {len(users_to_create)} utilisateurs créés dans MongoDB Atlas.\n")
print("=" * 55)
print(f"{'Email':<30} {'Mot de passe':<20} {'Rôle'}")
print("-" * 55)
for item in plain_passwords:
    role = "hr" if item["email"].startswith("hr") else "management"
    print(f"{item['email']:<30} {item['password']:<20} {role}")
print("=" * 55)
print("\n💡 Copiez ces identifiants pour tester le login.\n")