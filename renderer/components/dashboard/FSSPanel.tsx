import React from 'react';
import { cn } from '../utils';
import { FSSIndicator } from '../ui/FSSIndicator';

export interface FSSPanelProps {
	isDark?: boolean;
	mainLevel: number;
	mainPressure: number;
	mainActive: boolean;
	anteLevel: number;
	antePressure: number;
	anteActive: boolean;
	anteWarning: boolean;
	className?: string;
}

/**
 * FSSPanel - Fire Suppression System panel with Main and Ante FSS
 */
export const FSSPanel: React.FC<FSSPanelProps> = ({
	isDark = true,
	mainLevel,
	mainPressure,
	mainActive,
	anteLevel,
	antePressure,
	anteActive,
	anteWarning,
	className,
}) => {
	return (
		<div className={cn('flex gap-8 justify-center', className)}>
			{/* Ante FSS */}
			<FSSIndicator
				label="Ante"
				level={anteLevel}
				pressure={antePressure}
				isActive={anteActive}
				hasWarning={anteWarning}
				warningPressure={50}
				isDark={isDark}
			/>

			{/* SVG Pipe connection between FSS units */}
			<svg
				width="60"
				height="200"
				viewBox="0 0 60 200"
				className="self-center">
				<path
					d="M 0 100 L 60 100"
					stroke="#4a90e2"
					strokeWidth="6"
					fill="none"
				/>
			</svg>

			{/* Main FSS */}
			<FSSIndicator
				label="Main"
				level={mainLevel}
				pressure={mainPressure}
				isActive={mainActive}
				isDark={isDark}
			/>
		</div>
	);
};
