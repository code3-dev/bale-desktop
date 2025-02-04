const { app, BrowserWindow, Menu, dialog, shell, ipcMain, nativeTheme } = require('electron');
const path = require('path');

let win;
let splash;

function createSplash() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  splash.loadFile('assets/splash.html');
}

function createWindow() {
  splash.close();

  win = new BrowserWindow({
    width: 850,
    height: 650,
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false
    },
  });

  win.maximize();
  win.loadURL('https://beta.bale.ai');

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const menuTemplate = [
    {
      label: 'Bale',
      submenu: [
        {
          label: 'Home',
          click: () => win.loadURL('https://beta.bale.ai')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(win, {
              type: 'info',
              title: 'About Bale',
              message: `Bale is the social-financial network of Bank Melli Iran that simultaneously enables communication and payments. With Bale, you can easily make voice and video calls and share your moments with friends using the "Status" feature.\nVersion: 1.1.0`,
              buttons: ['OK'],
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Contact Developer',
          enabled: false
        },
        {
          label: 'Telegram',
          click: () => shell.openExternal('https://t.me/h3dev')
        },
        {
          label: 'Instagram',
          click: () => shell.openExternal('https://instagram.com/h3dev.pira')
        },
        {
          label: 'Email',
          click: () => shell.openExternal('mailto:h3dev.pira@gmail.com')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const contextMenu = Menu.buildFromTemplate([
    { role: 'cut', label: 'Cut' },
    { role: 'copy', label: 'Copy' },
    { role: 'paste', label: 'Paste' },
    { type: 'separator' },
    { role: 'selectAll', label: 'Select All' },
    { role: 'togglefullscreen' }
  ]);

  win.webContents.on('context-menu', (event, params) => {
    contextMenu.popup(win, params.x, params.y);
  });
}

app.whenReady().then(() => {
  createSplash();
  setTimeout(createWindow, 2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  nativeTheme.themeSource = 'dark';
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
