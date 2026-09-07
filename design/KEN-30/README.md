# KEN-30 - Taib Group logo in the Mitrelli footer (Version A)

Version A was chosen by Anne Claire Guilloteau and Fabio Silva on 6 August 2026,
from two placements presented as grayscale wireframes. Version B is dropped.

**Version A:** the Taib Group mark sits beside the Mitrelli mark at the right of
the footer's bottom row, separated by a hairline rule, both on one baseline. The
group mark leads and is set slightly wider, so it reads as an endorsement of the
company mark rather than as a second brand.

## What is in this folder

| File | Purpose |
| --- | --- |
| `footer-version-a-desktop.png` | Rendered footer at 1440px, for review |
| `footer-version-a-mobile.png` | Rendered footer at 390px, for review |
| `footer-template-version-a.json` | Elementor template export of the footer |

## Still outstanding

The real logo artwork has not been supplied. Anne is confirming with Aya which
version to use, with or without the English text. Until then the layout uses a
dashed placeholder box labelled `TG LOGO`, exactly as the wireframe did.

Also outstanding: the confirmed legal entity name, address and contact line to
replace the placeholders in the legal bar.

## How this reaches production

The layout and spacing live in `assets/css/footer-brand.css`, which deploys as a
normal file. The footer structure itself is Elementor content and lives in the
database, so it cannot be deployed from a local copy. Two options:

1. Import `footer-template-version-a.json` through Elementor's template import on
   production, then set it as the footer, or
2. Rebuild the small change by hand in the production footer: wrap the existing
   Mitrelli logo and a new image widget in a container with the class
   `footer-brand-lockup`, with the Taib Group logo first.

Option 2 is the safer one for a change this small, since importing a template
replaces the whole footer.

## Swapping in the real logo

Replace the placeholder heading widget (class `tg-logo-placeholder`) with an
image widget holding the approved asset. No CSS change is needed: the hairline
and spacing are attached to the container, not to the placeholder.
