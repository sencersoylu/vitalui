import React, { useEffect } from 'react';
import Head from 'next/head';
import { useDashboardStore } from '../store';
import { cn } from '../components/utils';
import {
	Armchair,
	ShieldCheck,
	ShieldOff,
	UserRound,
	UserX,
	Scan,
	Stethoscope,
	Clock,
	Timer,
	Gauge,
	UserCog,
	HeartPulse,
	HardHat,
	FileText,
} from 'lucide-react';

interface Patient {
	seatNumber: number;
	name?: string;
	age?: number;
	gender?: 'M' | 'F';
	diagnosis?: string;
	isSeated: boolean;
	hasMask: boolean;
}

const mockPatients: Patient[] = [
	{ seatNumber: 1, name: 'James Wilson', age: 45, gender: 'M', diagnosis: 'Decompression Sickness', isSeated: true, hasMask: true },
	{ seatNumber: 2, name: 'Sarah Mitchell', age: 38, gender: 'F', diagnosis: 'Chronic Wound', isSeated: true, hasMask: true },
	{ seatNumber: 3, name: 'Robert Chen', age: 52, gender: 'M', diagnosis: 'Diabetic Foot Ulcer', isSeated: true, hasMask: false },
	{ seatNumber: 4, name: 'Emily Parker', age: 29, gender: 'F', diagnosis: 'CO Poisoning', isSeated: false, hasMask: false },
	{ seatNumber: 5, isSeated: false, hasMask: false },
	{ seatNumber: 6, name: 'Lisa Anderson', age: 34, gender: 'F', diagnosis: 'Radiation Injury', isSeated: true, hasMask: true },
	{ seatNumber: 7, name: 'Michael Ross', age: 47, gender: 'M', diagnosis: 'Gas Gangrene', isSeated: true, hasMask: true },
	{ seatNumber: 8, name: 'Karen White', age: 55, gender: 'F', diagnosis: 'Sudden Hearing Loss', isSeated: true, hasMask: false },
	{ seatNumber: 9, name: 'Thomas Brown', age: 42, gender: 'M', diagnosis: 'Crush Injury', isSeated: false, hasMask: false },
	{ seatNumber: 10, isSeated: false, hasMask: false },
	{ seatNumber: 11, name: 'Richard Hayes', age: 58, gender: 'M', diagnosis: 'Osteomyelitis', isSeated: true, hasMask: true },
	{ seatNumber: 12, name: 'Amanda Clark', age: 26, gender: 'F', diagnosis: 'Thermal Burns', isSeated: true, hasMask: false },
];

function PatientSilhouette({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 120 160" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
			<ellipse cx="60" cy="38" rx="22" ry="26" />
			<rect x="50" y="62" width="20" height="12" rx="4" />
			<path d="M60 74 C60 74, 30 78, 12 98 C4 108, 2 120, 2 135 L2 160 L118 160 L118 135 C118 120, 116 108, 108 98 C90 78, 60 74, 60 74Z" />
		</svg>
	);
}

function getStatusLevel(patient: Patient) {
	if (!patient.name) return 'empty';
	if (patient.isSeated && patient.hasMask) return 'good';
	if (!patient.isSeated) return 'critical';
	return 'warning';
}

function PatientCard({ patient, isDark }: { patient: Patient; isDark: boolean }) {
	const status = getStatusLevel(patient);
	const isEmpty = !patient.name;

	const glowMap = {
		good: isDark ? 'shadow-emerald-500/10' : 'shadow-emerald-500/5',
		warning: isDark ? 'shadow-amber-500/10' : 'shadow-amber-500/5',
		critical: isDark ? 'shadow-rose-500/10' : 'shadow-rose-500/5',
		empty: 'shadow-none',
	};

	const topBarColor = {
		good: 'from-emerald-400 to-emerald-500',
		warning: 'from-amber-400 to-amber-500',
		critical: 'from-rose-400 to-rose-500',
		empty: isDark ? 'from-slate-700 to-slate-700' : 'from-slate-300 to-slate-300',
	};

	if (isEmpty) {
		return (
			<div
				className={cn(
					'relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col',
					isDark
						? 'bg-white/[0.02] border-white/[0.05] border-dashed'
						: 'bg-slate-50/50 border-slate-200/50 border-dashed'
				)}
			>
				<div className={cn('h-1 w-full bg-gradient-to-r', topBarColor.empty)} />
				<PatientSilhouette
					className={cn(
						'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-36 pointer-events-none',
						isDark ? 'text-white/[0.02]' : 'text-slate-900/[0.03]'
					)}
				/>
				<div className="relative flex flex-col flex-1 items-center justify-center p-4 gap-3">
					<div
						className={cn(
							'w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black',
							isDark
								? 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/10'
								: 'bg-slate-100 text-slate-400 ring-1 ring-slate-200'
						)}
					>
						{patient.seatNumber}
					</div>
					<p className={cn('text-[11px]', isDark ? 'text-slate-700' : 'text-slate-300')}>
						Unassigned
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col shadow-lg',
				glowMap[status],
				isDark
					? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14]'
					: 'bg-white/80 border-slate-200/80 hover:bg-white hover:shadow-xl'
			)}
		>
			{/* Top accent bar */}
			<div className={cn('h-1 w-full bg-gradient-to-r', topBarColor[status])} />

			{/* Skeleton silhouette background */}
			<PatientSilhouette
				className={cn(
					'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-36 pointer-events-none',
					isDark ? 'text-white/[0.03]' : 'text-slate-900/[0.04]'
				)}
			/>

			<div className="relative flex flex-col flex-1 p-4">
				{/* Header: seat number + info */}
				<div className="flex items-start gap-3">
					{/* Seat number */}
					<div
						className={cn(
							'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black shrink-0',
							isDark
								? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30'
								: 'bg-indigo-500/10 text-indigo-600 ring-1 ring-indigo-500/20'
						)}
					>
						{patient.seatNumber}
					</div>

					{/* Name & demographics */}
					<div className="min-w-0 flex-1">
						<h3
							className={cn(
								'font-semibold text-sm leading-tight truncate',
								isDark ? 'text-white' : 'text-slate-900'
							)}
						>
							{patient.name}
						</h3>
						<p
							className={cn(
								'text-xs mt-0.5 flex items-center gap-1',
								isDark ? 'text-slate-500' : 'text-slate-400'
							)}
						>
							{patient.age} yrs &middot; {patient.gender === 'M' ? 'Male' : 'Female'}
						</p>
					</div>
				</div>

				{/* Diagnosis */}
				{patient.diagnosis && (
					<div
						className={cn(
							'flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg text-xs',
							isDark
								? 'bg-violet-500/10 text-violet-300'
								: 'bg-violet-50 text-violet-600'
						)}
					>
						<Stethoscope className="w-3.5 h-3.5 shrink-0" />
						<span className="truncate">{patient.diagnosis}</span>
					</div>
				)}

				{/* Spacer */}
				<div className="flex-1" />

				{/* Status chips */}
				<div className="flex flex-col gap-2 mt-3">
					{/* Seated status */}
					<div
						className={cn(
							'flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold',
							patient.isSeated
								? isDark
									? 'bg-emerald-500/10 text-emerald-400'
									: 'bg-emerald-50 text-emerald-700'
								: isDark
									? 'bg-rose-500/10 text-rose-400'
									: 'bg-rose-50 text-rose-600'
						)}
					>
						{patient.isSeated ? (
							<Armchair className="w-5 h-5 shrink-0" />
						) : (
							<UserX className="w-5 h-5 shrink-0" />
						)}
						{patient.isSeated ? 'Seated' : 'Empty'}
					</div>

					{/* Mask status */}
					<div
						className={cn(
							'flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold',
							patient.hasMask
								? isDark
									? 'bg-emerald-500/10 text-emerald-400'
									: 'bg-emerald-50 text-emerald-700'
								: isDark
									? 'bg-rose-500/10 text-rose-400'
									: 'bg-rose-50 text-rose-600'
						)}
					>
						{patient.hasMask ? (
							<ShieldCheck className="w-5 h-5 shrink-0" />
						) : (
							<ShieldOff className="w-5 h-5 shrink-0" />
						)}
						{patient.hasMask ? 'Mask On' : 'No Mask'}
					</div>
				</div>
			</div>
		</div>
	);
}

/* ── Session Panel ── */

const sessionInfo = {
	profileName: 'Standard HBO - 2.4 ATA',
	treatmentDepth: '14 msw / 2.4 ATA',
	startTime: '09:30',
	endTime: '11:15',
	remainingTime: '00:42:18',
	doctor: 'Dr. William Harris',
	operator: 'John Bradley',
	insideAttendant: 'Rachel Green',
};

function SessionInfoItem({
	icon: Icon,
	label,
	value,
	isDark,
	accent,
}: {
	icon: any;
	label: string;
	value: string;
	isDark: boolean;
	accent?: string;
}) {
	const accentColors = {
		cyan: isDark ? 'text-cyan-400 bg-cyan-500/10' : 'text-cyan-600 bg-cyan-50',
		amber: isDark ? 'text-amber-400 bg-amber-500/10' : 'text-amber-600 bg-amber-50',
		emerald: isDark ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50',
		violet: isDark ? 'text-violet-400 bg-violet-500/10' : 'text-violet-600 bg-violet-50',
		rose: isDark ? 'text-rose-400 bg-rose-500/10' : 'text-rose-600 bg-rose-50',
		blue: isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50',
		indigo: isDark ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50',
		orange: isDark ? 'text-orange-400 bg-orange-500/10' : 'text-orange-600 bg-orange-50',
	};
	const color = accentColors[accent] || accentColors.blue;
	const [textColor, bgColor] = color.split(' ');

	return (
		<div className="flex items-center gap-3">
			<div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', bgColor)}>
				<Icon className={cn('w-[18px] h-[18px]', textColor)} />
			</div>
			<div className="min-w-0">
				<p className={cn('text-[11px] uppercase tracking-wider font-medium', isDark ? 'text-slate-500' : 'text-slate-400')}>
					{label}
				</p>
				<p className={cn('text-sm font-semibold truncate', isDark ? 'text-white' : 'text-slate-900')}>
					{value}
				</p>
			</div>
		</div>
	);
}

function SessionInfoPanel({ isDark }: { isDark: boolean }) {
	return (
		<div
			className={cn(
				'rounded-2xl border p-5 w-72 shrink-0 flex flex-col',
				isDark
					? 'bg-white/[0.04] border-white/[0.08]'
					: 'bg-white/80 border-slate-200/80 shadow-sm'
			)}
		>
			<h2 className={cn('text-xs font-bold uppercase tracking-[0.15em] mb-4', isDark ? 'text-slate-400' : 'text-slate-500')}>
				Session Info
			</h2>
			<div className="flex flex-col gap-4">
				<SessionInfoItem icon={FileText} label="Profile" value={sessionInfo.profileName} isDark={isDark} accent="indigo" />
				<SessionInfoItem icon={Gauge} label="Depth" value={sessionInfo.treatmentDepth} isDark={isDark} accent="cyan" />
				<SessionInfoItem icon={Clock} label="Start" value={sessionInfo.startTime} isDark={isDark} accent="emerald" />
				<SessionInfoItem icon={Clock} label="End" value={sessionInfo.endTime} isDark={isDark} accent="rose" />
				<SessionInfoItem icon={Timer} label="Remaining" value={sessionInfo.remainingTime} isDark={isDark} accent="amber" />
				<SessionInfoItem icon={HeartPulse} label="Doctor" value={sessionInfo.doctor} isDark={isDark} accent="violet" />
				<SessionInfoItem icon={UserCog} label="Operator" value={sessionInfo.operator} isDark={isDark} accent="blue" />
				<SessionInfoItem icon={HardHat} label="Inside Att." value={sessionInfo.insideAttendant} isDark={isDark} accent="orange" />
			</div>
		</div>
	);
}

/* ── Page ── */

export default function PatientMonitorPage() {
	const { darkMode } = useDashboardStore();

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	const stats = {
		total: mockPatients.length,
		seated: mockPatients.filter((p) => p.isSeated).length,
		masked: mockPatients.filter((p) => p.hasMask).length,
	};

	return (
		<>
			<Head>
				<title>Patient Monitor</title>
			</Head>

			<div
				className={cn(
					'min-h-screen overflow-hidden transition-all duration-500',
					darkMode
						? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
						: 'bg-gradient-to-br from-sky-100 via-slate-100 to-amber-50'
				)}
			>
				{/* Decorative background */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className={cn('absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500', darkMode ? 'bg-blue-500/10' : 'bg-sky-400/20')} />
					<div className={cn('absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500', darkMode ? 'bg-emerald-500/10' : 'bg-amber-400/20')} />
					<div className={cn('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-500', darkMode ? 'bg-indigo-500/5' : 'bg-violet-300/10')} />
				</div>

				{/* Content */}
				<div className="relative z-10 px-8 py-6 flex flex-col h-screen">
					{/* Header */}
					<header className="flex items-center justify-between mb-5">
						<img
							alt="Hipertech Logo"
							src="/external/hipertechlogo2501-ygje.svg"
							className={cn('h-14 w-auto transition-all duration-500', !darkMode && 'brightness-0')}
						/>

						<div className="flex items-center gap-3">
							<Scan className={cn('w-6 h-6', darkMode ? 'text-indigo-400' : 'text-indigo-500')} />
							<h1 className={cn('text-xl font-bold transition-all duration-500', darkMode ? 'text-white' : 'text-slate-900')}>
								Patient Monitor
							</h1>
						</div>

						{/* Summary stats */}
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<UserRound className={cn('w-4 h-4', darkMode ? 'text-slate-500' : 'text-slate-400')} />
								<span className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-slate-500')}>
									{stats.seated}/{stats.total} Seated
								</span>
							</div>
							<div className={cn('w-px h-4', darkMode ? 'bg-white/10' : 'bg-slate-300')} />
							<div className="flex items-center gap-2">
								<ShieldCheck className={cn('w-4 h-4', darkMode ? 'text-slate-500' : 'text-slate-400')} />
								<span className={cn('text-xs font-medium', darkMode ? 'text-slate-400' : 'text-slate-500')}>
									{stats.masked}/{stats.total} Masked
								</span>
							</div>
						</div>
					</header>

					{/* Main content: grid + session panel */}
					<div className="flex-1 flex gap-4 min-h-0">
						{/* Patient grid */}
						<div className="flex-1 grid grid-cols-6 grid-rows-2 gap-4 min-h-0">
							{mockPatients.map((patient) => (
								<PatientCard
									key={patient.seatNumber}
									patient={patient}
									isDark={darkMode}
								/>
							))}
						</div>

						{/* Session info panel */}
						<SessionInfoPanel isDark={darkMode} />
					</div>
				</div>
			</div>
		</>
	);
}
