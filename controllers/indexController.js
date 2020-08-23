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
    let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/order.json');
    let order = JSON.parse(rawdata);
    var task = agenda.schedule('*/15 * * * * *', () => {
        axios.post(
            api_restaurant_url,
            {},
            configRestaurant
        ).then((newOrders) => {
            console.log(newOrders.data);
            printOrders(newOrders.data.orders);
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
        for (order of newOrders) {
            file.orders.push(order);
        }
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
        for (let order of orders) {
            printOrder(order)
        }
    }


    let orderRawData = fs.readFileSync('../restaurant-orders-printer-electron/orders.json');
    let orders = JSON.parse(orderRawData);
    generateOrderTable(orders.orders)


});
const fs = require('fs');
function printOrder(order) {
    createPrintHTML(order);
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
    if (order.type === 'pickup') {
        createPrintHTMLPickup(order)
    } else {
        createPrintHTMLDelivery(order)
    }
}

function createPrintHTMLDelivery(order) {
    let result
    ret = fs.readFileSync('../restaurant-orders-printer-electron/views/pedido-delivery-modelo.html', {
        encoding: 'utf8',
        flag: 'r'
    })
    result = ret.replace('%itensPedido%', generateItensTable(order['items']))
    $.each(orderFieldsDelivery, (key, value) => {
        console.log(key + '=>' + value)
        result = result.replace(key, order[value] ? order[value] : 'Não Informado')
    })
    let totalPrice = formatCurrency.format(order['total_price'])
    result = result.replace('%total%', totalPrice)
    fs.writeFileSync('../restaurant-orders-printer-electron/views/pedido.html', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function createPrintHTMLPickup(order) {
    let result
    ret = fs.readFileSync('../restaurant-orders-printer-electron/views/pedido-pickup-modelo.html', {
        encoding: 'utf8',
        flag: 'r'
    })
    result = ret.replace('%itensPedido%', generateItensTable(order['items']))
    $.each(orderFieldsPickup, (key, value) => {
        console.log(key + '=>' + value)
        result = result.replace(key, order[value] ? order[value] : 'Não Informado')
    })
    let totalPrice = formatCurrency.format(order['total_price'])
    result = result.replace('%total%', totalPrice)
    fs.writeFileSync('../restaurant-orders-printer-electron/views/pedido.html', result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

const formatCurrency = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'})
const formatDateTime = new Intl.DateTimeFormat('pt', {year: 'numeric', month: '2-digit', day: '2-digit'})
const orderFieldsDelivery = {
    '%nomeRestaurante%': 'restaurant_name',
    '%enderecoRestaurante%': 'restaurant_street',
    '%telefoneRestaurante%': 'restaurant_phone',
    '%idPedido%': 'id',
    '%primeiroNomeCliente%': 'client_first_name',
    '%ultimoNomeCliente%': 'client_last_name',
    '%telefoneCliente%': 'client_phone',
    '%enderecoCliente%': 'client_address',
    '%tipoEntrega%': 'type',
    '%instrucaoEntrega%': 'instructions'
}
const orderFieldsPickup = {
    '%nomeRestaurante%': 'restaurant_name',
    '%enderecoRestaurante%': 'restaurant_street',
    '%telefoneRestaurante%': 'restaurant_phone',
    '%idPedido%': 'id',
    '%primeiroNomeCliente%': 'client_first_name',
    '%ultimoNomeCliente%': 'client_last_name',
    '%telefoneCliente%': 'client_phone',
    '%tipoEntrega%': 'type',
    '%instrucaoEntrega%': 'instructions'
}

function generateItensTable(items) {
    let tbl = document.createElement("table");
    tbl.classList.add('table')
    tbl.classList.add('table-bordered')
    tbl.classList.add('table-sm')
    let tblHead = ['Qtd.', 'Nome', 'Opções']
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
        let itemInstruction = value.instructions ? `(${value.instructions})` : ""
        let values = [value.quantity, `${value.name} ${itemInstruction}`, opt]
        generateTable(tbl, values)
    });
    return tbl.outerHTML
}

function generateOrderTable(orders) {
    let tbl = document.createElement("table");
    tbl.classList.add('table')
    tbl.classList.add('table-sm')
    let tblHead = ['Id', 'Nome do Cliente', 'Data', 'Opções']
    generateTableHead(tbl, tblHead)
    $.each(orders, function (key, value) {
        let button = document.createElement("button")
        button.innerText='Reimprimir'
        button.addEventListener("click", function () {
            createPrintHTMLById(value.id);
        });
        button.classList.add('btn')
        button.classList.add('btn-warning')
        let dateAcceptedAt= formatDateTime.format(new Date(value.accepted_at))
        let values = [value.id, `${value.client_first_name} ${value.client_last_name}`, dateAcceptedAt,button]
        generateTable(tbl, values)
    });
    document.getElementById('table_list').append(tbl)
}
function createPrintHTMLById(id){
    const fs = require('fs');
    let orderRawData = fs.readFileSync('../restaurant-orders-printer-electron/orders.json');
    let orders = JSON.parse(orderRawData);
    let order = orders.orders.find(element => element.id === id)
    printOrder(order)
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
        if (element instanceof HTMLButtonElement) {
            let cell = row.insertCell();
            cell.appendChild(element)
        } else {
            let cell = row.insertCell();
            let text = document.createTextNode(element);
            cell.appendChild(text);
        }
    }
}
