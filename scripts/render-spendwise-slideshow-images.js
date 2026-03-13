#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

function printHelp() {
  console.log(`Uso:
  node scripts/render-spendwise-slideshow-images.js [opciones]

Opciones:
  --manifest <ruta>             Ruta a manifest.json del slideshow
  --output <directorio>         Directorio donde guardar las imagenes
  --service-root <directorio>   Ruta al repo openai-image-mcp
  --style <texto>               Estilo visual adicional para los prompts
  --help                        Muestra esta ayuda
`);
}

function parseArgs(argv) {
  const options = {
    manifest: '',
    output: path.join(os.tmpdir(), 'aipal', 'images', 'spendwise-ai-slides'),
    serviceRoot: '/Users/mikelcobian/Repositorios Trabajo/openai-image-mcp',
    style:
      'editorial fintech, premium, clean, high contrast, TikTok vertical, elegant typography, dark teal palette, subtle dashboard motifs',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--manifest') {
      options.manifest = path.resolve(argv[index + 1] || options.manifest);
      index += 1;
      continue;
    }
    if (arg === '--output') {
      options.output = path.resolve(argv[index + 1] || options.output);
      index += 1;
      continue;
    }
    if (arg === '--service-root') {
      options.serviceRoot = path.resolve(argv[index + 1] || options.serviceRoot);
      index += 1;
      continue;
    }
    if (arg === '--style') {
      options.style = argv[index + 1] || options.style;
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!options.manifest) {
    console.error('Falta --manifest');
    process.exit(1);
  }

  return options;
}

function loadManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function buildPrompt(manifest, slide, style) {
  return [
    'Create one TikTok master vertical slide for a 5-image personal finance slideshow.',
    `Main topic: ${manifest.title}.`,
    `Slide section: ${slide.kicker}.`,
    `Exact headline to emphasize: ${slide.heading}.`,
    `Supporting copy to communicate visually: ${slide.body}.`,
    `Accent phrase: ${slide.accent}.`,
    'The composition must feel like a polished fintech social post ready for TikTok.',
    'Use a premium editorial look with strong hierarchy, bold contrast, mobile-first readability, and clean information design.',
    `Visual style: ${style}.`,
    'Avoid watermarks, fake UI chrome, brand logos, and random extra text.',
    'Spanish-language slide. Keep the text legible and integrated in the design.',
  ].join(' ');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const manifest = loadManifest(options.manifest);
  const outputDir = options.output;

  fs.mkdirSync(outputDir, { recursive: true });

  process.env.OPENAI_IMAGE_OUTPUT_DIR = outputDir;

  const serviceEntry = path.join(options.serviceRoot, 'src', 'image-generator.js');
  const { generateSocialImage } = await import(serviceEntry);

  const results = [];
  for (const slide of manifest.slides) {
    const prompt = buildPrompt(manifest, slide, options.style);
    const result = await generateSocialImage({
      prompt,
      socialNetwork: 'tiktok',
      format: 'master-vertical',
    });

    results.push({
      slide: slide.file,
      heading: slide.heading,
      imagePath: result.imagePath,
      metadata: result.metadata,
    });
  }

  const resultPath = path.join(outputDir, 'slideshow-images.json');
  fs.writeFileSync(resultPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

  console.log(`Imagenes generadas en: ${outputDir}`);
  console.log(`Manifiesto de salida: ${resultPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
