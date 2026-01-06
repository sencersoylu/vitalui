import { useState, useEffect } from 'react';
import {
	Alarm,
	AlarmStats,
	getActiveAlarms,
	getAlarmHistory,
	getAlarmStats,
	getChamberAlarms,
	muteAlarm,
	resolveAlarm,
	muteAllAlarms,
	muteChamberAlarms,
} from '../api/alarms';
import { handleApiError } from '../api';

interface UseAlarmsReturn {
	alarms: Alarm[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	muteAlarmById: (chamberId: number, duration?: number) => Promise<boolean>;
	resolveAlarmById: (chamberId: number) => Promise<boolean>;
	muteAll: (duration?: number) => Promise<boolean>;
}

interface UseAlarmHistoryReturn {
	history: Alarm[];
	loading: boolean;
	error: string | null;
	refetch: (chamberId?: number) => Promise<void>;
}

interface UseAlarmStatsReturn {
	stats: AlarmStats | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

interface UseChamberAlarmsReturn {
	alarms: Alarm[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	muteAllChamberAlarms: (duration?: number) => Promise<boolean>;
}

// Hook for managing active alarms
export const useActiveAlarms = (
	autoRefresh: boolean = true,
	refreshInterval: number = 5000
): UseAlarmsReturn => {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchAlarms = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getActiveAlarms();
			setAlarms(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Active alarms fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	const muteAlarmById = async (
		chamberId: number,
		duration?: number
	): Promise<boolean> => {
		try {
			setError(null);
			await muteAlarm(chamberId, duration);
			// Update alarm list
			setAlarms((prev) =>
				prev.map((alarm) =>
					alarm.chamberId === chamberId ? { ...alarm, isMuted: true } : alarm
				)
			);
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Mute alarm error:', err);
			return false;
		}
	};

	const resolveAlarmById = async (chamberId: number): Promise<boolean> => {
		try {
			setError(null);
			await resolveAlarm(chamberId);
			// Update alarm list - mark alarms belonging to chamberId as inactive
			setAlarms((prev) =>
				prev.map((alarm) =>
					alarm.chamberId === chamberId ? { ...alarm, isActive: false } : alarm
				)
			);
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Resolve alarm error:', err);
			return false;
		}
	};

	const muteAll = async (duration?: number): Promise<boolean> => {
		try {
			setError(null);
			await muteAllAlarms(duration);
			// Mark all alarms as muted
			setAlarms((prev) => prev.map((alarm) => ({ ...alarm, isMuted: true })));
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Mute all alarms error:', err);
			return false;
		}
	};

	useEffect(() => {
		fetchAlarms();
	}, []);

	useEffect(() => {
		if (!autoRefresh) return;

		const interval = setInterval(() => {
			fetchAlarms();
		}, refreshInterval);

		return () => clearInterval(interval);
	}, [autoRefresh, refreshInterval]);

	return {
		alarms,
		loading,
		error,
		refetch: fetchAlarms,
		muteAlarmById,
		resolveAlarmById,
		muteAll,
	};
};

// Hook for managing alarm history
export const useAlarmHistory = (): UseAlarmHistoryReturn => {
	const [history, setHistory] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchHistory = async (chamberId?: number) => {
		try {
			setLoading(true);
			setError(null);
			const data = await getAlarmHistory(chamberId);
			setHistory(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Alarm history fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, []);

	return {
		history,
		loading,
		error,
		refetch: fetchHistory,
	};
};

// Hook for managing alarm statistics
export const useAlarmStats = (): UseAlarmStatsReturn => {
	const [stats, setStats] = useState<AlarmStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getAlarmStats();
			setStats(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Alarm stats fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStats();
	}, []);

	return {
		stats,
		loading,
		error,
		refetch: fetchStats,
	};
};

// Hook for managing alarms of a specific chamber
export const useChamberAlarms = (
	chamberId: number | null
): UseChamberAlarmsReturn => {
	const [alarms, setAlarms] = useState<Alarm[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchChamberAlarms = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getChamberAlarms(chamberId);
			setAlarms(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Chamber alarms fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	const muteAllChamberAlarms = async (duration?: number): Promise<boolean> => {
		if (!chamberId) return false;

		try {
			setError(null);
			await muteChamberAlarms(chamberId, duration);
			// Mark all alarms as muted
			setAlarms((prev) => prev.map((alarm) => ({ ...alarm, isMuted: true })));
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Mute chamber alarms error:', err);
			return false;
		}
	};

	useEffect(() => {
		fetchChamberAlarms();
	}, [chamberId]);

	return {
		alarms,
		loading,
		error,
		refetch: fetchChamberAlarms,
		muteAllChamberAlarms,
	};
};
