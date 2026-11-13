import Link from '@/components/SiteLink';
import { siteConfig } from '@/lib/shenhe.config';

/**
 * THE TRUST STRIP — the first line of every page.
 *
 * WHY IT EXISTS
 *
 * A buyer's first question is "is this a real, licensed factory", and the
 * site used to answer it four scrolls down: the licence numbers were on
 * /certifications.html, the address in the footer, the trade route nowhere.
 * A competitor's site answers it before the logo loads — one line with a
 * certificate number, its expiry date, where the plant is, and a way in for
 * a reseller.
 *
 * WHAT MAKES THIS ONE CREDIBLE
 *
 * It quotes the two things a buyer can check without asking us: the licence
 * NUMBER as printed on the scan, and its EXPIRY DATE. Not "certified",
 * not "GMP compliant" — a string and a date. The same two strings appear on
 * /certifications.html, in the FAQ answer, and here; three copies of one
 * checkable fact is what makes it a fact rather than a claim.
 *
 * WHY THE HIGH-TECH CERTIFICATE IS NOT HERE
 *
 * It is issued to Shenzhen Yongsheng Environmental Engineering, a related
 * company, and is displayed on the certifications page as exactly that. A
 * strip that led with it would be wearing another entity's credential.
 *
 * WHY IT SITS OUTSIDE THE STICKY HEADER
 *
 * The header sticks because navigation is a tool you reach for mid-page.
 * This strip is a statement you read once, at the top — pinned to the
 * viewport it would eat 36px of every screen for the rest of the session.
 * So it scrolls away; the header keeps sticking.
 */
export function TrustBar() {
  const licence = siteConfig.licences[0];

  return (
    <div
      data-shenhe-trust-strip={licence.id}
      className="w-full bg-[#0B1F1D] text-white"
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2 sm:px-6 md:px-10">
        {/* The licence: name, number as printed, expiry date.
            On a narrow screen the number is what matters, so the name is
            dropped and the date stays — a reader checking a licence wants
            the string and the date, not our description of it. */}
        <p className="flex min-w-0 items-center gap-2 text-[12.5px] leading-tight">
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#7FD3C9]"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span className="min-w-0 truncate text-[#E7F2F0]">
            <span className="text-white/55 sm:hidden">Licence · </span>
            <span className="font-medium">{licence.number}</span>
            <span className="mx-1.5 text-white/25">·</span>
            valid to {licence.validToLabel}
            <span className="hidden text-white/55 sm:inline">
              {' '}
              ({licence.name})
            </span>
          </span>
        </p>

        {/* Where the plant is, and the route for a reseller. The location
            drops first because it is the least searchable of the three
            facts on this bar; the reseller route never drops, because it
            is the only entry on the site aimed at a distributor rather
            than a brand. */}
        <div className="flex shrink-0 items-center gap-4 text-[12.5px] leading-tight">
          <span className="hidden text-white/60 lg:inline">{siteConfig.brand.location}</span>
          <Link
            href="/trade-programme.html"
            className="group inline-flex items-center gap-1 font-medium text-white underline decoration-[#7FD3C9] decoration-1 underline-offset-4 hover:decoration-white"
          >
            <span className="md:hidden">Reseller programme</span>
            <span className="hidden md:inline">Are you a reseller? Join our trade programme</span>
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              ›
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
