import {
	AlertTriangle,
	CheckCircle2,
	Clock,
	Settings,
	VolumeX,
	Volume2,
} from 'lucide-react';
import { Badge } from './badge';

interface O2AnalyzerCardProps {
	title: string;
	o2Level: number;
	alarmLevel: number;
	isAlarmActive: boolean;
	lastCalibration: string;
	onSettingsClick?: () => void;
	onMuteAlarm?: () => void;
	isMuted?: boolean;
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
}: O2AnalyzerCardProps) {
	const isHighOxygen = o2Level > alarmLevel;

	const statusColor =
		isAlarmActive || isHighOxygen ? 'text-red-500' : 'text-green-500';
	const cardBorderColor =
		isAlarmActive || isHighOxygen ? 'border-red-200' : 'border-green-200';

	return (
		<div
			className={`bg-brand-card-bg h-[500px] relative rounded-[40px] shrink-0 w-[550px] border-2 ${cardBorderColor} p-6 flex flex-col justify-between`}>
			{/* Top Right Buttons */}
			<div className="absolute top-6 right-6 flex gap-2">
				{/* Mute Alarm Button - only show when alarm is active */}
				{(isAlarmActive || isHighOxygen) && onMuteAlarm && (
					<button
						onClick={onMuteAlarm}
						className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${
							isMuted
								? 'bg-gray-500/90 hover:bg-gray-600'
								: 'bg-red-500/90 hover:bg-red-600'
						}`}>
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
						className="p-3 bg-white/80 hover:bg-white rounded-full shadow-lg transition-all duration-200 hover:scale-105">
						<Settings className="w-6 h-6 text-brand-blue" />
					</button>
				)}
			</div>

			{/* Title */}
			<div className="text-center">
				<h2 className="text-6xl font-bold text-brand-blue mb-6">{title}</h2>
			</div>

			{/* O2 Level */}
			<div className="text-center mb-6">
				<div className="mb-4">
					<span className="text-xl text-gray-600">O2 Level</span>
				</div>
				<div className={`text-7xl font-bold ${statusColor} mb-3`}>
					{o2Level.toFixed(1)}%
				</div>
			</div>

			{/* Alarm Level */}
			<div className="bg-white/50 rounded-2xl p-4 mb-4">
				<div className="flex items-center justify-between mb-3">
					<span className="text-base font-medium text-gray-700">
						High Alarm:
					</span>
					<span className="text-xl font-bold text-brand-blue">
						{alarmLevel}%
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-base font-medium text-gray-700">
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
								<CheckCircle2 className="w-6 h-6 text-green-500" />
								<Badge className="bg-green-500 hover:bg-green-600 text-sm px-3 py-1">
									NORMAL
								</Badge>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Last Calibration */}
			<div className="bg-white/30 rounded-2xl p-4">
				<div className="flex items-center gap-4">
					<Clock className="w-6 h-6 text-brand-blue" />
					<div>
						<div className="text-base font-medium text-gray-700">
							Last Calibration
						</div>
						<div className="text-base text-gray-600">{lastCalibration}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
