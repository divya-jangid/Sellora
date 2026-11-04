
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f8f6ff] border-t border-purple-100 text-gray-700">

      <div className="max-w-7xl mx-auto px-6 md:px-10 py-14">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <h2 className="text-4xl font-extrabold text-purple-700 tracking-tight">
                Sellora<span className="text-pink-500">.</span>
              </h2>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-gray-500">
              Your everyday shopping destination. Discover fresh groceries,
              daily essentials and quality products at amazing prices.
              Everything you need, all in one place.
            </p>

            <div className="mt-7">
              <h3 className="text-sm font-bold text-gray-900 mb-4">
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
                    className="w-10 h-10 flex items-center justify-center rounded-full
                    bg-white border border-purple-100 text-purple-700
                    font-bold text-sm shadow-sm transition duration-300
                    hover:bg-purple-700 hover:text-white hover:-translate-y-1"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-6">
              Quick Links
            </h3>

            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/" className="hover:text-purple-700 transition">Home</Link></li>
              <li><Link href="/about" className="hover:text-purple-700 transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-purple-700 transition">Contact Us</Link></li>
              <li><Link href="/products" className="hover:text-purple-700 transition">All Products</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-6">
              Categories
            </h3>

            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/products" className="hover:text-purple-700 transition">Grocery</Link></li>
              <li><Link href="/products" className="hover:text-purple-700 transition">Fruits</Link></li>
              <li><Link href="/products" className="hover:text-purple-700 transition">Vegetables</Link></li>
              <li><Link href="/products" className="hover:text-purple-700 transition">Personal Care</Link></li>
              <li><Link href="/products" className="hover:text-purple-700 transition">Dairy & Bakery</Link></li>
              <li><Link href="/products" className="hover:text-purple-700 transition">Snacks & Munchies</Link></li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-6">
              Customer Support
            </h3>

            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="/help" className="hover:text-purple-700 transition">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-purple-700 transition">Contact Support</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-purple-700 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-purple-700 transition">Terms & Conditions</Link></li>
              <li><Link href="/returns" className="hover:text-purple-700 transition">Return Policy</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-white border-t border-purple-100">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6
        flex flex-col md:flex-row items-center justify-between gap-3">

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
