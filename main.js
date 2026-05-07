const { app, BrowserWindow, Tray, Menu, screen, nativeImage, ipcMain } = require('electron')

let win = null
let tray = null

const SERVER = 'pomodoro-server-production-6dd5.up.railway.app'

app.dock.hide()

app.whenReady().then(function() {
  createTray()
  createWindow()
})

function createTray() {
  var size = 22
  var buf = Buffer.alloc(size * size * 4, 0)
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var dx = x - 11
      var dy = y - 13
      if ((dx * dx + dy * dy) <= 49 || (x >= 9 && x <= 12 && y >= 3 && y <= 7)) {
        var idx = (y * size + x) * 4
        buf[idx] = 0
        buf[idx + 1] = 0
        buf[idx + 2] = 0
        buf[idx + 3] = 255
      }
    }
  }
  var icon = nativeImage.createFromBuffer(buf, { width: size, height: size })
  icon.setTemplateImage(true)
  tray = new Tray(icon)
  tray.setToolTip('Pomodoro Focus')
  tray.on('click', function() { toggleWindow() })
  tray.on('right-click', function() {
    tray.popUpContextMenu(Menu.buildFromTemplate([
      { label: 'Show / Hide', click: function() { toggleWindow() } },
      { type: 'separator' },
      { label: 'Quit', click: function() { app.quit() } }
    ]))
  })
}

function createWindow() {
  var s = screen.getPrimaryDisplay().workAreaSize
  win = new BrowserWindow({
    width: 260,
    height: 320,
    x: s.width - 280,
    y: s.height - 340,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })
  win.loadFile('index.html')
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
}

function toggleWindow() {
  if (!win) return
  if (win.isVisible()) {
    win.hide()
  } else {
    win.show()
    win.focus()
  }
}

ipcMain.handle('get-message', async function(event, type) {
  var https = require('https')
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: SERVER,
      path: '/message?type=' + type,
      method: 'GET'
    }, function(res) {
      var data = ''
      res.on('data', function(c) { data += c })
      res.on('end', function() {
        try {
          var j = JSON.parse(data)
          resolve(j.message || null)
        } catch(e) { resolve(null) }
      })
    })
    req.on('error', function() { resolve(null) })
    req.end()
  })
})

app.on('window-all-closed', function(e) { e.preventDefault() })
