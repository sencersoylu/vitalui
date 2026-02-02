import React from 'react';
import { cn } from '../utils';

export interface PressureCardProps {
	title: string;
	value: string;
	status: 'active' | 'passive';
	isDark?: boolean;
	className?: string;
}

/**
 * PressureCard - Displays pressure readings with status indicator
 *
 * Used for O2 pressure monitoring cards on the technical room page
 */
export const PressureCard: React.FC<PressureCardProps> = ({
	title,
	value,
	status,
	isDark = true,
	className,
}) => {
	return (
		<div
			className={cn(
				'rounded-[50px] overflow-hidden border border-transparent',
				'p-4 pr-6 relative min-w-[280px]',
				isDark
					? 'bg-white/5'
					: 'bg-[rgba(37,78,126,0.09)]',
				className
			)}>
			{/* Status indicator */}
			<div className="absolute top-3.5 right-4 flex items-center gap-2">
				<div
					className={cn(
						'w-2 h-2 rounded-full',
						status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
					)}
				/>
				<span
					className={cn(
						'text-sm font-light',
						status === 'active' ? 'text-emerald-500' : 'text-red-500'
					)}>
					{status === 'active' ? 'Active' : 'Passive'}
				</span>
			</div>

			{/* Title */}
			<p
				className={cn(
					'text-xl font-medium mb-2',
					isDark ? 'text-white/80' : 'text-slate-900'
				)}>
				{title}
			</p>

			{/* Value */}
			<p
				className={cn(
					'text-5xl font-bold font-roboto',
					isDark ? 'text-white' : 'text-slate-900'
				)}>
				{value}
			</p>
		</div>
	);
};
