
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  RefreshCcw,
  UserRound,
  Package,
  ChevronDown,
  ArrowRight,
  Headphones,
  MessageCircle,
  ShieldCheck,
  Clock3,
  CircleHelp,
  X,
} from "lucide-react";

const helpCategories = [
  {
    title: "Orders & Tracking",
    description: "Track, manage or get help with your orders.",
    icon: Package,
    color: "bg-purple-50 text-[#8b19f5]",
  },
  {
    title: "Payments & Refunds",
    description: "Payment methods, failed payments and refunds.",
    icon: CreditCard,
    color: "bg-purple-50 text-[#8b19f5]",
  },
  {
    title: "Delivery & Shipping",
    description: "Delivery timelines, charges and order status.",
    icon: Truck,
    color: "bg-purple-50 text-[#8b19f5]",
  },
  {
    title: "Returns & Cancellations",
    description: "Learn about returns, replacements and cancellations.",
    icon: RefreshCcw,
    color: "bg-purple-50 text-[#8b19f5]",
  },
  {
    title: "Account & Profile",
    description: "Manage your account and personal information.",
    icon: UserRound,
    color: "bg-purple-50 text-[#8b19f5]",
  },
  {
    title: "Products & Availability",
    description: "Product details, availability and quality.",
    icon: ShoppingBag,
    color: "bg-purple-50 text-[#8b19f5]",
  },
];

const faqs = [
  {
    category: "Orders & Tracking",
    question: "How can I track my order?",
    answer:
      "You can track your order using your Order ID on our Track Order page. You will be able to check the latest available order status.",
  },
  {
    category: "Orders & Tracking",
    question: "Can I modify my order after placing it?",
    answer:
      "Order modifications depend on the current order status. If your order has not been processed yet, please contact our support team for assistance.",
  },
  {
    category: "Orders & Tracking",
    question: "How do I cancel an order?",
    answer:
      "Cancellation depends on the order status. Please contact customer support as soon as possible if you want to cancel an order.",
  },
  {
    category: "Payments & Refunds",
    question: "What payment methods are available?",
    answer:
      "Available payment options will be displayed at checkout. Choose from the payment methods supported for your order.",
  },
  {
    category: "Payments & Refunds",
    question: "What should I do if my payment fails?",
    answer:
      "First, check whether the amount was deducted from your account. If it was deducted but your order was not confirmed, contact our support team with your transaction details.",
  },
  {
    category: "Payments & Refunds",
    question: "How long does a refund take?",
    answer:
      "Refund timelines depend on the payment method and payment provider. Contact support if your refund is taking longer than expected.",
  },
  {
    category: "Delivery & Shipping",
    question: "How long does delivery take?",
    answer:
      "Delivery time depends on your location and product availability. The estimated delivery information will be shown during checkout or in your order details.",
  },
  {
    category: "Delivery & Shipping",
    question: "What if my order is delayed?",
    answer:
      "Check your order tracking information first. If the status has not changed or your order is significantly delayed, contact our support team.",
  },
  {
    category: "Returns & Cancellations",
    question: "Can I return a product?",
    answer:
      "Return eligibility depends on the product and its condition. Please refer to our Return Policy for detailed information.",
  },
  {
    category: "Returns & Cancellations",
    question: "What if I receive a damaged product?",
    answer:
      "Please contact our support team with your Order ID and clear photos of the damaged product so the issue can be reviewed.",
  },
  {
    category: "Account & Profile",
    question: "How can I update my profile details?",
    answer:
      "You can manage your personal information from the My Account or Profile section after signing in.",
  },
  {
    category: "Products & Availability",
    question: "What if a product is out of stock?",
    answer:
      "Product availability can change based on stock. Please check the product page again later for updated availability.",
  },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory =
        activeCategory === "All" || faq.category === activeCategory;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const selectCategory = (category) => {
    setActiveCategory(category);
    setOpenFaq(null);

    document.getElementById("popular-faqs")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <main className="min-h-screen bg-[#faf9ff] text-gray-800">

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0d91] via-[#7417d8] to-[#8b19f5] px-5 py-20 sm:py-24">

        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-purple-300/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-widest text-purple-100">
            <CircleHelp size={15} />
            SELLORA SUPPORT CENTER
          </span>

          <h1 className="mt-7 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            How can we help
            <span className="mt-2 block text-purple-200">
              you today?
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-purple-50/90 sm:text-base">
            Find answers, get support and enjoy a smoother shopping experience
            with Sellora.
          </p>

          {/* SEARCH BAR */}
          <div className="mx-auto mt-9 flex max-w-2xl items-center gap-3 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20">

            <Search className="ml-3 shrink-0 text-gray-400" size={22} />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveCategory("All");
                setOpenFaq(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  document.getElementById("popular-faqs")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }
              }}
              placeholder="Search your questions..."
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />

            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                  setOpenFaq(null);
                }}
                className="rounded-xl p-2 text-gray-400 transition hover:bg-purple-50 hover:text-[#8b19f5]"
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}

            <button
              onClick={() =>
                document.getElementById("popular-faqs")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="rounded-xl bg-[#8b19f5] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#7417d8]"
            >
              Search
            </button>

          </div>

          <p className="mt-5 text-xs text-purple-100/80">
            Popular: Order tracking · Payments · Returns · Delivery
          </p>

        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="relative z-10 mx-auto -mt-7 max-w-5xl px-5">

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-lg shadow-purple-100/50 sm:grid-cols-3 sm:p-6">

          <div className="flex items-center justify-center gap-3 py-2">
            <div className="rounded-xl bg-purple-50 p-3 text-[#8b19f5]">
              <Headphones size={21} />
            </div>

            <div>
              <p className="text-sm font-semibold">Customer Support</p>
              <p className="mt-1 text-xs text-gray-500">
                Here to help you
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-gray-100 py-2 sm:border-x">
            <div className="rounded-xl bg-purple-50 p-3 text-[#8b19f5]">
              <ShieldCheck size={21} />
            </div>

            <div>
              <p className="text-sm font-semibold">Secure Shopping</p>
              <p className="mt-1 text-xs text-gray-500">
                Shop with confidence
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 py-2">
            <div className="rounded-xl bg-purple-50 p-3 text-[#8b19f5]">
              <Clock3 size={21} />
            </div>

            <div>
              <p className="text-sm font-semibold">Quick Assistance</p>
              <p className="mt-1 text-xs text-gray-500">
                Find answers easily
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* HELP CATEGORIES */}
      <section className="mx-auto max-w-6xl px-5 py-20">

        <div className="mb-9 text-center">

          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b19f5]">
            Browse by topic
          </span>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            What do you need help with?
          </h2>

          <p className="mt-3 text-sm text-gray-500">
            Choose a topic to find the answers you are looking for.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {helpCategories.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                onClick={() => selectCategory(item.title)}
                className="group rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-900/5"
              >

                <div className="flex items-start justify-between">

                  <div className={`rounded-2xl p-3.5 ${item.color}`}>
                    <Icon size={24} />
                  </div>

                  <ArrowRight
                    size={19}
                    className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-[#8b19f5]"
                  />

                </div>

                <h3 className="mt-5 text-base font-bold text-gray-900">
                  {item.title}
                </h3>

                <p className="mt-2 min-h-10 text-sm leading-6 text-gray-500">
                  {item.description}
                </p>

                <p className="mt-5 text-xs font-semibold text-[#8b19f5]">
                  Explore help topics
                </p>

              </button>
            );
          })}

        </div>
      </section>

      {/* FAQ SECTION */}
      <section
        id="popular-faqs"
        className="scroll-mt-10 bg-white px-5 py-20"
      >

        <div className="mx-auto max-w-4xl">

          <div className="text-center">

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b19f5]">
              Help & Support
            </span>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Frequently asked questions
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Quick answers to the questions customers ask most.
            </p>

          </div>

          {/* FAQ CATEGORY FILTERS */}
          <div className="mt-9 flex flex-wrap justify-center gap-2">

            {["All", ...helpCategories.map((item) => item.title)].map(
              (category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setOpenFaq(null);
                  }}
                  className={`rounded-full px-4 py-2.5 text-xs font-semibold transition ${
                    activeCategory === category
                      ? "bg-[#8b19f5] text-white shadow-md shadow-purple-900/10"
                      : "border border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-[#7417d8]"
                  }`}
                >
                  {category}
                </button>
              )
            )}

          </div>

          {/* FAQ LIST */}
          <div className="mt-8 space-y-3">

            {filteredFaqs.length > 0 ? (

              filteredFaqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div
                    key={faq.question}
                    className={`overflow-hidden rounded-2xl border transition ${
                      isOpen
                        ? "border-purple-200 bg-purple-50/50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >

                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left sm:px-6"
                    >

                      <div>

                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b19f5]">
                          {faq.category}
                        </span>

                        <h3 className="mt-1 text-sm font-semibold text-gray-800 sm:text-base">
                          {faq.question}
                        </h3>

                      </div>

                      <span
                        className={`shrink-0 rounded-full p-2 transition ${
                          isOpen
                            ? "rotate-180 bg-purple-100 text-[#8b19f5]"
                            : "bg-gray-50 text-gray-500"
                        }`}
                      >
                        <ChevronDown size={18} />
                      </span>

                    </button>

                    {isOpen && (

                      <div className="px-5 pb-5 sm:px-6">

                        <div className="border-t border-purple-100 pt-4 text-sm leading-7 text-gray-600">
                          {faq.answer}
                        </div>

                      </div>

                    )}

                  </div>
                );
              })

            ) : (

              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">

                <Search className="mx-auto text-gray-300" size={32} />

                <h3 className="mt-4 font-semibold text-gray-800">
                  No matching questions found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Try another keyword or browse all questions.
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                    setOpenFaq(null);
                  }}
                  className="mt-4 text-sm font-semibold text-[#8b19f5] hover:text-[#7417d8]"
                >
                  Clear filters
                </button>

              </div>

            )}

          </div>
        </div>
      </section>

      {/* CONTACT SUPPORT CTA */}
      <section className="px-5 py-20">

        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-r from-[#5b0db5] to-[#8b19f5] px-7 py-12 text-center shadow-xl shadow-purple-200/50 sm:px-12 sm:py-14">

          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />

          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full border-[35px] border-white/5" />

          <div className="relative">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
              <MessageCircle size={27} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
              Still need a helping hand?
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-purple-50/90">
              Can't find what you're looking for? Our support team is ready to
              help you with your questions.
            </p>

            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#8b19f5] shadow-lg transition hover:-translate-y-0.5 hover:bg-purple-50"
            >
              Contact Support
              <ArrowRight size={17} />
            </Link>

          </div>
        </div>
      </section>

    </main>
  );
}
