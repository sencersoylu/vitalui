import React, { useState, useEffect, useRef } from 'react';
import { Snowflake, Thermometer, Power } from 'lucide-react';
import { useDashboardStore } from '../store';
import { Button } from './ui/Button';
import { Slider } from './ui/Slider';
import { Modal } from './ui/Modal';

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
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Sync local state with store when modal opens
	useEffect(() => {
		if (isOpen) {
			setLocalSetTemp(chillerSetTemp);
		}
	}, [isOpen, chillerSetTemp]);

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, []);

	const handleSetTempChange = (value: number) => {
		setLocalSetTemp(value);

		// Clear existing timer
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		// Debounce: write to register after 500ms of no changes
		debounceTimerRef.current = setTimeout(() => {
			if (socketRef) {
				// Write target temperature to register
				// Value is in 0.1°C units, so multiply by 10
				const tempValue = Math.round(value * 10);
				socketRef.emit('writeRegister', {
					register: 'D00202',
					value: tempValue,
				});
				setChillerSetTemp(value);
			}
		}, 500);
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

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			{/* Current Temperature Display */}
			<div className="space-y-6">
				{/* Status indicator */}
				<div className="flex items-center justify-center mb-4">
					<div className="flex items-center justify-between w-full gap-3">
						<div className="flex items-center gap-3">
							<Snowflake className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
							<span className="text-lg font-semibold text-slate-700 dark:text-slate-200">
								Chiller Status
							</span>
						</div>
						<span
							className={`px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all ${
								chillerRunning
									? 'bg-emerald-500 text-white shadow-emerald-500/25'
									: 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-400'
							}`}>
							{chillerRunning ? (
								<>
									<span className="w-2 h-2 rounded-full bg-white animate-pulse" />
									Running
								</>
							) : (
								<span className="font-medium">Stopped</span>
							)}
						</span>
					</div>
				</div>

				{/* Temperature Display */}
				<div className="bg-gradient-to-br from-cyan-50 dark:from-cyan-950/30 to-blue-50 dark:to-blue-950/30 rounded-2xl p-8 border border-cyan-100 dark:border-cyan-900/30 shadow-lg">
					<div className="text-center">
						<div className="mb-2">
							<span className="text-base text-slate-600 dark:text-slate-300 font-medium">
								Current Temperature
							</span>
						</div>
						<div className="flex items-center justify-center gap-1">
							<span className="text-7xl font-bold text-slate-600 dark:text-slate-300 tabular-nums">
								{chillerCurrentTemp.toFixed(1)}
							</span>
							<span className="text-4xl text-slate-600 dark:text-slate-300">
								°C
							</span>
						</div>
					</div>
				</div>

				{/* Target Temperature Setting */}
				<div className="space-y-4">
					<Slider
						label="Target Temperature"
						min={5}
						max={35}
						step={0.5}
						value={localSetTemp}
						onChange={handleSetTempChange}
						color="cyan"
						leftLabel="5°C"
						centerLabel="20°C"
						rightLabel="35°C"
						size="md"
					/>
				</div>

				{/* Actions */}
				<div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
					<Button
						variant={chillerRunning ? 'danger' : 'success'}
						size="lg"
						fullWidth
						leftIcon={<Power className="w-6 h-6" />}
						onClick={handleToggleChiller}>
						{chillerRunning ? 'Stop Chiller' : 'Start Chiller'}
					</Button>
					<Button
						variant="muted"
						size="md"
						fullWidth
						onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</Modal>
	);
}
