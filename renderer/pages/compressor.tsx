import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import {
	Activity,
	AlertTriangle,
	CheckCircle2,
	Gauge,
	Info,
	Power,
	PowerOff,
	RotateCcw,
	Thermometer,
	Wifi,
	WifiOff,
	Wind,
} from 'lucide-react';
import { getBControlUrl } from '../config';
import { cn } from '../components/utils';
import { dewPointFromAbsHumidity } from '../utils/dewPoint';

/**
 * B-Control Micro +NET — live compressor monitoring & control.
 *
 * Built for a 1280×720 industrial HMI panel: a fixed 1280×720 canvas scaled
 * to fit the viewport (scale = 1 on the target panel). Always dark — control
 * rooms run in low light and dark reduces eye strain over long shifts.
 *
 * Connects directly to the `bcontrol-bridge` socket.io server (default :3001).
 *   telemetry  (server -> client): { ts, analog, status }
 *   status     (server -> client): { connected, profile }
 *   control    (client -> server): { cmd: 'ON' | 'OFF' | 'RESET' } -> ack
 */

// HMI target resolution.
const CANVAS_W = 1280;
const CANVAS_H = 720;

// ---- Types mirroring the bridge payload --------------------------------
interface AnalogValue {
	value: number;
	unit: string;
	label: string;
}
interface StatusMessage {
	no: number;
	reg: number;
	bit: number;
	typ: 'operation' | 'failure' | 'warning' | 'unknown';
	en: string;
	de: string;
}
interface Telemetry {
	ts: number;
	analog: Record<string, AnalogValue>;
	status: {
		operating: StatusMessage[];
		failures: StatusMessage[];
		warnings: StatusMessage[];
		other: StatusMessage[];
	};
}
type Command = 'ON' | 'OFF' | 'RESET';

// ---- Short display labels (the bridge labels are too long for tiles) ---
const LABELS: Record<string, string> = {
	finalPressure1: 'Final Pressure 1',
	finalPressure2: 'Final Pressure 2',
	intakePressure: 'Intake Pressure',
	oilPressure: 'Oil Pressure',
	crankcasePress: 'Crankcase Pressure',
	coolingAirTemp: 'Cooling Air Temp',
	lastStageTemp: 'Last Stage Temp',
	dewPoint: 'Dew Point',
	gasBalloonLevel: 'Gas Balloon Level',
	o2: 'Oxygen',
	co2: 'CO₂',
	co: 'CO',
	humidity: 'Humidity',
	voc: 'VOC',
};

// ---- Metric grouping (keys must match lib/registerMap.js) --------------
const GROUPS: { title: string; icon: any; dot: string; tint: string; cols: string; keys: string[] }[] = [
	{
		title: 'Pressures',
		icon: Gauge,
		dot: 'bg-sky-400',
		tint: 'text-sky-400',
		cols: 'grid-cols-5',
		keys: ['finalPressure1', 'finalPressure2', 'intakePressure', 'oilPressure', 'crankcasePress'],
	},
	{
		title: 'Temperatures & Level',
		icon: Thermometer,
		dot: 'bg-amber-400',
		tint: 'text-amber-400',
		cols: 'grid-cols-4',
		keys: ['coolingAirTemp', 'lastStageTemp', 'dewPoint', 'gasBalloonLevel'],
	},
	{
		title: 'Gas & Air Quality',
		icon: Wind,
		dot: 'bg-emerald-400',
		tint: 'text-emerald-400',
		cols: 'grid-cols-5',
		keys: ['o2', 'co2', 'co', 'humidity', 'voc'],
	},
];

// ---- Helpers -----------------------------------------------------------
const fmt = (v: number | undefined): string => {
	if (v === undefined || v === null || Number.isNaN(v)) return '—';
	if (Number.isInteger(v)) return v.toLocaleString('en-US');
	return v.toFixed(2);
};

// Bridge returns CO2 and CO in low-resolution raw units; the panel displays
// the human-readable ppm scale.
const SCALES: Record<string, number> = {
	co2: 100, // 4.40 → 440 ppm
	co: 10,   // 0.20 → 2.0 ppm
};
const scaled = (key: string, v: number | undefined): number | undefined =>
	v === undefined || v === null || Number.isNaN(v) ? v : v * (SCALES[key] ?? 1);

// Per-metric decimal places. Falls back to the default fmt() for any key
// not listed here.
const DECIMALS: Record<string, number> = {
	o2: 1,
	co: 1,
	humidity: 1,
	co2: 0,
	voc: 2,
	dewPoint: 1,
};
const fmtMetric = (key: string, v: number | undefined): string => {
	if (v === undefined || v === null || Number.isNaN(v)) return '—';
	const d = DECIMALS[key];
	if (d !== undefined) return v.toFixed(d);
	return fmt(v);
};

// Plain integer string (no thousands separator) — used for the serial no.
const fmtPlain = (v: number | undefined): string =>
	v === undefined || v === null || Number.isNaN(v) ? '—' : String(v);

// =======================================================================
export default function CompressorPage() {
	const socketRef = useRef<any>(null);
	const [connected, setConnected] = useState(false);
	const [profile, setProfile] = useState<string>('—');
	const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
	const [pending, setPending] = useState<Command | null>(null);
	const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
	const [scale, setScale] = useState(1);

	// Scale the 1280×720 canvas to fit the window (= 1 on the HMI panel).
	useEffect(() => {
		const update = () =>
			setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	// Socket lifecycle.
	useEffect(() => {
		const url = getBControlUrl();
		console.log('[compressor] connecting to bcontrol-bridge →', url);

		const socket = io(url, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 3000,
		});
		socketRef.current = socket;

		socket.on('connect', () => setConnected(true));
		socket.on('disconnect', () => setConnected(false));
		socket.on('connect_error', (err: any) => {
			setConnected(false);
			console.warn('[compressor] connect_error:', err?.message || err);
		});
		socket.on('telemetry', (data: Telemetry) => setTelemetry(data));
		socket.on('status', (s: { connected?: boolean; profile?: string }) => {
			if (typeof s?.profile === 'string') setProfile(s.profile);
		});

		return () => {
			socket.removeAllListeners();
			socket.disconnect();
		};
	}, []);

	// Auto-clear command feedback.
	useEffect(() => {
		if (!feedback) return;
		const t = setTimeout(() => setFeedback(null), 4000);
		return () => clearTimeout(t);
	}, [feedback]);

	const sendCommand = useCallback((cmd: Command) => {
		const socket = socketRef.current;
		if (!socket || !socket.connected) {
			setFeedback({ ok: false, msg: 'Bridge not connected' });
			return;
		}
		setPending(cmd);
		const timeout = setTimeout(() => {
			setPending(null);
			setFeedback({ ok: false, msg: `${cmd}: no response from bridge` });
		}, 5000);

		socket.emit('control', { cmd }, (ack: any) => {
			clearTimeout(timeout);
			setPending(null);
			if (ack && ack.ok) {
				setFeedback({ ok: true, msg: `${cmd} pulse sent → register ${ack.reg}` });
			} else {
				setFeedback({ ok: false, msg: `${cmd} failed: ${(ack && ack.error) || 'unknown error'}` });
			}
		});
	}, []);

	const analog = telemetry?.analog;
	const status = telemetry?.status;

	const counts = useMemo(
		() => ({
			failures: status?.failures.length ?? 0,
			warnings: status?.warnings.length ?? 0,
			operating: status?.operating.length ?? 0,
			other: status?.other.length ?? 0,
		}),
		[status]
	);
	const totalMessages =
		counts.failures + counts.warnings + counts.operating + counts.other;

	// Compressor is "running" if the operating table reports bit 3 (compressor on).
	const compressorOn = status?.operating.some((m) => m.no === 3) ?? false;
	const lastUpdate = telemetry ? new Date(telemetry.ts).toLocaleTimeString('en-GB') : '—';

	return (
		<>
			<Head>
				<title>B-Control Micro +NET — Compressor Monitor</title>
			</Head>

			{/* Viewport filler — centers and scales the fixed HMI canvas.
			    Hipertech navy palette — matches technical-room and sensors. */}
			<div
				className="flex items-center justify-center overflow-hidden"
				style={{ width: '100vw', height: '100vh', backgroundColor: '#060E24' }}
			>
				<div
					className="relative flex flex-col gap-3.5 font-poppins text-white"
					style={{
						width: CANVAS_W,
						height: CANVAS_H,
						// Asymmetric: top/left tightened so the logo (inside the
						// header card, which itself has px-5 = 20 and a 78px
						// height centering the 48px logo) lands at exactly
						// (24, 16) — same as sensors and technical-room.
						padding: '1px 18px 18px 4px',
						transform: `scale(${scale})`,
						transformOrigin: 'center center',
						flexShrink: 0,
						background:
							'linear-gradient(135deg, #060E24 0%, #0B1A3E 35%, #132B5E 65%, #0D1F47 100%)',
					}}
				>
					{/* Subtle 60×60 grid overlay — same Hipertech corporate look. */}
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
					{/* ---------------- Header ---------------- */}
					<header
						className="relative flex shrink-0 items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm px-5"
						style={{ height: 78 }}
					>
						<div className="flex items-center gap-3.5">
							<img
								src="/external/hipertechlogo2501-ygje.svg"
								alt="Hipertech"
								className="w-auto"
								style={{ height: 48, filter: 'brightness(0) invert(1)' }}
								draggable={false}
							/>
							<div className="h-10 w-px bg-slate-700" />
							<div>
								<h1 className="flex items-center gap-2 text-[19px] font-bold leading-tight">
									<Activity size={20} className="shrink-0 text-[#4a90e2]" />
									<span className="flex flex-col leading-[1.15]">
										<span>HP Compressor &amp;</span>
										<span>B-Detection Monitoring</span>
									</span>
								</h1>
							</div>
						</div>

						<div className="flex items-center gap-4">
							<HeaderStat label="Serial No." value={fmtPlain(analog?.serialNumber?.value)} />
							<HeaderStat
								label="Op. Hours"
								value={`${fmt(analog?.operatingHours?.value)} h`}
							/>
							<HeaderStat label="Updated" value={lastUpdate} />

							{/* Compressor running indicator */}
							<div className="ml-1 flex items-center gap-2 whitespace-nowrap rounded-xl bg-slate-800 px-3.5 py-2.5">
								<span
									className={cn('rounded-full', compressorOn ? 'led-on' : 'led-off')}
									style={{ width: 13, height: 13 }}
								/>
								<span className="text-[15px] font-semibold">
									{compressorOn ? 'Running' : 'Stopped'}
								</span>
							</div>

							{/* Connection */}
							<div
								className={cn(
									'flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] font-semibold',
									connected
										? 'bg-emerald-500/15 text-emerald-400'
										: 'bg-rose-500/15 text-rose-400'
								)}
							>
								{connected ? <Wifi size={18} /> : <WifiOff size={18} />}
								{connected ? 'Bridge online' : 'Bridge offline'}
							</div>
						</div>
					</header>

					{/* ---------------- Body ---------------- */}
					<main
						className="relative grid min-h-0 flex-1 gap-3.5"
						style={{ gridTemplateColumns: '1fr 400px' }}
					>
						{/* Metrics — three group cards */}
						<section className="flex min-h-0 flex-col gap-3.5">
							{GROUPS.map((group) => (
								<div
									key={group.title}
									className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-3.5"
								>
									<h2 className="mb-2.5 flex shrink-0 items-center gap-2 text-[14px] font-bold uppercase tracking-wider text-slate-300">
										<group.icon size={17} className={group.tint} />
										{group.title}
									</h2>
									<div className={cn('grid min-h-0 flex-1 gap-2.5', group.cols)}>
										{group.keys.map((key) => {
											const a = analog?.[key];
											// Dew Point is derived locally from absolute
											// humidity (g/m³) via inverse-interpolation
											// against the saturated-vapor table.
											let displayValue: string;
											if (key === 'dewPoint') {
												const dp = dewPointFromAbsHumidity(scaled('humidity', analog?.humidity?.value));
												displayValue = dp === null ? '###' : fmtMetric(key, dp);
											} else {
												displayValue = fmtMetric(key, scaled(key, a?.value));
											}
											return (
												<MetricTile
													key={key}
													dot={group.dot}
													label={LABELS[key] ?? a?.label ?? key}
													value={displayValue}
													unit={key === 'dewPoint' ? '°C' : a?.unit ?? ''}
												/>
											);
										})}
									</div>
								</div>
							))}
						</section>

						{/* Status messages + controls */}
						<aside className="flex min-h-0 flex-col gap-3.5">
							<div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-3.5">
								<div className="mb-2.5 flex shrink-0 items-center justify-between">
									<h2 className="text-[14px] font-bold uppercase tracking-wider text-slate-300">
										System Messages
									</h2>
									<div className="flex gap-1.5">
										<CountChip tone="rose" label="FAIL" value={counts.failures} />
										<CountChip tone="amber" label="WARN" value={counts.warnings} />
										<CountChip tone="emerald" label="OP" value={counts.operating} />
									</div>
								</div>

								<div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto scrollbar-thin pr-1">
									{!telemetry && <EmptyState text="Waiting for telemetry…" />}
									{telemetry && totalMessages === 0 && (
										<EmptyState text="No active messages — all systems nominal" ok />
									)}
									{status?.failures.map((m) => (
										<MessageRow key={`f${m.no}`} msg={m} tone="failure" />
									))}
									{status?.warnings.map((m) => (
										<MessageRow key={`w${m.no}`} msg={m} tone="warning" />
									))}
									{status?.operating.map((m) => (
										<MessageRow key={`o${m.no}`} msg={m} tone="operation" />
									))}
									{status?.other.map((m) => (
										<MessageRow key={`u${m.no}`} msg={m} tone="unknown" />
									))}
								</div>
							</div>

							{/* Control panel */}
							<div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-3.5">
								<h2 className="mb-2.5 text-[14px] font-bold uppercase tracking-wider text-slate-300">
									Control
								</h2>
								<div className="grid grid-cols-3 gap-3">
									<ControlButton
										label="ON"
										icon={<Power size={26} />}
										tone="on"
										disabled={!connected || pending !== null}
										loading={pending === 'ON'}
										onClick={() => sendCommand('ON')}
									/>
									<ControlButton
										label="OFF"
										icon={<PowerOff size={26} />}
										tone="off"
										disabled={!connected || pending !== null}
										loading={pending === 'OFF'}
										onClick={() => sendCommand('OFF')}
									/>
									<ControlButton
										label="RESET"
										icon={<RotateCcw size={26} />}
										tone="reset"
										disabled={!connected || pending !== null}
										loading={pending === 'RESET'}
										onClick={() => sendCommand('RESET')}
									/>
								</div>
								{/* Reserves height so the buttons don't shift when a
								    command result appears; empty until a button is pressed. */}
								<div
									className="mt-2.5 flex h-5 items-center justify-center text-[13px] font-medium"
									role="status"
									aria-live="polite"
								>
									{feedback && (
										<span className={feedback.ok ? 'text-emerald-400' : 'text-rose-400'}>
											{feedback.msg}
										</span>
									)}
								</div>
							</div>
						</aside>
					</main>
				</div>
			</div>
		</>
	);
}

// ---- Sub-components ----------------------------------------------------
function HeaderStat({ label, value }: { label: string; value: string }) {
	return (
		<div className="text-right">
			<p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-slate-500">
				{label}
			</p>
			<p className="whitespace-nowrap text-[16px] font-bold tabular-nums leading-tight text-white">
				{value}
			</p>
		</div>
	);
}

function MetricTile({
	dot,
	label,
	value,
	unit,
}: {
	dot: string;
	label: string;
	value: string;
	unit: string;
}) {
	return (
		<div className="flex h-full flex-col justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-3.5">
			{/* Fixed-height label area keeps values aligned across a row even
			    when a label wraps to two lines. */}
			<div className="flex h-[34px] items-start gap-1.5">
				<span className={cn('mt-[3px] h-2 w-2 shrink-0 rounded-full', dot)} />
				<span className="text-[13px] font-semibold leading-[1.25] tracking-wide text-slate-400 line-clamp-2">
					{label}
				</span>
			</div>
			<div className="flex items-baseline gap-1.5">
				<span className="text-[31px] font-bold leading-none tabular-nums text-white">
					{value}
				</span>
				{unit && <span className="text-[15px] font-medium text-slate-500">{unit}</span>}
			</div>
		</div>
	);
}

function CountChip({
	tone,
	label,
	value,
}: {
	tone: 'rose' | 'amber' | 'emerald';
	label: string;
	value: number;
}) {
	const active = value > 0;
	const tones = {
		rose: active ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-600',
		amber: active ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-600',
		emerald: active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-600',
	};
	return (
		<span
			className={cn(
				'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold tabular-nums',
				tones[tone]
			)}
		>
			{label}
			<span className="text-[13px]">{value}</span>
		</span>
	);
}

function MessageRow({
	msg,
	tone,
}: {
	msg: StatusMessage;
	tone: 'failure' | 'warning' | 'operation' | 'unknown';
}) {
	const cfg = {
		failure: {
			cls: 'bg-rose-500/10 border-rose-500/30 text-rose-200',
			icon: <AlertTriangle size={18} className="shrink-0 text-rose-400" />,
		},
		warning: {
			cls: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
			icon: <AlertTriangle size={18} className="shrink-0 text-amber-400" />,
		},
		operation: {
			cls: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200',
			icon: <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />,
		},
		unknown: {
			cls: 'bg-slate-700/30 border-slate-600/40 text-slate-300',
			icon: <Info size={18} className="shrink-0 text-slate-400" />,
		},
	}[tone];

	return (
		<div
			className={cn(
				'flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2',
				cfg.cls
			)}
		>
			{cfg.icon}
			<span className="flex-1 text-[15px] font-medium leading-tight" title={msg.de || msg.en}>
				{msg.en || msg.de || `Bit ${msg.no}`}
			</span>
			<span className="shrink-0 font-mono text-[11px] text-slate-500">
				#{msg.no} · R{msg.reg}.{msg.bit}
			</span>
		</div>
	);
}

function ControlButton({
	label,
	icon,
	tone,
	disabled,
	loading,
	onClick,
}: {
	label: string;
	icon: React.ReactNode;
	tone: 'on' | 'off' | 'reset';
	disabled: boolean;
	loading: boolean;
	onClick: () => void;
}) {
	const tones = {
		on: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30',
		off: 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30',
		reset: 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/30',
	};
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			className={cn(
				'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl font-bold shadow-lg',
				'transition-colors duration-200 active:scale-[0.97]',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
				'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
				tones[tone]
			)}
			style={{ height: 92 }}
		>
			<span className={loading ? 'animate-pulse' : ''}>{icon}</span>
			<span className="text-[16px] tracking-wide">{loading ? '…' : label}</span>
		</button>
	);
}

function EmptyState({ text, ok }: { text: string; ok?: boolean }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-2.5 py-8 text-slate-500">
			{ok ? <CheckCircle2 size={34} className="text-emerald-500" /> : <Info size={34} />}
			<span className="text-[15px] font-medium">{text}</span>
		</div>
	);
}
