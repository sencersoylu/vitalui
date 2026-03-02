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
			<div className="flex items-center justify-center h-full gap-3">
				<span
					className={`text-base font-semibold uppercase tracking-wider w-14 shrink-0 transition-colors duration-500 ${
						isDark ? 'text-white/60' : 'text-slate-500'
					}`}>
					Main
				</span>
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
