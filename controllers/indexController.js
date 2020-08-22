const axios = require('axios');
const api_restaurant_url = require('../config.json').API_URL;
const api_key = require('../config.json').API_KEY;
const agenda = new Agenda();
const configRestaurant = {
    headers: {
        'Authorization': AUTH_TOKEN,
        'Accept': 'application/json',
        'Glf-Api-Version': 2
    }
};

const configAPI = {
    headers: {
        'x-access-token': API_KEY,
    }
};

let orders;

agenda.define('searchOrders', job => {
    axios.post(
        api_restaurant_url,
        configRestaurant
    ).then((newOrders) => {
        printOrders(newOrders);
        orders.push(newOrders);
        //sendToAPI(newOrders);
        
    })
        .catch(console.log('Nenhum pedido novo'));
});
agenda.every('15 seconds', 'searchOrders');

function sendToAPI(orders) {
    verifyKey(orders[0]);
    for(order in orders) {
        axios.post(
            '/api/restaurants/orders',
            order,
            configAPI);
    }
}

function verifyKey(order) {
    if (api_key === null || undefined) {
        axios.post('api/restaurants/signup',
           {
            name: order.resraurant_name,
            key: order.restaurant_key,
            systemToken: order.restaurant_token
        });
    }
}

function printOrders(orders) {
    createPrintHTML();

    const fs = require('fs');
    let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/printconfig.json');
    let options = JSON.parse(rawdata);
    
    let win = BrowserWindow.getFocusedWindow(); 
	//let win = BrowserWindow.getAllWindows()[0]; 

     win.webContents.print(options, (success, failureReason) => { 
         if (!success) console.log(failureReason); 
 
         console.log('Impressão Iniciada'); 
     }); 

}

function createPrintHTML()
{
    const fs = require('fs');
    let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/order.json');
    let order = JSON.parse(rawdata);
    return order;

}

