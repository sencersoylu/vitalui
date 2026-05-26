import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import { getSocketUrl, getBControlUrl } from '../config';
import { useDashboardStore } from '../store';
import { linearConversion } from '../utils/linearConversion';

/** Figma frame 157:50 — 1280×720 (scaled from 1920×1080) */
const CANVAS_W = 1280;
const CANVAS_H = 720;
const s = (n: number) => Math.round(n * (CANVAS_W / 1920));

/**
 * Raw 4-20mA analog reading → bar.
 * O2 bank / nitrogen sensors: 0-400 bar, raw range 3240 (4mA) … 16383 (20mA).
 */
const toBar = (raw: number | undefined): string | number =>
	typeof raw === 'number' ? linearConversion(0, 400, 3240, 16383, raw, 0) : '–';

/**
 * Raw 4-20mA analog reading → level percentage.
 * FFS level sensors: 0-100 %, raw range 3240 (4mA) … 16383 (20mA).
 */
const toLevel = (raw: number | undefined): string | number =>
	typeof raw === 'number' ? linearConversion(0, 100, 3240, 16383, raw, 0) : '–';

/**
 * Low-pressure threshold for FFS Air cylinders. Below this value the
 * cylinder is considered depleted and the UI flashes a 'Low Pressure'
 * warning instead of the bar reading.
 */
const LOW_PRESSURE_BAR = 50;
const isLowPressure = (raw: number | undefined): boolean => {
	const v = toBar(raw);
	return typeof v === 'number' && v < LOW_PRESSURE_BAR;
};


export default function TechnicalRoomPage() {
	const {
		lp1Status,
		chillerRunning,
		chillerSetTemp,
		chillerCurrentTemp,
		setChillerRunning,
		setChillerCurrentTemp,
	} = useDashboardStore();

	const [scale, setScale] = useState(1);

	// Raw PLC values from the socket "data" event.
	// The data[] index → screen-value mapping is wired once the field
	// assignments are provided.
	const [rawData, setRawData] = useState<number[]>([]);

	// HP 1 compressor running state — sourced from the B-Control bridge.
	const [hp1Running, setHp1Running] = useState(false);

	// PLC socket.io connection.
	useEffect(() => {
		const url = getSocketUrl();
		console.log('[technical-room] connecting PLC socket →', url);

		const socket = io(url, {
			transports: ['polling', 'websocket'],
			reconnection: true,
			reconnectionAttempts: 10000,
			reconnectionDelay: 5000,
		});

		socket.on('connect', () => console.log('[technical-room] socket connected:', socket.id));
		socket.on('disconnect', (reason) => console.warn('[technical-room] socket disconnected:', reason));
		socket.on('connect_error', (err) => console.error('[technical-room] connect_error:', err?.message || err));

		let logged = false;
		socket.on('data', (raw) => {
			let payload: any;
			try {
				payload = JSON.parse(raw);
			} catch {
				return;
			}
			const d = payload?.data;
			if (!Array.isArray(d)) return;
			if (!logged) {
				logged = true;
				console.log('[technical-room] first "data" payload:', payload);
			}
			setRawData(d);

			// Chiller PV: raw data[15] is in 0.1 C units.
			if (Number.isFinite(d[15])) setChillerCurrentTemp(d[15] / 10);

			// Air Tank (data[30]), O2 banks & nitrogen (data[20]-[24]) and FFS
			// levels (data[11]/[13]) render from rawData via the toBar /
			// toLevel helpers.
			// TODO (need mapping): LP1 status, Chiller SV.
		});

		// Chiller running state + PV — same as dashboard.tsx.
		socket.on('chillerData', (cd: any) => {
			if (cd?.currentTemp !== undefined) setChillerCurrentTemp(cd.currentTemp / 10);
			if (cd?.running !== undefined) setChillerRunning(cd.running === 1);
		});

		return () => {
			socket.off();
			socket.disconnect();
		};
	}, []);

	// HP 1 compressor status — B-Control Micro +NET bridge (not the PLC).
	useEffect(() => {
		const url = getBControlUrl();
		console.log('[technical-room] connecting B-Control bridge →', url);

		const socket = io(url, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 3000,
		});

		socket.on('connect', () => console.log('[technical-room] bcontrol connected:', socket.id));
		socket.on('connect_error', (err: any) =>
			console.warn('[technical-room] bcontrol connect_error:', err?.message || err)
		);

		// Compressor is running when the operating table reports message no 3.
		socket.on('telemetry', (data: any) => {
			const operating = data?.status?.operating;
			setHp1Running(Array.isArray(operating) && operating.some((m: any) => m?.no === 3));
		});

		return () => {
			socket.removeAllListeners();
			socket.disconnect();
		};
	}, []);

	useEffect(() => {
		// Always dark — same Hipertech palette as the corporate dashboard
		// (`hipertech_bilgi/index.html`): base #060E24 with a 135° navy gradient
		// on the canvas itself.
		document.documentElement.classList.add('dark');
		document.body.style.backgroundColor = '#060E24';

		const updateScale = () => {
			setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
		};
		updateScale();
		window.addEventListener('resize', updateScale);
		return () => {
			window.removeEventListener('resize', updateScale);
			document.body.style.backgroundColor = '';
		};
	}, []);

	return (
		<>
			<Head>
				<title>Technical Room Monitoring</title>
			</Head>

			{/* Fill viewport; scale 1280×720 canvas to fit (Electron 1280×720 → scale 1).
			    Hipertech navy palette — matches the corporate dashboard background. */}
			<div
				className="flex items-center justify-center overflow-hidden"
				style={{ width: '100vw', height: '100vh', backgroundColor: '#060E24' }}
			>
				<div
					style={{
						width: CANVAS_W,
						height: CANVAS_H,
						transform: `scale(${scale})`,
						transformOrigin: 'center center',
						position: 'relative',
						flexShrink: 0,
						background:
							'linear-gradient(135deg, #060E24 0%, #0B1A3E 35%, #132B5E 65%, #0D1F47 100%)',
					}}
				>
					{/* Subtle 60×60 grid overlay — same as the Hipertech dashboard. */}
					<div
						className="absolute inset-0 pointer-events-none"
						style={{
							opacity: 0.04,
							backgroundImage:
								'linear-gradient(0deg, rgba(255,255,255,.5) 1px, transparent 1px),' +
								'linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
							backgroundSize: '60px 60px',
						}}
					/>

					{/* Pressure Lines */}
					<div
						className="absolute"
						style={{ left: s(147), top: s(277), width: s(889), height: s(752) }}
					>
						<img alt="" src="/external/pressure-line.svg" className="w-full h-full" draggable={false} />
					</div>

					{/* Logo — forced white via filter to read on the navy background. */}
					<img
						alt="Hipertech"
						src="/external/hipertechlogo2501-ygje.svg"
						className="absolute w-auto"
						style={{ left: 24, top: 16, height: 48, filter: 'brightness(0) invert(1)' }}
						draggable={false}
					/>

					{/* LP 1 — labels at upper-left (LP) and lower-left (Compressor),
					    both left-aligned per Figma 264:180. */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(24), top: s(129), width: s(248), height: s(272) }}
					>
						<img
							alt="LP1 Compressor"
							src="/external/lp-compressor.png"
							className="absolute max-w-none"
							style={{ width: '192.12%', height: '135.6%', left: '-51.45%', top: '-20.87%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(76), top: s(218), fontSize: s(40) }}
					>
						LP
					</p>
					<p
						className="absolute text-center font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(24), top: s(325), width: s(176), fontSize: s(24) }}
					>
						Compressor
					</p>
					<div
						className={`absolute rounded-full ${lp1Status ? 'led-on' : 'led-off'}`}
						style={{ left: s(242), top: s(139), width: s(20), height: s(20) }}
					/>
					<span
						className={`absolute font-poppins font-bold uppercase tracking-wider drop-shadow ${
							lp1Status ? 'text-emerald-400' : 'text-rose-400'
						}`}
						style={{ left: s(272), top: s(132), fontSize: s(24) }}
					>
						{lp1Status ? 'ON' : 'OFF'}
					</span>

					{/* HP 1 — same label layout as LP. */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(34), top: s(517), width: s(320), height: s(381) }}
					>
						<img
							alt="HP1 Compressor"
							src="/external/hp-compressor.png"
							className="absolute max-w-none"
							style={{ width: '138.61%', height: '112.89%', left: '-22.1%', top: '-7.42%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute font-poppins font-bold text-white drop-shadow-md"
						style={{ left: 60, top: s(675), fontSize: s(40) }}
					>
						HP
					</p>
					<p
						className="absolute text-center font-poppins font-bold text-white drop-shadow-md"
						style={{ left: 20, top: 500, width: 117, fontSize: 15 }}
					>
						Compressor
					</p>
					<div
						className={`absolute rounded-full ${hp1Running ? 'led-on' : 'led-off'}`}
						style={{ left: s(320), top: s(535), width: s(20), height: s(20) }}
					/>
					<span
						className={`absolute font-poppins font-bold uppercase tracking-wider drop-shadow ${
							hp1Running ? 'text-emerald-400' : 'text-rose-400'
						}`}
						style={{ left: s(350), top: s(528), fontSize: s(24) }}
					>
						{hp1Running ? 'ON' : 'OFF'}
					</span>

					{/* Air Tank */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(1023), top: s(7), width: s(206), height: s(449) }}
					>
						<img
							alt="Air Tank"
							src="/external/air-tank.png"
							className="absolute max-w-none"
							style={{ width: '392.71%', height: '138.94%', left: '-165.96%', top: '-20.85%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center"
						style={{ left: s(1012), top: s(181), width: s(227), height: s(77) }}
					>
						<span className="font-poppins font-bold text-white tabular-nums" style={{ fontSize: s(32) }}>
							{toBar(rawData[30])} Bar
						</span>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(1023), top: s(465), width: s(206), fontSize: s(24) }}
					>
						Air Stock
					</p>

					{/* Cylinder Bank 1 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(447), top: s(609), width: s(182), height: s(319) }}
					>
						<img
							alt="Cylinder Bank 1"
							src="/external/cylinder-bank.png"
							className="absolute max-w-none"
							style={{ width: '261.89%', height: '115.26%', left: '-107.42%', top: '-8.49%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center"
						style={{ left: s(414), top: s(769), width: s(227), height: s(77) }}
					>
						<span className="font-poppins font-bold text-white" style={{ fontSize: s(32) }}>
							{toBar(rawData[20])} Bar
						</span>
					</div>

					{/* Cylinder Bank 2 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(699), top: s(609), width: s(182), height: s(319) }}
					>
						<img
							alt="Cylinder Bank 2"
							src="/external/cylinder-bank.png"
							className="absolute max-w-none"
							style={{ width: '261.89%', height: '115.26%', left: '-107.42%', top: '-8.49%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center"
						style={{ left: s(666), top: s(769), width: s(227), height: s(77) }}
					>
						<span className="font-poppins font-bold text-white" style={{ fontSize: s(32) }}>
							{toBar(rawData[21])} Bar
						</span>
					</div>

					{/* Chiller — image scaled to 60% (40% smaller), anchored at bottom-center */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(1062), top: s(664), width: s(151), height: s(232) }}
					>
						<img
							alt="Chiller"
							src="/external/chiller.png"
							className="absolute max-w-none"
							style={{ width: '246.9%', height: '124.12%', left: '-96.32%', top: '-15.53%' }}
							draggable={false}
						/>
					</div>
					<div
						className={`absolute rounded-full ${chillerRunning ? 'led-on' : 'led-off'}`}
						style={{ left: s(1196), top: s(670), width: s(20), height: s(20) }}
					/>
					<span
						className={`absolute font-poppins font-bold uppercase tracking-wider drop-shadow ${
							chillerRunning ? 'text-emerald-400' : 'text-rose-400'
						}`}
						style={{ left: s(1226), top: s(663), fontSize: s(24) }}
					>
						{chillerRunning ? 'ON' : 'OFF'}
					</span>
					<p
						className="absolute text-center font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(1062), top: s(610), width: s(151), fontSize: s(24) }}
					>
						Chiller
					</p>
					<div
						className="absolute flex flex-col justify-center bg-slate-900/70 border border-slate-800"
						style={{
							left: s(978),
							top: s(914),
							width: s(320),
							height: s(143),
							borderRadius: s(20),
							paddingLeft: s(22),
							paddingRight: s(22),
						}}
					>
						<div className="flex justify-between items-center gap-2">
							<span className="font-poppins font-semibold text-slate-400" style={{ fontSize: s(24) }}>
								Set
							</span>
							<span className="font-poppins font-bold text-white tabular-nums whitespace-nowrap" style={{ fontSize: s(28) }}>
								{(chillerSetTemp ?? 0).toFixed(1)} °C
							</span>
						</div>
						<div className="flex justify-between items-center gap-2">
							<span className="font-poppins font-semibold text-slate-400" style={{ fontSize: s(24) }}>
								Current
							</span>
							<span className="font-poppins font-bold text-white tabular-nums whitespace-nowrap" style={{ fontSize: s(28) }}>
								{(chillerCurrentTemp ?? 0).toFixed(1)} °C
							</span>
						</div>
					</div>

					{/* Main Chamber FFS */}
					<div
						className="absolute bg-slate-900/60 border border-slate-800"
						style={{
							left: s(1368),
							top: s(20),
							width: s(503),
							height: s(500),
							borderRadius: s(80),
						}}
					/>
					<p
						className="absolute text-center font-poppins font-bold uppercase tracking-wider text-slate-200"
						style={{ left: s(1436), top: s(46), width: s(366), fontSize: s(28) }}
					>
						Main Chamber FFS
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1558), top: s(104), width: s(130), height: s(331) }}
					>
						<img
							alt="Main FFS Tank"
							src="/external/fss-tank.png"
							className="absolute max-w-none"
							style={{ width: '401.18%', height: '121.92%', left: '-182.66%', top: '-13.21%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-white leading-tight"
						style={{ left: s(1570), top: s(210), width: s(106), fontSize: s(20) }}
					>
						Level
						<br />%{toLevel(rawData[11])}
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1479), top: s(130), width: s(46), height: s(221) }}
					>
						<img
							alt="Air #1"
							src="/external/nitrogen-cylinder.png"
							className="absolute max-w-none"
							style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: s(1489), top: s(154), width: s(27), height: s(221) }}
					>
						<p
							className="font-poppins font-bold text-white drop-shadow-md whitespace-nowrap origin-center -rotate-90"
							style={{ fontSize: s(24) }}
						>
							Air #1
						</p>
					</div>
					{isLowPressure(rawData[22]) && (
						<p
							className="absolute text-center font-poppins font-bold text-red-500 animate-pulse whitespace-nowrap drop-shadow-md"
							style={{ left: s(1430), top: s(346), width: s(144), fontSize: s(18) }}
						>
							Low Pressure
						</p>
					)}
					<p
						className={`absolute text-center font-poppins font-bold tabular-nums ${
							isLowPressure(rawData[22]) ? 'text-red-400' : 'text-sky-300'
						}`}
						style={{ left: s(1470), top: s(376), width: s(64), fontSize: s(24) }}
					>
						{toBar(rawData[22])} Bar
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1715), top: s(130), width: s(46), height: s(221) }}
					>
						<img
							alt="Air #2"
							src="/external/nitrogen-cylinder.png"
							className="absolute max-w-none"
							style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: s(1725), top: s(154), width: s(27), height: s(221) }}
					>
						<p
							className="font-poppins font-bold text-white drop-shadow-md whitespace-nowrap origin-center -rotate-90"
							style={{ fontSize: s(24) }}
						>
							Air #2
						</p>
					</div>
					{isLowPressure(rawData[23]) && (
						<p
							className="absolute text-center font-poppins font-bold text-red-500 animate-pulse whitespace-nowrap drop-shadow-md"
							style={{ left: s(1666), top: s(346), width: s(144), fontSize: s(18) }}
						>
							Low Pressure
						</p>
					)}
					<p
						className={`absolute text-center font-poppins font-bold tabular-nums ${
							isLowPressure(rawData[23]) ? 'text-red-400' : 'text-sky-300'
						}`}
						style={{ left: s(1706), top: s(376), width: s(64), fontSize: s(24) }}
					>
						{toBar(rawData[23])} Bar
					</p>

					{/* Ante Chamber FFS */}
					<div
						className="absolute bg-slate-900/60 border border-slate-800"
						style={{
							left: s(1368),
							top: s(574),
							width: s(503),
							height: s(500),
							borderRadius: s(80),
						}}
					/>
					<p
						className="absolute text-center font-poppins font-bold uppercase tracking-wider text-slate-200"
						style={{ left: s(1436), top: s(600), width: s(366), fontSize: s(28) }}
					>
						Ante Chamber FFS
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1598), top: s(658), width: s(130), height: s(331) }}
					>
						<img
							alt="Ante FFS Tank"
							src="/external/fss-tank.png"
							className="absolute max-w-none"
							style={{ width: '401.18%', height: '121.92%', left: '-182.66%', top: '-13.21%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-white leading-tight"
						style={{ left: s(1610), top: s(764), width: s(106), fontSize: s(20) }}
					>
						Level
						<br />%{toLevel(rawData[13])}
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1519), top: s(684), width: s(46), height: s(221) }}
					>
						<img
							alt="Air #1"
							src="/external/nitrogen-cylinder.png"
							className="absolute max-w-none"
							style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: s(1529), top: s(708), width: s(27), height: s(221) }}
					>
						<p
							className="font-poppins font-bold text-white drop-shadow-md whitespace-nowrap origin-center -rotate-90"
							style={{ fontSize: s(24) }}
						>
							Air #1
						</p>
					</div>
					{isLowPressure(rawData[24]) && (
						<p
							className="absolute text-center font-poppins font-bold text-red-500 animate-pulse whitespace-nowrap drop-shadow-md"
							style={{ left: s(1470), top: s(900), width: s(144), fontSize: s(18) }}
						>
							Low Pressure
						</p>
					)}
					<p
						className={`absolute text-center font-poppins font-bold tabular-nums ${
							isLowPressure(rawData[24]) ? 'text-red-400' : 'text-sky-300'
						}`}
						style={{ left: s(1510), top: s(930), width: s(64), fontSize: s(24) }}
					>
						{toBar(rawData[24])} Bar
					</p>
				</div>
			</div>
		</>
	);
}
