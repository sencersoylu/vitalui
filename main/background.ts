import path from 'path';
import { app, ipcMain } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (process.platform === 'linux') {
	app.disableHardwareAcceleration();
}

process.on('uncaughtException', function (err) {
	console.log(err);
});

if (isProd) {
	serve({ directory: 'app' });
} else {
	app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
	await app.whenReady();

	const mainWindow = createWindow('main', {
		width: 1280,
		height: 720,
		fullscreen: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	mainWindow.webContents.on('render-process-gone', (event, detailed) => {
		if (detailed.reason === 'crashed') {
			mainWindow.webContents.reload();
		}
	});

	if (isProd) {
		await mainWindow.loadURL('app://./o2-analyzer');
	} else {
		const port = process.argv[2];
		await mainWindow.loadURL(`http://localhost:${port}/home_dik`);
		mainWindow.webContents.openDevTools();
	}
})();

app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('message', async (event, arg) => {
	event.reply('message', `${arg} World!`);
});
