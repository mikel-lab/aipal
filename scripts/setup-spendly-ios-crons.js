#!/usr/bin/env node
const path = require('path');
const {
  DEFAULT_TIMEZONE,
  buildSpendlyCronJobs,
  getDefaultCronConfigPath,
  loadCronConfig,
  saveCronConfig,
  upsertCronJobs,
} = require('../src/spendly-ios-automation');

function asFiniteNumber(value, flagName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid numeric value for ${flagName}: ${value}`);
  return parsed;
}

function parseArgs(argv) {
  const args = {
    cronPath: getDefaultCronConfigPath(),
    timezone: DEFAULT_TIMEZONE,
    chatId: undefined,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--cron-path') {
      args.cronPath = path.resolve(argv[++i]);
    } else if (token === '--timezone') {
      args.timezone = argv[++i];
    } else if (token === '--chat-id') {
      args.chatId = asFiniteNumber(argv[++i], '--chat-id');
    } else if (token === '--code-topic') {
      args.codeTopic = asFiniteNumber(argv[++i], '--code-topic');
    } else if (token === '--ui-topic') {
      args.uiTopic = asFiniteNumber(argv[++i], '--ui-topic');
    } else if (token === '--security-topic') {
      args.securityTopic = asFiniteNumber(argv[++i], '--security-topic');
    } else if (token === '--worker-topic') {
      args.workerTopic = asFiniteNumber(argv[++i], '--worker-topic');
    } else if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown argument: ${token}`);
    }
  }
  return args;
}

function printHelp() {
  process.stdout.write(`Usage: node scripts/setup-spendly-ios-crons.js [options]

Options:
  --cron-path <path>        Override cron.json path (default: ~/.config/aipal/cron.json)
  --timezone <tz>           Cron timezone (default: Europe/Madrid)
  --chat-id <id>            Default Telegram chat id for all jobs
  --code-topic <id>         Topic id for spendly-audit-code
  --ui-topic <id>           Topic id for spendly-audit-ui
  --security-topic <id>     Topic id for spendly-audit-security
  --worker-topic <id>       Topic id for spendly-issue-worker
  --dry-run                 Print merged cron config instead of writing
  --help                    Show this help
`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const assignments = {
    auditCode: { topicId: args.codeTopic },
    auditUi: { topicId: args.uiTopic },
    auditSecurity: { topicId: args.securityTopic },
    issueWorker: { topicId: args.workerTopic },
  };

  const newJobs = buildSpendlyCronJobs({
    timezone: args.timezone,
    chatId: args.chatId,
    assignments,
  });

  const current = loadCronConfig(args.cronPath);
  const merged = {
    ...current,
    jobs: upsertCronJobs(current.jobs, newJobs),
  };

  if (args.dryRun) {
    process.stdout.write(`${JSON.stringify(merged, null, 2)}\n`);
    return;
  }

  saveCronConfig(merged, args.cronPath);
  process.stdout.write(`Spendly cron jobs upserted in ${args.cronPath}\n`);
  process.stdout.write(`Next steps in Telegram:\n`);
  process.stdout.write(`- /cron reload\n`);
  process.stdout.write(`- /cron assign spendly-audit-code (inside "Spendly Audit Code" topic)\n`);
  process.stdout.write(`- /cron assign spendly-audit-ui (inside "Spendly Audit UI" topic)\n`);
  process.stdout.write(`- /cron assign spendly-audit-security (inside "Spendly Audit Security" topic)\n`);
  process.stdout.write(`- /cron assign spendly-issue-worker (inside "Spendly Issue Worker" topic)\n`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
}
