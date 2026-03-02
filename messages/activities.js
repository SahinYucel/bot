const ACTIVITIES_LIST = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
  type: 'interactive',
  interactive: {
    type: 'list',
    header: {
      type: 'text',
      text: 'Maxtoria Travel | Explore'
    },
    body: {
      text: 'Please select the activity 👈'
    },
    footer: {
      text: 'Explore with Maxtoria Travel'
    },
    action: {
      button: 'View Activities',
      sections: [
        {
          title: 'ACTIVITIES',
          rows: [
            { id: 'jeep_safari', title: 'Jeep Safari', description: 'Discover the beauty of Jeep Safari' },
            { id: 'quad_bike', title: 'Quad Bike', description: "Explore Alanya's off-road quad bike" },
            { id: 'rafting', title: 'Rafting Tour', description: 'Exciting activity rafting or Rafting Combo tour(etc buggy, zipline)' },
            { id: 'land_of_legends', title: 'Land Of Legends', description: 'Join the exciting activity Land of Legends' }
          ]
        }
      ]
    }
  }
};

module.exports = { ACTIVITIES_LIST };
