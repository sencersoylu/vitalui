import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Monitor } from 'lucide-react';
import { useT } from '../../i18n/dashboardI18n';

/**
 * ChamberControlPanel - Controls for chamber automation and modes
 */
export function ChamberControlPanel({
	isDark,
	onAutoToggle,
	onAirToggle,
	onVentilToggle,
	onVentilChange,
	onOpenChiller,
}: {
	isDark: boolean;
	onAutoToggle: () => void;
	onAirToggle: () => void;
	onVentilToggle: () => void;
	onVentilChange: (mode: number) => void;
	onOpenChiller: () => void;
}) {
	const t = useT();
	const {
		autoMode,
		airMode,
		ventilMode,
		chillerRunning,
		chillerCurrentTemp,
	} = useDashboardStore();

	return (
		<Card title={t('chamberControl')} className="h-full" isDark={isDark}>
			<div className="flex flex-col justify-between h-full gap-4">
				<ToggleSwitch
					value={autoMode ? 0 : 1}
					states={[
						{ label: t('manual'), color: TOGGLE_COLORS.red },
						{ label: t('automatic'), color: TOGGLE_COLORS.emerald },
					]}
					onClick={onAutoToggle}
					isDark={isDark}
				/>

				<ToggleSwitch
					value={airMode ? 1 : 0}
					states={[
						{ label: t('air'), color: TOGGLE_COLORS.blue },
						{ label: t('oxygen'), color: TOGGLE_COLORS.emerald },
					]}
					onClick={onAirToggle}
					isDark={isDark}
					disabled={!autoMode}
				/>

				<ToggleSwitch
					value={ventilMode}
					states={[
						{ label: <span className="flex flex-col items-center leading-tight"><span className="text-[10px] opacity-70">{t('ventil')}</span><span>{t('off')}</span></span>, color: TOGGLE_COLORS.grey },
						{ label: t('low'), color: TOGGLE_COLORS.blue },
						{ label: t('high'), color: TOGGLE_COLORS.blue },
					]}
					onValueChange={onVentilChange}
					isDark={isDark}
					disabled={autoMode}
				/>

				{/* Chiller — pill-shaped (rounded-full) like the toggles above,
				    but still a Button with Monitor icon and label so it reads
				    as the "open settings" action. */}
				<Button
					variant={chillerRunning ? 'info' : 'muted'}
					size="lg"
					fullWidth
					onClick={onOpenChiller}
					leftIcon={<Monitor className="w-5 h-5" />}
					className="!rounded-full">
					{t('chiller')}{' '}
					{chillerRunning ? `${(chillerCurrentTemp ?? 0).toFixed(1)}°C` : t('off')}
				</Button>
			</div>
		</Card>
	);
}
