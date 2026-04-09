import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Card } from '../ui/Card';

/**
 * AuxiliaryOutputPanel - Controls for Main and Ante chamber valves
 */
export function AuxiliaryOutputPanel({
	isDark,
	onValve1Toggle,
	onValve2Toggle,
	onHide,
}: {
	isDark: boolean;
	onValve1Toggle: () => void;
	onValve2Toggle: () => void;
	onHide?: () => void;
}) {
	const { valve1Status, valve2Status } = useDashboardStore();

	return (
		<Card
			title="Auxiliary Output"
			className="h-full"
			isDark={isDark}
			headerAction={onHide && (
				<button
					onClick={onHide}
					className={`p-1.5 rounded-lg transition-all duration-300 ${
						isDark
							? 'text-white/40 hover:text-white/80 hover:bg-white/10'
							: 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
					}`}
					title="Hide panel"
				>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
						<line x1="1" y1="1" x2="23" y2="23" />
					</svg>
				</button>
			)}
		>
			<div className="flex flex-col justify-center h-full space-y-6">
				{/* Main Chamber */}
				<div className="space-y-3">
					<div className="flex items-center justify-center gap-3">
						<div className="w-3 h-3 rounded-full bg-indigo-500" />
						<h3
							className={`text-lg font-semibold transition-colors duration-500 ${
								isDark ? 'text-indigo-300' : 'text-indigo-600'
							}`}>
							Main
						</h3>
					</div>
					<ToggleSwitch
						value={valve1Status ? 1 : 0}
						states={[
							{ label: 'Closed', color: TOGGLE_COLORS.grey },
							{ label: 'Open', color: TOGGLE_COLORS.emerald },
						]}
						onClick={onValve1Toggle}
						isDark={isDark}
					/>
				</div>

				{/* Divider */}
				<div
					className={`border-t transition-colors duration-500 ${
						isDark ? 'border-white/10' : 'border-slate-200'
					}`}
				/>

				{/* Ante Chamber */}
				<div className="space-y-3">
					<div className="flex items-center justify-center gap-3">
						<div className="w-3 h-3 rounded-full bg-violet-500" />
						<h3
							className={`text-lg font-semibold transition-colors duration-500 ${
								isDark ? 'text-violet-300' : 'text-violet-600'
							}`}>
							Ante
						</h3>
					</div>
					<ToggleSwitch
						value={valve2Status ? 1 : 0}
						states={[
							{ label: 'Closed', color: TOGGLE_COLORS.grey },
							{ label: 'Open', color: TOGGLE_COLORS.emerald },
						]}
						onClick={onValve2Toggle}
						isDark={isDark}
					/>
				</div>
			</div>
		</Card>
	);
}
