#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUTFY_INSTRUCTIONS_DIR =
  '/Users/mikelcobian/Repositorios Trabajo/socialmedia-instructions/outfy/outfy-instructions';

const THEMES = {
  expensive: {
    title: 'Look expensive, not overdressed',
    subtitle: 'Built for the Outfy 5-slide format',
    slides: [
      {
        role: 'hook',
        kicker: 'SLIDE 1',
        heading: 'Want to look expensive without trying too hard?',
        body: 'These 3 outfit directions do exactly that.',
        accent: 'Clean. Stylish. Effortless.',
      },
      {
        role: 'outfit',
        kicker: 'OUTFIT 1',
        heading: 'Minimal neutral set',
        body: 'Structured blazer, soft knit top, straight trousers, sleek bag, clean sneakers.',
        accent: 'Quiet luxury energy',
      },
      {
        role: 'outfit',
        kicker: 'OUTFIT 2',
        heading: 'Sharp denim upgrade',
        body: 'Dark denim, fitted shirt, pointed flats, gold details, elevated everyday silhouette.',
        accent: 'Polished but easy',
      },
      {
        role: 'outfit',
        kicker: 'OUTFIT 3',
        heading: 'Soft monochrome look',
        body: 'One color family, layered textures, refined accessories, simple shapes that feel premium.',
        accent: 'Low effort, high impact',
      },
      {
        role: 'cta',
        kicker: 'SLIDE 5',
        heading: 'Build better outfits faster',
        body: 'Download the app',
        accent: 'Let Outfy style it for you',
      },
    ],
  },
};

function escapeXml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapText(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function toTextGroup(lines, x, startY, fontSize, color, lineHeight, weight) {
  return lines
    .map((line, index) => {
      const y = startY + index * lineHeight;
      return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${weight}" fill="${color}" font-family="Helvetica, Arial, sans-serif">${escapeXml(line)}</text>`;
    })
    .join('\n');
}

function rolePalette(role) {
  if (role === 'hook') {
    return {
      bgStart: '#171315',
      bgEnd: '#2C1D22',
      chip: '#F3D7DF',
      chipText: '#5A2537',
      title: '#FFF7FA',
      body: '#E9D4DB',
      accentBg: '#432B33',
      accentText: '#FFD2E2',
    };
  }

  if (role === 'cta') {
    return {
      bgStart: '#F5E7DA',
      bgEnd: '#E7CDB6',
      chip: '#2F2520',
      chipText: '#FFF3EA',
      title: '#2D211B',
      body: '#503D33',
      accentBg: '#2D211B',
      accentText: '#F9E8D8',
    };
  }

  return {
    bgStart: '#F6F0EA',
    bgEnd: '#EADFD5',
    chip: '#2E2A28',
    chipText: '#FFF8F3',
    title: '#201A17',
    body: '#4A413C',
    accentBg: '#D9C3B1',
    accentText: '#3B2C22',
  };
}

function renderSlide(theme, slide, index) {
  const palette = rolePalette(slide.role);
  const headingLines = wrapText(slide.heading, 20);
  const bodyLines = wrapText(slide.body, 26);
  const accentLines = wrapText(slide.accent, 24);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <rect x="64" y="72" width="952" height="1776" rx="44" fill="rgba(255,255,255,0.18)"/>
  <rect x="92" y="112" width="190" height="54" rx="27" fill="${palette.chip}"/>
  <text x="128" y="147" font-size="26" font-weight="700" fill="${palette.chipText}" font-family="Helvetica, Arial, sans-serif">${escapeXml(
    slide.kicker
  )}</text>
  <text x="960" y="148" font-size="26" font-weight="700" fill="${palette.body}" text-anchor="end" font-family="Helvetica, Arial, sans-serif">${index + 1}/5</text>
  ${toTextGroup(headingLines, 92, 340, 82, palette.title, 94, 800)}
  ${toTextGroup(bodyLines, 92, 760, 40, palette.body, 56, 500)}
  <rect x="92" y="1380" width="760" height="170" rx="34" fill="${palette.accentBg}"/>
  ${toTextGroup(accentLines, 128, 1460, 42, palette.accentText, 54, 700)}
  <text x="92" y="1768" font-size="30" font-weight="600" fill="${palette.body}" font-family="Helvetica, Arial, sans-serif">${escapeXml(
    theme.title
  )}</text>
  <text x="92" y="1814" font-size="22" font-weight="500" fill="${palette.body}" font-family="Helvetica, Arial, sans-serif">${escapeXml(
    theme.subtitle
  )}</text>
  <defs>
    <linearGradient id="bg" x1="40" y1="40" x2="1040" y2="1880" gradientUnits="userSpaceOnUse">
      <stop stop-color="${palette.bgStart}"/>
      <stop offset="1" stop-color="${palette.bgEnd}"/>
    </linearGradient>
  </defs>
</svg>`;
}

function printHelp() {
  console.log(`Uso:
  node scripts/generate-outfy-slideshow.js [opciones]

Opciones:
  --example <expensive>      Concepto del slideshow
  --out <directorio>         Directorio de salida
  --help                     Muestra esta ayuda
`);
}

function parseArgs(argv) {
  const options = {
    example: 'expensive',
    out: path.join(process.cwd(), 'tmp', 'slides', 'outfy-expensive'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--example') {
      options.example = argv[index + 1] || options.example;
      index += 1;
      continue;
    }
    if (arg === '--out') {
      options.out = path.resolve(argv[index + 1] || options.out);
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!THEMES[options.example]) {
    console.error(`Ejemplo no valido: ${options.example}`);
    process.exit(1);
  }

  return options;
}

function validateInstructionsDir() {
  if (!fs.existsSync(OUTFY_INSTRUCTIONS_DIR)) {
    throw new Error(`Outfy instructions folder not found: ${OUTFY_INSTRUCTIONS_DIR}`);
  }

  const required = [
    'hook.jpeg',
    'outfit1.jpeg',
    'outfit2.jpeg',
    'outfit3.jpeg',
    'cta.jpeg',
    'slideshow-structure-guide.md',
  ];

  for (const file of required) {
    const fullPath = path.join(OUTFY_INSTRUCTIONS_DIR, file);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing required Outfy instruction file: ${fullPath}`);
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  validateInstructionsDir();

  const theme = THEMES[options.example];
  fs.mkdirSync(options.out, { recursive: true });

  const manifest = {
    brand: 'outfy',
    instructionsDir: OUTFY_INSTRUCTIONS_DIR,
    example: options.example,
    title: theme.title,
    subtitle: theme.subtitle,
    slides: [],
  };

  theme.slides.forEach((slide, index) => {
    const fileName = `slide-${String(index + 1).padStart(2, '0')}.svg`;
    const filePath = path.join(options.out, fileName);
    fs.writeFileSync(filePath, renderSlide(theme, slide, index), 'utf8');
    manifest.slides.push({
      file: fileName,
      role: slide.role,
      kicker: slide.kicker,
      heading: slide.heading,
      body: slide.body,
      accent: slide.accent,
    });
  });

  fs.writeFileSync(
    path.join(options.out, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log(`Outfy slideshow generado en: ${options.out}`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
