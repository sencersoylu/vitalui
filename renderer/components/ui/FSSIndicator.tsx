import React from 'react';
import { cn } from '../utils';

export interface FSSIndicatorProps {
	label: string;
	level: number;
	pressure: number;
	isActive: boolean;
	hasWarning?: boolean;
	warningPressure?: number;
	isDark?: boolean;
	className?: string;
}

/**
 * FSSIndicator - Fire Suppression System indicator
 */
export const FSSIndicator: React.FC<FSSIndicatorProps> = ({
	label,
	level,
	pressure,
	isActive,
	hasWarning = false,
	warningPressure,
	isDark = true,
	className,
}) => {
	return (
		<div className={cn('relative flex flex-col items-center w-[94px]', className)}>
			{/* Label */}
			<p className="text-[16px] font-poppins text-[#4a90e2] text-center mb-1">
				{label}
				<br />
				FSS
			</p>

			{/* Status indicator */}
			<div className="flex items-center gap-1 mb-2">
				<div
					className={cn(
						'w-[20px] h-[20px] rounded-full flex items-center justify-center',
						isActive ? 'bg-[#22c55e]' : 'bg-red-500'
					)}>
					{isActive ? (
						<svg
							width="10"
							height="10"
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
							width="10"
							height="10"
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
						'text-[12px] font-light',
						isActive ? 'text-[#22c55e]' : 'text-red-500'
					)}>
					{isActive ? 'Active' : 'Passive'}
				</span>
			</div>

			{/* Cylinder */}
			<svg width="94" height="170" viewBox="0 0 94 170">
				<defs>
					<linearGradient
						id={`fss-grad-${label}`}
						x1="0%"
						y1="0%"
						x2="100%"
						y2="0%">
						<stop offset="0%" stopColor="#7f1d1d" />
						<stop offset="30%" stopColor="#991b1b" />
						<stop offset="70%" stopColor="#991b1b" />
						<stop offset="100%" stopColor="#7f1d1d" />
					</linearGradient>
				</defs>

				{/* Top cap */}
				<ellipse cx="47" cy="18" rx="38" ry="15" fill="#991b1b" />

				{/* Body */}
				<rect
					x="9"
					y="18"
					width="76"
					height="130"
					fill={`url(#fss-grad-${label})`}
				/>

				{/* Bottom cap */}
				<ellipse cx="47" cy="148" rx="38" ry="15" fill="#7f1d1d" />

				{/* Highlight reflection */}
				<rect
					x="18"
					y="25"
					width="10"
					height="110"
					rx="5"
					fill="rgba(255,255,255,0.15)"
				/>
			</svg>

			{/* Values overlay */}
			<div className="absolute top-[130px] left-1/2 -translate-x-1/2 text-center w-[80px]">
				<p className="text-[18px] font-bold font-poppins text-white">
					%{level}
				</p>
				<p className="text-[18px] font-bold font-poppins text-white">
					{pressure} Bar
				</p>
			</div>

			{/* Warning indicator */}
			{hasWarning && (
				<div className="mt-2 px-2 py-1 bg-red-500 rounded text-white text-[12px] font-bold">
					{warningPressure || 50} Bar Warning!
				</div>
			)}
		</div>
	);
};
