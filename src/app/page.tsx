import dynamic from "next/dynamic";
import { Hero } from "@/components/Hero";

// Dynamic imports for better performance
const FeaturedCategories = dynamic(
  () =>
    import("@/components/FeaturedCategories").then((mod) => ({
      default: mod.FeaturedCategories,
    })),
  {
    loading: () => (
      <div className="h-96 bg-luxury-background animate-shimmer" />
    ),
  },
);

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <Hero />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Newsletter Section */}
      <section className="w-full py-16 md:py-20 bg-luxury-primary text-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-4xl sm:text-5xl font-serif font-bold">
                در جریان بمانید
              </h2>
              <p className="text-lg text-white/80">
                با عضویت در خبرنامه از پیشنهادهای ویژه و دسترسی زودهنگام به
                مجموعه‌های جدید مطلع شوید.
              </p>
            </div>

            <form className="flex flex-col sm:flex-row gap-3 mt-8">
              <input
                type="email"
                placeholder="ایمیل خود را وارد کنید"
                required
                className="flex-1 px-4 py-3.5 rounded-lg bg-white text-luxury-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-base"
              />
              <button
                type="submit"
                className="px-8 py-3.5 rounded-lg bg-white text-luxury-primary font-semibold hover:bg-luxury-background transition-colors duration-200 touch-target whitespace-nowrap active:scale-95 min-w-max"
              >
                عضویت
              </button>
            </form>

            <p className="text-sm text-white/60">
              حریم خصوصی شما برای ما مهم است. هر زمان می‌توانید لغو اشتراک کنید.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-luxury-border">
        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <h3 className="text-2xl font-serif font-bold text-luxury-primary">
                ilkaii
              </h3>
              <p className="text-luxury-text/70 text-sm">
                پوشاک لوکس زنانه با کیفیت برتر و سبک جاودانه.
              </p>
            </div>

            {/* Shop */}
            <div className="space-y-4">
              <h4 className="font-semibold text-luxury-text">فروشگاه</h4>
              <ul className="space-y-2 text-sm text-luxury-text/70">
                <li>
                  <a
                    href="/shop"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    همه محصولات
                  </a>
                </li>
                <li>
                  <a
                    href="/shop/new"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    تازه‌ترین‌ها
                  </a>
                </li>
                <li>
                  <a
                    href="/shop/sale"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    حراج
                  </a>
                </li>
                <li>
                  <a
                    href="/collections"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    مجموعه‌ها
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-luxury-text">درباره</h4>
              <ul className="space-y-2 text-sm text-luxury-text/70">
                <li>
                  <a
                    href="/about"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    درباره ما
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    بلاگ
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    تماس
                  </a>
                </li>
                <li>
                  <a
                    href="/careers"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    فرصت‌های شغلی
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-luxury-text">پشتیبانی</h4>
              <ul className="space-y-2 text-sm text-luxury-text/70">
                <li>
                  <a
                    href="/faq"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    سوالات متداول
                  </a>
                </li>
                <li>
                  <a
                    href="/shipping"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    ارسال
                  </a>
                </li>
                <li>
                  <a
                    href="/returns"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    بازگشت کالا
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    سیاست حفظ حریم خصوصی
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-luxury-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-luxury-text/60">
            <p>© ۲۰۲۴ ilkaii. تمامی حقوق محفوظ است.</p>
            <div className="flex gap-6">
              <a
                href="#"
                className="hover:text-luxury-primary transition-colors"
              >
                اینستاگرام
              </a>
              <a
                href="#"
                className="hover:text-luxury-primary transition-colors"
              >
                فیسبوک
              </a>
              <a
                href="#"
                className="hover:text-luxury-primary transition-colors"
              >
                توییتر
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
