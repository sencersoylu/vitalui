import React from 'react';
import { cn } from '../utils';

export interface AirTankProps {
	capacity: string;
	pressure: string;
	fillPercent: number;
	isDark?: boolean;
	className?: string;
}

/**
 * AirTank - Visual representation of air storage tank
 *
 * Shows horizontal tank with capacity label and pressure reading
 */
export const AirTank: React.FC<AirTankProps> = ({
	capacity,
	pressure,
	fillPercent,
	isDark = true,
	className,
}) => {
	return (
		<div className={cn('relative flex flex-col items-center', className)}>
			{/* Tank body */}
			<div className="relative w-full max-w-[120px]">
				{/* Outer shell */}
				<div
					className={cn(
						'h-16 rounded-full border-2 relative overflow-hidden',
						isDark
							? 'bg-slate-800/50 border-slate-600/50'
							: 'bg-slate-200/50 border-slate-400/50'
					)}>
					{/* Fill indicator */}
					<div
						className={cn(
							'h-full rounded-full transition-all duration-500',
							fillPercent > 60
								? 'bg-emerald-500/30'
								: fillPercent > 30
									? 'bg-amber-500/30'
									: 'bg-red-500/30'
						)}
						style={{ width: `${fillPercent}%` }}
					/>
				</div>

				{/* End caps */}
				<div
					className={cn(
						'absolute top-1/2 -translate-y-1/2 w-3 h-10 rounded-full',
						isDark ? 'bg-slate-700' : 'bg-slate-400'
					)}
				/>
				<div
					className={cn(
						'absolute top-1/2 -translate-y-1/2 right-0 w-3 h-10 rounded-full',
						isDark ? 'bg-slate-700' : 'bg-slate-400'
					)}
				/>

				{/* Pressure label overlay */}
				<div
					className={cn(
						'absolute -bottom-8 left-1/2 -translate-x-1/2 text-center',
						isDark ? 'text-sky-400' : 'text-sky-600'
					)}>
					<p className="text-lg font-bold">{pressure}</p>
				</div>
			</div>

			{/* Capacity label */}
			<p
				className={cn(
					'text-center text-sm mt-6',
					isDark ? 'text-sky-400/80' : 'text-sky-600/80'
				)}>
				{capacity}
				<br />
				Air Tank
			</p>
		</div>
	);
};
