import { useState, useEffect } from 'react';
import {
	Chamber,
	getChambers,
	getChamber,
	createChamber,
	updateChamber,
	deleteChamber,
} from '../api/chambers';
import { handleApiError } from '../api';

interface UseChambersReturn {
	chambers: Chamber[];
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	createNewChamber: (
		chamberData: Omit<
			Chamber,
			| 'id'
			| 'createdAt'
			| 'updatedAt'
			| 'lastValue'
			| 'calibrationDate'
			| 'lastSensorChange'
		>
	) => Promise<Chamber | null>;
	updateExistingChamber: (
		chamberId: number,
		chamberData: Partial<Chamber>
	) => Promise<Chamber | null>;
	removeExistingChamber: (chamberId: number) => Promise<boolean>;
}

interface UseChamberReturn {
	chamber: Chamber | null;
	loading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

// Tüm odaları yönetmek için hook
export const useChambers = (): UseChambersReturn => {
	const [chambers, setChambers] = useState<Chamber[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchChambers = async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await getChambers();
			setChambers(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Chambers fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	const createNewChamber = async (
		chamberData: Omit<
			Chamber,
			| 'id'
			| 'createdAt'
			| 'updatedAt'
			| 'lastValue'
			| 'calibrationDate'
			| 'lastSensorChange'
		>
	): Promise<Chamber | null> => {
		try {
			setError(null);
			const newChamber = await createChamber(chamberData);
			setChambers((prev) => [...prev, newChamber]);
			return newChamber;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Create chamber error:', err);
			return null;
		}
	};

	const updateExistingChamber = async (
		chamberId: number,
		chamberData: Partial<Chamber>
	): Promise<Chamber | null> => {
		try {
			setError(null);
			const updatedChamber = await updateChamber(chamberId, chamberData);
			setChambers((prev) =>
				prev.map((chamber) =>
					chamber.id === chamberId ? updatedChamber : chamber
				)
			);
			return updatedChamber;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Update chamber error:', err);
			return null;
		}
	};

	const removeExistingChamber = async (chamberId: number): Promise<boolean> => {
		try {
			setError(null);
			await deleteChamber(chamberId);
			setChambers((prev) => prev.filter((chamber) => chamber.id !== chamberId));
			return true;
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Delete chamber error:', err);
			return false;
		}
	};

	useEffect(() => {
		fetchChambers();
	}, []);

	return {
		chambers,
		loading,
		error,
		refetch: fetchChambers,
		createNewChamber,
		updateExistingChamber,
		removeExistingChamber,
	};
};

// Tek bir odayı yönetmek için hook
export const useChamber = (chamberId: number | null): UseChamberReturn => {
	const [chamber, setChamber] = useState<Chamber | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchChamber = async () => {
		if (!chamberId) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const data = await getChamber(chamberId);
			setChamber(data);
		} catch (err) {
			const errorMessage = handleApiError(err);
			setError(errorMessage);
			console.error('Chamber fetch error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchChamber();
	}, [chamberId]);

	return {
		chamber,
		loading,
		error,
		refetch: fetchChamber,
	};
};
