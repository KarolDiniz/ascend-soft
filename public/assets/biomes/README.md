# Biome scenery sprites (optional)

Place transparent PNGs here to replace/augment procedural silhouettes and horizons.

```
public/assets/biomes/
  butter/       far.png  mid.png  accent.png
  jelly/        far.png  mid.png  accent.png
  honeycomb/    far.png  mid.png  accent.png
  keyboard/     far.png  mid.png  accent.png
  kitten/       far.png  mid.png  accent.png
  ... (one folder per MaterialId — 35 total)
```

Folder names must match `MaterialId` in `src/audio/materials.ts` (e.g. `bubbleWrap`, `iceSoap`, `clearSlime`).

## Guidelines
- Transparent PNG, soft pastel / ASMR palette
- Size: **768–1024** wide
- Avoid busy details that compete with platforms
- Missing files → procedural props + horizon silhouettes only

## Layer roles
| File | Role | Suggested alpha when drawn |
|------|------|---------------------------|
| `far.png` | Distant world silhouette | subtle, wide |
| `mid.png` | Floating themed elements | medium |
| `accent.png` | One or two focal details | lightest |

## Quick AI prompts (examples)

- **butter far**: soft golden melt hills and cream cloud silhouettes, pastel `#F3E2A8`, ASMR food, transparent PNG
- **jelly mid**: translucent mint jelly cubes floating, soft seafoam, transparent
- **honeycomb far**: giant hexagonal honeycomb pattern silhouette, amber pastel, transparent
- **keyboard far**: mini keyboard key skyline, cream grey soft, transparent
- **soapBubble mid**: giant soap bubbles and foam crests, aqua lavender, transparent
- **iceSoap far**: soft ice crystal peaks, pale blue white frost, transparent
- **kitten accent**: yarn balls and paw prints, blush pink, transparent
- **marimba mid**: resonating wooden bars and chimes, warm butter tones, transparent
- **kinetic far**: soft sand dune silhouettes, warm sand pastel, transparent

Procedural decor, horizons, and particles always draw; sprites layer on top when loaded.
