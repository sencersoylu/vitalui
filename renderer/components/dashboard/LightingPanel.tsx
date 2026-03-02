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
			<div className="flex flex-col justify-center h-full gap-6">
				{/* Main Light */}
				<div className="flex items-center gap-3">
					<span
						className={`text-base font-semibold uppercase tracking-wider w-14 shrink-0 transition-colors duration-500 ${
							isDark ? 'text-white/60' : 'text-slate-500'
						}`}>
						Main
					</span>
					<ToggleSwitch
						value={lightStatus}
						states={LIGHT_STATES}
						onClick={onMainLightToggle}
						isDark={isDark}
					/>
				</div>

				{/* Ante Light */}
				<div className="flex items-center gap-3">
					<span
						className={`text-base font-semibold uppercase tracking-wider w-14 shrink-0 transition-colors duration-500 ${
							isDark ? 'text-white/60' : 'text-slate-500'
						}`}>
						Ante
					</span>
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
