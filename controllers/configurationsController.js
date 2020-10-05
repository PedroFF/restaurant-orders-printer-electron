const path = require('path')
const {remote} = require('electron');
const app = require('electron').remote.app;
$(document).ready(function () {
    const webContents = remote.getCurrentWebContents();
    const printers = webContents.getPrinters();
    const fonts = {0 : {displayName: "Arial", familyName: " \"Arial\", Helvetica, sans-serif"},
        1: {displayName: "Courier New", familyName: "\"Courier New\", Courier, monospace"},
        2: {displayName: "Lucida Console", familyName: "\"Lucida Console\", Monaco, monospace"},
        3: {displayName: "Times New Roman", familyName: "\"Times New Roman\", Times, serif"}
    };
    console.log(fonts);
    console.log(printers);
    $.each(printers, function (id, valor) {
        $('#impressora').append($("<option></option>").attr("value", valor.displayName).text(valor.displayName));
    });
    $.each(fonts, function (id, valor) {
        $('#fonte').append($("<option></option>").attr("value", valor.displayName).text(valor.displayName));
    });
    carregaConfig()
    console.log('salvar', document.getElementById('fonte'))
})

function carregaConfig() {
    const fs = require('fs');
    let rawdata = fs.readFileSync(path.join(__dirname, '..', 'printconfig.json'));
    let options = JSON.parse(rawdata);
    console.log('options --->', options);
    $("#impressora").val(options.deviceName).change()
    $("#fonte").val(options.font.displayName).change()
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
        font: document.getElementById('fonte').options[document.getElementById('impressora').selectedIndex].familyName,
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


