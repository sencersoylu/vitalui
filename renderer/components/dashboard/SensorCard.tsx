import React from 'react';
import { cn } from '../utils';

interface SensorCardProps {
	name: string;
	location: string;
	value?: string;
	unit?: string;
	isAlarm?: boolean;
	isPlaceholder?: boolean;
	isDark?: boolean;
	isFire?: boolean;
	className?: string;
}

export function SensorCard({
	name,
	location,
	value,
	unit,
	isAlarm = false,
	isPlaceholder = false,
	isDark = true,
	isFire = false,
	className,
}: SensorCardProps) {
	const hasValue = value !== undefined;

	const accentColor = isAlarm
		? 'bg-red-500'
		: hasValue
			? 'bg-blue-500'
			: isFire
				? 'bg-orange-500'
				: 'bg-emerald-500';

	const glowColor = isAlarm
		? 'shadow-red-500/20'
		: hasValue
			? 'shadow-blue-500/10'
			: isFire
				? 'shadow-orange-500/10'
				: 'shadow-emerald-500/10';

	return (
		<div
			className={cn(
				'group relative flex items-center gap-3 rounded-xl border pl-0 pr-4 py-3 transition-all duration-300 backdrop-blur-xl overflow-hidden',
				'hover:translate-x-1 hover:shadow-lg',
				isDark
					? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07]'
					: 'bg-white/60 border-slate-200/80 hover:bg-white/90',
				isAlarm && cn('border-red-500/30', isDark ? 'bg-red-500/[0.06]' : 'bg-red-50/80'),
				`hover:${glowColor}`,
				className
			)}>

			{/* Left accent bar */}
			<div className={cn(
				'w-1 self-stretch rounded-r-full shrink-0 transition-all duration-300',
				accentColor,
				isAlarm ? 'opacity-100' : 'opacity-40 group-hover:opacity-80'
			)} />

			{/* Status ring */}
			<div className="relative shrink-0">
				<div className={cn(
					'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
					isAlarm
						? 'bg-red-500/15'
						: hasValue
							? 'bg-blue-500/10'
							: isFire
								? 'bg-orange-500/10'
								: 'bg-emerald-500/10'
				)}>
					<div className={cn(
						'w-2.5 h-2.5 rounded-full transition-all duration-300',
						isAlarm
							? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
							: hasValue
								? 'bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]'
								: isFire
									? 'bg-orange-400 shadow-[0_0_6px_rgba(251,146,60,0.4)]'
									: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]'
					)} />
				</div>
				{/* Pulse ring for alarm */}
				{isAlarm && (
					<div className="absolute inset-0 rounded-full border-2 border-red-500/40 animate-ping" />
				)}
			</div>

			{/* Text */}
			<div className="flex-1 min-w-0">
				<h3 className={cn(
					'font-medium text-[13px] leading-tight truncate transition-colors duration-300',
					isDark
						? isAlarm ? 'text-red-200' : 'text-white/90 group-hover:text-white'
						: isAlarm ? 'text-red-800' : 'text-slate-800'
				)}>
					{name}
				</h3>
			</div>

			{/* Right side: value or status label */}
			{hasValue ? (
				<div className={cn(
					'text-right shrink-0',
				)}>
					<span className={cn(
						'text-sm font-bold tabular-nums',
						isDark ? 'text-blue-300' : 'text-blue-600'
					)}>
						{value}
					</span>
					{unit && (
						<span className={cn(
							'text-[10px] font-medium ml-0.5',
							isDark ? 'text-blue-400/60' : 'text-blue-500/60'
						)}>
							{unit}
						</span>
					)}
				</div>
			) : (
				<span className={cn(
					'text-[10px] font-semibold uppercase tracking-wider shrink-0 transition-colors duration-300',
					isAlarm
						? 'text-red-400'
						: isDark
							? 'text-white/25 group-hover:text-white/40'
							: 'text-slate-400'
				)}>
					{isAlarm ? 'ALARM' : 'OK'}
				</span>
			)}

			{/* Alarm shimmer effect */}
			{isAlarm && (
				<div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
					<div className="absolute -inset-full bg-gradient-to-r from-transparent via-red-500/[0.04] to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
				</div>
			)}
		</div>
	);
}
