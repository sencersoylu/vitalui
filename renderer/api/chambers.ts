import { api } from './index';

// Chamber Types - Backend veri modeline göre güncellendi
export interface Chamber {
	id: number;
	name: string; // "Main" veya "Entry"
	description: string;
	lastValue: number; // Son okunan O2 değeri (DECIMAL 5,2)
	// Kalibrasyon verileri (Chamber modeli içinde)
	raw0: number | null; // 0% kalibrasyon için ham değer (INTEGER)
	raw21: number | null; // 21% kalibrasyon için ham değer (INTEGER)
	raw100: string | null; // 100% kalibrasyon için ham değer (TEXT)
	calibrationDate: string; // Son kalibrasyon tarihi
	// Alarm seviyeleri
	alarmLevelHigh: number; // Yüksek alarm seviyesi (DECIMAL 5,2, default: 24.0)
	alarmLevelLow: number; // Düşük alarm seviyesi (DECIMAL 5,2, default: 16.0)
	lastSensorChange: string; // Son sensör değişim tarihi
	isActive: boolean; // Oda aktif mi? (default: true)
	createdAt: string;
	updatedAt: string;
}

// API Response Types
export interface ChambersResponse {
	success: boolean;
	data: Chamber[];
	count: number;
}

export interface AlarmLevelUpdateResponse {
	success: boolean;
	data: {
		id: number;
		name: string;
		alarmLevelHigh: number;
		alarmLevelLow: number;
	};
	message: string;
}

export interface O2Reading {
	id: number;
	chamberId: number; // Oda ID (Foreign Key)
	o2Level: number; // Kalibre edilmiş O2 seviyesi (DECIMAL 5,2, 0-100%)
	temperature: number | null; // Sıcaklık (DECIMAL 5,2, -50 ile 100°C arası, nullable)
	humidity: number | null; // Nem (DECIMAL 5,2, 0-100%, nullable)
	timestamp: string; // Okuma zamanı (default: NOW)
	sensorStatus: string; // 'normal', 'warning', 'error' (ENUM)
	createdAt: string;
	updatedAt: string;
}

// 3 Noktalı Kalibrasyon için veri yapısı
export interface ThreePointCalibrationData {
	zeroPointRaw: number; // 0% için okunan ham değer
	midPointRaw: number; // Orta nokta için okunan ham değer
	hundredPointRaw: number; // 100% için okunan ham değer
	midPointCalibrated?: number; // Orta nokta kalibre değeri (varsayılan 21%)
	calibratedBy?: string; // Kalibrasyonu yapan kişi
	notes?: string; // İsteğe bağlı notlar
}

// Kalibrasyon noktalarını temsil eden interface
export interface CalibrationPoints {
	raw0: number;
	raw21: number;
	raw100: string;
	calibrationDate: string;
	isCalibrated: boolean;
}

// Chamber API Functions

// Tüm odaları getir
export const getChambers = async (): Promise<Chamber[]> => {
	try {
		const response = await api.get('/chambers');
		const responseData: ChambersResponse = response.data;

		// Check if response has the expected structure
		if (!responseData.success) {
			console.warn('getChambers: API returned success: false');
			return [];
		}

		// Eğer data array değilse, boş array döndür
		if (!Array.isArray(responseData.data)) {
			console.warn(
				'getChambers: Response data is not an array, returning empty array'
			);
			return [];
		}

		return responseData.data;
	} catch (error) {
		console.error('Odalar getirilemedi:', error);
		throw error;
	}
};

// Belirli bir odayı getir
export const getChamber = async (chamberId: number): Promise<Chamber> => {
	try {
		const response = await api.get(`/chambers/${chamberId}`);
		return response.data.data;
	} catch (error) {
		console.error('Oda getirilemedi:', error);
		throw error;
	}
};

// Yeni oda oluştur (genellikle sadece test için - sadece 2 sabit kabin var)
export const createChamber = async (
	chamberData: Omit<
		Chamber,
		| 'id'
		| 'createdAt'
		| 'updatedAt'
		| 'lastValue'
		| 'calibrationDate'
		| 'lastSensorChange'
	>
): Promise<Chamber> => {
	try {
		const response = await api.post('/chambers', chamberData);
		return response.data.data;
	} catch (error) {
		console.error('Oda oluşturulamadı:', error);
		throw error;
	}
};

// Oda verilerini güncelle
export const updateChamber = async (
	chamberId: number,
	chamberData: Partial<Chamber>
): Promise<Chamber> => {
	try {
		const response = await api.put(`/chambers/${chamberId}`, chamberData);
		return response.data.data;
	} catch (error) {
		console.error('Oda güncellenemedi:', error);
		throw error;
	}
};

// Oda sil (genellikle sadece test için - sadece 2 sabit kabin var)
export const deleteChamber = async (chamberId: number): Promise<void> => {
	try {
		await api.delete(`/chambers/${chamberId}`);
	} catch (error) {
		console.error('Oda silinemedi:', error);
		throw error;
	}
};

// Reading Functions

// Oda okumalarını getir
export const getChamberReadings = async (
	chamberId: number
): Promise<O2Reading[]> => {
	try {
		const response = await api.get(`/chambers/${chamberId}/readings`);
		const data = response.data.data || response.data;

		// Eğer response array değilse, boş array döndür
		if (!Array.isArray(data)) {
			console.warn(
				'getChamberReadings: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Okumalar getirilemedi:', error);
		throw error;
	}
};

// En son okumayı getir
export const getLatestReading = async (
	chamberId: number
): Promise<O2Reading> => {
	try {
		const response = await api.get(`/chambers/${chamberId}/readings/latest`);
		return response.data.data;
	} catch (error) {
		console.error('Son okuma getirilemedi:', error);
		throw error;
	}
};

// Yeni okuma ekle (otomatik kalibrasyon)
export const addReading = async (
	chamberId: number,
	readingData: {
		o2Level: number; // Ham değer - backend tarafında kalibre edilir
		temperature?: number;
		humidity?: number;
		sensorStatus?: string;
	}
): Promise<O2Reading> => {
	try {
		const response = await api.post(`/chambers/${chamberId}/readings`, {
			o2Level: readingData.o2Level,
			temperature: readingData.temperature || null,
			humidity: readingData.humidity || null,
			sensorStatus: readingData.sensorStatus || 'normal',
		});
		return response.data.data;
	} catch (error) {
		console.error('Okuma eklenemedi:', error);
		throw error;
	}
};

// Geçmiş verileri getir
export const getReadingHistory = async (
	chamberId: number,
	startDate?: string,
	endDate?: string
): Promise<O2Reading[]> => {
	try {
		const params = new URLSearchParams();
		if (startDate) params.append('startDate', startDate);
		if (endDate) params.append('endDate', endDate);

		const response = await api.get(
			`/chambers/${chamberId}/readings/history?${params.toString()}`
		);
		const data = response.data.data || response.data;

		// Eğer response array değilse, boş array döndür
		if (!Array.isArray(data)) {
			console.warn(
				'getReadingHistory: Response is not an array, returning empty array'
			);
			return [];
		}

		return data;
	} catch (error) {
		console.error('Geçmiş veriler getirilemedi:', error);
		throw error;
	}
};

// Alarm Level Functions

// Alarm seviyesini güncelle
export const updateAlarmLevel = async (
	chamberId: number,
	alarmLevelHigh: number
): Promise<AlarmLevelUpdateResponse> => {
	try {
		const response = await api.put(`/chambers/${chamberId}/alarm-level`, {
			alarmLevelHigh,
		});
		return response.data;
	} catch (error) {
		console.error('Alarm seviyesi güncellenemedi:', error);
		throw error;
	}
};

// Not: Settings ve Kalibrasyon fonksiyonları artık ayrı settings.ts dosyasında
