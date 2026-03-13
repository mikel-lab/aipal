#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const THEMES = {
  detector: {
    title: 'Detector de gastos invisibles',
    subtitle: 'Inspirado en el angulo "aidetector" del informe de Creative Center',
    slides: [
      {
        kicker: 'SLIDE 1',
        heading: 'No eres malo con el dinero.',
        body: 'Solo hay 3 gastos invisibles que se comen tu mes sin que te des cuenta.',
        accent: 'Detecta antes de recortar',
      },
      {
        kicker: 'GASTO INVISIBLE 1',
        heading: 'Suscripciones olvidadas',
        body: 'Pagas pequeno, pero pagas todos los meses. Y eso engancha mas que un gasto grande.',
        accent: 'Revisa cargos recurrentes',
      },
      {
        kicker: 'GASTO INVISIBLE 2',
        heading: 'Compras rapidas sin filtro',
        body: 'Cafe, delivery, extras y "solo hoy". No duelen por separado. Juntos te rompen el margen.',
        accent: 'Microgasto = macrofuga',
      },
      {
        kicker: 'GASTO INVISIBLE 3',
        heading: 'Pagar por comodidad',
        body: 'Envios, upgrades, pagos flexibles y compras impulsivas cuando vas cansado.',
        accent: 'Lo facil tambien cuesta',
      },
      {
        kicker: 'CTA',
        heading: 'Haz esta prueba antes de comprar',
        body: 'Preguntate: "Si lo paso por Spendwise, me diria que de verdad me lo puedo permitir?"',
        accent: 'Controla antes de gastar',
      },
    ],
  },
  springbreak: {
    title: 'Spring break budget',
    subtitle: 'Inspirado en la senal estacional detectada en Creative Center',
    slides: [
      {
        kicker: 'SLIDE 1',
        heading: 'Spring break no arruina tu mes.',
        body: 'Ir sin plan si.',
        accent: 'Presupuesto rapido en 5 pasos',
      },
      {
        kicker: 'PASO 1',
        heading: 'Pon un limite real',
        body: 'No pongas "lo que surja". Pon una cifra que puedas perder sin tocar tus gastos base.',
        accent: 'Limite antes de salir',
      },
      {
        kicker: 'PASO 2',
        heading: 'Divide por categorias',
        body: 'Transporte, comida, ocio y extras. Si no lo separas, te engana.',
        accent: 'Verlo claro reduce impulsos',
      },
      {
        kicker: 'PASO 3',
        heading: 'Deja un colchon',
        body: 'Guarda un 15-20% para imprevistos. Si no aparece, mejor para ti.',
        accent: 'Margen = tranquilidad',
      },
      {
        kicker: 'CTA',
        heading: 'Antes de pagar, pasa el test',
        body: 'Si ese plan te deja apretado el resto del mes, no es una compra ligera.',
        accent: 'Decision > impulso',
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

function renderSlide(theme, slide, index) {
  const bodyLines = wrapText(slide.body, 28);
  const headingLines = wrapText(slide.heading, 18);
  const accentLines = wrapText(slide.accent, 22);
  const badge = `${index + 1}/5`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1920" fill="#0E1A1F"/>
  <rect x="56" y="56" width="968" height="1808" rx="48" fill="url(#cardBg)"/>
  <circle cx="910" cy="250" r="210" fill="#173B45" fill-opacity="0.35"/>
  <circle cx="180" cy="1620" r="240" fill="#0BBF8A" fill-opacity="0.12"/>
  <rect x="96" y="112" width="170" height="52" rx="26" fill="#0BBF8A"/>
  <text x="126" y="146" font-size="26" font-weight="700" fill="#062C23" font-family="Helvetica, Arial, sans-serif">${escapeXml(
    slide.kicker
  )}</text>
  <text x="890" y="148" font-size="26" font-weight="700" fill="#9BC4BC" text-anchor="end" font-family="Helvetica, Arial, sans-serif">${badge}</text>
  ${toTextGroup(headingLines, 96, 320, 84, '#F5FBF8', 96, 800)}
  ${toTextGroup(bodyLines, 96, 760, 42, '#C6DDD6', 58, 500)}
  <rect x="96" y="1430" width="720" height="172" rx="36" fill="#102B31" stroke="#234953"/>
  ${toTextGroup(accentLines, 132, 1510, 44, '#7EF2CB', 56, 700)}
  <text x="96" y="1764" font-size="32" font-weight="600" fill="#88A8A0" font-family="Helvetica, Arial, sans-serif">${escapeXml(
    theme.title
  )}</text>
  <text x="96" y="1814" font-size="24" font-weight="500" fill="#5E7B74" font-family="Helvetica, Arial, sans-serif">${escapeXml(
    theme.subtitle
  )}</text>
  <defs>
    <linearGradient id="cardBg" x1="88" y1="56" x2="1006" y2="1864" gradientUnits="userSpaceOnUse">
      <stop stop-color="#12252B"/>
      <stop offset="1" stop-color="#081014"/>
    </linearGradient>
  </defs>
</svg>`;
}

function printHelp() {
  console.log(`Uso:
  node scripts/generate-spendwise-slideshow.js [opciones]

Opciones:
  --example <detector|springbreak>   Elige el concepto de slideshow
  --out <directorio>                 Directorio de salida
  --help                             Muestra esta ayuda
`);
}

function parseArgs(argv) {
  const options = {
    example: 'detector',
    out: path.join(process.cwd(), 'tmp', 'slides', 'detector'),
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

function main() {
  const options = parseArgs(process.argv.slice(2));
  const theme = THEMES[options.example];
  fs.mkdirSync(options.out, { recursive: true });

  const manifest = {
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

  console.log(`Slideshow generado en: ${options.out}`);
}

main();
