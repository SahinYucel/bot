require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base URL: localhost (dev) | https://www.maxtouria.com.tr (production)
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// Your verification token - set this in Meta App Dashboard and keep it secret
// Meta Dashboard'daki Verify Token ile AYNI olmalı
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'meta123';

// WhatsApp Cloud API - Meta Business Suite'ten al
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const { MAXTORIA_INTERACTIVE_LIST, CITY_TOURS_LIST, ACTIVITIES_LIST } = require('./messages');
const { handleWhatsAppWebhook } = require('./handlers/whatsappHandler');
const { getMessages, deleteMessages, loadMessages, messageEvents } = require('./services/messageStorage');

// AWS: Başlangıçta data dizininin yazılabilir olduğunu kontrol et
try {
  loadMessages();
  console.log('Message storage OK');
} catch (err) {
  console.error('Message storage init failed:', err.message, '- Set DATA_DIR env if needed (e.g. /tmp)');
}

// Test route - açtığında "OK" görürsün
app.get('/', (req, res) => {
  res.send('Server çalışıyor. Meta webhook: /webhook/meta');
});

// Frontend config: BASE_URL (messages.html için)
app.get('/api/config', (req, res) => {
  res.json({ baseUrl: BASE_URL.replace(/\/$/, '') });
});

// Mesaj sil: DELETE /api/messages?phone=905551234567 (kullanıcı) veya DELETE /api/messages?all=1 (tümü)
app.delete('/api/messages', (req, res) => {
  const { phone, all } = req.query;
  const result = deleteMessages(all === '1' || all === 'true' ? null : phone || null);
  res.json({ ok: true, deleted: result.deleted });
});

// Kullanıcı mesajlarını görüntüle: GET /api/messages?limit=50&offset=0
app.get('/api/messages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  const messages = getMessages(limit, offset);
  res.json({ count: messages.length, messages });
});

// Anlık güncelleme: GET /api/messages/stream (Server-Sent Events)
app.get('/api/messages/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx için
  res.flushHeaders();

  const onNew = (msg) => res.write(`data: ${JSON.stringify(msg)}\n\n`);
  messageEvents.on('new', onNew);

  // Keep-alive: bağlantı timeout olmasın (ngrok, proxy vb.)
  const keepAlive = setInterval(() => res.write(': ping\n\n'), 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    messageEvents.off('new', onNew);
  });
});

// Meta webhook 
app.get('/webhook/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Debug: Meta verify denemesinde ne geldiğini gör
  if (mode || token) {
    console.log('Meta verify attempt:', { mode, tokenReceived: token ? '***' : null, expectedToken: VERIFY_TOKEN });
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    res.status(200).send(challenge);
  } else if (!mode && !token) {
    // Tarayıcıdan açıldığında - test için
    res.status(200).send('Webhook hazır. Meta Dashboard\'dan "Verify" yap.');
  } else {
    console.log('Verify FAILED - mode:', mode, 'token match:', token === VERIFY_TOKEN);
    res.sendStatus(403);
  }
});

async function sendWhatsAppMessage(to, payload) {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.warn('WhatsApp API credentials missing. Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN');
    return;
  }
  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const body = { ...payload, to };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('WhatsApp API error:', response.status, JSON.stringify(data, null, 2));
  } else {
    console.log('WhatsApp mesaj gönderildi:', to, data.id ? 'OK' : 'fail');
  }
  return data;
}

app.post('/webhook/meta', async (req, res) => {
  console.log('[Webhook] POST alındı, object:', req.body?.object || 'unknown');
  res.status(200).send('EVENT_RECEIVED');
  const body = req.body;

  // Facebook Page (Messenger)
  if (body.object === 'page') {
    body.entry?.forEach((entry) => {
      entry.messaging?.forEach((event) => {
        console.log('Received event:', JSON.stringify(event, null, 2));
      });
    });
  }

  if (body.object === 'whatsapp_business_account') {
    await handleWhatsAppWebhook(body, sendWhatsAppMessage);
  }
});

// Manuel test: POST /whatsapp/send { "to": "90XXXXXXXXXX" }
app.post('/whatsapp/send', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'to (phone number) required' });
  const result = await sendWhatsAppMessage(to, MAXTORIA_INTERACTIVE_LIST);
  res.json(result);
});

// City tours: POST /whatsapp/send/citytours { "to": "90XXXXXXXXXX" }
app.post('/whatsapp/send/citytours', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'to (phone number) required' });
  const result = await sendWhatsAppMessage(to, CITY_TOURS_LIST);
  res.json(result);
});

// Activities: POST /whatsapp/send/activities { "to": "90XXXXXXXXXX" }
app.post('/whatsapp/send/activities', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'to (phone number) required' });
  const result = await sendWhatsAppMessage(to, ACTIVITIES_LIST);
  res.json(result);
});

// Yanıt gönder: POST /api/reply { "to": "905551234567", "message": "Merhaba!", "message_id": "wamid.xxx" }
app.post('/api/reply', async (req, res) => {
  const { to, message, message_id } = req.body;
  if (!to || !message) return res.status(400).json({ error: 'to ve message gerekli' });
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'text',
    text: { preview_url: false, body: message }
  };
  if (message_id) {
    payload.context = { message_id };
  }
  const result = await sendWhatsAppMessage(to, payload);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Meta callback URL: ${BASE_URL}/webhook/meta`);
});
