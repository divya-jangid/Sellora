
import Link from "next/link";
import {
  RefreshCcw,
  Package,
  ClipboardCheck,
  Clock,
  Wallet,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

const returnSteps = [
  {
    number: "01",
    title: "Raise a Return Request",
    description:
      "Contact our support team with your Order ID and details of the issue.",
    icon: MessageCircle,
  },
  {
    number: "02",
    title: "Request Review",
    description:
      "Our team reviews the request according to the applicable return conditions.",
    icon: ClipboardCheck,
  },
  {
    number: "03",
    title: "Product Verification",
    description:
      "If required, the product and supporting information may be checked.",
    icon: Package,
  },
  {
    number: "04",
    title: "Refund or Resolution",
    description:
      "Once approved, the applicable refund or resolution process will be initiated.",
    icon: Wallet,
  },
];

const policySections = [
  {
    title: "When Can You Request a Return?",
    icon: RefreshCcw,
    description:
      "A return or replacement request may be considered when a product is damaged, defective, incorrect or does not meet the applicable product conditions.",
    points: [
      "The product received is damaged.",
      "You received an incorrect product.",
      "The product has a quality-related issue.",
      "The product does not match the order details.",
    ],
  },
  {
    title: "Conditions for Returns",
    icon: ShieldCheck,
    description:
      "Return eligibility depends on the product category and the applicable return conditions.",
    points: [
      "Keep the product and its packaging where possible.",
      "Provide the Order ID when raising a request.",
      "Share clear photographs if the product is damaged or incorrect.",
      "Some products may have category-specific return restrictions.",
    ],
  },
  {
    title: "Refund Process",
    icon: Wallet,
    description:
      "Refunds are subject to request approval and the payment method used for the order.",
    points: [
      "Approved refunds are processed through the applicable payment channel.",
      "The time taken may depend on the payment provider or bank.",
      "Customers may be asked for transaction details when necessary.",
    ],
  },
  {
    title: "Order Cancellation",
    icon: Clock,
    description:
      "Cancellation requests depend on the current status of the order.",
    points: [
      "Contact support as early as possible.",
      "A cancellation may not be possible once an order is dispatched.",
      "Eligible cancellations will be handled according to the applicable refund process.",
    ],
  },
];

export default function ReturnPolicy() {
  return (
    <main className="min-h-screen bg-[#faf9ff] text-gray-800">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0d91] via-[#7417d8] to-[#8b19f5] px-5 py-16 sm:py-20">

        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-purple-300/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg">
            <RefreshCcw size={32} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-purple-100">
            Customer Friendly Support
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Return & Refund Policy
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-purple-50/90 sm:text-base">
            Need help with a product or order? Understand the return,
            replacement and refund process at Sellora.
          </p>

        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-6xl px-5 py-12 sm:py-16">

        {/* BREADCRUMB */}
        <div className="mb-8 flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="transition hover:text-[#8b19f5]">
            Home
          </Link>
          <ChevronRight size={14} />
          <span className="font-semibold text-[#8b19f5]">
            Return Policy
          </span>
        </div>

        {/* INTRODUCTION */}
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-3 text-[#8b19f5]">
              <Package size={23} />
            </div>

            <h2 className="text-xl font-bold text-gray-900">
              Our Return & Refund Approach
            </h2>
          </div>

          <p className="mt-5 text-sm leading-7 text-gray-600">
            At Sellora, we want customers to have a smooth shopping experience.
            If you face an issue with an order or product, you can reach out
            to our support team for assistance. All requests are reviewed
            according to the applicable product and order conditions.
          </p>

        </div>

        {/* RETURN STEPS */}
        <div className="mt-14">

          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b19f5]">
              Simple Process
            </span>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              How Returns Work
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Follow these steps to raise a return or refund request.
            </p>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {returnSteps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-100/50"
                >

                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-purple-50 p-3 text-[#8b19f5]">
                      <Icon size={23} />
                    </div>

                    <span className="text-2xl font-bold text-purple-100">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-5 text-base font-bold text-gray-900">
                    {step.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {step.description}
                  </p>

                </div>
              );
            })}

          </div>
        </div>

        {/* POLICY DETAILS */}
        <div className="mt-16">

          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8b19f5]">
              Policy Details
            </span>

            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Everything You Need to Know
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              Important information about returns, refunds and cancellations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {policySections.map((section) => {
              const Icon = section.icon;

              return (
                <div
                  key={section.title}
                  className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm transition hover:shadow-md sm:p-7"
                >

                  <div className="flex items-center gap-3">

                    <div className="rounded-xl bg-purple-50 p-3 text-[#8b19f5]">
                      <Icon size={22} />
                    </div>

                    <h3 className="text-base font-bold text-gray-900">
                      {section.title}
                    </h3>

                  </div>

                  <p className="mt-4 text-sm leading-7 text-gray-600">
                    {section.description}
                  </p>

                  <ul className="mt-4 space-y-3">
                    {section.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 text-sm leading-6 text-gray-600"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8b19f5]" />
                        {point}
                      </li>
                    ))}
                  </ul>

                </div>
              );
            })}

          </div>
        </div>

        {/* IMPORTANT NOTE */}
        <div className="mt-10 rounded-2xl border border-purple-200 bg-purple-50 p-6 sm:p-7">

          <div className="flex items-start gap-3">
            <AlertCircle
              size={23}
              className="mt-0.5 shrink-0 text-[#8b19f5]"
            />

            <div>
              <h3 className="font-bold text-gray-900">
                Important Information
              </h3>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                Return eligibility, applicable time limits, excluded product
                categories, refund timelines and cancellation conditions
                must follow Sellora's final approved business policy.
                Please contact support if you are unsure about your request.
              </p>
            </div>
          </div>

        </div>

        {/* CONTACT CTA */}
        <div className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-[#5b0db5] to-[#8b19f5] px-7 py-12 text-center shadow-xl shadow-purple-200/50 sm:px-12 sm:py-14">

          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />

          <div className="relative">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
              <MessageCircle size={27} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">
              Need Help With a Return?
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-purple-50/90">
              Our support team can help you with product issues, return
              requests and refund-related questions.
            </p>

            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-[#8b19f5] shadow-lg transition hover:-translate-y-0.5 hover:bg-purple-50"
            >
              Contact Support
              <ChevronRight size={17} />
            </Link>

          </div>
        </div>

      </section>
    </main>
  );
}
