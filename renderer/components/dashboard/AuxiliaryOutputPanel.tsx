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
}: {
	isDark: boolean;
	onValve1Toggle: () => void;
	onValve2Toggle: () => void;
}) {
	const { valve1Status, valve2Status } = useDashboardStore();

	return (
		<Card title="Auxiliary Output" className="h-full" isDark={isDark}>
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
