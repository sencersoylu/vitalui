import React, { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import io, { Socket } from 'socket.io-client';
import { O2AnalyzerCard } from '../components/O2AnalyzerCard';
import { O2AnalyzerSettings } from '../components/O2AnalyzerSettings';
import { useChambers } from '../hooks/useChambers';
import { useLatestReading } from '../hooks/useReadings';
import { useChamberAlarms } from '../hooks/useAlarms';
import { Chamber } from '../api/chambers';

// ChamberCard wrapper component
interface ChamberCardProps {
	chamber: Chamber;
	onSettingsClick: () => void;
	onMuteAlarm: () => void;
	isMuted: boolean;
	onAlarmStateChange: (chamberId: number, hasAlarm: boolean) => void;
}

const ChamberCard: React.FC<ChamberCardProps> = ({
	chamber,
	onSettingsClick,
	onMuteAlarm,
	isMuted,
	onAlarmStateChange,
}) => {
	const { reading, loading: readingLoading } = useLatestReading(
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
	const hasActiveAlarms = hasBackendAlarms || hasO2Alarm;

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

	return (
		<O2AnalyzerCard
			title={chamber.name}
			o2Level={o2Level}
			alarmLevel={alarmLevel}
			isAlarmActive={hasActiveAlarms}
			lastCalibration={lastCalibration}
			onSettingsClick={onSettingsClick}
			onMuteAlarm={onMuteAlarm}
			isMuted={isMuted}
		/>
	);
};

export default function O2AnalyzerPage() {
	const [currentTime, setCurrentTime] = useState('');
	const [currentDate, setCurrentDate] = useState('');
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
	const [mutedAlarms, setMutedAlarms] = useState<{ [key: number]: boolean }>(
		{}
	);

	// Socket reference for PLC communication
	const socketRef = useRef<Socket | null>(null);

	// Track previous alarm states to detect changes
	const prevAlarmStatesRef = useRef<{ [key: number]: boolean }>({});

	// Backend data hooks
	const {
		chambers,
		loading: chambersLoading,
		error: chambersError,
		refetch: refetchChambers,
	} = useChambers();

	// Socket connection state
	const [socketConnected, setSocketConnected] = useState(false);

	// Initialize socket connection
	useEffect(() => {
		console.log('O2 Analyzer: Initializing socket connection...');
		const socket = io('http://192.168.77.100:4000', {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		socket.on('connect', () => {
			console.log('O2 Analyzer: Connected to socket server, socket.id:', socket.id);
			setSocketConnected(true);
		});

		socket.on('connect_error', (error) => {
			console.error('O2 Analyzer: Socket connection error:', error.message);
			setSocketConnected(false);
		});

		socket.on('disconnect', (reason) => {
			console.log('O2 Analyzer: Disconnected from socket server, reason:', reason);
			setSocketConnected(false);
		});

		socketRef.current = socket;
		console.log('O2 Analyzer: Socket ref set:', socketRef.current !== null);

		return () => {
			console.log('O2 Analyzer: Cleaning up socket connection');
			socket.disconnect();
		};
	}, []);

	// Function to update current time and date
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

	useEffect(() => {
		// Update time immediately
		updateDateTime();

		// Update time every minute
		const interval = setInterval(updateDateTime, 60000);

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
			setMutedAlarms((prev) => ({
				...prev,
				[chamber.id]: false,
			}));
			toast.success(`${chamber.name} alarm activated`, {
				duration: 3000,
				position: 'top-center',
			});

			// Write to PLC - set alarm bit back to 1 (alarm active)
			if (socketRef.current && socketRef.current.connected) {
				console.log(`O2 Analyzer: Unmute - Writing to ${register} value 1`);
				socketRef.current.emit('writeBit', { register, value: 1 });
			}
		} else {
			// Mute the alarm
			setMutedAlarms((prev) => ({
				...prev,
				[chamber.id]: true,
			}));
			toast.success(`${chamber.name} alarm muted for 5 minutes`, {
				duration: 3000,
				position: 'top-center',
			});

			// Write to PLC - set alarm bit to 0 (muted/silenced)
			if (socketRef.current && socketRef.current.connected) {
				console.log(`O2 Analyzer: Mute - Writing to ${register} value 0`);
				socketRef.current.emit('writeBit', { register, value: 0 });
			}

			// Auto unmute after 5 minutes
			setTimeout(() => {
				setMutedAlarms((prev) => ({
					...prev,
					[chamber.id]: false,
				}));
				// Re-enable alarm bit after unmute timeout
				if (socketRef.current && socketRef.current.connected) {
					console.log(`O2 Analyzer: Auto-unmute - Writing to ${register} value 1`);
					socketRef.current.emit('writeBit', { register, value: 1 });
				}
			}, 5 * 60 * 1000); // 5 minutes
		}
	};

	// Handle alarm state changes and write to PLC bits
	// M00407 = Main Chamber alarm, M00408 = Ante Chamber alarm
	const handleAlarmStateChange = useCallback((chamberId: number, hasAlarm: boolean) => {
		const prevState = prevAlarmStatesRef.current[chamberId];

		console.log(`O2 Analyzer: handleAlarmStateChange - chamberId: ${chamberId}, hasAlarm: ${hasAlarm}, prevState: ${prevState}`);

		// Skip first load (when prevState is undefined) - just store the initial state
		if (prevState === undefined) {
			console.log(`O2 Analyzer: First load for chamber ${chamberId}, storing initial state: ${hasAlarm}`);
			prevAlarmStatesRef.current[chamberId] = hasAlarm;
			return;
		}

		// Only write to PLC if state has actually changed
		if (prevState !== hasAlarm) {
			prevAlarmStatesRef.current[chamberId] = hasAlarm;
			console.log(`O2 Analyzer: Alarm state CHANGED for chamber ${chamberId}: ${prevState} -> ${hasAlarm}`);

			// Only write to PLC when alarm becomes ACTIVE (hasAlarm = true)
			if (hasAlarm && socketRef.current && socketRef.current.connected) {
				// Find chamber to determine which bit to write
				const chamber = chambers.find(c => c.id === chamberId);
				console.log('O2 Analyzer: Found chamber:', chamber);
				if (chamber) {
					// Main Chamber -> M0407, Ante Chamber -> M0408
					const isMainChamber = chamber.name.toLowerCase().includes('main');
					const register = isMainChamber ? 'M0407' : 'M0408';

					console.log(`O2 Analyzer: ALARM ACTIVE - EMITTING writeBit - register: ${register}, value: 1`);
					socketRef.current.emit('writeBit', {
						register: register,
						value: 1
					});
				}
			} else if (!hasAlarm) {
				console.log(`O2 Analyzer: Alarm cleared for chamber ${chamberId}, no PLC write needed`);
			} else {
				console.warn(`O2 Analyzer: Socket NOT connected! ref: ${socketRef.current !== null}, connected: ${socketRef.current?.connected}`);
			}
		}
	}, [chambers]);

	// Loading state
	if (chambersLoading) {
		return (
			<div className="h-screen bg-[#f5f7fa] flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-blue mx-auto mb-4"></div>
					<p className="text-xl text-brand-blue">Loading chambers...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (chambersError && chambers.length === 0) {
		return (
			<div className="h-screen bg-[#f5f7fa] flex items-center justify-center">
				<div className="text-center">
					<p className="text-xl text-red-600 mb-4">Error loading chambers</p>
					<p className="text-gray-600">{chambersError}</p>
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

			<div className="h-screen bg-[#f5f7fa] flex flex-col">
				{/* Header */}
				<div className="flex justify-between items-center py-4 px-8">
					<img
						alt="Hipertech Logo"
						src="/external/hipertechlogo2501-ygje.svg"
						className="h-16"
					/>
					<img
						alt="O2 Monitor Logo"
						src="/external/O2Monitor.png"
						className="h-16"
					/>
				</div>

				{/* Main Content */}
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="flex gap-8 items-center w-full max-w-5xl justify-center">
						{chambers.map((chamber) => (
							<ChamberCard
								key={chamber.id}
								chamber={chamber}
								onSettingsClick={() => handleSettingsClick(chamber)}
								onMuteAlarm={() => handleMuteAlarm(chamber)}
								isMuted={mutedAlarms[chamber.id] || false}
								onAlarmStateChange={handleAlarmStateChange}
							/>
						))}
					</div>
				</div>

				{/* Footer with Date and Time */}
				<div className="flex justify-end items-center px-8 py-4">
					<div className="flex items-center gap-4 text-brand-blue font-bold text-xl">
						<span className="text-3xl">🚀</span>
						<span>
							{currentDate || '18.08.2025'} - {currentTime || '12:23'}
						</span>
					</div>
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
