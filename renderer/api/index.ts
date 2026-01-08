import axios from 'axios';

// API Base URL - Backend'in çalışacağı port
const API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? 'http://localhost:3001/api'
		: 'http://localhost:3001/api';

// API instance oluştur
export const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Request interceptor
api.interceptors.request.use(
	(config) => {
		console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
		return config;
	},
	(error) => {
		console.error('Request error:', error);
		return Promise.reject(error);
	}
);

// Response interceptor
api.interceptors.response.use(
	(response) => {
		console.log(`API Response: ${response.status} ${response.config.url}`);
		return response;
	},
	(error) => {
		console.error('Response error:', error.response?.data || error.message);
		return Promise.reject(error);
	}
);

// API Hata Yönetimi
export const handleApiError = (error: any): string => {
	if (error.response) {
		// Sunucu yanıt verdi ama hata kodu döndü
		const { status, data } = error.response;

		switch (status) {
			case 400:
				return `Geçersiz veri: ${data.message || 'Bad Request'}`;
			case 403:
				return 'Bu işlem yasak: ' + (data.message || 'Forbidden');
			case 404:
				return 'Kaynak bulunamadı';
			case 422:
				return `Validasyon hatası: ${data.message || 'Unprocessable Entity'}`;
			case 500:
				return 'Sunucu hatası oluştu';
			default:
				return `Beklenmeyen hata: ${status}`;
		}
	} else if (error.request) {
		// İstek yapıldı ama yanıt alınamadı
		return "Sunucuya bağlanılamıyor. Backend'in çalıştığından emin olun.";
	} else {
		// İstek oluşturulurken hata oluştu
		return 'İstek oluşturulamadı';
	}
};

// Re-export chamber functions for easy access
export * from './chambers';
export * from './alarms';
export * from './analytics';
