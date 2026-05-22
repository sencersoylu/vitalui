// Server configuration helpers.
//
// The backend server IP is provided by the Electron main process, which reads
// it from `windows-config.json` (see main/background.ts). It is bridged to the
// renderer as `window.ipc.getServerIp()` by main/preload.ts.
//
// Falls back to DEFAULT_SERVER_IP when running outside Electron (Next.js
// SSR/build, or `next dev` without the Electron shell).

const DEFAULT_SERVER_IP = '192.168.77.100';

export function getServerIp(): string {
	try {
		if (typeof window === 'undefined') return DEFAULT_SERVER_IP;
		const ipc = (window as any).ipc;
		if (!ipc || typeof ipc.getServerIp !== 'function') return DEFAULT_SERVER_IP;
		const ip = ipc.getServerIp();
		return typeof ip === 'string' && ip.length > 0 ? ip : DEFAULT_SERVER_IP;
	} catch {
		return DEFAULT_SERVER_IP;
	}
}

// Socket.io server URL — e.g. http://192.168.77.100:4000
export function getSocketUrl(): string {
	return `http://${getServerIp()}:4000`;
}

// Tech-calibration JSON endpoint — e.g. http://192.168.77.100/json.php?i=tech
export function getTechUrl(): string {
	return `http://${getServerIp()}/json.php?i=tech`;
}

// B-Control bridge socket.io URL.
// The bcontrol-bridge process (Modbus TCP <-> socket.io) emits `telemetry` /
// `status` and accepts `control`. It runs on the same machine as this HMI,
// so the default is localhost:3001.
// Override at runtime with NEXT_PUBLIC_BCONTROL_URL.
const BCONTROL_URL = 'http://127.0.0.1:3001';

export function getBControlUrl(): string {
	return process.env.NEXT_PUBLIC_BCONTROL_URL || BCONTROL_URL;
}
