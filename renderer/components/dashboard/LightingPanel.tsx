import React from 'react';
import { useDashboardStore } from '../../store';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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

	const getLightVariant = (status: number) => {
		if (status === 0) return 'muted';
		if (status === 1) return 'info';
		if (status === 2) return 'warning';
		return 'danger';
	};

	const getLightLabel = (status: number) => {
		if (status === 0) return 'Off';
		if (status === 1) return 'Low';
		if (status === 2) return 'Medium';
		return 'High';
	};

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
					<Button
						variant={getLightVariant(lightStatus)}
						size="lg"
						fullWidth
						onClick={onMainLightToggle}>
						{getLightLabel(lightStatus)}
					</Button>
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
					<Button
						variant={getLightVariant(light2Status)}
						size="lg"
						fullWidth
						onClick={onAnteLightToggle}>
						{getLightLabel(light2Status)}
					</Button>
				</div>
			</div>
		</Card>
	);
}
