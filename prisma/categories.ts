import type { PrismaClient } from "@prisma/client";

const categorys = [
  {
    "category": "Fiction",
    "subcategories": [
      "Literary Fiction",
      "Science Fiction",
      "Mystery/Thriller",
      "Fantasy"
    ]
  },
  {
    "category": "Biography",
    "subcategories": [
      "Autobiography",
      "Celebrity Biography",
      "Historical Biography"
    ]
  },
  {
    "category": "History",
    "subcategories": [
      "Historical Books",
      "Historical Novels"
    ]
  },
  {
    "category": "Philosophy",
    "subcategories": [
      "Philosophical Works",
      "Philosophy Stories"
    ]
  },
  {
    "category": "Science",
    "subcategories": [
      "Natural Sciences",
      "Social Sciences"
    ]
  },
  {
    "category": "Art",
    "subcategories": [
      "Art Theory",
      "Design and Aesthetics"
    ]
  },
  {
    "category": "BusinessAndEconomics",
    "subcategories": [
      "Management",
      "Economics"
    ]
  },
  {
    "category": "Psychology",
    "subcategories": [
      "Psychological Research",
      "Self-Improvement"
    ]
  },
  {
    "category": "Education",
    "subcategories": [
      "Teaching Methods and Theories",
      "Parenting and Education"
    ]
  },
  {
    "category": "Travel",
    "subcategories": [
      "Travel Diaries",
      "Travel Guides"
    ]
  }
]

const seedCategorys = async (prisma: PrismaClient) => {
  const start = Date.now();
  console.log("Seeding categorys...");

  const $categorys = await prisma.category.createMany({
    data: categorys.map((item) => ({
      name: item.category.toLocaleUpperCase(),
      description: item.subcategories.join(",")
    }))
  });

  const end = Date.now();
  console.log(`Seeding ${$categorys.count} categorys completed in ${end - start}ms`);

  return $categorys;
};

export default seedCategorys;