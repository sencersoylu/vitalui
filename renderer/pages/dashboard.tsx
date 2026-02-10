import React, { useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import { useDashboardStore } from '../store';
import { ChillerControlModal } from '../components/ChillerControlModal';
import { Header } from '../components/dashboard/Header';
import { ChamberControlPanel } from '../components/dashboard/ChamberControlPanel';
import { AuxiliaryOutputPanel } from '../components/dashboard/AuxiliaryOutputPanel';
import { LightingPanel } from '../components/dashboard/LightingPanel';
import { FanPanel } from '../components/dashboard/FanPanel';
import { ErrorModal } from '../components/dashboard/ErrorModal';
import { SeatAlarmModal } from '../components/dashboard/SeatAlarmModal';

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
					<Header />

					{/* Main Grid */}
					<div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-4 md:gap-6">
						{/* Chamber Control - Left Column */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3">
							<ChamberControlPanel
								isDark={darkMode}
								onAutoToggle={setAuto}
								onAirToggle={setAir}
								onVentilToggle={setVentil}
								onOpenChiller={() => setShowChillerModal(true)}
							/>
						</div>

						{/* Auxiliary Output - Middle Column */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
							<AuxiliaryOutputPanel
								isDark={darkMode}
								onValve1Toggle={setValve1}
								onValve2Toggle={setValve2}
							/>
						</div>

						{/* Right Column - Lighting & Fan */}
						<div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5 flex flex-col gap-6">
							<LightingPanel
								isDark={darkMode}
								onMainLightToggle={setLight}
								onAnteLightToggle={setLight2}
							/>
							<FanPanel isDark={darkMode} onFanToggle={setFan1} />
						</div>
					</div>
				</div>
			</div>

			{/* Error Modal */}
			<ErrorModal
				socketRef={socketRef}
				onClose={() => setShowErrorModal(false)}
			/>

			{/* Seat Alarm Modal */}
			<SeatAlarmModal
				socketRef={socketRef}
				onClose={() => {
					setShowSeatAlarmModal(false);
					setActiveSeatAlarm(null);
				}}
			/>

			{/* Chiller Control Modal */}
			<ChillerControlModal
				isOpen={showChillerModal}
				onClose={() => setShowChillerModal(false)}
				socketRef={socketRef}
			/>
		</>
	);
}
