
import Link from "next/link";
import {
  ShieldCheck,
  LockKeyhole,
  Database,
  Cookie,
  UserRound,
  Share2,
  Mail,
  ChevronRight,
} from "lucide-react";

const sections = [
  {
    id: "information",
    title: "1. Information We Collect",
    icon: Database,
    content:
      "When you use Sellora, information may be collected to help provide and improve your shopping experience. This may include information you provide while creating an account, placing orders or contacting customer support.",
    points: [
      "Personal details such as your name and contact information.",
      "Order and transaction-related information.",
      "Delivery details provided during checkout.",
      "Information you share with our support team.",
    ],
  },
  {
    id: "usage",
    title: "2. How We Use Your Information",
    icon: UserRound,
    content:
      "Information may be used for purposes related to operating the Sellora platform and providing services to customers.",
    points: [
      "To process and manage customer orders.",
      "To provide delivery and order-related updates.",
      "To respond to customer questions and requests.",
      "To improve the website and shopping experience.",
    ],
  },
  {
    id: "protection",
    title: "3. Data Protection",
    icon: LockKeyhole,
    content:
      "We take the importance of personal information seriously. Appropriate safeguards should be used to protect customer information against unauthorized access, misuse or disclosure.",
    points: [
      "Access to information should be limited to authorized purposes.",
      "Customer information should be handled responsibly.",
      "Security practices should be reviewed and improved.",
    ],
  },
  {
    id: "cookies",
    title: "4. Cookies and Website Usage",
    icon: Cookie,
    content:
      "Cookies and similar technologies may be used to support website functionality, remember preferences and understand how visitors interact with the platform. The actual cookies used by Sellora should be listed here.",
    points: [
      "Remembering relevant website preferences.",
      "Supporting essential website functionality.",
      "Understanding website usage and performance.",
    ],
  },
  {
    id: "sharing",
    title: "5. Sharing of Information",
    icon: Share2,
    content:
      "Information may need to be shared with service providers involved in operating the platform, processing payments or fulfilling deliveries. Any sharing practices must follow the applicable privacy requirements.",
    points: [
      "Payment service providers, where applicable.",
      "Delivery and logistics partners, where applicable.",
      "Technology providers supporting platform operations.",
    ],
  },
  {
    id: "rights",
    title: "6. Your Privacy Rights",
    icon: ShieldCheck,
    content:
      "Customers may have rights regarding their personal information under applicable privacy laws. Requests relating to personal information can be directed to the Sellora support team.",
    points: [
      "Request information about personal data.",
      "Request correction of inaccurate information.",
      "Raise questions about how information is used.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#faf9ff] text-gray-800">

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c0d91] via-[#7417d8] to-[#8b19f5] px-5 py-16 sm:py-20">
        <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-purple-300/15 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-lg">
            <ShieldCheck size={32} />
          </div>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-purple-100">
            Your Privacy Matters
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Privacy Policy
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-purple-50/90 sm:text-base">
            Learn how Sellora handles information and how we aim to protect
            your privacy while you shop with us.
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
            Privacy Policy
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">

          {/* LEFT NAVIGATION */}
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
                Contact Us
              </a>
            </nav>

            <div className="mt-6 rounded-xl bg-purple-50 p-4">
              <LockKeyhole className="text-[#8b19f5]" size={22} />
              <p className="mt-3 text-xs font-bold text-gray-800">
                Your Privacy, Our Priority
              </p>
              <p className="mt-2 text-xs leading-5 text-gray-500">
                We believe your information should be handled responsibly.
              </p>
            </div>
          </aside>

          {/* POLICY CONTENT */}
          <div className="min-w-0 space-y-6">

            <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Welcome to Sellora
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                This Privacy Policy explains how information may be collected,
                used and handled when you visit or use the Sellora website.
                Please read this policy carefully to understand our approach
                towards privacy and personal information.
              </p>
            </div>

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
                </section>
              );
            })}

            {/* CONTACT */}
            <section
              id="contact"
              className="scroll-mt-8 rounded-2xl bg-gradient-to-r from-[#5b0db5] to-[#8b19f5] p-7 text-white shadow-lg shadow-purple-200/50 sm:p-9"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/15 p-3">
                  <Mail size={23} />
                </div>
                <h2 className="text-xl font-bold">
                  Questions About Your Privacy?
                </h2>
              </div>

              <p className="mt-4 text-sm leading-7 text-purple-50/90">
                If you have questions or concerns about this Privacy Policy,
                please reach out to our customer support team.
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
