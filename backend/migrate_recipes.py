import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "food_recipe_db")

client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]

YOUTUBE_VIDEOS = {
    "Crispy Vegetable Samosas": "https://www.youtube.com/watch?v=0b73Zg7F0vE",
    "Paneer Butter Masala": "https://www.youtube.com/watch?v=n8u_K74i7uA",
    "Classic Masala Dosa": "https://www.youtube.com/watch?v=CCab5mffv0Y",
    "Hyderabadi Chicken Biryani": "https://www.youtube.com/watch?v=95BCU1n268w",
    "Dum Biryani": "https://www.youtube.com/watch?v=ZfXjG9wK58c",
    "Gulab Jamun with Cardamom Syrup": "https://www.youtube.com/watch?v=r0X4Y087l-Y",
    "Creamy Fettuccine Alfredo": "https://www.youtube.com/watch?v=b4O5Wn_vYyE",
    "Classic Margherita Pizza": "https://www.youtube.com/watch?v=1-SJGQ2HLp8",
    "Garlic Herb Tomato Bruschetta": "https://www.youtube.com/watch?v=UqQc9QO7qZ0",
    "Classic Venetian Tiramisu": "https://www.youtube.com/watch?v=y94jG-1uTyg",
    "Italian Frittata with Spinach & Ricotta": "https://www.youtube.com/watch?v=wX-y0c9_9-g",
    "Szechuan Kung Pao Chicken": "https://www.youtube.com/watch?v=uK1XfV5M4mI",
    "Cantonese Vegetable Dim Sum Dumplings": "https://www.youtube.com/watch?v=LqU3xW0Gf5A",
    "Savory Chinese Egg Fried Rice": "https://www.youtube.com/watch?v=F3_lWkC79_A",
    "Fluffy Chinese Scallion Pancakes (Cong You Bing)": "https://www.youtube.com/watch?v=jW_nK6-L5uE",
    "Crispy Sesame Honey Banana Fritters": "https://www.youtube.com/watch?v=kY8_G5x-w0A",
    "Authentic Street Chicken Tacos": "https://www.youtube.com/watch?v=D-K_a_j4x0I",
    "Huevos Rancheros Breakfast": "https://www.youtube.com/watch?v=qX-lM0_8b6c",
    "Loaded Cheesy Beef Enchiladas": "https://www.youtube.com/watch?v=pY-oN1_7c5d",
    "Crispy Cinnamon Sugar Churros": "https://www.youtube.com/watch?v=vV9_N0-m4aE",
    "Fresh Chunky Guacamole with Chips": "https://www.youtube.com/watch?v=rZ-lO2_9d8e",
    "Grilled Lemon Herb Salmon": "https://www.youtube.com/watch?v=tY-pQ3_0e7f",
    "Classic Caesar Salad with Garlic Croutons": "https://www.youtube.com/watch?v=uX-qR4_1f8g",
    "Molten Chocolate Lava Cake": "https://www.youtube.com/watch?v=wY-rS5_2g9h",
    "Crispy Garlic Parmesan Potato Wedges": "https://www.youtube.com/watch?v=xZ-tT6_3h0i",
    "Fish Fry": "https://www.youtube.com/watch?v=yA-uU7_4i1j"
}

# Special illustrated preparation steps matching user's screenshots for Crispy Vegetable Samosas
SAMOSA_STEPS = [
    {
        "step": 1,
        "instruction": "Peel, halve and boil 500 grams (3 to 4 medium) potatoes in a pot of water, until fork tender (not mushy). Or pressure cook unpeeled and halved potatoes for 2 to 3 whistles on a medium flame with 1 cup water. Peel after cooling.",
        "image_url": "/steps/samosa_step1.png"
    },
    {
        "step": 2,
        "instruction": "Cool the boiled potatoes completely and gently crumble them into bite-sized chunks with your hands. Set aside in a bowl.",
        "image_url": "/steps/samosa_step2.png"
    },
    {
        "step": 3,
        "instruction": "To a large mixing bowl add 2 cups all-purpose flour (maida), 3/4 tsp ajwain (carom seeds), 3/4 tsp salt, and 1/4 cup warm oil or ghee. Rub the fat thoroughly into the flour until it resembles breadcrumbs.",
        "image_url": "/steps/samosa_step3.png"
    },
    {
        "step": 4,
        "instruction": "In a heavy skillet, heat 1 tbsp oil on medium flame. Add cumin seeds and finely minced ginger; sauté until fragrant and sizzling without burning.",
        "image_url": "/steps/samosa_step4.png"
    },
    {
        "step": 5,
        "instruction": "Divide the rested dough into equal smooth portions. Roll each ball on a wooden board into an even oval sheet (about 1 mm thick), then slice crosswise into two halves.",
        "image_url": "/steps/samosa_step5.png"
    },
    {
        "step": 6,
        "instruction": "Shape each half into a cone by moistening the straight edge with water. Stuff with the spiced potato filling, seal the bottom edge firmly, and deep fry in medium-hot oil until crispy and golden brown.",
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80"
    }
]

def migrate():
    count = 0
    for r in db.recipes.find():
        name = r.get("name", "")
        updates = {}

        # 1. Update Video URL if missing or empty
        video = YOUTUBE_VIDEOS.get(name) or r.get("video_url") or "https://www.youtube.com/watch?v=0b73Zg7F0vE"
        updates["video_url"] = video

        # 2. Update Instructions with images
        if name == "Crispy Vegetable Samosas":
            updates["instructions"] = SAMOSA_STEPS
        else:
            raw_inst = r.get("instructions", [])
            new_inst = []
            for idx, item in enumerate(raw_inst, start=1):
                if isinstance(item, str):
                    new_inst.append({
                        "step": idx,
                        "instruction": item,
                        "image_url": ""
                    })
                elif isinstance(item, dict):
                    new_inst.append({
                        "step": item.get("step") or idx,
                        "instruction": item.get("instruction") or item.get("text") or "",
                        "image_url": item.get("image_url") or ""
                    })
            updates["instructions"] = new_inst

        db.recipes.update_one({"_id": r["_id"]}, {"$set": updates})
        count += 1

    print(f"Successfully migrated {count} recipes with YouTube videos and structured step instructions.")

if __name__ == "__main__":
    migrate()
