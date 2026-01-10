import React, { useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import { useDashboardStore } from '../store';
import { ChillerControlModal } from '../components/ChillerControlModal';

// Button component for consistent styling
const ControlButton = ({
	onClick,
	variant = 'default',
	children,
	className = '',
}: {
	onClick: () => void;
	variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
	children: React.ReactNode;
	className?: string;
}) => {
	const variants = {
		default:
			'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25',
		success:
			'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25',
		warning:
			'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25',
		danger:
			'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-rose-500/25',
		info: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-500/25',
		muted:
			'bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 shadow-slate-500/25',
	};

	return (
		<button
			onClick={onClick}
			className={`
				w-full h-16 rounded-xl font-semibold text-lg text-white
				shadow-lg transition-all duration-300 ease-out
				hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
				${variants[variant]}
				${className}
			`}>
			{children}
		</button>
	);
};

// Card component for sections
const Card = ({
	title,
	children,
	className = '',
	isDark = true,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
	isDark?: boolean;
}) => (
	<div
		className={`
			backdrop-blur-xl rounded-2xl border overflow-hidden flex flex-col
			shadow-2xl transition-all duration-500
			${
				isDark
					? 'bg-white/5 border-white/10 shadow-black/20'
					: 'bg-white/80 border-slate-200 shadow-slate-300/50'
			}
			${className}
		`}>
		<div
			className={`px-6 py-4 border-b transition-all duration-500 ${
				isDark
					? 'border-white/10 bg-white/5'
					: 'border-slate-200 bg-slate-100/50'
			}`}>
			<h2
				className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
					isDark ? 'text-white' : 'text-slate-800'
				}`}>
				{title}
			</h2>
		</div>
		<div className="p-6 flex-1">{children}</div>
	</div>
);

export default function HomePage() {
	const {
		darkMode,
		setDarkMode,
		connected,
		currentTime,
		currentTime2,
		showCalibrationModal,
		showErrorModal,
		showSeatAlarmModal,
		showChillerModal,
		calibrationProgress,
		calibrationStatus,
		errorMessage,
		lightStatus,
		fan1Status,
		fan2Status,
		autoMode,
		airMode,
		ventilMode,
		light2Status,
		valve1Status,
		valve2Status,
		playing,
		activeSeatAlarm,
		chillerRunning,
		chillerCurrentTemp,
		setConnected,
		setCurrentTime,
		setCurrentTime2,
		setShowCalibrationModal,
		setShowErrorModal,
		setShowSeatAlarmModal,
		setShowChillerModal,
		setCalibrationProgress,
		setCalibrationStatus,
		setErrorMessage,
		setLightStatus,
		setFan1Status,
		setFan2Status,
		setAutoMode,
		setAirMode,
		setVentilMode,
		setLight2Status,
		setValve1Status,
		setValve2Status,
		setPlaying,
		setActiveSeatAlarm,
		setChillerRunning,
		setChillerCurrentTemp,
	} = useDashboardStore();

	const [socketRef, setSocketRef] = React.useState(null);

	const playSound = () => {
		if (!playing) {
			setPlaying(true);
			const newAudio = new Audio('/external/bmw-bong.mp3');
			newAudio.play().catch((error) => {
				console.error('Error playing sound:', error);
			});
		}
	};

	useEffect(() => {
		const socket = io('http://192.168.77.100:4000', {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10000,
			reconnectionDelay: 5000,
		});

		socket.on('connect_error', (error) => {
			console.error('Socket connection error:', error);
			setConnected(false);
		});

		socket.on('error', (error) => {
			console.error('Socket error:', error);
			setConnected(false);
		});

		socket.on('connect_timeout', (timeout) => {
			console.error('Socket connection timeout:', timeout);
			setConnected(false);
		});

		setSocketRef(socket);

		socket.on('connect', () => {
			console.log('Connected to socket server');
			setConnected(true);
			updateCurrentTime();
		});

		socket.on('data', (data) => {
			const errorData = JSON.parse(data);
			setChillerCurrentTemp(errorData.data[15] / 10);

			let errorArray = Number(errorData.data[19])
				.toString(2)
				.padStart(16, '0')
				.split('')
				.reverse();

			if (errorArray[0] === '1') {
				if (errorArray[1] === '1') {
					if (!showSeatAlarmModal) {
						if (errorData.data[16] === 21) {
							setActiveSeatAlarm({ seatNumber: 'Nurse' });
							setShowSeatAlarmModal(true);
						} else if (errorData.data[16] === 22) {
							setActiveSeatAlarm({ seatNumber: 'Ante 1' });
							setShowSeatAlarmModal(true);
						} else if (errorData.data[16] === 23) {
							setActiveSeatAlarm({ seatNumber: 'Ante 2' });
							setShowSeatAlarmModal(true);
						} else if (errorData.data[16] === 24) {
							setActiveSeatAlarm({ seatNumber: 'Ante Nurse' });
							setShowSeatAlarmModal(true);
						} else {
							setActiveSeatAlarm({ seatNumber: errorData.data[16] });
							setShowSeatAlarmModal(true);
						}
					}
				}

				if (errorArray[2] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber Fire Suppression System Activated!');
						playSound();
					}
				} else if (errorArray[3] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Ante Chamber Fire Suppression System Activated!');
						playSound();
					}
				} else if (errorArray[4] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber Flame Detected!');
						playSound();
					}
				} else if (errorArray[5] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber Smoke Detected!');
						playSound();
					}
				} else if (errorArray[6] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Ante Chamber Smoke Detected!');
						playSound();
					}
				} else if (errorArray[7] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber High O2 Level!');
						playSound();
					}
				} else if (errorArray[8] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Ante Chamber High O2 Level!');
						playSound();
					}
				}
			} else if (errorArray[1] == '0') {
				setShowErrorModal(false);
				setErrorMessage('');
				setActiveSeatAlarm(null);
				setShowSeatAlarmModal(false);
			}
		});

		socket.on('disconnect', () => {
			console.log('Disconnected from socket server');
			setConnected(false);
		});

		socket.on('calibrationProgress', (data) => {
			setCalibrationProgress(data.progress);
			setCalibrationStatus(data.status);

			if (data.progress === 100) {
				setTimeout(() => {
					setShowCalibrationModal(false);
				}, 2000);
			}
		});

		socket.on('seatAlarm', (data) => {
			const { seatNumber, status } = data;
			if (status) {
				setActiveSeatAlarm({ seatNumber });
				setShowSeatAlarmModal(true);
				playSound();
			} else {
				setShowSeatAlarmModal(false);
				setActiveSeatAlarm(null);
			}
		});

		socket.on('chillerData', (data) => {
			if (data.currentTemp !== undefined) {
				setChillerCurrentTemp(data.currentTemp / 10);
			}
			if (data.running !== undefined) {
				setChillerRunning(data.running === 1);
			}
		});

		const updateCurrentTime = () => {
			const now = new Date();
			const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(
				now.getMonth() + 1
			)
				.toString()
				.padStart(2, '0')}.${now.getFullYear()}`;
			setCurrentTime(formattedDate);
			const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now
				.getMinutes()
				.toString()
				.padStart(2, '0')}`;
			setCurrentTime2(formattedTime);
		};

		return () => {
			socket.disconnect();
		};
	}, []);

	const setLight = () => {
		if (socketRef) {
			const newValue = (lightStatus + 1) % 4;
			let regValue = 0;
			switch (newValue) {
				case 0:
					regValue = 0;
					break;
				case 1:
					regValue = 85;
					break;
				case 2:
					regValue = 170;
					break;
				case 3:
					regValue = 255;
					break;
			}
			socketRef.emit('writeRegister', { register: 'R01700', value: regValue });
			setLightStatus(newValue);
		}
	};

	const setFan1 = () => {
		if (socketRef) {
			const newValue = (fan1Status + 1) % 4;
			let regValue = 0;
			switch (newValue) {
				case 0:
					regValue = 0;
					break;
				case 1:
					regValue = 85;
					break;
				case 2:
					regValue = 170;
					break;
				case 3:
					regValue = 255;
					break;
			}
			socketRef.emit('writeRegister', { register: 'R01704', value: regValue });
			setFan1Status(newValue);
		}
	};

	const setFan2 = () => {
		if (socketRef) {
			const newValue = (fan2Status + 1) % 4;
			let regValue = 0;
			switch (newValue) {
				case 0:
					regValue = 0;
					break;
				case 1:
					regValue = 85;
					break;
				case 2:
					regValue = 170;
					break;
				case 3:
					regValue = 255;
					break;
			}
			socketRef.emit('writeRegister', { register: 'R01706', value: regValue });
			setFan2Status(newValue);
		}
	};

	const setVentil = () => {
		if (socketRef) {
			const newMode = (ventilMode + 1) % 3;
			const newValue = newMode === 0 ? 0 : newMode === 1 ? 1 : 2;
			if (newValue === 0) {
				socketRef.emit('writeBit', { register: 'M0202', value: 0 });
				socketRef.emit('writeBit', { register: 'M0203', value: 0 });
			} else if (newValue === 1) {
				socketRef.emit('writeBit', { register: 'M0202', value: 1 });
				socketRef.emit('writeBit', { register: 'M0203', value: 0 });
			} else if (newValue === 2) {
				socketRef.emit('writeBit', { register: 'M0202', value: 0 });
				socketRef.emit('writeBit', { register: 'M0203', value: 1 });
			}
			setVentilMode(newMode);
		}
	};

	const setAuto = () => {
		if (socketRef) {
			const newValue = autoMode ? 0 : 1;
			socketRef.emit('writeBit', { register: 'M0201', value: newValue });
			setAutoMode(!autoMode);
		}
	};

	const closeModal = () => {
		if (socketRef) {
			socketRef.emit('writeBit', { register: 'M0400', value: 0 });
		}
	};

	const setAir = () => {
		if (socketRef) {
			const newValue = airMode ? 0 : 1;
			socketRef.emit('writeBit', { register: 'M0200', value: newValue });
			setAirMode(!airMode);
		}
	};

	const setLight2 = () => {
		if (socketRef) {
			const newValue = (light2Status + 1) % 4;
			let regValue = 0;
			switch (newValue) {
				case 0:
					regValue = 0;
					break;
				case 1:
					regValue = 85;
					break;
				case 2:
					regValue = 170;
					break;
				case 3:
					regValue = 255;
					break;
			}
			socketRef.emit('writeRegister', { register: 'R01702', value: regValue });
			setLight2Status(newValue);
		}
	};

	const setValve1 = () => {
		if (socketRef) {
			const newValue = valve1Status ? 0 : 1;
			if (newValue === 0) {
				socketRef.emit('writeBit', { register: 'M0501', value: 0 });
				socketRef.emit('writeBit', { register: 'M0500', value: 1 });
			} else {
				socketRef.emit('writeBit', { register: 'M0500', value: 0 });
				socketRef.emit('writeBit', { register: 'M0501', value: 1 });
			}
			setValve1Status(!valve1Status);
		}
	};

	const setValve2 = () => {
		if (socketRef) {
			const newValue = valve2Status ? 0 : 1;
			if (newValue === 0) {
				socketRef.emit('writeBit', { register: 'M0503', value: 0 });
				socketRef.emit('writeBit', { register: 'M0502', value: 1 });
			} else {
				socketRef.emit('writeBit', { register: 'M0502', value: 0 });
				socketRef.emit('writeBit', { register: 'M0503', value: 1 });
			}
			setValve2Status(!valve2Status);
		}
	};

	const closeSeatAlarmModal = () => {
		if (socketRef) {
			socketRef.emit('writeBit', { register: 'M0400', value: 0 });
			socketRef.emit('writeRegister', { register: 'R0030', value: 0 });
		}
	};

	// Helper functions for button variants
	const getLightVariant = (status: number) => {
		if (status === 0) return 'muted';
		if (status === 1) return 'info';
		if (status === 2) return 'warning';
		return 'danger';
	};

	const getLightLabel = (status: number) => {
		if (status === 0) return 'Off';
		if (status === 1) return 'Low';
		if (status === 2) return 'Medium';
		return 'High';
	};

	return (
		<>
			<Head>
				<title>Dashboard - Chamber Control</title>
			</Head>

			{/* Main Container */}
			<div
				className={`min-h-screen overflow-hidden transition-all duration-500 ${
					darkMode
						? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
						: 'bg-gradient-to-br from-sky-100 via-slate-100 to-amber-50'
				}`}>
				{/* Decorative background elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div
						className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
							darkMode ? 'bg-blue-500/10' : 'bg-sky-400/20'
						}`}
					/>
					<div
						className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
							darkMode ? 'bg-emerald-500/10' : 'bg-amber-400/20'
						}`}
					/>
					<div
						className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-500 ${
							darkMode ? 'bg-indigo-500/5' : 'bg-violet-300/10'
						}`}
					/>
				</div>

				{/* Content */}
				<div className="relative z-10 px-8 py-6 flex flex-col h-screen">
					{/* Header */}
					<header className="flex items-center justify-between mb-6">
						<img
							alt="Hipertech Logo"
							src="/external/hipertechlogo2501-ygje.svg"
							className={`h-16 w-auto transition-all duration-500 ${
								!darkMode && 'brightness-0'
							}`}
						/>
						<div className="flex items-center gap-4">
							{/* Theme Toggle Button */}
							<button
								onClick={() => setDarkMode(!darkMode)}
								className={`
									flex items-center justify-center w-10 h-10 rounded-full
									transition-all duration-500 hover:scale-110 active:scale-95
									${
										darkMode
											? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
											: 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 hover:bg-indigo-500/30'
									}
								`}>
								{darkMode ? (
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
											clipRule="evenodd"
										/>
									</svg>
								) : (
									<svg
										className="w-5 h-5"
										fill="currentColor"
										viewBox="0 0 20 20">
										<path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
									</svg>
								)}
							</button>
							{/* Connection Status */}
							<div
								className={`
								flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
								${
									connected
										? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
										: 'bg-red-500/20 text-red-400 border border-red-500/30'
								}
							`}>
								<span
									className={`w-2 h-2 rounded-full ${
										connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
									}`}
								/>
								{connected ? 'Connected' : 'Disconnected'}
							</div>
							{/* Date & Time */}
							<div
								className={`backdrop-blur-lg rounded-full px-6 py-2 border transition-all duration-500 ${
									darkMode
										? 'bg-white/5 border-white/10'
										: 'bg-white/60 border-slate-200'
								}`}>
								<span
									className={`font-medium text-lg transition-colors duration-500 ${
										darkMode ? 'text-white/80' : 'text-slate-700'
									}`}>
									{currentTime || '10.03.2025'} • {currentTime2 || '14:27'}
								</span>
							</div>
						</div>
					</header>

					{/* Main Grid */}
					<div className="flex-1 grid grid-cols-12 gap-6">
						{/* Chamber Control - Left Column */}
						<div className="col-span-3">
							<Card
								title="Chamber Control"
								className="h-full"
								isDark={darkMode}>
								<div className="flex flex-col justify-between h-full gap-4">
									<ControlButton
										onClick={setAuto}
										variant={autoMode ? 'danger' : 'success'}>
										{autoMode ? 'Manual' : 'Automatic'}
									</ControlButton>

									<ControlButton
										onClick={setAir}
										variant={airMode ? 'info' : 'success'}>
										{airMode ? 'Oxygen' : 'Air'}
									</ControlButton>

									<ControlButton
										onClick={setVentil}
										variant={
											ventilMode === 0
												? 'success'
												: ventilMode === 1
												? 'danger'
												: 'warning'
										}>
										{ventilMode === 0
											? 'Ventilation'
											: ventilMode === 1
											? 'Low'
											: 'High'}
									</ControlButton>

									<ControlButton
										onClick={() => setShowChillerModal(true)}
										variant={chillerRunning ? 'info' : 'muted'}>
										<span className="flex items-center justify-center gap-2">
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
												/>
											</svg>
											Chiller{' '}
											{chillerRunning
												? `${chillerCurrentTemp.toFixed(1)}°C`
												: 'Off'}
										</span>
									</ControlButton>
								</div>
							</Card>
						</div>

						{/* Auxiliary Output - Middle Column */}
						<div className="col-span-4">
							<Card
								title="Auxiliary Output"
								className="h-full"
								isDark={darkMode}>
								<div className="flex flex-col justify-center h-full space-y-6">
									{/* Main Chamber */}
									<div className="space-y-3">
										<div className="flex items-center justify-center gap-3">
											<div className="w-3 h-3 rounded-full bg-indigo-500" />
											<h3
												className={`text-lg font-semibold transition-colors duration-500 ${
													darkMode ? 'text-indigo-300' : 'text-indigo-600'
												}`}>
												Main
											</h3>
										</div>
										<ControlButton
											onClick={setValve1}
											variant={valve1Status ? 'danger' : 'success'}>
											{valve1Status ? 'Close Valve' : 'Open Valve'}
										</ControlButton>
									</div>

									{/* Divider */}
									<div
										className={`border-t transition-colors duration-500 ${
											darkMode ? 'border-white/10' : 'border-slate-200'
										}`}
									/>

									{/* Ante Chamber */}
									<div className="space-y-3">
										<div className="flex items-center justify-center gap-3">
											<div className="w-3 h-3 rounded-full bg-violet-500" />
											<h3
												className={`text-lg font-semibold transition-colors duration-500 ${
													darkMode ? 'text-violet-300' : 'text-violet-600'
												}`}>
												Ante
											</h3>
										</div>
										<ControlButton
											onClick={setValve2}
											variant={valve2Status ? 'danger' : 'success'}>
											{valve2Status ? 'Close Valve' : 'Open Valve'}
										</ControlButton>
									</div>
								</div>
							</Card>
						</div>

						{/* Right Column - Lighting & Fan */}
						<div className="col-span-5 flex flex-col gap-6">
							{/* Lighting Card */}
							<Card title="Lighting" className="flex-1" isDark={darkMode}>
								<div className="flex gap-8">
									{/* Main Light */}
									<div className="flex-1 space-y-3">
										<div className="text-center">
											<span
												className={`text-xl font-semibold uppercase tracking-wider transition-colors duration-500 ${
													darkMode ? 'text-white/80' : 'text-slate-600'
												}`}>
												Main
											</span>
										</div>
										<ControlButton
											onClick={setLight}
											variant={getLightVariant(lightStatus)}>
											{getLightLabel(lightStatus)}
										</ControlButton>
									</div>

									{/* Ante Light */}
									<div className="flex-1 space-y-3">
										<div className="text-center">
											<span
												className={`text-xl font-semibold uppercase tracking-wider transition-colors duration-500 ${
													darkMode ? 'text-white/80' : 'text-slate-600'
												}`}>
												Ante
											</span>
										</div>
										<ControlButton
											onClick={setLight2}
											variant={getLightVariant(light2Status)}>
											{getLightLabel(light2Status)}
										</ControlButton>
									</div>
								</div>
							</Card>

							{/* Fan Card */}
							<Card title="Fan" className="flex-1" isDark={darkMode}>
								<div className="space-y-3">
									<div className="text-center">
										<span
											className={`text-xl font-semibold uppercase tracking-wider transition-colors duration-500 ${
												darkMode ? 'text-white/80' : 'text-slate-600'
											}`}>
											Main
										</span>
									</div>
									<ControlButton
										onClick={setFan1}
										variant={getLightVariant(fan1Status)}>
										{getLightLabel(fan1Status)}
									</ControlButton>
								</div>
							</Card>
						</div>
					</div>
				</div>
			</div>

			{/* Error Modal */}
			{showErrorModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
						<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
							<img
								src="/external/alarm.png"
								alt="Alarm Icon"
								className="w-12 h-12 object-contain"
							/>
						</div>
						<h2 className="text-3xl font-bold text-red-600 mb-4">Warning</h2>
						<p className="text-xl text-gray-600 mb-8">{errorMessage}</p>
						<button
							onClick={closeModal}
							className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl">
							Close
						</button>
					</div>
				</div>
			)}

			{/* Seat Alarm Modal */}
			{showSeatAlarmModal && (
				<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-3xl p-10 max-w-lg w-full shadow-2xl text-center animate-pulse">
						<div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
							<img
								src="/external/seat_icon.png"
								alt="Seat Icon"
								className="w-12 h-12 object-contain"
							/>
						</div>
						<h2 className="text-3xl font-bold text-red-600 mb-4">Seat Alarm</h2>
						<p className="text-7xl font-black text-red-600 mb-8">
							{activeSeatAlarm?.seatNumber}
						</p>
						<button
							onClick={closeSeatAlarmModal}
							className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl">
							Close Alarm
						</button>
					</div>
				</div>
			)}

			{/* Chiller Control Modal */}
			<ChillerControlModal
				isOpen={showChillerModal}
				onClose={() => setShowChillerModal(false)}
				socketRef={socketRef}
			/>
		</>
	);
}
