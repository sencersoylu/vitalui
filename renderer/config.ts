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
// Socket.io server URL.
// Resolution order:
//   1. NEXT_PUBLIC_SOCKET_URL env var (handy for `next dev` / tunnel testing)
//   2. A full URL configured as the "server IP" (e.g. a Pinggy tunnel)
//   3. http://<ip>:4000 — the normal LAN case
export function getSocketUrl(): string {
	if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
	const ip = getServerIp();
	if (/^https?:\/\//i.test(ip)) return ip;
	return `http://${ip}:4000`;
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
const BCONTROL_URL = 'http://localhost:3001';

export function getBControlUrl(): string {
	return process.env.NEXT_PUBLIC_BCONTROL_URL || BCONTROL_URL;
}
