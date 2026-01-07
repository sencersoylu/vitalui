import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
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
}

const ChamberCard: React.FC<ChamberCardProps> = ({
	chamber,
	onSettingsClick,
	onMuteAlarm,
	isMuted,
}) => {
	const { reading, loading: readingLoading } = useLatestReading(
		chamber.id,
		true,
		5000 // Update every 5 seconds
	);
	const { alarms } = useChamberAlarms(chamber.id);

	const activeAlarms = Array.isArray(alarms)
		? alarms.filter((alarm) => alarm.isActive)
		: [];
	const hasActiveAlarms = activeAlarms.length > 0;

	// Default values if no reading is available
	const o2Level = reading?.o2Level ?? chamber.lastValue ?? 21.0;
	const alarmLevel = chamber.alarmLevelHigh;
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

	// Backend data hooks
	const {
		chambers,
		loading: chambersLoading,
		error: chambersError,
		refetch: refetchChambers,
	} = useChambers();

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

			// Auto unmute after 5 minutes
			setTimeout(() => {
				setMutedAlarms((prev) => ({
					...prev,
					[chamber.id]: false,
				}));
			}, 5 * 60 * 1000); // 5 minutes
		}
	};

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
