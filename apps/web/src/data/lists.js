import { restaurants } from "./restaurants";

// Helper to ensure slugs exist
const has = (slug) => restaurants.some((r) => r.slug === slug);

export const lists = [
  {
    slug: "blunari-picks",
    title: "Blunari Picks",
    description: "Our editor's favorite restaurants across the city right now.",
    items: [
      {
        slug: "lazy-betta-fish-house",
        note: "Pristine seafood and a stellar raw bar.",
      },
      {
        slug: "peach-and-pine",
        note: "Seasonal Southern with a wood-fired heartbeat.",
      },
      { slug: "nori-umi-sushi", note: "Minimalist sushi, max flavor." },
      { slug: "langford-chophouse", note: "Classic steak with modern polish." },
      { slug: "rooftop-atl", note: "Views and plates that deliver." },
    ].filter((i) => has(i.slug)),
  },
  {
    slug: "best-brunch",
    title: "Best Brunch in Atlanta",
    description: "Sunny patios, stacks, and benedicts.",
    items: [
      { slug: "the-porch-brunch", note: "All-day brunch hits." },
      { slug: "silver-spoon-diner", note: "Retro charm, breakfast all day." },
      { slug: "daily-grind-coffee", note: "Coffee first, then pastries." },
    ].filter((i) => has(i.slug)),
  },
  {
    slug: "date-night",
    title: "Date Night Spots",
    description: "Dim lights, great wine, memorable plates.",
    items: [
      {
        slug: "lazy-betta-fish-house",
        note: "Perfect for oysters and champagne.",
      },
      {
        slug: "sweet-ember-dessert",
        note: "End the night with plated desserts.",
      },
      { slug: "peach-and-pine", note: "Cozy and seasonal." },
    ].filter((i) => has(i.slug)),
  },
  {
    slug: "sushi-and-japanese",
    title: "Sushi & Japanese",
    description: "From omakase to late-night ramen.",
    items: [
      { slug: "nori-umi-sushi", note: "Top-tier nigiri." },
      { slug: "mizu-ramen-bar", note: "Spicy miso, late hours." },
      { slug: "sora-izakaya", note: "Charcoal skewers and sake." },
    ].filter((i) => has(i.slug)),
  },
  {
    slug: "best-tacos",
    title: "Best Tacos",
    description: "Salsas, tortillas, and crispy seafood.",
    items: [
      { slug: "verde-taqueria", note: "Vibrant salsas, killer pastor." },
      { slug: "bao-bungalow", note: "Not tacos, but bao you'll crave." },
      { slug: "blue-heron-oyster", note: "Fried seafood rolls for the win." },
    ].filter((i) => has(i.slug)),
  },
  {
    slug: "vegan-and-halal",
    title: "Vegan & Halal",
    description: "Bright veg plates and charcoal kebabs.",
    items: [
      { slug: "green-sprout-vegan", note: "Veg-forward plates that pop." },
      { slug: "halal-garden", note: "Grilled meats and fresh pita." },
    ].filter((i) => has(i.slug)),
  },
];

export function findList(slug) {
  return lists.find((l) => l.slug === slug) || null;
}
