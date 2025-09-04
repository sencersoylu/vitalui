import React, { useState, useEffect } from 'react';
import { X, Settings, Zap, AlertTriangle, RotateCcw, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { NumericKeypad } from './NumericKeypad';
import { Chamber, updateAlarmLevel } from '../api/chambers';
import { useCalibration, useCalibrationPoints } from '../hooks/useCalibration';
import ThreePointCalibration from './ThreePointCalibration';

interface O2AnalyzerSettingsProps {
	isOpen: boolean;
	onClose: () => void;
	chamber: Chamber;
}

export function O2AnalyzerSettings({
	isOpen,
	onClose,
	chamber,
}: O2AnalyzerSettingsProps) {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [password, setPassword] = useState('');
	const [showKeypad, setShowKeypad] = useState(true);
	const [calibrationLevel, setCalibrationLevel] = useState(21);
	const [alarmLevel, setAlarmLevel] = useState(chamber.alarmLevelHigh);
	const [activeTab, setActiveTab] = useState<'legacy' | 'threepoint'>(
		'threepoint'
	);
	const [savingAlarmLevel, setSavingAlarmLevel] = useState(false);

	// Backend hooks
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

	const CORRECT_PASSWORD = '1234'; // You can change this as needed

	const handlePasswordSubmit = () => {
		if (password === CORRECT_PASSWORD) {
			setIsAuthenticated(true);
			setShowKeypad(false);
			setPassword('');
		} else {
			// Show error or reset password
			setPassword('');
			toast.error('Wrong password! Please try again.', {
				duration: 3000,
				position: 'top-center',
			});
		}
	};

	const handleNumberPress = (number: string) => {
		if (password.length < 10) {
			// Limit password length
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
				{
					duration: 4000,
					position: 'top-center',
				}
			);
		} else {
			toast.error(
				`Calibration failed: ${calibrationError || 'Unknown error'}`,
				{
					duration: 4000,
					position: 'top-center',
				}
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
				`Sensor change recording failed: ${
					calibrationError || 'Unknown error'
				}`,
				{
					duration: 4000,
					position: 'top-center',
				}
			);
		}
	};

	const handleSaveAlarmLevel = async () => {
		setSavingAlarmLevel(true);
		try {
			const response = await updateAlarmLevel(chamber.id, alarmLevel);
			toast.success(
				`${chamber.name} alarm seviyesi başarıyla güncellendi: ${alarmLevel}%`,
				{
					duration: 4000,
					position: 'top-center',
				}
			);
			console.log('Alarm level updated:', response.data);
		} catch (error: any) {
			console.error('Alarm level update failed:', error);
			const errorMessage =
				error.response?.data?.message || error.message || 'Unknown error';
			toast.error(`Alarm seviyesi güncellenemedi: ${errorMessage}`, {
				duration: 4000,
				position: 'top-center',
			});
		} finally {
			setSavingAlarmLevel(false);
		}
	};

	const handleClose = () => {
		setIsAuthenticated(false);
		setPassword('');
		setShowKeypad(false);
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl">
				{!isAuthenticated ? (
					<div>
						{/* Header */}
						<div className="text-center mb-6">
							<Settings className="w-12 h-12 text-brand-blue mx-auto mb-3" />
							<h2 className="text-xl font-bold text-brand-blue mb-2">
								{chamber.name} Settings
							</h2>
							<p className="text-gray-600 text-sm">
								Enter password to access settings
							</p>
						</div>

						{/* Main Content - Side by Side Layout */}
						<div className="flex gap-6 items-center justify-center">
							{/* Left Side - Password Entry */}
							<div className="flex flex-col items-center">
								{/* Password Display */}
								<div className="mb-4">
									<div className="bg-gray-100 rounded-xl p-3 text-center mb-3 min-w-[250px]">
										<div className="text-xl font-mono tracking-widest text-brand-blue">
											{password.replace(/./g, '●') || 'Enter password...'}
										</div>
									</div>
									<div className="flex flex-col gap-2">
										{password.length > 0 && (
											<button
												onClick={handlePasswordSubmit}
												className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm">
												Enter
											</button>
										)}
										<button
											onClick={handleClose}
											className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm">
											Cancel
										</button>
									</div>
								</div>
							</div>

							{/* Right Side - Numeric Keypad */}
							<div>
								<NumericKeypad
									onNumberPress={handleNumberPress}
									onBackspace={handleBackspace}
									onClear={handleClear}
								/>
							</div>
						</div>
					</div>
				) : (
					<div>
						{/* Settings Header */}
						<div className="flex justify-between items-center mb-8">
							<div className="flex items-center gap-3">
								<Settings className="w-8 h-8 text-brand-blue" />
								<h2 className="text-2xl font-bold text-brand-blue">
									{chamber.name} Settings
								</h2>
							</div>
							<button
								onClick={handleClose}
								className="p-2 hover:bg-gray-100 rounded-full transition-colors">
								<X className="w-6 h-6 text-gray-500" />
							</button>
						</div>

						{/* Calibration Settings */}
						<div className="mb-6">
							<div className="flex items-center gap-3 mb-4">
								<Zap className="w-6 h-6 text-brand-blue" />
								<h3 className="text-xl font-bold text-brand-blue">
									Kalibrasyon Ayarları
								</h3>
							</div>

							{/* Calibration Status */}
							{calibrationPoints && (
								<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
									<h4 className="font-semibold text-green-800 mb-2">
										Mevcut Kalibrasyon
									</h4>
									<div className="text-sm text-green-700 space-y-1">
										<p>0% noktası: {calibrationPoints.raw0}</p>
										<p>21% noktası: {calibrationPoints.raw21}</p>
										<p>100% noktası: {calibrationPoints.raw100}</p>
										<p>
											Son kalibrasyon:{' '}
											{new Date(
												calibrationPoints.calibrationDate
											).toLocaleDateString('tr-TR')}
										</p>
									</div>
								</div>
							)}

							{/* Tab Navigation */}
							<div className="flex bg-gray-100 rounded-lg p-1 mb-4">
								<button
									onClick={() => setActiveTab('threepoint')}
									className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
										activeTab === 'threepoint'
											? 'bg-white text-brand-blue shadow-sm'
											: 'text-gray-600 hover:text-gray-800'
									}`}>
									3 Noktalı Kalibrasyon
								</button>
								<button
									onClick={() => setActiveTab('legacy')}
									className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
										activeTab === 'legacy'
											? 'bg-white text-brand-blue shadow-sm'
											: 'text-gray-600 hover:text-gray-800'
									}`}>
									Tek Nokta (Legacy)
								</button>
							</div>

							{/* Tab Content */}
							{activeTab === 'threepoint' ? (
								<ThreePointCalibration
									chamberId={chamber.id}
									chamberName={chamber.name}
									onCalibrationComplete={refetchCalibrationPoints}
								/>
							) : (
								<div className="bg-blue-50 rounded-2xl p-6">
									<div className="mb-4">
										<div className="flex justify-between items-center mb-2">
											<label className="text-gray-700 font-medium">
												Kalibrasyon Seviyesi
											</label>
											<span className="text-2xl font-bold text-brand-blue">
												{calibrationLevel}%
											</span>
										</div>
										<input
											type="range"
											min="0"
											max="100"
											value={calibrationLevel}
											onChange={(e) =>
												setCalibrationLevel(Number(e.target.value))
											}
											className="w-full h-8 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
										/>
										<div className="flex justify-between text-sm text-gray-500 mt-1">
											<span>0%</span>
											<span>100%</span>
										</div>
									</div>

									<button
										onClick={handleCalibrate}
										disabled={calibrating}
										className="w-full bg-brand-blue text-white py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
										<Zap className="w-5 h-5" />
										{calibrating
											? 'Kalibrasyon yapılıyor...'
											: 'Tek Nokta Kalibrasyon'}
									</button>
								</div>
							)}
						</div>

						{/* Alarm Level Setting */}
						<div className="bg-red-50 rounded-2xl p-6 mb-6">
							<div className="flex items-center gap-3 mb-4">
								<AlertTriangle className="w-6 h-6 text-red-600" />
								<h3 className="text-xl font-bold text-red-600">
									Alarm Settings
								</h3>
							</div>

							<div className="mb-4">
								<div className="flex justify-between items-center mb-2">
									<label className="text-gray-700 font-medium">
										High Alarm Level
									</label>
									<span className="text-2xl font-bold text-red-600">
										{alarmLevel}%
									</span>
								</div>
								<input
									type="range"
									min="0"
									max="100"
									value={alarmLevel}
									onChange={(e) => setAlarmLevel(Number(e.target.value))}
									className="w-full h-8 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-red"
								/>
								<div className="flex justify-between text-sm text-gray-500 mt-1">
									<span>0%</span>
									<span>100%</span>
								</div>
							</div>

							<button
								onClick={handleSaveAlarmLevel}
								disabled={
									savingAlarmLevel || alarmLevel === chamber.alarmLevelHigh
								}
								className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
								<Save className="w-5 h-5" />
								{savingAlarmLevel
									? 'Kaydediliyor...'
									: alarmLevel === chamber.alarmLevelHigh
									? 'Değişiklik Yok'
									: 'Alarm Seviyesini Kaydet'}
							</button>
						</div>

						{/* Sensor Management */}
						<div className="bg-green-50 rounded-2xl p-6 mb-6">
							<div className="flex items-center gap-3 mb-4">
								<RotateCcw className="w-6 h-6 text-green-600" />
								<h3 className="text-xl font-bold text-green-600">
									Sensor Management
								</h3>
							</div>

							<p className="text-gray-600 mb-4">
								If you have changed the sensor, click the button below for
								tracking.
							</p>

							<button
								onClick={handleSensorChanged}
								className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2">
								<RotateCcw className="w-5 h-5" />
								Sensor Changed
							</button>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<button
								onClick={handleClose}
								className="flex-1 bg-gray-500 text-white py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium">
								Close
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Custom CSS for sliders */}
			<style jsx>{`
				.slider::-webkit-slider-thumb {
					appearance: none;
					height: 32px;
					width: 32px;
					border-radius: 50%;
					background: #2563eb;
					cursor: pointer;
					box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
					border: 3px solid white;
				}
				.slider::-moz-range-thumb {
					height: 32px;
					width: 32px;
					border-radius: 50%;
					background: #2563eb;
					cursor: pointer;
					box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
					border: 3px solid white;
				}
				.slider-red::-webkit-slider-thumb {
					appearance: none;
					height: 32px;
					width: 32px;
					border-radius: 50%;
					background: #dc2626;
					cursor: pointer;
					box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
					border: 3px solid white;
				}
				.slider-red::-moz-range-thumb {
					height: 32px;
					width: 32px;
					border-radius: 50%;
					background: #dc2626;
					cursor: pointer;
					box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
					border: 3px solid white;
				}
			`}</style>
		</div>
	);
}
