import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';

export default function HomePage() {
	const [vitalSigns, setVitalSigns] = useState({
		heartRate: '',
		oxygenSaturation: '',
		bloodPressure: '',
	});

	const [connected, setConnected] = useState(false);
	const [currentTime, setCurrentTime] = useState('');
	const [currentTime2, setCurrentTime2] = useState('');
	const [showCalibrationModal, setShowCalibrationModal] = useState(false);
	const [calibrationProgress, setCalibrationProgress] = useState(0);
	const [calibrationStatus, setCalibrationStatus] = useState('waiting'); // 'waiting' | 'no_finger' | 'measuring' | 'success' | 'error'
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showSeatAlarm, setShowSeatAlarm] = useState(false);
	const [seatNumber, setSeatNumber] = useState('');
	const [socketRef, setSocketRef] = useState(null);
	const timeInterval = useRef(null);
	const noFingerTimer = useRef(null);

	useEffect(() => {
		const socket = io('http://localhost:4000', {
			transports: ['websocket', 'polling'],
			extraHeaders: {
				'Access-Control-Allow-Origin': 'http://localhost:8888',
			},
		});

		setSocketRef(socket);

		socket.on('connect', () => {
			setConnected(true);
			updateCurrentTime();
		});

		let lastStatus;
		socket.on('data', (data) => {
			console.log('Received data:', data);
		});

		socket.on('serialData', (data) => {
			const msg = data.data;

			// --- Calibration progress ---
			// New format: PRO:status,progress (e.g. PRO:1,45)
			if (msg.includes('PRO:')) {
				setShowCalibrationModal(true);
				const parts = msg.split(':')[1].split(',');
				const bpStatus = parseInt(parts[0]);
				const progress = parseInt(parts.length > 1 ? parts[1] : parts[0]);
				setCalibrationProgress(progress);
				if (bpStatus === 0) setCalibrationStatus('no_finger');
				else if (bpStatus === 1) setCalibrationStatus('measuring');
				else if (bpStatus === 2) setCalibrationStatus('success');
				else if (bpStatus === 5) setCalibrationStatus('error');
				else setCalibrationStatus('measuring');
			}
			// Old format: [PARMAK YOK] progress = %0
			else if (msg.includes('progress = %')) {
				setShowCalibrationModal(true);
				const progMatch = msg.match(/progress\s*=\s*%(\d+)/);
				const progress = progMatch ? parseInt(progMatch[1]) : 0;
				setCalibrationProgress(progress);
				if (msg.includes('PARMAK YOK')) setCalibrationStatus('no_finger');
				else if (msg.includes('OLCULUYOR')) setCalibrationStatus('measuring');
				else if (msg.includes('BASARILI')) setCalibrationStatus('success');
				else if (msg.includes('HATA')) setCalibrationStatus('error');
				else setCalibrationStatus('measuring');
			}
			// --- Calibration result ---
			else if (msg.includes('OK:CAL') || msg.includes('Calibration success')) {
				setCalibrationStatus('success');
				setCalibrationProgress(100);
				setTimeout(() => {
					setShowCalibrationModal(false);
				}, 1500);
			}
			else if (msg.includes('ERR:CAL') || msg.includes('Calibration failed')) {
				setShowCalibrationModal(false);
				setErrorMessage('Calibration failed. Please try again.');
				setShowErrorModal(true);
				setTimeout(() => {
					setShowErrorModal(false);
				}, 3000);
			}
			// --- Seat alarm ---
			else if (msg.includes('SEAT_ALARM')) {
				setShowSeatAlarm(true);
				const seatNum = msg.split(':')[1];
				setSeatNumber(seatNum);
			}
			// --- Vital signs data ---
			// New format: DATA:status,sys,dia,hr,spo2
			else if (msg.includes('DATA:')) {
				const dataArray = msg.split(':')[1].split(',');
				const st = parseInt(dataArray[0]);
				if (st >= 1 && st <= 6) {
					// Valid data - clear no-finger timer
					if (noFingerTimer.current) {
						clearTimeout(noFingerTimer.current);
						noFingerTimer.current = null;
					}
					setVitalSigns({
						heartRate: dataArray[3],
						oxygenSaturation: dataArray[4],
						bloodPressure: dataArray[1] + '/' + dataArray[2],
					});
				} else if (st === 0) {
					// No finger - start 60s timer to clear display
					if (!noFingerTimer.current) {
						noFingerTimer.current = setTimeout(() => {
							setVitalSigns({ heartRate: '', oxygenSaturation: '', bloodPressure: '' });
							noFingerTimer.current = null;
						}, 60000);
					}
				}
				lastStatus = dataArray[0];
			}
			// Old format: st = 2, sys = 115, dia = 73, hr = 66 spo2 = 99.10
			else if (msg.includes('st = ')) {
				const match = msg.match(/st\s*=\s*(\d+).*sys\s*=\s*(\d+).*dia\s*=\s*(\d+).*hr\s*=\s*(\d+).*spo2\s*=\s*([\d.]+)/);
				if (match) {
					const st = parseInt(match[1]);
					if (st >= 1 && st <= 6) {
						if (noFingerTimer.current) {
							clearTimeout(noFingerTimer.current);
							noFingerTimer.current = null;
						}
						setVitalSigns({
							heartRate: match[4],
							oxygenSaturation: match[5],
							bloodPressure: match[2] + '/' + match[3],
						});
					} else if (st === 0) {
						if (!noFingerTimer.current) {
							noFingerTimer.current = setTimeout(() => {
								setVitalSigns({ heartRate: '', oxygenSaturation: '', bloodPressure: '' });
								noFingerTimer.current = null;
							}, 60000);
						}
					}
					lastStatus = match[1];
				}
			}
		});

		socket.on('disconnect', () => {
			setConnected(false);
		});

		socket.on('vitalSigns', (data) => {
			setVitalSigns(data);
			updateCurrentTime();
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

		// Update time every second
		timeInterval.current = setInterval(updateCurrentTime, 1000);

		return () => {
			socket.disconnect();
			if (timeInterval.current) clearInterval(timeInterval.current);
			if (noFingerTimer.current) clearTimeout(noFingerTimer.current);
		};
	}, []);

	const startCalibration = () => {
		setShowCalibrationModal(true);
		setCalibrationProgress(0);
		setCalibrationStatus('waiting');

		if (socketRef) {
			socketRef.emit('serialSend', 'C');
		}
	};

	const getCalibrationMessage = () => {
		switch (calibrationStatus) {
			case 'waiting': return 'Preparing sensor...';
			case 'no_finger': return 'Place your finger on the sensor';
			case 'measuring': return 'Keep your finger steady';
			case 'success': return 'Calibration complete!';
			case 'error': return 'Calibration error';
			default: return 'Calibrating...';
		}
	};

	const resetData = () => {
		setVitalSigns({
			heartRate: '',
			oxygenSaturation: '',
			bloodPressure: '',
		});
	};

	const hasHR = vitalSigns.heartRate && vitalSigns.heartRate !== '0';
	const hasSpO2 = vitalSigns.oxygenSaturation && vitalSigns.oxygenSaturation !== '0';
	const hasBP = vitalSigns.bloodPressure && vitalSigns.bloodPressure !== '0/0' && vitalSigns.bloodPressure !== '';

	return (
		<>
			<Head>
				<title>Vital Signs Monitor</title>
				<meta property="og:title" content="Vital Signs Monitor" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
					rel="stylesheet"
				/>
			</Head>

			<div className="monitor-root">
				{/* Status Bar */}
				<div className="status-bar">
					<div className="status-left">
						<div className={`conn-indicator ${connected ? 'conn-on' : 'conn-off'}`} />
						<span className="conn-text">{connected ? 'Connected' : 'Disconnected'}</span>
					</div>
					<div className="status-center">
						<img
							alt="Logo"
							src="/external/logomark2501-ohe8.svg"
							className="status-logo"
						/>
						<span className="status-title">VitalMonitor</span>
					</div>
					<div className="status-right">
						<span className="status-time">{currentTime2 || '--:--'}</span>
						<span className="status-date">{currentTime || '--.--.----'}</span>
					</div>
				</div>

				{/* Vital Signs Grid */}
				<div className="vitals-container">
					{/* Heart Rate */}
					<div className="vital-card hr-card">
						<div className="vital-header">
							<div className="vital-label-row">
								<svg className="vital-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
								</svg>
								<span className="vital-label">HR</span>
							</div>
							<span className="vital-unit">bpm</span>
						</div>
						<div className="vital-value-container">
							{hasHR ? (
								<span className="vital-value hr-value">
									{vitalSigns.heartRate}
								</span>
							) : (
								<div className="vital-waiting">
									<div className="pulse-ring" />
									<span className="waiting-text">---</span>
								</div>
							)}
						</div>
						{hasHR && (
							<div className="vital-range">
								<span>Normal: 60-100</span>
							</div>
						)}
					</div>

					{/* SpO2 */}
					<div className="vital-card spo2-card">
						<div className="vital-header">
							<div className="vital-label-row">
								<svg className="vital-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<circle cx="12" cy="12" r="10" />
									<path d="M12 6v6l4 2" />
								</svg>
								<span className="vital-label">SpO2</span>
							</div>
							<span className="vital-unit">%</span>
						</div>
						<div className="vital-value-container">
							{hasSpO2 ? (
								<span className="vital-value spo2-value">
									{vitalSigns.oxygenSaturation}
								</span>
							) : (
								<div className="vital-waiting">
									<div className="pulse-ring spo2-ring" />
									<span className="waiting-text">---</span>
								</div>
							)}
						</div>
						{hasSpO2 && (
							<div className="vital-range spo2-range">
								<span>Normal: 95-100</span>
							</div>
						)}
					</div>

					{/* Blood Pressure */}
					<div className="vital-card bp-card">
						<div className="vital-header">
							<div className="vital-label-row">
								<svg className="vital-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
									<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
								</svg>
								<span className="vital-label">NIBP</span>
							</div>
							<span className="vital-unit">mmHg</span>
						</div>
						<div className="vital-value-container">
							{hasBP ? (
								<div className="bp-display">
									<span className="vital-value bp-value">
										{vitalSigns.bloodPressure.split('/')[0]}
									</span>
									<span className="bp-separator">/</span>
									<span className="bp-dia-value">
										{vitalSigns.bloodPressure.split('/')[1]}
									</span>
									<div className="bp-labels">
										<span className="bp-sys-label">SYS</span>
										<span className="bp-dia-label">DIA</span>
									</div>
								</div>
							) : (
								<div className="vital-waiting">
									<div className="pulse-ring bp-ring" />
									<span className="waiting-text">---/---</span>
								</div>
							)}
						</div>
						{hasBP && (
							<div className="vital-range bp-range">
								<span>Normal: 120/80</span>
							</div>
						)}
					</div>
				</div>

				{/* Action Bar */}
				<div className="action-bar">
					<button className="action-btn calibrate-btn" onClick={startCalibration}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
							<path d="M12 20V10" />
							<path d="M18 20V4" />
							<path d="M6 20v-4" />
						</svg>
						Calibrate
					</button>
					<button className="action-btn reset-btn" onClick={resetData}>
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-icon">
							<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
							<path d="M3 3v5h5" />
						</svg>
						Reset
					</button>
				</div>

				{/* Calibration Modal */}
				{showCalibrationModal && (
					<div className="modal-overlay">
						<div className="modal-card calib-modal">
							{/* Status Icon */}
							<div className={`modal-icon-container ${
								calibrationStatus === 'no_finger' ? 'icon-warning' :
								calibrationStatus === 'success' ? 'icon-success' :
								calibrationStatus === 'error' ? 'error-icon-bg' :
								''
							}`}>
								{calibrationStatus === 'no_finger' ? (
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="modal-icon" style={{color: '#fbbf24'}}>
										<path d="M18 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h8" />
										<path d="M10 19v-3.96 3.15" />
										<path d="M7 19h5" />
										<circle cx="18" cy="16" r="3" />
										<path d="M18 13v2" />
										<path d="M18 19v.01" />
									</svg>
								) : calibrationStatus === 'success' ? (
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="modal-icon" style={{color: '#22c55e'}}>
										<path d="M20 6L9 17l-5-5" />
									</svg>
								) : (
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="modal-icon calib-icon">
										<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
									</svg>
								)}
							</div>

							<h2 className="modal-title">Calibration</h2>
							<p className={`modal-status-text ${
								calibrationStatus === 'no_finger' ? 'status-warning' :
								calibrationStatus === 'measuring' ? 'status-active' :
								calibrationStatus === 'success' ? 'status-success' :
								calibrationStatus === 'error' ? 'status-error' : ''
							}`}>
								{getCalibrationMessage()}
							</p>

							{/* Progress Bar */}
							<div className="progress-track">
								<div
									className={`progress-fill ${
										calibrationStatus === 'success' ? 'progress-success' :
										calibrationStatus === 'no_finger' ? 'progress-waiting' : ''
									}`}
									style={{ width: `${calibrationProgress}%` }}
								/>
							</div>
							<span className="progress-text">{calibrationProgress}%</span>

							<button
								className="modal-btn cancel-btn"
								onClick={() => {
									if (socketRef) {
										socketRef.emit('cancelCalibration');
									}
									setShowCalibrationModal(false);
								}}>
								Cancel
							</button>
						</div>
					</div>
				)}

				{/* Error Modal */}
				{showErrorModal && (
					<div className="modal-overlay">
						<div className="modal-card error-modal">
							<div className="modal-icon-container error-icon-bg">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="modal-icon error-icon">
									<circle cx="12" cy="12" r="10" />
									<line x1="15" y1="9" x2="9" y2="15" />
									<line x1="9" y1="9" x2="15" y2="15" />
								</svg>
							</div>
							<h2 className="modal-title error-title">Error</h2>
							<p className="modal-desc">{errorMessage}</p>
							<button
								className="modal-btn error-btn"
								onClick={() => setShowErrorModal(false)}>
								OK
							</button>
						</div>
					</div>
				)}

				{/* Seat Alarm Modal */}
				{showSeatAlarm && (
					<div className="modal-overlay">
						<div className="modal-card alarm-modal">
							<div className="modal-icon-container alarm-icon-bg">
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="modal-icon alarm-icon">
									<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
									<line x1="12" y1="9" x2="12" y2="13" />
									<line x1="12" y1="17" x2="12.01" y2="17" />
								</svg>
							</div>
							<h2 className="modal-title alarm-title">Seat Alarm</h2>
							<p className="modal-desc">Seat {seatNumber} requires attention</p>
							<button
								className="modal-btn alarm-btn"
								onClick={() => {
									setShowSeatAlarm(false);
									setSeatNumber('');
								}}>
								Acknowledge
							</button>
						</div>
					</div>
				)}
			</div>

			<style jsx global>{`
				* {
					margin: 0;
					padding: 0;
					box-sizing: border-box;
				}

				html, body {
					background-color: #0b1120;
					overflow: hidden;
				}
			`}</style>
			<style jsx>{`
				.monitor-root {
					width: 100%;
					height: 100vh;
					max-width: 540px;
					margin: 0 auto;
					display: flex;
					flex-direction: column;
					background-color: #0b1120;
					font-family: 'Inter', -apple-system, sans-serif;
					color: #e2e8f0;
					padding: 0 4px;
					overflow: hidden;
				}

				/* ─── Status Bar ─── */
				.status-bar {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: 28px 12px;
					border-bottom: 1px solid rgba(255,255,255,0.08);
					flex-shrink: 0;
				}

				.status-left {
					display: flex;
					align-items: center;
					gap: 12px;
				}

				.conn-indicator {
					width: 14px;
					height: 14px;
					border-radius: 50%;
				}

				.conn-on {
					background: #22c55e;
					box-shadow: 0 0 6px rgba(34,197,94,0.6);
				}

				.conn-off {
					background: #ef4444;
					box-shadow: 0 0 6px rgba(239,68,68,0.6);
					animation: blink 1.5s infinite;
				}

				.conn-text {
					font-size: 16px;
					font-weight: 500;
					color: #94a3b8;
					letter-spacing: 0.02em;
				}

				.status-center {
					display: flex;
					align-items: center;
					gap: 10px;
				}

				.status-logo {
					width: 44px;
					height: 44px;
					opacity: 0.9;
				}

				.status-title {
					font-size: 24px;
					font-weight: 700;
					color: #cbd5e1;
					letter-spacing: 0.02em;
				}

				.status-right {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
				}

				.status-time {
					font-size: 28px;
					font-weight: 700;
					color: #e2e8f0;
					font-variant-numeric: tabular-nums;
				}

				.status-date {
					font-size: 16px;
					font-weight: 400;
					color: #64748b;
					font-variant-numeric: tabular-nums;
				}

				/* ─── Vitals Container ─── */
				.vitals-container {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: 12px;
					padding: 16px 0;
					overflow: hidden;
				}

				/* ─── Vital Card ─── */
				.vital-card {
					flex: 1;
					display: flex;
					flex-direction: column;
					border-radius: 12px;
					padding: 14px 20px;
					position: relative;
					overflow: hidden;
					min-height: 0;
				}

				.vital-card::before {
					content: '';
					position: absolute;
					left: 0;
					top: 0;
					bottom: 0;
					width: 4px;
					border-radius: 4px 0 0 4px;
				}

				/* HR Card */
				.hr-card {
					background: linear-gradient(135deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.02) 100%);
					border: 1px solid rgba(34,197,94,0.15);
				}
				.hr-card::before { background: #22c55e; }
				.hr-card .vital-label,
				.hr-card .vital-icon { color: #22c55e; }
				.hr-card .vital-unit { color: rgba(34,197,94,0.5); }
				.hr-value { color: #4ade80; }
				.hr-card .vital-range { color: rgba(34,197,94,0.4); }

				/* SpO2 Card */
				.spo2-card {
					background: linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(56,189,248,0.02) 100%);
					border: 1px solid rgba(56,189,248,0.15);
				}
				.spo2-card::before { background: #38bdf8; }
				.spo2-card .vital-label,
				.spo2-card .vital-icon { color: #38bdf8; }
				.spo2-card .vital-unit { color: rgba(56,189,248,0.5); }
				.spo2-value { color: #7dd3fc; }
				.spo2-card .vital-range { color: rgba(56,189,248,0.4); }

				/* BP Card */
				.bp-card {
					background: linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(251,146,60,0.02) 100%);
					border: 1px solid rgba(251,146,60,0.15);
				}
				.bp-card::before { background: #fb923c; }
				.bp-card .vital-label,
				.bp-card .vital-icon { color: #fb923c; }
				.bp-card .vital-unit { color: rgba(251,146,60,0.5); }
				.bp-value, .bp-dia-value { color: #fdba74; }
				.bp-card .vital-range { color: rgba(251,146,60,0.4); }

				/* ─── Vital Header ─── */
				.vital-header {
					display: flex;
					align-items: center;
					justify-content: space-between;
					flex-shrink: 0;
				}

				.vital-label-row {
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.vital-icon {
					width: 27px;
					height: 27px;
				}

				.vital-label {
					font-size: 21px;
					font-weight: 700;
					letter-spacing: 0.08em;
					text-transform: uppercase;
				}

				.vital-unit {
					font-size: 18px;
					font-weight: 500;
					letter-spacing: 0.04em;
				}

				/* ─── Vital Value ─── */
				.vital-value-container {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					min-height: 0;
				}

				.vital-value {
					font-size: 108px;
					font-weight: 800;
					line-height: 1;
					font-variant-numeric: tabular-nums;
					letter-spacing: -0.02em;
				}

				.vital-range {
					font-size: 15px;
					font-weight: 400;
					text-align: right;
					flex-shrink: 0;
					padding-top: 2px;
				}

				/* ─── BP Display ─── */
				.bp-display {
					display: flex;
					align-items: baseline;
					gap: 2px;
					position: relative;
				}

				.bp-separator {
					font-size: 72px;
					font-weight: 300;
					color: rgba(251,146,60,0.3);
					line-height: 1;
				}

				.bp-dia-value {
					font-size: 78px;
					font-weight: 700;
					line-height: 1;
					font-variant-numeric: tabular-nums;
				}

				.bp-labels {
					display: flex;
					flex-direction: column;
					margin-left: 10px;
					gap: 8px;
				}

				.bp-sys-label, .bp-dia-label {
					font-size: 14px;
					font-weight: 600;
					color: rgba(251,146,60,0.4);
					letter-spacing: 0.1em;
				}

				/* ─── Waiting State ─── */
				.vital-waiting {
					display: flex;
					align-items: center;
					justify-content: center;
					position: relative;
				}

				.waiting-text {
					font-size: 72px;
					font-weight: 300;
					color: #334155;
					letter-spacing: 4px;
				}

				.pulse-ring {
					position: absolute;
					width: 60px;
					height: 60px;
					border-radius: 50%;
					border: 2px solid rgba(34,197,94,0.2);
					animation: pulse-expand 2s ease-out infinite;
				}

				.spo2-ring {
					border-color: rgba(56,189,248,0.2);
				}

				.bp-ring {
					border-color: rgba(251,146,60,0.2);
				}

				/* ─── Action Bar ─── */
				.action-bar {
					display: flex;
					gap: 10px;
					padding: 12px 0 20px;
					flex-shrink: 0;
				}

				.action-btn {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 10px;
					padding: 18px;
					border: none;
					border-radius: 10px;
					font-family: 'Inter', sans-serif;
					font-size: 21px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					letter-spacing: 0.02em;
				}

				.btn-icon {
					width: 27px;
					height: 27px;
				}

				.calibrate-btn {
					background: rgba(56,189,248,0.12);
					color: #38bdf8;
					border: 1px solid rgba(56,189,248,0.2);
				}

				.calibrate-btn:hover {
					background: rgba(56,189,248,0.2);
				}

				.calibrate-btn:active {
					transform: scale(0.98);
				}

				.reset-btn {
					background: rgba(239,68,68,0.1);
					color: #f87171;
					border: 1px solid rgba(239,68,68,0.2);
				}

				.reset-btn:hover {
					background: rgba(239,68,68,0.18);
				}

				.reset-btn:active {
					transform: scale(0.98);
				}

				/* ─── Modal Overlay ─── */
				.modal-overlay {
					position: fixed;
					inset: 0;
					background: rgba(0,0,0,0.75);
					backdrop-filter: blur(8px);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 100;
					padding: 20px;
				}

				.modal-card {
					background: #1e293b;
					border-radius: 16px;
					padding: 32px;
					width: 100%;
					max-width: 400px;
					text-align: center;
					border: 1px solid rgba(255,255,255,0.06);
					box-shadow: 0 24px 48px rgba(0,0,0,0.4);
				}

				.modal-icon-container {
					width: 56px;
					height: 56px;
					border-radius: 14px;
					display: flex;
					align-items: center;
					justify-content: center;
					margin: 0 auto 16px;
					background: rgba(56,189,248,0.12);
				}

				.modal-icon {
					width: 28px;
					height: 28px;
				}

				.calib-icon {
					color: #38bdf8;
				}

				.error-icon-bg {
					background: rgba(239,68,68,0.12);
				}
				.error-icon {
					color: #ef4444;
				}

				.alarm-icon-bg {
					background: rgba(251,191,36,0.12);
				}
				.alarm-icon {
					color: #fbbf24;
				}

				.modal-title {
					font-size: 20px;
					font-weight: 700;
					color: #f1f5f9;
					margin-bottom: 8px;
				}

				.error-title { color: #f87171; }
				.alarm-title { color: #fbbf24; }

				.modal-desc {
					font-size: 14px;
					color: #94a3b8;
					line-height: 1.5;
					margin-bottom: 24px;
				}

				.modal-btn {
					padding: 12px 28px;
					font-family: 'Inter', sans-serif;
					font-size: 14px;
					font-weight: 600;
					border: none;
					border-radius: 8px;
					cursor: pointer;
					transition: all 0.2s ease;
				}

				.cancel-btn {
					background: rgba(255,255,255,0.06);
					color: #94a3b8;
					border: 1px solid rgba(255,255,255,0.08);
				}
				.cancel-btn:hover {
					background: rgba(255,255,255,0.1);
				}

				.error-btn {
					background: rgba(239,68,68,0.15);
					color: #f87171;
					border: 1px solid rgba(239,68,68,0.2);
				}
				.error-btn:hover {
					background: rgba(239,68,68,0.25);
				}

				.alarm-btn {
					background: rgba(251,191,36,0.15);
					color: #fbbf24;
					border: 1px solid rgba(251,191,36,0.2);
				}
				.alarm-btn:hover {
					background: rgba(251,191,36,0.25);
				}

				/* ─── Progress Bar ─── */
				.progress-track {
					width: 100%;
					height: 6px;
					background: rgba(255,255,255,0.06);
					border-radius: 3px;
					overflow: hidden;
					margin-bottom: 8px;
				}

				.progress-fill {
					height: 100%;
					background: linear-gradient(90deg, #38bdf8, #22d3ee);
					border-radius: 3px;
					transition: width 0.4s ease;
				}

				.progress-success {
					background: linear-gradient(90deg, #22c55e, #4ade80);
				}

				.progress-waiting {
					background: linear-gradient(90deg, #fbbf24, #f59e0b);
				}

				.modal-status-text {
					font-size: 15px;
					font-weight: 600;
					margin-bottom: 20px;
					letter-spacing: 0.02em;
				}

				.status-warning { color: #fbbf24; }
				.status-active { color: #38bdf8; }
				.status-success { color: #22c55e; }
				.status-error { color: #ef4444; }

				.icon-warning { background: rgba(251,191,36,0.12); }
				.icon-success { background: rgba(34,197,94,0.12); }

				.progress-text {
					font-size: 28px;
					font-weight: 800;
					color: #38bdf8;
					font-variant-numeric: tabular-nums;
					margin-bottom: 20px;
					display: block;
				}

				/* ─── Animations ─── */
				@keyframes pulse-expand {
					0% {
						transform: scale(0.8);
						opacity: 0.6;
					}
					100% {
						transform: scale(1.6);
						opacity: 0;
					}
				}

				@keyframes blink {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.3; }
				}
			`}</style>
		</>
	);
}
