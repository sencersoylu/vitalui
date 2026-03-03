import React from 'react';
import { cn } from '../utils';

export const TOGGLE_COLORS = {
	grey: '#94a3b8',
	emerald: '#10b981',
	blue: '#3b82f6',
	amber: '#f59e0b',
	red: '#ef4444',
	violet: '#8b5cf6',
	cyan: '#06b6d4',
	rose: '#f43f5e',
	slate: '#64748b',
	indigo: '#6366f1',
} as const;

interface ToggleSwitchState {
	label: React.ReactNode;
	color: string;
}

interface ToggleSwitchProps {
	value: number;
	states: ToggleSwitchState[];
	onClick?: () => void;
	onValueChange?: (index: number) => void;
	isDark?: boolean;
	className?: string;
}

export function ToggleSwitch({
	value,
	states,
	onClick,
	onValueChange,
	isDark = false,
	className,
}: ToggleSwitchProps) {
	const currentState = states[value] || states[0];
	const count = states.length;

	return (
		<div
			className={cn(
				'relative w-full h-14 rounded-full cursor-pointer overflow-hidden select-none shadow-lg hover:shadow-xl active:scale-[0.98] transition-shadow duration-300',
				isDark ? 'bg-white/10' : 'bg-slate-200/80',
				className,
			)}
			onClick={!onValueChange ? onClick : undefined}
		>
			{/* Sliding highlight pill */}
			<div
				className="absolute top-1 bottom-1 rounded-full shadow-md transition-all duration-300 ease-in-out"
				style={{
					width: `calc(${100 / count}% - 8px)`,
					left: `calc(${(value * 100) / count}% + 4px)`,
					backgroundColor: currentState.color,
				}}
			/>

			{/* Labels - all visible */}
			<div className="relative flex h-full z-10">
				{states.map((state, i) => (
					<div
						key={i}
						onClick={onValueChange ? (e) => { e.stopPropagation(); onValueChange(i); } : undefined}
						className={cn(
							'flex-1 flex items-center justify-center font-semibold transition-colors duration-300 cursor-pointer',
							count <= 2 ? 'text-base tracking-wide' : 'text-sm tracking-normal',
							i === value
								? 'text-white'
								: isDark
								? 'text-white/40'
								: 'text-slate-400',
						)}
					>
						{state.label}
					</div>
				))}
			</div>
		</div>
	);
}
