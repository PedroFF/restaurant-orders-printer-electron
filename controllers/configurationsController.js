$(document).ready(function () {
    const app = require('electron').remote.app;
    const { remote } = require('electron');
    const webContents = remote.getCurrentWebContents();
    const printers = webContents.getPrinters();
    console.log(printers);
    $.each(printers, function (id, valor) {
        $('#impressora').append($("<option></option>").attr("value", id).text(valor.displayName));
    });
})

function salvarConfig() {
    const fs = require('fs');

    let options = {
        silent: 'true',
        printBackground: 'true',
        deviceName: document.getElementById('impressora').options[document.getElementById('impressora').selectedIndex].text,
        color: 'false',
        margin: {
            marginType: 'printableArea'
        },
        landscape: 'false',
        pagesPerSheet: 1,
        collate: false,
        copies: document.getElementById('vias').value,
        header: 'Header of the Page',
        footer: 'Footer of the Page'
    }

    let data = JSON.stringify(options);

    fs.writeFile('../restaurant-orders-printer-electron/printconfig.json', data, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });

}

function printOrders() {
    createPrintHTML();

}

function createPrintHTML() {
    const fs = require('fs');
    let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/order.json');
    let order = JSON.parse(rawdata);

    const fs2 = require('fs');
    let rawdata2 = fs2.readFileSync('../restaurant-orders-printer-electron/printconfig.json');
    let options = JSON.parse(rawdata2);

    const electron = require('electron');
    const BrowserWindow = electron.remote.BrowserWindow;

    let win = new BrowserWindow({
        width: 300, height: 500, show: false, webPreferences: {
            nodeIntegration: true
        }
    });
    
    
    win.loadURL('file://' + __dirname + '/pedido.html');

   //win.getElementById('first-name') = order.orders[0].client_first_name;
     teste(order);

    win.webContents.on('did-finish-load', () => {
        win.webContents.print(options, (success, errorType) => {
            if (!success) console.log(errorType)
        });
    });

    //$("table").append($("<tr></tr>").attr("nome", order.orders[0].id));
    // document.getElementById('nome')= order.orders[0].client_first_name;
    console.log(order.orders[0].id);
    console.log(order.orders[0].total_price);
    console.log(order.orders[0].client_email);
    console.log(order.orders[0].client_last_name);
    console.log();

}

$(document).ready(function teste(order)
{   
    $('#impressora').append

})

