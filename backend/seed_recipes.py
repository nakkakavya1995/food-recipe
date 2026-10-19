import os
from datetime import datetime, timezone
from config.db import connect_db

SAMPLE_RECIPES = [
    # Indian
    {
        "name": "Paneer Butter Masala",
        "description": "Rich and creamy cottage cheese cubes simmered in a luscious tomato, butter, and cashew gravy flavored with aromatic spices.",
        "ingredients": [
            "250g Paneer (cottage cheese), cubed",
            "3 large tomatoes, puréed",
            "1 large onion, finely chopped",
            "2 tbsp butter & 1 tbsp oil",
            "10 cashews soaked and blended into paste",
            "1 tsp ginger-garlic paste",
            "1 tsp garam masala",
            "1 tsp Kashmiri red chili powder",
            "1/2 cup fresh cream",
            "1 tbsp dried fenugreek leaves (Kasuri methi)",
            "Salt to taste"
        ],
        "instructions": [
            "Melt 1 tbsp butter and oil in a pan; sauté chopped onions and ginger-garlic paste until golden.",
            "Add fresh tomato purée, turmeric, chili powder, and salt. Cook until oil separates.",
            "Stir in the smooth cashew paste and 1/2 cup water. Simmer on medium flame for 5 minutes.",
            "Add the cubed paneer and simmer gently for 3-4 minutes so the paneer absorbs flavors.",
            "Finish with remaining butter, fresh cream, crushed kasuri methi, and garam masala.",
            "Serve hot with butter naan, paratha, or jeera rice."
        ],
        "cuisine": "Indian",
        "meal_type": "Dinner",
        "cooking_time": 30,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Classic Masala Dosa",
        "description": "Crispy golden fermented rice-lentil crepe filled with spiced potato masala, served with coconut chutney and tangy sambar.",
        "ingredients": [
            "2 cups fermented Dosa batter",
            "3 medium boiled potatoes, mashed roughly",
            "1 sliced onion and 2 green chilies",
            "1/2 tsp mustard seeds and cumin seeds",
            "1 sprig curry leaves",
            "1/4 tsp turmeric powder",
            "2 tbsp oil or ghee for cooking",
            "Fresh coriander leaves"
        ],
        "instructions": [
            "Heat oil in a pan, temper mustard seeds, cumin seeds, green chilies, and curry leaves.",
            "Add sliced onions and sauté until soft. Add turmeric and mashed potatoes with salt.",
            "Mix well, add 2 tbsp water, and cook for 3 minutes. Finish with coriander.",
            "Heat a seasoned cast iron tawa, pour a ladle of batter, and swirl into a thin round crepe.",
            "Drizzle ghee around the edges and cook on medium flame until golden and crisp.",
            "Place a spoonful of potato masala inside, fold, and serve immediately with chutney and sambar."
        ],
        "cuisine": "Indian",
        "meal_type": "Breakfast",
        "cooking_time": 15,
        "servings": 2,
        "image_url": "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Hyderabadi Chicken Biryani",
        "description": "Fragrant basmati rice layered with succulent marinated chicken, saffron milk, fried onions, and fresh mint.",
        "ingredients": [
            "500g Chicken, bone-in pieces",
            "2 cups aged Basmati rice",
            "1 cup thick yogurt (curd)",
            "1 tbsp ginger-garlic paste",
            "2 large sliced onions, deep fried golden (Birista)",
            "2 tbsp Biryani masala powder",
            "A pinch of saffron strands soaked in warm milk",
            "Fresh mint and coriander leaves",
            "3 tbsp pure ghee"
        ],
        "instructions": [
            "Marinate chicken with yogurt, ginger-garlic, spices, half of fried onions, mint, and salt for 1 hour.",
            "Boil basmati rice with whole spices until 70% cooked; drain water.",
            "In a heavy-bottomed pot, spread the marinated chicken evenly at the bottom.",
            "Layer the parboiled rice over the chicken, topping with saffron milk, ghee, mint, and crispy onions.",
            "Seal the pot tightly with foil or dough and cook on low heat (dum) for 25-30 minutes.",
            "Gently fluff the rice and serve warm with raita and mirchi ka salan."
        ],
        "cuisine": "Indian",
        "meal_type": "Lunch",
        "cooking_time": 45,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Crispy Vegetable Samosas",
        "description": "Flaky, golden pastry pockets stuffed with spiced potatoes, green peas, cumin, and coriander seeds.",
        "ingredients": [
            "2 cups all-purpose flour (maida)",
            "4 tbsp warm oil or ghee",
            "3 large potatoes boiled and cubed small",
            "1/2 cup boiled green peas",
            "1 tsp cumin seeds and crushed coriander seeds",
            "1 tsp garam masala and amchur (dry mango powder)",
            "Oil for deep frying",
            "Salt to taste"
        ],
        "instructions": [
            "Knead flour, carom seeds, oil, and chilled water into a firm dough; rest for 25 minutes.",
            "Sauté spices with potatoes and peas until aromatic and well seasoned. Let cool.",
            "Roll small portions of dough into ovals, cut in half, form cones, and fill with spiced potato mix.",
            "Seal edges with a dab of water and crimp.",
            "Deep fry on low-medium flame until evenly golden and crispy.",
            "Serve hot with sweet tamarind and spicy mint chutneys."
        ],
        "cuisine": "Indian",
        "meal_type": "Snack",
        "cooking_time": 30,
        "servings": 6,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Gulab Jamun with Cardamom Syrup",
        "description": "Soft and spongy milk-solid dumplings soaked in rose and cardamom infused sugar syrup.",
        "ingredients": [
            "1 cup khoya (mawa) or milk powder mix",
            "3 tbsp all-purpose flour",
            "1/4 tsp baking powder",
            "1 1/2 cups sugar",
            "1 1/2 cups water",
            "4 green cardamom pods, crushed",
            "1 tsp rose water",
            "Ghee for deep frying"
        ],
        "instructions": [
            "Boil sugar and water with crushed cardamom pods for 8 minutes to prepare a light sticky syrup.",
            "Gently knead khoya, flour, and baking powder with a splash of milk into a smooth dough.",
            "Form small smooth crack-free balls.",
            "Fry the balls in warm ghee on low heat until deep golden brown.",
            "Drop the fried jamuns into warm sugar syrup and let soak for at least 45 minutes.",
            "Serve warm garnished with slivered pistachios."
        ],
        "cuisine": "Indian",
        "meal_type": "Dessert",
        "cooking_time": 30,
        "servings": 6,
        "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=800&q=80",
    },

    # Italian
    {
        "name": "Creamy Fettuccine Alfredo",
        "description": "Tender fettuccine tossed in a velvet parmesan and butter cream sauce, accented with garlic and fresh cracked black pepper.",
        "ingredients": [
            "300g Fettuccine pasta",
            "1/2 cup unsalted butter",
            "1 cup heavy whipping cream",
            "1 1/2 cups freshly grated Parmigiano-Reggiano",
            "2 cloves garlic, finely minced",
            "Fresh parsley, chopped",
            "Freshly cracked black pepper and salt"
        ],
        "instructions": [
            "Bring a large pot of salted water to boil. Cook fettuccine al dente; reserve 1/2 cup pasta water.",
            "In a large skillet over medium-low heat, melt butter and gently cook minced garlic for 1 minute.",
            "Pour in heavy cream and simmer gently for 3-4 minutes.",
            "Whisk in grated parmesan cheese until completely smooth and velvety.",
            "Toss cooked fettuccine directly into the sauce, adding pasta water if needed.",
            "Garnish with chopped fresh parsley and coarse black pepper."
        ],
        "cuisine": "Italian",
        "meal_type": "Dinner",
        "cooking_time": 20,
        "servings": 3,
        "image_url": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Classic Margherita Pizza",
        "description": "Authentic Neapolitan pizza topped with San Marzano tomato sauce, fresh mozzarella, aromatic basil leaves, and extra virgin olive oil.",
        "ingredients": [
            "1 artisan pizza dough ball",
            "1/2 cup crushed San Marzano tomatoes",
            "150g fresh mozzarella (fior di latte), torn",
            "Fresh basil leaves",
            "2 tbsp extra virgin olive oil",
            "Sea salt to taste"
        ],
        "instructions": [
            "Preheat oven with a pizza stone to maximum temperature (475°F / 245°C).",
            "Stretch the dough by hand on parchment paper into a 12-inch round with raised crust.",
            "Spread tomato sauce evenly across the dough, leaving a 1/2 inch border.",
            "Scatter torn fresh mozzarella across the sauce and drizzle with olive oil.",
            "Bake for 10-12 minutes until crust is blistered and cheese is melted and bubbling.",
            "Top immediately with fresh basil leaves and a pinch of flaky sea salt."
        ],
        "cuisine": "Italian",
        "meal_type": "Lunch",
        "cooking_time": 25,
        "servings": 2,
        "image_url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Garlic Herb Tomato Bruschetta",
        "description": "Toasted rustic ciabatta slices rubbed with fresh garlic and loaded with diced ripe roma tomatoes, basil, and balsamic glaze.",
        "ingredients": [
            "1 loaf ciabatta or baguette, sliced into rounds",
            "4 ripe roma tomatoes, diced",
            "2 cloves garlic (1 minced, 1 peeled whole)",
            "1/4 cup fresh basil leaves, chiffonade",
            "2 tbsp extra virgin olive oil",
            "1 tbsp balsamic glaze",
            "Flaky sea salt and black pepper"
        ],
        "instructions": [
            "Toss diced tomatoes, minced garlic, basil, 1 tbsp olive oil, salt, and pepper in a bowl. Let marinate for 15 minutes.",
            "Brush bread slices with olive oil and grill or toast until golden and crunchy.",
            "Rub the warm toasts with the peeled whole garlic clove for aroma.",
            "Spoon generous mounds of tomato basil mixture over each toast.",
            "Drizzle with balsamic glaze and serve immediately."
        ],
        "cuisine": "Italian",
        "meal_type": "Snack",
        "cooking_time": 15,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Classic Venetian Tiramisu",
        "description": "Layers of coffee-soaked Italian ladyfingers and rich mascarpone zabaglione, dusted with Dutch-process cocoa powder.",
        "ingredients": [
            "24 Savoiardi ladyfinger biscuits",
            "250g Mascarpone cheese, room temperature",
            "3 large egg yolks",
            "1/2 cup granulated sugar",
            "1 cup freshly brewed espresso, cooled",
            "1 cup heavy whipping cream",
            "3 tbsp unsweetened cocoa powder"
        ],
        "instructions": [
            "Whisk egg yolks and sugar over a gentle double boiler until pale and creamy; let cool.",
            "Beat mascarpone into the yolk mixture, then gently fold in softly whipped heavy cream.",
            "Dip ladyfingers quickly in cooled espresso (do not soak too long) and arrange in a dish.",
            "Spread half of the mascarpone cream over the ladyfinger layer.",
            "Repeat with a second layer of espresso-dipped ladyfingers and remaining cream.",
            "Chill in the refrigerator for at least 4 hours. Dust heavily with cocoa powder before slicing."
        ],
        "cuisine": "Italian",
        "meal_type": "Dessert",
        "cooking_time": 25,
        "servings": 6,
        "image_url": "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Italian Frittata with Spinach & Ricotta",
        "description": "Fluffy baked Italian egg skillet loaded with baby spinach, cherry tomatoes, and creamy dollops of ricotta cheese.",
        "ingredients": [
            "6 large free-range eggs",
            "1/4 cup whole milk",
            "2 cups baby spinach",
            "1/2 cup halved cherry tomatoes",
            "1/3 cup fresh ricotta cheese",
            "1/4 cup grated parmesan",
            "1 tbsp olive oil",
            "Salt, pepper, and pinch of nutmeg"
        ],
        "instructions": [
            "Whisk eggs, milk, grated parmesan, salt, pepper, and nutmeg in a medium bowl.",
            "Heat olive oil in an oven-safe skillet; sauté spinach until wilted and tomatoes are blistered.",
            "Pour egg mixture into skillet, stirring gently for 1 minute so curds start setting.",
            "Dollop spoonfuls of ricotta cheese across the top.",
            "Bake at 375°F (190°C) for 12-14 minutes until eggs are puffed and center is set.",
            "Slice into wedges and serve warm with crusty bread."
        ],
        "cuisine": "Italian",
        "meal_type": "Breakfast",
        "cooking_time": 20,
        "servings": 3,
        "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
    },

    # Chinese
    {
        "name": "Szechuan Kung Pao Chicken",
        "description": "Tender chicken stir-fried with crunchy roasted peanuts, dried red chilies, bell peppers, and a tingling savory-sweet sauce.",
        "ingredients": [
            "400g Chicken breast, cut into 1-inch cubes",
            "1/2 cup roasted unsalted peanuts",
            "8-10 dried Szechuan red chilies, deseeded",
            "1 bell pepper and 2 spring onions, sliced",
            "2 cloves garlic and 1 tsp grated ginger",
            "2 tbsp Soy sauce & 1 tbsp dark soy sauce",
            "1 tbsp Chinkiang black vinegar",
            "1 tbsp brown sugar",
            "1 tsp cornstarch mixed in 2 tbsp water"
        ],
        "instructions": [
            "Marinate diced chicken with 1 tbsp soy sauce and 1 tsp cornstarch for 15 minutes.",
            "Heat wok on high flame with 2 tbsp oil; stir-fry dried red chilies and garlic until fragrant.",
            "Add chicken cubes and flash fry on high heat until lightly browned (3-4 minutes).",
            "Toss in bell peppers, spring onion whites, and ginger.",
            "Pour the mixed sauce and cornstarch slurry; toss briskly until glossy and coating the chicken.",
            "Fold in roasted peanuts and spring onion greens. Serve steaming with jasmine rice."
        ],
        "cuisine": "Chinese",
        "meal_type": "Lunch",
        "cooking_time": 20,
        "servings": 3,
        "image_url": "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Cantonese Vegetable Dim Sum Dumplings",
        "description": "Delicate steamed crystal dumplings stuffed with shredded shiitake mushrooms, water chestnuts, and crisp cabbage.",
        "ingredients": [
            "20 Dumpling wrappers",
            "1 cup finely shredded Napa cabbage",
            "4 dried shiitake mushrooms, rehydrated and minced",
            "1/2 cup water chestnuts, diced small",
            "1 carrot, grated",
            "1 tbsp sesame oil",
            "1 tbsp soy sauce",
            "1 tsp cornstarch",
            "Chili crisp oil for serving"
        ],
        "instructions": [
            "Salt shredded cabbage, let sit for 10 minutes, and squeeze out excess moisture.",
            "In a bowl, combine cabbage, shiitake mushrooms, water chestnuts, carrots, sesame oil, soy sauce, and cornstarch.",
            "Place 1 spoonful of filling into each wrapper, moisten edges with water, and pleat to seal.",
            "Line a bamboo steamer with parchment paper; arrange dumplings leaving space.",
            "Steam over boiling water on high heat for 7-8 minutes until translucent.",
            "Serve hot with soy dipping sauce and chili crisp."
        ],
        "cuisine": "Chinese",
        "meal_type": "Snack",
        "cooking_time": 25,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Savory Chinese Egg Fried Rice",
        "description": "Fluffy chilled jasmine rice wok-tossed with fluffy scrambled eggs, sweet green peas, carrots, sesame oil, and scallions.",
        "ingredients": [
            "3 cups cooked jasmine rice, chilled overnight",
            "3 large eggs, beaten with a pinch of salt",
            "1 cup diced mixed peas, carrots, and sweetcorn",
            "3 stalks green scallions, chopped",
            "2 tbsp neutral cooking oil",
            "2 tbsp light soy sauce",
            "1/2 tsp toasted sesame oil",
            "White pepper to taste"
        ],
        "instructions": [
            "Heat wok over high flame with 1 tbsp oil. Pour beaten eggs, swirl and gently scramble until 80% cooked; remove.",
            "Add remaining oil to wok, toss in diced vegetables, and stir-fry for 2 minutes.",
            "Add chilled rice, breaking up any clumps with a spatula over high heat.",
            "Drizzle soy sauce, sesame oil, and white pepper over the rice; toss vigorously for 3 minutes.",
            "Fold in scrambled eggs and sliced scallions for the final 30 seconds.",
            "Serve hot as a complete meal or accompaniment."
        ],
        "cuisine": "Chinese",
        "meal_type": "Dinner",
        "cooking_time": 15,
        "servings": 3,
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Fluffy Chinese Scallion Pancakes (Cong You Bing)",
        "description": "Crispy and chewy layered flatbreads infused with finely chopped green scallions and toasted sesame oil.",
        "ingredients": [
            "2 cups all-purpose flour",
            "3/4 cup hot boiling water",
            "1/4 cup room temperature water",
            "1 cup finely chopped fresh scallions",
            "2 tbsp toasted sesame oil",
            "Flaky sea salt",
            "Oil for pan-frying"
        ],
        "instructions": [
            "Mix flour with hot water, then cool water, to form a soft dough. Knead 5 minutes and rest for 30 minutes.",
            "Divide into 4 portions. Roll each thinly, brush with sesame oil, sprinkle scallions and salt.",
            "Roll into a tight rope, coil like a snail, and flatten with rolling pin into a round pancake.",
            "Heat 2 tbsp oil in a heavy skillet over medium heat.",
            "Pan fry pancake for 3 minutes per side until golden brown and flaky.",
            "Cut into wedges and serve with ginger-soy dipping sauce."
        ],
        "cuisine": "Chinese",
        "meal_type": "Breakfast",
        "cooking_time": 25,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Crispy Sesame Honey Banana Fritters",
        "description": "Sweet ripe bananas battered in cornstarch, fried until crispy golden, and glazed in honey and toasted sesame seeds.",
        "ingredients": [
            "4 ripe firm bananas, cut into chunks",
            "1/2 cup cornstarch",
            "1/4 cup all-purpose flour",
            "1/2 cup ice-cold sparkling water",
            "1/3 cup pure honey",
            "2 tbsp toasted white sesame seeds",
            "Oil for deep frying"
        ],
        "instructions": [
            "Whisk cornstarch, flour, and icy sparkling water into a smooth light batter.",
            "Dip banana chunks into batter, coating evenly.",
            "Drop into hot oil (350°F / 175°C) and fry for 3-4 minutes until crisp and pale golden.",
            "Drain fritters on paper towels.",
            "Warm honey in a saucepan and drizzle over the hot banana fritters.",
            "Sprinkle generously with toasted sesame seeds and serve warm."
        ],
        "cuisine": "Chinese",
        "meal_type": "Dessert",
        "cooking_time": 15,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80",
    },

    # Mexican
    {
        "name": "Authentic Street Chicken Tacos",
        "description": "Charred corn tortillas stuffed with citrus-chili spiced grilled chicken, diced white onions, fresh cilantro, and lime wedges.",
        "ingredients": [
            "400g Chicken thighs, boneless",
            "8 small yellow corn tortillas",
            "Juice of 2 limes & 1 orange",
            "2 tbsp olive oil",
            "1 tsp ground cumin, smoked paprika, garlic powder",
            "1/2 diced white onion",
            "1/2 cup fresh cilantro, chopped",
            "Salsa verde for topping"
        ],
        "instructions": [
            "Marinate chicken in citrus juices, olive oil, cumin, paprika, garlic powder, and salt for 30 minutes.",
            "Grill or sear chicken in a cast-iron skillet on high heat for 5 minutes per side until charred and cooked through.",
            "Rest chicken for 5 minutes, then chop into bite-sized pieces.",
            "Warm corn tortillas on a dry skillet until pliable and lightly toasted.",
            "Double up tortillas, fill with grilled chicken, diced onion, and cilantro.",
            "Squeeze fresh lime and top with salsa verde."
        ],
        "cuisine": "Mexican",
        "meal_type": "Lunch",
        "cooking_time": 25,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Huevos Rancheros Breakfast",
        "description": "Crispy fried corn tortillas topped with warm refried black beans, sunny-side eggs, zesty ranchero sauce, and avocado slices.",
        "ingredients": [
            "4 corn tortillas",
            "4 large eggs",
            "1 cup warm refried black beans",
            "1 cup warm ranchero salsa or pico de gallo",
            "1 ripe avocado, sliced",
            "1/4 cup crumbled cotija or feta cheese",
            "2 tbsp butter or oil",
            "Fresh cilantro"
        ],
        "instructions": [
            "Lightly fry corn tortillas in oil until crisp on the outside but pliable; drain.",
            "Fry eggs sunny-side up in a skillet with butter until whites are set and yolks remain runny.",
            "Spread warm refried beans over each crispy tortilla.",
            "Place a fried egg atop the beans and spoon warm ranchero salsa over the whites.",
            "Garnish with sliced avocado, crumbled cotija cheese, and chopped cilantro.",
            "Serve immediately with hot coffee or fresh juice."
        ],
        "cuisine": "Mexican",
        "meal_type": "Breakfast",
        "cooking_time": 15,
        "servings": 2,
        "image_url": "https://images.unsplash.com/photo-1593584785033-9c7604d0863f?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Loaded Cheesy Beef Enchiladas",
        "description": "Rolled tortillas filled with seasoned ground beef and black beans, smothered in spicy red enchilada sauce and melted Monterey Jack.",
        "ingredients": [
            "400g lean ground beef",
            "8 flour or corn tortillas",
            "1 can (15 oz) black beans, rinsed",
            "2 cups red enchilada sauce",
            "2 cups shredded Monterey Jack & Cheddar cheese",
            "1 packet taco seasoning",
            "Sour cream and jalapeños for serving"
        ],
        "instructions": [
            "Brown ground beef in a skillet, drain fat, and stir in taco seasoning and black beans.",
            "Pour 1/2 cup enchilada sauce on the bottom of a 9x13 inch baking dish.",
            "Fill each tortilla with beef mixture and a sprinkle of cheese; roll tightly and place seam-side down.",
            "Pour remaining enchilada sauce evenly over the rolled tortillas.",
            "Smother with remaining cheese and bake at 375°F (190°C) for 20 minutes until bubbly and browned.",
            "Cool for 5 minutes; serve with sour cream and pickled jalapeños."
        ],
        "cuisine": "Mexican",
        "meal_type": "Dinner",
        "cooking_time": 35,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1534352956036-cd81e27dd615?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Crispy Cinnamon Sugar Churros",
        "description": "Golden piped choux pastry fried until crispy, coated in cinnamon sugar, and served with rich Mexican chocolate dipping sauce.",
        "ingredients": [
            "1 cup water",
            "2 1/2 tbsp granulated sugar",
            "1/2 tsp salt",
            "2 tbsp vegetable oil",
            "1 cup all-purpose flour",
            "1/2 cup sugar mixed with 1 tbsp ground cinnamon",
            "1/2 cup dark chocolate melted with 1/4 cup cream",
            "Oil for frying"
        ],
        "instructions": [
            "In a saucepan, bring water, 2.5 tbsp sugar, salt, and 2 tbsp oil to a boil.",
            "Remove from heat, stir in flour until dough forms a ball; let cool 5 minutes.",
            "Transfer dough to a piping bag fitted with a large star tip.",
            "Pipe 5-inch strips of dough directly into hot oil (375°F / 190°C), cutting with scissors.",
            "Fry for 4-5 minutes until golden and crisp; drain briefly on paper towels.",
            "Immediately roll hot churros in cinnamon sugar mixture and serve with warm chocolate sauce."
        ],
        "cuisine": "Mexican",
        "meal_type": "Dessert",
        "cooking_time": 25,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Fresh Chunky Guacamole with Chips",
        "description": "Creamy Hass avocados mashed with lime juice, diced jalapeño, tomatoes, red onions, and served with warm tortilla chips.",
        "ingredients": [
            "3 ripe Hass avocados",
            "Juice of 1 fresh lime",
            "1/2 diced red onion",
            "1 Roma tomato, seeded and diced",
            "1 jalapeño pepper, seeded and minced",
            "1/3 cup fresh cilantro, chopped",
            "1/2 tsp sea salt and cumin",
            "Tortilla chips for serving"
        ],
        "instructions": [
            "Halve avocados, remove pit, and scoop flesh into a bowl.",
            "Add fresh lime juice and coarse salt; mash with a fork to desired chunky consistency.",
            "Fold in diced red onion, jalapeño, tomato, and fresh cilantro.",
            "Taste and adjust lime juice and salt.",
            "Serve immediately with a bowl of crisp salted tortilla chips."
        ],
        "cuisine": "Mexican",
        "meal_type": "Snack",
        "cooking_time": 10,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    },

    # Continental
    {
        "name": "Fluffy Buttermilk Pancakes",
        "description": "Thick, golden, cloud-like pancakes served with melted butter and pure maple syrup.",
        "ingredients": [
            "2 cups all-purpose flour",
            "2 tbsp sugar & 2 tsp baking powder",
            "1/2 tsp baking soda & 1/2 tsp salt",
            "2 cups buttermilk",
            "2 large eggs",
            "4 tbsp melted butter",
            "Maple syrup and butter for serving"
        ],
        "instructions": [
            "Whisk dry ingredients together in a large mixing bowl.",
            "In another bowl, whisk buttermilk, eggs, and melted butter.",
            "Pour wet ingredients into dry and fold gently until just combined (lumps are good!).",
            "Heat a greased nonstick griddle over medium heat.",
            "Pour 1/4 cup batter per pancake; cook until bubbles form on surface (2-3 minutes).",
            "Flip and cook 1-2 minutes until golden brown. Serve hot with butter and maple syrup."
        ],
        "cuisine": "Continental",
        "meal_type": "Breakfast",
        "cooking_time": 15,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Grilled Lemon Herb Salmon",
        "description": "Pan-seared salmon fillet with crispy skin, basted in lemon garlic butter and fresh dill, served alongside asparagus.",
        "ingredients": [
            "2 fresh salmon fillets with skin",
            "1 bunch fresh green asparagus, trimmed",
            "2 tbsp butter & 1 tbsp olive oil",
            "1 lemon, sliced and juiced",
            "2 cloves garlic, crushed",
            "Fresh dill and parsley",
            "Sea salt and black pepper"
        ],
        "instructions": [
            "Pat salmon fillets dry with paper towels; season both sides with salt and pepper.",
            "Heat olive oil in a skillet over medium-high heat until shimmering.",
            "Place salmon skin-side down; press lightly with spatula. Cook undisturbed for 5 minutes until skin is crisp.",
            "Flip fillets, add asparagus, butter, crushed garlic, and lemon slices to the skillet.",
            "Baste the salmon continuously with foaming melted butter for 3 minutes until cooked medium.",
            "Garnish with fresh dill and serve immediately."
        ],
        "cuisine": "Continental",
        "meal_type": "Dinner",
        "cooking_time": 20,
        "servings": 2,
        "image_url": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Classic Caesar Salad with Garlic Croutons",
        "description": "Crisp romaine hearts tossed in creamy homemade Caesar dressing, shaved Parmesan cheese, and golden crunchy croutons.",
        "ingredients": [
            "2 heads romaine lettuce, washed and chopped",
            "1/2 cup grated Parmigiano-Reggiano",
            "1 1/2 cups cubed sourdough bread",
            "1/3 cup Caesar dressing",
            "2 tbsp olive oil",
            "1 clove garlic, minced",
            "Freshly ground black pepper"
        ],
        "instructions": [
            "Toss bread cubes with olive oil, garlic, and pinch of salt.",
            "Bake at 375°F (190°C) for 10-12 minutes until crunchy and golden brown.",
            "In a large wooden salad bowl, toss chopped romaine with Caesar dressing until evenly coated.",
            "Add half of the shaved parmesan and half of the warm croutons; toss gently.",
            "Top with remaining parmesan, croutons, and freshly cracked black pepper."
        ],
        "cuisine": "Continental",
        "meal_type": "Lunch",
        "cooking_time": 15,
        "servings": 3,
        "image_url": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Molten Chocolate Lava Cake",
        "description": "Decadent dark chocolate individual cakes with a warm, gooey, molten chocolate center.",
        "ingredients": [
            "100g high-quality dark chocolate (70%)",
            "1/2 cup unsalted butter",
            "2 large eggs & 2 egg yolks",
            "1/3 cup granulated sugar",
            "2 tbsp all-purpose flour",
            "Powdered sugar and vanilla ice cream for serving"
        ],
        "instructions": [
            "Preheat oven to 425°F (220°C). Grease 4 ramekins with butter and dust with cocoa powder.",
            "Melt dark chocolate and butter together in a heatproof bowl over simmering water; let cool slightly.",
            "In another bowl, whisk eggs, egg yolks, and sugar until pale and slightly thickened.",
            "Fold melted chocolate into egg mixture, then gently fold in flour until smooth.",
            "Divide batter into ramekins and bake for 12-13 minutes (edges should be firm, center soft).",
            "Invert onto dessert plates, dust with powdered sugar, and serve with vanilla ice cream."
        ],
        "cuisine": "Continental",
        "meal_type": "Dessert",
        "cooking_time": 20,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Crispy Garlic Parmesan Potato Wedges",
        "description": "Oven-roasted russet potato wedges seasoned with herbs, olive oil, and crispy toasted parmesan.",
        "ingredients": [
            "3 large Russet potatoes, cut into wedges",
            "3 tbsp olive oil",
            "1/2 cup grated parmesan cheese",
            "1 tsp garlic powder, smoked paprika, Italian herbs",
            "1/2 tsp sea salt and black pepper",
            "Ranch or sour cream for dipping"
        ],
        "instructions": [
            "Soak potato wedges in cold water for 20 minutes to remove starch; pat thoroughly dry.",
            "Toss wedges in a large bowl with olive oil, herbs, paprika, garlic powder, and half the parmesan.",
            "Arrange in a single layer on a parchment-lined baking sheet.",
            "Bake at 400°F (200°C) for 35 minutes, flipping halfway until crisp and deep golden.",
            "Sprinkle immediately with remaining parmesan and serve with dipping sauce."
        ],
        "cuisine": "Continental",
        "meal_type": "Snack",
        "cooking_time": 45,
        "servings": 4,
        "image_url": "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
    }
]


def seed_database():
    db = connect_db()
    existing_count = db.recipes.count_documents({})
    print(f"Current recipes count: {existing_count}")

    # Insert recipes with timestamp
    for r in SAMPLE_RECIPES:
        # Normalize instructions to step objects
        raw_inst = r["instructions"]
        if r["name"] == "Crispy Vegetable Samosas":
            step_instructions = [
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
        else:
            step_instructions = []
            for s_idx, s_item in enumerate(raw_inst, start=1):
                if isinstance(s_item, str):
                    step_instructions.append({
                        "step": s_idx,
                        "instruction": s_item,
                        "image_url": ""
                    })
                elif isinstance(s_item, dict):
                    step_instructions.append({
                        "step": s_item.get("step") or s_idx,
                        "instruction": s_item.get("instruction") or s_item.get("text") or "",
                        "image_url": s_item.get("image_url") or ""
                    })

        doc = {
            "name": r["name"],
            "description": r["description"],
            "ingredients": r["ingredients"],
            "instructions": step_instructions,
            "cuisine": r["cuisine"],
            "meal_type": r["meal_type"],
            "cooking_time": int(r["cooking_time"]),
            "servings": int(r.get("servings", 4)),
            "image_url": r["image_url"],
            "video_url": r.get("video_url") or "https://www.youtube.com/watch?v=0b73Zg7F0vE",
            "created_by": "chef_curator",
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }
        # Update or insert based on name
        db.recipes.update_one(
            {"name": r["name"]},
            {"$set": doc},
            upsert=True
        )

    new_count = db.recipes.count_documents({})
    print(f"Seeding completed successfully! Total recipes now in database: {new_count}")


if __name__ == "__main__":
    seed_database()
