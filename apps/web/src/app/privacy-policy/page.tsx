import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter } from "../(public)/components/PublicFooter";
import { PublicHeader } from "../(public)/components/PublicHeader";

export const metadata: Metadata = {
  title: "Privacy Policy | LadyBird Shuttle Services",
  description:
    "Read how LadyBird Shuttle Services collects, uses and protects customer booking and travel information.",
};

const contact = {
  bookingEmail: "bookings@ladybirdshuttles.co.zw",
  generalEmail: "info@ladybirdshuttles.co.zw",
  phone: "+263 77 361 5432",
  phoneHref: "+263773615432",
};

const collectedInformation = [
  "Full name",
  "Email address",
  "Phone number or WhatsApp number",
  "Pickup location",
  "Destination",
  "Travel date and time",
  "Number of passengers",
  "Luggage or trip notes where provided",
  "Booking reference",
  "Payment reference or payment status",
  "Flight details for airport pickups, where provided",
  "Communication records relating to your booking",
];

const usageReasons = [
  "To receive and manage shuttle booking requests",
  "To confirm travel details",
  "To communicate with you about your booking",
  "To coordinate airport pickups and arrival timing",
  "To assign drivers or vehicles where applicable",
  "To process or track payments",
  "To respond to customer enquiries",
  "To improve our services and customer experience",
  "To comply with applicable legal, regulatory and operational requirements",
];

const thirdPartyServices = [
  "Website and application hosting providers",
  "Database hosting providers",
  "Email notification providers",
  "Payment service providers",
  "Google Maps or route/location services",
  "Domain, DNS and security service providers",
];

const protectionMeasures = [
  "Secure admin access controls",
  "Protected backend systems",
  "Encrypted HTTPS connections",
  "Restricted database access",
  "Environment-variable protection for secret keys",
  "Role-based access where applicable",
  "Limiting the personal data we collect",
  "Removing unnecessary sensitive fields from the public booking form",
];

const customerRights = [
  "Access the personal information we hold about you",
  "Correct inaccurate or incomplete information",
  "Request deletion of information where it is no longer required",
  "Object to certain uses of your information",
  "Ask how your information is being used",
  "Withdraw consent where processing is based on consent",
];

const policySections = [
  {
    title: "1. Who We Are",
    body: [
      "LadyBird Shuttle Services provides shuttle, private transfer, airport pickup and transport booking services in Zimbabwe.",
      "For privacy-related questions, you may contact us using the details on this page.",
    ],
  },
  {
    title: "2. Information We Collect",
    body: [
      "When you use our website or booking system, we may collect information needed to arrange, manage and support your trip.",
      "For airport pickups, we may ask you to provide flight details such as your airline and flight number. This helps us monitor your arrival and coordinate pickup timing more professionally.",
      "We do not require customers to provide national ID or passport numbers through the public booking form.",
    ],
    list: collectedInformation,
  },
  {
    title: "3. Why We Collect Your Information",
    body: [
      "We collect and use your information only where it supports booking administration, customer communication, travel coordination, payment tracking or lawful operational needs.",
    ],
    list: usageReasons,
  },
  {
    title: "4. Payment Information",
    body: [
      "Where online or electronic payments are supported, payment processing may be handled through third-party payment providers.",
      "LadyBird Shuttle Services does not ask customers to enter full bank card details directly into the LadyBird website. Payment references, payment status and transaction-related records may be stored for booking administration, reconciliation and customer support purposes.",
    ],
  },
  {
    title: "5. Third-Party Services We Use",
    body: [
      "To operate our website and booking system, we may use trusted third-party service providers. These providers may process limited information only where necessary to support booking, communication, payment, route estimation, website security or service delivery.",
    ],
    list: thirdPartyServices,
  },
  {
    title: "6. Cross-Border Processing",
    body: [
      "Some of the technology providers we use may store or process information outside Zimbabwe. Where this happens, we aim to use reputable providers and reasonable safeguards to protect customer information.",
    ],
  },
  {
    title: "7. How We Protect Your Information",
    body: [
      "We take reasonable technical and organisational measures to protect personal information from unauthorised access, loss, misuse, alteration or disclosure.",
      "No online system is completely risk-free, but we aim to maintain appropriate safeguards for the nature of the information we process.",
    ],
    list: protectionMeasures,
  },
  {
    title: "8. Data Retention",
    body: [
      "We retain personal information only for as long as reasonably necessary for booking administration, customer support, payment reconciliation, legal compliance, dispute handling and business record keeping.",
      "Where information is no longer needed, we may delete it, anonymise it or securely archive it according to operational and legal requirements.",
    ],
  },
  {
    title: "9. Your Rights",
    body: [
      "Subject to applicable law, you may make privacy requests about your personal information. To make a privacy request, contact us using the details provided in this policy.",
    ],
    list: customerRights,
  },
  {
    title: "10. Cookies and Website Analytics",
    body: [
      "Our website may use basic cookies or similar technologies to support website functionality, security, performance and analytics.",
      "If we introduce additional analytics, advertising or tracking tools, this policy may be updated to explain what is collected and how it is used.",
    ],
  },
  {
    title: "11. Children's Privacy",
    body: [
      "Our services are intended for transport bookings made by adults or authorised persons. We do not knowingly collect personal information from children without appropriate consent from a parent, guardian or responsible adult.",
    ],
  },
  {
    title: "12. Data Breaches",
    body: [
      "If we become aware of a data security incident affecting personal information, we will assess the incident and take appropriate steps in line with applicable legal and regulatory requirements.",
    ],
  },
  {
    title: "13. Changes to This Privacy Policy",
    body: [
      "We may update this Privacy Policy from time to time to reflect changes in our services, systems, legal obligations or business practices.",
      "The latest version will always be available on our website.",
    ],
  },
  {
    title: "14. Contact Us",
    body: [
      "For privacy questions or data protection requests, contact LadyBird Shuttle Services using the booking email, alternative email, phone or WhatsApp details provided below.",
      "This Privacy Policy is effective from the date stated above. LadyBird Shuttle Services reserves the right to amend this policy at any time.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div
      className="min-h-screen bg-[#030303] text-white"
      style={{
        fontFamily:
          "Inter, Montserrat, Poppins, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <PublicHeader />

      <main className="overflow-x-hidden">
        <section className="relative overflow-hidden border-b border-white/10 bg-[#030303] px-5 py-20 sm:px-6 lg:py-24">
          <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-[min(860px,86vw)] -translate-x-1/2 rounded-full bg-white/[0.055] blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                Privacy & Data Protection
              </p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
                Privacy Policy
              </h1>
              <p className="mt-6 max-w-3xl text-sm font-light leading-7 text-neutral-300 sm:text-base sm:leading-8">
                LadyBird Shuttle Services respects your privacy and is
                committed to protecting the personal information you share with
                us when using our website, booking system, transport services
                and related communication channels.
              </p>
            </div>

            <aside className="rounded-[30px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-neutral-500">
                Last updated
              </p>
              <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
                15/06/2026
              </p>
              <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm leading-6 text-neutral-300">
                <a
                  href={`mailto:${contact.bookingEmail}`}
                  className="break-words transition hover:text-white"
                >
                  {contact.bookingEmail}
                </a>
                <a
                  href={`mailto:${contact.generalEmail}`}
                  className="break-words transition hover:text-white"
                >
                  {contact.generalEmail}
                </a>
                <a
                  href={`tel:${contact.phoneHref}`}
                  className="transition hover:text-white"
                >
                  {contact.phone}
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="bg-[#F5F5F2] px-5 py-16 text-neutral-950 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 border-y border-black/10 py-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                  Customer Information
                </p>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-[1.06] tracking-[-0.04em] sm:text-4xl">
                  How we collect, use and protect booking data.
                </h2>
              </div>
              <p className="max-w-2xl text-sm font-normal leading-7 text-neutral-600 sm:text-base sm:leading-8 lg:ml-auto">
                This policy explains what information we collect, why we
                collect it, how we use it, how we protect it and what rights you
                have regarding your personal information.
              </p>
            </div>

            <div className="mt-8 rounded-[30px] border border-black/10 bg-white/80 p-6 shadow-[0_22px_90px_rgba(0,0,0,0.06)] sm:p-8">
              <p className="text-sm font-medium leading-7 text-neutral-800 sm:text-base">
                Privacy note: LadyBird Shuttle Services no longer asks
                customers for national ID or passport numbers through the public
                booking form. For airport pickups, flight details may be used to
                help coordinate arrival timing.
              </p>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              {policySections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-[30px] border border-black/10 bg-white/[0.86] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.045)] sm:p-7"
                >
                  <h3 className="text-xl font-semibold tracking-[-0.025em] text-neutral-950">
                    {section.title}
                  </h3>
                  <div className="mt-4 grid gap-3 text-sm font-normal leading-7 text-neutral-600">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>

                  {section.list && (
                    <ul className="mt-5 grid gap-2 border-t border-black/10 pt-5 text-sm leading-6 text-neutral-700 sm:grid-cols-2">
                      {section.list.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-950/50" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>

            <div className="mt-10 rounded-[34px] bg-neutral-950 p-6 text-white shadow-[0_26px_90px_rgba(0,0,0,0.18)] sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.34em] text-neutral-500">
                  Privacy Requests
                </p>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                  Need help with your information?
                </h2>
                <p className="mt-4 max-w-2xl text-sm font-light leading-7 text-neutral-300">
                  Contact the LadyBird team for privacy questions, correction
                  requests or data protection enquiries related to your booking.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 lg:mt-0">
                <Link
                  href="/booking"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-neutral-200"
                >
                  Make a Booking
                </Link>
                <a
                  href={`mailto:${contact.bookingEmail}`}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08]"
                >
                  Email LadyBird
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
