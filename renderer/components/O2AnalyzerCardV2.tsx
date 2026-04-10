import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
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
  lastSensorChange?: string;
  onSettingsClick?: () => void;
  onMuteAlarm?: () => void;
  isMuted?: boolean;
  showAlarm?: boolean;
}

type TrendDirection = 'up' | 'down' | 'stable';

// Mini sparkline chart component — memoized to avoid re-render on parent state changes
const Sparkline = React.memo(function Sparkline({
  data,
  alarmLevel,
  darkMode,
  hasAlarm,
}: {
  data: number[];
  alarmLevel: number;
  darkMode: boolean;
  hasAlarm: boolean;
}) {
  const width = 440;
  const height = 120;
  const padding = { top: 12, right: 40, bottom: 12, left: 40 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  // Focus Y axis on data range only (not alarm level) for better visibility
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const dataRange = dataMax - dataMin;
  // Add padding: at least ±0.5, or 30% of range
  const yPadding = Math.max(0.5, dataRange * 0.3);
  const min = dataMin - yPadding;
  const max = dataMax + yPadding;
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding.left + (i / (data.length - 1)) * innerW;
    const y = padding.top + innerH - ((val - min) / range) * innerH;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - padding.bottom} L${points[0].x},${height - padding.bottom} Z`;

  // Alarm threshold line (only show if within visible range)
  const alarmInRange = alarmLevel >= min && alarmLevel <= max;
  const alarmY = padding.top + innerH - ((alarmLevel - min) / range) * innerH;

  // Grid lines (3 horizontal)
  const gridValues = [min + range * 0.25, min + range * 0.5, min + range * 0.75];

  const lineColor = hasAlarm ? '#ef4444' : darkMode ? '#34d399' : '#059669';
  const fillColor = hasAlarm
    ? darkMode ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)'
    : darkMode ? 'rgba(52,211,153,0.2)' : 'rgba(5,150,105,0.12)';
  const gridColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const labelColor = darkMode ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

  const currentVal = data[data.length - 1];
  const minVal = dataMin;
  const maxVal = dataMax;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="rounded-xl">
      {/* Grid lines */}
      {gridValues.map((val, i) => {
        const gy = padding.top + innerH - ((val - min) / range) * innerH;
        return (
          <line key={i} x1={padding.left} y1={gy} x2={width - padding.right} y2={gy}
            stroke={gridColor} strokeWidth="1" />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={fillColor} />

      {/* Line — thicker */}
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      {/* Alarm threshold dashed line */}
      {alarmInRange && (
        <>
          <line
            x1={padding.left} y1={alarmY}
            x2={width - padding.right} y2={alarmY}
            stroke={darkMode ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.4)'}
            strokeWidth="1.5"
            strokeDasharray="6,4"
          />
          <text x={width - padding.right + 4} y={alarmY + 4}
            fontSize="10" fill={darkMode ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.5)'}
            fontWeight="600">{alarmLevel}%</text>
        </>
      )}

      {/* Min/Max labels on left */}
      <text x={padding.left - 4} y={padding.top + 4}
        fontSize="10" fill={labelColor} textAnchor="end" fontWeight="500">
        {maxVal.toFixed(1)}
      </text>
      <text x={padding.left - 4} y={height - padding.bottom}
        fontSize="10" fill={labelColor} textAnchor="end" fontWeight="500">
        {minVal.toFixed(1)}
      </text>

      {/* Current value label on right */}
      <text x={width - padding.right + 4} y={points[points.length - 1].y + 4}
        fontSize="11" fill={lineColor} fontWeight="700">
        {currentVal.toFixed(1)}%
      </text>

      {/* Current value dot — larger with glow */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="6"
        fill={lineColor}
        stroke={darkMode ? '#1a1a2e' : '#fff'}
        strokeWidth="2.5"
        opacity="0.3"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="4"
        fill={lineColor}
        stroke={darkMode ? '#1a1a2e' : '#fff'}
        strokeWidth="2"
      />
    </svg>
  );
});

export const O2AnalyzerCardV2 = React.memo(function O2AnalyzerCardV2({
  title,
  o2Level,
  alarmLevel,
  isAlarmActive,
  lastCalibration,
  lastSensorChange,
  onSettingsClick,
  onMuteAlarm,
  isMuted = false,
  showAlarm = true,
}: O2AnalyzerCardV2Props) {
  const { darkMode } = useDashboardStore();
  const hasAlarm = showAlarm && (isAlarmActive || o2Level > alarmLevel);

  // Sensor age check — warn if > 1 year
  const sensorExpired = useMemo(() => {
    if (!lastSensorChange) return false;
    const changeDate = new Date(lastSensorChange);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return changeDate < oneYearAgo;
  }, [lastSensorChange]);

  const sensorAgeDays = useMemo(() => {
    if (!lastSensorChange) return null;
    const diff = Date.now() - new Date(lastSensorChange).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [lastSensorChange]);

  // Trend tracking
  const prevO2Ref = useRef<number>(o2Level);
  const [trend, setTrend] = useState<TrendDirection>('stable');
  const [trendKey, setTrendKey] = useState(0);

  // History for sparkline — 40 points x 30s interval = 20 minutes
  const [history, setHistory] = useState<number[]>(() => {
    const h: number[] = [];
    for (let i = 0; i < 40; i++) {
      h.push(o2Level + (Math.random() - 0.5) * 0.8);
    }
    return h;
  });

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

      // Append to history every 30s
      setHistory((prev) => {
        const next = prev.length >= 40 ? prev.slice(1) : prev;
        next.push(o2Level);
        return [...next];
      });
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

  // O2 value color — solid colors for readability
  const o2ValueColor = hasAlarm
    ? 'text-red-500'
    : darkMode
      ? 'text-emerald-400'
      : 'text-emerald-600';

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
        showAlarm ? 'w-[520px] rounded-3xl' : 'w-full h-auto rounded-2xl',
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
        <div className="flex items-center justify-between relative">
          {/* Title centered */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-1.5 h-8 rounded-full',
                hasAlarm ? 'bg-red-500' : darkMode ? 'bg-emerald-400' : 'bg-emerald-500'
              )} />
              <h2
                className={cn(
                  'font-extrabold tracking-tight',
                  showAlarm ? 'text-3xl' : 'text-lg',
                  darkMode ? 'text-white' : 'text-slate-800'
                )}
              >
                {title}
              </h2>
            </div>
          </div>
          {/* Spacer for left side */}
          <div />
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
                o2ValueColor
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

        {/* Trend Sparkline Chart */}
        {showAlarm && (
          <div className={cn('rounded-2xl p-2', innerGlass)}>
            <div className="flex items-center justify-between px-2 mb-1">
              <span className={cn('text-[10px] font-medium uppercase tracking-wider', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                Trend (20min)
              </span>
              <span className={cn('text-[10px] font-medium', darkMode ? 'text-red-400/60' : 'text-red-400/50')}>
                Alarm: {alarmLevel}%
              </span>
            </div>
            <Sparkline data={history} alarmLevel={alarmLevel} darkMode={darkMode} hasAlarm={hasAlarm} />
          </div>
        )}

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

        {/* Last Calibration + Sensor Age — hidden during alarm */}
        {!hasAlarm && <div className={cn('rounded-2xl p-3 flex items-center justify-between', innerGlass)}>
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

          {/* Sensor age warning */}
          {showAlarm && sensorExpired && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold animate-alarm-pulse',
                darkMode ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-600 border border-amber-200'
              )}
              title={sensorAgeDays ? `Sensor age: ${sensorAgeDays} days` : ''}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Sensor {sensorAgeDays ? `${Math.floor(sensorAgeDays / 30)}mo` : ''}
            </div>
          )}
        </div>}
      </div>
    </div>
  );
});
