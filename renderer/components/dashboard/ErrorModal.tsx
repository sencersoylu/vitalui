import React from 'react';
import { useDashboardStore } from '../../store';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorModal - Displays error messages with close button
 */
export function ErrorModal({ socketRef, onClose }: { socketRef: any; onClose: () => void }) {
	const { showErrorModal, errorMessage } = useDashboardStore();

	const handleClose = () => {
		if (socketRef) {
			socketRef.emit('writeBit', { register: 'M0400', value: 0 });
		}
		onClose();
	};

	if (!showErrorModal) return null;

	return (
		<Modal isOpen={showErrorModal} onClose={handleClose} size="md">
			<div className="flex flex-col items-center text-center space-y-6">
				{/* Icon */}
				<div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
					<AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
				</div>

				{/* Title */}
				<h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
					Warning
				</h2>

				{/* Message */}
				<p className="text-xl text-slate-600 dark:text-slate-300">
					{errorMessage}
				</p>

				{/* Close Button */}
				<Button variant="danger" size="lg" fullWidth onClick={handleClose}>
					Close
				</Button>
			</div>
		</Modal>
	);
}
