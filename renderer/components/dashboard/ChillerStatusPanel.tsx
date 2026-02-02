import React from 'react';
import { cn } from '../utils';

export interface ChillerStatusPanelProps {
	isDark?: boolean;
	isRunning: boolean;
	setTemp: number;
	currentTemp: number;
	className?: string;
}

/**
 * ChillerStatusPanel - Display-only panel for chiller status
 */
export const ChillerStatusPanel: React.FC<ChillerStatusPanelProps> = ({
	isDark = true,
	isRunning,
	setTemp,
	currentTemp,
	className,
}) => {
	return (
		<div
			className={cn(
				'rounded-2xl p-4 border',
				isDark
					? 'bg-cyan-900/30 border-cyan-500/30'
					: 'bg-cyan-50 border-cyan-200',
				className
			)}>
			{/* Header with status */}
			<div className="flex items-center justify-between mb-4">
				<h3
					className={cn(
						'text-xl font-semibold',
						isDark ? 'text-cyan-400' : 'text-cyan-700'
					)}>
					Chiller
				</h3>
				<div className="flex items-center gap-2">
					<div
						className={cn(
							'w-6 h-6 rounded-full flex items-center justify-center',
							isRunning ? 'bg-[#22c55e]' : 'bg-red-500'
						)}>
						{isRunning ? (
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none">
								<path
									d="M20 6L9 17L4 12"
									stroke="white"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						) : (
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none">
								<path
									d="M18 6L6 18M6 6L18 18"
									stroke="white"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						)}
					</div>
					<span
						className={cn(
							'text-sm font-medium',
							isRunning ? 'text-[#22c55e]' : 'text-red-500'
						)}>
						{isRunning ? 'On' : 'Off'}
					</span>
				</div>
			</div>

			{/* Temperature display */}
			<div className="flex gap-4">
				{/* Set Value */}
				<div
					className={cn(
						'flex-1 rounded-xl p-3 text-center',
						isDark ? 'bg-slate-800/50' : 'bg-white'
					)}>
					<p
						className={cn(
							'text-sm mb-1',
							isDark ? 'text-slate-400' : 'text-slate-500'
						)}>
						SV
					</p>
					<p
						className={cn(
							'text-2xl font-bold',
							isDark ? 'text-white' : 'text-slate-800'
						)}>
						{setTemp.toFixed(1)}°C
					</p>
				</div>

				{/* Process Value */}
				<div
					className={cn(
						'flex-1 rounded-xl p-3 text-center',
						isDark ? 'bg-slate-800/50' : 'bg-white'
					)}>
					<p
						className={cn(
							'text-sm mb-1',
							isDark ? 'text-slate-400' : 'text-slate-500'
						)}>
						PV
					</p>
					<p
						className={cn(
							'text-2xl font-bold',
							isDark ? 'text-cyan-400' : 'text-cyan-600'
						)}>
						{currentTemp.toFixed(1)}°C
					</p>
				</div>
			</div>
		</div>
	);
};
