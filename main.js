const electron = require('electron');
 
// Módulo utilizado para controlar o ciclo de vida da aplicação
const app = electron.app;
 
// Módulo para criar uma janela nativa do seu sistema operacional 
const BrowserWindow = electron.BrowserWindow;
 
// ATENÇÃO: Se não existir uma referência global para a janela da aplicação,
// ela será fechada automaticamente quando o objeto for pego pelo Garbage Collector
let mainWindow;
//let contents = mainWindow.webContents;

app.on('ready', function() {
 
    // Uma das opções que é possível definir ao criar uma janela, é o seu tamanho
    mainWindow = new BrowserWindow({width: 400, height: 600});
    // Depois apontamos a janela para o HTML que criamos anteriormente
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    //contents.getPrinters();
 
    // Escutamos para quando a janela for fechada
    mainWindow.on('closed', function() {
        // Remove a referência que criamos no começo do arquivo
        mainWindow = null
    });
});