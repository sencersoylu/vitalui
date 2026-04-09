import React from 'react';
import { useDashboardStore } from '../../store';
import { Card } from '../ui/Card';
import { cn } from '../utils';

function FlameIcon({ active, isDark }: { active: boolean; isDark: boolean }) {
	return (
		<svg
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(
				'transition-all duration-500',
				active && 'drop-shadow-[0_0_12px_rgba(239,68,68,0.7)]'
			)}
		>
			{/* Outer flame */}
			<path
				d="M20 4C20 4 10 16 10 24C10 29.5 14.5 34 20 34C25.5 34 30 29.5 30 24C30 16 20 4 20 4Z"
				className={cn(
					'transition-all duration-500',
					active
						? 'fill-red-500'
						: isDark ? 'fill-white/15' : 'fill-slate-300'
				)}
			/>
			{/* Inner flame */}
			<path
				d="M20 14C20 14 15 22 15 26C15 28.8 17.2 31 20 31C22.8 31 25 28.8 25 26C25 22 20 14 20 14Z"
				className={cn(
					'transition-all duration-500',
					active
						? 'fill-orange-400'
						: isDark ? 'fill-white/8' : 'fill-slate-200'
				)}
			/>
			{/* Core */}
			<path
				d="M20 22C20 22 18 25 18 27C18 28.1 18.9 29 20 29C21.1 29 22 28.1 22 27C22 25 20 22 20 22Z"
				className={cn(
					'transition-all duration-500',
					active
						? 'fill-yellow-300'
						: isDark ? 'fill-white/5' : 'fill-slate-100'
				)}
			/>
		</svg>
	);
}

function SmokeIcon({ active, isDark }: { active: boolean; isDark: boolean }) {
	return (
		<svg
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(
				'transition-all duration-500',
				active && 'drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]'
			)}
		>
			{/* Smoke wisps */}
			<path
				d="M14 28C14 28 12 24 14 22C16 20 14 18 14 18"
				className={cn(
					'transition-all duration-500',
					active
						? 'stroke-amber-400'
						: isDark ? 'stroke-white/20' : 'stroke-slate-300'
				)}
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M20 26C20 26 18 22 20 20C22 18 20 16 20 16"
				className={cn(
					'transition-all duration-500',
					active
						? 'stroke-amber-500'
						: isDark ? 'stroke-white/20' : 'stroke-slate-300'
				)}
				strokeWidth="2.5"
				strokeLinecap="round"
			/>
			<path
				d="M26 28C26 28 24 24 26 22C28 20 26 18 26 18"
				className={cn(
					'transition-all duration-500',
					active
						? 'stroke-amber-400'
						: isDark ? 'stroke-white/20' : 'stroke-slate-300'
				)}
				strokeWidth="2"
				strokeLinecap="round"
			/>
			{/* Detector base */}
			<rect
				x="10"
				y="30"
				width="20"
				height="4"
				rx="2"
				className={cn(
					'transition-all duration-500',
					active
						? 'fill-amber-500/60'
						: isDark ? 'fill-white/10' : 'fill-slate-300'
				)}
			/>
			{/* Detector dot */}
			<circle
				cx="20"
				cy="32"
				r="1.5"
				className={cn(
					'transition-all duration-500',
					active
						? 'fill-red-500'
						: isDark ? 'fill-white/20' : 'fill-slate-400'
				)}
			/>
		</svg>
	);
}

function AirPressureIcon({ ok, isDark }: { ok: boolean; isDark: boolean }) {
	return (
		<svg
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(
				'transition-all duration-500',
				ok
					? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
					: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
			)}
		>
			{/* Tank body */}
			<rect
				x="12"
				y="8"
				width="16"
				height="24"
				rx="4"
				className={cn(
					'transition-all duration-500',
					ok
						? isDark ? 'fill-cyan-500/25 stroke-cyan-400' : 'fill-cyan-100 stroke-cyan-500'
						: isDark ? 'fill-red-500/20 stroke-red-400' : 'fill-red-100 stroke-red-500'
				)}
				strokeWidth="1.5"
			/>
			{/* Pressure gauge circle */}
			<circle
				cx="20"
				cy="20"
				r="5"
				className={cn(
					'transition-all duration-500',
					ok
						? isDark ? 'fill-cyan-500/40 stroke-cyan-300' : 'fill-cyan-200 stroke-cyan-500'
						: isDark ? 'fill-red-500/40 stroke-red-300' : 'fill-red-200 stroke-red-500'
				)}
				strokeWidth="1"
			/>
			{/* Gauge needle */}
			<line
				x1="20"
				y1="20"
				x2={ok ? '23' : '17'}
				y2={ok ? '17' : '17'}
				className={cn(
					'transition-all duration-500',
					ok
						? 'stroke-cyan-300'
						: 'stroke-red-400'
				)}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			{/* Valve on top */}
			<rect
				x="18"
				y="4"
				width="4"
				height="5"
				rx="1"
				className={cn(
					'transition-all duration-500',
					ok
						? isDark ? 'fill-cyan-400/60' : 'fill-cyan-400'
						: isDark ? 'fill-red-400/60' : 'fill-red-400'
				)}
			/>
			{/* Valve wheel */}
			<line x1="16" y1="5" x2="24" y2="5"
				className={cn(
					'transition-all duration-500',
					ok ? 'stroke-cyan-400' : 'stroke-red-400'
				)}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function O2PressureIcon({ ok, isDark }: { ok: boolean; isDark: boolean }) {
	return (
		<svg
			width="40"
			height="40"
			viewBox="0 0 40 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={cn(
				'transition-all duration-500',
				ok
					? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
					: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
			)}
		>
			{/* O2 cylinder */}
			<rect
				x="11"
				y="10"
				width="18"
				height="22"
				rx="5"
				className={cn(
					'transition-all duration-500',
					ok
						? isDark ? 'fill-blue-500/25 stroke-blue-400' : 'fill-blue-100 stroke-blue-500'
						: isDark ? 'fill-red-500/20 stroke-red-400' : 'fill-red-100 stroke-red-500'
				)}
				strokeWidth="1.5"
			/>
			{/* O₂ text centered */}
			<text
				x="20"
				y="24"
				textAnchor="middle"
				className={cn(
					'transition-all duration-500 text-[11px] font-bold',
					ok
						? isDark ? 'fill-blue-300' : 'fill-blue-600'
						: isDark ? 'fill-red-300' : 'fill-red-600'
				)}
			>
				O
				<tspan dy="2" className="text-[8px]">2</tspan>
			</text>
			{/* Valve on top */}
			<rect
				x="17"
				y="5"
				width="6"
				height="6"
				rx="1.5"
				className={cn(
					'transition-all duration-500',
					ok
						? isDark ? 'fill-blue-400/50 stroke-blue-400' : 'fill-blue-200 stroke-blue-500'
						: isDark ? 'fill-red-400/50 stroke-red-400' : 'fill-red-200 stroke-red-500'
				)}
				strokeWidth="1"
			/>
			{/* Valve handle */}
			<line x1="15" y1="6.5" x2="25" y2="6.5"
				className={cn(
					'transition-all duration-500',
					ok ? 'stroke-blue-400' : 'stroke-red-400'
				)}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function DetectorItem({
	icon,
	label,
	sublabel,
	active,
	isDark,
}: {
	icon: React.ReactNode;
	label: string;
	sublabel: string;
	active: boolean;
	isDark: boolean;
}) {
	return (
		<div
			className={cn(
				'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500',
				active
					? isDark
						? 'bg-red-500/15 ring-1 ring-red-500/30'
						: 'bg-red-50 ring-1 ring-red-200'
					: isDark
						? 'bg-white/5'
						: 'bg-slate-100/60'
			)}
		>
			{icon}
			<div className="flex-1 min-w-0">
				<p
					className={cn(
						'text-sm font-semibold tracking-wide transition-colors duration-500',
						isDark ? 'text-white/80' : 'text-slate-700'
					)}
				>
					{label}
				</p>
				<p
					className={cn(
						'text-xs transition-colors duration-500',
						isDark ? 'text-white/40' : 'text-slate-400'
					)}
				>
					{sublabel}
				</p>
			</div>
			<div
				className={cn(
					'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-500',
					active
						? 'bg-red-500 text-white animate-pulse'
						: isDark
							? 'bg-emerald-500/20 text-emerald-400'
							: 'bg-emerald-100 text-emerald-600'
				)}
			>
				{active ? 'ALARM' : 'OK'}
			</div>
		</div>
	);
}

function PressureItem({
	icon,
	label,
	value,
	unit,
	ok,
	isDark,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	unit: string;
	ok: boolean;
	isDark: boolean;
}) {
	return (
		<div
			className={cn(
				'flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-500',
				!ok
					? isDark
						? 'bg-red-500/15 ring-1 ring-red-500/30'
						: 'bg-red-50 ring-1 ring-red-200'
					: isDark
						? 'bg-white/5'
						: 'bg-slate-100/60'
			)}
		>
			{icon}
			<div className="flex-1 min-w-0">
				<p
					className={cn(
						'text-sm font-semibold tracking-wide transition-colors duration-500',
						isDark ? 'text-white/80' : 'text-slate-700'
					)}
				>
					{label}
				</p>
			</div>
			<div
				className={cn(
					'px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-all duration-500',
					ok
						? isDark
							? 'bg-emerald-500/20 text-emerald-400'
							: 'bg-emerald-100 text-emerald-600'
						: 'bg-red-500 text-white animate-pulse'
				)}
			>
				{value} {unit}
			</div>
		</div>
	);
}

export function DetectorPanel({ isDark }: { isDark: boolean }) {
	const {
		mainFlameDetected,
		mainSmokeDetected,
		anteSmokeDetected,
		airTankPressure,
		primaryO2Pressure,
	} = useDashboardStore();

	const airOk = airTankPressure >= 6;
	const o2Ok = primaryO2Pressure >= 4;

	return (
		<Card title="Safety Status" className="h-full" isDark={isDark}>
			<div className="flex flex-col justify-center h-full gap-2">
				<DetectorItem
					icon={<FlameIcon active={mainFlameDetected} isDark={isDark} />}
					label="Flame"
					sublabel="Main Chamber"
					active={mainFlameDetected}
					isDark={isDark}
				/>
				<DetectorItem
					icon={<SmokeIcon active={mainSmokeDetected} isDark={isDark} />}
					label="Smoke"
					sublabel="Main Chamber"
					active={mainSmokeDetected}
					isDark={isDark}
				/>
				<DetectorItem
					icon={<SmokeIcon active={anteSmokeDetected} isDark={isDark} />}
					label="Smoke"
					sublabel="Ante Chamber"
					active={anteSmokeDetected}
					isDark={isDark}
				/>

				{/* Divider */}
				<div
					className={cn(
						'border-t my-1 transition-colors duration-500',
						isDark ? 'border-white/10' : 'border-slate-200'
					)}
				/>

				<PressureItem
					icon={<AirPressureIcon ok={airOk} isDark={isDark} />}
					label="Air Pressure"
					value={airTankPressure}
					unit="bar"
					ok={airOk}
					isDark={isDark}
				/>
				<PressureItem
					icon={<O2PressureIcon ok={o2Ok} isDark={isDark} />}
					label="O₂ Pressure"
					value={primaryO2Pressure}
					unit="bar"
					ok={o2Ok}
					isDark={isDark}
				/>
			</div>
		</Card>
	);
}
