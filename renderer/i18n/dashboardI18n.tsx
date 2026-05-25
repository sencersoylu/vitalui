/**
 * Lightweight i18n for the dashboard.tsx page.
 *
 * Usage:
 *   - dashboard.tsx wraps its content in <I18nProvider lang={getLangFromUrl()}>
 *   - Any child component calls `const t = useT()` and uses `t('key')`.
 *   - Other pages that don't wrap in a provider get the default ('en'), so the
 *     shared components (Header, modals, panels) keep working everywhere.
 *
 * URL contract: append `?lang=it` to switch to Italian; default is English.
 */
import React, { createContext, useContext } from 'react';

export type Lang = 'en' | 'it';

const dictionary = {
	// dashboard.tsx
	pageTitle: { en: 'Dashboard - Chamber Control', it: 'Dashboard - Controllo Camera' },

	// Header.tsx
	connected: { en: 'Connected', it: 'Connesso' },
	disconnected: { en: 'Disconnected', it: 'Disconnesso' },

	// ChamberControlPanel.tsx
	chamberControl: { en: 'Chamber Control', it: 'Controllo Camera' },
	manual: { en: 'Manual', it: 'Manuale' },
	automatic: { en: 'Automatic', it: 'Automatico' },
	air: { en: 'Air', it: 'Aria' },
	oxygen: { en: 'Oxygen', it: 'Ossigeno' },
	ventil: { en: 'Ventil', it: 'Ventil' },
	off: { en: 'Off', it: 'Off' },
	low: { en: 'Low', it: 'Basso' },
	med: { en: 'Med', it: 'Medio' },
	high: { en: 'High', it: 'Alto' },
	chiller: { en: 'Chiller', it: 'Chiller' },

	// AuxiliaryOutputPanel.tsx
	auxDecomp: { en: 'Auxiliary Decompression', it: 'Decompressione Ausiliaria' },
	hidePanel: { en: 'Hide panel', it: 'Nascondi pannello' },
	mainShort: { en: 'Main', it: 'Principale' },
	anteShort: { en: 'Ante', it: 'Anti' },
	closed: { en: 'Closed', it: 'Chiusa' },
	open: { en: 'Open', it: 'Aperta' },

	// LightingPanel.tsx / FanPanel.tsx
	lighting: { en: 'Lighting', it: 'Illuminazione' },
	fan: { en: 'Fan', it: 'Ventilatore' },

	// ErrorModal.tsx
	warning: { en: 'Warning', it: 'Attenzione' },
	close: { en: 'Close', it: 'Chiudi' },

	// SeatAlarmModal.tsx
	seatAlarm: { en: 'Seat Alarm', it: 'Allarme Sedile' },
	closeAlarm: { en: 'Close Alarm', it: 'Chiudi Allarme' },

	// Seat names (data[16] mapping)
	seatNurse: { en: 'Nurse', it: 'Infermiere' },
	seatAnte1: { en: 'Ante 1', it: 'Anti 1' },
	seatAnte2: { en: 'Ante 2', it: 'Anti 2' },
	seatAnteNurse: { en: 'Ante Nurse', it: 'Anti Infermiere' },

	// ChillerControlModal.tsx
	chillerStatus: { en: 'Chiller Status', it: 'Stato Chiller' },
	running: { en: 'Running', it: 'In funzione' },
	stopped: { en: 'Stopped', it: 'Fermo' },
	currentWaterTemp: { en: 'Current Water Temperature', it: 'Temperatura acqua attuale' },
	targetWaterTemp: { en: 'Target Water Temperature', it: 'Temperatura acqua desiderata' },
	stopChiller: { en: 'Stop Chiller', it: 'Ferma Chiller' },
	startChiller: { en: 'Start Chiller', it: 'Avvia Chiller' },

	// Error messages (dashboard.tsx setErrorMessage calls)
	mainFssActivated: {
		en: 'Main Chamber Fire Suppression System Activated!',
		it: 'Sistema antincendio camera principale attivato!',
	},
	anteFssActivated: {
		en: 'Ante Chamber Fire Suppression System Activated!',
		it: 'Sistema antincendio anti-camera attivato!',
	},
	mainFlameDetected: {
		en: 'Main Chamber Flame Detected!',
		it: 'Fiamma rilevata nella camera principale!',
	},
	mainSmokeDetected: {
		en: 'Main Chamber Smoke Detected!',
		it: 'Fumo rilevato nella camera principale!',
	},
	anteSmokeDetected: {
		en: 'Ante Chamber Smoke Detected!',
		it: 'Fumo rilevato nell’anti-camera!',
	},
	mainHighO2: {
		en: 'Main Chamber High O2 Level!',
		it: 'Livello O₂ alto nella camera principale!',
	},
	anteHighO2: {
		en: 'Ante Chamber High O2 Level!',
		it: 'Livello O₂ alto nell’anti-camera!',
	},
} as const;

export type DictKey = keyof typeof dictionary;

const I18nContext = createContext<Lang>('en');

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
	return <I18nContext.Provider value={lang}>{children}</I18nContext.Provider>;
}

export function useLang(): Lang {
	return useContext(I18nContext);
}

export function useT() {
	const lang = useContext(I18nContext);
	return (key: DictKey): string => dictionary[key][lang] ?? dictionary[key].en;
}

/** Reads ?lang= from the current URL. Defaults to 'en'. Client-side only. */
export function getLangFromUrl(): Lang {
	if (typeof window === 'undefined') return 'en';
	const params = new URLSearchParams(window.location.search);
	return params.get('lang') === 'it' ? 'it' : 'en';
}
