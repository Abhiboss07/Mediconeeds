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
| icon-explore.txt         | public/assets/explore/explore.webp           | 512×512     |
| icon-concern.txt         | public/assets/explore/concern.webp           | 512×512     |
| icon-category.txt        | public/assets/explore/category.webp          | 512×512     |
| icon-ingredients.txt     | public/assets/explore/ingredients.webp       | 512×512     |
| banner-1.txt             | public/assets/banners/banner-1.webp          | 1920×700    |
| banner-2.txt             | public/assets/banners/banner-2.webp          | 1920×700    |

Brand language (from Reference.png): soft medical colors, premium gradients,
clean studio lighting, Dr Awish Clinical Skincare. Icon family = circular soft
tint per icon (sage / blush / sage / beige), one thin charcoal line-art glyph
with a small green accent, consistent circle size and stroke weight across all four.
