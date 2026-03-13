#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

function parseArgs(argv) {
  const options = {
    niche:
      'Apps de finanzas personales / apps de presupuesto / gestion del dinero',
    audience:
      'personas de 18-40 anos interesadas en ahorrar dinero, mejorar sus habitos financieros y controlar sus gastos',
    country: 'Global (priorizar Estados Unidos, Reino Unido y Espana)',
    period: 'ultimos 30 dias',
    mode: 'full',
    output: '',
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--niche') {
      options.niche = argv[index + 1] || options.niche;
      index += 1;
      continue;
    }
    if (arg === '--audience') {
      options.audience = argv[index + 1] || options.audience;
      index += 1;
      continue;
    }
    if (arg === '--country') {
      options.country = argv[index + 1] || options.country;
      index += 1;
      continue;
    }
    if (arg === '--period') {
      options.period = argv[index + 1] || options.period;
      index += 1;
      continue;
    }
    if (arg === '--output') {
      options.output = argv[index + 1] || options.output;
      index += 1;
      continue;
    }
    if (arg === '--mode') {
      const mode = argv[index + 1] || options.mode;
      options.mode = mode === 'quick' ? 'quick' : 'full';
      index += 1;
      continue;
    }
    if (arg === '--quick') {
      options.mode = 'quick';
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Uso:
  node scripts/tiktok-creative-center-trends.js [opciones]

Opciones:
  --quick                  Ejecuta una version corta del analisis
  --mode <full|quick>      Selecciona el modo
  --niche <texto>          Nicho de analisis
  --audience <texto>       Audiencia objetivo
  --country <texto>        Pais o prioridad geografica
  --period <texto>         Periodo de analisis
  --output <ruta>          Guarda la ultima respuesta del agente en un archivo
  --dry-run                Muestra el prompt y el comando sin ejecutarlos
  --help                   Muestra esta ayuda
`);
}

function buildPrompt(options) {
  const quickMode = options.mode === 'quick';
  const viralExamples = quickMode ? 5 : 20;
  const trendCount = quickMode ? 3 : 5;
  const contentIdeas = quickMode ? 5 : 15;
  const slideshowScripts = quickMode ? 3 : 10;

  return `
Actua como un agente de investigacion de tendencias especializado en analisis de contenido de TikTok.

Debes usar:
- Chrome via el MCP \`chrome-devtools\` cuando necesites navegar la web real
- busqueda web en vivo cuando aporte contexto adicional

Reglas de navegacion con Chrome:
- En TikTok y TikTok Creative Center usa timeouts de al menos 60000 ms
- Si una navegacion falla por timeout, reintenta una vez con un timeout mayor antes de darla por bloqueada
- Si una vista web no carga completa, intenta una ruta publica alternativa o usa busqueda web para confirmar el dato

Objetivo:
Identificar patrones de contenido viral y tendencias emergentes relacionadas con apps de gestion de finanzas personales, herramientas de presupuesto, ahorro y control del dinero.

Contexto:
- Nicho: ${options.niche}
- Audiencia objetivo: ${options.audience}
- Pais: ${options.country}
- Periodo de analisis: ${options.period}
- Modo: ${options.mode}

Fuentes permitidas:
- TikTok
- TikTok Creative Center -> Trend Discovery
- fuentes primarias y publicas complementarias solo si ayudan a contextualizar

Reglas de calidad:
- Usa solo datos visibles y verificables
- No inventes views, likes o comentarios si no estan visibles; marca "no visible"
- Incluye enlaces y fecha de consulta cuando sea posible
- Separa observacion, patron e inferencia
- Si TikTok o Creative Center bloquean una parte, indica el bloqueo exacto

Tareas:
1. Encuentra ${viralExamples} ejemplos de contenido viral relevantes para el nicho
2. Extrae patrones clave de viralidad
3. Detecta ${trendCount} tendencias emergentes
4. Extrae hooks de alto rendimiento
5. Genera ${contentIdeas} ideas de contenido para promocionar una app como Spendwise
6. Identifica 3-5 formatos poco explotados
7. Genera ${slideshowScripts} guiones de slideshow optimizados para viralidad en TikTok

Para cada ejemplo viral intenta extraer:
- tema del video
- hook de los primeros 3 segundos
- formato
- estilo visual
- estructura del caption
- CTA
- senales de engagement visibles o "no visible"

Formato final de salida:
1. Ejemplos de contenido viral
2. Patrones clave de viralidad
3. Tendencias emergentes
4. Hooks de alto rendimiento
5. Ideas de contenido para apps de finanzas personales
6. Formatos poco explotados
7. Guiones de slideshow optimizados para viralidad
8. Conclusiones ejecutivas para Spendwise

Quiero una respuesta en espanol, directa, accionable y sin relleno.
`;
}

function buildOutputPath(outputArg) {
  if (outputArg) {
    return path.resolve(outputArg);
  }

  const stamp = new Date().toISOString().replaceAll(':', '-');
  return path.join(os.tmpdir(), `tiktok-creative-center-trends-${stamp}.md`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const prompt = buildPrompt(options);
  const outputPath = buildOutputPath(options.output);
  const args = [
    '--search',
    'exec',
    '--skip-git-repo-check',
    '-C',
    process.cwd(),
    '--output-last-message',
    outputPath,
    '-c',
    'approval_policy="never"',
    '-c',
    'sandbox_mode="workspace-write"',
    '-c',
    'sandbox_workspace_write.network_access=true',
    '-',
  ];

  if (options.dryRun) {
    console.log('Comando:');
    console.log(`codex ${args.join(' ')}`);
    console.log('');
    console.log('Prompt:');
    console.log(prompt);
    return;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const child = spawn('codex', args, {
    cwd: process.cwd(),
    stdio: ['pipe', 'inherit', 'inherit'],
    env: process.env,
  });

  child.stdin.write(prompt);
  child.stdin.end();

  child.on('exit', (code) => {
    if (code === 0) {
      console.log(`\nInforme guardado en: ${outputPath}`);
      process.exit(0);
      return;
    }

    console.error(`\nCodex termino con codigo ${code}.`);
    process.exit(code || 1);
  });
}

main();
