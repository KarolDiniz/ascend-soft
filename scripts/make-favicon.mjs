import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const png48 = readFileSync(join(PUBLIC, 'favicon-48.png'));
const b64 = png48.toString('base64');
const data = `data:image/png;base64,${b64}`;

writeFileSync(
  join(PUBLIC, 'favicon.svg'),
  `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <image width="48" height="48" href="${data}"/>
</svg>
`,
);

writeFileSync(
  join(PUBLIC, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Ascend Soft',
      short_name: 'Ascend',
      description: 'Torre sensorial ASMR. Suba. Pouse. Ouça.',
      start_url: './',
      display: 'standalone',
      background_color: '#d9b0b0',
      theme_color: '#d9b0b0',
      icons: [
        { src: './favicon-48.png', sizes: '48x48', type: 'image/png' },
        { src: './favicon-192.png', sizes: '192x192', type: 'image/png' },
        { src: './apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        { src: './og-image.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    null,
    2,
  ),
);

console.log('favicon.svg e manifesto atualizados');
