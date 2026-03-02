const { getMaxtoriaMessage, CITY_TOURS_LIST, ACTIVITIES_LIST, CONTACT_US_MESSAGE, BACK_TO_MENU_BUTTON } = require('../messages');
const { chat: openRouterChat } = require('../services/openrouter');
const { addMessage } = require('../services/messageStorage');

// İlk mesajda menü, sonrakilerde AI
const usersWithMenu = new Set();

function getUserName(value, from) {
  const contact = (value.contacts || []).find(c => c.wa_id === from);
  return contact?.profile?.name || null;
}

async function handleMessage(msg, value, sendWhatsAppMessage) {
  const from = msg.from;
  const userName = getUserName(value, from);
  let replyPayload = getMaxtoriaMessage(userName);
  let selectedId = null;
  let isAiReply = false;

  if (msg.type === 'interactive') {
    const listReply = msg.interactive?.list_reply?.id;
    const buttonReply = msg.interactive?.button_reply?.id;
    selectedId = listReply || buttonReply;
    console.log('Interactive payload:', JSON.stringify({ listReply, buttonReply, type: msg.interactive?.type }));

    if (selectedId === 'main_menu2') replyPayload = getMaxtoriaMessage(userName);
    else if (selectedId === 'all_city_tours') replyPayload = CITY_TOURS_LIST;
    else if (selectedId === 'all_activities') replyPayload = ACTIVITIES_LIST;
    else if (selectedId === 'reach_us_directly') replyPayload = CONTACT_US_MESSAGE;
    addMessage(from, userName, `[Seçim] ${selectedId}`, 'interactive', msg.id);
    console.log('Selected:', selectedId, '->', selectedId === 'reach_us_directly' ? 'Merhaba' : replyPayload === ACTIVITIES_LIST ? 'ACTIVITIES' : replyPayload === CITY_TOURS_LIST ? 'CITY_TOURS' : 'MAIN');
  } else if (msg.type === 'text' && msg.text?.body) {
    // İlk mesaj -> menü gönder. Sonraki mesajlar -> AI
    if (!usersWithMenu.has(from)) {
      usersWithMenu.add(from);
      addMessage(from, userName, msg.text.body.trim(), 'text', msg.id);
      replyPayload = getMaxtoriaMessage(userName);
      console.log('İlk mesaj -> Menü gönderildi');
    } else {
      isAiReply = true;
      const userText = msg.text.body.trim();
      addMessage(from, userName, userText, 'text', msg.id);
      const aiReply = await openRouterChat(from, userText, userName);
      const body = aiReply.length > 4096 ? aiReply.slice(0, 4093) + '...' : aiReply;
      replyPayload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        type: 'text',
        text: { body }
      };
      console.log('AI chat:', userText.slice(0, 50), '->', body.slice(0, 50));
    }
  }

  console.log('WhatsApp from', from, ':', msg.text?.body || msg.interactive?.list_reply?.id || msg.interactive?.button_reply?.id || msg.type);
  await sendWhatsAppMessage(from, replyPayload);

  // AI yanıtı, city tours veya activities sonrası "GO TO MAIN MENU" butonu
  const showBackButton = (msg.type === 'text' && isAiReply) || selectedId === 'all_city_tours' || selectedId === 'all_activities' || selectedId === 'reach_us_directly';
  if (showBackButton) {
    await sendWhatsAppMessage(from, BACK_TO_MENU_BUTTON);
  }
}

async function handleWhatsAppWebhook(body, sendWhatsAppMessage) {
  if (body.object !== 'whatsapp_business_account') return;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      for (const msg of value.messages || []) {
        await handleMessage(msg, value, sendWhatsAppMessage);
      }
    }
  }
}

module.exports = { handleWhatsAppWebhook, handleMessage };
