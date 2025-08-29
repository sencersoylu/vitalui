# O2 Analyzer - Frontend Backend Entegrasyonu

## Proje Genel Bakış

Bu proje, O2 (oksijen) analizörü için kapsamlı bir backend API sistemi içermektedir. Backend Node.js, Express.js ve SQLite kullanılarak geliştirilmiştir. Frontend ile entegrasyon için aşağıdaki bilgileri kullanabilirsiniz.

## Backend API Endpoint'leri

### Base URL

```
http://localhost:3001
```

### Ana Endpoint'ler

#### 1. Chamber (Oda) Yönetimi

```
GET    /api/chambers                    - Tüm odaları listele
GET    /api/chambers/:id                - Belirli bir odayı getir
POST   /api/chambers                    - Yeni oda oluştur
PUT    /api/chambers/:id                - Oda bilgilerini güncelle
DELETE /api/chambers/:id                - Oda sil

GET    /api/chambers/:id/readings       - Oda okumalarını getir
GET    /api/chambers/:id/readings/latest - En son okumayı getir
POST   /api/chambers/:id/readings       - Yeni okuma ekle
GET    /api/chambers/:id/readings/history - Geçmiş verileri getir
```

#### 2. Alarm Yönetimi

```
GET    /api/alarms                      - Aktif alarmları listele
GET    /api/alarms/history              - Alarm geçmişini getir
GET    /api/alarms/stats                - Alarm istatistiklerini getir
GET    /api/alarms/:id                  - Belirli odanın alarmlarını getir
POST   /api/alarms/:id/mute             - Alarmı sustur
POST   /api/alarms/:id/resolve          - Alarmı çöz
```

#### 3. Ayarlar Yönetimi

```
GET    /api/chambers/:id                - Oda ayarlarını getir
PUT    /api/chambers/:id                - Oda ayarlarını güncelle

POST   /api/chambers/:id/calibrate      - Kalibrasyon yap
POST   /api/chambers/:id/sensor-changed - Sensör değişikliğini kaydet
GET    /api/chambers/:id/calibration-history - Kalibrasyon geçmişini getir
GET    /api/chambers/:id/calibration-status - Kalibrasyon durumunu kontrol et
POST   /api/chambers/:id/calibration-required - Kalibrasyon gerekli işaretle

GET    /api/chambers/calibration/stats  - Kalibrasyon istatistiklerini getir
```

#### 4. Analitik ve Raporlar

```
GET    /api/analytics/dashboard         - Dashboard verilerini getir
GET    /api/analytics/trends            - O2 trendlerini getir
GET    /api/analytics/reports/calibration-history - Kalibrasyon raporları
GET    /api/analytics/reports/alarm-summary - Alarm özet raporları
```

#### 5. Sistem Endpoint'leri

```
GET    /health                          - Sistem sağlık kontrolü
GET    /                                - API bilgileri
```

## Veri Modelleri

### Chamber (Oda)

```javascript
{
  id: number,
  name: string,
  location: string,
  description: string,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### O2Reading (O2 Okuması)

```javascript
{
  id: number,
  chamberId: number,
  o2Level: number,        // O2 seviyesi (%)
  temperature: number,    // Sıcaklık (°C)
  humidity: number,       // Nem (%)
  timestamp: Date,
  isCalibrated: boolean,
  sensorStatus: string    // 'normal', 'warning', 'error'
}
```

### Alarm

```javascript
{
  id: number,
  chamberId: number,
  type: string,           // 'low_o2', 'high_o2', 'sensor_error', 'calibration_needed'
  severity: string,       // 'low', 'medium', 'high', 'critical'
  message: string,
  isActive: boolean,
  isMuted: boolean,
  createdAt: Date,
  resolvedAt: Date
}
```

### ChamberSettings (Oda Ayarları)

```javascript
{
  id: number,
  chamberId: number,
  minO2Level: number,     // Minimum O2 seviyesi (%)
  maxO2Level: number,     // Maksimum O2 seviyesi (%)
  calibrationInterval: number, // Kalibrasyon aralığı (gün)
  alarmEnabled: boolean,
  lastCalibration: Date,
  nextCalibrationDue: Date
}
```

## Frontend Entegrasyonu İçin Örnekler

### 1. Axios ile API Çağrıları

```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// API instance oluştur
const api = axios.create({
	baseURL: API_BASE_URL,
	timeout: 10000,
	headers: {
		'Content-Type': 'application/json',
	},
});

// Tüm odaları getir
const getChambers = async () => {
	try {
		const response = await api.get('/chambers');
		return response.data;
	} catch (error) {
		console.error('Odalar getirilemedi:', error);
		throw error;
	}
};

// Belirli bir odanın okumalarını getir
const getChamberReadings = async (chamberId) => {
	try {
		const response = await api.get(`/chambers/${chamberId}/readings`);
		return response.data;
	} catch (error) {
		console.error('Okumalar getirilemedi:', error);
		throw error;
	}
};

// Yeni okuma ekle
const addReading = async (chamberId, readingData) => {
	try {
		const response = await api.post(
			`/chambers/${chamberId}/readings`,
			readingData
		);
		return response.data;
	} catch (error) {
		console.error('Okuma eklenemedi:', error);
		throw error;
	}
};

// Aktif alarmları getir
const getActiveAlarms = async () => {
	try {
		const response = await api.get('/alarms');
		return response.data;
	} catch (error) {
		console.error('Alarmlar getirilemedi:', error);
		throw error;
	}
};
```

### 2. React Hook Örneği

```javascript
import { useState, useEffect } from 'react';
import { getChambers, getChamberReadings } from './api';

const useChambers = () => {
	const [chambers, setChambers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchChambers = async () => {
			try {
				setLoading(true);
				const data = await getChambers();
				setChambers(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchChambers();
	}, []);

	return { chambers, loading, error };
};

const useChamberReadings = (chamberId) => {
	const [readings, setReadings] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!chamberId) return;

		const fetchReadings = async () => {
			try {
				setLoading(true);
				const data = await getChamberReadings(chamberId);
				setReadings(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchReadings();
	}, [chamberId]);

	return { readings, loading, error };
};
```

### 3. Real-time Socket.IO Bağlantısı

```javascript
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

class SocketService {
	constructor() {
		this.socket = null;
		this.isConnected = false;
	}

	connect() {
		this.socket = io(SOCKET_URL, {
			transports: ['websocket', 'polling'],
			timeout: 20000,
		});

		this.socket.on('connect', () => {
			console.log('Socket.IO bağlantısı kuruldu');
			this.isConnected = true;
		});

		this.socket.on('disconnect', () => {
			console.log('Socket.IO bağlantısı kesildi');
			this.isConnected = false;
		});

		this.socket.on('error', (error) => {
			console.error('Socket.IO hatası:', error);
		});

		return this.socket;
	}

	// Yeni O2 okuması dinle
	onNewReading(callback) {
		if (this.socket) {
			this.socket.on('new_reading', callback);
		}
	}

	// Yeni alarm dinle
	onNewAlarm(callback) {
		if (this.socket) {
			this.socket.on('new_alarm', callback);
		}
	}

	// Kalibrasyon durumu değişikliği dinle
	onCalibrationUpdate(callback) {
		if (this.socket) {
			this.socket.on('calibration_update', callback);
		}
	}

	disconnect() {
		if (this.socket) {
			this.socket.disconnect();
			this.socket = null;
			this.isConnected = false;
		}
	}
}

// Kullanım örneği
const socketService = new SocketService();
const socket = socketService.connect();

socketService.onNewReading((reading) => {
	console.log('Yeni O2 okuması:', reading);
	// UI'ı güncelle
});

socketService.onNewAlarm((alarm) => {
	console.log('Yeni alarm:', alarm);
	// Alarm bildirimi göster
});
```

### 4. React Context ile Global State Yönetimi

```javascript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getChambers, getActiveAlarms } from './api';
import { socketService } from './socketService';

const AppContext = createContext();

const initialState = {
	chambers: [],
	alarms: [],
	readings: {},
	loading: false,
	error: null,
};

const appReducer = (state, action) => {
	switch (action.type) {
		case 'SET_LOADING':
			return { ...state, loading: action.payload };
		case 'SET_ERROR':
			return { ...state, error: action.payload };
		case 'SET_CHAMBERS':
			return { ...state, chambers: action.payload };
		case 'SET_ALARMS':
			return { ...state, alarms: action.payload };
		case 'ADD_READING':
			return {
				...state,
				readings: {
					...state.readings,
					[action.payload.chamberId]: [
						...(state.readings[action.payload.chamberId] || []),
						action.payload.reading,
					],
				},
			};
		case 'ADD_ALARM':
			return {
				...state,
				alarms: [action.payload, ...state.alarms],
			};
		default:
			return state;
	}
};

export const AppProvider = ({ children }) => {
	const [state, dispatch] = useReducer(appReducer, initialState);

	useEffect(() => {
		const initializeData = async () => {
			try {
				dispatch({ type: 'SET_LOADING', payload: true });

				const [chambers, alarms] = await Promise.all([
					getChambers(),
					getActiveAlarms(),
				]);

				dispatch({ type: 'SET_CHAMBERS', payload: chambers });
				dispatch({ type: 'SET_ALARMS', payload: alarms });
			} catch (error) {
				dispatch({ type: 'SET_ERROR', payload: error.message });
			} finally {
				dispatch({ type: 'SET_LOADING', payload: false });
			}
		};

		initializeData();
	}, []);

	useEffect(() => {
		// Socket.IO event listeners
		socketService.onNewReading((reading) => {
			dispatch({ type: 'ADD_READING', payload: reading });
		});

		socketService.onNewAlarm((alarm) => {
			dispatch({ type: 'ADD_ALARM', payload: alarm });
		});

		return () => {
			socketService.disconnect();
		};
	}, []);

	return (
		<AppContext.Provider value={{ state, dispatch }}>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = () => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error('useApp must be used within an AppProvider');
	}
	return context;
};
```

## Hata Yönetimi

### API Hata Kodları

- `400` - Bad Request (Geçersiz veri)
- `404` - Not Found (Kaynak bulunamadı)
- `422` - Unprocessable Entity (Validasyon hatası)
- `500` - Internal Server Error (Sunucu hatası)

### Hata Yakalama Örneği

```javascript
const handleApiError = (error) => {
	if (error.response) {
		// Sunucu yanıt verdi ama hata kodu döndü
		const { status, data } = error.response;

		switch (status) {
			case 400:
				return `Geçersiz veri: ${data.message}`;
			case 404:
				return 'Kaynak bulunamadı';
			case 422:
				return `Validasyon hatası: ${data.message}`;
			case 500:
				return 'Sunucu hatası oluştu';
			default:
				return `Beklenmeyen hata: ${status}`;
		}
	} else if (error.request) {
		// İstek yapıldı ama yanıt alınamadı
		return 'Sunucuya bağlanılamıyor';
	} else {
		// İstek oluşturulurken hata oluştu
		return 'İstek oluşturulamadı';
	}
};
```

## Güvenlik

### CORS Ayarları

Backend CORS ayarları `http://localhost:3000` için yapılandırılmıştır. Frontend farklı bir port kullanıyorsa, backend'deki CORS ayarlarını güncellemeniz gerekebilir.

### Rate Limiting

API'de rate limiting aktif. Çok fazla istek gönderirseniz geçici olarak engellenebilirsiniz.

## Performans İpuçları

1. **Pagination**: Büyük veri setleri için pagination kullanın
2. **Caching**: Sık kullanılan verileri cache'leyin
3. **Debouncing**: Real-time arama için debouncing kullanın
4. **Optimistic Updates**: UI'da anında güncelleme yapın, sonra API'yi çağırın

## Test Etme

### Backend'i Başlatma

```bash
cd o2_analyzer
npm install
npm run dev
```

### API Test Etme

```bash
# Health check
curl http://localhost:3001/health

# Odaları listele
curl http://localhost:3001/api/chambers

# Aktif alarmları getir
curl http://localhost:3001/api/alarms
```

## Örnek Frontend Projesi Yapısı

```
frontend/
├── src/
│   ├── api/
│   │   ├── index.js          # API client
│   │   ├── chambers.js       # Chamber API calls
│   │   ├── alarms.js         # Alarm API calls
│   │   └── analytics.js      # Analytics API calls
│   ├── hooks/
│   │   ├── useChambers.js
│   │   ├── useAlarms.js
│   │   └── useSocket.js
│   ├── context/
│   │   └── AppContext.js
│   ├── components/
│   │   ├── ChamberList.js
│   │   ├── AlarmPanel.js
│   │   ├── O2Chart.js
│   │   └── SettingsForm.js
│   ├── services/
│   │   └── socketService.js
│   └── utils/
│       ├── errorHandler.js
│       └── formatters.js
├── package.json
└── README.md
```

Bu prompt, O2 Analyzer backend API'si ile frontend entegrasyonu için gerekli tüm bilgileri içermektedir. Herhangi bir sorunuz olursa veya daha detaylı örnekler isterseniz, lütfen belirtin.
