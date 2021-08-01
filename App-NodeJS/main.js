const { app, BrowserWindow } = require("electron")

const server = require('./server')
server.init()

function createWindow(){
    let mainWindow = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true
        }
    })
    mainWindow.maximize()
    mainWindow.loadURL('http://localhost:8080/phyloviz/home')
    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on("ready", createWindow)

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        loadMainWindow()
    }
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
})