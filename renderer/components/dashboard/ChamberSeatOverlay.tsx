import React, { useState } from 'react';
import { useDashboardStore } from '../../store';
import { cn } from '../utils';

interface SeatPosition {
	id: string;
	label: string;
	top: number;
	left: number;
	width: number;
	height: number;
}

// Main chamber back row (seats 1-6): upper area, diagonal from right to left
// Main chamber front row (seats 7-12): lower area, diagonal from right to left
// Ante chamber (A1, A2): left section
const SEAT_POSITIONS: SeatPosition[] = [
	// Main Chamber - Back row (top row in image, right to left)
	{ id: '1', label: '1', top: 23, left: 60, width: 6, height: 9 },
	{ id: '2', label: '2', top: 26, left: 51, width: 6, height: 9 },
	{ id: '3', label: '3', top: 29, left: 42, width: 6, height: 9 },
	{ id: '4', label: '4', top: 32, left: 33, width: 6, height: 9 },
	{ id: '5', label: '5', top: 35, left: 24.5, width: 6, height: 9 },
	{ id: '6', label: '6', top: 38, left: 16, width: 6, height: 9 },

	// Main Chamber - Front row (bottom row in image, right to left)
	{ id: '7', label: '7', top: 52, left: 58, width: 6, height: 9 },
	{ id: '8', label: '8', top: 55, left: 49, width: 6, height: 9 },
	{ id: '9', label: '9', top: 58, left: 40, width: 6, height: 9 },
	{ id: '10', label: '10', top: 61, left: 31, width: 6, height: 9 },
	{ id: '11', label: '11', top: 64, left: 22.5, width: 6, height: 9 },
	{ id: '12', label: '12', top: 67, left: 14, width: 6, height: 9 },

	// Ante Chamber (left section)
	{ id: 'A1', label: 'A1', top: 20, left: 76, width: 6, height: 9 },
	{ id: 'A2', label: 'A2', top: 46, left: 76, width: 6, height: 9 },
];

interface ChamberSeatOverlayProps {
	isDark?: boolean;
}

export function ChamberSeatOverlay({ isDark }: ChamberSeatOverlayProps) {
	const [flashingSeats, setFlashingSeats] = useState<Set<string>>(new Set());
	const activeSeatAlarm = useDashboardStore((s) => s.activeSeatAlarm);

	const toggleSeat = (seatId: string) => {
		setFlashingSeats((prev) => {
			const next = new Set(prev);
			if (next.has(seatId)) {
				next.delete(seatId);
			} else {
				next.add(seatId);
			}
			return next;
		});
	};

	const isSeatActive = (seatId: string) => {
		if (flashingSeats.has(seatId)) return true;
		if (activeSeatAlarm && String(activeSeatAlarm.seatNumber) === seatId) return true;
		return false;
	};

	return (
		<div className="relative w-full h-auto select-none">
			<img
				alt="Hiperbarik Kabin 3D"
				src="/external/chamber-3d.png"
				className="w-full h-auto object-contain"
				draggable={false}
			/>

			{SEAT_POSITIONS.map((seat) => {
				const active = isSeatActive(seat.id);

				return (
					<button
						key={seat.id}
						onClick={() => toggleSeat(seat.id)}
						className={cn(
							'absolute rounded-lg transition-all duration-200 cursor-pointer',
							'border-2 border-transparent',
							'hover:border-white/50 hover:bg-white/10',
							'focus:outline-none focus:border-white/60',
							'flex items-center justify-center',
							active && 'seat-flash'
						)}
						style={{
							top: `${seat.top}%`,
							left: `${seat.left}%`,
							width: `${seat.width}%`,
							height: `${seat.height}%`,
						}}
						title={`Seat ${seat.label}`}
					>
						{active && (
							<span className="text-sm font-bold leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
								{seat.label}
							</span>
						)}
					</button>
				);
			})}

			{process.env.NODE_ENV === 'development' && (
				<div
					className="absolute inset-0"
					style={{ pointerEvents: 'none' }}
					onClick={(e) => {
						const rect = (e.target as HTMLElement).getBoundingClientRect();
						console.log(
							`top=${((e.clientY - rect.top) / rect.height * 100).toFixed(1)}% left=${((e.clientX - rect.left) / rect.width * 100).toFixed(1)}%`
						);
					}}
				/>
			)}
		</div>
	);
}
