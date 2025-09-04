import { useState, useEffect } from 'react';
import {
	O2Reading,
	getChamberReadings,
	getLatestReading,
	addReading,
	getReadingHistory,
} from '../api/chambers';
import { handleApiError } from '../api';

interface UseReadingsReturn {
	readings: O2Reading[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	addNewReading: (readingData: {
		o2Level: number; // Ham değer - backend tarafında kalibre edilir
		temperature?: number;
		humidity?: number;
		sensorStatus?: string;
	}) => Promise<O2Reading | null>;
}

interface UseLatestReadingReturn {
	reading: O2Reading | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

interface UseReadingHistoryReturn {
	history: O2Reading[];
	loading: boolean;
	error: string | null;
	refetch: (startDate?: string, endDate?: string) => Promise<void>;
}

// Oda okumalarını yönetmek için hook
export const useReadings = (chamberId: number | null): UseReadingsReturn => {
	const [readings, setReadings] = useState<O2Reading[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchReadings = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getChamberReadings(chamberId);
			setReadings(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Readings fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	const addNewReading = async (readingData: {
		o2Level: number; // Ham değer - backend tarafında kalibre edilir
		temperature?: number;
		humidity?: number;
		sensorStatus?: string;
	}): Promise<O2Reading | null> => {
		if (!chamberId) return null;

		try {
			setError(null);
			const newReading = await addReading(chamberId, readingData);
			setReadings((prev) => [newReading, ...prev]);
			return newReading;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Add reading error:', err);
			return null;
		}
	};

	useEffect(() => {
		fetchReadings();
	}, [chamberId]);

	return {
		readings,
		loading,
		error,
		refetch: fetchReadings,
		addNewReading,
	};
};

// En son okumayı almak için hook
export const useLatestReading = (
	chamberId: number | null,
	autoRefresh: boolean = false,
	refreshInterval: number = 5000
): UseLatestReadingReturn => {
	const [reading, setReading] = useState<O2Reading | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLatestReading = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getLatestReading(chamberId);
			setReading(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Latest reading fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLatestReading();
	}, [chamberId]);

	useEffect(() => {
		if (!autoRefresh || !chamberId) return;

		const interval = setInterval(() => {
			fetchLatestReading();
		}, refreshInterval);

		return () => clearInterval(interval);
	}, [autoRefresh, refreshInterval, chamberId]);

	return {
		reading,
		loading,
		error,
		refetch: fetchLatestReading,
	};
};

// Geçmiş verileri almak için hook
export const useReadingHistory = (
	chamberId: number | null
): UseReadingHistoryReturn => {
	const [history, setHistory] = useState<O2Reading[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchHistory = async (startDate?: string, endDate?: string) => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getReadingHistory(chamberId, startDate, endDate);
			setHistory(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Reading history fetch error:', err);
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
