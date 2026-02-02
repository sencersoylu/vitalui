import React from 'react';
import { useDashboardStore } from '../../store';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Armchair } from 'lucide-react';

/**
 * SeatAlarmModal - Displays seat alarm information
 */
export function SeatAlarmModal({ socketRef, onClose }: { socketRef: any; onClose: () => void }) {
	const { showSeatAlarmModal, activeSeatAlarm } = useDashboardStore();

	const handleClose = () => {
		if (socketRef) {
			socketRef.emit('writeBit', { register: 'M0400', value: 0 });
			socketRef.emit('writeRegister', { register: 'R0030', value: 0 });
		}
		onClose();
	};

	if (!activeSeatAlarm || !showSeatAlarmModal) return null;

	return (
		<Modal isOpen={showSeatAlarmModal} onClose={handleClose} size="md">
			<div className="flex flex-col items-center text-center space-y-6">
				{/* Icon */}
				<div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center animate-pulse">
					<Armchair className="w-12 h-12 text-red-600 dark:text-red-400" />
				</div>

				{/* Title */}
				<h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
					Seat Alarm
				</h2>

				{/* Seat Number */}
				<p className="text-7xl font-black text-red-600 dark:text-red-400">
					{activeSeatAlarm.seatNumber}
				</p>

				{/* Close Button */}
				<Button variant="danger" size="lg" fullWidth onClick={handleClose}>
					Close Alarm
				</Button>
			</div>
		</Modal>
	);
}
