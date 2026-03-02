import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Card } from '../ui/Card';

const LIGHT_STATES = [
	{ label: 'Off', color: TOGGLE_COLORS.grey },
	{ label: 'Low', color: TOGGLE_COLORS.blue },
	{ label: 'Med', color: TOGGLE_COLORS.amber },
	{ label: 'High', color: TOGGLE_COLORS.red },
];

/**
 * LightingPanel - Controls for Main and Ante chamber lighting
 */
export function LightingPanel({
	isDark,
	onMainLightToggle,
	onAnteLightToggle,
}: {
	isDark: boolean;
	onMainLightToggle: () => void;
	onAnteLightToggle: () => void;
}) {
	const { lightStatus, light2Status } = useDashboardStore();

	return (
		<Card title="Lighting" className="flex-1" isDark={isDark}>
			<div className="flex gap-8">
				{/* Main Light */}
				<div className="flex-1 space-y-3">
					<div className="text-center">
						<span
							className={`text-xl font-semibold uppercase tracking-wider transition-colors duration-500 ${
								isDark ? 'text-white/80' : 'text-slate-600'
							}`}>
							Main
						</span>
					</div>
					<ToggleSwitch
						value={lightStatus}
						states={LIGHT_STATES}
						onClick={onMainLightToggle}
						isDark={isDark}
					/>
				</div>

				{/* Ante Light */}
				<div className="flex-1 space-y-3">
					<div className="text-center">
						<span
							className={`text-xl font-semibold uppercase tracking-wider transition-colors duration-500 ${
								isDark ? 'text-white/80' : 'text-slate-600'
							}`}>
							Ante
						</span>
					</div>
					<ToggleSwitch
						value={light2Status}
						states={LIGHT_STATES}
						onClick={onAnteLightToggle}
						isDark={isDark}
					/>
				</div>
			</div>
		</Card>
	);
}
