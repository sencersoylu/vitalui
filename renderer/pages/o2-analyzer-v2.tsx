import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import io from 'socket.io-client';
import { Sun, Moon } from 'lucide-react';
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
		chambers,
		loading: chambersLoading,
		error: chambersError,
		refetch: refetchChambers,
	} = useChambers();

	// Filter to only Main/Ante chambers (exclude FiO sensors)
	const mainAnteChambers = chambers.filter(
		(c) => !c.name.toLowerCase().startsWith('fio')
	);

	// Initialize socket connection
	useEffect(() => {
		console.log('O2 Analyzer v2: Initializing socket connection...');
		const socket = io('http://192.168.77.100:4000', {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socket.on('connect', () => {
			console.log(
				'O2 Analyzer v2: Connected to socket server, socket.id:',
				socket.id
			);
		});

		socket.on('connect_error', (error) => {
			console.error('O2 Analyzer v2: Socket connection error:', error.message);
		});

		socket.on('disconnect', (reason) => {
			console.log(
				'O2 Analyzer v2: Disconnected from socket server, reason:',
				reason
			);
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

				// Only write to PLC when alarm becomes ACTIVE (hasAlarm = true)
				if (hasAlarm && socketRef.current && socketRef.current.connected) {
					const chamber = chambers.find((c) => c.id === chamberId);
					if (chamber) {
						const isMainChamber = chamber.name.toLowerCase().includes('main');
						const register = isMainChamber ? 'M0407' : 'M0408';
						socketRef.current.emit('writeBit', { register, value: 1 });
					}
				}
			}
		},
		[chambers]
	);

	// Loading state
	if (chambersLoading) {
		return (
			<div
				className={cn(
					'h-screen flex items-center justify-center',
					darkMode
						? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
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
						? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
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
						? 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
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

					{/* Center-right: Theme toggle */}
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
				<div className="flex justify-end items-center py-3 px-8">
					<span
						className={cn(
							'font-bold text-lg',
							darkMode ? 'text-blue-300' : 'text-blue-600'
						)}
					>
						{currentDate || '01.01.2026'} - {currentTime || '00:00'}
					</span>
				</div>

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
			</div>

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
