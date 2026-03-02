const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

const SYSTEM_PROMPT = `**Sadece ingilizce cevap ver.** Sen Maxtoria Travel'ın WhatsApp asistanısın. Türkiye'de tur, transfer ve aktivite rezervasyonları konusunda yardımcı oluyorsun.
Kısa, samimi ve yardımcı yanıtlar ver. Türkçe veya İngilizce sorulursa o dilde cevap ver.
Şehir turları (Antalya, Alanya, Pamukkale, Kapadokya vb.), aktiviteler (Jeep Safari, Quad, Rafting, Land of Legends) ve transfer hizmetleri hakkında bilgi verebilirsin.`;

// Kullanıcı başına konuşma geçmişi (phone -> messages[])
const conversations = new Map();

function getConversation(phone) {
  if (!conversations.has(phone)) {
    conversations.set(phone, [
      { role: 'system', content: SYSTEM_PROMPT }
    ]);
  }
  return conversations.get(phone);
}

async function chat(phone, userMessage, userName = null) {
  if (!OPENROUTER_API_KEY) {
    console.warn('OPENROUTER_API_KEY missing');
    return 'Üzgünüm, AI servisi şu an kullanılamıyor.';
  }

  const messages = getConversation(phone);
  if (userName && !messages[0].content.includes('Konuştuğun kişinin adı:')) {
    messages[0].content += ` Konuştuğun kişinin adı: ${userName}. Ona ismiyle hitap edebilirsin.`;
  }
  messages.push({ role: 'user', content: userMessage });

  // Son 20 mesajı tut (system + 10 user + 10 assistant)
  if (messages.length > 21) {
    const system = messages[0];
    const recent = messages.slice(-20);
    messages.length = 0;
    messages.push(system, ...recent);
  }

  const models = [OPENROUTER_MODEL, 'google/gemini-2.0-flash-001', 'openai/gpt-4o-mini', 'meta-llama/llama-3.1-8b-instruct'].filter((m, i, a) => a.indexOf(m) === i);

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.BASE_URL || 'https://www.maxtouria.com.tr'
        },
        body: JSON.stringify({
          model,
          messages
        })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        console.warn(`OpenRouter ${model}: invalid JSON, status ${response.status}`);
        continue;
      }

      if (data.error) {
        console.warn(`OpenRouter ${model} error:`, data.error.message || data.error);
        continue;
      }

      const assistantMessage = data.choices?.[0]?.message?.content || 'Yanıt alınamadı.';
      messages.push({ role: 'assistant', content: assistantMessage });

      return assistantMessage;
    } catch (err) {
      console.warn(`OpenRouter ${model} fetch error:`, err.message);
      continue;
    }
  }

  return 'Üzgünüm, AI servisi geçici olarak yanıt veremiyor. Lütfen biraz sonra tekrar dene.';
}

module.exports = { chat };
