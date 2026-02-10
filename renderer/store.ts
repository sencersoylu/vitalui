import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getWindowId(): string {
  if (typeof window === 'undefined') return 'main'
  const params = new URLSearchParams(window.location.search)
  return params.get('windowId') || 'main'
}

function migrateOldStorage() {
  if (typeof window === 'undefined') return
  const windowId = getWindowId()
  if (windowId === 'main') return
  const oldData = localStorage.getItem('dashboard-storage')
  const newKey = `dashboard-storage-${windowId}`
  if (oldData && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, oldData)
  }
}

migrateOldStorage()

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

  // Technical Room State
  lp1Status: boolean
  lp2Status: boolean
  hp1Status: boolean
  hpCylinderPressure: number
  airTankPressure: number
  nitrogen1Pressure: number
  nitrogen2Pressure: number
  mainFssLevel: number
  mainFssPressure: number
  mainFssActive: boolean
  anteFssLevel: number
  anteFssPressure: number
  anteFssActive: boolean
  anteFssWarning: boolean
  seatPressures: number[]
  primaryO2Pressure: number
  secondaryO2Pressure: number
  liquidO2Pressure: number
  primaryO2Active: boolean
  secondaryO2Active: boolean
  liquidO2Active: boolean

  // Technical Room Setters
  setLp1Status: (status: boolean) => void
  setLp2Status: (status: boolean) => void
  setHp1Status: (status: boolean) => void
  setHpCylinderPressure: (pressure: number) => void
  setAirTankPressure: (pressure: number) => void
  setNitrogen1Pressure: (pressure: number) => void
  setNitrogen2Pressure: (pressure: number) => void
  setMainFssLevel: (level: number) => void
  setMainFssPressure: (pressure: number) => void
  setMainFssActive: (active: boolean) => void
  setAnteFssLevel: (level: number) => void
  setAnteFssPressure: (pressure: number) => void
  setAnteFssActive: (active: boolean) => void
  setAnteFssWarning: (warning: boolean) => void
  setSeatPressures: (pressures: number[]) => void
  setPrimaryO2Pressure: (pressure: number) => void
  setSecondaryO2Pressure: (pressure: number) => void
  setLiquidO2Pressure: (pressure: number) => void
  setPrimaryO2Active: (active: boolean) => void
  setSecondaryO2Active: (active: boolean) => void
  setLiquidO2Active: (active: boolean) => void

  // Sensor alarm states
  mainFssAlarm: boolean
  anteFssAlarm: boolean
  mainFlameDetected: boolean
  mainSmokeDetected: boolean
  anteSmokeDetected: boolean
  mainHighO2: boolean
  anteHighO2: boolean

  // Sensor alarm setters
  setMainFssAlarm: (alarm: boolean) => void
  setAnteFssAlarm: (alarm: boolean) => void
  setMainFlameDetected: (detected: boolean) => void
  setMainSmokeDetected: (detected: boolean) => void
  setAnteSmokeDetected: (detected: boolean) => void
  setMainHighO2: (high: boolean) => void
  setAnteHighO2: (high: boolean) => void
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

      // Technical Room Initial States
      lp1Status: true,
      lp2Status: true,
      hp1Status: true,
      hpCylinderPressure: 120,
      airTankPressure: 12.1,
      nitrogen1Pressure: 120,
      nitrogen2Pressure: 120,
      mainFssLevel: 60,
      mainFssPressure: 12.1,
      mainFssActive: true,
      anteFssLevel: 60,
      anteFssPressure: 12.1,
      anteFssActive: false,
      anteFssWarning: true,
      seatPressures: Array(12).fill(0.5),
      primaryO2Pressure: 120,
      secondaryO2Pressure: 120,
      liquidO2Pressure: 120,
      primaryO2Active: true,
      secondaryO2Active: false,
      liquidO2Active: false,

      // Sensor alarm initial states
      mainFssAlarm: false,
      anteFssAlarm: false,
      mainFlameDetected: false,
      mainSmokeDetected: false,
      anteSmokeDetected: false,
      mainHighO2: false,
      anteHighO2: false,

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

      // Technical Room Setters
      setLp1Status: (status) => set({ lp1Status: status }),
      setLp2Status: (status) => set({ lp2Status: status }),
      setHp1Status: (status) => set({ hp1Status: status }),
      setHpCylinderPressure: (pressure) => set({ hpCylinderPressure: pressure }),
      setAirTankPressure: (pressure) => set({ airTankPressure: pressure }),
      setNitrogen1Pressure: (pressure) => set({ nitrogen1Pressure: pressure }),
      setNitrogen2Pressure: (pressure) => set({ nitrogen2Pressure: pressure }),
      setMainFssLevel: (level) => set({ mainFssLevel: level }),
      setMainFssPressure: (pressure) => set({ mainFssPressure: pressure }),
      setMainFssActive: (active) => set({ mainFssActive: active }),
      setAnteFssLevel: (level) => set({ anteFssLevel: level }),
      setAnteFssPressure: (pressure) => set({ anteFssPressure: pressure }),
      setAnteFssActive: (active) => set({ anteFssActive: active }),
      setAnteFssWarning: (warning) => set({ anteFssWarning: warning }),
      setSeatPressures: (pressures) => set({ seatPressures: pressures }),
      setPrimaryO2Pressure: (pressure) => set({ primaryO2Pressure: pressure }),
      setSecondaryO2Pressure: (pressure) => set({ secondaryO2Pressure: pressure }),
      setLiquidO2Pressure: (pressure) => set({ liquidO2Pressure: pressure }),
      setPrimaryO2Active: (active) => set({ primaryO2Active: active }),
      setSecondaryO2Active: (active) => set({ secondaryO2Active: active }),
      setLiquidO2Active: (active) => set({ liquidO2Active: active }),

      // Sensor alarm setters
      setMainFssAlarm: (alarm) => set({ mainFssAlarm: alarm }),
      setAnteFssAlarm: (alarm) => set({ anteFssAlarm: alarm }),
      setMainFlameDetected: (detected) => set({ mainFlameDetected: detected }),
      setMainSmokeDetected: (detected) => set({ mainSmokeDetected: detected }),
      setAnteSmokeDetected: (detected) => set({ anteSmokeDetected: detected }),
      setMainHighO2: (high) => set({ mainHighO2: high }),
      setAnteHighO2: (high) => set({ anteHighO2: high }),
    }),
    {
      name: `dashboard-storage-${getWindowId()}`,
    }
  )
) 