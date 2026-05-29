import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, ipcMain, screen } from 'electron';

if (process.env.ELECTRON_DISABLE_SANDBOX) {
	app.commandLine.appendSwitch('no-sandbox');
}
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (process.platform === 'linux') {
	// Each tuning flag is behind an env var so it can be probed individually
	// on the RPi without rebuilding for each combination:
	//
	//   WAYLAND=1     → native Wayland (avoids XWayland hop)
	//   ANGLE_EGL=1   → ANGLE EGL backend
	//   ZERO_COPY=1   → HW raster + DMA-buf zero-copy
	//
	// Stacking known-safe: WAYLAND=1 ZERO_COPY=1 ./MY_APP.AppImage

	if (process.env.WAYLAND === '1') {
		app.commandLine.appendSwitch('ozone-platform', 'wayland');
		app.commandLine.appendSwitch('enable-features', 'UseOzonePlatform,WaylandWindowDecorations');
	}
	if (process.env.ANGLE_EGL === '1') {
		app.commandLine.appendSwitch('use-angle', 'gles-egl');
	}
	if (process.env.ZERO_COPY === '1') {
		app.commandLine.appendSwitch('enable-gpu-rasterization');
		app.commandLine.appendSwitch('enable-zero-copy');
	}

	// `disable-gpu-compositing` removed 2026-05-24 — was forcing software
	// compositing. `in-process-gpu` removed 2026-05-26 — match system
	// Chromium and keep GPU work off the main process. Put either back if
	// the renderer crashes or white-screens.
	app.commandLine.appendSwitch('js-flags', '--max-old-space-size=384');
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

function logMemory() {
	try {
		const memRaw = fs.readFileSync('/proc/meminfo', 'utf-8');
		const total = memRaw.match(/MemTotal:\s+(\d+)/)?.[1];
		const free = memRaw.match(/MemFree:\s+(\d+)/)?.[1];
		const available = memRaw.match(/MemAvailable:\s+(\d+)/)?.[1];
		const swapTotal = memRaw.match(/SwapTotal:\s+(\d+)/)?.[1];
		const swapFree = memRaw.match(/SwapFree:\s+(\d+)/)?.[1];
		log(`memory: total=${total}kB free=${free}kB available=${available}kB swap=${swapFree}/${swapTotal}kB`);
	} catch {}
}

function attachWindowLogging(win: import('electron').BrowserWindow, windowId: string) {
	let crashCount = 0;
	let lastCrashTime = 0;

	win.webContents.on('render-process-gone', (_event, details) => {
		log(`[${windowId}] render-process-gone: reason=${details.reason} exitCode=${details.exitCode}`);
		logMemory();

		const now = Date.now();
		// Reset crash counter if last crash was more than 60s ago
		if (now - lastCrashTime > 60000) {
			crashCount = 0;
		}
		crashCount++;
		lastCrashTime = now;

		if (crashCount > 5) {
			log(`[${windowId}] Too many crashes (${crashCount}), waiting 10s before reload`);
			setTimeout(() => win.webContents.reload(), 10000);
		} else {
			log(`[${windowId}] Reloading (crash #${crashCount})`);
			setTimeout(() => win.webContents.reload(), 1000);
		}
	});

	win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
		log(`[${windowId}] did-fail-load: code=${errorCode} desc="${errorDescription}" url=${validatedURL}`);
		// Retry load after 3s
		if (errorCode !== -3) { // -3 = aborted (intentional navigation)
			setTimeout(() => win.webContents.reload(), 3000);
		}
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
	serverIp?: string;
	windows: WindowConfig[];
}

let serverIp = '192.168.77.100';

const DEFAULT_WINDOWS_CONFIG: WindowsConfig = {
	serverIp: '192.168.77.100',
	windows: [
		{ id: 'o2-analyzer', page: '/o2-analyzer-v2', display: 0, fullscreen: true },
	],
};

function loadWindowsConfig(): WindowsConfig | null {
	try {
		const configPath = path.join(app.getPath('userData'), 'windows-config.json');
		if (!fs.existsSync(configPath)) {
			// First run: write a default config so the technician has a file to edit.
			fs.writeFileSync(
				configPath,
				JSON.stringify(DEFAULT_WINDOWS_CONFIG, null, 2) + '\n',
				'utf-8'
			);
			console.log(`[multi-window] Created default windows-config.json at ${configPath}`);
		}
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

	log('App started');
	logMemory();

	// Log memory every 5 minutes to track gradual leaks
	setInterval(() => {
		logMemory();
	}, 5 * 60 * 1000);

	const config = loadWindowsConfig();
	serverIp = config?.serverIp || serverIp;

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
			// If the page config already carries its own query string
			// (e.g. "dashboard?lang=it"), use `&` instead of `?` so we
			// don't end up with `?lang=it?windowId=...` (which would
			// fold `windowId` into the value of `lang`).
			const querySep = pageUrl.includes('?') ? '&' : '?';

			if (isProd) {
				await win.loadURL(`app://./${pageUrl}${querySep}windowId=${winConfig.id}`);
			} else {
				const port = process.argv[2];
				await win.loadURL(`http://localhost:${port}/${pageUrl}${querySep}windowId=${winConfig.id}`);
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

		// Ctrl+Shift+G → open chrome://gpu in a new window for GPU diagnostics.
		mainWindow.webContents.on('before-input-event', (_event, input) => {
			if (input.control && input.shift && input.key.toLowerCase() === 'g') {
				const gpuWin = new BrowserWindow({ width: 1100, height: 800 });
				gpuWin.loadURL('chrome://gpu');
			}
		});

		if (isProd) {
			await mainWindow.loadURL('app://./home_dik');
		} else {
			const port = process.argv[2];
			await mainWindow.loadURL(`http://localhost:${port}/home_dik`);
			mainWindow.webContents.openDevTools();
		}
	}

	// Auto-open chrome://gpu when launched with OPEN_GPU=1. Works for both the
	// multi-window config path and the single-mainWindow fallback above so SSH
	// users can trigger the GPU diagnostic without a keyboard.
	if (process.env.OPEN_GPU === '1') {
		console.log('[OPEN_GPU] opening chrome://gpu');
		const gpuWin = new BrowserWindow({ width: 1100, height: 800, alwaysOnTop: true });
		gpuWin.loadURL('chrome://gpu');
	}
})();

app.on('window-all-closed', () => {
	app.quit();
});

ipcMain.on('message', async (event, arg) => {
	event.reply('message', `${arg} World!`);
});

ipcMain.on('get-server-ip', (event) => {
	event.returnValue = serverIp;
});
