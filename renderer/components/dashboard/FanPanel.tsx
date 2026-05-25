import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Card } from '../ui/Card';
import { useT } from '../../i18n/dashboardI18n';

/**
 * FanPanel - Controls for main chamber fan
 */
export function FanPanel({ isDark, onFanChange }: { isDark: boolean; onFanChange: (index: number) => void }) {
	const t = useT();
	const { fan1Status } = useDashboardStore();
	const fanStates = [
		{ label: t('off'), color: TOGGLE_COLORS.grey },
		{ label: t('low'), color: TOGGLE_COLORS.blue },
		{ label: t('med'), color: TOGGLE_COLORS.amber },
		{ label: t('high'), color: TOGGLE_COLORS.red },
	];

	return (
		<Card title={t('fan')} className="flex-1" isDark={isDark}>
			<div className="flex items-center justify-center h-full gap-3">
				<span
					className={`text-base font-semibold shrink-0 whitespace-nowrap transition-colors duration-500 ${
						isDark ? 'text-white/60' : 'text-slate-500'
					}`}>
					{t('mainShort')}
				</span>
				<ToggleSwitch
					value={fan1Status}
					states={fanStates}
					onValueChange={onFanChange}
					isDark={isDark}
				/>
			</div>
		</Card>
	);
}
