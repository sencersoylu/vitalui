import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';

const EMPTY_VITALS = { heartRate: '', oxygenSaturation: '', bloodPressure: '' };
const NO_FINGER_TIMEOUT = 60000;

const CALIBRATION_MESSAGES: Record<string, string> = {
	waiting: 'Preparing sensor...',
	no_finger: 'Place your finger on the sensor',
	measuring: 'Keep your finger steady',
	success: 'Calibration complete!',
	error: 'Calibration error',
};

export default function HomePage() {
	const [vitalSigns, setVitalSigns] = useState(EMPTY_VITALS);
	const [connected, setConnected] = useState(false);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [showCalibrationModal, setShowCalibrationModal] = useState(false);
	const [calibrationProgress, setCalibrationProgress] = useState(0);
	const [calibrationStatus, setCalibrationStatus] = useState('waiting');
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [showSeatAlarm, setShowSeatAlarm] = useState(false);
	const [seatNumber, setSeatNumber] = useState('');

	const [darkMode, setDarkMode] = useState(true);

	const socketRef = useRef(null);
	const timeInterval = useRef(null);
	const noFingerTimer = useRef(null);

	const clearNoFingerTimer = () => {
		if (noFingerTimer.current) {
			clearTimeout(noFingerTimer.current);
			noFingerTimer.current = null;
		}
	};

	const startNoFingerTimer = () => {
		if (!noFingerTimer.current) {
			noFingerTimer.current = setTimeout(() => {
				setVitalSigns(EMPTY_VITALS);
				noFingerTimer.current = null;
			}, NO_FINGER_TIMEOUT);
		}
	};

	const handleVitalStatus = (st: number, hr: string, spo2: string, sys: string, dia: string) => {
		if (st >= 1 && st <= 6) {
			clearNoFingerTimer();
			setVitalSigns({ heartRate: hr, oxygenSaturation: spo2, bloodPressure: `${sys}/${dia}` });
		} else if (st === 0) {
			startNoFingerTimer();
		}
	};

	const handleCalibrationProgress = (status: number, progress: number) => {
		setShowCalibrationModal(true);
		setCalibrationProgress(progress);
		if (status === 0) setCalibrationStatus('no_finger');
		else if (status === 2) setCalibrationStatus('success');
		else if (status === 5) setCalibrationStatus('error');
		else setCalibrationStatus('measuring');
	};

	useEffect(() => {
		const socket = io('http://localhost:4000', {
			transports: ['websocket', 'polling'],
			extraHeaders: { 'Access-Control-Allow-Origin': 'http://localhost:8888' },
		});
		socketRef.current = socket;

		socket.on('connect', () => setConnected(true));
		socket.on('disconnect', () => setConnected(false));

		socket.on('serialData', (data) => {
			const msg = data.data;

			// Calibration progress - new format: PRO:status,progress
			if (msg.includes('PRO:')) {
				const parts = msg.split(':')[1].split(',');
				handleCalibrationProgress(parseInt(parts[0]), parseInt(parts.length > 1 ? parts[1] : parts[0]));
			}
			// Calibration progress - old format: [PARMAK YOK] progress = %0
			else if (msg.includes('progress = %')) {
				const progMatch = msg.match(/progress\s*=\s*%(\d+)/);
				const progress = progMatch ? parseInt(progMatch[1]) : 0;
				setShowCalibrationModal(true);
				setCalibrationProgress(progress);
				if (msg.includes('PARMAK YOK')) setCalibrationStatus('no_finger');
				else if (msg.includes('OLCULUYOR')) setCalibrationStatus('measuring');
				else if (msg.includes('BASARILI')) setCalibrationStatus('success');
				else if (msg.includes('HATA')) setCalibrationStatus('error');
				else setCalibrationStatus('measuring');
			}
			// Calibration result
			else if (msg.includes('OK:CAL') || msg.includes('Calibration success')) {
				setCalibrationStatus('success');
				setCalibrationProgress(100);
				setTimeout(() => setShowCalibrationModal(false), 1500);
			}
			else if (msg.includes('ERR:CAL') || msg.includes('Calibration failed')) {
				setShowCalibrationModal(false);
				setErrorMessage('Calibration failed. Please try again.');
				setShowErrorModal(true);
				setTimeout(() => setShowErrorModal(false), 3000);
			}
			// Seat alarm
			else if (msg.includes('SEAT_ALARM')) {
				setShowSeatAlarm(true);
				setSeatNumber(msg.split(':')[1]);
			}
			// Vital signs - new format: DATA:status,sys,dia,hr,spo2
			else if (msg.includes('DATA:')) {
				const d = msg.split(':')[1].split(',');
				handleVitalStatus(parseInt(d[0]), d[3], d[4], d[1], d[2]);
			}
			// Vital signs - old format: st = 2, sys = 115, dia = 73, hr = 66 spo2 = 99.10
			else if (msg.includes('st = ')) {
				const m = msg.match(/st\s*=\s*(\d+).*sys\s*=\s*(\d+).*dia\s*=\s*(\d+).*hr\s*=\s*(\d+).*spo2\s*=\s*([\d.]+)/);
				if (m) handleVitalStatus(parseInt(m[1]), m[4], m[5], m[2], m[3]);
			}
		});

		socket.on('vitalSigns', (data) => setVitalSigns(data));

		socket.on('calibrationProgress', (data) => {
			setCalibrationProgress(data.progress);
			setCalibrationStatus(data.status);
			if (data.progress === 100) {
				setTimeout(() => setShowCalibrationModal(false), 2000);
			}
		});

		const updateClock = () => {
			const now = new Date();
			const dd = String(now.getDate()).padStart(2, '0');
			const mm = String(now.getMonth() + 1).padStart(2, '0');
			const hh = String(now.getHours()).padStart(2, '0');
			const min = String(now.getMinutes()).padStart(2, '0');
			setDate(`${dd}.${mm}.${now.getFullYear()}`);
			setTime(`${hh}:${min}`);
		};

		updateClock();
		timeInterval.current = setInterval(updateClock, 1000);

		return () => {
			socket.disconnect();
			if (timeInterval.current) clearInterval(timeInterval.current);
			clearNoFingerTimer();
		};
	}, []);

	const startCalibration = () => {
		setShowCalibrationModal(true);
		setCalibrationProgress(0);
		setCalibrationStatus('waiting');
		socketRef.current?.emit('serialSend', 'C');
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

			<div className={`monitor-root ${darkMode ? '' : 'light'}`}>
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
						<button className="theme-toggle" onClick={() => setDarkMode(prev => !prev)}>
							{darkMode ? (
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="theme-icon">
									<circle cx="12" cy="12" r="5" />
									<line x1="12" y1="1" x2="12" y2="3" />
									<line x1="12" y1="21" x2="12" y2="23" />
									<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
									<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
									<line x1="1" y1="12" x2="3" y2="12" />
									<line x1="21" y1="12" x2="23" y2="12" />
									<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
									<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
								</svg>
							) : (
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="theme-icon">
									<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
								</svg>
							)}
						</button>
						<div className="status-time-info">
							<span className="status-time">{time || '--:--'}</span>
							<span className="status-date">{date || '--.--.----'}</span>
						</div>
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
					<button className="action-btn reset-btn" onClick={() => setVitalSigns(EMPTY_VITALS)}>
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
								{CALIBRATION_MESSAGES[calibrationStatus] || 'Calibrating...'}
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
									socketRef.current?.emit('cancelCalibration');
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
					overflow: hidden;
				}
			`}</style>
			<style jsx>{`
				/* ─── Theme Variables ─── */
				.monitor-root {
					--bg: #0b1120;
					--text: #e2e8f0;
					--text-muted: #94a3b8;
					--text-dim: #64748b;
					--text-heading: #cbd5e1;
					--border: rgba(255,255,255,0.08);
					--waiting-text: #334155;
					--card-opacity: 0.08;
					--card-opacity-end: 0.02;
					--card-border-opacity: 0.15;
					--accent-opacity: 0.5;
					--range-opacity: 0.4;
					--modal-bg: #1e293b;
					--modal-border: rgba(255,255,255,0.06);
					--modal-title: #f1f5f9;
					--modal-shadow: rgba(0,0,0,0.4);
					--cancel-bg: rgba(255,255,255,0.06);
					--cancel-bg-hover: rgba(255,255,255,0.1);
					--cancel-border: rgba(255,255,255,0.08);
					--progress-track: rgba(255,255,255,0.06);
					--toggle-bg: rgba(255,255,255,0.06);
					--toggle-border: rgba(255,255,255,0.1);
					--toggle-color: #94a3b8;

					/* HR */
					--hr-value: #4ade80;
					/* SpO2 */
					--spo2-value: #7dd3fc;
					/* BP */
					--bp-value: #fdba74;
				}

				.monitor-root.light {
					--bg: #f1f5f9;
					--text: #1e293b;
					--text-muted: #64748b;
					--text-dim: #94a3b8;
					--text-heading: #334155;
					--border: rgba(0,0,0,0.08);
					--waiting-text: #cbd5e1;
					--card-opacity: 0.06;
					--card-opacity-end: 0.02;
					--card-border-opacity: 0.2;
					--accent-opacity: 0.7;
					--range-opacity: 0.5;
					--modal-bg: #ffffff;
					--modal-border: rgba(0,0,0,0.08);
					--modal-title: #0f172a;
					--modal-shadow: rgba(0,0,0,0.15);
					--cancel-bg: rgba(0,0,0,0.04);
					--cancel-bg-hover: rgba(0,0,0,0.08);
					--cancel-border: rgba(0,0,0,0.1);
					--progress-track: rgba(0,0,0,0.06);
					--toggle-bg: rgba(0,0,0,0.04);
					--toggle-border: rgba(0,0,0,0.1);
					--toggle-color: #475569;

					/* HR - darker for light bg */
					--hr-value: #16a34a;
					/* SpO2 */
					--spo2-value: #0284c7;
					/* BP */
					--bp-value: #ea580c;
				}

				.monitor-root {
					width: 100%;
					height: 100vh;
					display: flex;
					flex-direction: column;
					background-color: var(--bg);
					font-family: 'Inter', -apple-system, sans-serif;
					color: var(--text);
					padding: 0 clamp(8px, 2vw, 16px);
					overflow: hidden;
					transition: background-color 0.3s ease, color 0.3s ease;
				}

				/* ─── Status Bar ─── */
				.status-bar {
					display: flex;
					align-items: center;
					justify-content: space-between;
					padding: clamp(10px, 3vh, 28px) clamp(6px, 1.5vw, 12px);
					border-bottom: 1px solid var(--border);
					flex-shrink: 0;
				}

				.status-left {
					display: flex;
					align-items: center;
					gap: clamp(6px, 1.5vw, 12px);
				}

				.conn-indicator {
					width: clamp(8px, 1.8vh, 14px);
					height: clamp(8px, 1.8vh, 14px);
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
					font-size: clamp(11px, 2vh, 16px);
					font-weight: 500;
					color: var(--text-muted);
					letter-spacing: 0.02em;
				}

				.status-center {
					display: flex;
					align-items: center;
					gap: clamp(6px, 1.2vw, 10px);
				}

				.theme-toggle {
					width: clamp(36px, 5.5vh, 48px);
					height: clamp(36px, 5.5vh, 48px);
					border-radius: 12px;
					border: 1px solid var(--toggle-border);
					background: var(--toggle-bg);
					color: var(--toggle-color);
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 0;
					transition: all 0.2s ease;
				}

				.theme-toggle:hover {
					background: var(--cancel-bg-hover);
				}

				.theme-toggle:active {
					transform: scale(0.95);
				}

				.theme-icon {
					width: clamp(18px, 3vh, 26px);
					height: clamp(18px, 3vh, 26px);
				}

				.status-logo {
					width: clamp(28px, 5.5vh, 44px);
					height: clamp(28px, 5.5vh, 44px);
					opacity: 0.9;
				}

				.status-title {
					font-size: clamp(15px, 3vh, 24px);
					font-weight: 700;
					color: var(--text-heading);
					letter-spacing: 0.02em;
				}

				.status-right {
					display: flex;
					align-items: center;
					gap: clamp(8px, 1.5vw, 14px);
				}

				.status-time-info {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
				}

				.status-time {
					font-size: clamp(18px, 3.5vh, 28px);
					font-weight: 700;
					color: var(--text);
					font-variant-numeric: tabular-nums;
				}

				.status-date {
					font-size: clamp(11px, 2vh, 16px);
					font-weight: 400;
					color: var(--text-dim);
					font-variant-numeric: tabular-nums;
				}

				/* ─── Vitals Container ─── */
				.vitals-container {
					flex: 1;
					display: flex;
					flex-direction: column;
					gap: clamp(28px, 6vh, 56px);
					padding: clamp(8px, 1.5vh, 16px) 0;
					overflow: hidden;
				}

				/* ─── Vital Card ─── */
				.vital-card {
					flex: 1;
					display: flex;
					flex-direction: column;
					border-radius: clamp(8px, 1.5vh, 12px);
					padding: clamp(8px, 1.5vh, 14px) clamp(12px, 2.5vw, 20px);
					position: relative;
					overflow: hidden;
					min-height: 0;
					transition: background 0.3s ease, border-color 0.3s ease;
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
					background: linear-gradient(135deg, rgba(34,197,94,var(--card-opacity)) 0%, rgba(34,197,94,var(--card-opacity-end)) 100%);
					border: 1px solid rgba(34,197,94,var(--card-border-opacity));
				}
				.hr-card::before { background: #22c55e; }
				.hr-card .vital-label,
				.hr-card .vital-icon { color: #22c55e; }
				.hr-card .vital-unit { color: rgba(34,197,94,var(--accent-opacity)); }
				.hr-value { color: var(--hr-value); }
				.hr-card .vital-range { color: rgba(34,197,94,var(--range-opacity)); }

				/* SpO2 Card */
				.spo2-card {
					background: linear-gradient(135deg, rgba(56,189,248,var(--card-opacity)) 0%, rgba(56,189,248,var(--card-opacity-end)) 100%);
					border: 1px solid rgba(56,189,248,var(--card-border-opacity));
				}
				.spo2-card::before { background: #38bdf8; }
				.spo2-card .vital-label,
				.spo2-card .vital-icon { color: #38bdf8; }
				.spo2-card .vital-unit { color: rgba(56,189,248,var(--accent-opacity)); }
				.spo2-value { color: var(--spo2-value); }
				.spo2-card .vital-range { color: rgba(56,189,248,var(--range-opacity)); }

				/* BP Card */
				.bp-card {
					background: linear-gradient(135deg, rgba(251,146,60,var(--card-opacity)) 0%, rgba(251,146,60,var(--card-opacity-end)) 100%);
					border: 1px solid rgba(251,146,60,var(--card-border-opacity));
				}
				.bp-card::before { background: #fb923c; }
				.bp-card .vital-label,
				.bp-card .vital-icon { color: #fb923c; }
				.bp-card .vital-unit { color: rgba(251,146,60,var(--accent-opacity)); }
				.bp-value, .bp-dia-value { color: var(--bp-value); }
				.bp-card .vital-range { color: rgba(251,146,60,var(--range-opacity)); }

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
					width: clamp(18px, 3.3vh, 27px);
					height: clamp(18px, 3.3vh, 27px);
				}

				.vital-label {
					font-size: clamp(14px, 2.6vh, 21px);
					font-weight: 700;
					letter-spacing: 0.08em;
					text-transform: uppercase;
				}

				.vital-unit {
					font-size: clamp(12px, 2.2vh, 18px);
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
					font-size: clamp(48px, 14vh, 108px);
					font-weight: 800;
					line-height: 1;
					font-variant-numeric: tabular-nums;
					letter-spacing: -0.02em;
				}

				.vital-range {
					font-size: clamp(11px, 1.8vh, 15px);
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
					font-size: clamp(32px, 9vh, 72px);
					font-weight: 300;
					color: rgba(251,146,60,0.3);
					line-height: 1;
				}

				.bp-dia-value {
					font-size: clamp(36px, 10vh, 78px);
					font-weight: 700;
					line-height: 1;
					font-variant-numeric: tabular-nums;
				}

				.bp-labels {
					display: flex;
					flex-direction: column;
					margin-left: clamp(6px, 1vw, 10px);
					gap: clamp(4px, 1vh, 8px);
				}

				.bp-sys-label, .bp-dia-label {
					font-size: clamp(10px, 1.7vh, 14px);
					font-weight: 600;
					color: rgba(251,146,60,var(--range-opacity));
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
					font-size: clamp(32px, 9vh, 72px);
					font-weight: 300;
					color: var(--waiting-text);
					letter-spacing: 4px;
				}

				.pulse-ring {
					position: absolute;
					width: clamp(36px, 7.5vh, 60px);
					height: clamp(36px, 7.5vh, 60px);
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
					gap: clamp(6px, 1.2vw, 10px);
					padding: clamp(6px, 1.5vh, 12px) 0 clamp(10px, 2.5vh, 20px);
					flex-shrink: 0;
				}

				.action-btn {
					flex: 1;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: clamp(6px, 1.2vw, 10px);
					padding: clamp(10px, 2.2vh, 18px);
					border: none;
					border-radius: 10px;
					font-family: 'Inter', sans-serif;
					font-size: clamp(14px, 2.6vh, 21px);
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s ease;
					letter-spacing: 0.02em;
				}

				.btn-icon {
					width: clamp(18px, 3.3vh, 27px);
					height: clamp(18px, 3.3vh, 27px);
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

				/* ─── Light theme button adjustments ─── */
				.light .calibrate-btn {
					background: rgba(56,189,248,0.08);
					color: #0284c7;
					border: 1px solid rgba(56,189,248,0.25);
				}
				.light .calibrate-btn:hover {
					background: rgba(56,189,248,0.15);
				}

				.light .reset-btn {
					background: rgba(239,68,68,0.06);
					color: #dc2626;
					border: 1px solid rgba(239,68,68,0.2);
				}
				.light .reset-btn:hover {
					background: rgba(239,68,68,0.12);
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
					background: var(--modal-bg);
					border-radius: 16px;
					padding: 32px;
					width: 100%;
					max-width: 400px;
					text-align: center;
					border: 1px solid var(--modal-border);
					box-shadow: 0 24px 48px var(--modal-shadow);
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
					color: var(--modal-title);
					margin-bottom: 8px;
				}

				.error-title { color: #f87171; }
				.alarm-title { color: #fbbf24; }

				.modal-desc {
					font-size: 14px;
					color: var(--text-muted);
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
					background: var(--cancel-bg);
					color: var(--text-muted);
					border: 1px solid var(--cancel-border);
				}
				.cancel-btn:hover {
					background: var(--cancel-bg-hover);
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
					background: var(--progress-track);
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
					font-size: clamp(18px, 3.5vh, 28px);
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
