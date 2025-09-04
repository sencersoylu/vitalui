import { useState, useEffect } from 'react';
import {
	calibrateChamber,
	recordSensorChange,
	getCalibrationHistory,
	getCalibrationStatus,
	markCalibrationRequired,
	performThreePointCalibration,
	getActiveCalibrationPoints,
	calibrateReading,
	getCalibrationStats,
} from '../api/settings';
import { ThreePointCalibrationData, CalibrationPoints } from '../api/chambers';
import { handleApiError } from '../api';

interface CalibrationHistoryItem {
	date: string;
	level: number;
	performedBy: string;
}

interface CalibrationStatus {
	chamberId: number;
	lastCalibration: string;
	nextDue: string;
	isOverdue: boolean;
	daysSinceLastCalibration: number;
	daysUntilNext: number;
}

interface CalibrationStats {
	totalChambers: number;
	upToDate: number;
	dueSoon: number;
	overdue: number;
	avgCalibrationInterval: number;
}

interface UseCalibrationReturn {
	calibrating: boolean;
	error: string | null;
	calibrate: (chamberId: number, level: number) => Promise<boolean>;
	performThreePoint: (
		chamberId: number,
		data: ThreePointCalibrationData
	) => Promise<boolean>;
	calibrateRawReading: (
		chamberId: number,
		rawValue: number
	) => Promise<{ calibratedValue: number; rawValue: number } | null>;
	recordSensorChanged: (chamberId: number) => Promise<boolean>;
	markRequired: (chamberId: number) => Promise<boolean>;
}

interface UseCalibrationHistoryReturn {
	history: CalibrationHistoryItem[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

interface UseCalibrationStatusReturn {
	status: CalibrationStatus | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

interface UseCalibrationStatsReturn {
	stats: CalibrationStats | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

interface UseCalibrationPointsReturn {
	calibrationPoints: CalibrationPoints | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

// Kalibrasyon işlemlerini yönetmek için hook
export const useCalibration = (): UseCalibrationReturn => {
	const [calibrating, setCalibrating] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const calibrate = async (
		chamberId: number,
		level: number
	): Promise<boolean> => {
		try {
			setCalibrating(true);
			setError(null);
			await calibrateChamber(chamberId, level);
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Calibration error:', err);
			return false;
		} finally {
			setCalibrating(false);
		}
	};

	const performThreePoint = async (
		chamberId: number,
		data: ThreePointCalibrationData
	): Promise<boolean> => {
		try {
			setCalibrating(true);
			setError(null);
			await performThreePointCalibration(chamberId, data);
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Three point calibration error:', err);
			return false;
		} finally {
			setCalibrating(false);
		}
	};

	const calibrateRawReading = async (
		chamberId: number,
		rawValue: number
	): Promise<{ calibratedValue: number; rawValue: number } | null> => {
		try {
			setError(null);
			const result = await calibrateReading(chamberId, rawValue);
			return result;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Calibrate reading error:', err);
			return null;
		}
	};

	const recordSensorChanged = async (chamberId: number): Promise<boolean> => {
		try {
			setError(null);
			await recordSensorChange(chamberId);
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Record sensor change error:', err);
			return false;
		}
	};

	const markRequired = async (chamberId: number): Promise<boolean> => {
		try {
			setError(null);
			await markCalibrationRequired(chamberId);
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Mark calibration required error:', err);
			return false;
		}
	};

	return {
		calibrating,
		error,
		calibrate,
		performThreePoint,
		calibrateRawReading,
		recordSensorChanged,
		markRequired,
	};
};

// Kalibrasyon geçmişini yönetmek için hook
export const useCalibrationHistory = (
	chamberId: number | null
): UseCalibrationHistoryReturn => {
	const [history, setHistory] = useState<CalibrationHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchHistory = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getCalibrationHistory(chamberId);
			setHistory(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Calibration history fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchHistory();
	}, [chamberId]);

	return {
		history,
		loading,
		error,
		refetch: fetchHistory,
	};
};

// Kalibrasyon durumunu yönetmek için hook
export const useCalibrationStatus = (
	chamberId: number | null
): UseCalibrationStatusReturn => {
	const [status, setStatus] = useState<CalibrationStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStatus = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getCalibrationStatus(chamberId);
			setStatus(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Calibration status fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchStatus();
	}, [chamberId]);

	return {
		status,
		loading,
		error,
		refetch: fetchStatus,
	};
};

// Kalibrasyon istatistiklerini yönetmek için hook
export const useCalibrationStats = (): UseCalibrationStatsReturn => {
	const [stats, setStats] = useState<CalibrationStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchStats = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getCalibrationStats();
			setStats(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Calibration stats fetch error:', err);
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

// Kalibrasyon noktalarını yönetmek için hook
export const useCalibrationPoints = (
	chamberId: number | null
): UseCalibrationPointsReturn => {
	const [calibrationPoints, setCalibrationPoints] =
		useState<CalibrationPoints | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchCalibrationPoints = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getActiveCalibrationPoints(chamberId);
			setCalibrationPoints(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Calibration points fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCalibrationPoints();
	}, [chamberId]);

	return {
		calibrationPoints,
		loading,
		error,
		refetch: fetchCalibrationPoints,
	};
};
