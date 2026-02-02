import React from 'react';
import { cn } from '../utils';

export interface O2PressureCardProps {
	label: string;
	pressure: number;
	isActive: boolean;
	isDark?: boolean;
	className?: string;
}

/**
 * O2PressureCard - Card showing O2 pressure status
 */
export const O2PressureCard: React.FC<O2PressureCardProps> = ({
	label,
	pressure,
	isActive,
	isDark = true,
	className,
}) => {
	return (
		<div
			className={cn(
				'relative w-[400px] h-[110px] rounded-[30px] overflow-hidden',
				isDark
					? 'bg-slate-800/50'
					: 'bg-[rgba(37,78,126,0.09)]',
				className
			)}>
			{/* Status indicator */}
			<div className="absolute right-[20px] top-[10px] flex items-center gap-2">
				<div
					className={cn(
						'w-[24px] h-[24px] rounded-full flex items-center justify-center',
						isActive ? 'bg-[#22c55e]' : 'bg-red-500'
					)}>
					{isActive ? (
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
							<path
								d="M20 6L9 17L4 12"
								stroke="white"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					) : (
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
						'text-[14px] font-light',
						isActive ? 'text-[#22c55e]' : 'text-red-500'
					)}>
					{isActive ? 'Active' : 'Passive'}
				</span>
			</div>

			{/* Label */}
			<p
				className={cn(
					'absolute left-[25px] top-[12px] text-[18px] font-normal font-inter',
					isDark ? 'text-white' : 'text-black'
				)}>
				{label}
			</p>

			{/* Pressure value */}
			<p
				className={cn(
					'absolute right-[25px] top-[45px] text-[42px] font-normal font-roboto',
					isDark ? 'text-white' : 'text-black'
				)}>
				{pressure} Bar
			</p>
		</div>
	);
};
