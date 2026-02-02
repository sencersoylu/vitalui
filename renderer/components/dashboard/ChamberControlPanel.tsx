import React from 'react';
import { useDashboardStore } from '../../store';
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
				<Button
					variant={autoMode ? 'danger' : 'success'}
					size="lg"
					fullWidth
					onClick={onAutoToggle}>
					{autoMode ? 'Manual' : 'Automatic'}
				</Button>

				<Button
					variant={airMode ? 'info' : 'success'}
					size="lg"
					fullWidth
					onClick={onAirToggle}>
					{airMode ? 'Oxygen' : 'Air'}
				</Button>

				<Button
					variant={
						ventilMode === 0
							? 'success'
							: ventilMode === 1
							? 'danger'
							: 'warning'
					}
					size="lg"
					fullWidth
					onClick={onVentilToggle}>
					{ventilMode === 0 ? 'Ventilation' : ventilMode === 1 ? 'Low' : 'High'}
				</Button>

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
