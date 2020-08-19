$(document).ready(function () {
    const app = require('electron').remote.app;
    const { remote } = require('electron');
    const webContents = remote.getCurrentWebContents();
    const printers = webContents.getPrinters();
    console.log(printers);
    $.each(printers, function(id, valor) {
        $('#impressora').append($("<option></option>").attr("value", id).text(valor.displayName));
    });



})
