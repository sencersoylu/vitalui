import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import { getSocketUrl, getBControlUrl } from '../config';
import { useDashboardStore } from '../store';
import { SensorCard } from '../components/dashboard/SensorCard';
import { ChamberSeatOverlay } from '../components/dashboard/ChamberSeatOverlay';

export default function SensorsPage() {
	// This screen is always dark — same as the compressor HMI page. Control
	// rooms run in low light and dark reduces eye strain over long shifts.
	const darkMode = true;

	const {
		connected,
		setConnected,
		mainFssAlarm,
		anteFssAlarm,
		mainFlameDetected,
		mainSmokeDetected,
		anteSmokeDetected,
		mainHighO2,
		anteHighO2,
		setMainFssAlarm,
		setAnteFssAlarm,
		setMainFlameDetected,
		setMainSmokeDetected,
		setAnteSmokeDetected,
		setMainHighO2,
		setAnteHighO2,
		airTankPressure,
		primaryO2Pressure,
		mainFssPressure,
		mainFssLevel,
		anteFssPressure,
		anteFssLevel,
		hp1Status,
		chillerRunning,
		setHp1Status,
		setChillerRunning,
	} = useDashboardStore();

	// Raw analog values from the socket "data" array.
	// A sensor is healthy ('ok') when its raw value is above this threshold.
	const RAW_HEALTH_MIN = 2500;
	const [rawData, setRawData] = useState<number[]>([]);
	const sensorHealth = (i: number): 'ok' | 'nok' => (rawData[i] > RAW_HEALTH_MIN ? 'ok' : 'nok');

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	useEffect(() => {
		const url = getSocketUrl();
		console.log('[sensors] connecting socket →', url);

		const socket = io(url, {
			transports: ['polling', 'websocket'],
			reconnection: true,
			reconnectionAttempts: 10000,
			reconnectionDelay: 5000,
		});

		socket.on('connect', () => {
			console.log('[sensors] socket connected:', socket.id);
			setConnected(true);
		});

		socket.on('disconnect', (reason) => {
			console.warn('[sensors] socket disconnected:', reason);
			setConnected(false);
		});

		socket.on('connect_error', (err) => {
			console.error('[sensors] socket connect_error:', err?.message || err);
			setConnected(false);
		});

		let dataLogged = false;
		socket.on('data', (data) => {
			const errorData = JSON.parse(data);

			// Log the raw payload once so the data[] index → metric mapping can be done.
			if (!dataLogged) {
				dataLogged = true;
				console.log('[sensors] first "data" payload:', errorData);
			}

			// Store the raw analog array — drives per-sensor health (raw > 2500 = OK).
			setRawData(Array.isArray(errorData.data) ? errorData.data : []);

			const errorArray = Number(errorData.data[19])
				.toString(2)
				.padStart(16, '0')
				.split('')
				.reverse();

			// Fire/O2 bits are valid only while the master alarm bit (0) is set —
			// same gate the dashboard uses. Each bit is read independently so every
			// detector card reflects its own sensor (no priority masking).
			if (errorArray[0] === '1') {
				setMainFssAlarm(errorArray[2] === '1');
				setAnteFssAlarm(errorArray[3] === '1');
				setMainFlameDetected(errorArray[4] === '1');
				setMainSmokeDetected(errorArray[5] === '1');
				setAnteSmokeDetected(errorArray[6] === '1');
				setMainHighO2(errorArray[7] === '1');
				setAnteHighO2(errorArray[8] === '1');
			} else {
				setMainFssAlarm(false);
				setAnteFssAlarm(false);
				setMainFlameDetected(false);
				setMainSmokeDetected(false);
				setAnteSmokeDetected(false);
				setMainHighO2(false);
				setAnteHighO2(false);
			}
		});

		// Chiller running state — same chillerData event the dashboard uses.
		socket.on('chillerData', (cd: any) => {
			if (cd?.running !== undefined) setChillerRunning(cd.running === 1);
		});

		return () => {
			socket.off();
			socket.disconnect();
			setConnected(false);
		};
	}, []);

	// HP 1 compressor status — B-Control Micro +NET bridge (not the PLC).
	// Running when the operating table reports message no 3.
	useEffect(() => {
		const url = getBControlUrl();
		console.log('[sensors] connecting B-Control bridge →', url);

		const socket = io(url, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 3000,
		});

		socket.on('connect', () => console.log('[sensors] bcontrol connected:', socket.id));
		socket.on('connect_error', (err: any) =>
			console.warn('[sensors] bcontrol connect_error:', err?.message || err)
		);

		socket.on('telemetry', (data: any) => {
			const operating = data?.status?.operating;
			setHp1Status(Array.isArray(operating) && operating.some((m: any) => m?.no === 3));
		});

		return () => {
			socket.removeAllListeners();
			socket.disconnect();
		};
	}, []);

	const SectionHeader = ({ title, accent = 'blue' }: { title: string; accent?: string }) => {
		const colors = {
			blue: darkMode ? 'text-blue-400 border-blue-500/30' : 'text-blue-600 border-blue-400/30',
			orange: darkMode ? 'text-orange-400 border-orange-500/30' : 'text-orange-600 border-orange-400/30',
			cyan: darkMode ? 'text-cyan-400 border-cyan-500/30' : 'text-cyan-600 border-cyan-400/30',
		};
		return (
			<div className="flex items-center gap-3 mb-2">
				<h2 className={`text-xs font-bold uppercase tracking-[0.15em] ${colors[accent]?.split(' ')[0]}`}>
					{title}
				</h2>
				<div className={`flex-1 h-px ${colors[accent]?.split(' ')[1]} border-t border-dashed`} />
			</div>
		);
	};

	return (
		<>
			<Head>
				<title>Chamber Sensor Monitoring</title>
			</Head>

			<div
				className="min-h-screen overflow-hidden relative"
				style={{
					background:
						'linear-gradient(135deg, #060E24 0%, #0B1A3E 35%, #132B5E 65%, #0D1F47 100%)',
				}}
			>
				{/* Subtle 60×60 grid overlay — matches the Hipertech corporate dashboard. */}
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

				{/* Content */}
				<div className="relative z-10 px-6 py-4 flex flex-col h-screen">
					{/* Header */}
					<header className="flex items-center justify-between mb-4">
						<img
							alt="Hipertech Logo"
							src="/external/hipertechlogo2501-ygje.svg"
							className="h-12 w-auto"
							style={{ filter: 'brightness(0) invert(1)' }}
						/>
						<h1 className={`text-xl font-bold transition-all duration-500 ${
							darkMode ? 'text-white' : 'text-slate-900'
						}`}>
							Chamber Sensor Monitoring
						</h1>
						{/* Socket connection status */}
						<div
							className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all duration-300 ${
								connected
									? darkMode
										? 'bg-emerald-500/10 border-emerald-500/30'
										: 'bg-emerald-50 border-emerald-300/60'
									: darkMode
										? 'bg-red-500/10 border-red-500/30'
										: 'bg-red-50 border-red-300/60'
							}`}>
							<span className="relative flex h-2.5 w-2.5">
								{connected && (
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
								)}
								<span
									className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
										connected
											? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
											: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
									}`}
								/>
							</span>
							<span
								className={`text-xs font-semibold uppercase tracking-wider ${
									connected
										? darkMode ? 'text-emerald-300' : 'text-emerald-700'
										: darkMode ? 'text-red-300' : 'text-red-700'
								}`}>
								{connected ? 'Connected' : 'Disconnected'}
							</span>
						</div>
					</header>

					{/* Main content */}
					<div className="flex-1 flex gap-6 min-h-0">
						{/* Left: Chamber 3D */}
						<div className="hidden xl:flex xl:w-[440px] 2xl:w-[500px] shrink-0 items-center justify-center">
							<ChamberSeatOverlay isDark={darkMode} />
						</div>

						{/* Right: Sensor groups */}
						<div className="flex-1 flex flex-col min-h-0">
							{/* Chamber columns */}
							<div className="flex-1 flex gap-6 overflow-hidden">

								{/* Main Chamber */}
								<div className="flex-1 flex flex-col">
									<SectionHeader title="Main Chamber" />
									<div className="flex flex-col gap-1.5">
										<SensorCard name="Pressure" location="Main Chamber" isDark={darkMode} health={sensorHealth(0)} />
										<SensorCard name="Temperature" location="Main Chamber" isDark={darkMode} health={sensorHealth(2)} />
										<SensorCard name="Humidity" location="Main Chamber" isDark={darkMode} health={sensorHealth(7)} />
										<SensorCard name={<>O<sub>2</sub> Level</>} location="Main Chamber" isDark={darkMode} isAlarm={mainHighO2} health={sensorHealth(1)} />
									</div>
									<div className="mt-2">
										<SectionHeader title="Fire System" accent="orange" />
										<div className="flex flex-col gap-1.5">
											<SensorCard name="Fire Fighting System (FFS)" location="Main Chamber" isDark={darkMode} isAlarm={mainFssAlarm} isFire />
											<SensorCard name="Flame Detector" location="Main Chamber" isDark={darkMode} isAlarm={mainFlameDetected} isFire />
											<SensorCard name="Smoke Detector" location="Main Chamber" isDark={darkMode} isAlarm={mainSmokeDetected} isFire />
										</div>
									</div>
								</div>

								{/* Ante Chamber */}
								<div className="flex-1 flex flex-col">
									<SectionHeader title="Ante Chamber" />
									<div className="flex flex-col gap-1.5">
										<SensorCard name="Pressure" location="Ante Chamber" isDark={darkMode} health={sensorHealth(4)} />
										<SensorCard name="Temperature" location="Ante Chamber" isDark={darkMode} health={sensorHealth(6)} />
										<SensorCard name="Humidity" location="Ante Chamber" isDark={darkMode} health={sensorHealth(7)} />
										<SensorCard name={<>O<sub>2</sub> Level</>} location="Ante Chamber" isDark={darkMode} isAlarm={anteHighO2} health={sensorHealth(5)} />
									</div>
									<div className="mt-2">
										<SectionHeader title="Fire System" accent="orange" />
										<div className="flex flex-col gap-1.5">
											<SensorCard name="Fire Fighting System (FFS)" location="Ante Chamber" isDark={darkMode} isAlarm={anteFssAlarm} isFire />
											<SensorCard name="Smoke Detector" location="Ante Chamber" isDark={darkMode} isAlarm={anteSmokeDetected} isFire />
										</div>
									</div>
								</div>

							</div>

							{/* Technical Room (pinned bottom) */}
							<div className="shrink-0 pt-2 mt-2 border-t border-white/[0.06]">
								<SectionHeader title="Technical Room" accent="cyan" />
								<div className="grid grid-cols-3 gap-1.5">
									{/* No digital source mapped yet — shows Error until LP is wired. */}
									<SensorCard name="LP Compressor" location="Technical Room" isDark={darkMode} health="nok" />
									<SensorCard name="HP Compressor" location="Technical Room" isDark={darkMode} isAlarm={!hp1Status} />
									<SensorCard name="Chiller" location="Technical Room" isDark={darkMode} isAlarm={!chillerRunning} />
									<SensorCard name="Air Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(8)} />
									<SensorCard name={<>O<sub>2</sub> Pressure</>} location="Technical Room" isDark={darkMode} health={sensorHealth(9)} />
									<SensorCard name="Main FFS Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(10)} />
									<SensorCard name="Main FFS Level" location="Technical Room" isDark={darkMode} health={sensorHealth(11)} />
									<SensorCard name="Ante FFS Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(12)} />
									<SensorCard name="Ante FFS Level" location="Technical Room" isDark={darkMode} health={sensorHealth(13)} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
