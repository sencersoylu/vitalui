import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Card } from '../ui/Card';
import { useT } from '../../i18n/dashboardI18n';

/**
 * LightingPanel - Controls for Main and Ante chamber lighting
 */
export function LightingPanel({
	isDark,
	onMainLightChange,
	onAnteLightChange,
}: {
	isDark: boolean;
	onMainLightChange: (index: number) => void;
	onAnteLightChange: (index: number) => void;
}) {
	const t = useT();
	const { lightStatus, light2Status } = useDashboardStore();
	const lightStates = [
		{ label: t('off'), color: TOGGLE_COLORS.grey },
		{ label: t('low'), color: TOGGLE_COLORS.blue },
		{ label: t('med'), color: TOGGLE_COLORS.amber },
		{ label: t('high'), color: TOGGLE_COLORS.red },
	];

	const labelCls = `text-base font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-500 ${
		isDark ? 'text-white/60' : 'text-slate-500'
	}`;

	return (
		<Card title={t('lighting')} className="flex-1" isDark={isDark}>
			{/* 2-col grid: col 1 (auto) sizes to the longest label across both
			    rows, so Main/Ante stay column-aligned even when the localised
			    label is much wider (e.g. "Principale"). */}
			<div className="grid h-full grid-cols-[auto_1fr] items-center justify-center gap-x-3 gap-y-6">
				<span className={labelCls}>{t('mainShort')}</span>
				<ToggleSwitch
					value={lightStatus}
					states={lightStates}
					onValueChange={onMainLightChange}
					isDark={isDark}
				/>

				<span className={labelCls}>{t('anteShort')}</span>
				<ToggleSwitch
					value={light2Status}
					states={lightStates}
					onValueChange={onAnteLightChange}
					isDark={isDark}
				/>
			</div>
		</Card>
	);
}
