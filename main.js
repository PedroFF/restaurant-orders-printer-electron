const electron = require('electron');
const url = require("url");
const path = require('path')
// Módulo utilizado para controlar o ciclo de vida da aplicação
const app = electron.app;

// Módulo para criar uma janela nativa do seu sistema operacional 
const BrowserWindow = electron.BrowserWindow;

// ATENÇÃO: Se não existir uma referência global para a janela da aplicação,
// ela será fechada automaticamente quando o objeto for pego pelo Garbage Collector
let mainWindow;
//let contents = mainWindow.webContents;
var iconPath = '/icon.ico';
app.on('ready', function () {
    // Uma das opções que é possível definir ao criar uma janela, é o seu tamanho
    mainWindow = new BrowserWindow({
        width: 900,
        height: 650,
        minWidth: 600,
        minHeight: 650,
        maxWidth: 900,
        maxHeight: 650,
        maximizable:false,
        webPreferences: {nodeIntegration: true},
        icon: __dirname + iconPath
    });
    mainWindow.webContents.openDevTools();

    mainWindow.setMenuBarVisibility(false)
    // Depois apontamos a janela para o HTML que criamos anteriormente
    mainWindow.loadURL('file://' + __dirname + '/views/index.html');
    // Escutamos para quando a janela for fechada
    mainWindow.once('ready-to-show',()=>{
        mainWindow.show()
    })
    mainWindow.on('closed', function () {
        // Remove a referência que criamos no começo do arquivo
        mainWindow = null
        app.quit()
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
});
app.on('closed', function () {
    mainWindow = null;
});

