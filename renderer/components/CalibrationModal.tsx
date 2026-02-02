import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface CalibrationModalProps {
	isOpen: boolean;
	onClose: () => void;
	progress: number;
	status: string;
	onCancel: () => void;
}

/**
 * CalibrationModal - Displays calibration progress with cancel option
 */
export const CalibrationModal: React.FC<CalibrationModalProps> = ({
	isOpen,
	onClose,
	progress,
	status,
	onCancel,
}) => {
	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			<div className="flex flex-col items-center text-center space-y-6">
				{/* Icon */}
				<div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center animate-pulse">
					<Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
				</div>

				{/* Title */}
				<h2 className="text-3xl font-bold text-slate-900 dark:text-white">
					Calibration in Progress
				</h2>

				{/* Status */}
				<p className="text-xl text-slate-600 dark:text-slate-300">
					{status}
				</p>

				{/* Progress Bar */}
				<div className="w-full">
					<div className="flex justify-between mb-2">
						<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
							Progress
						</span>
						<span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
							{progress}%
						</span>
					</div>
					<div className="w-full h-6 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
				</div>

				{/* Cancel Button */}
				<Button
					variant="muted"
					size="lg"
					fullWidth
					onClick={onCancel}>
					Cancel
				</Button>
			</div>
		</Modal>
	);
};

export default CalibrationModal;
