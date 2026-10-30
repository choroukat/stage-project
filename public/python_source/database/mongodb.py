"""
database/mongodb.py
===================
Connexion centrale à MongoDB Atlas.
Expose toutes les collections utilisées dans le projet.
Importé par : auth_service, employee_routes, certificate_routes,
              training_routes, history_routes, email_service, etc.
"""

import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

# ================================================================
# CONNEXION MONGODB ATLAS
# ================================================================

MONGO_URI     = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "hr_platform")

if not MONGO_URI:
    raise RuntimeError(
        "❌ MONGO_URI manquant dans .env\n"
        "Format : mongodb+srv://user:password@cluster.mongodb.net/"
    )

try:
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,   # Timeout connexion : 5 secondes
        connectTimeoutMS=10000,
        socketTimeoutMS=30000,
    )
    # Vérifier que la connexion fonctionne
    client.admin.command("ping")
    logger.success(f"✅ MongoDB Atlas connecté — base : {MONGO_DB_NAME}")

except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    logger.error(f"❌ Impossible de se connecter à MongoDB : {e}")
    raise RuntimeError(f"MongoDB connection failed: {e}")

# Base de données principale
db = client[MONGO_DB_NAME]

# ================================================================
# COLLECTIONS
# ================================================================

# Utilisateurs de la plateforme (HR, Management)
users_col = db["users"]

# Employés de l'entreprise
employees_collection = db["employees"]

# Certificats
certificates_collection = db["certificates"]

# Formations
trainings_collection = db["trainings"]

# Historique des actions utilisateurs
history_collection = db["history"]

# Emails envoyés (log des emails)
emails_log_collection = db["emails_log"]


# ================================================================
# HELPER : récupérer une collection par son nom
# ================================================================

_COLLECTIONS = {
    "users":         users_col,
    "employees":     employees_collection,
    "certificates":  certificates_collection,
    "trainings":     trainings_collection,
    "history":       history_collection,
    "emails_log":    emails_log_collection,
}

def get_collection(name: str):
    """
    Retourne une collection MongoDB par son nom.
    Utilisé dans les routes pour accéder dynamiquement à une collection.

    Args:
        name (str): Nom de la collection
                    ('users', 'employees', 'certificates', 'trainings',
                     'history', 'emails_log')

    Returns:
        Collection MongoDB

    Raises:
        ValueError: Si le nom de collection est inconnu
    """
    if name not in _COLLECTIONS:
        raise ValueError(
            f"Collection inconnue : '{name}'. "
            f"Valeurs valides : {list(_COLLECTIONS.keys())}"
        )
    return _COLLECTIONS[name]


# ================================================================
# HELPER : nettoyer un document MongoDB (supprimer _id non sérialisable)
# ================================================================

def clean_doc(doc: dict) -> dict:
    """
    Supprime le champ _id de MongoDB (type ObjectId non JSON-sérialisable).
    À appeler avant de retourner un document dans une réponse API.

    Args:
        doc (dict): Document MongoDB brut

    Returns:
        dict: Document sans le champ _id
    """
    if doc and "_id" in doc:
        doc.pop("_id")
    return doc


def clean_docs(docs: list) -> list:
    """
    Applique clean_doc sur une liste de documents.

    Args:
        docs (list): Liste de documents MongoDB bruts

    Returns:
        list: Liste de documents sans _id
    """
    return [clean_doc(doc) for doc in docs]


# ================================================================
# INDEX — Créés au démarrage pour optimiser les requêtes
# ================================================================

def create_indexes():
    """
    Crée les index MongoDB nécessaires pour les performances.
    Appelé une seule fois au démarrage de l'application.
    """
    try:
        # Index email unique sur users
        users_col.create_index(
            [("email", ASCENDING)],
            unique=True,
            name="idx_users_email_unique"
        )

        # Index sur employees
        employees_collection.create_index(
            [("employee_id", ASCENDING)],
            unique=True,
            sparse=True,
            name="idx_employees_id_unique"
        )
        employees_collection.create_index(
            [("email", ASCENDING)],
            name="idx_employees_email"
        )
        employees_collection.create_index(
            [("department", ASCENDING)],
            name="idx_employees_department"
        )

        # Index sur certificates
        certificates_collection.create_index(
            [("certificate_id", ASCENDING)],
            unique=True,
            sparse=True,
            name="idx_certificates_id_unique"
        )
        certificates_collection.create_index(
            [("employee_id", ASCENDING)],
            name="idx_certificates_employee"
        )
        certificates_collection.create_index(
            [("status", ASCENDING)],
            name="idx_certificates_status"
        )
        certificates_collection.create_index(
            [("expiry_date", ASCENDING)],
            name="idx_certificates_expiry"
        )

        # Index sur trainings
        trainings_collection.create_index(
            [("training_id", ASCENDING)],
            unique=True,
            sparse=True,
            name="idx_trainings_id_unique"
        )

        # Index sur history (trié par date décroissante)
        history_collection.create_index(
            [("timestamp", DESCENDING)],
            name="idx_history_timestamp"
        )
        history_collection.create_index(
            [("user_email", ASCENDING)],
            name="idx_history_user"
        )

        logger.success(" Index MongoDB créés avec succès")

    except Exception as e:
        logger.warning(f"⚠️ Erreur lors de la création des index : {e}")


# Créer les index au chargement du module
create_indexes()