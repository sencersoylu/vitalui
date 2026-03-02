import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Settings,
	VolumeX,
	Volume2,
} from 'lucide-react';
import { Badge } from './badge';
import { useDashboardStore } from '../store';

interface O2AnalyzerCardProps {
	title: string;
	o2Level: number;
	alarmLevel: number;
	isAlarmActive: boolean;
	lastCalibration: string;
	onSettingsClick?: () => void;
	onMuteAlarm?: () => void;
	isMuted?: boolean;
	showAlarm?: boolean;
}

export function O2AnalyzerCard({
	title,
	o2Level,
	alarmLevel,
	isAlarmActive,
	lastCalibration,
	onSettingsClick,
	onMuteAlarm,
	isMuted = false,
	showAlarm = true,
}: O2AnalyzerCardProps) {
	const isHighOxygen = o2Level > alarmLevel;

	const statusColor =
		showAlarm && (isAlarmActive || isHighOxygen) ? 'text-red-500' : 'text-emerald-500';
	const cardBorderColor =
		showAlarm && (isAlarmActive || isHighOxygen) ? 'border-red-200' : 'border-emerald-200';
	const cardBackgroundColor = 'bg-blue-50/10 dark:bg-blue-950/10';

	return (
		<div
			className={`${cardBackgroundColor} ${showAlarm ? 'h-[500px] w-[550px] p-6 rounded-[40px]' : 'w-full p-4 rounded-2xl'} relative shrink-0 border-2 ${cardBorderColor} flex flex-col justify-between`}>
			{/* Top Right Buttons */}
			<div className={`absolute ${showAlarm ? 'top-6 right-6' : 'top-3 right-3'} flex gap-2`}>
				{/* Mute Alarm Button - only show when alarm is active and showAlarm is true */}
				{showAlarm && (isAlarmActive || isHighOxygen) && onMuteAlarm && (
					<button
						onClick={onMuteAlarm}
						className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 ${
							isMuted
								? 'bg-slate-500/90 hover:bg-slate-600'
								: 'bg-red-500/90 hover:bg-red-600'
						}`}
						aria-label={isMuted ? 'Unmute alarm' : 'Mute alarm'}>
						{isMuted ? (
							<VolumeX className="w-6 h-6 text-white" />
						) : (
							<Volume2 className="w-6 h-6 text-white" />
						)}
					</button>
				)}

				{/* Settings Button */}
				{onSettingsClick && (
					<button
						onClick={onSettingsClick}
						className={`${showAlarm ? 'p-3' : 'p-2'} bg-white/80 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500`}
						aria-label="Settings">
						<Settings className={`${showAlarm ? 'w-6 h-6' : 'w-5 h-5'} text-blue-600`} />
					</button>
				)}
			</div>

			{/* Title */}
			<div className="text-center">
				<h2 className={`${showAlarm ? 'text-6xl mb-6' : 'text-3xl mb-1'} font-bold text-blue-600`}>{title}</h2>
				{!showAlarm && (
					<div className="flex items-center justify-center gap-1 mb-1">
						<svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<circle cx="12" cy="12" r="10" />
							<text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" stroke="none" fontWeight="bold">O₂</text>
						</svg>
						<span className="text-xs text-blue-400 font-medium">Sensor</span>
					</div>
				)}
			</div>

			{/* O2 Level */}
			<div className={`text-center ${showAlarm ? 'mb-6' : 'mb-2'}`}>
				<div className={showAlarm ? 'mb-4' : 'mb-1'}>
					<span className={`${showAlarm ? 'text-xl' : 'text-base'} text-slate-600 dark:text-slate-400`}>O2 Level</span>
				</div>
				<div className={`${showAlarm ? 'text-7xl' : 'text-5xl'} font-bold ${statusColor} ${showAlarm ? 'mb-3' : 'mb-1'}`}>
					{o2Level.toFixed(1)}%
				</div>
			</div>

			{/* Alarm Level - only show when showAlarm is true */}
			{showAlarm && (
				<div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-4 mb-4">
					<div className="flex items-center justify-between mb-3">
						<span className="text-base font-medium text-slate-700 dark:text-slate-300">
							High Alarm:
						</span>
						<span className="text-xl font-bold text-blue-600 dark:text-blue-400">
							{alarmLevel}%
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-base font-medium text-slate-700 dark:text-slate-300">
							Alarm Status:
						</span>
						<div className="flex items-center gap-2">
							{isAlarmActive || isHighOxygen ? (
								<>
									<AlertTriangle className="w-6 h-6 text-red-500" />
									<Badge variant="destructive" className="text-sm px-3 py-1">
										HIGH O2
									</Badge>
								</>
							) : (
								<>
									<CheckCircle2 className="w-6 h-6 text-emerald-500" />
									<Badge className="bg-emerald-500 hover:bg-emerald-600 text-sm px-3 py-1">
										NORMAL
									</Badge>
								</>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Last Calibration */}
			<div className={`bg-white/30 dark:bg-slate-800/30 ${showAlarm ? 'rounded-2xl p-4' : 'rounded-xl p-2'}`}>
				<div className={`flex items-center ${showAlarm ? 'gap-4' : 'gap-2'}`}>
					<Clock className={`${showAlarm ? 'w-6 h-6' : 'w-4 h-4'} text-blue-600 dark:text-blue-400`} />
					<div>
						<div className={`${showAlarm ? 'text-base' : 'text-sm'} font-medium text-slate-700 dark:text-slate-300`}>
							Last Calibration
						</div>
						<div className={`${showAlarm ? 'text-base' : 'text-sm'} text-slate-600 dark:text-slate-400`}>{lastCalibration}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
