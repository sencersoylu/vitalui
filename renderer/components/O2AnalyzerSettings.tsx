import React, { useState, useEffect } from 'react';
import { X, Settings, Zap, AlertTriangle, RotateCcw, Save, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { NumericKeypad } from './NumericKeypad';
import { Chamber, updateAlarmLevel } from '../api/chambers';
import { useCalibration, useCalibrationPoints } from '../hooks/useCalibration';
import { useDashboardStore } from '../store';
import { cn } from './utils';

interface O2AnalyzerSettingsProps {
	isOpen: boolean;
	onClose: () => void;
	chamber: Chamber;
	onUpdate?: () => void;
}

export function O2AnalyzerSettings({
	isOpen,
	onClose,
	chamber,
	onUpdate,
}: O2AnalyzerSettingsProps) {
	const { darkMode } = useDashboardStore();
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [password, setPassword] = useState('');
	const [showKeypad, setShowKeypad] = useState(true);
	const [calibrationLevel, setCalibrationLevel] = useState(21);
	const [alarmLevel, setAlarmLevel] = useState(chamber.alarmLevelHigh);
	const [savingAlarmLevel, setSavingAlarmLevel] = useState(false);
	const [changingPassword, setChangingPassword] = useState(false);
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordStep, setPasswordStep] = useState<'new' | 'confirm'>('new');

	const {
		calibrating,
		error: calibrationError,
		calibrate,
		recordSensorChanged,
	} = useCalibration();

	const {
		calibrationPoints,
		loading: calibrationPointsLoading,
		refetch: refetchCalibrationPoints,
	} = useCalibrationPoints(chamber.id);

	const DEFAULT_PASSWORD = '1234';

	// Get stored password from localStorage
	const getStoredPassword = () => {
		if (typeof window === 'undefined') return DEFAULT_PASSWORD;
		return localStorage.getItem('o2-settings-password') || DEFAULT_PASSWORD;
	};

	const handlePasswordSubmit = () => {
		if (password === getStoredPassword()) {
			setIsAuthenticated(true);
			setShowKeypad(false);
			setPassword('');
		} else {
			setPassword('');
			toast.error('Wrong password! Please try again.', {
				duration: 3000,
				position: 'top-center',
			});
		}
	};

	const handleNumberPress = (number: string) => {
		if (password.length < 10) {
			setPassword((prev) => prev + number);
		}
	};

	const handleBackspace = () => {
		setPassword((prev) => prev.slice(0, -1));
	};

	const handleClear = () => {
		setPassword('');
	};

	const handleCalibrate = async () => {
		const success = await calibrate(chamber.id, calibrationLevel);
		if (success) {
			toast.success(
				`${chamber.name} calibration started! Level: ${calibrationLevel}%`,
				{ duration: 4000, position: 'top-center' }
			);
		} else {
			toast.error(
				`Calibration failed: ${calibrationError || 'Unknown error'}`,
				{ duration: 4000, position: 'top-center' }
			);
		}
	};

	const handleSensorChanged = async () => {
		const success = await recordSensorChanged(chamber.id);
		if (success) {
			toast.success(`${chamber.name} sensor change recorded!`, {
				duration: 4000,
				position: 'top-center',
			});
		} else {
			toast.error(
				`Sensor change recording failed: ${calibrationError || 'Unknown error'}`,
				{ duration: 4000, position: 'top-center' }
			);
		}
	};

	const handleSaveAlarmLevel = async () => {
		setSavingAlarmLevel(true);
		try {
			const response = await updateAlarmLevel(chamber.id, alarmLevel);
			toast.success(
				`${chamber.name} alarm level successfully updated: ${alarmLevel}%`,
				{ duration: 4000, position: 'top-center' }
			);
			if (onUpdate) onUpdate();
		} catch (error: any) {
			const errorMessage =
				error.response?.data?.message || error.message || 'Unknown error';
			toast.error(`Alarm level could not be updated: ${errorMessage}`, {
				duration: 4000,
				position: 'top-center',
			});
		} finally {
			setSavingAlarmLevel(false);
		}
	};

	const handleChangePasswordPress = (num: string) => {
		if (passwordStep === 'new') {
			if (newPassword.length < 10) setNewPassword((prev) => prev + num);
		} else {
			if (confirmPassword.length < 10) setConfirmPassword((prev) => prev + num);
		}
	};

	const handleChangePasswordBackspace = () => {
		if (passwordStep === 'new') {
			setNewPassword((prev) => prev.slice(0, -1));
		} else {
			setConfirmPassword((prev) => prev.slice(0, -1));
		}
	};

	const handleChangePasswordClear = () => {
		if (passwordStep === 'new') setNewPassword('');
		else setConfirmPassword('');
	};

	const handleChangePasswordSubmit = () => {
		if (passwordStep === 'new') {
			if (newPassword.length < 4) {
				toast.error('Password must be at least 4 digits', { duration: 3000, position: 'top-center' });
				return;
			}
			setPasswordStep('confirm');
		} else {
			if (newPassword === confirmPassword) {
				localStorage.setItem('o2-settings-password', newPassword);
				toast.success('Password changed successfully!', { duration: 3000, position: 'top-center' });
				setChangingPassword(false);
				setNewPassword('');
				setConfirmPassword('');
				setPasswordStep('new');
			} else {
				toast.error('Passwords do not match!', { duration: 3000, position: 'top-center' });
				setConfirmPassword('');
			}
		}
	};

	const handleCancelChangePassword = () => {
		setChangingPassword(false);
		setNewPassword('');
		setConfirmPassword('');
		setPasswordStep('new');
	};

	const handleClose = () => {
		setIsAuthenticated(false);
		setPassword('');
		setShowKeypad(false);
		setChangingPassword(false);
		setNewPassword('');
		setConfirmPassword('');
		setPasswordStep('new');
		onClose();
	};

	if (!isOpen) return null;

	// Shared styles
	const cardBg = darkMode
		? 'bg-slate-800/90 backdrop-blur-xl border border-white/10'
		: 'bg-white/90 backdrop-blur-xl border border-white/60';
	const sectionBg = darkMode ? 'bg-white/5 border border-white/10' : 'bg-slate-50 border border-slate-200';
	const labelColor = darkMode ? 'text-slate-300' : 'text-slate-600';
	const headingColor = darkMode ? 'text-white' : 'text-slate-800';
	const subtextColor = darkMode ? 'text-slate-400' : 'text-slate-500';
	const sliderTrack = darkMode ? 'bg-slate-700' : 'bg-slate-200';

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
			<div className={cn(
				'rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-fade-up',
				cardBg
			)}>
				{!isAuthenticated ? (
					/* ==================== PASSWORD SCREEN ==================== */
					<div>
						{/* Header */}
						<div className="text-center mb-6">
							<div className={cn(
								'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
								darkMode ? 'bg-blue-500/20' : 'bg-blue-50'
							)}>
								<Lock className={cn('w-8 h-8', darkMode ? 'text-blue-400' : 'text-blue-600')} />
							</div>
							<h2 className={cn('text-xl font-bold mb-1', headingColor)}>
								{chamber.name} Settings
							</h2>
							<p className={subtextColor}>
								Enter password to access settings
							</p>
						</div>

						{/* Password + Keypad */}
						<div className="flex gap-6 items-center justify-center">
							{/* Left: Password Display */}
							<div className="flex flex-col items-center">
								<div className={cn(
									'rounded-2xl p-4 text-center mb-4 min-w-[250px]',
									sectionBg
								)}>
									<div className={cn(
										'text-2xl font-mono tracking-[0.3em]',
										darkMode ? 'text-blue-300' : 'text-blue-600'
									)}>
										{password.replace(/./g, '●') || '····'}
									</div>
								</div>
								<div className="flex flex-col gap-2 w-full">
									{password.length > 0 && (
										<button
											onClick={handlePasswordSubmit}
											className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all font-medium text-sm active:scale-[0.98]">
											Enter
										</button>
									)}
									<button
										onClick={handleClose}
										className={cn(
											'w-full px-4 py-2.5 rounded-xl transition-all font-medium text-sm active:scale-[0.98]',
											darkMode
												? 'bg-white/10 hover:bg-white/20 text-slate-300'
												: 'bg-slate-200 hover:bg-slate-300 text-slate-700'
										)}>
										Cancel
									</button>
								</div>
							</div>

							{/* Right: Numeric Keypad */}
							<div className={cn('rounded-2xl p-4', sectionBg)}>
								<div className="grid grid-cols-3 gap-2">
									{['1','2','3','4','5','6','7','8','9'].map((num) => (
										<button
											key={num}
											onClick={() => handleNumberPress(num)}
											className={cn(
												'w-14 h-14 rounded-xl text-lg font-bold transition-all active:scale-95',
												darkMode
													? 'bg-white/10 hover:bg-white/20 text-white'
													: 'bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
											)}>
											{num}
										</button>
									))}
									<button
										onClick={handleClear}
										className={cn(
											'w-14 h-14 rounded-xl text-xs font-bold transition-all active:scale-95',
											darkMode
												? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
												: 'bg-red-50 hover:bg-red-100 text-red-600'
										)}>
										Clear
									</button>
									<button
										onClick={() => handleNumberPress('0')}
										className={cn(
											'w-14 h-14 rounded-xl text-lg font-bold transition-all active:scale-95',
											darkMode
												? 'bg-white/10 hover:bg-white/20 text-white'
												: 'bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
										)}>
										0
									</button>
									<button
										onClick={handleBackspace}
										className={cn(
											'w-14 h-14 rounded-xl text-xs font-bold transition-all active:scale-95',
											darkMode
												? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
												: 'bg-amber-50 hover:bg-amber-100 text-amber-600'
										)}>
										Delete
									</button>
								</div>
							</div>
						</div>
					</div>
				) : changingPassword ? (
					/* ==================== CHANGE PASSWORD SCREEN ==================== */
					<div>
						<div className="text-center mb-6">
							<div className={cn(
								'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
								darkMode ? 'bg-amber-500/20' : 'bg-amber-50'
							)}>
								<Lock className={cn('w-8 h-8', darkMode ? 'text-amber-400' : 'text-amber-600')} />
							</div>
							<h2 className={cn('text-xl font-bold mb-1', headingColor)}>
								{passwordStep === 'new' ? 'Enter New Password' : 'Confirm Password'}
							</h2>
							<div className="flex items-center justify-center gap-2 mt-2">
								<div className={cn('w-2 h-2 rounded-full', passwordStep === 'new' ? 'bg-amber-500' : 'bg-amber-500/30')} />
								<div className={cn('w-2 h-2 rounded-full', passwordStep === 'confirm' ? 'bg-amber-500' : 'bg-amber-500/30')} />
							</div>
						</div>

						<div className="flex gap-6 items-center justify-center">
							{/* Left: Password display */}
							<div className="flex flex-col items-center">
								<div className={cn(
									'rounded-2xl p-4 text-center mb-4 min-w-[250px]',
									sectionBg
								)}>
									<div className={cn(
										'text-2xl font-mono tracking-[0.3em]',
										darkMode ? 'text-amber-300' : 'text-amber-600'
									)}>
										{(passwordStep === 'new' ? newPassword : confirmPassword).replace(/./g, '●') || '····'}
									</div>
								</div>
								<div className="flex flex-col gap-2 w-full">
									{(passwordStep === 'new' ? newPassword : confirmPassword).length > 0 && (
										<button
											onClick={handleChangePasswordSubmit}
											className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all font-medium text-sm active:scale-[0.98]">
											{passwordStep === 'new' ? 'Next' : 'Save Password'}
										</button>
									)}
									<button
										onClick={handleCancelChangePassword}
										className={cn(
											'w-full px-4 py-2.5 rounded-xl transition-all font-medium text-sm active:scale-[0.98]',
											darkMode
												? 'bg-white/10 hover:bg-white/20 text-slate-300'
												: 'bg-slate-200 hover:bg-slate-300 text-slate-700'
										)}>
										Cancel
									</button>
								</div>
							</div>

							{/* Right: Keypad */}
							<div className={cn('rounded-2xl p-4', sectionBg)}>
								<div className="grid grid-cols-3 gap-2">
									{['1','2','3','4','5','6','7','8','9'].map((num) => (
										<button
											key={num}
											onClick={() => handleChangePasswordPress(num)}
											className={cn(
												'w-14 h-14 rounded-xl text-lg font-bold transition-all active:scale-95',
												darkMode
													? 'bg-white/10 hover:bg-white/20 text-white'
													: 'bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
											)}>
											{num}
										</button>
									))}
									<button
										onClick={handleChangePasswordClear}
										className={cn(
											'w-14 h-14 rounded-xl text-xs font-bold transition-all active:scale-95',
											darkMode
												? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
												: 'bg-red-50 hover:bg-red-100 text-red-600'
										)}>
										Clear
									</button>
									<button
										onClick={() => handleChangePasswordPress('0')}
										className={cn(
											'w-14 h-14 rounded-xl text-lg font-bold transition-all active:scale-95',
											darkMode
												? 'bg-white/10 hover:bg-white/20 text-white'
												: 'bg-white hover:bg-slate-100 text-slate-800 shadow-sm'
										)}>
										0
									</button>
									<button
										onClick={handleChangePasswordBackspace}
										className={cn(
											'w-14 h-14 rounded-xl text-xs font-bold transition-all active:scale-95',
											darkMode
												? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
												: 'bg-amber-50 hover:bg-amber-100 text-amber-600'
										)}>
										Delete
									</button>
								</div>
							</div>
						</div>
					</div>
				) : (
					/* ==================== SETTINGS SCREEN ==================== */
					<div>
						{/* Header */}
						<div className="flex justify-between items-center mb-6">
							<div className="flex items-center gap-3">
								<div className={cn(
									'w-10 h-10 rounded-xl flex items-center justify-center',
									darkMode ? 'bg-blue-500/20' : 'bg-blue-50'
								)}>
									<Settings className={cn('w-5 h-5', darkMode ? 'text-blue-400' : 'text-blue-600')} />
								</div>
								<h2 className={cn('text-xl font-bold', headingColor)}>
									{chamber.name} Settings
								</h2>
							</div>
							<button
								onClick={handleClose}
								className={cn(
									'p-2 rounded-xl transition-all hover:scale-105',
									darkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'
								)}>
								<X className={cn('w-5 h-5', subtextColor)} />
							</button>
						</div>

						{/* Sections Grid */}
						<div className="grid grid-cols-2 gap-4">
							{/* ---- Calibration ---- */}
							<div className={cn('rounded-2xl p-5 flex flex-col', sectionBg)}>
								<div className="flex items-center gap-2 mb-4">
									<Zap className={cn('w-5 h-5', darkMode ? 'text-blue-400' : 'text-blue-600')} />
									<h3 className={cn('text-base font-bold', darkMode ? 'text-blue-300' : 'text-blue-700')}>
										Calibration
									</h3>
								</div>

								{/* Current Calibration Info */}
								{calibrationPoints && (
									<div className={cn(
										'rounded-xl p-3 mb-4 text-sm',
										darkMode ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
									)}>
										Last: {new Date(calibrationPoints.calibrationDate).toLocaleDateString('en-US')}
									</div>
								)}

								{/* Calibration Level Slider */}
								<div className="mb-4">
									<div className="flex justify-between items-center mb-2">
										<span className={cn('text-sm font-medium', labelColor)}>Level</span>
										<span className={cn('text-lg font-bold', darkMode ? 'text-blue-300' : 'text-blue-600')}>
											{calibrationLevel}%
										</span>
									</div>
									<input
										type="range"
										min="0"
										max="100"
										value={calibrationLevel}
										onChange={(e) => setCalibrationLevel(Number(e.target.value))}
										className={cn('w-full h-2 rounded-full appearance-none cursor-pointer slider', sliderTrack)}
									/>
									<div className="flex justify-between text-xs mt-1">
										<span className={subtextColor}>0%</span>
										<span className={subtextColor}>100%</span>
									</div>
								</div>

								<button
									onClick={handleCalibrate}
									disabled={calibrating}
									className={cn(
										'w-full mt-auto py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
										'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
									)}>
									<Zap className="w-4 h-4" />
									{calibrating ? 'Calibrating...' : 'Calibrate'}
								</button>
							</div>

							{/* ---- Alarm Settings ---- */}
							<div className={cn('rounded-2xl p-5 flex flex-col', sectionBg)}>
								<div className="flex items-center gap-2 mb-4">
									<AlertTriangle className={cn('w-5 h-5', darkMode ? 'text-red-400' : 'text-red-600')} />
									<h3 className={cn('text-base font-bold', darkMode ? 'text-red-300' : 'text-red-700')}>
										Alarm Settings
									</h3>
								</div>

								{/* Alarm Level Slider */}
								<div className="mb-4">
									<div className="flex justify-between items-center mb-2">
										<span className={cn('text-sm font-medium', labelColor)}>High Level</span>
										<span className={cn('text-lg font-bold', darkMode ? 'text-red-300' : 'text-red-600')}>
											{alarmLevel}%
										</span>
									</div>
									<input
										type="range"
										min="0"
										max="100"
										value={alarmLevel}
										onChange={(e) => setAlarmLevel(Number(e.target.value))}
										className={cn('w-full h-2 rounded-full appearance-none cursor-pointer slider-red', sliderTrack)}
									/>
									<div className="flex justify-between text-xs mt-1">
										<span className={subtextColor}>0%</span>
										<span className={subtextColor}>100%</span>
									</div>
								</div>

								<button
									onClick={handleSaveAlarmLevel}
									disabled={savingAlarmLevel || alarmLevel === chamber.alarmLevelHigh}
									className={cn(
										'w-full mt-auto py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
										'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
									)}>
									<Save className="w-4 h-4" />
									{savingAlarmLevel
										? 'Saving...'
										: alarmLevel === chamber.alarmLevelHigh
										? 'No Changes'
										: 'Save'}
								</button>
							</div>
						</div>

						{/* ---- Sensor Management ---- */}
						<div className={cn('rounded-2xl p-5 mt-4', sectionBg)}>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<RotateCcw className={cn('w-5 h-5', darkMode ? 'text-emerald-400' : 'text-emerald-600')} />
									<div>
										<h3 className={cn('text-base font-bold', darkMode ? 'text-emerald-300' : 'text-emerald-700')}>
											Sensor Management
										</h3>
										<p className={cn('text-xs', subtextColor)}>
											Last change: {chamber.lastSensorChange
												? new Date(chamber.lastSensorChange).toLocaleDateString('en-US') + ' ' + new Date(chamber.lastSensorChange).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
												: 'No record'}
										</p>
									</div>
								</div>
								<button
									onClick={handleSensorChanged}
									className={cn(
										'px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all active:scale-[0.98]',
										'bg-emerald-600 hover:bg-emerald-700 text-white'
									)}>
									<RotateCcw className="w-4 h-4" />
									Sensor Changed
								</button>
							</div>
						</div>

						{/* Bottom Buttons */}
						<div className="flex gap-3 mt-4">
							<button
								onClick={() => setChangingPassword(true)}
								className={cn(
									'flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
									darkMode
										? 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10'
										: 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
								)}>
								<Lock className="w-4 h-4" />
								Change Password
							</button>
							<button
								onClick={handleClose}
								className={cn(
									'flex-1 py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.98]',
									darkMode
										? 'bg-white/10 hover:bg-white/20 text-slate-300'
										: 'bg-slate-200 hover:bg-slate-300 text-slate-700'
								)}>
								Close
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Slider thumb styles */}
			<style jsx>{`
				.slider::-webkit-slider-thumb {
					appearance: none;
					height: 24px;
					width: 24px;
					border-radius: 50%;
					background: #3b82f6;
					cursor: pointer;
					box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
					border: 3px solid white;
				}
				.slider::-moz-range-thumb {
					height: 24px;
					width: 24px;
					border-radius: 50%;
					background: #3b82f6;
					cursor: pointer;
					box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
					border: 3px solid white;
				}
				.slider-red::-webkit-slider-thumb {
					appearance: none;
					height: 24px;
					width: 24px;
					border-radius: 50%;
					background: #dc2626;
					cursor: pointer;
					box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
					border: 3px solid white;
				}
				.slider-red::-moz-range-thumb {
					height: 24px;
					width: 24px;
					border-radius: 50%;
					background: #dc2626;
					cursor: pointer;
					box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
					border: 3px solid white;
				}
			`}</style>
		</div>
	);
}
