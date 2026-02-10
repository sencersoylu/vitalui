import React, { useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import io, { Socket } from 'socket.io-client';
import { useDashboardStore } from '../store';
import { ChillerControlModal } from '../components/ChillerControlModal';
import { Header } from '../components/dashboard/Header';
import { ChamberControlPanel } from '../components/dashboard/ChamberControlPanel';
import { AuxiliaryOutputPanel } from '../components/dashboard/AuxiliaryOutputPanel';
import { LightingPanel } from '../components/dashboard/LightingPanel';
import { FanPanel } from '../components/dashboard/FanPanel';
import { ErrorModal } from '../components/dashboard/ErrorModal';
import { SeatAlarmModal } from '../components/dashboard/SeatAlarmModal';
import { Loader2, Power, Zap, Thermometer, AlertTriangle, Wifi, WifiOff, Moon, Sun, Calendar, Clock } from 'lucide-react';

/**
 * Modern Dashboard - Chamber Control System
 * Features dark mode, responsive layout, and modern UI components
 */
export default function HomePage() {
	const {
		darkMode,
		setDarkMode,
		connected,
		setConnected,
		currentTime,
		currentTime2,
		setCurrentTime,
		setCurrentTime2,
		showCalibrationModal,
		setShowCalibrationModal,
		showErrorModal,
		setShowErrorModal,
		errorMessage,
		setErrorMessage,
		showSeatAlarmModal,
		setShowSeatAlarmModal,
		activeSeatAlarm,
		setActiveSeatAlarm,
		showChillerModal,
		setShowChillerModal,
		chillerRunning,
		chillerCurrentTemp,
		setChillerRunning,
		setChillerCurrentTemp,
		autoMode,
		setAutoMode,
		airMode,
		setAirMode,
		ventilMode,
		setVentilMode,
		lightStatus,
		setLightStatus,
		fan1Status,
		setFan1Status,
		valve1Status,
		setValve1Status,
		valve2Status,
		setValve2Status,
	} = useDashboardStore();

	const [socketRef, setSocketRef] = React.useState<Socket | null>(null);

	// Update time function
	const updateCurrentTime = useCallback(() => {
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
	}, [setCurrentTime, setCurrentTime2]);

	// Connection handlers
	const handleConnect = useCallback(() => {
		const socket = io('http://192.168.77.100:4000', {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 10000,
			reconnectionDelay: 5000,
		});

		setSocketRef(socket);

		socket.on('connect', () => {
			console.log('Connected to socket server');
			setConnected(true);
			updateCurrentTime();
		});

		socket.on('data', (data) => {
			console.log('Received data:', data);
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
						let seatText = '';
						if (errorData.data[16] === 21) {
							seatText = 'Nurse';
						} else if (errorData.data[16] === 22) {
							seatText = 'Ante 1';
						} else if (errorData.data[16] === 23) {
							seatText = 'Ante 2';
						} else if (errorData.data[16] === 24) {
							seatText = 'Ante Nurse';
						} else {
							seatText = String(errorData.data[16]);
						}
						setActiveSeatAlarm({ seatNumber: seatText });
						setShowSeatAlarmModal(true);
					}
				}

				if (errorArray[2] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber Fire Suppression System Activated!');
					}
				} else if (errorArray[3] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Ante Chamber Fire Suppression System Activated!');
					}
				} else if (errorArray[4] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber Flame Detected!');
					}
				} else if (errorArray[5] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber Smoke Detected!');
					}
				} else if (errorArray[6] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Ante Chamber Smoke Detected!');
					}
				} else if (errorArray[7] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Main Chamber High O2 Level!');
					}
				} else if (errorArray[8] === '1') {
					if (!showErrorModal) {
						setShowErrorModal(true);
						setErrorMessage('Ante Chamber High O2 Level!');
					}
				}
			} else if (errorArray[1] === '0') {
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
	}, [setConnected, setChillerCurrentTemp, showSeatAlarmModal, showErrorModal, setActiveSeatAlarm, setShowSeatAlarmModal, setShowErrorModal, setErrorMessage, updateCurrentTime]);

	// Control handlers
	const handleAutoToggle = useCallback(() => {
		setAutoMode(!autoMode);
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0400', value: autoMode ? 1 : 0 });
		}
	}, [autoMode, socketRef]);

	const handleAirToggle = useCallback(() => {
		setAirMode(!airMode);
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0401', value: airMode ? 1 : 0 });
		}
	}, [airMode, socketRef]);

	const handleVentilToggle = useCallback(() => {
		const newMode = (ventilMode + 1) % 3;
		setVentilMode(newMode);
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0402', value: newMode });
		}
	}, [ventilMode, socketRef]);

	const handleLightToggle = useCallback(() => {
		const newStatus = (lightStatus + 1) % 4;
		setLightStatus(newStatus);
		if (socketRef.current) {
			socketRef.current.emit('writeRegister', { register: 'R01702', value: newStatus });
		}
	}, [lightStatus, socketRef]);

	const handleFanToggle = useCallback(() => {
		const newStatus = (fan1Status + 1) % 4;
		setFan1Status(newStatus);
		if (socketRef.current) {
			socketRef.current.emit('writeRegister', { register: 'R01700', value: newStatus });
		}
	}, [fan1Status, socketRef]);

	const handleValve1Toggle = useCallback(() => {
		setValve1Status(!valve1Status);
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0500', value: valve1Status ? 1 : 0 });
		}
	}, [valve1Status, socketRef]);

	const handleValve2Toggle = useCallback(() => {
		setValve2Status(!valve2Status);
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0501', value: valve2Status ? 1 : 0 });
		}
	}, [valve2Status, socketRef]);

	const handleCloseErrorModal = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0400', value: 0 });
		}
		setShowErrorModal(false);
		setErrorMessage('');
	}, [socketRef]);

	const handleCloseSeatAlarmModal = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.emit('writeBit', { register: 'M0400', value: 0 });
			socketRef.current.emit('writeRegister', { register: 'R0030', value: 0 });
		}
		setShowSeatAlarmModal(false);
		setActiveSeatAlarm(null);
	}, [socketRef]);

	// Initialize socket connection on mount
	useEffect(() => {
		handleConnect();
	}, []);

	// Update time every minute
	useEffect(() => {
		const timer = setInterval(updateCurrentTime, 60000);
		return () => clearInterval(timer);
	}, []);

	// Clean up socket on unmount
	useEffect(() => {
		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect();
			}
		};
	}, []);

	return (
		<>
			<Head>
				<title>Dashboard - Chamber Control</title>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="description" content="Modern chamber control dashboard with real-time monitoring" />
			</Head>

			<div
				className={`min-h-screen overflow-hidden transition-all duration-500 ${
					darkMode
						? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
						: 'bg-gradient-to-br from-sky-100 via-slate-100 to-amber-50'
				}`}>
				{/* Decorative background elements */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div
						className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl transition-all duration-500 ${
							darkMode ? 'bg-blue-500/10' : 'bg-sky-400/20'
						}`}
					/>
					<div
						className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
							darkMode ? 'bg-emerald-500/10' : 'bg-amber-400/20'
						}`}
					/>
					<div
						className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl transition-all duration-500 ${
							darkMode ? 'bg-indigo-500/5' : 'bg-violet-300/10'
						}`}
					/>
				</div>

				{/* Content */}
				<div className="relative z-10 px-8 py-6 flex flex-col h-screen">
					{/* Header */}
					<Header />

					{/* Main Grid */}
					<div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-4 md:gap-6">
						{/* Chamber Control - Left Column */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3">
							<ChamberControlPanel
								isDark={darkMode}
								onAutoToggle={handleAutoToggle}
								onAirToggle={handleAirToggle}
								onVentilToggle={handleVentilToggle}
								onOpenChiller={() => setShowChillerModal(true)}
							/>
						</div>

						{/* Auxiliary Output - Middle Column */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
							<AuxiliaryOutputPanel
								isDark={darkMode}
								onValve1Toggle={handleValve1Toggle}
								onValve2Toggle={handleValve2Toggle}
							/>
						</div>

						{/* Right Column - Lighting & Fan */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 flex flex-col gap-6">
							<LightingPanel
								isDark={darkMode}
								onMainLightToggle={handleLightToggle}
								onAnteLightToggle={handleLightToggle}
							/>
							<FanPanel
								isDark={darkMode}
								onFanToggle={handleFanToggle}
							/>
						</div>
					</div>
				</div>

				{/* Error Modal */}
				<ErrorModal
					socketRef={socketRef}
					onClose={handleCloseErrorModal}
				/>

				{/* Seat Alarm Modal */}
				<SeatAlarmModal
					socketRef={socketRef}
					onClose={handleCloseSeatAlarmModal}
				/>

				{/* Chiller Control Modal */}
				<ChillerControlModal
					isOpen={showChillerModal}
					onClose={() => setShowChillerModal(false)}
					socketRef={socketRef}
				/>
			</div>
		</>
	);
}
