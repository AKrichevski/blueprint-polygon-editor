// src/components/Button/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
                                           variant = 'primary',
                                           size = 'md',
                                           fullWidth = false,
                                           children,
                                           className = '',
                                           ...props
                                       }) => {
    // Base classes
    const baseClasses = 'font-medium rounded focus:outline-none transition-colors';

    // Size classes
    const sizeClasses = {
        sm: 'px-3 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    // Variant classes
    const variantClasses = {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        outline: 'border border-gray-300 hover:bg-gray-100 text-gray-700',
    };

    // Width class
    const widthClass = fullWidth ? 'w-full' : '';

    // Disabled state
    const disabledClasses = props.disabled ? 'opacity-50 cursor-not-allowed' : '';

    const buttonClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClasses} ${className}`;

    return (
        <button className={buttonClasses} {...props}>
            {children}
        </button>
    );
};

export default Button;
