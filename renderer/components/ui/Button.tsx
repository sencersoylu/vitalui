import React from 'react';
import { cn } from '../utils';

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
	size?: 'sm' | 'md' | 'lg';
	isLoading?: boolean;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
	fullWidth?: boolean;
}

/**
 * Button component with multiple variants and sizes
 *
 * @example
 * <Button variant="success" size="lg" onClick={handleClick}>
 *   Save Changes
 * </Button>
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant = 'default',
			size = 'md',
			isLoading = false,
			leftIcon,
			rightIcon,
			fullWidth = false,
			children,
			disabled,
			...props
		},
		ref
	) => {
		const baseClasses =
			'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-lg hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100';

		const variantClasses = {
			default:
				'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/25 focus:ring-blue-500',
			success:
				'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/25 focus:ring-emerald-500',
			warning:
				'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 focus:ring-amber-500',
			danger:
				'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-rose-500/25 focus:ring-rose-500',
			info:
				'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/25 focus:ring-indigo-500',
			muted:
				'bg-gradient-to-r from-slate-400 to-slate-500 hover:from-slate-500 hover:to-slate-600 text-white shadow-slate-500/25 focus:ring-slate-500',
		};

		const sizeClasses = {
			sm: 'h-10 px-4 text-sm',
			md: 'h-12 px-6 text-base',
			lg: 'h-16 px-8 text-lg',
		};

		return (
			<button
				ref={ref}
				className={cn(
					baseClasses,
					variantClasses[variant],
					sizeClasses[size],
					fullWidth && 'w-full',
					className
				)}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<svg
						className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24">
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						/>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						/>
					</svg>
				) : null}
				{leftIcon && !isLoading && (
					<span className="mr-2">{leftIcon}</span>
				)}
				{children}
				{rightIcon && !isLoading && (
					<span className="ml-2">{rightIcon}</span>
				)}
			</button>
		);
	}
);

Button.displayName = 'Button';
