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
                Stay Updated
              </h2>
              <p className="text-lg text-white/80">
                Subscribe to our newsletter for exclusive offers and early
                access to new collections.
              </p>
            </div>

            <form className="flex flex-col sm:flex-row gap-3 mt-8">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 px-4 py-3.5 rounded-lg bg-white text-luxury-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white text-base"
              />
              <button
                type="submit"
                className="px-8 py-3.5 rounded-lg bg-white text-luxury-primary font-semibold hover:bg-luxury-background transition-colors duration-200 touch-target whitespace-nowrap active:scale-95 min-w-max"
              >
                Subscribe
              </button>
            </form>

            <p className="text-sm text-white/60">
              We respect your privacy. Unsubscribe anytime.
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
                Luxury women's clothing with premium quality and timeless style.
              </p>
            </div>

            {/* Shop */}
            <div className="space-y-4">
              <h4 className="font-semibold text-luxury-text">Shop</h4>
              <ul className="space-y-2 text-sm text-luxury-text/70">
                <li>
                  <a
                    href="/shop"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    All Products
                  </a>
                </li>
                <li>
                  <a
                    href="/shop/new"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    New Arrivals
                  </a>
                </li>
                <li>
                  <a
                    href="/shop/sale"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Sale
                  </a>
                </li>
                <li>
                  <a
                    href="/collections"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Collections
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-luxury-text">Company</h4>
              <ul className="space-y-2 text-sm text-luxury-text/70">
                <li>
                  <a
                    href="/about"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="/careers"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <h4 className="font-semibold text-luxury-text">Support</h4>
              <ul className="space-y-2 text-sm text-luxury-text/70">
                <li>
                  <a
                    href="/faq"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="/shipping"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Shipping
                  </a>
                </li>
                <li>
                  <a
                    href="/returns"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Returns
                  </a>
                </li>
                <li>
                  <a
                    href="/privacy"
                    className="hover:text-luxury-primary transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-luxury-border pt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-sm text-luxury-text/60">
            <p>&copy; 2024 ilkaii. All rights reserved.</p>
            <div className="flex gap-6">
              <a
                href="#"
                className="hover:text-luxury-primary transition-colors"
              >
                Instagram
              </a>
              <a
                href="#"
                className="hover:text-luxury-primary transition-colors"
              >
                Facebook
              </a>
              <a
                href="#"
                className="hover:text-luxury-primary transition-colors"
              >
                Twitter
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
