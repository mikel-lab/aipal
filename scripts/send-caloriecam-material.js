#!/usr/bin/env node

const fs = require('node:fs/promises');
const { openAsBlob } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const DEFAULT_MATERIAL_DIR =
  '/Users/mikelcobian/Repositorios Trabajo/socialmedia-instructions/caloriecam/caloriecam-material';
const DEFAULT_MESSAGE_FILE = 'message.txt';
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

function printHelp() {
  console.log(`Usage:
  node scripts/send-caloriecam-material.js [options]

Options:
  --dir <absolute_path>     CalorieCam material folder
  --chat-id <telegram_id>   Override destination chat id
  --help                    Show this help
`);
}

function parseArgs(argv) {
  const options = {
    dir: DEFAULT_MATERIAL_DIR,
    chatId: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--dir') {
      options.dir = path.resolve(argv[index + 1] || options.dir);
      index += 1;
      continue;
    }
    if (arg === '--chat-id') {
      options.chatId = String(argv[index + 1] || '').trim();
      index += 1;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

async function loadConfigChatId() {
  const configPath = path.join(os.homedir(), '.config', 'aipal', 'config.json');
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.cronChatId ? String(parsed.cronChatId) : '';
  } catch {
    return '';
  }
}

async function readMaterialDir(materialDir) {
  const entries = await fs.readdir(materialDir, { withFileTypes: true });
  const messagePath = path.join(materialDir, DEFAULT_MESSAGE_FILE);
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  if (!files.includes(DEFAULT_MESSAGE_FILE)) {
    throw new Error(`Missing ${DEFAULT_MESSAGE_FILE} in ${materialDir}`);
  }

  const imagePaths = files
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort((left, right) => left.localeCompare(right, 'en'))
    .map((name) => path.join(materialDir, name));

  if (imagePaths.length === 0) {
    throw new Error(`No image files found in ${materialDir}`);
  }

  const messageText = (await fs.readFile(messagePath, 'utf8')).trim();
  if (!messageText) {
    throw new Error(`${DEFAULT_MESSAGE_FILE} is empty in ${materialDir}`);
  }

  return {
    messageText,
    imagePaths,
  };
}

async function telegramRequest(token, method, body) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(`Telegram ${method} failed with HTTP ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function sendTextMessage({ token, chatId, text }) {
  const form = new URLSearchParams();
  form.set('chat_id', chatId);
  form.set('text', text);
  form.set('disable_web_page_preview', 'true');
  return telegramRequest(token, 'sendMessage', form);
}

async function sendPhoto({ token, chatId, imagePath }) {
  const form = new FormData();
  form.set('chat_id', chatId);
  form.set('photo', await openAsBlob(imagePath), path.basename(imagePath));
  return telegramRequest(token, 'sendPhoto', form);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = options.chatId || process.env.ALERT_CHAT_ID?.trim() || (await loadConfigChatId());

  if (!token) {
    throw new Error('Missing TELEGRAM_BOT_TOKEN in environment or .env');
  }
  if (!chatId) {
    throw new Error('Missing Telegram chat id. Pass --chat-id or set cronChatId in ~/.config/aipal/config.json');
  }

  const materialDir = options.dir;
  const { messageText, imagePaths } = await readMaterialDir(materialDir);

  await sendTextMessage({
    token,
    chatId,
    text: messageText,
  });

  for (const imagePath of imagePaths) {
    await sendPhoto({
      token,
      chatId,
      imagePath,
    });
  }

  console.log(
    JSON.stringify(
      {
        chatId,
        materialDir,
        messageSent: true,
        imagesSent: imagePaths.length,
        imagePaths,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
