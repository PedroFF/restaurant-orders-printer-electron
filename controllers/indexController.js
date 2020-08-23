$(document).ready(function () {
    const fs = require('fs');
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
    let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/order.json');
    let order = JSON.parse(rawdata);
    var task = agenda.schedule('*/15 * * * * *', () => {
        axios.post(
            api_restaurant_url,
            {},
            configRestaurant
        ).then((newOrders) => {
            console.log(newOrders.data);
            printOrders(order);
            saveOrders(newOrders.data.orders);
            sendToAPI(newOrders.data.orders);
        }).catch((error) => {
            console.log('DEU RUIM');
            console.log(error);
        });
    });
    task.start();

    function saveOrders(newOrders) {
        let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/orders.json');
        let file = JSON.parse(rawdata);
        file.orders.push(newOrders);
        fs.writeFileSync('../restaurant-orders-printer-electron/orders.json', JSON.stringify(file), (err) => {
            if (err) throw err;
        });
    }

    function sendToAPI(orders) {
        if (orders && orders.length > 0) {
            verifyKey(orders[0]).then(() => {
                const options = {headers: {'x-access-token': api_key}}
                for (order of orders) {
                    axios.post(
                        `${api_heroku_url}restaurants/orders`,
                        order,
                        options)
                        .then(() => {
                                console.log('funfou');
                            }
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

    function createApiKey(data) {
        let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/config.json');
        let config = JSON.parse(rawdata);
        Object.assign(config, {API_KEY: data.accessToken});
        api_key = data.accessToken;
        fs.writeFileSync('../restaurant-orders-printer-electron/config.json', JSON.stringify(config), (err) => {
            if (err) throw err;
        });
    }

    function printOrders(orders) {
        createPrintHTML(orders.orders[0]);
        let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/printconfig.json');
        let options = JSON.parse(rawdata);
        const electron = require('electron');
        const BrowserWindow = electron.remote.BrowserWindow;
        let win = new BrowserWindow({
            width: 300, show: false, webPreferences: {
                nodeIntegration: true
            }
        });
        win.loadURL('file://' + __dirname + '/pedido.html');
        win.webContents.on('did-finish-load', () => {
            win.webContents.print(options, (success, errorType) => {
                if (!success) console.log(errorType)
            });
        });

    }

    function createPrintHTML(order) {
        let result
        ret = fs.readFileSync('../restaurant-orders-printer-electron/views/pedido-modelo.html', {
            encoding: 'utf8',
            flag: 'r'
        })
        result = ret.replace('%itensPedido%', generateItensTable(order['items']))
        $.each(orderFields, (key, value) => {
            console.log(key + '=>' + value)
            result = result.replace(key, order[value])
        })
        fs.writeFileSync('../restaurant-orders-printer-electron/views/pedido.html', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    }

    const orderFields = {
            '%nomeRestaurante%': 'restaurant_name',
            '%enderecoRestaurante%': 'restaurant_street',
            '%telefoneRestaurante%': 'restaurant_phone',
            '%idPedido%': 'id',
            '%primeiroNomeCliente%': 'client_first_name',
            '%ultimoNomeCliente%': 'client_last_name',
            '%telefoneCliente%': 'client_phone',
            '%enderecoCliente%': 'client_address',
            '%tipoEntrega%': 'type',
            '%instrucaoEntrega%': 'instructions',
            '%total%': 'total_price'
        }
});

function generateItensTable(items) {
    let tbl = document.createElement("table");
    tbl.classList.add('table')
    tbl.classList.add('table-bordered')
    tbl.classList.add('table-sm')
    let tblHead = ['Quantidade', 'Nome', 'Opções']
    generateTableHead(tbl, tblHead)
    $.each(items, function (key, value) {
        let opt = "";
        for (let option of value.options) {
            if (opt !== "") {
                opt = opt + ", " + option.name;
            } else {
                opt = option.name;
            }
        }
        let values = [value.quantity, value.name, opt]
        generateTable(tbl, values)
    });
    return tbl.outerHTML
}

function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
        let th = document.createElement("th");
        let text = document.createTextNode(key);
        th.appendChild(text);
        row.appendChild(th);
    }
}

function generateTable(table, data) {
    let row = table.insertRow();
    for (element of data) {
        let cell = row.insertCell();
        let text = document.createTextNode(element);
        cell.appendChild(text);
    }
}
