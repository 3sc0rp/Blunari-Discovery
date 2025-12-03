// Local dummy data for Blunari – Atlanta Dining Guide
// 18 restaurants across neighborhoods/cuisines

export const restaurants = [
  {
    slug: "lazy-betta-fish-house",
    name: "Lazy Betta Fish House",
    neighborhood: "Inman Park",
    cuisines: ["Seafood", "Southern"],
    price: "$$$",
    tags: ["Romantic", "Oysters", "Fine dining"],
    score: 96,
    tagline: "Southern seafood with a modern edge.",
    description:
      "A refined seafood spot highlighting Gulf and Atlantic catches with Southern produce and a serious raw bar.",
    address: "299 N Highland Ave NE, Atlanta, GA",
    website: "https://example.com/lazybetta",
    phone: "+1-404-555-0134",
    images: [
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Raw bar", "Seasonal menu", "Natural wine"],
    picks: [
      { name: "Chargrilled Oysters", description: "Herb butter, lemon." },
      { name: "Low Country Bouillabaisse", description: "Carolina gold rice." },
      { name: "Key Lime Tart", description: "Toasted meringue." },
    ],
    menu: [
      {
        title: "Raw & Cold",
        items: [
          {
            name: "Oysters on the Half Shell",
            price: "$4 ea",
            description: "Mignonette, lemon.",
          },
          {
            name: "Tuna Crudo",
            price: "$18",
            description: "Citrus, chili, sesame.",
          },
        ],
      },
      {
        title: "Mains",
        items: [
          {
            name: "Seared Snapper",
            price: "$34",
            description: "Farro, fennel, lemon butter.",
          },
          {
            name: "Shrimp & Grits",
            price: "$29",
            description: "Anson Mills grits, scallion.",
          },
        ],
      },
    ],
    similar: ["langford-chophouse", "nori-umi-sushi", "the-porch-brunch"],
  },
  {
    slug: "langford-chophouse",
    name: "Langford Chophouse",
    neighborhood: "Buckhead",
    cuisines: ["Steak", "American"],
    price: "$$$$",
    tags: ["Special occasion", "Wine list", "Fine dining"],
    score: 94,
    tagline: "Classic steakhouse, modern technique.",
    description:
      "A polished chophouse featuring prime beef, tableside moments, and a cellar focused on bold reds.",
    address: "3209 Peachtree Rd NE, Atlanta, GA",
    website: "https://example.com/langford",
    phone: "+1-404-555-0135",
    images: [
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Prime cuts", "Tableside cart", "Private dining"],
    picks: [
      { name: "Bone-In Ribeye", description: "Dry-aged, 22oz." },
      { name: "Steak Tartare", description: "Hand-cut, quail egg." },
    ],
    menu: [
      {
        title: "Steaks",
        items: [
          {
            name: "Filet Mignon",
            price: "$55",
            description: "8oz center-cut.",
          },
          {
            name: "Bone-In Ribeye",
            price: "$76",
            description: "Dry-aged, 22oz.",
          },
        ],
      },
    ],
    similar: ["lazy-betta-fish-house", "the-porch-brunch", "verde-taqueria"],
  },
  {
    slug: "nori-umi-sushi",
    name: "Nori Umi Sushi",
    neighborhood: "Midtown",
    cuisines: ["Sushi", "Japanese"],
    price: "$$$",
    tags: ["Omakase", "Sake", "Date night"],
    score: 95,
    tagline: "Precision sushi and seafood-led plates.",
    description:
      "Contemporary Japanese with an intimate sushi counter, pristine nigiri, and a sharp sake program.",
    address: "14th St NE, Atlanta, GA",
    website: "https://example.com/noriumi",
    phone: "+1-404-555-0136",
    images: [
      "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Omakase", "Seasonal fish", "Minimalist"],
    picks: [
      { name: "Bluefin Otoro Nigiri", description: "Fresh wasabi." },
      { name: "Uni Toast", description: "Shiso, yuzu kosho." },
    ],
    menu: [
      {
        title: "Nigiri",
        items: [
          { name: "Otoro", price: "$12", description: "Fatty tuna." },
          { name: "Hotate", price: "$8", description: "Scallop." },
        ],
      },
    ],
    similar: ["mizu-ramen-bar", "sora-izakaya", "lazy-betta-fish-house"],
  },
  {
    slug: "the-porch-brunch",
    name: "The Porch Brunch Club",
    neighborhood: "Old Fourth Ward",
    cuisines: ["Brunch", "American"],
    price: "$$",
    tags: ["Brunch", "Patio", "Mimosas"],
    score: 90,
    tagline: "All-day brunch hits with a Southern twist.",
    description:
      "Buzzy brunch plates, tall stacks, and a sunny patio that brings the weekend vibe any day.",
    address: "Edgewood Ave, Atlanta, GA",
    website: "https://example.com/porch",
    phone: "+1-404-555-0137",
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Patio", "Great coffee", "All-day brunch"],
    picks: [
      { name: "Fried Chicken & Waffles", description: "Hot honey." },
      { name: "Crab Cake Benedict", description: "Old Bay hollandaise." },
    ],
    menu: [
      {
        title: "Plates",
        items: [
          {
            name: "Chicken & Waffles",
            price: "$19",
            description: "Hot honey, chives.",
          },
          {
            name: "Avocado Toast",
            price: "$14",
            description: "Poached egg, chili flakes.",
          },
        ],
      },
    ],
    similar: [
      "daily-grind-coffee",
      "sweet-ember-dessert",
      "langford-chophouse",
    ],
  },
  {
    slug: "mizu-ramen-bar",
    name: "Mizu Ramen Bar",
    neighborhood: "West Midtown",
    cuisines: ["Ramen", "Japanese"],
    price: "$$",
    tags: ["Casual", "Late night"],
    score: 88,
    tagline: "Rich broths, springy noodles, cozy counter.",
    description:
      "A neighborhood ramen bar simmering tonkotsu 18 hours and slinging crisp karaage until late.",
    address: "Howell Mill Rd, Atlanta, GA",
    website: "https://example.com/mizu",
    phone: "+1-404-555-0138",
    images: [
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1526318472351-c75fcf070305?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["House noodles", "Spicy miso", "Late hours"],
    picks: [
      { name: "Spicy Miso Ramen", description: "Chili oil, scallion." },
      { name: "Karaage", description: "Crispy chicken, yuzu mayo." },
    ],
    menu: [
      {
        title: "Ramen",
        items: [
          {
            name: "Tonkotsu",
            price: "$15",
            description: "Pork broth, chashu, egg.",
          },
          {
            name: "Spicy Miso",
            price: "$16",
            description: "Chili oil, corn, scallion.",
          },
        ],
      },
    ],
    similar: ["nori-umi-sushi", "sora-izakaya", "bao-bungalow"],
  },
  {
    slug: "sora-izakaya",
    name: "Sora Izakaya",
    neighborhood: "Midtown",
    cuisines: ["Japanese", "Izakaya"],
    price: "$$$",
    tags: ["Skewers", "Sake", "Late night"],
    score: 89,
    tagline: "Charcoal skewers and small plates to share.",
    description:
      "An izakaya fueled by binchotan, pouring crisp lagers and sakes to match the smoky skewers.",
    address: "Juniper St NE, Atlanta, GA",
    website: "https://example.com/sora",
    phone: "+1-404-555-0139",
    images: [
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Yakitori", "Skewers", "Casual"],
    picks: [
      { name: "Tsukune", description: "Chicken meatball, tare." },
      { name: "Shishito Peppers", description: "Toasted sesame." },
    ],
    menu: [
      {
        title: "Grill",
        items: [
          { name: "Chicken Thigh", price: "$6", description: "Tare glaze." },
          { name: "Pork Belly", price: "$7", description: "Shichimi." },
        ],
      },
    ],
    similar: ["mizu-ramen-bar", "nori-umi-sushi", "bao-bungalow"],
  },
  {
    slug: "verde-taqueria",
    name: "Verde Taqueria",
    neighborhood: "East Atlanta Village",
    cuisines: ["Mexican", "Tacos"],
    price: "$$",
    tags: ["Margaritas", "Patio", "Casual"],
    score: 87,
    tagline: "Vibrant tacos, fresh salsas, sunny vibes.",
    description:
      "Neighborhood taqueria serving street-style tacos, crisp tostadas, and tart margaritas.",
    address: "Flat Shoals Ave SE, Atlanta, GA",
    website: "https://example.com/verde",
    phone: "+1-404-555-0140",
    images: [
      "https://images.unsplash.com/photo-1541542684-4a29c4a6c20b?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1601924582971-b0c5be133c81?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Handmade tortillas", "Salsas", "Patio"],
    picks: [
      { name: "Al Pastor Taco", description: "Pineapple, cilantro." },
      { name: "Baja Fish Taco", description: "Cabbage, crema." },
    ],
    menu: [
      {
        title: "Tacos",
        items: [
          {
            name: "Al Pastor",
            price: "$4.5",
            description: "Pineapple, onion, cilantro.",
          },
          {
            name: "Fish Baja",
            price: "$5",
            description: "Beer batter, crema.",
          },
        ],
      },
    ],
    similar: ["bao-bungalow", "daily-grind-coffee", "sora-izakaya"],
  },
  {
    slug: "daily-grind-coffee",
    name: "Daily Grind Coffee",
    neighborhood: "Poncey-Highland",
    cuisines: ["Coffee", "Pastry"],
    price: "$$",
    tags: ["Coffee", "Work-friendly"],
    score: 84,
    tagline: "Small-batch roasts and laminated pastries.",
    description:
      "Buzzy cafe roasting in-house, pouring dialed-in espresso and turning out flaky croissants.",
    address: "N Highland Ave NE, Atlanta, GA",
    website: "https://example.com/dailygrind",
    phone: "+1-404-555-0141",
    images: [
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["House roasts", "Great Wi‑Fi", "Sunny patio"],
    picks: [
      { name: "Cortado", description: "Balanced, silky." },
      { name: "Ham & Gruyère Croissant", description: "Flaky, buttery." },
    ],
    menu: [
      {
        title: "Coffee",
        items: [
          { name: "Espresso", price: "$3.5", description: "Double shot." },
          { name: "Cappuccino", price: "$4.5", description: "Classic 6oz." },
        ],
      },
    ],
    similar: ["sweet-ember-dessert", "the-porch-brunch", "verde-taqueria"],
  },
  {
    slug: "sweet-ember-dessert",
    name: "Sweet Ember Dessert Lab",
    neighborhood: "Midtown",
    cuisines: ["Dessert"],
    price: "$$",
    tags: ["Dessert", "Date night"],
    score: 89,
    tagline: "Plated sweets and playful textures.",
    description:
      "A pastry chef–driven dessert bar pairing composed plates with low-ABV cocktails.",
    address: "Peachtree St NE, Atlanta, GA",
    website: "https://example.com/sweetember",
    phone: "+1-404-555-0142",
    images: [
      "https://images.unsplash.com/photo-1461009209128-88bd3a7ad785?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Seasonal tasting", "Low-ABV", "Artful plating"],
    picks: [
      { name: "Dark Chocolate Cremux", description: "Cassis, sable." },
      { name: "Georgia Peach Pavlova", description: "Basil, meringue." },
    ],
    menu: [
      {
        title: "Desserts",
        items: [
          {
            name: "Pavlova",
            price: "$12",
            description: "Meringue, cream, fruit.",
          },
          {
            name: "Cremux",
            price: "$14",
            description: "Dark chocolate, cassis.",
          },
        ],
      },
    ],
    similar: ["daily-grind-coffee", "the-porch-brunch", "nori-umi-sushi"],
  },
  {
    slug: "bao-bungalow",
    name: "Bao Bungalow",
    neighborhood: "Decatur",
    cuisines: ["Taiwanese", "Street Food"],
    price: "$$",
    tags: ["Casual", "Family"],
    score: 86,
    tagline: "Steamed buns, crispy chicken, bright pickles.",
    description:
      "Taiwanese comfort plates and fluffy bao sandos, plus bubble tea to go.",
    address: "College Ave, Decatur, GA",
    website: "https://example.com/bao",
    phone: "+1-404-555-0143",
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543339494-b4cd9bde4075?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Crispy chicken", "Pickles", "Milk tea"],
    picks: [
      { name: "Gua Bao", description: "Braised pork, peanuts." },
      { name: "Spicy Fried Chicken Bao", description: "Pickles, aioli." },
    ],
    menu: [
      {
        title: "Bao",
        items: [
          {
            name: "Pork Belly Bao",
            price: "$8",
            description: "Soy braise, cilantro.",
          },
          {
            name: "Fried Chicken Bao",
            price: "$8",
            description: "Spicy glaze, pickles.",
          },
        ],
      },
    ],
    similar: ["verde-taqueria", "mizu-ramen-bar", "sora-izakaya"],
  },
  {
    slug: "rooftop-atl",
    name: "Rooftop ATL",
    neighborhood: "Downtown",
    cuisines: ["American", "Cocktails"],
    price: "$$$",
    tags: ["Rooftop", "Skyline", "Date night"],
    score: 91,
    tagline: "Sky-high views, share plates, crafted drinks.",
    description:
      "Panoramic rooftop lounge with small plates designed for sharing and a tight cocktail list.",
    address: "Marietta St NW, Atlanta, GA",
    website: "https://example.com/rooftop",
    phone: "+1-404-555-0144",
    images: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["City views", "Craft cocktails", "DJ nights"],
    picks: [
      { name: "Crispy Cauliflower", description: "Chili honey." },
      { name: "Lamb Lollipops", description: "Mint yogurt." },
    ],
    menu: [
      {
        title: "Share Plates",
        items: [
          {
            name: "Cauliflower",
            price: "$14",
            description: "Chili honey, sesame.",
          },
          { name: "Lamb Lollipops", price: "$21", description: "Mint yogurt." },
        ],
      },
    ],
    similar: [
      "langford-chophouse",
      "sweet-ember-dessert",
      "lazy-betta-fish-house",
    ],
  },
  {
    slug: "green-sprout-vegan",
    name: "Green Sprout Vegan",
    neighborhood: "Virginia-Highland",
    cuisines: ["Vegan", "Plant-Based"],
    price: "$$",
    tags: ["Vegan", "Healthy"],
    score: 85,
    tagline: "Bright, veg-forward plates that satisfy.",
    description:
      "A plant-based kitchen built around Georgia produce and bold sauces.",
    address: "Virginia Ave NE, Atlanta, GA",
    website: "https://example.com/greensprout",
    phone: "+1-404-555-0145",
    images: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1458642849426-cfb724f15ef7?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Seasonal veg", "Gluten-free options", "Juice bar"],
    picks: [
      { name: "Roasted Carrot Harissa", description: "Almond dukkah." },
      { name: "Golden Beet Risotto", description: "Vegan parmesan." },
    ],
    menu: [
      {
        title: "Plates",
        items: [
          {
            name: "Carrot Harissa",
            price: "$16",
            description: "Almond dukkah, herbs.",
          },
          {
            name: "Beet Risotto",
            price: "$18",
            description: "Citrus, vegan parm.",
          },
        ],
      },
    ],
    similar: ["halal-garden", "daily-grind-coffee", "sweet-ember-dessert"],
  },
  {
    slug: "halal-garden",
    name: "Halal Garden",
    neighborhood: "Chamblee",
    cuisines: ["Halal", "Middle Eastern"],
    price: "$$",
    tags: ["Halal", "Family"],
    score: 86,
    tagline: "Charcoal kebabs, pillowy pita, bright salads.",
    description:
      "Casual halal kitchen with charcoal-grilled meats and fresh mezze.",
    address: "Peachtree Blvd, Chamblee, GA",
    website: "https://example.com/halalgarden",
    phone: "+1-404-555-0146",
    images: [
      "https://images.unsplash.com/photo-1617191518000-9f6f52ffb62e?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1592861956120-e524fc739696?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Charcoal grill", "Fresh pita", "Family-friendly"],
    picks: [
      { name: "Mixed Grill", description: "Chicken, lamb, koobideh." },
      { name: "Hummus & Lamb", description: "Warm spices, pine nuts." },
    ],
    menu: [
      {
        title: "Grill",
        items: [
          {
            name: "Chicken Kebab",
            price: "$16",
            description: "Charcoal grilled.",
          },
          { name: "Lamb Kebab", price: "$19", description: "Herbs, sumac." },
        ],
      },
    ],
    similar: ["green-sprout-vegan", "verde-taqueria", "langford-chophouse"],
  },
  {
    slug: "midnight-noodle",
    name: "Midnight Noodle",
    neighborhood: "Doraville",
    cuisines: ["Late Night", "Chinese"],
    price: "$$",
    tags: ["Late night", "Spicy"],
    score: 83,
    tagline: "Wok-fired noodles until 2am.",
    description:
      "Northern Chinese stir-fries, hand-pulled noodles, and chili-crisp everything, served late.",
    address: "Buford Hwy, Doraville, GA",
    website: "https://example.com/midnight",
    phone: "+1-404-555-0147",
    images: [
      "https://images.unsplash.com/photo-1506354666786-959d6d497f1a?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Late hours", "Spicy", "Hand-pulled"],
    picks: [
      { name: "Chongqing Noodles", description: "Peppercorn, chili oil." },
      { name: "Cumin Lamb Stir-Fry", description: "Wok hei." },
    ],
    menu: [
      {
        title: "Wok",
        items: [
          {
            name: "Chongqing Noodles",
            price: "$13",
            description: "Peppercorn, chili oil.",
          },
          { name: "Cumin Lamb", price: "$16", description: "Chili, celery." },
        ],
      },
    ],
    similar: ["mizu-ramen-bar", "sora-izakaya", "bao-bungalow"],
  },
  {
    slug: "peach-and-pine",
    name: "Peach & Pine",
    neighborhood: "Grant Park",
    cuisines: ["Southern", "American"],
    price: "$$$",
    tags: ["Date night", "Seasonal"],
    score: 92,
    tagline: "Georgia produce, wood-fired heart.",
    description:
      "Seasonally led Southern cooking with a wood-fired hearth and a thoughtful cellar.",
    address: "Cherokee Ave SE, Atlanta, GA",
    website: "https://example.com/peachpine",
    phone: "+1-404-555-0148",
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1546069901-eacef0df6022?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Wood-fired", "Seasonal", "Local farms"],
    picks: [
      { name: "Hearth-Roasted Chicken", description: "Lemon, jus." },
      { name: "Grilled Peach Salad", description: "Pecans, goat cheese." },
    ],
    menu: [
      {
        title: "Mains",
        items: [
          {
            name: "Roasted Chicken",
            price: "$29",
            description: "Pan jus, herbs.",
          },
          { name: "Seared Trout", price: "$31", description: "Beans, lemon." },
        ],
      },
    ],
    similar: ["lazy-betta-fish-house", "rooftop-atl", "green-sprout-vegan"],
  },
  {
    slug: "corteza-tapas",
    name: "Corteza Tapas",
    neighborhood: "Kirkwood",
    cuisines: ["Spanish", "Tapas"],
    price: "$$$",
    tags: ["Wine", "Share plates"],
    score: 90,
    tagline: "Andalusian flavors, Atlanta energy.",
    description:
      "A tapas bar spinning classics with Georgia produce and Iberian wines.",
    address: "Hosea Williams Dr NE, Atlanta, GA",
    website: "https://example.com/corteza",
    phone: "+1-404-555-0149",
    images: [
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1555992336-03a23c42939b?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Paella", "Iberian wines", "Patatas bravas"],
    picks: [
      { name: "Gambas al Ajillo", description: "Garlic shrimp." },
      { name: "Patatas Bravas", description: "Aioli, brava sauce." },
    ],
    menu: [
      {
        title: "Tapas",
        items: [
          { name: "Croquetas", price: "$11", description: "Jamon, béchamel." },
          { name: "Gambas", price: "$15", description: "Garlic, chili." },
        ],
      },
    ],
    similar: ["rooftop-atl", "verde-taqueria", "peach-and-pine"],
  },
  {
    slug: "northside-roasters",
    name: "Northside Roasters",
    neighborhood: "Sandy Springs",
    cuisines: ["Coffee", "Bakery"],
    price: "$$",
    tags: ["Coffee", "Work-friendly"],
    score: 82,
    tagline: "Nordic-inspired coffee and bakes.",
    description:
      "Light-roast focused cafe with airy pastries and clean, minimalist vibes.",
    address: "Roswell Rd, Sandy Springs, GA",
    website: "https://example.com/northside",
    phone: "+1-404-555-0150",
    images: [
      "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517705008128-361805f42e86?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Light roasts", "Minimalist", "Pastries"],
    picks: [
      { name: "Flat White", description: "Silky microfoam." },
      { name: "Cardamom Bun", description: "Soft, fragrant." },
    ],
    menu: [
      {
        title: "Coffee",
        items: [
          { name: "Flat White", price: "$4.75", description: "Double shot." },
          { name: "Pour Over", price: "$5", description: "Single origin." },
        ],
      },
    ],
    similar: ["daily-grind-coffee", "sweet-ember-dessert", "the-porch-brunch"],
  },
  {
    slug: "oak-ridge-bbq",
    name: "Oak Ridge BBQ",
    neighborhood: "East Point",
    cuisines: ["BBQ", "Southern"],
    price: "$$",
    tags: ["Family", "Casual"],
    score: 85,
    tagline: "Slow-smoked Georgia barbecue, no shortcuts.",
    description:
      "Offset smoker running oak and pecan, house pickles, and classic sides done right.",
    address: "Main St, East Point, GA",
    website: "https://example.com/oakridge",
    phone: "+1-404-555-0151",
    images: [
      "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Brisket", "Ribs", "House pickles"],
    picks: [
      { name: "Brisket Plate", description: "Moist cut, pepper bark." },
      { name: "Pork Ribs", description: "Cherry glaze." },
    ],
    menu: [
      {
        title: "Plates",
        items: [
          { name: "Brisket", price: "$19", description: "1/2 lb, two sides." },
          { name: "Ribs", price: "$21", description: "Half rack, two sides." },
        ],
      },
    ],
    similar: ["peach-and-pine", "lazy-betta-fish-house", "verde-taqueria"],
  },
  {
    slug: "high-note-korean",
    name: "High Note Korean",
    neighborhood: "Duluth",
    cuisines: ["Korean"],
    price: "$$$",
    tags: ["BBQ", "Share plates"],
    score: 90,
    tagline: "Tabletop BBQ and punchy banchan.",
    description:
      "Premium meats, proper banchan, and a menu that jumps between classics and street food faves.",
    address: "Pleasant Hill Rd, Duluth, GA",
    website: "https://example.com/highnote",
    phone: "+1-404-555-0152",
    images: [
      "https://images.unsplash.com/photo-1604908176997-43162d71c8f1?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589307004173-3c95204acc6c?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Tabletop grill", "Soju", "Banchan"],
    picks: [
      { name: "Prime Short Rib", description: "Marinated, thin-sliced." },
      { name: "Kimchi Pancake", description: "Crispy edges." },
    ],
    menu: [
      {
        title: "BBQ",
        items: [
          { name: "Short Rib", price: "$32", description: "Marinated." },
          { name: "Pork Belly", price: "$24", description: "Thick cut." },
        ],
      },
    ],
    similar: ["mizu-ramen-bar", "sora-izakaya", "midnight-noodle"],
  },
  {
    slug: "copper-leaf-indian",
    name: "Copper Leaf Indian Kitchen",
    neighborhood: "Smyrna",
    cuisines: ["Indian"],
    price: "$$$",
    tags: ["Family", "Vegetarian friendly"],
    score: 88,
    tagline: "Regional Indian, tandoor glow.",
    description:
      "Cozy dining room with a clay oven at its heart, focusing on North Indian signatures and chaat.",
    address: "Cumberland Blvd, Smyrna, GA",
    website: "https://example.com/copperleaf",
    phone: "+1-404-555-0153",
    images: [
      "https://images.unsplash.com/photo-1625945751795-1f5c2d37848c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1625945751430-73f57f5759c7?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Tandoor", "Regional curries", "Chaat"],
    picks: [
      { name: "Chicken Tikka", description: "Smoky, tender." },
      { name: "Gol Gappa", description: "Tangy, crunchy." },
    ],
    menu: [
      {
        title: "Signatures",
        items: [
          {
            name: "Chicken Tikka Masala",
            price: "$19",
            description: "Tomato cream sauce.",
          },
          {
            name: "Paneer Tikka",
            price: "$18",
            description: "Tandoor, peppers.",
          },
        ],
      },
    ],
    similar: ["halal-garden", "green-sprout-vegan", "midnight-noodle"],
  },
  {
    slug: "blue-heron-oyster",
    name: "Blue Heron Oyster & Ale",
    neighborhood: "Westside",
    cuisines: ["Seafood", "Pub"],
    price: "$$$",
    tags: ["Oysters", "Casual"],
    score: 87,
    tagline: "Pub energy, serious shellfish.",
    description:
      "A lively pub with a raw bar program and coastal plates built for beer.",
    address: "Howell Mill Rd, Atlanta, GA",
    website: "https://example.com/blueheron",
    phone: "+1-404-555-0154",
    images: [
      "https://images.unsplash.com/photo-1533777324565-a040eb52fac1?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1514512364185-4c2b1b17372c?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Raw bar", "Craft beer", "Fried seafood"],
    picks: [
      { name: "Fried Oyster Roll", description: "Spicy remoulade." },
      { name: "Clam Chowder", description: "Bacon, thyme." },
    ],
    menu: [
      {
        title: "Plates",
        items: [
          { name: "Fish & Chips", price: "$18", description: "Malt vinegar." },
          { name: "Lobster Roll", price: "$26", description: "Toasted bun." },
        ],
      },
    ],
    similar: ["lazy-betta-fish-house", "rooftop-atl", "oak-ridge-bbq"],
  },
  {
    slug: "ember-pizza",
    name: "Ember Stone Pizza",
    neighborhood: "Cabbagetown",
    cuisines: ["Pizza", "Italian"],
    price: "$$",
    tags: ["Family", "Casual"],
    score: 86,
    tagline: "Neo-Neapolitan pies, blistered and bubbly.",
    description:
      "Naturally leavened dough, local toppings, and a wood-fired oven front and center.",
    address: "Carroll St SE, Atlanta, GA",
    website: "https://example.com/ember",
    phone: "+1-404-555-0155",
    images: [
      "https://images.unsplash.com/photo-1541745537413-b804ba1c2819?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1548365328-9f547fb095c2?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Wood-fired", "Naturally leavened", "Local"],
    picks: [
      { name: "Margherita", description: "Mozzarella, basil." },
      { name: "Spicy Soppressata", description: "Hot honey." },
    ],
    menu: [
      {
        title: "Pizzas",
        items: [
          { name: "Margherita", price: "$15", description: "Classic." },
          {
            name: "Soppressata",
            price: "$18",
            description: "Hot honey, basil.",
          },
        ],
      },
    ],
    similar: ["corteza-tapas", "oak-ridge-bbq", "peach-and-pine"],
  },
  {
    slug: "silver-spoon-diner",
    name: "Silver Spoon Diner",
    neighborhood: "Brookhaven",
    cuisines: ["Diner", "American"],
    price: "$",
    tags: ["Casual", "Family"],
    score: 80,
    tagline: "All-day breakfast and late-night comfort.",
    description:
      "A retro diner with bottomless coffee, patty melts, and that slice of pie you needed.",
    address: "Peachtree Rd NE, Brookhaven, GA",
    website: "https://example.com/silverspoon",
    phone: "+1-404-555-0156",
    images: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1528372444006-1bfc81acab02?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["24 hours", "Bottomless coffee", "Pie"],
    picks: [
      { name: "Patty Melt", description: "Griddled onions." },
      { name: "Banana Cream Pie", description: "Whipped cream." },
    ],
    menu: [
      {
        title: "Classics",
        items: [
          {
            name: "Patty Melt",
            price: "$12",
            description: "Rye, onions, swiss.",
          },
          { name: "Pancake Stack", price: "$10", description: "Maple syrup." },
        ],
      },
    ],
    similar: ["the-porch-brunch", "daily-grind-coffee", "oak-ridge-bbq"],
  },
  {
    slug: "riverbend-seafood",
    name: "Riverbend Seafood Shed",
    neighborhood: "Suwanee",
    cuisines: ["Seafood", "Cajun"],
    price: "$$",
    tags: ["Family", "Casual"],
    score: 84,
    tagline: "Boils, baskets, and hushpuppies.",
    description:
      "Low-country boils and fried baskets served with tangy slaw and hot sauce.",
    address: "Lawrenceville-Suwanee Rd, Suwanee, GA",
    website: "https://example.com/riverbend",
    phone: "+1-404-555-0157",
    images: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1600&auto=format&fit=crop",
    ],
    highlights: ["Seafood boils", "Fried baskets", "Casual"],
    picks: [
      { name: "Shrimp Boil", description: "Corn, potato, sausage." },
      { name: "Catfish Basket", description: "Tartar, lemons." },
    ],
    menu: [
      {
        title: "Boils",
        items: [
          { name: "Shrimp", price: "$22", description: "Corn, potato." },
          { name: "Snow Crab", price: "$34", description: "Garlic butter." },
        ],
      },
    ],
    similar: ["blue-heron-oyster", "oak-ridge-bbq", "lazy-betta-fish-house"],
  },
];

export function findRestaurant(slug) {
  return restaurants.find((r) => r.slug === slug);
}
