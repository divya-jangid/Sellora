
import Link from "next/link";

const features = [
  {
    icon: "🛒",
    title: "Everything in One Place",
    description:
      "Explore groceries, fresh essentials and everyday products in one convenient destination.",
  },
  {
    icon: "✨",
    title: "Quality Products",
    description:
      "Discover carefully selected products that make your everyday shopping easier.",
  },
  {
    icon: "💜",
    title: "Customer First",
    description:
      "We aim to make every shopping experience simple, convenient and enjoyable.",
  },
  {
    icon: "🚀",
    title: "Easy Shopping",
    description:
      "Browse your favourite categories and find what you need with ease.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 md:py-28 lg:px-10">

          <div>
            <span className="inline-flex rounded-full border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
              About Sellora
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Shopping Made
              <span className="block text-purple-700">
                Simple & Better<span className="text-pink-500">.</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-gray-600">
              Welcome to Sellora, your everyday shopping destination.
              We bring groceries, daily essentials and quality products
              together to make your shopping experience convenient and easy.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/AllProducts"
                className="rounded-xl bg-purple-700 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-1 hover:bg-purple-800"
              >
                Explore Products
              </Link>

              <Link
                href="/contact"
                className="rounded-xl border border-purple-200 bg-white px-7 py-3.5 text-sm font-semibold text-purple-700 transition hover:border-purple-700 hover:bg-purple-50"
              >
                Contact Us
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-5 rounded-[2rem] bg-gradient-to-br from-purple-200 to-pink-200 blur-2xl opacity-60" />

            <div className="relative rounded-[2rem] border border-white bg-white/80 p-8 shadow-2xl shadow-purple-100 backdrop-blur">
              <div className="rounded-2xl bg-gradient-to-br from-purple-700 to-purple-500 p-8 text-white">
                <p className="text-sm font-medium text-purple-100">
                  YOUR EVERYDAY SHOPPING DESTINATION
                </p>

                <h2 className="mt-5 text-4xl font-extrabold">
                  Sellora<span className="text-pink-300">.</span>
                </h2>

                <p className="mt-4 text-sm leading-7 text-purple-100">
                  Making everyday shopping a little easier, one order at a time.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-purple-50 p-5 text-center">
                  <span className="text-3xl">🥑</span>
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    Fresh Groceries
                  </p>
                </div>

                <div className="rounded-2xl bg-pink-50 p-5 text-center">
                  <span className="text-3xl">🛍️</span>
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    Daily Essentials
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-purple-700">
            Who We Are
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Welcome to the World of
            <span className="text-purple-700"> Sellora</span>
          </h2>

          <p className="mt-6 text-base leading-8 text-gray-600">
            We believe everyday shopping should be simple and convenient.
            Sellora brings different everyday shopping needs together in
            one place, helping customers discover products across multiple
            categories without unnecessary hassle.
          </p>

          <p className="mt-4 text-base leading-8 text-gray-600">
            From everyday groceries to personal care and daily essentials,
            we want to make finding your favourite products an easier experience.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#faf8ff] py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">

          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-purple-700">
              Why Sellora
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Shopping That Fits Your Everyday Life
            </h2>

            <p className="mt-4 text-gray-500">
              Everything you need for a smoother everyday shopping experience.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-purple-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-100"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-3xl transition group-hover:bg-purple-100">
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-bold text-gray-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-purple-800 to-purple-600 px-7 py-14 text-center text-white shadow-xl shadow-purple-200 sm:px-14">
          <p className="text-sm font-bold uppercase tracking-widest text-purple-200">
            Our Mission
          </p>

          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl">
            Making Everyday Shopping Easier for Everyone.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-purple-100 sm:text-base">
            Our goal is to create a convenient shopping destination where
            customers can discover the products they need and enjoy a simple
            shopping journey.
          </p>

          <Link
            href="/AllProducts"
            className="mt-8 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-purple-700 transition hover:-translate-y-1 hover:bg-pink-50"
          >
            Start Shopping
          </Link>
        </div>
      </section>

    </main>
  );
}
