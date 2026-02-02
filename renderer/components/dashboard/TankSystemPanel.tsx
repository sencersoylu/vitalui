import React from 'react';
import { cn } from '../utils';
import { PressureTank } from '../ui/PressureTank';

export interface TankSystemPanelProps {
	isDark?: boolean;
	hpCylinderPressure: number;
	airTankPressure: number;
	nitrogen1Pressure: number;
	nitrogen2Pressure: number;
	className?: string;
}

/**
 * TankSystemPanel - Panel showing all tank systems with piping
 */
export const TankSystemPanel: React.FC<TankSystemPanelProps> = ({
	isDark = true,
	hpCylinderPressure,
	airTankPressure,
	nitrogen1Pressure,
	nitrogen2Pressure,
	className,
}) => {
	return (
		<div className={cn('relative', className)}>
			{/* SVG Piping */}
			<svg
				className="absolute inset-0 w-full h-full pointer-events-none"
				viewBox="0 0 800 400"
				preserveAspectRatio="xMidYMid meet">
				{/* Horizontal main pipe */}
				<path
					d="M 50 200 L 750 200"
					stroke="#4a90e2"
					strokeWidth="6"
					fill="none"
				/>

				{/* Vertical connections to tanks */}
				<path
					d="M 200 200 L 200 100"
					stroke="#4a90e2"
					strokeWidth="6"
					fill="none"
				/>
				<path
					d="M 350 200 L 350 100"
					stroke="#4a90e2"
					strokeWidth="6"
					fill="none"
				/>
				<path
					d="M 500 200 L 500 100"
					stroke="#4a90e2"
					strokeWidth="6"
					fill="none"
				/>
				<path
					d="M 650 200 L 650 100"
					stroke="#4a90e2"
					strokeWidth="6"
					fill="none"
				/>

				{/* Connection nodes */}
				<circle cx="200" cy="200" r="8" fill="#4a90e2" />
				<circle cx="350" cy="200" r="8" fill="#4a90e2" />
				<circle cx="500" cy="200" r="8" fill="#4a90e2" />
				<circle cx="650" cy="200" r="8" fill="#4a90e2" />
			</svg>

			{/* Tank Grid */}
			<div className="flex justify-between items-end pt-[50px]">
				{/* Air Tanks (3x) */}
				<div className="flex gap-4">
					<PressureTank
						type="air"
						pressure={airTankPressure}
						label="Air Tank"
						subLabel="2000 L"
						isDark={isDark}
					/>
					<PressureTank
						type="air"
						pressure={airTankPressure}
						label="Air Tank"
						subLabel="2000 L"
						isDark={isDark}
					/>
					<PressureTank
						type="air"
						pressure={airTankPressure}
						label="Air Tank"
						subLabel="2000 L"
						isDark={isDark}
					/>
				</div>

				{/* Nitrogen Tanks */}
				<div className="flex gap-4">
					<PressureTank
						type="nitrogen"
						pressure={nitrogen1Pressure}
						label="Nitrogen #1"
						isDark={isDark}
					/>
					<PressureTank
						type="nitrogen"
						pressure={nitrogen2Pressure}
						label="Nitrogen #2"
						isDark={isDark}
					/>
				</div>
			</div>

			{/* High Pressure Cylinders - positioned at bottom */}
			<div className="mt-8">
				<PressureTank
					type="cylinder"
					pressure={hpCylinderPressure}
					label="High Pressure Cylinders"
					isDark={isDark}
				/>
			</div>
		</div>
	);
};
