const CITY_TOURS_LIST = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  type: 'interactive',
  interactive: {
    type: 'list',
    header: {
      type: 'text',
      text: 'Maxtoria Travel | Explore 🌍'
    },
    body: {
      text: 'PLEASE SELECT THE CITY TOUR.'
    },
    footer: {
      text: 'Explore with Maxtoria Travel'
    },
    action: {
      button: 'Select City Tour 👈',
      sections: [
        {
          title: '🌍 CITY TOURS',
          rows: [
            { id: 'antalya_city_tour', title: 'Antalya City Tour', description: 'Discover the beauty of Antalya' },
            { id: 'alanya_city_tour', title: 'Alanya City Tour', description: "Explore Alanya's top attractions" },
            { id: 'manavgat_city_tour', title: 'Manavgat City Tour', description: 'Visit waterfalls and local markets' },
            { id: 'pamukkale_tour', title: 'Pamukkale Tour', description: 'Experience the white travertines' },
            { id: 'cappadocia_city_tour', title: 'Cappadocia City Tour', description: 'Discover fairy chimneys & valleys' }
          ]
        }
      ]
    }
  }
};

module.exports = { CITY_TOURS_LIST };
