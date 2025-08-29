const colors = require('tailwindcss/colors');

module.exports = {
	content: [
		'./renderer/pages/**/*.{js,ts,jsx,tsx}',
		'./renderer/components/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		colors: {
			// use colors only specified
			white: colors.white,
			black: colors.black,
			gray: colors.gray,
			blue: colors.blue,
			red: colors.red,
			green: colors.green,
			transparent: 'transparent',
			current: 'currentColor',
		},
		extend: {
			fontFamily: {
				sans: ['Poppins', 'sans-serif'],
				poppins: ['Poppins', 'sans-serif'],
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
					foreground: '#ffffff',
				},
				secondary: {
					DEFAULT: colors.gray[100],
					foreground: colors.gray[900],
				},
				destructive: {
					DEFAULT: colors.red[500],
					foreground: '#ffffff',
				},
				muted: {
					DEFAULT: colors.gray[100],
					foreground: colors.gray[600],
				},
				accent: {
					DEFAULT: colors.gray[100],
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
