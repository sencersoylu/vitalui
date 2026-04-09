import axios from 'axios';

// API Base URL
const API_BASE_URL =
	process.env.NODE_ENV === 'production'
		? 'http://localhost:3001/api'
		: 'http://localhost:3001/api';

// Create API instance
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

// API Error Handler
export const handleApiError = (error: any): string => {
	if (error.response) {
		// Server responded with error status
		const { status, data } = error.response;

		switch (status) {
			case 400:
				return `Invalid data: ${data.message || 'Bad Request'}`;
			case 403:
				return 'Forbidden: ' + (data.message || 'Forbidden');
			case 404:
				return 'Resource not found';
			case 422:
				return `Validation error: ${data.message || 'Unprocessable Entity'}`;
			case 500:
				return 'Internal server error';
			default:
				return `Beklenmeyen hata: ${status}`;
		}
	} else if (error.request) {
		// Request made but no response received
		return 'Cannot connect to server. Make sure the backend is running.';
	} else {
		// Error creating request
		return 'Failed to create request';
	}
};

// Re-export chamber functions for easy access
export * from './chambers';
export * from './alarms';
export * from './analytics';
