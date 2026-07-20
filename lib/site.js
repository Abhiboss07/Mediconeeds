// ============================================================================
// SITE CONFIG — single source of truth for Mediconeeds branding & content.
// Storefront brand: Mediconeeds. Products/clinic: Dr Awish skincare.
// Contact details are the real Dr Awish Clinic (awishclinic.com) details.
// Nothing visible should be hardcoded in pages — read from here.
// ============================================================================

export const site = {
  brand: {
    name: "Mediconeeds",
    // Two-tone wordmark used in header/footer (matches cloned logo treatment).
    wordmark: [
      { text: "Medico", color: "#1F3580" },
      { text: "needs", color: "#3056D3" },
    ],
    tagline: "Dermatologist-formulated skincare, delivered",
    poweredBy: "Dr Awish Clinic",
  },

  contact: {
    addressLines: ["232, Pocket J, Sarita Vihar,", "New Delhi, Delhi 110076"],
    addressOneLine: "232, Pocket J, Sarita Vihar, New Delhi, Delhi 110076",
    phoneDisplay: "+91 9310032619",
    phoneTel: "+919310032619",
    email: "info@awishclinic.com",
    whatsapp: "919310032619",
    hours: "Mon–Sat, 10:00 AM – 7:00 PM IST",
    mapQuery: "232 Pocket J Sarita Vihar New Delhi 110076",
  },

  social: {
    instagram: "https://www.instagram.com/drawishclinic",
    facebook: "https://www.facebook.com/awishclinic",
    youtube: "https://www.youtube.com/@awishclinic",
  },

  seo: {
    title: "Mediconeeds — Dermatologist-Formulated Skincare Online",
    description:
      "Shop dermatologist-formulated skincare from Dr Awish — sunscreens, serums, cleansers, moisturisers and more. Clinically tested, cruelty-free, India-wide delivery.",
    keywords:
      "skincare online, dermatologist skincare, sunscreen, vitamin c serum, niacinamide, hyaluronic acid, Dr Awish, Mediconeeds",
    ogImage: "/assets/Main_Doctor.jpg",
    canonical: "https://mediconeeds.com",
    locale: "en_IN",
  },

  // Footer columns (skincare-appropriate, mapped onto the cloned 4-column layout).
  footer: {
    about:
      "Mediconeeds brings you dermatologist-formulated skincare by Dr Awish — clinically tested, cruelty-free formulations for everyday healthy skin.",
    columns: [
      {
        title: "ABOUT US",
        links: [
          { label: "Our Story", href: "/about" },
          { label: "Dr Awish Clinic", href: "/about" },
          { label: "Blogs", href: "/blog" },
        ],
      },
      {
        title: "SHOP",
        links: [
          { label: "Sunscreen", href: "/products?category=sunscreen" },
          { label: "Serum", href: "/products?category=serum" },
          { label: "Cleanser", href: "/products?category=cleanser" },
          { label: "Moisturiser", href: "/products?category=moisturiser" },
          { label: "Face Cream", href: "/products?category=cream" },
          { label: "Hair Care", href: "/products?category=hair" },
          { label: "Shop by Ingredient", href: "/products" },
        ],
      },
      {
        title: "HELP",
        links: [
          { label: "Contact Us", href: "/contact" },
          { label: "Skin Consultation", href: "/contact" },
          { label: "Order Tracking", href: "/account" },
          { label: "Shipping Policy", href: "/policy/shipping" },
        ],
      },
      {
        title: "POLICY & FAQ",
        links: [
          { label: "FAQ", href: "/faq" },
          { label: "Returns & Refunds", href: "/policy/returns" },
          { label: "Terms of Use", href: "/policy/terms" },
          { label: "Privacy Policy", href: "/policy/privacy" },
        ],
      },
    ],
    copyright: "© 2026 Mediconeeds (Dr Awish Clinic). All rights reserved.",
  },

  // Trust badges reused from Dr Awish brand language.
  trust: [
    "Dermatologist Approved",
    "Clinically Tested",
    "Cruelty Free",
    "Free Shipping",
    "Easy Returns",
    "COD Available",
  ],

  // Top utility / header secondary links.
  topLinks: [
    { label: "Skin Consultation", href: "/contact" },
    { label: "Refurbished", href: "#" },
    { label: "Track Order", href: "/account" },
    { label: "Become a Partner", href: "#" },
  ],
};

// REAL Dr Awish customer testimonials (from the Shopify theme).
export const testimonials = [
  { name: "Tanushvi Mehta", city: "Mumbai", rating: "5.0", verified: true,
    title: "Lightweight & Invisible",
    text: "This sunscreen lotion 50+ PA+++ is fantastic! It keeps my skin safe from the sun while feeling lightweight and invisible. Highly recommend it!",
    image: "/drawish/Tanushvi_Mehta.jpg" },
  { name: "Shivaani Mishra", city: "Delhi", rating: "4.9", verified: true,
    title: "A Game-Changer for My Skin",
    text: "Dr. Awish Glutathione Face Wash has been a game-changer! It brightens my complexion and reduces dark spots, leaving my skin looking flawless and radiant.",
    image: "/drawish/ShivaaniMishra.png" },
  { name: "Shweta Sharma", city: "Pune", rating: "5.0", verified: true,
    title: "Fresh & Radiant Every Day",
    text: "Dr. Awish Body Wash has transformed my skin! The gentle formula is perfect for daily use, providing deep cleansing without drying out my skin.",
    image: "/drawish/Shweta_Sharma.jpg" },
  { name: "Purab Singh", city: "Jaipur", rating: "4.8", verified: true,
    title: "Super Fast Delivery",
    text: "I received my order within 3 days and the packaging was excellent. Genuine products and great service.",
    image: "/assets/avatar.svg" },
  { name: "Ananya Rao", city: "Bengaluru", rating: "4.9", verified: true,
    title: "Visible Results in Weeks",
    text: "Started using the retinol serum a month ago and my skin texture is noticeably smoother. Gentle yet effective.",
    image: "/assets/avatar.svg" },
  { name: "Kabir Anand", city: "Hyderabad", rating: "5.0", verified: true,
    title: "Perfect for Sensitive Skin",
    text: "No irritation at all and my acne has calmed down a lot. Finally a brand that works for sensitive skin.",
    image: "/assets/avatar.svg" },
];

// REAL hero slides (from the Shopify theme slideshow).
export const heroSlides = [
  { heading: "Dermatologist-Backed Skincare", sub: "Science-led formulas for visible results", cta: "Shop Now", href: "/products?category=skincare" },
  { heading: "Target Every Concern", sub: "Acne, pigmentation, dullness & more", cta: "Explore", href: "/products?category=acne" },
];

// REAL About content (from the Shopify theme).
export const about = {
  logo: "/drawish/Untitled_design_-_2025-04-10T120038.944.png",
  storyImage: "/drawish/about-hero.webp",
  meetImage: "/drawish/vgfgf.jpg",
  greeting: "Glad to meet you!",
  mission:
    "At Dr. Awish, we are committed to revolutionizing skin care by merging medical expertise with innovative formulations. Our mission is to empower you with products that not only enhance your natural beauty but also protect and nourish your skin.",
  storyTitle: "Radiance Reimagined: The Dr. Awish Story of Integrity and Innovation in Skincare",
  story: [
    "In a world overwhelmed by quick fixes and cosmetic promises, one dermatologist, Dr. Awish, dreamed of something different — a skincare line where integrity met innovation, and where every product delivered on its promise. This dream laid the foundation for Dr. Awish, a brand that began as a small idea in a dermatologist's office and grew into a beacon of hope for everyone seeking honest, effective skin care.",
    "Driven by the conviction that good skin is a blend of science and sincerity, Dr. Awish collaborated with fellow dermatologists and researchers to create a line of products grounded in medical expertise and backed by rigorous scientific research. Each formula, from rejuvenating serums to nourishing creams, is a testament to our commitment to quality and safety, ensuring that beauty is always a result of health.",
    "Dr. Awish adopted sustainable practices and pledged against animal testing, proving that a business can flourish while respecting the planet and all its inhabitants. Today, Dr. Awish is more than a skincare brand — it's a movement towards transparency, education, and empowerment in skincare.",
  ],
  doctor: {
    name: "Dr. Awish",
    title: "Founder & Lead Dermatologist",
    org: "Dr Awish Clinic · Youngness Institute",
    experience: "10+ years in clinical dermatology & training",
    image: "/assets/Main_Doctor.jpg",
  },
  stats: [
    { value: "2,000+", label: "Happy Customers" },
    { value: "10+", label: "Years of Expertise" },
    { value: "100%", label: "Cruelty-Free" },
    { value: "4.9★", label: "Average Rating" },
  ],
};

// REAL FAQ (from the Shopify theme).
export const faqs = [
  { q: "What makes Dr. Awish products different?",
    a: "Dr. Awish products are dermatologist-developed formulations designed with evidence-based ingredients and clinically inspired skincare principles." },
  { q: "Are Dr. Awish products suitable for sensitive skin?",
    a: "Most Dr. Awish products are formulated to be gentle and suitable for sensitive skin, but patch testing is always recommended before full use." },
  { q: "Are the products tested by dermatologists?",
    a: "Yes. Our formulations are developed with dermatological expertise and are designed to meet high standards of safety and effectiveness." },
  { q: "Do Dr. Awish products contain harmful chemicals?",
    a: "Our formulations focus on safe, effective ingredients and avoid unnecessary harsh additives wherever possible." },
  { q: "Are Dr. Awish products cruelty-free?",
    a: "We are committed to ethical skincare practices and continuously work toward responsible product development and testing standards." },
  { q: "How can I choose the right products for my skin?",
    a: "Use our Skin Assessment tool to receive personalized skincare recommendations based on your skin type and concerns." },
];

export default site;
