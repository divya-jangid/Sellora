
import Link from "next/link";
import {
  FileText,
  ShoppingBag,
  UserCheck,
  CreditCard,
  Truck,
  RefreshCcw,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    icon: UserCheck,
    content:
      "By accessing or using the Sellora website, you agree to these Terms & Conditions. If you do not agree with these terms, please discontinue using the platform.",
  },
  {
    id: "account",
    title: "2. Customer Accounts",
    icon: UserCheck,
    content:
      "Customers are responsible for providing accurate information when creating and using an account. Account credentials should be kept secure. Any account-related requirements should follow Sellora's actual account policies.",
  },
  {
    id: "products",
    title: "3. Products & Availability",
    icon: ShoppingBag,
    content:
      "Sellora displays products and their available details on the platform. Product availability, descriptions, images and prices may change. The information displayed at the time of checkout should be reviewed before placing an order.",
  },
  {
    id: "orders",
    title: "4. Orders & Confirmation",
    icon: FileText,
    content:
      "Customers should review their order details before confirming a purchase. Order acceptance, confirmation and processing will be subject to the actual order procedures followed by Sellora.",
  },
  {
    id: "payments",
    title: "5. Pricing & Payments",
    icon: CreditCard,
    content:
      "Applicable product prices, delivery charges, taxes and available payment methods should be displayed during checkout. Customers should review the final payable amount before completing a purchase.",
  },
  {
    id: "delivery",
    title: "6. Delivery & Shipping",
    icon: Truck,
    content:
      "Delivery availability and estimated delivery timelines may depend on the customer's location, product availability and logistics arrangements. Delivery-related information should be checked during checkout.",
  },
  {
    id: "returns",
    title: "7. Returns & Refunds",
    icon: RefreshCcw,
    content:
      "Returns, replacements, cancellations and refunds are governed by Sellora's applicable Return Policy. Customers should review that policy before placing an order.",
  },
  {
    id: "responsibility",
    title: "8. Customer Responsibilities",
    icon: ShieldCheck,
    content:
      "Customers are expected to use the platform responsibly, provide accurate information and avoid activities that may interfere with the website or other users' shopping experience.",
  },
  {
    id: "changes",
    title: "9. Changes to These Terms",
    icon: AlertCircle,
    content:
      "Sellora may update these Terms & Conditions when required. The latest version should be published on this page, and customers should review it periodically.",
  },
];

export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-[#faf9ff] text-gray-800">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0d91] via-[#7417d8] to-[#8b19f5] px-5 py-16 sm:py-20">

        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-purple-300/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg">
            <FileText size={32} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-purple-100">
            Please Read Carefully
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Terms & Conditions
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-purple-50/90 sm:text-base">
            Understand the terms that apply when you browse, shop and use
            services provided through Sellora.
          </p>

        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">

        {/* BREADCRUMB */}
        <div className="mb-8 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="transition hover:text-[#8b19f5]">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="font-semibold text-[#8b19f5]">
            Terms & Conditions
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">

          {/* SIDEBAR */}
          <aside className="h-fit rounded-2xl border border-purple-100 bg-white p-5 shadow-sm lg:sticky lg:top-6">

            <h3 className="mb-4 text-sm font-bold text-gray-900">
              On This Page
            </h3>

            <nav className="space-y-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-purple-50 hover:text-[#8b19f5]"
                >
                  {section.title}
                </a>
              ))}

              <a
                href="#contact"
                className="block rounded-lg px-3 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-purple-50 hover:text-[#8b19f5]"
              >
                Contact Support
              </a>
            </nav>

            <div className="mt-6 rounded-xl bg-purple-50 p-4">
              <ShieldCheck className="text-[#8b19f5]" size={22} />

              <p className="mt-3 text-xs font-bold text-gray-800">
                Shop With Confidence
              </p>

              <p className="mt-2 text-xs leading-5 text-gray-500">
                Please review our terms to understand the conditions of using
                Sellora.
              </p>
            </div>

          </aside>

          {/* MAIN CONTENT */}
          <div className="min-w-0 space-y-6">

            {/* INTRODUCTION */}
            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">

              <h2 className="text-xl font-bold text-gray-900">
                Welcome to Sellora
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                These Terms & Conditions describe the general terms applicable
                to the use of the Sellora website and shopping platform.
                Please read these terms before browsing or placing an order.
              </p>

            </div>

            {/* TERMS SECTIONS */}
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-8 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-8"
                >

                  <div className="flex items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#8b19f5]">
                      <Icon size={22} />
                    </div>

                    <h2 className="text-lg font-bold text-gray-900">
                      {section.title}
                    </h2>

                  </div>

                  <p className="mt-5 text-sm leading-7 text-gray-600">
                    {section.content}
                  </p>

                </section>
              );
            })}

            {/* CONTACT SUPPORT */}
            <section
              id="contact"
              className="scroll-mt-8 rounded-2xl bg-gradient-to-r from-[#5b0db5] to-[#8b19f5] p-7 text-white shadow-lg shadow-purple-200/50 sm:p-9"
            >

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-white/15 p-3">
                  <AlertCircle size={23} />
                </div>

                <h2 className="text-xl font-bold">
                  Need More Information?
                </h2>

              </div>

              <p className="mt-4 text-sm leading-7 text-purple-50/90">
                If you have questions about these Terms & Conditions or need
                assistance with Sellora, our support page can help you get
                started.
              </p>

              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#8b19f5] transition hover:bg-purple-50"
              >
                Contact Support
                <ChevronRight size={17} />
              </Link>

            </section>

          </div>
        </div>
      </section>

    </main>
  );
}
