const path = require('path')
const {remote} = require('electron');
const app = require('electron').remote.app;
$(document).ready(function () {
    const webContents = remote.getCurrentWebContents();
    const printers = webContents.getPrinters();
    console.log(printers);
    $.each(printers, function (id, valor) {
        $('#impressora').append($("<option></option>").attr("value", valor.displayName).text(valor.displayName));
    });
    carregaConfig()
})

function carregaConfig() {
    const fs = require('fs');
    let rawdata = fs.readFileSync(path.join(__dirname, '..', 'printconfig.json'));
    let options = JSON.parse(rawdata);
    $("#impressora").val(options.deviceName).change()
    $('#vias').val(options.copies)
    let buffer = fs.readFileSync(path.join(__dirname, '..', 'config.json'));
    let config = JSON.parse(buffer);
    $('#token').val(config.token)
}

function salvarConfig() {
    const fs = require('fs');
    let token = {token: document.getElementById('token').value};
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
        copies: Number(document.getElementById('vias').value)
    }

    let data = JSON.stringify(options);

    let result = fs.writeFileSync(path.join(__dirname, '..', 'printconfig.json'), data, (err) => {
        if (err) throw err;
        console.log('Data written to file');
    });
    console.log(result)
    let buffer = fs.readFileSync(path.join(__dirname, '..', 'config.json'));
    let config = JSON.parse(buffer);
    Object.assign(config, token);
    fs.writeFileSync(path.join(__dirname, '..', 'config.json'), JSON.stringify(config), (err) => {
        if (err) throw err;
    });
    require('electron').remote.getCurrentWindow().close()
}


