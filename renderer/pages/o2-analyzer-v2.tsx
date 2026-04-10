import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import { Sun, Moon, AlertTriangle } from 'lucide-react';
import { O2AnalyzerCardV2 } from '../components/O2AnalyzerCardV2';
import { O2AnalyzerSettings } from '../components/O2AnalyzerSettings';
import { useChambers } from '../hooks/useChambers';
import { useLatestReading } from '../hooks/useReadings';
import { useChamberAlarms } from '../hooks/useAlarms';
import { useDashboardStore } from '../store';
import { Chamber } from '../api/chambers';
import { cn } from '../components/utils';

// ChamberCard wrapper component
interface ChamberCardProps {
	chamber: Chamber;
	onSettingsClick: () => void;
	onMuteAlarm: () => void;
	isMuted: boolean;
	onAlarmStateChange: (chamberId: number, hasAlarm: boolean) => void;
	showAlarm?: boolean;
}

const ChamberCard: React.FC<ChamberCardProps> = ({
	chamber,
	onSettingsClick,
	onMuteAlarm,
	isMuted,
	onAlarmStateChange,
	showAlarm = true,
}) => {
	const { reading } = useLatestReading(
		chamber.id,
		true,
		5000 // Update every 5 seconds
	);
	const { alarms } = useChamberAlarms(chamber.id);

	// Get O2 level from reading or chamber
	const o2Level = reading?.o2Level ?? chamber.lastValue ?? 21.0;
	const alarmLevel = chamber.alarmLevelHigh;

	// Check for active alarms from backend
	const activeAlarms = Array.isArray(alarms)
		? alarms.filter((alarm) => alarm.isActive)
		: [];
	const hasBackendAlarms = activeAlarms.length > 0;

	// Also check if O2 level exceeds alarm threshold (frontend check)
	const hasO2Alarm = o2Level > alarmLevel;

	// Alarm is active if either backend reports alarm OR O2 level exceeds threshold
	const hasActiveAlarms = showAlarm ? (hasBackendAlarms || hasO2Alarm) : false;

	// Report alarm state changes to parent
	useEffect(() => {
		onAlarmStateChange(chamber.id, hasActiveAlarms);
	}, [chamber.id, hasActiveAlarms, onAlarmStateChange]);

	// Last calibration formatting
	const lastCalibration = chamber.calibrationDate
		? new Date(chamber.calibrationDate).toLocaleDateString('en-US') +
		  ' ' +
		  new Date(chamber.calibrationDate).toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
		  })
		: 'Never';

	// Format FiO names: "fio1" → "FiO₂ - 1"
	const displayName = !showAlarm
		? chamber.name.replace(/^fio(\d+)$/i, 'FiO₂ - $1')
		: chamber.name;

	return (
		<O2AnalyzerCardV2
			title={displayName}
			o2Level={o2Level}
			alarmLevel={alarmLevel}
			isAlarmActive={hasActiveAlarms}
			lastCalibration={lastCalibration}
			lastSensorChange={chamber.lastSensorChange}
			onSettingsClick={onSettingsClick}
			onMuteAlarm={showAlarm ? onMuteAlarm : undefined}
			isMuted={isMuted}
			showAlarm={showAlarm}
		/>
	);
};

export default function O2AnalyzerV2Page() {
	const { darkMode, setDarkMode } = useDashboardStore();

	const [currentTime, setCurrentTime] = useState('');
	const [currentDate, setCurrentDate] = useState('');
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
	const [mutedAlarms, setMutedAlarms] = useState<{ [key: number]: boolean }>(
		{}
	);

	// Socket reference for PLC communication
	const socketRef = useRef<any>(null);

	// Track previous alarm states to detect changes
	const prevAlarmStatesRef = useRef<{ [key: number]: boolean }>({});

	// Backend data hooks
	const {
		chambers: apiChambers,
		loading: chambersLoading,
		error: chambersError,
		refetch: refetchChambers,
	} = useChambers();

	// Mock data for preview when backend is unavailable
	const mockChambers: Chamber[] = [
		{
			id: 1, name: 'Main', description: 'Main Chamber',
			lastValue: 20.6, raw0: null, raw21: null, raw100: null,
			calibrationDate: '2026-01-07T02:02:00Z',
			alarmLevelHigh: 31, alarmLevelLow: 16,
			lastSensorChange: '2024-11-15T10:00:00Z', isActive: true,
			createdAt: '', updatedAt: '',
		},
		{
			id: 2, name: 'Ante', description: 'Ante Chamber',
			lastValue: 20.5, raw0: null, raw21: null, raw100: null,
			calibrationDate: '2026-01-07T02:27:00Z',
			alarmLevelHigh: 24, alarmLevelLow: 16,
			lastSensorChange: '2025-06-20T10:00:00Z', isActive: true,
			createdAt: '', updatedAt: '',
		},
	];

	// Use API data if available, otherwise fall back to mock
	const chambers = apiChambers.length > 0 ? apiChambers : mockChambers;

	// Filter to only Main/Ante chambers (exclude FiO sensors)
	const mainAnteChambers = chambers.filter(
		(c) => !c.name.toLowerCase().startsWith('fio')
	);

	// Connection states
	const [socketConnected, setSocketConnected] = useState(false);
	const apiConnected = !chambersError;

	// Initialize socket connection
	useEffect(() => {
		const socket = io('http://192.168.77.100:4000', {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socket.on('connect', () => {
			setSocketConnected(true);
		});

		socket.on('connect_error', () => {
			setSocketConnected(false);
		});

		socket.on('disconnect', () => {
			setSocketConnected(false);
		});

		socketRef.current = socket;

		return () => {
			console.log('O2 Analyzer v2: Cleaning up socket connection');
			socket.disconnect();
		};
	}, []);

	// Update current time and date every second
	useEffect(() => {
		const updateDateTime = () => {
			const now = new Date();
			const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(
				now.getMonth() + 1
			)
				.toString()
				.padStart(2, '0')}.${now.getFullYear()}`;
			setCurrentDate(formattedDate);

			const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now
				.getMinutes()
				.toString()
				.padStart(2, '0')}`;
			setCurrentTime(formattedTime);
		};

		updateDateTime();
		const interval = setInterval(updateDateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	// Display error messages
	useEffect(() => {
		if (chambersError) {
			toast.error(`Chambers Error: ${chambersError}`, {
				duration: 5000,
				position: 'top-center',
			});
		}
	}, [chambersError]);

	// Sensor expiry warnings — only check with real API data, not mock
	const [expiredSensors, setExpiredSensors] = useState<{ name: string; months: number; date: string }[]>([]);
	const [showSensorWarning, setShowSensorWarning] = useState(false);
	const sensorCheckDone = useRef(false);

	useEffect(() => {
		if (apiChambers.length === 0 || sensorCheckDone.current) return;
		sensorCheckDone.current = true;

		const oneYearAgo = new Date();
		oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

		const expired: { name: string; months: number; date: string }[] = [];
		apiChambers.forEach((chamber) => {
			if (!chamber.lastSensorChange) return;
			const changeDate = new Date(chamber.lastSensorChange);
			if (changeDate < oneYearAgo) {
				const days = Math.floor((Date.now() - changeDate.getTime()) / (1000 * 60 * 60 * 24));
				expired.push({
					name: chamber.name,
					months: Math.floor(days / 30),
					date: changeDate.toLocaleDateString('en-US') + ' ' + changeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
				});
			}
		});

		if (expired.length > 0) {
			setExpiredSensors(expired);
			setShowSensorWarning(true);
		}
	}, [apiChambers]);

	const handleSettingsClick = (chamber: Chamber) => {
		setSelectedChamber(chamber);
		setSettingsOpen(true);
	};

	const handleMuteAlarm = (chamber: Chamber) => {
		const isMuted = mutedAlarms[chamber.id] || false;

		// Determine which PLC bit to write based on chamber name
		const isMainChamber = chamber.name.toLowerCase().includes('main');
		const register = isMainChamber ? 'M0407' : 'M0408';

		if (isMuted) {
			// Unmute the alarm
			setMutedAlarms((prev) => ({ ...prev, [chamber.id]: false }));
			toast.success(`${chamber.name} alarm activated`, {
				duration: 3000,
				position: 'top-center',
			});

			// Write to PLC - set alarm bit back to 1 (alarm active)
			if (socketRef.current && socketRef.current.connected) {
				console.log(`O2 Analyzer v2: Unmute - Writing to ${register} value 1`);
				socketRef.current.emit('writeBit', { register, value: 1 });
			}
		} else {
			// Mute the alarm
			setMutedAlarms((prev) => ({ ...prev, [chamber.id]: true }));
			toast.success(`${chamber.name} alarm muted for 5 minutes`, {
				duration: 3000,
				position: 'top-center',
			});

			// Write to PLC - set alarm bit to 0 (muted/silenced)
			if (socketRef.current && socketRef.current.connected) {
				console.log(`O2 Analyzer v2: Mute - Writing to ${register} value 0`);
				socketRef.current.emit('writeBit', { register, value: 0 });
			}

			// Auto unmute after 5 minutes
			setTimeout(() => {
				setMutedAlarms((prev) => ({ ...prev, [chamber.id]: false }));
				if (socketRef.current && socketRef.current.connected) {
					console.log(
						`O2 Analyzer v2: Auto-unmute - Writing to ${register} value 1`
					);
					socketRef.current.emit('writeBit', { register, value: 1 });
				}
			}, 5 * 60 * 1000); // 5 minutes
		}
	};

	// Handle alarm state changes and write to PLC bits
	// M00407 = Main Chamber alarm, M00408 = Ante Chamber alarm
	const handleAlarmStateChange = useCallback(
		(chamberId: number, hasAlarm: boolean) => {
			const prevState = prevAlarmStatesRef.current[chamberId];

			// Skip first load (when prevState is undefined) - just store the initial state
			if (prevState === undefined) {
				prevAlarmStatesRef.current[chamberId] = hasAlarm;
				return;
			}

			// Only write to PLC if state has actually changed
			if (prevState !== hasAlarm) {
				prevAlarmStatesRef.current[chamberId] = hasAlarm;

				if (socketRef.current && socketRef.current.connected) {
					const chamber = chambers.find((c) => c.id === chamberId);
					if (chamber) {
						const isMainChamber = chamber.name.toLowerCase().includes('main');
						const register = isMainChamber ? 'M0407' : 'M0408';
						// Write 1 when alarm active, 0 when alarm cleared
						socketRef.current.emit('writeBit', { register, value: hasAlarm ? 1 : 0 });
					}
				}
			}
		},
		[chambers]
	);

	// Loading state (skip if mock data is being used)
	if (chambersLoading && apiChambers.length === 0) {
		return (
			<div
				className={cn(
					'h-screen flex items-center justify-center',
					darkMode
						? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] animate-gradient-shift'
						: 'bg-gradient-to-br from-[#e8edf5] to-[#f0f4ff]'
				)}
			>
				<div className="text-center">
					<div
						className={cn(
							'animate-spin rounded-full h-32 w-32 border-b-2 mx-auto mb-4',
							darkMode ? 'border-blue-300' : 'border-blue-600'
						)}
					></div>
					<p
						className={cn(
							'text-xl',
							darkMode ? 'text-blue-300' : 'text-blue-600'
						)}
					>
						Loading chambers...
					</p>
				</div>
			</div>
		);
	}

	// Error state
	if (chambersError && chambers.length === 0) {
		return (
			<div
				className={cn(
					'h-screen flex items-center justify-center',
					darkMode
						? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] animate-gradient-shift'
						: 'bg-gradient-to-br from-[#e8edf5] to-[#f0f4ff]'
				)}
			>
				<div className="text-center">
					<p className="text-xl text-red-500 mb-4">Error loading chambers</p>
					<p className={cn('', darkMode ? 'text-slate-400' : 'text-slate-600')}>
						{chambersError}
					</p>
				</div>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>O2 Analyzer - Hipertech</title>
				<meta name="description" content="O2 Analyzer Dashboard" />
			</Head>

			<div
				className={cn(
					'h-screen flex flex-col transition-all duration-500',
					darkMode
						? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] animate-gradient-shift'
						: 'bg-gradient-to-br from-[#e8edf5] to-[#f0f4ff]'
				)}
			>
				{/* Header */}
				<div className="flex justify-between items-center py-3 px-8">
					{/* Left: Hipertech logo */}
					<img
						alt="Hipertech Logo"
						src="/external/hipertechlogo2501-ygje.svg"
						className={cn('h-12', darkMode ? 'brightness-0 invert' : '')}
					/>

					{/* Center: Theme toggle */}
					<button
						onClick={() => setDarkMode(!darkMode)}
						className={cn(
							'p-2.5 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2',
							darkMode
								? 'bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-white/30 text-yellow-300'
								: 'bg-white/60 hover:bg-white/80 border border-white/80 focus:ring-blue-300 text-slate-600'
						)}
						aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
					>
						{darkMode ? (
							<Sun className="w-5 h-5" />
						) : (
							<Moon className="w-5 h-5" />
						)}
					</button>

					{/* Right: O2 Monitor logo */}
					<img
						alt="O2 Monitor Logo"
						src="/external/O2Monitor.png"
						className={cn('h-12', darkMode ? 'brightness-0 invert' : '')}
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="flex gap-8 items-start">
						{mainAnteChambers.map((chamber) => (
							<ChamberCard
								key={chamber.id}
								chamber={chamber}
								onSettingsClick={() => handleSettingsClick(chamber)}
								onMuteAlarm={() => handleMuteAlarm(chamber)}
								isMuted={mutedAlarms[chamber.id] || false}
								onAlarmStateChange={handleAlarmStateChange}
								showAlarm={true}
							/>
						))}
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-between items-center py-3 px-8">
					{/* Connection Status */}
					<div className="flex items-center gap-2">
						<div className={cn(
							'w-2.5 h-2.5 rounded-full',
							socketConnected && apiConnected
								? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
								: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
						)} />
						<span className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-slate-500')}>
							{socketConnected && apiConnected ? 'Connected' : 'Disconnected'}
						</span>
					</div>

					{/* Date & Time */}
					<div className={cn('font-bold text-2xl tabular-nums', darkMode ? 'text-blue-300' : 'text-blue-600')}>
						{currentDate || '01.01.2026'}
						<span className={cn('mx-2 text-lg', darkMode ? 'text-slate-500' : 'text-slate-400')}>|</span>
						{currentTime || '00:00'}
					</div>
				</div>

			</div>

			{/* Sensor Warning Modal */}
			{showSensorWarning && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
					<div className={cn(
						'rounded-3xl p-8 max-w-md w-full shadow-2xl animate-fade-up',
						darkMode
							? 'bg-slate-800/95 backdrop-blur-xl border border-amber-500/20'
							: 'bg-white/95 backdrop-blur-xl border border-amber-200'
					)}>
						{/* Icon */}
						<div className="flex justify-center mb-5">
							<div className={cn(
								'w-20 h-20 rounded-full flex items-center justify-center',
								darkMode ? 'bg-amber-500/20' : 'bg-amber-50'
							)}>
								<AlertTriangle className={cn('w-10 h-10', darkMode ? 'text-amber-400' : 'text-amber-500')} />
							</div>
						</div>

						{/* Title */}
						<h2 className={cn('text-xl font-bold text-center mb-2', darkMode ? 'text-white' : 'text-slate-800')}>
							Sensor Replacement Needed
						</h2>
						<p className={cn('text-sm text-center mb-6', darkMode ? 'text-slate-400' : 'text-slate-500')}>
							The following sensors have exceeded their recommended 1-year lifespan
						</p>

						{/* Sensor List */}
						<div className="space-y-3 mb-6">
							{expiredSensors.map((sensor) => (
								<div
									key={sensor.name}
									className={cn(
										'flex items-center justify-between p-4 rounded-2xl',
										darkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
									)}
								>
									<div className="flex items-center gap-3">
										<div className={cn(
											'w-3 h-3 rounded-full animate-alarm-pulse',
											'bg-amber-500'
										)} />
										<span className={cn('font-bold text-base', darkMode ? 'text-white' : 'text-slate-800')}>
											{sensor.name}
										</span>
									</div>
									<div className="text-right">
										<span className={cn('text-sm font-medium block', darkMode ? 'text-amber-400' : 'text-amber-600')}>
											{sensor.months} months old
										</span>
										<span className={cn('text-xs', darkMode ? 'text-slate-500' : 'text-slate-400')}>
											{sensor.date}
										</span>
									</div>
								</div>
							))}
						</div>

						{/* Button */}
						<button
							onClick={() => setShowSensorWarning(false)}
							className={cn(
								'w-full py-3.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98]',
								darkMode
									? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
									: 'bg-amber-500 hover:bg-amber-600 text-white'
							)}
						>
							I Understand
						</button>
					</div>
				</div>
			)}

			{/* Settings Modal */}
			{selectedChamber && (
				<O2AnalyzerSettings
					isOpen={settingsOpen}
					onClose={() => {
						setSettingsOpen(false);
						setSelectedChamber(null);
					}}
					chamber={selectedChamber}
					onUpdate={refetchChambers}
				/>
			)}

			{/* Toast Notifications */}
			<Toaster
				toastOptions={{
					style: {
						background: '#363636',
						color: '#fff',
						fontSize: '16px',
						fontWeight: '500',
					},
					success: {
						iconTheme: {
							primary: '#22c55e',
							secondary: '#fff',
						},
					},
					error: {
						iconTheme: {
							primary: '#ef4444',
							secondary: '#fff',
						},
					},
				}}
			/>
		</>
	);
}
