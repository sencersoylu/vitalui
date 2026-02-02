import React from 'react';
import { cn } from '../utils';

export interface CylinderBankProps {
	cylinderCount?: number;
	isDark?: boolean;
	className?: string;
}

/**
 * CylinderBank - Visual representation of high pressure O2 cylinders
 *
 * Shows a bank of vertical cylinders for high pressure storage
 */
export const CylinderBank: React.FC<CylinderBankProps> = ({
	cylinderCount = 8,
	isDark = true,
	className,
}) => {
	return (
		<div className={cn('relative', className)}>
			{/* Label */}
			<p
				className={cn(
					'text-lg font-medium mb-3',
					isDark ? 'text-sky-400' : 'text-sky-600'
				)}>
				High Pressure Cylinders
			</p>

			{/* Cylinders container */}
			<div className="flex gap-1.5">
				{[...Array(cylinderCount)].map((_, i) => (
					<div key={i} className="relative flex flex-col items-center">
						{/* Valve/gauge at top */}
						<div
							className={cn(
								'w-4 h-3 rounded-t-sm mb-0.5',
								isDark ? 'bg-slate-600' : 'bg-slate-500'
							)}
						/>

						{/* Main cylinder body */}
						<div
							className={cn(
								'w-6 h-24 rounded-b-lg border relative overflow-hidden',
								isDark
									? 'bg-slate-700/50 border-slate-600/50'
									: 'bg-slate-300/50 border-slate-400/50'
							)}>
							{/* Content fill effect */}
							<div className="absolute bottom-0 left-0 right-0 h-3/4 bg-gradient-to-t from-sky-500/40 to-sky-500/10" />

							{/* Horizontal rings */}
							<div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-500/30" />
							<div className="absolute top-8 left-0 right-0 h-0.5 bg-slate-500/30" />
							<div className="absolute top-12 left-0 right-0 h-0.5 bg-slate-500/30" />
							<div className="absolute top-16 left-0 right-0 h-0.5 bg-slate-500/30" />
						</div>

						{/* Base */}
						<div
							className={cn(
								'w-8 h-2 rounded-sm -mt-0.5',
								isDark ? 'bg-slate-600' : 'bg-slate-500'
							)}
						/>
					</div>
				))}
			</div>

			{/* Platform base */}
			<div
				className={cn(
					'w-full h-2 rounded-full mt-2',
					isDark ? 'bg-slate-700' : 'bg-slate-400'
				)}
			/>
		</div>
	);
};
