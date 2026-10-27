/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reverse UI Dark-Dominant Financial OS Palette
        canvas: '#0B0D12',
        surface: {
          DEFAULT: '#121620',
          subtle: '#191F2B',
          elevated: '#191F2B',
          hover: '#232B3C',
          cool: '#172435'
        },
        content: {
          primary: '#F5F7FA',
          secondary: '#A0A8B7',
          tertiary: '#6B7280',
          border: '#293142',
          borderSubtle: '#1E2533'
        },
        primary: {
          DEFAULT: '#1D9BF0',
          hover: '#1A8CD8',
          light: '#172435',
          50: '#0F1A28',
          100: '#14253B',
          400: '#38BDF8',
          500: '#1D9BF0',
          600: '#1A8CD8',
          700: '#0284C7'
        },
        accent: {
          success: '#25D366',
          successBg: 'rgba(37, 211, 102, 0.12)',
          danger: '#E53945',
          dangerBg: 'rgba(229, 57, 69, 0.12)',
          warning: '#F59E0B',
          warningBg: 'rgba(245, 158, 11, 0.12)',
          cool: '#172435'
        },
        // Mapped aliases for consistent dark hierarchy
        midnight: {
          DEFAULT: '#0B0D12',
          canvas: '#0B0D12',
          card: '#121620',
          panel: '#191F2B',
          surface: '#191F2B',
          border: '#293142',
          borderSubtle: '#1E2533',
          800: '#191F2B',
          900: '#121620',
          950: '#0B0D12'
        },
        offwhite: {
          DEFAULT: '#F5F7FA',
          muted: '#A0A8B7',
          dim: '#6B7280'
        },
        ice: {
          DEFAULT: '#172435',
          light: '#191F2B',
          dark: '#1D9BF0'
        },
        mist: {
          DEFAULT: '#293142',
          border: '#293142',
          dark: '#3B4559'
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)'
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.2, 0.7, 0.2, 1)',
        'emphasized': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
