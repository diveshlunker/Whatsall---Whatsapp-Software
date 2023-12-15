const { app, BrowserWindow } = require('electron');
const puppeteer = require('puppeteer-core');
const io = require('socket.io')();

let mainWindow;
let popupWindow;

// Listen for connections from the popup window
io.on('connection', (socket) => {

  // Read the WhatsApp QR code using Puppeteer
  (async () => {
    const browser = await puppeteer.launch({ executablePath: '/path/to/chrome' });
    const page = await browser.newPage();
    await page.goto('https://web.whatsapp.com/');
    await page.waitForSelector('canvas[aria-label="Scan me!"]');
    const dataUrl = await page.$eval('canvas[aria-label="Scan me!"]', canvas => canvas.toDataURL());
    socket.emit('qr-code', dataUrl);

    // Listen for changes to the QR code and emit them to the popup window
    const observer = new MutationObserver(async () => {
      const newDataUrl = await page.$eval('canvas[aria-label="Scan me!"]', canvas => canvas.toDataURL());
      if (newDataUrl !== dataUrl) {
        dataUrl = newDataUrl;
        socket.emit('qr-code', dataUrl);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Close the Puppeteer browser when the popup window is closed
    socket.on('disconnect', () => {
      observer.disconnect();
      browser.close();
    });
  })();
});

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
}
