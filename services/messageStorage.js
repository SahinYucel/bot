const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// AWS: DATA_DIR env ile path değiştirilebilir (örn. /tmp veya EBS mount)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'messages.json');
const messageEvents = new EventEmitter();
const MAX_MESSAGES = 1000;

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadMessages() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.warn('messageStorage loadMessages:', err.message);
    return [];
  }
}

function saveMessages(messages) {
  try {
    ensureDataDir();
    const trimmed = messages.slice(-MAX_MESSAGES);
    fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
  } catch (err) {
    console.error('messageStorage saveMessages:', err.message);
    throw err;
  }
}

function formatDateTime(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hour}:${minute}`;
}

function addMessage(phone, userName, message, type = 'text', waMessageId = null) {
  const now = new Date();
  const messages = loadMessages();
  const msg = {
    id: waMessageId || `local_${now.getTime()}_${Math.random().toString(36).slice(2, 9)}`,
    phone,
    userName: userName || null,
    message,
    type,
    timestamp: now.toISOString(),
    dateTime: formatDateTime(now)
  };
  messages.push(msg);
  saveMessages(messages);
  messageEvents.emit('new', msg);
}

function getMessages(limit = 100, offset = 0) {
  const messages = loadMessages();
  return messages.slice(-limit - offset, -offset || undefined).reverse();
}

function deleteMessages(phone = null) {
  const messages = loadMessages();
  const filtered = phone !== null ? messages.filter(m => m.phone !== phone) : [];
  saveMessages(filtered);
  return { deleted: messages.length - filtered.length };
}

module.exports = { addMessage, getMessages, deleteMessages, loadMessages, messageEvents };
