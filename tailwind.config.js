/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                bangers: ['Bangers', 'cursive'],
                body: ['Noto Sans Thai', 'Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    bg: '#0f0f1a',
                    card: '#1a1a2e',
                    pink: '#ff2d78',
                    yellow: '#ffe600',
                    purple: '#7c3aed',
                    cyan: '#00d4ff',
                },
            },
            animation: {
                'honk-shake': 'honk-shake 0.4s ease-in-out',
                'pop-in': 'pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                'float': 'float 3s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
            },
            keyframes: {
                'honk-shake': {
                    '0%, 100%': { transform: 'rotate(0deg) scale(1)' },
                    '20%': { transform: 'rotate(-5deg) scale(1.1)' },
                    '40%': { transform: 'rotate(5deg) scale(1.15)' },
                    '60%': { transform: 'rotate(-3deg) scale(1.1)' },
                    '80%': { transform: 'rotate(3deg) scale(1.05)' },
                },
                'pop-in': {
                    '0%': { transform: 'scale(0.8)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(255, 45, 120, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(255, 45, 120, 0.9)' },
                },
            },
        },
    },
    plugins: [],
}
