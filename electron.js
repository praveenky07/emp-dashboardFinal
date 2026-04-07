const { app, BrowserWindow } = require('electron')
const path = require('path')

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "EMP PRO | Enterprise Productivity",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, // Security best practice
      contextIsolation: true,  // Security best practice
      webSecurity: true        // Standard security for remote API calls
    }
  })

  // In production, we load the local index.html file
  // In development, we load the Vite dev server
  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, 'frontend/dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})