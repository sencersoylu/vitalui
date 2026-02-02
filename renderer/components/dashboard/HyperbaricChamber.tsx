import React from 'react';
import { cn } from '../utils';

export interface HyperbaricChamberProps {
	isDark?: boolean;
	className?: string;
}

interface ChamberSection {
	topNumber: number;
	bottomNumber: number;
}

/**
 * HyperbaricChamber - Visual representation of hyperbaric chamber layout
 *
 * Shows the multi-section chamber with numbered compartments
 */
export const HyperbaricChamber: React.FC<HyperbaricChamberProps> = ({
	isDark = true,
	className,
}) => {
	const sections: ChamberSection[] = [
		{ topNumber: 1, bottomNumber: 7 },
		{ topNumber: 1, bottomNumber: 2 },
		{ topNumber: 2, bottomNumber: 8 },
		{ topNumber: 3, bottomNumber: 9 },
		{ topNumber: 4, bottomNumber: 10 },
		{ topNumber: 5, bottomNumber: 11 },
		{ topNumber: 6, bottomNumber: 12 },
	];

	return (
		<div className={cn('relative', className)}>
			{/* Main chamber body - outer shell */}
			<div
				className={cn(
					'rounded-2xl border-2 p-3 relative',
					isDark
						? 'bg-slate-800/30 border-slate-600/40'
						: 'bg-slate-200/50 border-slate-400/50'
				)}>
				{/* Chamber sections grid */}
				<div className="grid grid-cols-7 gap-2">
					{sections.map((section, index) => (
						<ChamberSection
							key={index}
							topNumber={section.topNumber}
							bottomNumber={section.bottomNumber}
							isDark={isDark}
						/>
					))}
				</div>

				{/* End caps */}
				<div
					className={cn(
						'absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-24 rounded-full',
						isDark ? 'bg-slate-700' : 'bg-slate-400'
					)}
				/>
				<div
					className={cn(
						'absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-24 rounded-full',
						isDark ? 'bg-slate-700' : 'bg-slate-400'
					)}
				/>
			</div>

			{/* Base platform */}
			<div
				className={cn(
					'w-full h-2 rounded-full mt-2',
					isDark ? 'bg-slate-700/50' : 'bg-slate-400/50'
				)}
			/>
		</div>
	);
};

interface ChamberSectionProps {
	topNumber: number;
	bottomNumber: number;
	isDark: boolean;
}

const ChamberSection: React.FC<ChamberSectionProps> = ({
	topNumber,
	bottomNumber,
	isDark,
}) => {
	return (
		<div className="flex flex-col items-center gap-2">
			{/* Top compartment */}
			<div
				className={cn(
					'w-10 h-16 rounded-lg border relative flex flex-col items-center justify-between py-1',
					isDark
						? 'bg-slate-700/50 border-slate-600/50'
						: 'bg-slate-300/50 border-slate-400/50'
				)}>
				{/* Window/view port */}
				<div
					className={cn(
						'w-6 h-8 rounded-full',
						isDark ? 'bg-sky-900/50' : 'bg-sky-200/50'
					)}
				/>
				{/* Bottom number */}
				<span className="text-white text-lg font-semibold">
					{topNumber}
				</span>
			</div>

			{/* Bottom compartment */}
			<div
				className={cn(
					'w-10 h-16 rounded-lg border relative flex flex-col items-center justify-between py-1',
					isDark
						? 'bg-slate-700/50 border-slate-600/50'
						: 'bg-slate-300/50 border-slate-400/50'
				)}>
				{/* Window/view port */}
				<div
					className={cn(
						'w-6 h-8 rounded-full',
						isDark ? 'bg-sky-900/50' : 'bg-sky-200/50'
					)}
				/>
				{/* Bottom number */}
				<span className="text-white text-lg font-semibold">
					{bottomNumber}
				</span>
			</div>
		</div>
	);
};
