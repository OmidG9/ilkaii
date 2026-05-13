export type SampleProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  salePrice?: number;
  currency: "USD";
  category: "Shoes" | "Clothing";
  stockCondition: string;
  heroImage: string;
  gallery: string[];
  sizes: string[];
  material: string;
};

export const sampleProducts: SampleProduct[] = [
  {
    id: "prod-001",
    slug: "monogram-platform-sneaker",
    name: "کتانی پلتفرم مونگرام",
    description:
      "کتانی پلتفرم با چرم ایتالیایی درجه یک، جزئیات پولیش و طرح مونگرام کلاسیک.",
    shortDescription: "کتانی معماری‌شده با راحتی لوکس.",
    basePrice: 495,
    salePrice: 445,
    currency: "USD",
    category: "کفش",
    stockCondition: "درجه A",
    heroImage:
      "https://images.unsplash.com/photo-1528701800489-20ea7087a7a5?auto=format&fit=crop&w=1200&q=80&fm=webp",
    gallery: [
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1579370318447-00f5339f66da?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1519741491413-7f31834be90e?auto=format&fit=crop&w=1200&q=80&fm=webp",
    ],
    sizes: ["36", "37", "38", "39", "40"],
    material: "Italian leather",
  },
  {
    id: "prod-002",
    slug: "heritage-silk-shirt",
    name: "پیراهن ابریشمی ارثی",
    description:
      "پیراهن ابریشمی راحت با طرح ژاکارد ملایم و دکمه‌های مرواریدی سفارشی.",
    shortDescription: "پیراهن ابریشمی با دوخت دقیق بوتیک.",
    basePrice: 385,
    salePrice: 335,
    currency: "USD",
    category: "لباس",
    stockCondition: "درجه A",
    heroImage:
      "https://images.unsplash.com/photo-1520962916525-4bb09d2deca7?auto=format&fit=crop&w=1200&q=80&fm=webp",
    gallery: [
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80&fm=webp",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    material: "100% Silk",
  },
  {
    id: "prod-003",
    slug: "velvet-evening-dress",
    name: "پیراهن شب مخمل",
    description: "پیراهن شب مخمل با طراحی نرم و دوخت برجسته برای شب‌های رسمی.",
    shortDescription: "پیراهن مخملی با سیلوئت مجلسی.",
    basePrice: 725,
    currency: "USD",
    category: "لباس",
    stockCondition: "درجه A",
    heroImage:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80&fm=webp",
    gallery: [
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1525382455947-f319bc05f2f9?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1200&q=80&fm=webp",
    ],
    sizes: ["S", "M", "L"],
    material: "Silk-velvet blend",
  },
  {
    id: "prod-004",
    slug: "cashmere-logo-knit-sweater",
    name: "ژاکت کشمیری با لوگوی دوخته",
    description:
      "ژاکت کشمیری لوکس با لوگوی دوخته شده و شانه‌های نرم برای پایان‌بندی ظریف.",
    shortDescription: "بافت کشمیری ممتاز با برند ظریف.",
    basePrice: 295,
    salePrice: 265,
    currency: "USD",
    category: "لباس",
    stockCondition: "درجه A",
    heroImage:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80&fm=webp",
    gallery: [
      "https://images.unsplash.com/photo-1495121605193-b116b5b9c5d5?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d0d5?auto=format&fit=crop&w=1200&q=80&fm=webp",
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80&fm=webp",
    ],
    sizes: ["XS", "S", "M", "L"],
    material: "100% Cashmere",
  },
];

export const sampleCategories = [
  { id: "cat-shoes", name: "کفش" },
  { id: "cat-clothing", name: "لباس" },
];
