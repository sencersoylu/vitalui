import React from 'react';
import { useDashboardStore } from '../../store';
import { Moon, Sun, Wifi, WifiOff, Calendar, Clock } from 'lucide-react';

/**
 * Header - Top navigation bar with logo, theme toggle, and status
 */
export function Header() {
	const {
		darkMode,
		setDarkMode,
		connected,
		currentTime,
		currentTime2,
	} = useDashboardStore();

	return (
		<header className="flex items-center justify-between mb-6">
			<img
				alt="Hipertech Logo"
				src="/external/hipertechlogo2501-ygje.svg"
				className={`h-16 w-auto transition-all duration-500 ${
					!darkMode && 'brightness-0'
				}`}
			/>

			<div className="flex items-center gap-4">
				{/* Theme Toggle Button */}
				<button
					onClick={() => setDarkMode(!darkMode)}
					className={`
						flex items-center justify-center w-10 h-10 rounded-full
						transition-all duration-500 hover:scale-110 active:scale-95
						${
							darkMode
								? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
								: 'bg-indigo-500/20 text-indigo-600 border border-indigo-500/30 hover:bg-indigo-500/30'
						}
					`}
					aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
					{darkMode ? (
						<Sun className="w-5 h-5" />
					) : (
						<Moon className="w-5 h-5" />
					)}
				</button>

				{/* Connection Status */}
				<div
					className={`
						flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
						${
							connected
								? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
								: 'bg-red-500/20 text-red-400 border border-red-500/30'
						}
					`}>
					{connected ? (
						<Wifi className="w-4 h-4" />
					) : (
						<WifiOff className="w-4 h-4" />
					)}
					<span className="ml-1">
						{connected ? 'Connected' : 'Disconnected'}
					</span>
				</div>

				{/* Date & Time */}
				<div
					className={`backdrop-blur-lg rounded-full px-6 py-2 border transition-all duration-500 flex items-center gap-3 ${
						darkMode
							? 'bg-white/5 border-white/10 text-white/80'
							: 'bg-white/60 border-slate-200 text-slate-700'
					}`}>
					<div className="flex items-center gap-2">
						<Calendar className="w-4 h-4" />
						<span className="font-medium">
							{currentTime || '10.01.2026'}
						</span>
					</div>
					<span className="text-slate-400">•</span>
					<div className="flex items-center gap-2">
						<Clock className="w-4 h-4" />
						<span className="font-medium">
							{currentTime2 || '14:27'}
						</span>
					</div>
				</div>
			</div>
		</header>
	);
}
