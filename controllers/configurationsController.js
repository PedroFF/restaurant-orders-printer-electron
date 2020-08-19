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

function salvarConfig()
{
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



