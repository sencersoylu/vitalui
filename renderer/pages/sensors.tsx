import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import { getSocketUrl } from '../config';
import { useDashboardStore } from '../store';
import { SensorCard } from '../components/dashboard/SensorCard';
import { ChamberSeatOverlay } from '../components/dashboard/ChamberSeatOverlay';

export default function SensorsPage() {
	const {
		darkMode,
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
		lp1Status,
		lp2Status,
		hp1Status,
		chillerRunning,
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

			setMainFssAlarm(errorArray[2] === '1');
			setAnteFssAlarm(errorArray[3] === '1');
			setMainFlameDetected(errorArray[4] === '1');
			setMainSmokeDetected(errorArray[5] === '1');
			setAnteSmokeDetected(errorArray[6] === '1');
			setMainHighO2(errorArray[7] === '1');
			setAnteHighO2(errorArray[8] === '1');
		});

		return () => {
			socket.off();
			socket.disconnect();
			setConnected(false);
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
				className={`min-h-screen overflow-hidden transition-all duration-500 ${
					darkMode
						? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
						: 'bg-gradient-to-br from-sky-100 via-slate-100 to-amber-50'
				}`}>
				{/* Decorative background */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
						darkMode ? 'bg-blue-500/10' : 'bg-sky-400/20'
					}`} />
					<div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
						darkMode ? 'bg-emerald-500/10' : 'bg-amber-400/20'
					}`} />
					<div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-500 ${
						darkMode ? 'bg-indigo-500/5' : 'bg-violet-300/10'
					}`} />
				</div>

				{/* Content */}
				<div className="relative z-10 px-6 py-4 flex flex-col h-screen">
					{/* Header */}
					<header className="flex items-center justify-between mb-4">
						<img
							alt="Hipertech Logo"
							src="/external/hipertechlogo2501-ygje.svg"
							className={`h-12 w-auto transition-all duration-500 ${!darkMode && 'brightness-0'}`}
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
										<SensorCard name="O2 Level" location="Main Chamber" isDark={darkMode} isAlarm={mainHighO2} health={sensorHealth(1)} />
									</div>
									<div className="mt-2">
										<SectionHeader title="Fire System" accent="orange" />
										<div className="flex flex-col gap-1.5">
											<SensorCard name="Fire Suppression (FSS)" location="Main Chamber" isDark={darkMode} isAlarm={mainFssAlarm} isFire />
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
										<SensorCard name="O2 Level" location="Ante Chamber" isDark={darkMode} isAlarm={anteHighO2} health={sensorHealth(5)} />
									</div>
									<div className="mt-2">
										<SectionHeader title="Fire System" accent="orange" />
										<div className="flex flex-col gap-1.5">
											<SensorCard name="Fire Suppression (FSS)" location="Ante Chamber" isDark={darkMode} isAlarm={anteFssAlarm} isFire />
											<SensorCard name="Flame Detector" location="Ante Chamber" isDark={darkMode} isFire />
											<SensorCard name="Smoke Detector" location="Ante Chamber" isDark={darkMode} isAlarm={anteSmokeDetected} isFire />
										</div>
									</div>
								</div>

							</div>

							{/* Technical Room (pinned bottom) */}
							<div className="shrink-0 pt-2 mt-2 border-t border-white/[0.06]">
								<SectionHeader title="Technical Room" accent="cyan" />
								<div className="grid grid-cols-3 gap-1.5">
									<SensorCard name="LP 1 Compressor" location="Technical Room" isDark={darkMode} isAlarm={!lp1Status} />
									<SensorCard name="LP 2 Compressor" location="Technical Room" isDark={darkMode} isAlarm={!lp2Status} />
									<SensorCard name="HP 1 Compressor" location="Technical Room" isDark={darkMode} isAlarm={!hp1Status} />
									<SensorCard name="Chiller" location="Technical Room" isDark={darkMode} isAlarm={!chillerRunning} />
									<SensorCard name="Air Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(8)} />
									<SensorCard name="O2 Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(9)} />
									<SensorCard name="Main FSS Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(10)} />
									<SensorCard name="Main FSS Level" location="Technical Room" isDark={darkMode} health={sensorHealth(11)} />
									<SensorCard name="Ante FSS Pressure" location="Technical Room" isDark={darkMode} health={sensorHealth(12)} />
									<SensorCard name="Ante FSS Level" location="Technical Room" isDark={darkMode} health={sensorHealth(13)} />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
