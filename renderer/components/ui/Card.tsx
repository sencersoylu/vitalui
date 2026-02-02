import React from 'react';
import { cn } from '../utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
	title?: string;
	isDark?: boolean;
	hoverable?: boolean;
	isLoading?: boolean;
	children: React.ReactNode;
}

/**
 * Card component with glassmorphism styling and dark mode support
 *
 * @example
 * <Card title="Settings" isDark={darkMode}>
 *   <p>Content goes here</p>
 * </Card>
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
	(
		{
			className,
			title,
			isDark = true,
			hoverable = false,
			isLoading = false,
			children,
			...props
		},
		ref
	) => {
		const baseClasses =
			'backdrop-blur-xl rounded-2xl border overflow-hidden flex flex-col shadow-2xl transition-all duration-500';

		const themeClasses = isDark
			? 'bg-white/5 border-white/10 shadow-black/20'
			: 'bg-white/80 border-slate-200 shadow-slate-300/50';

		const hoverClasses = hoverable
			? 'hover:shadow-2xl hover:scale-[1.01] hover:-translate-y-1'
			: '';

		if (isLoading) {
			return (
				<div
					ref={ref}
					className={cn(
						baseClasses,
						themeClasses,
						hoverClasses,
						className
					)}
					{...props}>
					<div className="animate-pulse flex flex-col h-full">
						{title && (
							<div
								className={`px-6 py-4 border-b ${
									isDark ? 'border-white/10' : 'border-slate-200'
								}`}>
								<div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
							</div>
						)}
						<div className="p-6 flex-1 space-y-4">
							<div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
							<div className="h-16 bg-gray-300 dark:bg-gray-600 rounded-xl"></div>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div
				ref={ref}
				className={cn(baseClasses, themeClasses, hoverClasses, className)}
				{...props}>
				{title && (
					<div
						className={`px-6 py-4 border-b transition-all duration-500 ${
							isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-100/50'
						}`}>
						<h2
							className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
								isDark ? 'text-white' : 'text-slate-800'
							}`}>
							{title}
						</h2>
					</div>
				)}
				<div className="p-6 flex-1">{children}</div>
			</div>
		);
	}
);

Card.displayName = 'Card';
