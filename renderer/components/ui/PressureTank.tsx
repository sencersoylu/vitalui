import React from 'react';
import { cn } from '../utils';

export interface PressureTankProps {
	pressure: number;
	label: string;
	subLabel?: string;
	type: 'air' | 'nitrogen' | 'cylinder';
	isDark?: boolean;
	className?: string;
}

/**
 * PressureTank - Visual representation of a pressure tank
 */
export const PressureTank: React.FC<PressureTankProps> = ({
	pressure,
	label,
	subLabel,
	type,
	isDark = true,
	className,
}) => {
	if (type === 'air') {
		return (
			<div className={cn('relative flex flex-col items-center w-[110px]', className)}>
				{/* Tank body */}
				<svg width="110" height="150" viewBox="0 0 110 150">
					<defs>
						<linearGradient
							id="tank-gradient-air"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%">
							<stop offset="0%" stopColor="#9ca3af" />
							<stop offset="30%" stopColor="#d1d5db" />
							<stop offset="70%" stopColor="#d1d5db" />
							<stop offset="100%" stopColor="#9ca3af" />
						</linearGradient>
					</defs>

					{/* Top ellipse */}
					<ellipse
						cx="55"
						cy="25"
						rx="42"
						ry="18"
						fill="#d1d5db"
						stroke="#9ca3af"
						strokeWidth="2"
					/>

					{/* Body */}
					<rect
						x="13"
						y="25"
						width="84"
						height="100"
						fill="url(#tank-gradient-air)"
						stroke="#9ca3af"
						strokeWidth="2"
					/>

					{/* Bottom ellipse */}
					<ellipse
						cx="55"
						cy="125"
						rx="42"
						ry="18"
						fill="#b8bcc4"
						stroke="#9ca3af"
						strokeWidth="2"
					/>

					{/* Highlight on top */}
					<ellipse
						cx="55"
						cy="25"
						rx="32"
						ry="12"
						fill="#e5e7eb"
						opacity="0.7"
					/>
				</svg>

				{/* Labels */}
				<div className="text-center mt-[-5px]">
					<p className="text-[16px] font-poppins text-[#4a90e2]">
						{subLabel || '2000 L'}
					</p>
					<p className="text-[16px] font-poppins text-[#4a90e2]">{label}</p>
				</div>
				<p className="text-[20px] font-bold font-poppins text-[#4a90e2] mt-1">
					{pressure} Bar
				</p>
			</div>
		);
	}

	if (type === 'nitrogen') {
		return (
			<div className={cn('relative flex flex-col items-center w-[110px]', className)}>
				{/* Tank body - green for nitrogen */}
				<svg width="110" height="150" viewBox="0 0 110 150">
					<defs>
						<linearGradient
							id="tank-gradient-n2"
							x1="0%"
							y1="0%"
							x2="100%"
							y2="0%">
							<stop offset="0%" stopColor="#059669" />
							<stop offset="30%" stopColor="#10b981" />
							<stop offset="70%" stopColor="#10b981" />
							<stop offset="100%" stopColor="#059669" />
						</linearGradient>
					</defs>

					{/* Top ellipse */}
					<ellipse
						cx="55"
						cy="25"
						rx="42"
						ry="18"
						fill="#10b981"
						stroke="#059669"
						strokeWidth="2"
					/>

					{/* Body */}
					<rect
						x="13"
						y="25"
						width="84"
						height="100"
						fill="url(#tank-gradient-n2)"
						stroke="#059669"
						strokeWidth="2"
					/>

					{/* Bottom ellipse */}
					<ellipse
						cx="55"
						cy="125"
						rx="42"
						ry="18"
						fill="#047857"
						stroke="#059669"
						strokeWidth="2"
					/>

					{/* Highlight */}
					<ellipse
						cx="55"
						cy="25"
						rx="32"
						ry="12"
						fill="#34d399"
						opacity="0.5"
					/>
				</svg>

				{/* Labels */}
				<div className="text-center mt-[-5px]">
					<p className="text-[16px] font-poppins text-[#4a90e2]">{label}</p>
				</div>
				<p className="text-[20px] font-bold font-poppins text-[#4a90e2] mt-1">
					{pressure} Bar
				</p>
			</div>
		);
	}

	// Cylinder type
	return (
		<div className={cn('flex flex-col items-center', className)}>
			<div className="flex gap-[6px]">
				{[...Array(8)].map((_, i) => (
					<svg key={i} width="32" height="190" viewBox="0 0 32 190">
						<defs>
							<linearGradient
								id={`cyl-grad-${i}`}
								x1="0%"
								y1="0%"
								x2="100%"
								y2="0%">
								<stop offset="0%" stopColor="#1e40af" />
								<stop offset="25%" stopColor="#2563eb" />
								<stop offset="50%" stopColor="#3b82f6" />
								<stop offset="75%" stopColor="#2563eb" />
								<stop offset="100%" stopColor="#1e40af" />
							</linearGradient>
						</defs>

						{/* Valve top */}
						<rect
							x="10"
							y="0"
							width="12"
							height="12"
							rx="2"
							fill="#6b7280"
						/>
						<rect
							x="8"
							y="10"
							width="16"
							height="8"
							rx="2"
							fill="#4b5563"
						/>

						{/* Tank body */}
						<rect
							x="2"
							y="18"
							width="28"
							height="160"
							rx="6"
							fill={`url(#cyl-grad-${i})`}
						/>

						{/* Bottom rounded */}
						<ellipse cx="16" cy="175" rx="14" ry="6" fill="#1e40af" />

						{/* Highlight */}
						<rect
							x="7"
							y="25"
							width="5"
							height="140"
							rx="2.5"
							fill="rgba(255,255,255,0.25)"
						/>
					</svg>
				))}
			</div>
			<p className="font-poppins text-[24px] text-[#4a90e2] mt-2">{label}</p>
			<p className="text-[20px] font-bold font-poppins text-[#4a90e2]">
				{pressure} Bar
			</p>
		</div>
	);
};
