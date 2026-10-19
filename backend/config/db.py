import os
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from dotenv import load_dotenv
load_dotenv(override=True)
client = None
db = None
def connect_db():
    global client, db
    mongo_uri = os.getenv("MONGO_URI")
    database_name = os.getenv("DATABASE_NAME", "food_recipe_db")
    if not mongo_uri:
        raise RuntimeError("MONGO_URI is missing from backend/.env")

    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000
        )
        client.admin.command("ping")
        db = client[database_name]

        # Prevent duplicate accounts and duplicate reviews.
        db.users.create_index("email", unique=True)
        db.favorites.create_index(
            [("user_id", 1), ("recipe_id", 1)], unique=True
        )
        db.reviews.create_index(
            [("user_id", 1), ("recipe_id", 1)], unique=True
        )

        print("MongoDB connected successfully!")
        return db

    except PyMongoError as error:
        if client:
            client.close()
        client = None
        db = None
        raise RuntimeError(
            f"Could not connect to MongoDB: {error}"
        ) from error
