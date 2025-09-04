import { api } from './index';
import {
	Chamber,
	ThreePointCalibrationData,
	CalibrationPoints,
} from './chambers';

// Settings API Functions - Backend integration prompt'a göre ayrı endpoint'ler

// Oda ayarlarını getir
export const getChamberSettings = async (
	chamberId: number
): Promise<Chamber> => {
	try {
		const response = await api.get(`/settings/${chamberId}`);
		return response.data.data;
	} catch (error) {
		console.error('Oda ayarları getirilemedi:', error);
		throw error;
	}
};

// Oda ayarlarını güncelle
export const updateChamberSettings = async (
	chamberId: number,
	settings: Partial<Chamber>
): Promise<Chamber> => {
	try {
		const response = await api.put(`/settings/${chamberId}`, settings);
		return response.data.data;
	} catch (error) {
		console.error('Oda ayarları güncellenemedi:', error);
		throw error;
	}
};

// 3 noktalı kalibrasyon yap
export const performThreePointCalibration = async (
	chamberId: number,
	calibrationData: ThreePointCalibrationData
): Promise<any> => {
	try {
		const response = await api.post(
			`/settings/${chamberId}/calibrate-three-point`,
			{
				zeroPointRaw: calibrationData.zeroPointRaw,
				midPointRaw: calibrationData.midPointRaw,
				hundredPointRaw: calibrationData.hundredPointRaw,
				midPointCalibrated: calibrationData.midPointCalibrated || 21.0,
				calibratedBy: calibrationData.calibratedBy || 'operator',
				notes: calibrationData.notes || '',
			}
		);
		return response.data;
	} catch (error) {
		console.error('3 noktalı kalibrasyon yapılamadı:', error);
		throw error;
	}
};

// Aktif kalibrasyon noktalarını getir (Chamber verilerinden)
export const getActiveCalibrationPoints = async (
	chamberId: number
): Promise<CalibrationPoints> => {
	try {
		const response = await api.get(`/settings/${chamberId}/calibration-points`);
		return response.data.data;
	} catch (error) {
		console.error('Kalibrasyon noktaları getirilemedi:', error);
		throw error;
	}
};

// Ham değeri kalibre et
export const calibrateReading = async (
	chamberId: number,
	rawValue: number
): Promise<{ calibratedValue: number; rawValue: number }> => {
	try {
		const response = await api.post(
			`/settings/${chamberId}/calibrate-reading`,
			{ rawValue }
		);
		return response.data.data;
	} catch (error) {
		console.error('Okuma kalibre edilemedi:', error);
		throw error;
	}
};

// Tek nokta kalibrasyon (legacy)
export const calibrateChamber = async (
	chamberId: number,
	calibrationLevel: number
): Promise<void> => {
	try {
		await api.post(`/settings/${chamberId}/calibrate`, { calibrationLevel });
	} catch (error) {
		console.error('Kalibrasyon yapılamadı:', error);
		throw error;
	}
};

// Kalibrasyon geçmişini getir
export const getCalibrationHistory = async (
	chamberId: number
): Promise<any[]> => {
	try {
		const response = await api.get(
			`/settings/${chamberId}/calibration-history`
		);
		return response.data.data;
	} catch (error) {
		console.error('Kalibrasyon geçmişi getirilemedi:', error);
		throw error;
	}
};

// Kalibrasyon durumunu kontrol et
export const getCalibrationStatus = async (chamberId: number): Promise<any> => {
	try {
		const response = await api.get(`/settings/${chamberId}/calibration-status`);
		return response.data.data;
	} catch (error) {
		console.error('Kalibrasyon durumu kontrol edilemedi:', error);
		throw error;
	}
};

// Kalibrasyon gerekli işaretle
export const markCalibrationRequired = async (
	chamberId: number
): Promise<void> => {
	try {
		await api.post(`/settings/${chamberId}/calibration-required`);
	} catch (error) {
		console.error('Kalibrasyon gerekli işaretlenemedi:', error);
		throw error;
	}
};

// Sensör değişikliğini kaydet
export const recordSensorChange = async (chamberId: number): Promise<void> => {
	try {
		await api.post(`/settings/${chamberId}/sensor-changed`);
	} catch (error) {
		console.error('Sensör değişikliği kaydedilemedi:', error);
		throw error;
	}
};

// Kalibrasyon istatistiklerini getir
export const getCalibrationStats = async (): Promise<{
	totalChambers: number;
	upToDate: number;
	dueSoon: number;
	overdue: number;
	avgCalibrationInterval: number;
}> => {
	try {
		const response = await api.get('/settings/calibration/stats');
		return response.data.data;
	} catch (error) {
		console.error('Kalibrasyon istatistikleri getirilemedi:', error);
		throw error;
	}
};
