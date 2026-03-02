import React from 'react';
import { useDashboardStore } from '../../store';
import { ToggleSwitch, TOGGLE_COLORS } from '../ui/ToggleSwitch';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Monitor } from 'lucide-react';

/**
 * ChamberControlPanel - Controls for chamber automation and modes
 */
export function ChamberControlPanel({
	isDark,
	onAutoToggle,
	onAirToggle,
	onVentilToggle,
	onOpenChiller,
}: {
	isDark: boolean;
	onAutoToggle: () => void;
	onAirToggle: () => void;
	onVentilToggle: () => void;
	onOpenChiller: () => void;
}) {
	const {
		autoMode,
		airMode,
		ventilMode,
		chillerRunning,
		chillerCurrentTemp,
	} = useDashboardStore();

	return (
		<Card title="Chamber Control" className="h-full" isDark={isDark}>
			<div className="flex flex-col justify-between h-full gap-4">
				<ToggleSwitch
					value={autoMode ? 0 : 1}
					states={[
						{ label: 'Manual', color: TOGGLE_COLORS.red },
						{ label: 'Automatic', color: TOGGLE_COLORS.emerald },
					]}
					onClick={onAutoToggle}
					isDark={isDark}
				/>

				<ToggleSwitch
					value={airMode ? 1 : 0}
					states={[
						{ label: 'Air', color: TOGGLE_COLORS.emerald },
						{ label: 'Oxygen', color: TOGGLE_COLORS.blue },
					]}
					onClick={onAirToggle}
					isDark={isDark}
				/>

				<ToggleSwitch
					value={ventilMode}
					states={[
						{ label: 'Off', color: TOGGLE_COLORS.grey },
						{ label: 'Low', color: TOGGLE_COLORS.red },
						{ label: 'High', color: TOGGLE_COLORS.amber },
					]}
					onClick={onVentilToggle}
					isDark={isDark}
				/>

				<Button
					variant={chillerRunning ? 'info' : 'muted'}
					size="lg"
					fullWidth
					onClick={onOpenChiller}
					leftIcon={<Monitor className="w-5 h-5" />}>
					Chiller{' '}
					{chillerRunning ? `${chillerCurrentTemp.toFixed(1)}°C` : 'Off'}
				</Button>
			</div>
		</Card>
	);
}
