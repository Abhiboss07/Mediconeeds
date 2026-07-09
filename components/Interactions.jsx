"use client";

import { useEffect } from "react";
import Swiper from "swiper";
import { Navigation, FreeMode, Autoplay, Pagination, Grid } from "swiper/modules";
import { signOut } from "next-auth/react";
import { landingFor } from "@/components/auth/helpers";

/**
 * Progressive enhancement: the markup is the exact original (pre-rendered with
 * Swiper classes). After mount we (re)initialise Swiper on each `.swiper` block
 * and make the (static) header session-aware: the "Login / Signup" control
 * becomes an account menu with logout when a session exists.
 */
export default function Interactions() {
  useEffect(() => {
    const instances = [];
    const cleanups = [];

    // --- Header buttons ------------------------------------------------------
    const headerBtns = Array.from(document.querySelectorAll("header button"));
    const goLogin = (e) => { e.preventDefault(); window.location.href = "/login"; };
    const openSearch = (e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent("mn:open-search")); };
    headerBtns.forEach((b) => {
      const t = b.textContent.trim();
      if (b.querySelector("p") && /Search for/i.test(t)) { b.style.cursor = "pointer"; b.addEventListener("click", openSearch); }
    });

    // --- Session-aware account control --------------------------------------
    let menuEl = null;
    const loginBtn = headerBtns.find((b) => b.textContent.trim().startsWith("Login"));
    const mobileAcct = document.querySelector('header a[href="/account"]');

    function buildMenu(landing) {
      const el = document.createElement("div");
      el.style.cssText = "position:absolute;z-index:1000;min-width:190px;background:#fff;border:1px solid rgba(14,27,77,.12);border-radius:12px;box-shadow:0 12px 30px rgba(14,27,77,.16);padding:6px;display:none;";
      const item = "display:block;width:100%;text-align:left;padding:9px 12px;border-radius:8px;font-family:system-ui;font-size:13px;font-weight:600;color:#0e1b4d;text-decoration:none;background:none;border:none;cursor:pointer;";
      el.innerHTML =
        `<a data-go style="${item}">My Dashboard</a>` +
        `<a href="/account" style="${item}">Account</a>` +
        `<button type="button" data-logout style="${item}color:#d23f3f;font-weight:700;">Log out</button>`;
      document.body.appendChild(el);
      el.querySelector("[data-go]").setAttribute("href", landing);
      el.querySelector("[data-logout]").addEventListener("click", () => signOut({ callbackUrl: "/" }));
      return el;
    }
    function toggleMenu(anchor, landing) {
      if (!menuEl) menuEl = buildMenu(landing);
      if (menuEl.style.display === "block") { menuEl.style.display = "none"; return; }
      const r = anchor.getBoundingClientRect();
      menuEl.style.top = window.scrollY + r.bottom + 8 + "px";
      menuEl.style.left = window.scrollX + r.right - 190 + "px";
      menuEl.style.display = "block";
    }
    const onDocClick = (e) => {
      if (menuEl && menuEl.style.display === "block" && !menuEl.contains(e.target) && e.target !== loginBtn && !loginBtn?.contains(e.target))
        menuEl.style.display = "none";
    };

    (async () => {
      let user = null;
      try { user = (await (await fetch("/api/auth/session")).json())?.user ?? null; } catch {}
      if (user) {
        const first = (user.name || "Account").split(" ")[0];
        const landing = landingFor(user.role, user.sellerStatus);
        if (loginBtn) {
          const host = loginBtn.querySelector("div") || loginBtn;
          host.childNodes.forEach((n) => { if (n.nodeType === 3 && /login/i.test(n.nodeValue)) n.nodeValue = `Hi, ${first}`; });
          loginBtn.style.cursor = "pointer";
          loginBtn.addEventListener("click", (e) => { e.preventDefault(); toggleMenu(loginBtn, landing); });
          document.addEventListener("click", onDocClick);
        }
        if (mobileAcct) mobileAcct.setAttribute("href", landing);
      } else {
        if (loginBtn) { loginBtn.style.cursor = "pointer"; loginBtn.addEventListener("click", goLogin); }
        if (mobileAcct) mobileAcct.setAttribute("href", "/login");
      }
    })();

    cleanups.push(() => { document.removeEventListener("click", onDocClick); menuEl?.remove(); });

    // --- Swiper carousels ----------------------------------------------------
    const navFor = (el) => {
      const scope = el.closest("#bannerdiv, .relative") || el.parentElement;
      const next = scope?.querySelector(".nextdiv");
      const prev = scope?.querySelector(".prevdiv");
      return next && prev ? { nextEl: next, prevEl: prev, disabledClass: "swiper-nav-disabled" } : undefined;
    };

    document.querySelectorAll(".swiper").forEach((el) => {
      if (el.swiper) return;
      const cls = el.className;
      const isBanner = !!el.closest("#bannerdiv");
      const isProductRow = cls.includes("swiper-free-mode") || cls.includes("swiper-auto-width");
      const isThird = cls.includes("swiper-third-width-slides");
      const isTestimonial = cls.includes("testimonial");

      let opts = { modules: [Navigation, FreeMode, Autoplay, Pagination, Grid], observer: true, observeParents: true, resizeObserver: true };

      if (isBanner) {
        opts = { ...opts, loop: true, slidesPerView: 1, speed: 600, autoplay: { delay: 4000, disableOnInteraction: false }, navigation: navFor(el) };
      } else if (isProductRow) {
        opts = { ...opts, slidesPerView: "auto", spaceBetween: 0, freeMode: true, navigation: navFor(el) };
      } else if (isThird) {
        opts = { ...opts, slidesPerView: 1.1, spaceBetween: 16, breakpoints: { 768: { slidesPerView: 2.2 }, 1024: { slidesPerView: 3 } }, navigation: navFor(el) };
      } else if (isTestimonial) {
        opts = { ...opts, slidesPerView: "auto", spaceBetween: 16, freeMode: true };
      } else {
        opts = { ...opts, slidesPerView: "auto", spaceBetween: 0 };
      }

      try { instances.push(new Swiper(el, opts)); } catch (e) { /* a malformed block shouldn't break the page */ }
    });

    return () => {
      instances.forEach((s) => s && s.destroy && s.destroy(true, true));
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return null;
}
