const url = require("url");
const path = require('path');
const api_restaurant_url = require(path.join(__dirname, '..', 'config.json')).API_URL;
const api_heroku_url = require(path.join(__dirname, '..', 'config.json')).API_HEROKU;
const token = require(path.join(__dirname, '..', 'config.json')).token;
const axios = require('axios');
const agenda = require('node-cron');
const formatCurrency = new Intl.NumberFormat('pt-BR', {style: 'currency', currency: 'BRL'})
const formatDateTime = new Intl.DateTimeFormat('pt', {year: 'numeric', month: '2-digit', day: '2-digit'})
const formatTime = new Intl.DateTimeFormat('pt', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
});
var iconPath = path.join(__dirname, '..', 'icon.ico');
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
const paymentType = {
    'CARD': 'Cartão de débito ou crédito',
    'CASH': 'Dinheiro'
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
let api_key = require(path.join(__dirname, '..', 'config.json')).API_KEY;
const {exec} = require('child_process');
const StringBuilder = require('node-stringbuilder');
$(document).ready(async function () {
    const configRestaurant = {
        headers: {
            'Authorization': token,
            'Accept': 'application/json',
            'Glf-Api-Version': '2'
        }
    };
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

    if (await checkApiAvailability()) {
        task.start();
        let orderRawData = fs.readFileSync(path.join(__dirname, '..', 'orders.json'));
        let orders = JSON.parse(orderRawData);
        generateOrderTable(orders.orders.sort(compareOrders), false)
    } else {
        task.stop();
        generateOrderTable(null, true)
    }


})
;
const fs = require('fs');

function clearHistory() {
    let file = {orders: []}
    fs.writeFileSync(path.join(__dirname, '..', 'orders.json'), JSON.stringify(file), (err) => {
        if (err) throw err;
    });
    $('#deleteModal').modal('toggle')
    generateOrderTable(file.orders)
}

async function checkApiAvailability() {
    let available = false
    await axios.get(`${api_heroku_url}/availability`)
        .then((response) => {
            console.log(response.status)
            console.log(response.status === 204)
            available = (response.status === 204);
        }).catch((error) => {
            available = false
        });
    return available
}

function saveOrders(newOrders) {
    let rawdata = fs.readFileSync(path.join(__dirname, '..', 'orders.json'));
    let file = JSON.parse(rawdata);
    for (order of newOrders) {
        file.orders.push(order);
    }
    let result = fs.writeFileSync(path.join(__dirname, '..', 'orders.json'), JSON.stringify(file), (err) => {
        if (err) throw err;
    });
    console.log(result)
    generateOrderTable(file.orders.sort(compareOrders))
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
    let rawdata = fs.readFileSync(path.join(__dirname, '..', 'config.json'));
    let config = JSON.parse(rawdata);
    Object.assign(config, {API_KEY: data.accessToken});
    api_key = data.accessToken;
    let result = fs.writeFileSync(path.join(__dirname, '..', 'config.json'), JSON.stringify(config), (err) => {
        if (err) throw err;
    });
    console.log(result)
    console.log(__dirname)
}

function printOrders(orders) {
    debugger;
    for (let order of orders) {
        printOrder(order)
    }
}

function compareOrders(a, b) {
    var dateA = new Date(a.accepted_at), dateB = new Date(b.accepted_at);
    return dateB - dateA;
}

function printOrder(order) {
    let rawdata = fs.readFileSync(path.join(__dirname, '..', 'printconfig.json'));
    let options = JSON.parse(rawdata);
    createPrintHTML(order);
    /*const electron = require('electron');
    const BrowserWindow = electron.remote.BrowserWindow;
    let win = new BrowserWindow({
        width: 300, show: false, webPreferences: {
            nodeIntegration: true
        }
    });
    let sizeOption = {
        pageSize: {
            width: 80000,
            height: 80000
        },
        margins: {marginType: "custom", top: 0, bottom: 0, left: 0, right: 0}
    }
    win.loadURL('file://' + __dirname + '/pedido.txt');
    win.once('ready-to-show', () => {
        win.show()
    })
    win.webContents.on('did-finish-load', () => {
        win.webContents.print(sizeOption).then(data => {
            /*const pdfPath = path.join(__dirname, '..', '..', 'temp.pdf')
            fs.writeFileSync(pdfPath, data, (error) => {
                if (error) console.error(error)
            })
            let copies = options.copies ? options.copies : 1
            for (let i = 0; i < copies; i++) {
                ptp.print(pdfPath, printOptions)
            }
            if (!data.success) console.log(errorType)
        })

    });*/
    var filename = __dirname + '/pedido.txt';
    let copies = options.copies ? options.copies : 1
    for (let i = 0; i < copies; i++) {
        exec(`Notepad /pt "${filename}" "${options.deviceName}"`, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
        })
    }
}

function createPrintHTML(order) {
    if (order.type === 'pickup') {
        createPrintTXTPickup(order)
    } else {
        createPrintTXTDelivery(order)
    }
}

function createPrintHTMLDelivery(order, fontFamily) {
    let result
    ret = fs.readFileSync(path.join(__dirname, '..', 'views', 'pedido-delivery-modelo.txt'), {
        encoding: 'utf8',
        flag: 'r'
    })
    result = ret.replace('%font%', fontFamily)
    result = result.replace('%itensPedido%', generateTable(order['items'].filter(filterByItemType)))
    $.each(orderFieldsDelivery, (key, value) => {
        console.log(key + '=>' + value)
        result = result.replace(key, order[value] ? order[value] : 'Não Informado')
    })
    let payment = paymentType[order.payment] ? paymentType[order.payment] : order.payment
    result = result.replace('%tipoPagamento%', payment)
    let subTotalPrice = formatCurrency.format(order['sub_total_price'])
    let totalPrice = formatCurrency.format(order['total_price'])
    result = result.replace('%subtotal%', subTotalPrice)
    result = result.replace('%total%', totalPrice)
    let totalDelivery_fee = order['items'].find(element => element.type === 'delivery_fee')
    result = result.replace('%totalEntrega%', formatCurrency.format(totalDelivery_fee.price))
    let resultSave = fs.writeFileSync(path.join(__dirname, '..', 'views', 'pedido.txt'), result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
    console.log(resultSave)
}

function createPrintTXTDelivery(order) {
    let result
    ret = fs.readFileSync(path.join(__dirname, '..', 'views', 'pedido-delivery-modelo.txt'), {
        encoding: 'utf8',
        flag: 'r'
    })
    result = ret.replace('%itensPedido%', generateItensTableTxT(order['items'].filter(filterByItemType)))
    result = result.replace('%horaImpressao%', formatTime.format(new Date()));
    $.each(orderFieldsDelivery, (key, value) => {
        console.log(key + '=>' + value)
        result = result.replace(key, order[value] ? order[value] : 'Não Informado')
    })
    let payment = paymentType[order.payment] ? paymentType[order.payment] : order.payment
    result = result.replace('%tipoPagamento%', payment)
    let subTotalPrice = formatCurrency.format(order['sub_total_price'])
    let totalPrice = formatCurrency.format(order['total_price'])
    result = result.replace('%subtotal%', subTotalPrice)
    result = result.replace('%total%', totalPrice)
    let totalDelivery_fee = order['items'].find(element => element.type === 'delivery_fee')
    result = result.replace('%totalEntrega%', formatCurrency.format(totalDelivery_fee.price))
    let resultSave = fs.writeFileSync(path.join(__dirname, '..', 'views', 'pedido.txt'), result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
    console.log(resultSave)
}

function filterByItemType(obj) {
    return 'type' in obj && obj.type === 'item';

}

function createPrintHTMLPickup(order, familyName) {
    let result
    ret = fs.readFileSync(path.join(__dirname, '..', 'views', 'pedido-pickup-modelo.txt'), {
        encoding: 'utf8',
        flag: 'r'
    })
    result = ret.replace('%font%', familyName)
    result = result.replace('%itensPedido%', generateItensTable(order['items'].filter(filterByItemType)))

    $.each(orderFieldsPickup, (key, value) => {
        console.log(key + '=>' + value)
        result = result.replace(key, order[value] ? order[value] : 'Não Informado')
    })
    let payment = paymentType[order.payment] ? paymentType[order.payment] : order.payment
    result = result.replace('%tipoPagamento%', payment)
    let subTotalPrice = formatCurrency.format(order['sub_total_price'])
    let totalPrice = formatCurrency.format(order['total_price'])
    result = result.replace('%subtotal%', subTotalPrice)
    result = result.replace('%total%', totalPrice)
    let resultSave = fs.writeFileSync(path.join(__dirname, '..', 'views', 'pedido.html'), result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function createPrintTXTPickup(order) {
    let result
    ret = fs.readFileSync(path.join(__dirname, '..', 'views', 'pedido-pickup-modelo.txt'), {
        encoding: 'utf8',
        flag: 'r'
    })
    result = ret.replace('%itensPedido%', generateItensTableTxT(order['items'].filter(filterByItemType)))
    result = result.replace('%horaImpressao%', formatTime.format(new Date()));
    $.each(orderFieldsPickup, (key, value) => {
        console.log(key + '=>' + value)
        result = result.replace(key, order[value] ? order[value] : 'Não Informado')
    })
    let payment = paymentType[order.payment] ? paymentType[order.payment] : order.payment
    result = result.replace('%tipoPagamento%', payment)
    let subTotalPrice = formatCurrency.format(order['sub_total_price'])
    let totalPrice = formatCurrency.format(order['total_price'])
    result = result.replace('%subtotal%', subTotalPrice)
    result = result.replace('%total%', totalPrice)
    let resultSave = fs.writeFileSync(path.join(__dirname, '..', 'views', 'pedido.txt'), result, 'utf8', function (err) {
        if (err) return console.log(err);
    });
}

function generateItensTable(items) {
    let tbl = document.createElement("table");
    tbl.classList.add('table')
    tbl.classList.add('table-sm')
    let tblHead = ['Qtd.', 'Item', 'Valor']
    generateTableHead(tbl, tblHead)
    $.each(items, function (key, value) {
        let itemInstruction = value.instructions ? `(${value.instructions})` : ""
        let itemPrice = formatCurrency.format(value.price)
        let itemName = `${value.name} ${itemInstruction}`
        let values = [value.quantity, itemName.toUpperCase(), itemPrice]
        generateTable(tbl, values)
        let opt = "";
        for (let option of value.options) {
            let optPrice = formatCurrency.format(option.price)
            opt = opt === "" ? `${option.name} - ${optPrice}` : opt + ", " + `${option.name} - ${optPrice}`;
            let optName = option.name.toString().toLowerCase();
            let valuesOptions = ['', `${optName.charAt(0).toUpperCase() + optName.slice(1)}`, optPrice]
            generateTable(tbl, valuesOptions)
        }
    });
    return tbl.outerHTML.replace(/&nbsp;/g, ' ')
}


function generateOrderTable(orders, unavailable = false) {
    if (!unavailable) {
        let table_list = document.getElementById('table_list')
        table_list.innerHTML = ''
        if (orders.length > 0) {
            let tbl = document.createElement("table");
            tbl.classList.add('table')
            tbl.classList.add('table-sm')
            let tblHead = ['Id', 'Nome do Cliente', 'Data', 'Opções']
            generateTableHead(tbl, tblHead)
            $.each(orders, function (key, value) {
                let button = document.createElement("button")
                button.innerText = 'Reimprimir'
                button.addEventListener("click", async function () {
                    createPrintHTMLById(value.id);
                });
                button.classList.add('btn')
                button.classList.add('btn-warning')
                let dateAcceptedAt = formatDateTime.format(new Date(value.accepted_at))
                let values = [value.id, `${value.client_first_name} ${value.client_last_name}`, dateAcceptedAt, button]
                generateTable(tbl, values)
            });
            table_list.append(tbl)
        } else {
            let center = document.createElement('center')
            let spanText = document.createElement('span')
            spanText.innerText = 'Nenhum Pedido Encontrado. Aprove-os no Aplicativo Restaurante no seu celular e eles aparecerão aqui!!!'
            center.appendChild(spanText)
            table_list.appendChild(center)
        }
    } else {
        let center = document.createElement('center')
        let spanText = document.createElement('span')
        spanText.innerText = 'Falha na autenticação. Verifique sua conexão com a internet. Caso a situação persista, entre em contato conosco.'
        center.appendChild(spanText)
        table_list.appendChild(center)
    }
}

async function createPrintHTMLById(id) {
    const fs = require('fs');
    let orderRawData = fs.readFileSync(path.join(__dirname, '..', 'orders.json'));
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

function generateItensTableTxT(items) {
    let tblHead = [{text: 'Qtd', limit: 3}, {text: 'Item', limit: 25}, {text: 'Valor', limit: 6}]
    let stringBuilder = new StringBuilder();
    stringBuilder = generateTableTxt(stringBuilder, tblHead);
    let itemsInstructions = [];
    $.each(items, function (key, value) {
        let itemInstruction = value.instructions ? `(${value.instructions})` : ""
        if (itemInstruction) {
            itemsInstructions.push(`*${value.name} ${itemInstruction}`)
        }
        let values = [{text: value.quantity, limit: 3}, {text: value.name.toUpperCase(), limit: 25}, {
            text: value.price.toFixed(2).replace(".", ","),
            limit: 6
        }]
        stringBuilder = generateTableTxt(stringBuilder, values)
        for (let option of value.options) {
            let optName = option.name.toString().toLowerCase();
            let valuesOptions = [{text: '-->', limit: 3}, {
                text: `${optName.charAt(0).toUpperCase() + optName.slice(1)}`,
                limit: 25
            }, {text: option.price.toFixed(2).replace(".", ","), limit: 6}]
            stringBuilder = generateTableTxt(stringBuilder, valuesOptions)
        }
    });
    for (let i = 0; i < itemsInstructions.length; i++) {
        if (i === itemsInstructions.length - 1) {
            stringBuilder.append(`${text}`)
        } else {
            stringBuilder.append(`${text}\n`)
        }
    }
    return stringBuilder.toString();

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

function generateTableTxt(stringBuilder, data) {
    for (let i = 0; i < data.length; i++) {
        text = completa(data[i].text, ' ', data[i].limit)
        if (i === data.length - 1) {
            stringBuilder.append(`|${text}|\n`)
        } else {
            stringBuilder.append("|").append(text)
        }
    }
    return stringBuilder;
}

function completa(valor, caracter, limite, esquerda = false) {
    if (valor) {
        let stringValor = valor.toString();
        let tamanhoValor = stringValor.length;
        if (tamanhoValor < limite) {
            for (let i = 0; i < limite - tamanhoValor; i++) {
                if (esquerda)
                    valor = caracter + valor;
                else
                    valor += caracter;
            }
        } else {
            valor = stringValor.substring(0, limite);
        }
    }
    return valor;
}

function openConfig() {
    const BrowserWindow = require('electron').remote.BrowserWindow;
    let win = new BrowserWindow({
        height: 600,
        width: 400,
        maxHeight: 600,
        maxWidth: 400,
        parent: require('electron').remote.getCurrentWindow(),
        modal: true,
        webPreferences: {
            nodeIntegration: true
        },
        icon: iconPath
    });
    win.setMenuBarVisibility(false)
    win.loadURL(url.format({ //2. Load HTML into new Window
        pathname: path.join(__dirname, 'configuracoes.html'),
        protocol: 'file'
    }));
    win.once('ready-to-show', () => {
        win.show()
    })
    win.on('closed', function () {
        // Remove a referência que criamos no começo do arquivo
        win = null
    });
}
