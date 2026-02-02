import React from 'react';
import { useDashboardStore } from '../../store';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Wind } from 'lucide-react';

/**
 * FanPanel - Controls for main chamber fan
 */
export function FanPanel({ isDark, onFanToggle }: { isDark: boolean; onFanToggle: () => void }) {
	const { fan1Status } = useDashboardStore();

	const getFanVariant = (status: number) => {
		if (status === 0) return 'muted';
		if (status === 1) return 'info';
		if (status === 2) return 'warning';
		return 'danger';
	};

	const getFanLabel = (status: number) => {
		if (status === 0) return 'Off';
		if (status === 1) return 'Low';
		if (status === 2) return 'Medium';
		return 'High';
	};

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
				<Button
					variant={getFanVariant(fan1Status)}
					size="lg"
					fullWidth
					leftIcon={<Wind className="w-5 h-5" />}
					onClick={onFanToggle}>
					{getFanLabel(fan1Status)}
				</Button>
			</div>
		</Card>
	);
}
