# Asset generation prompts (for hi-res regeneration)

The production assets currently shipped under `public/assets/explore/` and
`public/assets/banners/` were **extracted from `Reference.png`** (the design
sheet supplied by the brand) and exported to optimized WebP. They render
crisply at the sizes this storefront actually uses (sidebar icons ~52px,
hero banner ~1344px wide).

If you want true high-resolution originals (e.g. 512×512 icons, 1920×700
banners) generated with **Gemini Image Generation** (or any image model),
use the prompts in this folder. Generate each asset **separately** (no
collages), keep the exact file names/paths below, then drop them in — no code
changes are needed, the components already point at these paths.

| Prompt file              | Output path                                  | Size        |
|--------------------------|----------------------------------------------|-------------|
| banner-1.txt             | public/assets/banners/banner-1.webp          | 1920×700    |
| banner-2.txt             | public/assets/banners/banner-2.webp          | 1920×700    |

The **Explore sidebar icons** are now hand-built, scalable SVGs in
`public/assets/explore/{best-sellers,offers,export,become-supplier}.svg`
(a premium duotone family — amber medal, rose discount tag, blue globe, green
handshake — on soft tinted circles). They're vector, so they need no regeneration.

Banner brand language (from Reference.png): soft medical colors, premium
gradients, clean studio lighting, Dr Awish Clinical Skincare.
