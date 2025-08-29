import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import { O2AnalyzerCard } from '../components/O2AnalyzerCard';
import { O2AnalyzerSettings } from '../components/O2AnalyzerSettings';

export default function O2AnalyzerPage() {
	const [currentTime, setCurrentTime] = useState('');
	const [currentDate, setCurrentDate] = useState('');
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [selectedChamber, setSelectedChamber] = useState<string>('');
	const [mutedAlarms, setMutedAlarms] = useState<{ [key: string]: boolean }>(
		{}
	);

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

	// Sample data for the O2 analyzer cards
	const mainChamberData = {
		title: 'Main',
		o2Level: 21.2,
		alarmLevel: 24,
		isAlarmActive: true,
		lastCalibration: '15.03.2025 09:30',
	};

	const anteChamberData = {
		title: 'Ante',
		o2Level: 19.0,
		alarmLevel: 24,
		isAlarmActive: true,
		lastCalibration: '14.03.2025 16:45',
	};

	const handleSettingsClick = (chamberTitle: string) => {
		setSelectedChamber(chamberTitle);
		setSettingsOpen(true);
	};

	const handleMuteAlarm = (chamberTitle: string) => {
		const isMuted = mutedAlarms[chamberTitle] || false;

		if (isMuted) {
			// Unmute the alarm
			setMutedAlarms((prev) => ({
				...prev,
				[chamberTitle]: false,
			}));
			toast.success(`${chamberTitle} alarm activated`, {
				duration: 3000,
				position: 'top-center',
			});
		} else {
			// Mute the alarm
			setMutedAlarms((prev) => ({
				...prev,
				[chamberTitle]: true,
			}));
			toast.success(`${chamberTitle} alarm muted for 5 minutes`, {
				duration: 3000,
				position: 'top-center',
			});

			// Auto unmute after 5 minutes
			setTimeout(() => {
				setMutedAlarms((prev) => ({
					...prev,
					[chamberTitle]: false,
				}));
			}, 5 * 60 * 1000); // 5 minutes
		}
	};

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
						<O2AnalyzerCard
							{...mainChamberData}
							onSettingsClick={() => handleSettingsClick(mainChamberData.title)}
							onMuteAlarm={() => handleMuteAlarm(mainChamberData.title)}
							isMuted={mutedAlarms[mainChamberData.title] || false}
						/>
						<O2AnalyzerCard
							{...anteChamberData}
							onSettingsClick={() => handleSettingsClick(anteChamberData.title)}
							onMuteAlarm={() => handleMuteAlarm(anteChamberData.title)}
							isMuted={mutedAlarms[anteChamberData.title] || false}
						/>
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
				<O2AnalyzerSettings
					isOpen={settingsOpen}
					onClose={() => setSettingsOpen(false)}
					chamberTitle={selectedChamber}
					initialCalibrationLevel={selectedChamber === 'Main' ? 21 : 21}
					initialAlarmLevel={
						selectedChamber === 'Main'
							? mainChamberData.alarmLevel
							: anteChamberData.alarmLevel
					}
				/>
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
