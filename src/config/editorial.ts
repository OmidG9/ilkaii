/**
 * Editorial content for the storefront.
 *
 * This is intentionally code-owned (rather than DB-owned) so the design-heavy
 * pages always have a complete, well-written skeleton even before the CMS is
 * populated. Products and categories themselves are still loaded from the
 * database and are the only dynamic parts of these pages.
 */

export interface CollectionTheme {
  from: string;
  to: string;
  accent: string;
  /** Used to decide whether text on the gradient should be light or dark. */
  ink: "light" | "dark";
}

export interface EditorialCollection {
  slug: string;
  categorySlug: string;
  index: string;
  title: string;
  englishTitle: string;
  subtitle: string;
  description: string;
  season: string;
  quote: string;
  features: string[];
  theme: CollectionTheme;
}

export const collections: EditorialCollection[] = [
  {
    slug: "quiet-luxury",
    categorySlug: "dresses",
    index: "۰۱",
    title: "خلوتِ لوکس",
    englishTitle: "Quiet Luxury",
    subtitle: "پیراهن‌هایی که به‌جای بلندی صدا، با جزئیات حرف می‌زنند.",
    description:
      "خطوط ساده، پارچه‌های نرم و برش‌هایی که سال‌ها همراه شما می‌مانند. این مجموعه برای لحظه‌هایی است که نمی‌خواهید دیده شوید؛ می‌خواهید به یاد بمانید.",
    season: "پاییز / زمستان ۱۴۰۴",
    quote: "لوکس بودن، صدای بلند ندارد.",
    features: ["پارچه‌های طبیعی", "برش‌های مینیمال", "تولید محدود"],
    theme: { from: "#E9DFD2", to: "#B9A38F", accent: "#5B4737", ink: "dark" },
  },
  {
    slug: "street-edit",
    categorySlug: "hoodies",
    index: "۰۲",
    title: "خیابان، نسخهٔ ما",
    englishTitle: "Street Edit",
    subtitle: "هودی و سویشرت‌هایی برای روزهایی که راحتی، بخشی از استایل است.",
    description:
      "آستین‌های افتاده، شانه‌های آزاد و رنگ‌های خاکی؛ مجموعه‌ای که از فرهنگ خیابان می‌آید اما با دقت یک برند آرام بازخوانی می‌شود.",
    season: "مجموعهٔ همیشگی",
    quote: "راحتی، وقتی خوب طراحی شود، شیک است.",
    features: ["پارچهٔ ضخیم پنبه", "فرم اورسایز", "رنگ‌های خاکی"],
    theme: { from: "#B7B0A6", to: "#4A453F", accent: "#2A2724", ink: "light" },
  },
  {
    slug: "in-motion",
    categorySlug: "sportswear",
    index: "۰۳",
    title: "در حرکت",
    englishTitle: "In Motion",
    subtitle: "پوشاک ورزشی با حمایت واقعی، نه فقط ظاهر ورزشی.",
    description:
      "از استودیو تا خیابان؛ پارچه‌های کشسان، دوخت‌های تخت و جزئیاتی که هنگام حرکت احساس نمی‌شوند. ساخته‌شده برای بدن، نه برای عکس.",
    season: "کالکشن فصلی",
    quote: "بدن شما، مهم‌ترین مخاطب طراحی است.",
    features: ["پارچهٔ تنفس‌پذیر", "درزهای تخت", "کشسانی چهارطرفه"],
    theme: { from: "#C9CCBD", to: "#5D6454", accent: "#30372C", ink: "light" },
  },
  {
    slug: "the-layers",
    categorySlug: "outerwear",
    index: "۰۴",
    title: "لایه‌ها",
    englishTitle: "The Layers",
    subtitle: "کاپشن‌ها و رویه‌هایی که هوای سرد را به فرصت استایل تبدیل می‌کنند.",
    description:
      "لایه‌گذاری، بازی حجم و بافت است. این مجموعه با کت‌های سبک و ساختارمند، یک فصل کامل را ممکن می‌کند؛ از صبح‌های خنک تا شب‌های شهری.",
    season: "پاییز ۱۴۰۴",
    quote: "زمستان، بهانه‌ای برای لایه‌های بیشتر است.",
    features: ["بافت مقاوم", "جیب‌های کاربردی", "فرم ساختارمند"],
    theme: { from: "#D8C8B9", to: "#8A6F5C", accent: "#4A382C", ink: "dark" },
  },
  {
    slug: "denim-always",
    categorySlug: "pants",
    index: "۰۵",
    title: "جین، همیشه",
    englishTitle: "Denim Always",
    subtitle: "شلوارهایی که با شما فرم می‌گیرند و کهنه نمی‌شوند.",
    description:
      "جین، بی‌زمان‌ترین قطعهٔ کمد است. برش‌های آزاد و رنگ‌های عمیق این مجموعه طوری انتخاب شده‌اند که از صبح تا شب، با هر بالاتنه‌ای بنشینند.",
    season: "مجموعهٔ هستهٔ کمد",
    quote: "بعضی چیزها مد نیستند؛ همراه‌اند.",
    features: ["جین سنگ‌شور", "فرم آزاد", "دوام بالا"],
    theme: { from: "#B9C2CA", to: "#4D5864", accent: "#27313B", ink: "light" },
  },
];

export interface LookbookChapter {
  index: string;
  kicker: string;
  title: string;
  englishTitle: string;
  categorySlug: string;
  body: string;
  quote: string;
  layout: "wide" | "split" | "inset";
  theme: CollectionTheme;
}

export const lookbookChapters: LookbookChapter[] = [
  {
    index: "۰۱",
    kicker: "صبح‌های آرام",
    title: "آغاز نرم",
    englishTitle: "Soft Beginning",
    categorySlug: "dresses",
    body: "پیراهنی که با اولین نور روز بیدار می‌شود. پارچه‌ای سبک، برشی آزاد و رنگی که صبح را آرام‌تر می‌کند.",
    quote: "صبح، وقتی هنوز هیچ تصمیمی نگرفته‌ایم.",
    layout: "wide",
    theme: { from: "#EFE7DC", to: "#C7B4A0", accent: "#6D5747", ink: "dark" },
  },
  {
    index: "۰۲",
    kicker: "گذر از شهر",
    title: "لایه‌های شهری",
    englishTitle: "City Layers",
    categorySlug: "outerwear",
    body: "کاپشنی سبک روی یک شلوار آزاد؛ ترکیبی که برای پیاده‌روی، کافه و روزهای کاری شهری آماده است.",
    quote: "شهر را با آرامش قدم بزن.",
    layout: "split",
    theme: { from: "#CBBBA9", to: "#7A6250", accent: "#3E2F25", ink: "dark" },
  },
  {
    index: "۰۳",
    kicker: "تمرینِ آزادی",
    title: "در حرکت",
    englishTitle: "In Motion",
    categorySlug: "sportswear",
    body: "لگینگ و تاپ ورزشی، با درزهایی که حرکت را دنبال می‌کنند و نه بیشتر. برای بدنی که در حال کار کردن است.",
    quote: "حرکت، بهترین فرم بدن است.",
    layout: "inset",
    theme: { from: "#D3D6C9", to: "#616A57", accent: "#2F362A", ink: "light" },
  },
  {
    index: "۰۴",
    kicker: "شبِ کهنه",
    title: "جین و شب",
    englishTitle: "Denim & Evening",
    categorySlug: "pants",
    body: "شلوار جین آزاد، هودی خاکی و نوری که از پنجره می‌آید. استایل شب لازم نیست پیچیده باشد.",
    quote: "بعضی شب‌ها فقط یک جین خوب می‌خواهند.",
    layout: "split",
    theme: { from: "#ADB6C0", to: "#3E4956", accent: "#202A35", ink: "light" },
  },
];

export interface StoreLocation {
  city: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  note: string;
  accent: string;
}

export const storeLocations: StoreLocation[] = [
  {
    city: "تهران",
    name: "بوتیک مرکزی",
    address: "خیابان ولیعصر، بالاتر از پارک ساعی، پلاک ۲۱۴",
    phone: "۰۲۱-۱۲۳۴۵۶۷۸",
    hours: "شنبه تا پنجشنبه، ۱۱ تا ۲۰",
    note: "اتاق پرو و مشاورهٔ استایل با هماهنگی قبلی",
    accent: "#6B5E57",
  },
  {
    city: "اصفهان",
    name: "خانهٔ ilkaii",
    address: "خیابان چهارباغ بالا، کوچهٔ گل‌ها، پلاک ۸",
    phone: "۰۳۱-۱۲۳۴۵۶۷",
    hours: "شنبه تا پنجشنبه، ۱۰ تا ۱۹",
    note: "مجموعهٔ محدود و نمایش فصل جدید",
    accent: "#8A6F5C",
  },
  {
    city: "شیراز",
    name: "گالری جنوب",
    address: "بلوار زند، روبه‌روی باغ موزه، ساختمان آرام، طبقهٔ همکف",
    phone: "۰۷۱-۱۲۳۴۵۶۷",
    hours: "شنبه تا چهارشنبه، ۱۱ تا ۱۹",
    note: "تحویل حضوری سفارش‌های آنلاین",
    accent: "#5D6454",
  },
];

export interface FaqGroup {
  id: string;
  title: string;
  description: string;
  items: Array<{ question: string; answer: string }>;
}

export const faqGroups: FaqGroup[] = [
  {
    id: "orders",
    title: "سفارش و پرداخت",
    description: "از ثبت سفارش تا تأیید پرداخت",
    items: [
      {
        question: "چطور سفارشم را ثبت کنم؟",
        answer:
          "محصول، سایز و رنگ را انتخاب کنید و به سبد خرید اضافه کنید. در مرحلهٔ پرداخت، آدرس و روش ارسال را انتخاب می‌کنید. مبلغ نهایی پیش از پرداخت به‌صورت شفاف نمایش داده می‌شود.",
      },
      {
        question: "پرداخت آنلاین امن است؟",
        answer:
          "بله. پرداخت از طریق درگاه بانکی انجام می‌شود و اطلاعات کارت شما در فروشگاه ذخیره نمی‌شود. تأیید نهایی پرداخت در سرور انجام می‌گیرد.",
      },
      {
        question: "آیا پرداخت در محل دارم؟",
        answer:
          "برای برخی شهرها و سفارش‌ها، پرداخت در محل فعال است. در صورت نبود این گزینه برای آدرس شما، می‌توانید از پرداخت آنلاین یا تحویل حضوری استفاده کنید.",
      },
      {
        question: "کد تخفیف را کجا وارد کنم؟",
        answer:
          "در صفحهٔ تسویه حساب، بخش «کد تخفیف» را باز کنید و کد را وارد کنید. تخفیف پیش از پرداخت روی مبلغ نهایی اعمال می‌شود.",
      },
    ],
  },
  {
    id: "shipping",
    title: "ارسال و تحویل",
    description: "زمان، هزینه و پیگیری مرسوله",
    items: [
      {
        question: "سفارش چند روزه به دستم می‌رسد؟",
        answer:
          "سفارش‌ها پس از تأیید پرداخت، طی ۱ تا ۳ روز کاری آماده می‌شوند. زمان تحویل به روش ارسال و شهر مقصد بستگی دارد و در صفحهٔ پیگیری نمایش داده می‌شود.",
      },
      {
        question: "هزینهٔ ارسال چقدر است؟",
        answer:
          "هزینهٔ پست، پیک و تحویل حضوری در صفحهٔ «ارسال و تحویل» آمده است. سفارش‌های بالای سقف تعیین‌شده، ارسال رایگان دارند.",
      },
      {
        question: "مرسوله را چطور پیگیری کنم؟",
        answer:
          "با شمارهٔ سفارش و شمارهٔ موبایل خریدار، از صفحهٔ «پیگیری سفارش» وضعیت و کد رهگیری را ببینید. پس از ارسال، کد رهگیری در همان صفحه نمایش داده می‌شود.",
      },
      {
        question: "امکان تحویل حضوری وجود دارد؟",
        answer:
          "بله. در شهرهای دارای بوتیک، می‌توانید تحویل حضوری را انتخاب کنید. پس از آماده شدن سفارش، برای هماهنگی زمان با شما تماس گرفته می‌شود.",
      },
    ],
  },
  {
    id: "returns",
    title: "بازگشت و تعویض",
    description: "۷ روز فرصت، بدون دردسر",
    items: [
      {
        question: "چند روز فرصت بازگشت دارم؟",
        answer:
          "تا ۷ روز پس از تحویل، در صورتی که کالا استفاده نشده و برچسب اصلی آن باقی باشد. برای ثبت درخواست، از بخش سفارش‌ها در حساب کاربری اقدام کنید.",
      },
      {
        question: "تعویض سایز چگونه انجام می‌شود؟",
        answer:
          "اگر سایز انتخابی مناسب نبود، درخواست تعویض ثبت کنید. در صورت موجود بودن سایز جدید، پس از دریافت مرسولهٔ قبلی، ارسال جایگزین انجام می‌شود.",
      },
      {
        question: "هزینهٔ مرجوعی با کیست؟",
        answer:
          "در صورت ایراد تولیدی یا ارسال اشتباه، هزینهٔ ارسال با فروشگاه است. در بازگشت به دلیل تغییر نظر، هزینهٔ ارسال مرجوعی بر عهدهٔ مشتری خواهد بود.",
      },
    ],
  },
  {
    id: "sizing",
    title: "سایز و تناسب",
    description: "انتخاب درست، بدون حدس",
    items: [
      {
        question: "چطور سایز درست را انتخاب کنم؟",
        answer:
          "دور سینه، کمر و باسن را با متر پارچه‌ای اندازه بگیرید و با جدول راهنمای سایز مقایسه کنید. اگر بین دو سایز هستید، برای فرم آزادتر سایز بزرگ‌تر را انتخاب کنید.",
      },
      {
        question: "مشخصات سایز هر محصول کجاست؟",
        answer:
          "در صفحهٔ هر محصول، بخش توضیحات و راهنمای سایز، اندازه‌های مرتبط با همان محصول را نشان می‌دهد. در صورت نیاز، از پشتیبانی کمک بگیرید.",
      },
      {
        question: "پارچه‌ها آب می‌روند؟",
        answer:
          "همهٔ پارچه‌ها پیش از تولید شستشو و تثبیت می‌شوند. با این حال، برای حفظ فرم بهتر است طبق دستور شستشوی درج‌شده روی برچسب عمل کنید.",
      },
    ],
  },
  {
    id: "account",
    title: "حساب کاربری",
    description: "ورود، امنیت و اطلاعات",
    items: [
      {
        question: "ورود فقط با شمارهٔ موبایل است؟",
        answer:
          "بله. برای سادگی و امنیت، ورود با رمز یک‌بارمصرف پیامکی انجام می‌شود. برای ساخت حساب جدید، همین مسیر را طی کنید.",
      },
      {
        question: "اطلاعات من کجا ذخیره می‌شود؟",
        answer:
          "اطلاعات حساب و سفارش‌ها در سیستم فروشگاه نگهداری می‌شود. اطلاعات پرداخت ذخیره نمی‌شود و جزئیات بیشتر در «حریم خصوصی» آمده است.",
      },
      {
        question: "چطور از حساب خارج شوم؟",
        answer:
          "در بخش حساب من، گزینهٔ خروج را انتخاب کنید. نشست شما در سرور نیز باطل می‌شود و دسترسی مجدد نیاز به کد تأیید دارد.",
      },
    ],
  },
  {
    id: "care",
    title: "نگهداری و پایداری",
    description: "عمر بیشتر، خرید کمتر",
    items: [
      {
        question: "لباس‌ها را چگونه بشویم؟",
        answer:
          "دستور شستشوی هر محصول روی برچسب آن آمده است. در حالت کلی، شستشوی ملایم با آب سرد و خشک کردن در سایه، عمر پارچه را بیشتر می‌کند.",
      },
      {
        question: "ilkaii دربارهٔ پایداری چه می‌کند؟",
        answer:
          "تولید محدود، انتخاب پارچه‌های بادوام و کاهش دورریز در مرحلهٔ تولید، اصول اصلی ما هستند. جزئیات در صفحهٔ «پایداری» آمده است.",
      },
      {
        question: "قطعهٔ آسیب‌دیده را تعمیر می‌کنید؟",
        answer:
          "در صورت امکان، برای تعمیرهای ساده مثل دکمه و درز، از طریق پشتیبانی راهنمایی می‌کنیم. برای قطعات خاص، هماهنگی قبلی لازم است.",
      },
    ],
  },
];

export const brandValues = [
  {
    title: "کمتر، اما بهتر",
    body: "به‌جای تولید انبوه، مجموعه‌های کوچک و دقیق می‌سازیم؛ قطعه‌هایی که بیشتر پوشیده می‌شوند و دیرتر از مد خارج می‌شوند.",
  },
  {
    title: "پارچه، اول از همه",
    body: "قبل از طراحی، پارچه را انتخاب می‌کنیم. لمس، افت، تنفس و دوام پارچه تعیین می‌کند چه چیزی ساخته شود.",
  },
  {
    title: "سادگیِ آگاهانه",
    body: "جزئیات اضافه را حذف می‌کنیم تا فرم و تناسب بماند. سادگی برای ما کم‌کاری نیست؛ انتخاب سخت‌تری است.",
  },
  {
    title: "احترام به مصرف‌کننده",
    body: "قیمت‌گذاری شفاف، توضیح صادقانهٔ جنس و راهنمای دقیق سایز، بخشی از تجربهٔ خرید است؛ نه یک متن تبلیغاتی.",
  },
];

export const sustainabilityPillars = [
  {
    index: "۰۱",
    title: "تولید محدود",
    text: "تیراژ هر قطعه را محدود نگه می‌داریم تا موجودی اضافه و دورریز کاهش پیدا کند. فروش نامنظم و تخفیف‌های مصنوعی، جای خود را به مجموعه‌های فصلی می‌دهد.",
  },
  {
    index: "۰۲",
    title: "پارچهٔ بادوام",
    text: "کاتن سنگین، جین مقاوم و الیاف با افت کم انتخاب می‌شوند. هدف این است که لباس بعد از چند شستشو، فرم و رنگ خود را حفظ کند.",
  },
  {
    index: "۰۳",
    title: "بسته‌بندی مسئولانه",
    text: "بسته‌بندی تا حد امکان ساده، قابل بازیافت و بدون پلاستیک اضافه است. بسته‌ها طوری طراحی می‌شوند که برای مرجوعی هم قابل استفاده باشند.",
  },
  {
    index: "۰۴",
    title: "مسیر شفاف",
    text: "می‌دانیم کدام کارگاه، کدام پارچه و کدام مرحله. شفافیت یعنی اگر خطایی رخ داد، بتوانیم آن را پیدا و اصلاح کنیم؛ نه اینکه پنهانش کنیم.",
  },
];

export function collectionForCategory(categorySlug: string): EditorialCollection | undefined {
  return collections.find((collection) => collection.categorySlug === categorySlug);
}

export function collectionsForMenu() {
  return collections.map((collection) => ({
    label: collection.title,
    href: `/collections/${collection.slug}`,
    categorySlug: collection.categorySlug,
  }));
}
