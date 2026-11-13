
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-purple-100 bg-[#faf8ff] text-gray-700">

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-14 lg:px-10">

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">

            <Link href="/" className="inline-block">
              <h2 className="text-3xl font-extrabold tracking-tight text-purple-700 sm:text-4xl">
                Sellora<span className="text-pink-500">.</span>
              </h2>
            </Link>

            <p className="mt-4 max-w-md text-sm leading-7 text-gray-500">
              Your everyday shopping destination. Discover fresh groceries,
              daily essentials and quality products at amazing prices.
              Everything you need, all in one place.
            </p>

            <div className="mt-7">
              <h3 className="mb-4 text-sm font-bold text-gray-900">
                Follow Us
              </h3>

              <div className="flex gap-3">
                {[
                  { name: "Facebook", icon: "f" },
                  { name: "Instagram", icon: "ig" },
                  { name: "YouTube", icon: "▶" },
                ].map((item) => (
                  <a
                    key={item.name}
                    href="#"
                    aria-label={item.name}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-100 bg-white text-sm font-bold text-purple-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-700 hover:bg-purple-700 hover:text-white hover:shadow-md"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-5 text-base font-bold text-gray-900">
              Quick Links
            </h3>

            <ul className="space-y-3.5 text-sm text-gray-500">
              <li>
                <Link href="/" className="transition-colors hover:text-purple-700">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-purple-700">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-purple-700">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-5 text-base font-bold text-gray-900">
              Categories
            </h3>

            <ul className="space-y-3.5 text-sm text-gray-500">
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  Grocery
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  Fruits
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  Vegetables
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  Personal Care
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  Dairy & Bakery
                </Link>
              </li>
              <li>
                <Link href="/products" className="transition-colors hover:text-purple-700">
                  Snacks & Munchies
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="mb-5 text-base font-bold text-gray-900">
              Customer Support
            </h3>

            <ul className="space-y-3.5 text-sm text-gray-500">
              <li>
                <Link href="/help" className="transition-colors hover:text-purple-700">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-purple-700">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="transition-colors hover:text-purple-700">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-purple-700">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/returns" className="transition-colors hover:text-purple-700">
                  Return Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-purple-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-center sm:px-8 md:flex-row md:px-10 md:text-left">

          <p className="text-xs text-gray-500">
            © 2026 <span className="font-bold text-purple-700">Sellora</span>.
            All rights reserved.
          </p>

          <p className="text-xs font-semibold tracking-wider text-purple-700">
            SHOP <span className="text-pink-500">•</span> SELL
            <span className="text-pink-500"> • </span> GROW
          </p>

          <p className="text-xs text-gray-400">
            Made with care for everyday shopping.
          </p>

        </div>
      </div>

    </footer>
  );
}
