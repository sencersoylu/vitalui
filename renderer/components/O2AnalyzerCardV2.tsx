import { useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings,
  VolumeX,
  Volume2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useDashboardStore } from '../store';
import { cn } from './utils';

interface O2AnalyzerCardV2Props {
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

type TrendDirection = 'up' | 'down' | 'stable';

export function O2AnalyzerCardV2({
  title,
  o2Level,
  alarmLevel,
  isAlarmActive,
  lastCalibration,
  onSettingsClick,
  onMuteAlarm,
  isMuted = false,
  showAlarm = true,
}: O2AnalyzerCardV2Props) {
  const { darkMode } = useDashboardStore();
  const hasAlarm = showAlarm && (isAlarmActive || o2Level > alarmLevel);

  // Trend tracking
  const prevO2Ref = useRef<number>(o2Level);
  const [trend, setTrend] = useState<TrendDirection>('stable');
  const [trendKey, setTrendKey] = useState(0); // used to re-trigger fade-in

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = o2Level - prevO2Ref.current;
      let newTrend: TrendDirection = 'stable';
      if (diff > 0.2) newTrend = 'up';
      else if (diff < -0.2) newTrend = 'down';

      if (newTrend !== trend) {
        setTrend(newTrend);
        setTrendKey((k) => k + 1);
      }
      prevO2Ref.current = o2Level;
    }, 30000);

    return () => clearInterval(interval);
  }, [o2Level, trend]);

  // Card glassmorphism base
  const cardGlass = darkMode
    ? 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]'
    : 'bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_rgba(31,38,135,0.15)]';

  // Inner glass panel
  const innerGlass = darkMode
    ? 'bg-white/5 border border-white/10'
    : 'bg-white/40 border border-white/60';

  // Alarm border pulse & glow
  const alarmGlowDark = 'shadow-[0_0_40px_rgba(239,68,68,0.4)]';
  const alarmGlowLight = 'shadow-[0_0_40px_rgba(239,68,68,0.25)]';

  const cardAlarmClasses = hasAlarm
    ? cn(
        'animate-alarm-pulse animate-alarm-glow border-red-500/50',
        darkMode ? alarmGlowDark : alarmGlowLight
      )
    : '';

  // O2 value gradient
  const o2GradientClass = hasAlarm
    ? 'bg-gradient-to-br from-red-400 to-rose-600 bg-clip-text text-transparent'
    : 'bg-gradient-to-br from-emerald-400 to-teal-500 bg-clip-text text-transparent';

  // Trend icon
  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-rose-400'
      : trend === 'down'
      ? 'text-emerald-400'
      : 'text-slate-400';

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden transition-all duration-500',
        showAlarm ? 'w-[480px] h-[480px] rounded-3xl' : 'w-full h-auto rounded-2xl',
        cardGlass,
        cardAlarmClasses
      )}
    >
      {/* Alarm Top Banner — flush with card top */}
      {hasAlarm && showAlarm && (
        <div
          className={cn(
            'rounded-t-3xl flex items-center justify-between px-5 py-3',
            isMuted
              ? 'bg-slate-600'
              : 'bg-red-600 animate-alarm-flash'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-white shrink-0" />
            <span className="text-white font-bold text-sm tracking-widest uppercase">
              {isMuted ? 'Alarm Muted' : 'High O2 Alarm'}
            </span>
          </div>
          {onMuteAlarm && (
            <button
              onClick={onMuteAlarm}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label={isMuted ? 'Unmute alarm' : 'Mute alarm'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-white" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Card Body */}
      <div
        className={cn(
          'flex flex-col flex-1 px-6 py-5 gap-4',
          hasAlarm && showAlarm ? 'rounded-b-3xl' : ''
        )}
      >
        {/* Header row: title + settings */}
        <div className="flex items-center justify-between">
          <h2
            className={cn(
              'font-bold',
              showAlarm ? 'text-2xl' : 'text-lg',
              darkMode ? 'text-white' : 'text-slate-800'
            )}
          >
            {title}
          </h2>
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className={cn(
                'p-2.5 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2',
                darkMode
                  ? 'bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-white/30'
                  : 'bg-white/60 hover:bg-white/80 border border-white/80 focus:ring-blue-300'
              )}
              aria-label="Settings"
            >
              <Settings
                className={cn(
                  showAlarm ? 'w-5 h-5' : 'w-4 h-4',
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                )}
              />
            </button>
          )}
        </div>

        {/* O2 Value + Trend */}
        <div className="flex flex-col items-center justify-center flex-1">
          <span
            className={cn(
              'text-xs font-medium uppercase tracking-widest mb-1',
              darkMode ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            O2 Level
          </span>
          <div className="flex items-end gap-3">
            <span
              className={cn(
                'text-8xl font-extrabold tabular-nums transition-all duration-500 leading-none',
                o2GradientClass
              )}
            >
              {o2Level.toFixed(1)}
            </span>
            <span
              className={cn(
                'text-3xl font-bold mb-2',
                hasAlarm ? 'text-rose-400' : 'text-emerald-400'
              )}
            >
              %
            </span>
          </div>
          {/* Trend arrow */}
          <div
            key={trendKey}
            className={cn('flex items-center gap-1 mt-2 animate-fade-in', trendColor)}
          >
            <TrendIcon className="w-5 h-5" />
            <span className="text-xs font-medium capitalize">{trend}</span>
          </div>
        </div>

        {/* Alarm Info Panel */}
        {showAlarm && (
          <div className={cn('rounded-2xl p-4', innerGlass)}>
            <div className="flex items-center justify-between mb-3">
              <span
                className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                High Alarm
              </span>
              <span
                className={cn(
                  'text-base font-bold',
                  darkMode ? 'text-blue-300' : 'text-blue-600'
                )}
              >
                {alarmLevel}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                )}
              >
                Status
              </span>
              <div className="flex items-center gap-2">
                {hasAlarm ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full">
                      HIGH O2
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-white bg-emerald-500 px-2.5 py-1 rounded-full">
                      NORMAL
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Last Calibration */}
        <div className={cn('rounded-2xl p-3', innerGlass)}>
          <div className="flex items-center gap-3">
            <Clock
              className={cn(
                'shrink-0',
                showAlarm ? 'w-5 h-5' : 'w-4 h-4',
                darkMode ? 'text-blue-300' : 'text-blue-500'
              )}
            />
            <div>
              <div
                className={cn(
                  'text-xs font-semibold uppercase tracking-wide',
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                Last Calibration
              </div>
              <div
                className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-slate-200' : 'text-slate-700'
                )}
              >
                {lastCalibration}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
