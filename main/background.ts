import path from 'path';
import fs from 'fs';
import { app, ipcMain, screen } from 'electron';
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

interface WindowConfig {
	id: string;
	page: string;
	display: number;
	fullscreen?: boolean;
}

interface WindowsConfig {
	windows: WindowConfig[];
}

function loadWindowsConfig(): WindowsConfig | null {
	try {
		const configPath = path.join(app.getPath('userData'), 'windows-config.json');
		if (!fs.existsSync(configPath)) return null;
		const raw = fs.readFileSync(configPath, 'utf-8');
		const config = JSON.parse(raw) as WindowsConfig;
		if (!config.windows || !Array.isArray(config.windows) || config.windows.length === 0) return null;
		for (const w of config.windows) {
			if (!w.id || !w.page || typeof w.display !== 'number') return null;
		}
		return config;
	} catch {
		return null;
	}
}

(async () => {
	await app.whenReady();

	const config = loadWindowsConfig();

	if (config) {
		const displays = screen.getAllDisplays();

		console.log('[multi-window] Available displays:');
		displays.forEach((d, i) => {
			console.log(`  [${i}] id=${d.id} bounds=${JSON.stringify(d.bounds)}`);
		});

		for (const winConfig of config.windows) {
			const displayIndex = winConfig.display < displays.length ? winConfig.display : 0;
			const display = displays[displayIndex];
			const { x, y, width, height } = display.bounds;
			const fullscreen = winConfig.fullscreen !== false;

			console.log(`[multi-window] Creating "${winConfig.id}" on display ${displayIndex} at x=${x} y=${y} ${width}x${height} fullscreen=${fullscreen}`);

			const win = createWindow(winConfig.id, {
				x,
				y,
				width,
				height,
				fullscreen: false,
				webPreferences: {
					preload: path.join(__dirname, 'preload.js'),
				},
			});

			// Force position onto correct display, then fullscreen
			win.setPosition(x, y);
			win.setSize(width, height);

			win.once('ready-to-show', () => {
				win.setPosition(x, y);
				if (fullscreen) {
					win.setFullScreen(true);
				}
			});

			win.once('show', () => {
				win.setPosition(x, y);
				if (fullscreen) {
					win.setFullScreen(true);
				}
			});

			win.webContents.on('render-process-gone', (_event, detailed) => {
				if (detailed.reason === 'crashed') {
					win.webContents.reload();
				}
			});

			const pageUrl = winConfig.page.startsWith('/') ? winConfig.page.slice(1) : winConfig.page;

			if (isProd) {
				await win.loadURL(`app://./${pageUrl}?windowId=${winConfig.id}`);
			} else {
				const port = process.argv[2];
				await win.loadURL(`http://localhost:${port}/${pageUrl}?windowId=${winConfig.id}`);
				win.webContents.openDevTools();
			}
		}
	} else {
		const mainWindow = createWindow('main', {
			width: 1280,
			height: 720,
			fullscreen: true,
			webPreferences: {
				preload: path.join(__dirname, 'preload.js'),
			},
		});

		mainWindow.webContents.on('render-process-gone', (_event, detailed) => {
			if (detailed.reason === 'crashed') {
				mainWindow.webContents.reload();
			}
		});

		if (isProd) {
			await mainWindow.loadURL('app://./dashboard');
		} else {
			const port = process.argv[2];
			await mainWindow.loadURL(`http://localhost:${port}/dashboard`);
			mainWindow.webContents.openDevTools();
		}
	}
})();

app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('message', async (event, arg) => {
	event.reply('message', `${arg} World!`);
});
