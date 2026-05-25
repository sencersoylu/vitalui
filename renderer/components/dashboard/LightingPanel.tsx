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

	return (
		<Card title={t('lighting')} className="flex-1" isDark={isDark}>
			<div className="flex flex-col justify-center h-full gap-6">
				{/* Main Light */}
				<div className="flex items-center gap-3">
					<span
						className={`text-base font-semibold uppercase tracking-wider w-14 shrink-0 transition-colors duration-500 ${
							isDark ? 'text-white/60' : 'text-slate-500'
						}`}>
						{t('mainShort')}
					</span>
					<ToggleSwitch
						value={lightStatus}
						states={lightStates}
						onValueChange={onMainLightChange}
						isDark={isDark}
					/>
				</div>

				{/* Ante Light */}
				<div className="flex items-center gap-3">
					<span
						className={`text-base font-semibold uppercase tracking-wider w-14 shrink-0 transition-colors duration-500 ${
							isDark ? 'text-white/60' : 'text-slate-500'
						}`}>
						{t('anteShort')}
					</span>
					<ToggleSwitch
						value={light2Status}
						states={lightStates}
						onValueChange={onAnteLightChange}
						isDark={isDark}
					/>
				</div>
			</div>
		</Card>
	);
}
