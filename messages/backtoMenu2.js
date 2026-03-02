const BACK_TO_MENU_BUTTON = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: '👇If you want to go main menu\nplease push the below button👇'
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: 'main_menu2',
              title: 'GO TO MAIN MENU'
            }
          }
        ]
      }
    }
  };
  
  module.exports = { BACK_TO_MENU_BUTTON };
  