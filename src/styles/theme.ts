// src/styles/theme.ts
// Centralized theme configuration for the application

// Color palette
export const colors = {
    // Primary colors
    primary: {
        50: '#ebf5ff',
        100: '#e1efff',
        300: '#93c5fd',
        500: '#3b82f6', // Main brand color
        600: '#2563eb',
        700: '#1d4ed8',
    },

    // Semantic colors
    danger: {
        50: '#fef2f2',
        100: '#fee2e2',
        300: '#fca5a5',
        500: '#ef4444', // Error, delete actions
        600: '#dc2626',
        700: '#b91c1c',
    },

    // Neutral colors
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },

    // Entity polygon colors (for up to 8 entities)
    entityColors: [
        '#FF5733', // Coral
        '#33FF57', // Green
        '#3357FF', // Blue
        '#F3FF33', // Yellow
        '#FF33F3', // Pink
        '#33FFF7', // Cyan
        '#FF9933', // Orange
        '#9933FF', // Purple
    ],

    // UI state colors
    state: {
        selected: '#00A8E8',
        hover: '#61dafb',
        disabled: '#9ca3af',
    },

    // Transparency values (hex)
    alpha: {
        10: '1A', // 10% opacity
        20: '33', // 20% opacity
        50: '80', // 50% opacity
        70: 'B3', // 70% opacity
    }
};

// Typography
export const typography = {
    fontFamily: {
        base: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
        xs: '0.75rem',   // 12px
        sm: '0.875rem',  // 14px
        base: '1rem',    // 16px
        lg: '1.125rem',  // 18px
        xl: '1.25rem',   // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.875rem', // 30px
    },
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
};

// Spacing
export const spacing = {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
};

// Canvas constants
export const canvas = {
    pointRadius: 6,
    lineWidth: 2,
    selectedPointRadius: 8,
    dashedLinePattern: [5, 5],
    clickableLineWidth: 10,
};

// Common class names using Tailwind
export const classNames = {
    // Container styles
    container: {
        base: 'max-w-screen-xl mx-auto p-4',
        canvas: 'border border-gray-300 bg-white rounded-lg overflow-hidden',
    },

    // Button styles
    button: {
        base: 'font-medium rounded focus:outline-none transition-colors',
        primary: 'bg-blue-500 hover:bg-blue-600 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        outline: 'border border-gray-300 hover:bg-gray-100 text-gray-700',
        disabled: 'opacity-50 cursor-not-allowed',
        sizes: {
            sm: 'px-3 py-1 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg',
        },
        fullWidth: 'w-full',
    },

    // Form styles
    form: {
        label: 'block text-sm font-medium text-gray-700 mb-1',
        input: 'w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        select: 'w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
        textarea: 'w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    },

    // Card styles
    card: {
        base: 'bg-white rounded-lg shadow p-4',
        header: 'mb-4 flex justify-between items-center',
        title: 'text-lg font-semibold text-gray-800',
    },

    // List styles
    list: {
        item: {
            base: 'p-3 rounded border',
            selected: 'bg-blue-100 border-blue-300',
            default: 'bg-gray-50 border-gray-200',
        },
    },

    // Modal styles
    modal: {
        backdrop: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
        container: 'bg-white rounded-lg p-6',
        header: 'text-lg font-semibold mb-4',
        footer: 'flex justify-end space-x-2 mt-4',
        sizes: {
            sm: 'max-w-sm',
            md: 'max-w-md',
            lg: 'max-w-lg',
        },
    },

    // Loading styles
    loading: {
        spinner: 'w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto',
        container: 'flex items-center justify-center h-screen',
        text: 'mt-4 text-gray-600',
    },
};



// Helper to combine class names conditionally
export function cn(...classes: (string | undefined | boolean | null)[]) {
    return classes.filter(Boolean).join(' ');
}
