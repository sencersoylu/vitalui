import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DashboardState {
  // Theme state
  darkMode: boolean
  setDarkMode: (dark: boolean) => void
  
  // Connection state
  connected: boolean
  setConnected: (connected: boolean) => void
  
  // Time states
  currentTime: string
  currentTime2: string
  setCurrentTime: (time: string) => void
  setCurrentTime2: (time: string) => void
  
  // Modal states
  showCalibrationModal: boolean
  showErrorModal: boolean
  showSeatAlarmModal: boolean
  showChillerModal: boolean
  setShowCalibrationModal: (show: boolean) => void
  setShowErrorModal: (show: boolean) => void
  setShowSeatAlarmModal: (show: boolean) => void
  setShowChillerModal: (show: boolean) => void
  
  // Chiller states
  chillerRunning: boolean
  chillerCurrentTemp: number
  chillerSetTemp: number
  setChillerRunning: (running: boolean) => void
  setChillerCurrentTemp: (temp: number) => void
  setChillerSetTemp: (temp: number) => void
  
  // Calibration states
  calibrationProgress: number
  calibrationStatus: string
  setCalibrationProgress: (progress: number) => void
  setCalibrationStatus: (status: string) => void
  
  // Error states
  errorMessage: string
  setErrorMessage: (message: string) => void
  
  // Device control states
  lightStatus: number
  fan1Status: number
  fan2Status: number
  autoMode: boolean
  airMode: boolean
  ventilMode: number
  light2Status: number
  valve1Status: boolean
  valve2Status: boolean
  playing: boolean
  
  // Control functions
  setLightStatus: (status: number) => void
  setFan1Status: (status: number) => void
  setFan2Status: (status: number) => void
  setAutoMode: (mode: boolean) => void
  setAirMode: (mode: boolean) => void
  setVentilMode: (mode: number) => void
  setLight2Status: (status: number) => void
  setValve1Status: (status: boolean) => void
  setValve2Status: (status: boolean) => void
  setPlaying: (playing: boolean) => void
  
  // Seat alarm state
  activeSeatAlarm: { seatNumber: number | string } | null
  setActiveSeatAlarm: (alarm: { seatNumber: number | string } | null) => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Initial states
      darkMode: true,
      connected: false,
      currentTime: '',
      currentTime2: '',
      showCalibrationModal: false,
      showErrorModal: false,
      showSeatAlarmModal: false,
      showChillerModal: false,
      calibrationProgress: 0,
      calibrationStatus: '',
      errorMessage: '',
      lightStatus: 0,
      fan1Status: 0,
      fan2Status: 0,
      autoMode: false,
      airMode: false,
      ventilMode: 0,
      light2Status: 0,
      valve1Status: false,
      valve2Status: false,
      playing: false,
      activeSeatAlarm: null,
      chillerRunning: false,
      chillerCurrentTemp: 20.0,
      chillerSetTemp: 20.0,
      
      // Setters
      setDarkMode: (dark) => set({ darkMode: dark }),
      setConnected: (connected) => set({ connected }),
      setCurrentTime: (time) => set({ currentTime: time }),
      setCurrentTime2: (time) => set({ currentTime2: time }),
      setShowCalibrationModal: (show) => set({ showCalibrationModal: show }),
      setShowErrorModal: (show) => set({ showErrorModal: show }),
      setShowSeatAlarmModal: (show) => set({ showSeatAlarmModal: show }),
      setShowChillerModal: (show) => set({ showChillerModal: show }),
      setChillerRunning: (running) => set({ chillerRunning: running }),
      setChillerCurrentTemp: (temp) => set({ chillerCurrentTemp: temp }),
      setChillerSetTemp: (temp) => set({ chillerSetTemp: temp }),
      setCalibrationProgress: (progress) => set({ calibrationProgress: progress }),
      setCalibrationStatus: (status) => set({ calibrationStatus: status }),
      setErrorMessage: (message) => set({ errorMessage: message }),
      setLightStatus: (status) => set({ lightStatus: status }),
      setFan1Status: (status) => set({ fan1Status: status }),
      setFan2Status: (status) => set({ fan2Status: status }),
      setAutoMode: (mode) => set({ autoMode: mode }),
      setAirMode: (mode) => set({ airMode: mode }),
      setVentilMode: (mode) => set({ ventilMode: mode }),
      setLight2Status: (status) => set({ light2Status: status }),
      setValve1Status: (status) => set({ valve1Status: status }),
      setValve2Status: (status) => set({ valve2Status: status }),
      setPlaying: (playing) => set({ playing }),
      setActiveSeatAlarm: (alarm) => set({ activeSeatAlarm: alarm }),
    }),
    {
      name: 'dashboard-storage', // unique name for localStorage
    }
  )
) 