/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // درجات الكريمي المستوحاة من RAL 1015 (Light Ivory)
        cream: {
          50: '#FDFBF7',
          100: '#FBF6EC',
          200: '#F4ECDD', // خلفية التطبيق الأساسية
          300: '#E6D2B5', // RAL 1015 الأصلي – يُستخدم للأسطح والبطاقات
          400: '#D9BE96',
          500: '#C6A876',
        },
        // الأسود الأسفلتي
        asphalt: {
          50: '#4A4744',
          100: '#37342F',
          800: '#211F1C',
          900: '#171615', // خلفية الشريط السفلي والعناصر الداكنة
          950: '#0F0E0D',
        },
        // كهرماني التاكسي
        amber: {
          50: '#FDF1DD',
          100: '#FBE3B8',
          300: '#FBCB7C',
          400: '#F2A93B',
          500: '#E2952A', // اللون الأساسي للكهرماني
          600: '#C97D1A',
          700: '#A5650F',
        },
        ink: '#2B2621', // نص داكن دافئ على الكريمي
        success: '#3F8F5F',
        danger: '#C24030',
        info: '#3E6F8E',
      },
      fontFamily: {
        display: ['"Big Shoulders Condensed"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
        meter: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '1.1rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(23, 22, 21, 0.06), 0 6px 16px -4px rgba(23, 22, 21, 0.12)',
        nav: '0 -4px 20px rgba(0,0,0,0.25)',
      },
      backgroundImage: {
        'dispatch-tear':
          'repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(43,38,33,0.18) 6px, rgba(43,38,33,0.18) 12px)',
      },
    },
  },
  plugins: [],
};
