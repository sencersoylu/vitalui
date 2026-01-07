import React, { useState, useEffect } from 'react';
import { X, Snowflake, Thermometer, Power } from 'lucide-react';
import { useDashboardStore } from '../store';

interface ChillerControlModalProps {
	isOpen: boolean;
	onClose: () => void;
	socketRef: any;
}

export function ChillerControlModal({
	isOpen,
	onClose,
	socketRef,
}: ChillerControlModalProps) {
	const {
		chillerRunning,
		chillerCurrentTemp,
		chillerSetTemp,
		setChillerRunning,
		setChillerSetTemp,
	} = useDashboardStore();

	const [localSetTemp, setLocalSetTemp] = useState(chillerSetTemp);

	// Sync local state with store when modal opens
	useEffect(() => {
		if (isOpen) {
			setLocalSetTemp(chillerSetTemp);
		}
	}, [isOpen, chillerSetTemp]);

	const handleSetTempChange = (value: number) => {
		setLocalSetTemp(value);
	};

	const handleSetTempConfirm = () => {
		if (socketRef) {
			// Write target temperature to register 0x0005
			// Value is in 0.1°C units, so multiply by 10
			const tempValue = Math.round(localSetTemp * 10);
			socketRef.emit('writeRegister', {
				register: 'D00202',
				value: tempValue,
			});
			setChillerSetTemp(localSetTemp);
		}
	};

	const handleToggleChiller = () => {
		if (socketRef) {
			const newState = !chillerRunning;
			// Write run command to register 0x0006 (0=Stop, 1=Run)
			socketRef.emit('writeRegister', {
				register: 'D00208',
				value: newState ? 1 : 0,
			});

			setChillerRunning(newState);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div className="flex items-center gap-3">
						<div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
							<Snowflake className="w-7 h-7 text-cyan-600" />
						</div>
						<h2 className="text-2xl font-bold text-gray-800">
							Chiller Control
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors">
						<X className="w-6 h-6 text-gray-500" />
					</button>
				</div>

				{/* Current Temperature Display */}
				<div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 mb-6">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Thermometer className="w-5 h-5 text-cyan-600" />
							<span className="text-gray-600 font-medium">
								Current Temperature
							</span>
						</div>
						<div
							className={`px-3 py-1 rounded-full text-sm font-medium ${
								chillerRunning
									? 'bg-cyan-500 text-white'
									: 'bg-gray-300 text-gray-600'
							}`}>
							{chillerRunning ? 'Running' : 'Stopped'}
						</div>
					</div>
					<div className="text-center">
						<span className="text-6xl font-bold text-cyan-600">
							{chillerCurrentTemp.toFixed(1)}
						</span>
						<span className="text-3xl text-cyan-500 ml-1">°C</span>
					</div>
				</div>

				{/* Target Temperature Setting */}
				<div className="bg-gray-50 rounded-2xl p-6 mb-6">
					<div className="flex justify-between items-center mb-4">
						<span className="text-gray-700 font-medium">
							Target Temperature
						</span>
						<span className="text-2xl font-bold text-blue-600">
							{localSetTemp.toFixed(1)}°C
						</span>
					</div>
					<input
						type="range"
						min="5"
						max="35"
						step="0.5"
						value={localSetTemp}
						onChange={(e) => handleSetTempChange(Number(e.target.value))}
						className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-cyan"
					/>
					<div className="flex justify-between text-sm text-gray-500 mt-2">
						<span>5°C</span>
						<span>20°C</span>
						<span>35°C</span>
					</div>
					<button
						onClick={handleSetTempConfirm}
						disabled={localSetTemp === chillerSetTemp}
						className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
						{localSetTemp === chillerSetTemp
							? 'No Changes'
							: 'Apply Temperature'}
					</button>
				</div>

				{/* Run/Stop Toggle */}
				<button
					onClick={handleToggleChiller}
					className={`w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-3 transition-all ${
						chillerRunning
							? 'bg-red-500 hover:bg-red-600 text-white'
							: 'bg-green-500 hover:bg-green-600 text-white'
					}`}>
					<Power className="w-6 h-6" />
					{chillerRunning ? 'Stop Chiller' : 'Start Chiller'}
				</button>

				{/* Close Button */}
				<button
					onClick={onClose}
					className="w-full mt-4 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium">
					Close
				</button>
			</div>

			{/* Custom CSS for slider */}
			<style jsx>{`
				.slider-cyan::-webkit-slider-thumb {
					appearance: none;
					height: 28px;
					width: 28px;
					border-radius: 50%;
					background: linear-gradient(135deg, #06b6d4, #0891b2);
					cursor: pointer;
					box-shadow: 0 4px 10px rgba(6, 182, 212, 0.4);
					border: 3px solid white;
					transition: transform 0.2s ease;
				}
				.slider-cyan::-webkit-slider-thumb:hover {
					transform: scale(1.1);
				}
				.slider-cyan::-moz-range-thumb {
					height: 28px;
					width: 28px;
					border-radius: 50%;
					background: linear-gradient(135deg, #06b6d4, #0891b2);
					cursor: pointer;
					box-shadow: 0 4px 10px rgba(6, 182, 212, 0.4);
					border: 3px solid white;
				}
			`}</style>
		</div>
	);
}
