import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import io from 'socket.io-client';
import { useDashboardStore } from '../store';
import { ChillerControlModal } from '../components/ChillerControlModal';

export default function HomePage() {
	// Get state and actions from the store
	const {
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

	// Socket reference
	const [socketRef, setSocketRef] = React.useState(null);

	// Function to play sound
	const playSound = () => {
		if (!playing) {
			console.log('playSound');
			setPlaying(true);
			const newAudio = new Audio('/external/bmw-bong.mp3');
			newAudio.play().catch((error) => {
				console.error('Error playing sound:', error);
			});
		}
	};

	useEffect(() => {
		console.log('useEffect');
		// Initialize socket connection
		const socket = io('http://192.168.2.55:4000', {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
		});

		// Add error handling
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

		// Store socket reference
		setSocketRef(socket);

		// Handle connection event
		socket.on('connect', () => {
			console.log('Connected to socket server');
			setConnected(true);
			updateCurrentTime();
		});

		socket.on('data', (data) => {
			const errorData = JSON.parse(data);
			console.log('errorData', Number(errorData.data[19]).toString(2));
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
				}
			} else if (errorArray[1] == '0') {
				setShowErrorModal(false);
				setErrorMessage('');
				setActiveSeatAlarm(null);
				setShowSeatAlarmModal(false);
			}
		});

		// Handle disconnection event
		socket.on('disconnect', () => {
			console.log('Disconnected from socket server');
			setConnected(false);
		});

		// Listen for calibration progress updates
		socket.on('calibrationProgress', (data) => {
			setCalibrationProgress(data.progress);
			setCalibrationStatus(data.status);

			if (data.progress === 100) {
				setTimeout(() => {
					setShowCalibrationModal(false);
				}, 2000);
			}
		});

		// Listen for seat alarm updates
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

		// Listen for chiller data updates
		socket.on('chillerData', (data) => {
			if (data.currentTemp !== undefined) {
				setChillerCurrentTemp(data.currentTemp / 10); // Convert from 0.1°C units
			}
			if (data.running !== undefined) {
				setChillerRunning(data.running === 1);
			}
		});

		// Function to update current time
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

		// Clean up socket connection on component unmount
		return () => {
			socket.disconnect();
		};
	}, []);

	// Function to start calibration
	const startCalibration = () => {
		setShowCalibrationModal(true);
		setCalibrationProgress(0);
		setCalibrationStatus('Starting calibration...');

		if (socketRef) {
			socketRef.emit('serialSend', 'C');
		}
	};

	const setLight = () => {
		console.log('setLight');
		console.log(socketRef);
		if (socketRef) {
			const newValue = (lightStatus + 1) % 4;
			let regValue = 0;
			switch (newValue) {
				case 0: // Off
					regValue = 0;
					break;
				case 1: // Low
					regValue = 85;
					break;
				case 2: // Medium
					regValue = 170;
					break;
				case 3: // High
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
				case 0: // Off
					regValue = 0;
					break;
				case 1: // Low
					regValue = 85;
					break;
				case 2: // Medium
					regValue = 170;
					break;
				case 3: // High
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
				case 0: // Off
					regValue = 0;
					break;
				case 1: // Low
					regValue = 85;
					break;
				case 2: // Medium
					regValue = 170;
					break;
				case 3: // High
					regValue = 255;
					break;
			}
			socketRef.emit('writeRegister', { register: 'R01706', value: regValue });
			setFan2Status(newValue);
		}
	};

	const setVentil = () => {
		console.log('setVentil');
		if (socketRef) {
			const newMode = (ventilMode + 1) % 3;
			const newValue = newMode === 0 ? 0 : newMode === 1 ? 1 : 2;
			console.log('newValue', newValue);
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
		console.log('setAuto');
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
		console.log('setAir');
		if (socketRef) {
			const newValue = airMode ? 0 : 1;
			socketRef.emit('writeBit', { register: 'M0200', value: newValue });
			setAirMode(!airMode);
		}
	};

	const setLight2 = () => {
		console.log('setLight2');
		if (socketRef) {
			const newValue = (light2Status + 1) % 4;
			let regValue = 0;
			switch (newValue) {
				case 0: // Off
					regValue = 0;
					break;
				case 1: // Low
					regValue = 85;
					break;
				case 2: // Medium
					regValue = 170;
					break;
				case 3: // High
					regValue = 255;
					break;
			}
			socketRef.emit('writeRegister', { register: 'R01702', value: regValue });
			setLight2Status(newValue);
		}
	};

	const setValve1 = () => {
		console.log('setValve1');
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
		console.log('setValve2');
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
			<div className="vital-sign-home-container10">
				<div className="vital-sign-home-dashboard">
					<div className="vital-sign-home-basic-header">
						<img
							alt="HipertechLogo2501"
							src="/external/hipertechlogo2501-ygje.svg"
							className="page1-hipertech-logo"
						/>
					</div>
					<div className="vital-sign-home-card-container">
						<div className="vital-sign-home-number-card1">
							<div className="vital-sign-home-frame1">
								<span className="vital-sign-home-text10">Chamber Control</span>
							</div>
							<div className="vital-sign-home-group46">
								<button
									className="vital-sign-home-frame-button1"
									onClick={setAuto}
									style={{
										backgroundColor: autoMode
											? '#C9372C'
											: 'rgba(0, 122, 94, 1)',
									}}>
									<div className="vital-sign-home-container11">
										<span className="vital-sign-home-text11">
											{autoMode ? 'Manual' : 'Automatic'}
										</span>
									</div>
								</button>
								<button
									className="vital-sign-home-frame-button2"
									onClick={setAir}
									style={{
										backgroundColor: airMode
											? 'rgb(33,116,212)'
											: 'rgba(0, 122, 94, 1)',
									}}>
									<div className="vital-sign-home-container12">
										<span className="vital-sign-home-text12">
											{airMode ? 'Oxygen' : 'Air'}
										</span>
									</div>
								</button>
								<button
									className="vital-sign-home-frame-button3"
									onClick={setVentil}
									style={{
										backgroundColor:
											ventilMode === 0
												? 'rgba(0, 122, 94, 1)'
												: ventilMode === 1
												? '#C9372C'
												: '#FFA500',
									}}>
									<div className="vital-sign-home-container13">
										<span className="vital-sign-home-text13">
											{ventilMode === 0
												? 'Ventilation'
												: ventilMode === 1
												? 'Low'
												: 'High'}
										</span>
									</div>
								</button>
								<button
									className="vital-sign-home-frame-button-chiller"
									onClick={() => setShowChillerModal(true)}
									style={{
										backgroundColor: chillerRunning ? '#06b6d4' : '#90a1b9',
									}}>
									<div className="vital-sign-home-container-chiller">
										<span className="vital-sign-home-text-chiller">
											Chiller{' '}
											{chillerRunning
												? `${chillerCurrentTemp.toFixed(1)}°C`
												: 'Off'}
										</span>
									</div>
								</button>
							</div>
						</div>
						<div className="vital-sign-home-number-card2">
							<div className="vital-sign-home-frame4">
								<span className="vital-sign-home-text14">Auxiliary Output</span>
							</div>
							<span className="vital-sign-home-text15">Main Chamber</span>
							<button
								className="vital-sign-home-frame-button4"
								onClick={setValve1}
								style={{
									backgroundColor: valve1Status
										? '#C9372C'
										: 'rgba(0, 122, 94, 1)',
								}}>
								<div className="vital-sign-home-container14">
									<span className="vital-sign-home-text16">
										{valve1Status ? 'Close' : 'Open'}
									</span>
								</div>
							</button>
							<span className="vital-sign-home-text17">Ante Chamber</span>
							<button
								className="vital-sign-home-frame-button5"
								onClick={setValve2}
								style={{
									backgroundColor: valve2Status
										? '#C9372C'
										: 'rgba(0, 122, 94, 1)',
								}}>
								<div className="vital-sign-home-container15">
									<span className="vital-sign-home-text18">
										{valve2Status ? 'Close' : 'Open'}
									</span>
								</div>
							</button>
						</div>
						<div className="vital-sign-home-frame471">
							<div className="vital-sign-home-number-card4">
								<div className="vital-sign-home-frame32">
									<div className="vital-sign-home-frame7">
										<span className="vital-sign-home-text24">Lighting </span>
									</div>
									<div className="vital-sign-home-frame8">
										<span className="vital-sign-home-text25">
											Main Chamber
											<span
												dangerouslySetInnerHTML={{
													__html: ' ',
												}}
											/>
										</span>
										<span className="vital-sign-home-text26">Ante Chamber</span>
									</div>
								</div>
								<div className="vital-sign-home-frame473">
									<button
										className="vital-sign-home-frame-button8"
										onClick={setLight}
										style={{
											backgroundColor:
												lightStatus === 0
													? '#90a1b9'
													: lightStatus === 1
													? '#2174d4'
													: lightStatus === 2
													? '#FFA500'
													: '#C9372C',
										}}>
										<div className="vital-sign-home-container18">
											<span className="vital-sign-home-text27">
												{lightStatus === 0
													? 'Off'
													: lightStatus === 1
													? 'Low'
													: lightStatus === 2
													? 'Medium'
													: 'High'}
											</span>
										</div>
									</button>
									<button
										className="vital-sign-home-frame-button9"
										onClick={setLight2}
										style={{
											backgroundColor:
												light2Status === 0
													? '#90a1b9'
													: light2Status === 1
													? '#2174d4'
													: light2Status === 2
													? '#FFA500'
													: '#C9372C',
										}}>
										<div className="vital-sign-home-container19">
											<span className="vital-sign-home-text28">
												{light2Status === 0
													? 'Off'
													: light2Status === 1
													? 'Low'
													: light2Status === 2
													? 'Medium'
													: 'High'}
											</span>
										</div>
									</button>
								</div>
							</div>
							<div className="vital-sign-home-number-card3">
								<div className="vital-sign-home-frame31">
									<div className="vital-sign-home-frame5">
										<span className="vital-sign-home-text19">Fan </span>
									</div>
									<div className="vital-sign-home-frame6">
										<span className="vital-sign-home-text20">
											Main Chamber
											<span
												dangerouslySetInnerHTML={{
													__html: ' ',
												}}
											/>
										</span>
									</div>
								</div>
								<div className="vital-sign-home-frame472">
									<button
										className="vital-sign-home-frame-button6"
										onClick={setFan1}
										style={{
											backgroundColor:
												fan1Status === 0
													? '#90a1b9'
													: fan1Status === 1
													? '#2174d4'
													: fan1Status === 2
													? '#FFA500'
													: '#C9372C',
										}}>
										<div className="vital-sign-home-container16">
											<span className="vital-sign-home-text22">
												{fan1Status === 0
													? 'Off'
													: fan1Status === 1
													? 'Low'
													: fan1Status === 2
													? 'Medium'
													: 'High'}
											</span>
										</div>
									</button>
								</div>
							</div>
						</div>
					</div>
					<div className="page1-frame24">
						<span className="page1-text24">{currentTime || '10.03.2025'}</span>
						<span className="page1-text24">{currentTime2 || '14:27'}</span>
					</div>
				</div>
			</div>

			{/* Error Modal */}
			{showErrorModal && (
				<div className="modal-overlay">
					<div className="error-modal">
						<div className="error-icon">
							<img
								src="/external/alarm.png"
								alt="Alarm Icon"
								className="alarm-icon-image"
							/>
						</div>
						<h2>Warning</h2>
						<p>{errorMessage}</p>
						<button className="error-button" onClick={closeModal}>
							Close
						</button>
					</div>
				</div>
			)}

			{/* Seat Alarm Modal */}
			{showSeatAlarmModal && (
				<div className="modal-overlay">
					<div className="seat-alarm-modal">
						<div className="seat-alarm-icon">
							<img
								src="/external/seat_icon.png"
								alt="Seat Icon"
								className="seat-icon-image"
							/>
						</div>
						<h2>Seat Alarm</h2>
						<p className="seat-alarm-message">{activeSeatAlarm?.seatNumber}</p>
						<button className="seat-alarm-button" onClick={closeSeatAlarmModal}>
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

			<style jsx global>{`
				@font-face {
					font-family: 'Poppins';
					src: url('/fonts/PlusJakartaSans-Regular.woff2') format('woff2'),
						url('/fonts/PlusJakartaSans-Regular.woff') format('woff');
					font-weight: 400;
					font-style: normal;
					font-display: swap;
				}

				@font-face {
					font-family: 'Poppins';
					src: url('/fonts/PlusJakartaSans-Medium.woff2') format('woff2'),
						url('/fonts/PlusJakartaSans-Medium.woff') format('woff');
					font-weight: 500;
					font-style: normal;
					font-display: swap;
				}

				@font-face {
					font-family: 'Poppins';
					src: url('/fonts/PlusJakartaSans-SemiBold.woff2') format('woff2'),
						url('/fonts/PlusJakartaSans-SemiBold.woff') format('woff');
					font-weight: 600;
					font-style: normal;
					font-display: swap;
				}

				@font-face {
					font-family: 'Poppins';
					src: url('/fonts/PlusJakartaSans-Bold.woff2') format('woff2'),
						url('/fonts/PlusJakartaSans-Bold.woff') format('woff');
					font-weight: 700;
					font-style: normal;
					font-display: swap;
				}

				* {
					font-family: 'Poppins', sans-serif;
				}

				.page1-text10 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text11 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text12 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text14 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text15 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text16 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text18 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text19 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.page1-text24 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.calibration-modal h2 {
					font-family: 'Poppins', sans-serif;
					font-weight: 700;
				}

				.calibration-modal p {
					font-family: 'Poppins', sans-serif;
					font-weight: 500;
				}

				.cancel-button {
					font-family: 'Poppins', sans-serif;
					font-weight: 600;
				}

				.error-modal {
					background-color: white;
					border-radius: 24px;
					padding: 60px;
					width: 600px;
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
					text-align: center;
				}

				.error-icon {
					margin-bottom: 30px;
					display: flex;
					justify-content: center;
					align-items: center;
				}

				.alarm-icon-image {
					width: 72px;
					height: 72px;
					object-fit: contain;
				}

				.error-modal h2 {
					font-family: 'Poppins';
					font-weight: 700;
					font-size: 36px;
					color: rgb(220, 53, 69);
					margin-bottom: 24px;
				}

				.error-modal p {
					font-family: 'Poppins';
					font-size: 24px;
					color: rgb(74, 74, 74);
					margin-bottom: 40px;
				}

				.error-button {
					padding: 16px 48px;
					font-size: 20px;
					font-weight: 600;
					background-color: rgb(220, 53, 69);
					color: white;
					border: none;
					border-radius: 12px;
					cursor: pointer;
					font-family: 'Poppins';
					transition: background-color 0.3s;
				}

				.error-button:hover {
					background-color: rgb(200, 35, 51);
				}

				.vital-sign-home-container10 {
					width: 100%;
					display: flex;
					overflow: auto;
					min-height: 100vh;
					align-items: center;
					flex-direction: column;
				}

				.vital-sign-home-dashboard {
					gap: 19px;
					width: 100%;
					height: auto;
					display: flex;
					padding: 0 48px;
					overflow: hidden;
					align-items: center;
					flex-shrink: 0;
					flex-direction: column;
					background-color: rgba(250, 252, 254, 1);
				}

				.vital-sign-home-basic-header {
					gap: 216px;
					display: flex;
					padding: 24px 0 0;
					align-self: stretch;
					align-items: center;
					flex-shrink: 0;
					justify-content: center;
					background-color: rgba(250, 252, 254, 1);
				}

				.vital-sign-home-hipertech-logo {
					width: 498px;
					height: 91px;
				}

				.vital-sign-home-card-container {
					gap: 23px;
					width: 1148px;
					height: 512px;
					display: flex;
					z-index: 1;
					align-items: flex-start;
					flex-shrink: 0;
					justify-content: space-between;
				}

				.vital-sign-home-number-card1 {
					gap: 20px;
					width: 300px;
					height: 512px;
					display: flex;
					padding: 10px 10px;
					overflow: hidden;
					flex-wrap: wrap;
					align-items: flex-start;
					flex-shrink: 0;
					border-color: rgba(0, 0, 0, 0);
					border-style: solid;
					border-width: 1.5px;
					border-radius: 16px;
					justify-content: center;
					background-color: rgba(36, 78, 126, 0.09000000357627869);
				}

				.vital-sign-home-frame1 {
					gap: 128px;
					width: 269px;
					display: flex;
					align-items: flex-start;
					flex-shrink: 0;
					flex-direction: column;
				}

				.vital-sign-home-text10 {
					color: rgba(26, 32, 39, 1);
					width: 269px;
					height: auto;
					font-size: 36px;
					font-style: Bold;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 700;
					line-height: 45px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-group46 {
					width: 235px;
					height: 381px;
					display: flex;
					position: relative;
					align-items: flex-start;
					flex-shrink: 1;
				}

				.vital-sign-home-frame-button1 {
					top: 0px;
					left: 0px;
					width: 235px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					position: absolute;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(11, 101, 227, 1);
				}

				.vital-sign-home-container11 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text11 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button2 {
					top: 105px;
					left: 0px;
					width: 235px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					position: absolute;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(11, 101, 227, 1);
				}

				.vital-sign-home-container12 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text12 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button3 {
					top: 210px;
					left: 0px;
					width: 235px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					position: absolute;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(11, 101, 227, 1);
				}

				.vital-sign-home-container13 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text13 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button-chiller {
					top: 315px;
					left: 0px;
					width: 235px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					position: absolute;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: #90a1b9;
					transition: background-color 0.3s ease;
				}

				.vital-sign-home-container-chiller {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text-chiller {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-number-card2 {
					gap: 48px;
					width: 291px;
					height: 512px;
					display: flex;
					padding: 10px 10px;
					overflow: hidden;
					align-items: center;
					flex-shrink: 0;
					border-color: rgba(0, 0, 0, 0);
					border-style: solid;
					border-width: 1.5px;
					border-radius: 16px;
					flex-direction: column;
					background-color: rgba(36, 78, 126, 0.09000000357627869);
				}

				.vital-sign-home-frame4 {
					gap: 128px;
					width: 278px;
					display: flex;
					align-items: flex-start;
					flex-shrink: 0;
					flex-direction: column;
				}

				.vital-sign-home-text14 {
					color: rgba(26, 32, 39, 1);
					height: auto;
					font-size: 36px;
					align-self: stretch;
					font-style: Bold;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 700;
					line-height: 45px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-text15 {
					color: rgba(94, 77, 178, 1);
					height: auto;
					font-size: 36px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 35px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button4 {
					width: 235px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(0, 122, 94, 1);
				}

				.vital-sign-home-container14 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text16 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-text17 {
					color: rgba(94, 77, 178, 1);
					height: auto;
					font-size: 36px;
					align-self: stretch;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 35px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button5 {
					width: 235px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(0, 122, 94, 1);
				}

				.vital-sign-home-container15 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text18 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame471 {
					gap: 53px;
					height: 512px;
					display: flex;
					align-items: center;
					flex-shrink: 0;
					flex-direction: column;
				}

				.vital-sign-home-number-card3 {
					gap: 15px;
					width: 450px;
					height: 230px;
					display: flex;
					padding: 10px 10px;
					overflow: hidden;
					align-items: flex-end;
					flex-shrink: 0;
					border-color: rgba(0, 0, 0, 0);
					border-style: solid;
					border-width: 1.5px;
					border-radius: 16px;
					flex-direction: column;
					background-color: rgba(36, 78, 126, 0.09000000357627869);
				}

				.vital-sign-home-frame31 {
					gap: 25px;
					display: flex;
					align-self: stretch;
					align-items: flex-start;
					flex-direction: column;
				}

				.vital-sign-home-frame5 {
					gap: 128px;
					width: 402px;
					height: 30px;
					display: flex;
					align-items: center;
					flex-shrink: 0;
					justify-content: space-between;
				}

				.vital-sign-home-text19 {
					color: rgba(26, 32, 39, 1);
					width: 100%;
					height: auto;
					font-size: 36px;
					font-style: Bold;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 700;
					line-height: 24px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame6 {
					display: flex;
					justify-content: space-between;
					width: 100%;
				}

				.vital-sign-home-text20 {
					color: rgb(26, 32, 39);
					height: auto;
					font-size: 36px;
					font-style: Medium;
					text-align: left;
					font-family: 'Plus Jakarta Sans';
					font-weight: 500;
					line-height: 35px;
					font-stretch: normal;
					text-decoration: none;
					text-align: center;
					width: 100%;
				}

				.vital-sign-home-text21 {
					color: rgba(26, 32, 39, 1);
					height: auto;
					font-size: 36px;
					font-style: Medium;
					text-align: left;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 35px;
					font-stretch: normal;
					text-decoration: none;
					text-align: center;
				}

				.vital-sign-home-frame472 {
					display: flex;
					justify-content: space-around;
					width: 100%;
				}

				.vital-sign-home-frame-button6 {
					width: 85%;
					height: 66px;
					display: flex;
					padding: 0 12px;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(0, 122, 94, 1);
				}

				.vital-sign-home-container16 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text22 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button7 {
					width: 150px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(0, 122, 94, 1);
				}

				.vital-sign-home-container17 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text23 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-number-card4 {
					gap: 15px;
					width: 450px;
					height: 230px;
					display: flex;
					padding: 10px 10px;
					overflow: hidden;
					align-items: flex-end;
					flex-shrink: 0;
					border-color: rgba(0, 0, 0, 0);
					border-style: solid;
					border-width: 1.5px;
					border-radius: 16px;
					flex-direction: column;
					background-color: rgba(36, 78, 126, 0.09000000357627869);
				}

				.vital-sign-home-frame32 {
					gap: 25px;
					display: flex;
					align-self: stretch;
					align-items: flex-start;
					flex-direction: column;
				}

				.vital-sign-home-frame7 {
					gap: 128px;
					width: 402px;
					height: 30px;
					display: flex;
					align-items: center;
					flex-shrink: 0;
					justify-content: space-between;
				}

				.vital-sign-home-text24 {
					color: rgba(26, 32, 39, 1);
					width: 402px;
					height: auto;
					font-size: 36px;
					font-style: Bold;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 700;
					line-height: 24px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame8 {
					display: flex;
					justify-content: space-between;
					width: 100%;
				}

				.vital-sign-home-text25 {
					color: rgba(26, 32, 39, 1);
					height: auto;
					font-size: 36px;
					font-style: Regular;
					text-align: left;
					font-family: Plus Jakarta Sans;
					font-weight: 400;
					line-height: 35px;
					font-stretch: normal;
					text-decoration: none;
					text-align: center;
				}

				.vital-sign-home-text26 {
					color: rgba(26, 32, 39, 1);
					height: auto;
					font-size: 36px;
					font-style: Medium;
					text-align: left;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 35px;
					font-stretch: normal;
					text-decoration: none;
					text-align: center;
				}

				.vital-sign-home-frame473 {
					display: flex;
					justify-content: space-around;
					width: 100%;
				}

				.vital-sign-home-frame-button8 {
					width: 150px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(0, 122, 94, 1);
				}

				.vital-sign-home-container18 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text27 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame-button9 {
					width: 150px;
					height: 66px;
					display: flex;
					padding: 0 12px;
					align-items: center;
					flex-shrink: 0;
					border-radius: 3px;
					justify-content: center;
					background-color: rgba(0, 122, 94, 1);
				}

				.vital-sign-home-container19 {
					gap: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.vital-sign-home-text28 {
					color: rgba(255, 255, 255, 1);
					height: auto;
					font-size: 24px;
					font-style: Medium;
					text-align: center;
					font-family: Plus Jakarta Sans;
					font-weight: 500;
					line-height: 20px;
					font-stretch: normal;
					text-decoration: none;
				}

				.vital-sign-home-frame2 {
					gap: 36px;
					width: 1184px;
					height: 65px;
					display: flex;
					padding: 20px 0 0;
					z-index: 2;
					position: relative;
					align-items: center;
					flex-shrink: 0;
					justify-content: center;
				}

				.vital-sign-home-wpfconnected {
					top: 9px;
					left: 0px;
					width: 48px;
					height: 48px;
					position: absolute;
				}

				.vital-sign-home-text29 {
					top: 17px;
					left: 914px;
					color: rgb(74, 144, 226);
					height: auto;
					position: absolute;
					font-size: 32px;
					font-style: Bold;
					text-align: left;
					font-family: 'Plus Jakarta Sans';
					font-weight: 700;
					line-height: 100%;
					font-stretch: normal;
					text-decoration: none;
				}

				/* Modal styles */
				.modal-overlay {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background-color: rgba(0, 0, 0, 0.6);
					display: flex;
					justify-content: center;
					align-items: center;
					z-index: 10;
				}

				.calibration-modal {
					background-color: white;
					border-radius: 16px;
					padding: 40px;
					width: 500px;
					box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
					text-align: center;
				}

				.calibration-modal h2 {
					font-family: 'Poppins';
					font-weight: 700;
					font-size: 28px;
					color: rgb(26, 32, 39);
					margin-bottom: 20px;
				}

				.calibration-status {
					font-family: 'Poppins';
					font-size: 18px;
					color: rgb(74, 74, 74);
					margin-bottom: 30px;
				}

				.progress-container {
					width: 100%;
					height: 20px;
					background-color: rgba(36, 78, 126, 0.1);
					border-radius: 10px;
					margin-bottom: 10px;
					overflow: hidden;
				}

				.progress-bar {
					height: 100%;
					background-color: rgb(33, 116, 212);
					transition: width 0.3s ease;
				}

				.progress-percentage {
					font-family: 'Poppins';
					font-size: 18px;
					font-weight: 600;
					color: rgb(33, 116, 212);
					margin-bottom: 30px;
				}

				.cancel-button {
					padding: 12px 24px;
					font-size: 16px;
					font-weight: 600;
					background-color: rgb(240, 240, 240);
					color: rgb(74, 74, 74);
					border: none;
					border-radius: 8px;
					cursor: pointer;
					font-family: 'Poppins';
					transition: background-color 0.3s;
				}

				.cancel-button:hover {
					background-color: rgb(220, 220, 220);
				}

				/* Button styles */
				.button-container {
					display: flex;
					flex-direction: row;
					gap: 12px;
					width: 45%;
					margin-bottom: 0px;
				}

				.reset-button {
					width: 100%;
					padding: 12px 24px;
					font-size: 48px;
					font-weight: 600;
					background-color: rgb(220, 53, 69);
					color: white;
					border: none;
					border-radius: 8px;
					cursor: pointer;
					font-family: 'Poppins';
					transition: all 0.3s ease;
					box-shadow: 0 2px 4px rgba(220, 53, 69, 0.2);
				}

				.reset-button:hover {
					background-color: rgb(200, 35, 51);
					transform: translateY(-1px);
					box-shadow: 0 4px 6px rgba(220, 53, 69, 0.3);
				}

				/* Seat Alarm Modal Styles */
				.seat-alarm-modal {
					background-color: white;
					border-radius: 24px;
					padding: 60px;
					width: 600px;
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
					text-align: center;
					animation: pulse 2s infinite;
				}

				.seat-alarm-icon {
					margin-bottom: 30px;
					display: flex;
					justify-content: center;
					align-items: center;
				}

				.seat-icon-image {
					width: 72px;
					height: 72px;
					object-fit: contain;
				}

				.seat-alarm-modal h2 {
					font-family: 'Poppins';
					font-weight: 700;
					font-size: 36px;
					color: #c9372c;
					margin-bottom: 24px;
				}

				.seat-alarm-message {
					font-family: 'Poppins';
					font-size: 96px;
					color: #c9372c;
					margin-bottom: 40px;
					font-weight: 800;
				}

				.seat-alarm-button {
					padding: 16px 48px;
					font-size: 20px;
					font-weight: 600;
					background-color: #c9372c;
					color: white;
					border: none;
					border-radius: 12px;
					cursor: pointer;
					font-family: 'Poppins';
					transition: background-color 0.3s;
				}

				.seat-alarm-button:hover {
					background-color: rgb(200, 35, 51);
				}

				@keyframes pulse {
					0% {
						transform: scale(1);
					}
					50% {
						transform: scale(1.02);
					}
					100% {
						transform: scale(1);
					}
				}
			`}</style>
		</>
	);
}
