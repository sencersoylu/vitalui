import React from 'react';
import { cn } from '../utils';

export interface SeatGridProps {
	pressures: number[];
	isDark?: boolean;
	className?: string;
}

/**
 * SeatGrid - Grid display of seat pressure indicators
 */
export const SeatGrid: React.FC<SeatGridProps> = ({
	pressures,
	isDark = true,
	className,
}) => {
	// Split into two rows of 6
	const topRow = pressures.slice(0, 6);
	const bottomRow = pressures.slice(6, 12);

	const renderSeat = (seatNum: number, pressure: number) => (
		<div
			key={seatNum}
			className={cn(
				'flex flex-col items-center justify-center p-3 rounded-lg',
				isDark ? 'bg-slate-800/50' : 'bg-slate-100'
			)}>
			<span
				className={cn(
					'text-[24px] font-bold',
					isDark ? 'text-white' : 'text-slate-800'
				)}>
				{seatNum}
			</span>
			<span className="text-[16px] font-poppins text-[#4a90e2]">
				{pressure.toFixed(2)} Bar
			</span>
		</div>
	);

	return (
		<div className={cn('flex flex-col gap-4', className)}>
			{/* Top row - seats 1-6 */}
			<div className="grid grid-cols-6 gap-3">
				{topRow.map((pressure, idx) => renderSeat(idx + 1, pressure))}
			</div>

			{/* Bottom row - seats 7-12 */}
			<div className="grid grid-cols-6 gap-3">
				{bottomRow.map((pressure, idx) => renderSeat(idx + 7, pressure))}
			</div>
		</div>
	);
};
