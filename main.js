const { app, BrowserWindow, Menu, dialog, shell, ipcMain, nativeTheme, session, Notification } = require('electron');
const path = require('path');

let win;
let splash;
let activeDownload = null;

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

  session.defaultSession.on('will-download', (event, item) => {
    activeDownload = item;
    updateMenu();

    const totalBytes = item.getTotalBytes();
    const notification = new Notification({
      title: 'Download Started',
      body: `Downloading ${item.getFilename()}`
    });
    notification.show();

    item.on('updated', (_, state) => {
      if (state === 'progressing' && !item.isPaused()) {
        const progress = Math.round((item.getReceivedBytes() / totalBytes) * 100);
        win.setTitle(`Downloading: ${progress}% - Bale`);
        win.setProgressBar(progress / 100);
      }
    });

    item.once('done', (_, state) => {
      activeDownload = null;
      updateMenu();
      win.setProgressBar(-1);
      win.setTitle('Bale');

      if (state === 'completed') {
        const filePath = item.getSavePath();
        const completedNotification = new Notification({
          title: 'Download Complete',
          body: `${item.getFilename()} has finished downloading`,
        });

        completedNotification.on('click', () => {
          shell.showItemInFolder(filePath);
        });

        completedNotification.show();
      } else {
        new Notification({
          title: 'Download Failed',
          body: `${item.getFilename()} could not be downloaded`
        }).show();
      }
    });
  });

  updateMenu();
}

function updateMenu() {
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
      label: 'Cancel Download',
      submenu: activeDownload
        ? [
          {
            label: 'Cancel Download',
            click: () => {
              if (activeDownload) {
                activeDownload.cancel();
                activeDownload = null;
                updateMenu();
              }
            }
          }
        ]
        : [{ label: 'No Active Downloads', enabled: false }]
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
              message: `Bale is the social-financial network of Bank Melli Iran that simultaneously enables communication and payments. With Bale, you can easily make voice and video calls and share your moments with friends using the "Status" feature.\nVersion: 1.2.0`,
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
