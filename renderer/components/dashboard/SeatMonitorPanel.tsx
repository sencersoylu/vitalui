import React from 'react';
import { cn } from '../utils';
import { SeatGrid } from '../ui/SeatGrid';

export interface SeatMonitorPanelProps {
	isDark?: boolean;
	pressures: number[];
	className?: string;
}

/**
 * SeatMonitorPanel - Panel showing seat pressure monitoring grid
 */
export const SeatMonitorPanel: React.FC<SeatMonitorPanelProps> = ({
	isDark = true,
	pressures,
	className,
}) => {
	return (
		<div
			className={cn(
				'rounded-2xl p-6 border',
				isDark
					? 'bg-slate-800/30 border-slate-700/50'
					: 'bg-white/80 border-slate-200',
				className
			)}>
			<h3
				className={cn(
					'text-xl font-semibold mb-4 text-center',
					isDark ? 'text-white' : 'text-slate-800'
				)}>
				Seat Pressure Monitoring
			</h3>

			<SeatGrid pressures={pressures} isDark={isDark} />
		</div>
	);
};
