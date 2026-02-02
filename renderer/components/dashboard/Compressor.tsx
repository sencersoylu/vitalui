import React from 'react';
import { cn } from '../utils';

export interface CompressorProps {
	type: 'Low Pressure' | 'High Pressure';
	isOn: boolean;
	isDark?: boolean;
	className?: string;
}

/**
 * Compressor - Visual representation of air compressor unit
 *
 * Shows compressor tank with pressure gauge and on/off status
 */
export const Compressor: React.FC<CompressorProps> = ({
	type,
	isOn,
	isDark = true,
	className,
}) => {
	return (
		<div className={cn('relative', className)}>
			{/* Main tank body */}
			<div
				className={cn(
					'relative rounded-3xl border-2 p-4',
					isDark
						? 'bg-slate-800/50 border-slate-600/50'
						: 'bg-slate-200/50 border-slate-400/50'
				)}>
				{/* Pressure gauge area */}
				<div className="relative w-20 h-20 mx-auto mb-2">
					<div
						className={cn(
							'absolute inset-0 rounded-full border-4',
							isDark ? 'border-slate-600' : 'border-slate-400'
						)}
					/>
					<div
						className={cn(
							'absolute inset-2 rounded-full flex items-center justify-center',
							isDark ? 'bg-slate-700' : 'bg-slate-300'
						)}>
						{/* Gauge indicator lines */}
						<div className="absolute inset-0 flex items-center justify-center">
							{[...Array(12)].map((_, i) => (
								<div
									key={i}
									className={cn(
										'absolute w-0.5 h-2 origin-center',
										isDark ? 'bg-slate-500' : 'bg-slate-600',
										i < 8 ? 'bg-emerald-500' : 'bg-amber-500'
									)}
									style={{
										transform: `rotate(${i * 30}deg) translateY(-24px)`,
									}}
								/>
							))}
						</div>
						{/* Needle */}
						<div
							className={cn(
								'w-0.5 h-6 bg-red-500 origin-bottom',
								isOn ? 'rotate-[-30deg]' : 'rotate-[-60deg]'
							)}
							style={{ transformOrigin: 'bottom center', marginBottom: '8px' }}
						/>
					</div>
				</div>

				{/* Status indicator */}
				<div className="flex items-center justify-center gap-2 mb-2">
					<div
						className={cn(
							'w-2 h-2 rounded-full',
							isOn ? 'bg-emerald-500' : 'bg-red-500'
						)}
					/>
					<span
						className={cn(
							'text-sm font-light',
							isOn ? 'text-emerald-500' : 'text-red-500'
						)}>
						{isOn ? 'On' : 'Off'}
					</span>
				</div>

				{/* Base platform */}
				<div
					className={cn(
						'h-3 rounded-full -mx-2',
						isDark ? 'bg-slate-700' : 'bg-slate-400'
					)}
				/>
			</div>

			{/* Label */}
			<p
				className={cn(
					'text-center text-lg font-medium mt-4',
					isDark ? 'text-sky-400' : 'text-sky-600'
				)}>
				{type}
				<br />
				Compresor
			</p>
		</div>
	);
};
