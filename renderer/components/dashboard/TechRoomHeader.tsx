import React from 'react';
import { useDashboardStore } from '../../store';
import { Moon, Sun, Wifi, WifiOff, Calendar, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * TechRoomHeader - Header for Technical Room Monitoring page
 */
export function TechRoomHeader() {
	const { darkMode, setDarkMode, connected, currentTime, currentTime2 } =
		useDashboardStore();

	return (
		<header className="flex items-center justify-between px-8 py-4">
			{/* Left side - Logo and back button */}
			<div className="flex items-center gap-6">
				<Link
					href="/dashboard"
					className={`
						flex items-center justify-center w-10 h-10 rounded-full
						transition-all duration-300 hover:scale-110
						${
							darkMode
								? 'bg-white/10 text-white hover:bg-white/20'
								: 'bg-slate-200 text-slate-700 hover:bg-slate-300'
						}
					`}>
					<ArrowLeft className="w-5 h-5" />
				</Link>

				{/* Hipertech Logo */}
				<svg width="200" height="70" viewBox="0 0 200 70">
					<text
						x="0"
						y="50"
						fontFamily="Arial, sans-serif"
						fontSize="42"
						fontWeight="bold"
						fill="#4a90e2">
						hipertech
					</text>
					<text
						x="175"
						y="25"
						fontFamily="Arial, sans-serif"
						fontSize="16"
						fill="#4a90e2">
						®
					</text>
				</svg>
			</div>

			{/* Center - Title */}
			<h1 className="font-poppins font-bold text-[40px] text-[#4a90e2]">
				Technical Room Monitoring
			</h1>

			{/* Right side - Controls */}
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
						<span className="font-medium">{currentTime2 || '14:27'}</span>
					</div>
				</div>
			</div>
		</header>
	);
}
