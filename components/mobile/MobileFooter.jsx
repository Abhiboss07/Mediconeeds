"use client";

import { useId, useState } from "react";

/**
 * Mobile-only site footer.
 *
 * Replaces the captured static fragment (components/mobile/footer.html), whose
 * rows carried a chevron but were plain <a> tags — tapping anywhere navigated
 * away, so the affordance lied. Here each row is a real accordion: the header
 * only expands/collapses, and navigation happens exclusively through the links
 * and the "view more" CTA inside the open panel.
 *
 * Desktop (>= lg) still renders components/sections/footer.html untouched; this
 * tree only ever mounts inside the `lg:hidden` branch of the page shell.
 */

const SECTIONS = [
  {
    id: "about",
    title: "ABOUT US",
    summary:
      "Mediconeeds by Dr. Awish Clinic is dedicated to dermatologist-approved skincare solutions designed to deliver safe, effective, and science-backed results.",
    cta: [
      { label: "Learn More", href: "/about", variant: "primary" },
      { label: "About Dr. Awish", href: "/about", variant: "ghost" },
    ],
  },
  {
    id: "shop",
    title: "ONLINE SHOP",
    links: [
      { label: "Shop All Products", href: "/products" },
      { label: "Best Sellers", href: "/bestsellers" },
      { label: "New Arrivals", href: "/products?sort=newest" },
      { label: "Offers", href: "/offers" },
      { label: "Categories", href: "/shop" },
    ],
    cta: [{ label: "View Complete Shop", href: "/products", variant: "primary" }],
  },
  {
    id: "clinic",
    title: "OUR CLINIC",
    summary:
      "Learn about our treatments, experienced dermatologists, advanced technology, and patient care services.",
    links: [
      { label: "Treatments", href: "/consultation" },
      { label: "Doctors", href: "/about" },
      { label: "Contact Clinic", href: "/contact" },
    ],
    cta: [{ label: "View Clinic", href: "/contact", variant: "primary" }],
  },
  {
    id: "policy",
    title: "POLICY & FAQ",
    links: [
      { label: "FAQs", href: "/faq" },
      { label: "Privacy Policy", href: "/policy/privacy" },
      { label: "Refund Policy", href: "/policy/returns" },
      { label: "Shipping Policy", href: "/policy/shipping" },
      { label: "Terms & Conditions", href: "/policy/terms" },
    ],
    cta: [{ label: "View All Policies", href: "/faq", variant: "primary" }],
  },
  {
    id: "improve",
    title: "HELP US IMPROVE",
    summary:
      "We value your feedback. Help us improve your shopping and consultation experience.",
    cta: [
      { label: "Give Feedback", href: "/contact?topic=feedback", variant: "primary" },
      { label: "Contact Support", href: "/contact", variant: "ghost" },
    ],
  },
];

const SOCIALS = [
  { href: "https://www.facebook.com/awishclinic", label: "Facebook", src: "/assets/fb.png", alt: "facebook" },
  { href: "https://www.instagram.com/drawishclinic", label: "Instagram", src: "/assets/instagram.png", alt: "instagram" },
  { href: "https://www.youtube.com/@awishclinic", label: "YouTube", src: "/assets/yt.png", alt: "youtube" },
];

function Chevron({ open }) {
  return (
    <svg
      width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"
      className="shrink-0 transition-transform duration-[250ms] ease-out motion-reduce:transition-none"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41Z" fill="#fff" />
    </svg>
  );
}

function ctaClass(variant) {
  const base =
    "inline-flex items-center justify-center gap-1 min-h-[44px] px-4 rounded-full text-[13px] font-700 " +
    "transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
  return variant === "ghost"
    ? `${base} border border-[#FFFFFF66] text-[#fff] active:bg-[#FFFFFF1A]`
    : `${base} bg-[#fff] text-[#181818] active:bg-[#E6E6E6]`;
}

function Section({ section, open, onToggle }) {
  const uid = useId();
  const panelId = `mf-panel-${section.id}-${uid}`;
  const headerId = `mf-header-${section.id}-${uid}`;

  return (
    <div className="border-t-[0.5px] border-[#FFFFFF4D] last:border-b-[0.5px]">
      <h3 className="m-0">
        <button
          type="button"
          id={headerId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-3 min-h-[56px] py-5 text-left text-sm font-600 text-[#fff] bg-transparent border-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
        >
          <span>{section.title}</span>
          <Chevron open={open} />
        </button>
      </h3>

      {/* 0fr -> 1fr grid animates to the panel's natural height without any
          measurement, so nothing shifts and there is no max-height guess. */}
      <div
        className="grid transition-[grid-template-rows] duration-[250ms] ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        {/* `visibility` (not `hidden`) keeps the collapse animation intact while
            still pulling the collapsed links out of the tab order. */}
        <div
          className="overflow-hidden motion-reduce:transition-none"
          style={{
            visibility: open ? "visible" : "hidden",
            transition: "visibility 250ms",
          }}
        >
          <div
            id={panelId}
            role="region"
            aria-labelledby={headerId}
            className="mb-5 rounded-xl bg-[#FFFFFF0F] p-4"
          >
            {section.summary && (
              <p className="m-0 text-[13px] leading-[20px] text-[#FFFFFFCC]">{section.summary}</p>
            )}

            {section.links && (
              <ul className={`list-none m-0 p-0 ${section.summary ? "mt-3 pt-3 border-t-[0.5px] border-[#FFFFFF33]" : ""}`}>
                {section.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="flex items-center min-h-[44px] text-[13px] font-500 text-[#FFFFFFE6] active:text-[#fff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white rounded-md"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {section.cta && (
              <div className={`flex flex-wrap gap-2 ${section.summary || section.links ? "mt-4" : ""}`}>
                {section.cta.map((c) => (
                  <a key={c.label} href={c.href} className={ctaClass(c.variant)}>
                    {c.label} <span aria-hidden="true">→</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileFooter() {
  // Single value, not a set: only one section stays open at a time.
  const [openId, setOpenId] = useState(null);

  return (
    <div className="block bg-[#181818] w-full text-xs font-400 text-[#fff]">
      <div className="pt-8 pb-32 w-full px-4">
        {SECTIONS.map((s) => (
          <Section
            key={s.id}
            section={s}
            open={openId === s.id}
            onToggle={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
          />
        ))}

        <div className="text-sm font-600 mt-[1.63rem]">
          <div className="flex gap-4 mt-6">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                <img className="h-full w-full object-contain" src={s.src} alt={s.alt} />
              </a>
            ))}
          </div>
        </div>

        <div className="pt-6 font-normal text-[0.55rem] leading-5 tracking-normal text-center">
          @Copyright <span className="font-700">Mediconeeds · Dr Awish Clinic</span>
        </div>
      </div>
    </div>
  );
}
