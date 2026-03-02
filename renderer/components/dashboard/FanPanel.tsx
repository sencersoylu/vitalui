import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Card } from '../ui/Card';

const FAN_STATES = [
	{ label: 'Off', color: TOGGLE_COLORS.grey },
	{ label: 'Low', color: TOGGLE_COLORS.blue },
	{ label: 'Med', color: TOGGLE_COLORS.amber },
	{ label: 'High', color: TOGGLE_COLORS.red },
];

/**
 * FanPanel - Controls for main chamber fan
 */
export function FanPanel({ isDark, onFanToggle }: { isDark: boolean; onFanToggle: () => void }) {
	const { fan1Status } = useDashboardStore();

	return (
		<Card title="Fan" className="flex-1" isDark={isDark}>
			<div className="space-y-3">
				<div className="text-center">
					<span
						className={`text-xl font-semibold uppercase tracking-wider transition-colors duration-500 ${
							isDark ? 'text-white/80' : 'text-slate-600'
						}`}>
						Main
					</span>
				</div>
				<ToggleSwitch
					value={fan1Status}
					states={FAN_STATES}
					onClick={onFanToggle}
					isDark={isDark}
				/>
			</div>
		</Card>
	);
}
