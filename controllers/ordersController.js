$(document).ready(function () {
    const fs = require('fs');
    let rawdata = fs.readFileSync('../restaurant-orders-printer-electron/order.json');
    let order = JSON.parse(rawdata);

    $('.restaurant_name').text(order.orders[0].restaurant_name);
    $('.restaurant_street').text("Endereço: " + order.orders[0].restaurant_street);
    $('.restaurant_phone').text("Contato: " + order.orders[0].restaurant_phone);
    $('.id').text("Pedido: " + order.orders[0].id);
    $('.nomeCliente').text("Cliente: " + order.orders[0].client_first_name + " " + order.orders[0].client_last_name);
    $('.client_phone').text("Contato: " + order.orders[0].client_phone);
    $('.client_address').text("Endereço: " + order.orders[0].client_address);
    $('.type').text("Tipo de Entrega: " + order.orders[0].type);
    $('.instructions').text(" " + order.orders[0].instructions);
    let div_table = document.getElementById("table_space");
    let tbl = document.createElement("table");
    tbl.classList.add('table')
    tbl.classList.add('table-bordered')
    tbl.classList.add('table-sm')
    let tblHead = ['Quantidade','Nome','Opções']
    generateTableHead(tbl, tblHead)
    $.each(order.orders[0].items, function (key, value) {
        let opt = "";
        for (let option of value.options) {
            if (opt !== "") {
                opt = opt + ", " + option.name;
            } else {
                opt = option.name;
            }
        }
        let values = [value.quantity,value.name,opt]
        console.log(key, value);
        generateTable(tbl,values)
        console.log(key, value);
    });
    div_table.append(tbl)
    $('.total').text("Valor Total do Pedido: " + order.orders[0].total_price);
    console.log(order.orders[0].id);
    console.log(order.orders[0].total_price);
    console.log(order.orders[0].client_email);
    console.log(order.orders[0].client_last_name);

})
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
