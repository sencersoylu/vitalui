import React from 'react';
import { cn } from '../utils';

export interface CompressorUnitProps {
	label: string;
	status: boolean;
	isDark?: boolean;
	className?: string;
}

/**
 * CompressorUnit - Visual representation of a compressor with on/off status
 */
export const CompressorUnit: React.FC<CompressorUnitProps> = ({
	label,
	status,
	isDark = true,
	className,
}) => {
	return (
		<div className={cn('flex flex-col items-center', className)}>
			<div className="relative w-[200px] h-[160px]">
				{/* Status indicator */}
				<div className="absolute left-[10px] top-[10px] flex items-center gap-2 z-10">
					<div
						className={cn(
							'w-[32px] h-[32px] rounded-full flex items-center justify-center',
							status ? 'bg-[#22c55e]' : 'bg-red-500'
						)}>
						{status ? (
							<svg
								width="16"
								height="16"
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
								width="16"
								height="16"
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
							'text-[16px] font-light',
							status ? 'text-[#22c55e]' : 'text-red-500'
						)}>
						{status ? 'On' : 'Off'}
					</span>
				</div>

				{/* Compressor SVG */}
				<svg width="200" height="160" viewBox="0 0 200 160">
					{/* Main body - two tanks side by side */}
					<rect
						x="15"
						y="40"
						width="75"
						height="95"
						rx="8"
						fill="#9ca3af"
						stroke="#6b7280"
						strokeWidth="2"
					/>
					<rect
						x="100"
						y="40"
						width="75"
						height="95"
						rx="8"
						fill="#9ca3af"
						stroke="#6b7280"
						strokeWidth="2"
					/>

					{/* Top connecting bar */}
					<rect
						x="10"
						y="35"
						width="170"
						height="10"
						rx="3"
						fill="#6b7280"
					/>

					{/* Bottom connecting bar */}
					<rect
						x="10"
						y="135"
						width="170"
						height="10"
						rx="3"
						fill="#6b7280"
					/>

					{/* Horizontal grille lines */}
					{[0, 1, 2, 3, 4, 5, 6].map((i) => (
						<React.Fragment key={i}>
							<line
								x1="25"
								y1={55 + i * 11}
								x2="80"
								y2={55 + i * 11}
								stroke="#6b7280"
								strokeWidth="1.5"
							/>
							<line
								x1="110"
								y1={55 + i * 11}
								x2="165"
								y2={55 + i * 11}
								stroke="#6b7280"
								strokeWidth="1.5"
							/>
						</React.Fragment>
					))}

					{/* Top vents */}
					<rect
						x="40"
						y="20"
						width="15"
						height="18"
						rx="2"
						fill="#6b7280"
					/>
					<rect
						x="135"
						y="20"
						width="15"
						height="18"
						rx="2"
						fill="#6b7280"
					/>

					{/* Bottom feet */}
					<rect
						x="20"
						y="145"
						width="25"
						height="12"
						rx="3"
						fill="#4b5563"
					/>
					<rect
						x="65"
						y="145"
						width="25"
						height="12"
						rx="3"
						fill="#4b5563"
					/>
					<rect
						x="105"
						y="145"
						width="25"
						height="12"
						rx="3"
						fill="#4b5563"
					/>
					<rect
						x="150"
						y="145"
						width="25"
						height="12"
						rx="3"
						fill="#4b5563"
					/>
				</svg>
			</div>

			{/* Label */}
			<p className="text-[24px] font-poppins text-[#4a90e2] text-center w-[200px]">
				{label}
			</p>
		</div>
	);
};
