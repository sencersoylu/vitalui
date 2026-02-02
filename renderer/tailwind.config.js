const colors = require('tailwindcss/colors');

module.exports = {
	content: [
		'./renderer/pages/**/*.{js,ts,jsx,tsx}',
		'./renderer/components/**/*.{js,ts,jsx,tsx}',
	],
	darkMode: 'class',
	theme: {
		colors: {
			// Base colors
			white: colors.white,
			black: colors.black,
			gray: colors.gray,
			slate: colors.slate,
			blue: colors.blue,
			indigo: colors.indigo,
			violet: colors.violet,
			cyan: colors.cyan,
			emerald: colors.emerald,
			amber: colors.amber,
			orange: colors.orange,
			rose: colors.rose,
			red: colors.red,
			green: colors.green,
			transparent: 'transparent',
			current: 'currentColor',
		},
		extend: {
			// Custom border radius scale
			borderRadius: {
				'4xl': '2.5rem',
				'5xl': '3rem',
			},
			// Font family mappings
			fontFamily: {
				sans: ['Poppins', 'sans-serif'],
				poppins: ['Poppins', 'sans-serif'],
			},
			// Animation configurations
			animation: {
				'fade-in': 'fadeIn 0.3s ease-out',
				'fade-out': 'fadeOut 0.2s ease-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'slide-down': 'slideDown 0.3s ease-out',
				'scale-in': 'scaleIn 0.2s ease-out',
				'scale-out': 'scaleOut 0.2s ease-out',
				'zoom-in': 'zoomIn 0.3s ease-out',
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' },
				},
				fadeOut: {
					'0%': { opacity: '1' },
					'100%': { opacity: '0' },
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				slideDown: {
					'0%': { transform: 'translateY(-10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' },
				},
				scaleIn: {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				scaleOut: {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'100%': { transform: 'scale(0.95)', opacity: '0' },
				},
				zoomIn: {
					'0%': { transform: 'scale(0.9)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
			},
			colors: {
				// Custom brand colors
				brand: {
					blue: '#4a90e2',
					'card-bg': 'rgba(37, 78, 126, 0.09)',
				},
				// Semantic colors for components
				primary: {
					DEFAULT: '#4a90e2',
					DEFAULT: {
						light: '#60a5fa',
						DEFAULT: '#4a90e2',
						dark: '#3b82f6',
					},
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: colors.gray[100],
					foreground: colors.gray[900],
				},
				success: {
					light: '#6ee7b7',
					DEFAULT: colors.emerald[500],
					dark: colors.emerald[600],
					foreground: '#ffffff',
				},
				warning: {
					light: colors.amber[300],
					DEFAULT: colors.amber[500],
					dark: colors.amber[600],
					foreground: '#ffffff',
				},
				danger: {
					light: '#fca5a5',
					DEFAULT: colors.red[500],
					dark: colors.red[600],
					foreground: '#ffffff',
				},
				info: {
					light: colors.blue[300],
					DEFAULT: colors.blue[500],
					dark: colors.blue[600],
					foreground: '#ffffff',
				},
				destructive: {
					DEFAULT: colors.red[500],
					foreground: '#ffffff',
				},
				muted: {
					light: colors.gray[100],
					DEFAULT: colors.gray[400],
					dark: colors.gray[600],
					foreground: colors.gray[600],
				},
				accent: {
					light: colors.gray[100],
					DEFAULT: colors.gray[100],
					dark: colors.gray[200],
					foreground: colors.gray[900],
				},
				border: colors.gray[200],
				input: colors.gray[200],
				ring: colors.blue[500],
				background: '#ffffff',
				foreground: colors.gray[900],
			},
		},
	},
	plugins: [],
};
