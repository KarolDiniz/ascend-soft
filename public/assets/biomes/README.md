# Biome scenery sprites (optional)

Place transparent PNGs here to replace/augment procedural silhouettes.

```
public/assets/biomes/
  garden/
    far.png      # wide backdrop silhouettes (leaves, citrus) — 768–1024px wide
    mid.png      # mid props
    accent.png   # sparse accent layer
  bakery/
    far.png
    mid.png
    accent.png
  spa/
    …
  frost/
    …
  ether/
    …
```

## Guidelines
- Transparent background (PNG)
- Soft pastel / ASMR palette matching the zone
- Avoid busy details that compete with platforms
- Suggested size: **768–1024** wide, height as needed
- If a file is missing, the game uses procedural canvas props only

Procedural props always draw; sprites layer on top when loaded.
