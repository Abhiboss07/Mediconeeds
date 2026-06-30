"use client";

import { useEffect } from "react";
import Swiper from "swiper";
import { Navigation, FreeMode, Autoplay, Pagination, Grid } from "swiper/modules";

/**
 * Progressive enhancement: the markup is the exact original (pre-rendered with
 * Swiper classes). After mount we (re)initialise Swiper on each `.swiper` block
 * so the carousels drag/auto-rotate exactly like the reference.
 */
export default function Interactions() {
  useEffect(() => {
    const instances = [];

    // --- Header buttons that are <button> (not links): wire navigation/overlay ---
    const headerBtns = Array.from(document.querySelectorAll("header button"));
    const goLogin = (e) => { e.preventDefault(); window.location.href = "/login"; };
    const openSearch = (e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("mn:open-search")); };
    headerBtns.forEach((b) => {
      const t = b.textContent.trim();
      if (t.startsWith("Login")) { b.style.cursor = "pointer"; b.addEventListener("click", goLogin); }
      else if (b.querySelector("p") && /Search for/i.test(t)) { b.style.cursor = "pointer"; b.addEventListener("click", openSearch); }
    });

    const navFor = (el) => {
      // arrows live as .prevdiv/.nextdiv inside the nearest positioned ancestor
      const scope = el.closest("#bannerdiv, .relative") || el.parentElement;
      const next = scope?.querySelector(".nextdiv");
      const prev = scope?.querySelector(".prevdiv");
      return next && prev
        ? { nextEl: next, prevEl: prev, disabledClass: "swiper-nav-disabled" }
        : undefined;
    };

    document.querySelectorAll(".swiper").forEach((el) => {
      if (el.swiper) return;
      const cls = el.className;
      const isBanner = !!el.closest("#bannerdiv");
      const isProductRow =
        cls.includes("swiper-free-mode") || cls.includes("swiper-auto-width");
      const isThird = cls.includes("swiper-third-width-slides");
      const isTestimonial = cls.includes("testimonial");

      let opts = {
        modules: [Navigation, FreeMode, Autoplay, Pagination, Grid],
        observer: true,
        observeParents: true,
        resizeObserver: true,
      };

      if (isBanner) {
        opts = {
          ...opts,
          loop: true,
          slidesPerView: 1,
          speed: 600,
          autoplay: { delay: 4000, disableOnInteraction: false },
          navigation: navFor(el),
        };
      } else if (isProductRow) {
        opts = {
          ...opts,
          slidesPerView: "auto",
          spaceBetween: 0, // slides carry their own margin-right:18px
          freeMode: true,
          navigation: navFor(el),
        };
      } else if (isThird) {
        opts = {
          ...opts,
          slidesPerView: 1.1,
          spaceBetween: 16,
          breakpoints: {
            768: { slidesPerView: 2.2 },
            1024: { slidesPerView: 3 },
          },
          navigation: navFor(el),
        };
      } else if (isTestimonial) {
        opts = {
          ...opts,
          slidesPerView: "auto",
          spaceBetween: 16,
          freeMode: true,
        };
      } else {
        opts = { ...opts, slidesPerView: "auto", spaceBetween: 0 };
      }

      try {
        instances.push(new Swiper(el, opts));
      } catch (e) {
        /* a malformed block shouldn't break the rest of the page */
      }
    });

    return () => instances.forEach((s) => s && s.destroy && s.destroy(true, true));
  }, []);

  return null;
}
