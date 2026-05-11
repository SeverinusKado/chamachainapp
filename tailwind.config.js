export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
				mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
			},
			colors: {
				border:     'rgb(var(--border) / <alpha-value>)',
				input:      'rgb(var(--input) / <alpha-value>)',
				ring:       'rgb(var(--ring) / <alpha-value>)',
				background: 'rgb(var(--background) / <alpha-value>)',
				foreground: 'rgb(var(--foreground) / <alpha-value>)',

				/* Palette aliases — old names kept so every component works unchanged */
				'pale-sky':   'rgb(var(--pale-sky) / <alpha-value>)',
				'cool-steel': 'rgb(var(--cool-steel) / <alpha-value>)',
				'air-force':  'rgb(var(--air-force-blue) / <alpha-value>)',
				'sea-green':  'rgb(var(--sea-green) / <alpha-value>)',
				'dark-spruce':'rgb(var(--dark-spruce) / <alpha-value>)',

				primary: {
					DEFAULT:    'rgb(var(--primary) / <alpha-value>)',
					foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
				},
				secondary: {
					DEFAULT:    'rgb(var(--secondary) / <alpha-value>)',
					foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
				},
				destructive: {
					DEFAULT:    'rgb(var(--destructive) / <alpha-value>)',
					foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
				},
				muted: {
					DEFAULT:    'rgb(var(--muted) / <alpha-value>)',
					foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT:    'rgb(var(--accent) / <alpha-value>)',
					foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
				},
				popover: {
					DEFAULT:    'rgb(var(--popover) / <alpha-value>)',
					foreground: 'rgb(var(--popover-foreground) / <alpha-value>)',
				},
				card: {
					DEFAULT:    'rgb(var(--card) / <alpha-value>)',
					foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
				},
				sidebar: {
					DEFAULT:             'rgb(var(--sidebar-background) / <alpha-value>)',
					foreground:          'rgb(var(--sidebar-foreground) / <alpha-value>)',
					primary:             'rgb(var(--sidebar-primary) / <alpha-value>)',
					'primary-foreground':'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
					accent:              'rgb(var(--sidebar-accent) / <alpha-value>)',
					'accent-foreground': 'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
					border:              'rgb(var(--sidebar-border) / <alpha-value>)',
					ring:                'rgb(var(--sidebar-ring) / <alpha-value>)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to:   { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to:   { height: '0' }
				},
				'fade-in': {
					from: { opacity: '0', transform: 'translateY(12px)' },
					to:   { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-left': {
					from: { opacity: '0', transform: 'translateX(-20px)' },
					to:   { opacity: '1', transform: 'translateX(0)' }
				},
				'scale-in': {
					from: { opacity: '0', transform: 'scale(0.95)' },
					to:   { opacity: '1', transform: 'scale(1)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)' },
					'50%':       { boxShadow: '0 0 40px rgba(124, 58, 237, 0.6)' }
				},
				'count-up': {
					from: { opacity: '0', transform: 'translateY(8px)' },
					to:   { opacity: '1', transform: 'translateY(0)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up':   'accordion-up 0.2s ease-out',
				'fade-in':        'fade-in 0.5s ease-out forwards',
				'fade-in-left':   'fade-in-left 0.5s ease-out forwards',
				'scale-in':       'scale-in 0.4s ease-out forwards',
				'glow-pulse':     'glow-pulse 2.5s ease-in-out infinite',
				'count-up':       'count-up 0.4s ease-out forwards',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}
