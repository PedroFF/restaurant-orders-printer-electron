$(document).ready(function () {
    const axios = require('axios');
    const api_restaurant_url = require('../config.json').API_URL;
    const api_heroku_url = require('../config.json').API_HEROKU;
    const token = require('../config.json').token;
    const agenda = require('node-cron');
    const configRestaurant = {
        headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'Glf-Api-Version': '2'
        }
    };

    let api_key = require('../config.json').API_KEY;



    var task = agenda.schedule('*/15 * * * * *', () => {
        axios.post(
            api_restaurant_url,
            {},
            configRestaurant
        ).then((newOrders) => {
            console.log(newOrders.data);
            //printOrders(newOrders.data.orders);
            saveOrders(newOrders.data.orders);
            sendToAPI(newOrders.data.orders);
        }).catch((error) => {
            console.log('DEU RUIM');
            console.log(error);
        });
    });
    task.start();

    function saveOrders(newOrders) {
        const fs = require('fs');
        let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/orders.json');
        let file = JSON.parse(rawdata);
        file.orders.push(newOrders);
        fs.writeFileSync('../restaurant-orders-printer-electron/orders.json', JSON.stringify(file), (err) => {
            if (err) throw err;
        });
    }

    function sendToAPI(orders) {
        if (orders && orders.length > 0) {
            verifyKey(orders[0]).then( () => {
                const options = {headers: {'x-access-token': api_key}}
                for(order of orders)
                {
                     axios.post(
                        `${api_heroku_url}restaurants/orders`,
                        order,
                        options)
                        .then(() =>
                            {console.log('funfou');}
                        )
                        .catch((error) => {
                            console.log(error.toJSON());
                        });
                }
            });
        }
    }

    async function verifyKey(order) {
        if (!api_key) {
            await axios.post(`${api_heroku_url}restaurants/signup`, {
                    name: order.restaurant_name, key: order.restaurant_key, systemToken: order.restaurant_key
            })
            .then((response) => {
                console.log(response.data);
                console.log(response.status);
                createApiKey(response.data);
            })
            .catch((error) => {
                console.log(error.toJSON());
            });
        }
    }

    function createApiKey(data){
        const fs = require('fs');
        let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/config.json');
        let config = JSON.parse(rawdata);
        Object.assign(config, {API_KEY: data.accessToken});
        api_key = data.accessToken;
        fs.writeFile('../restaurant-orders-printer-electron/config.json', JSON.stringify(config), (err) => {
            if (err) throw err;
        });
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

    function createPrintHTML() {
        const fs = require('fs');
        let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/order.json');
        let order = JSON.parse(rawdata);
        return order;

    }

});
