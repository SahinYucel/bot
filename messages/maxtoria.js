const BASE_TEXT = "👋 Hi there{name}! Need an online guide? You're in the right place — Maxtoria \n\nNeed a tour, a transfer, or an easy ride? 🚐✨\nI'm here to help and make your holiday smooth and enjoyable 😊";

function getMaxtoriaMessage(userName) {
  const name = userName ? ` ${userName}` : '';
  const text = BASE_TEXT.replace('{name}', name);
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'list',
      header: {
        type: 'text',
        text: 'Maxtoria Travel | Assistant 🌍'
      },
      body: { text },
      footer: {
        text: 'Explore with Maxtoria Travel'
      },
      action: {
        button: ' Choose options👇',
        sections: [
          {
            title: '🌊 MAXTORIA TOURS',
            rows: [
              { id: 'all_city_tours', title: 'All City Tours', description: 'Explore the best cities in Turkey' },
              { id: 'all_activities', title: 'All Activities', description: 'The best activities of Turkey' },
              { id: 'all_shops', title: 'Shopping Centers', description: 'The best shopping centers in Turkey' },
              { id: 'reach_us_directly', title: 'Contact Us', description: 'Reach us directly with assistance' },
            ]
          }
        ]
      }
    }
  };
}

const MAXTORIA_INTERACTIVE_LIST = getMaxtoriaMessage();

module.exports = { MAXTORIA_INTERACTIVE_LIST, getMaxtoriaMessage };
