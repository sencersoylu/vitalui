import path from 'path';
import fs from 'fs';
import { app, ipcMain, screen } from 'electron';

if (process.env.ELECTRON_DISABLE_SANDBOX) {
	app.commandLine.appendSwitch('no-sandbox');
}
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (process.platform === 'linux') {
	app.disableHardwareAcceleration();
	app.commandLine.appendSwitch('disable-gpu-compositing');
	app.commandLine.appendSwitch('disable-software-rasterizer');
	app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
}

// --- Crash & event logger ---
const logFile = path.join(app.getPath('userData'), 'crash-log.txt');

function log(msg: string) {
	const line = `[${new Date().toISOString()}] ${msg}`;
	console.log(line);
	try {
		fs.appendFileSync(logFile, line + '\n');
	} catch {}
}

function attachWindowLogging(win: import('electron').BrowserWindow, windowId: string) {
	win.webContents.on('render-process-gone', (_event, details) => {
		log(`[${windowId}] render-process-gone: reason=${details.reason} exitCode=${details.exitCode}`);
		win.webContents.reload();
	});

	win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
		log(`[${windowId}] did-fail-load: code=${errorCode} desc="${errorDescription}" url=${validatedURL}`);
	});

	win.webContents.on('crashed' as any, () => {
		log(`[${windowId}] webContents crashed event`);
	});

	win.webContents.on('unresponsive' as any, () => {
		log(`[${windowId}] webContents unresponsive`);
	});

	win.webContents.on('responsive' as any, () => {
		log(`[${windowId}] webContents responsive again`);
	});

	win.on('unresponsive', () => {
		log(`[${windowId}] window unresponsive`);
	});

	win.on('responsive', () => {
		log(`[${windowId}] window responsive again`);
	});
}

process.on('uncaughtException', function (err) {
	log(`uncaughtException: ${err.stack || err.message}`);
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

			attachWindowLogging(win, winConfig.id);

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

		attachWindowLogging(mainWindow, 'main');

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
