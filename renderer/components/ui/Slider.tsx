import React from 'react';
import { cn } from '../utils';

export interface SliderProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		'size' | 'onChange'
	> {
	label?: string;
	min?: number;
	max?: number;
	step?: number;
	value: number;
	onChange: (value: number) => void;
	color?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
	size?: 'sm' | 'md' | 'lg';
	showLabels?: boolean;
	leftLabel?: string;
	rightLabel?: string;
	centerLabel?: string;
}

/**
 * Custom slider component with smooth animations and color variants
 * Uses native HTML5 range input with enhanced styling
 *
 * @example
 * <Slider
 *   value={temperature}
 *   onChange={setTemperature}
 *   min={5}
 *   max={35}
 *   step={0.5}
 *   color="cyan"
 * />
 */
export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
	(
		{
			className,
			label,
			min = 0,
			max = 100,
			step = 1,
			value,
			onChange,
			color = 'blue',
			size = 'md',
			showLabels = true,
			leftLabel,
			rightLabel,
			centerLabel,
			disabled,
			...props
		},
		ref
	) => {
		const percentage = ((value - min) / (max - min)) * 100;

		const accentColors = {
			blue: 'accent-blue-500 focus-visible:accent-blue-600',
			emerald: 'accent-emerald-500 focus-visible:accent-emerald-600',
			amber: 'accent-amber-500 focus-visible:accent-amber-600',
			rose: 'accent-rose-500 focus-visible:accent-rose-600',
			indigo: 'accent-indigo-500 focus-visible:accent-indigo-600',
			cyan: 'accent-cyan-500 focus-visible:accent-cyan-600',
		};

		const trackBgColors = {
			blue: 'bg-blue-100 dark:bg-blue-900/30',
			emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
			amber: 'bg-amber-100 dark:bg-amber-900/30',
			rose: 'bg-rose-100 dark:bg-rose-900/30',
			indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
			cyan: 'bg-cyan-100 dark:bg-cyan-900/30',
		};

		const sizeClasses = {
			sm: 'h-2',
			md: 'h-3',
			lg: 'h-4',
		};

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(Number(e.target.value));
		};

		return (
			<div
				className={cn(
					'w-full',
					disabled && 'opacity-50 pointer-events-none',
					className
				)}>
				{label && (
					<div className="flex justify-between items-center mb-4">
						<span className="text-slate-700 dark:text-slate-300 font-medium">
							{label}
						</span>
						<span className="text-2xl font-bold text-slate-900 dark:text-white">
							{Number(value).toFixed(1)}
						</span>
					</div>
				)}

				<div className="relative">
					{/* Custom track background */}
					<div
						className={cn(
							'w-full rounded-full overflow-hidden',
							trackBgColors[color],
							sizeClasses[size]
						)}>
						{/* Colored fill bar */}
						<div
							className="h-full transition-all duration-150 ease-out"
							style={{
								background:
									percentage === 0
										? 'transparent'
										: color === 'blue'
										? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
										: color === 'emerald'
										? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
										: color === 'amber'
										? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
										: color === 'rose'
										? 'linear-gradient(90deg, #f43f5e 0%, #e11d48 100%)'
										: color === 'indigo'
										? 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)'
										: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)',
								width: `${percentage}%`,
							}}
						/>
					</div>

					{/* Native range input */}
					<input
						ref={ref}
						type="range"
						min={min}
						max={max}
						step={step}
						value={value}
						onChange={handleChange}
						disabled={disabled}
						className={cn(
							'absolute inset-0 w-full cursor-pointer z-10',
							'appearance-none bg-transparent',
							accentColors[color],
							sizeClasses[size]
						)}
						style={{
							// Custom track styling
							WebkitAppearance: 'none',
						}}
						{...props}
					/>

					{/* Custom thumb using accent-color */}
					<style jsx global>{`
						/* Webkit browser slider styling */
						input[type='range']::-webkit-slider-runnable-track {
							background: transparent;
						}

						input[type='range']::-webkit-slider-thumb {
							-webkit-appearance: none;
							appearance: none;
							height: ${size === 'sm'
								? '20px'
								: size === 'md'
								? '28px'
								: '36px'};
							width: ${size === 'sm'
								? '20px'
								: size === 'md'
								? '28px'
								: '36px'};
							border-radius: 50%;
							background: white;
							cursor: pointer;
							box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
							border: 3px solid
								${color === 'blue'
									? '#3b82f6'
									: color === 'emerald'
									? '#10b981'
									: color === 'amber'
									? '#f59e0b'
									: color === 'rose'
									? '#f43f5e'
									: color === 'indigo'
									? '#6366f1'
									: '#0891b2'};
							margin-top: ${size === 'sm'
								? '-6px'
								: size === 'md'
								? '-8px'
								: '-10px'};
							transition: transform 0.15s ease, box-shadow 0.15s ease;
						}

						input[type='range']::-webkit-slider-thumb:hover {
							transform: scale(1.1);
						}

						input[type='range']:focus::-webkit-slider-thumb {
							box-shadow: 0 0 0 4px
								${color === 'blue'
									? 'rgba(59, 130, 246, 0.5)'
									: color === 'emerald'
									? 'rgba(16, 185, 129, 0.5)'
									: color === 'amber'
									? 'rgba(245, 158, 11, 0.5)'
									: color === 'rose'
									? 'rgba(244, 63, 94, 0.5)'
									: color === 'indigo'
									? 'rgba(99, 102, 241, 0.5)'
									: 'rgba(8, 129, 178, 0.5)'};
						}

						/* Firefox slider styling */
						input[type='range']::-moz-range-track {
							background: transparent;
						}

						input[type='range']::-moz-range-thumb {
							appearance: none;
							height: ${size === 'sm'
								? '20px'
								: size === 'md'
								? '28px'
								: '36px'};
							width: ${size === 'sm'
								? '20px'
								: size === 'md'
								? '28px'
								: '36px'};
							border-radius: 50%;
							background: white;
							cursor: pointer;
							box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
							border: 3px solid
								${color === 'blue'
									? '#3b82f6'
									: color === 'emerald'
									? '#10b981'
									: color === 'amber'
									? '#f59e0b'
									: color === 'rose'
									? '#f43f5e'
									: color === 'indigo'
									? '#6366f1'
									: '#0891b2'};
							margin-top: ${size === 'sm'
								? '-6px'
								: size === 'md'
								? '-8px'
								: '-10px'};
							transition: transform 0.15s ease, box-shadow 0.15s ease;
						}

						input[type='range']::-moz-range-thumb:hover {
							transform: scale(1.1);
						}

						input[type='range']:focus::-moz-range-thumb {
							box-shadow: 0 0 0 4px
								${color === 'blue'
									? 'rgba(59, 130, 246, 0.5)'
									: color === 'emerald'
									? 'rgba(16, 185, 129, 0.5)'
									: color === 'amber'
									? 'rgba(245, 158, 11, 0.5)'
									: color === 'rose'
									? 'rgba(244, 63, 94, 0.5)'
									: color === 'indigo'
									? 'rgba(99, 102, 241, 0.5)'
									: 'rgba(8, 129, 178, 0.5)'};
						}

						/* Dark mode thumb colors */
						.dark input[type='range']::-webkit-slider-thumb {
							background: ${color === 'blue'
								? '#60a5fa'
								: color === 'emerald'
								? '#34d399'
								: color === 'amber'
								? '#fbbf24'
								: color === 'rose'
								? '#fb7185'
								: color === 'indigo'
								? '#818cf8'
								: '#22d3ee'};
							border-color: ${color === 'blue'
								? '#60a5fa'
								: color === 'emerald'
								? '#34d399'
								: color === 'amber'
								? '#fbbf24'
								: color === 'rose'
								? '#fb7185'
								: color === 'indigo'
								? '#818cf8'
								: '#22d3ee'};
						}
					`}</style>
				</div>

				{showLabels && (
					<div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-2">
						<span>{leftLabel || `${min}`}</span>
						{centerLabel && <span>{centerLabel}</span>}
						<span>{rightLabel || `${max}`}</span>
					</div>
				)}
			</div>
		);
	}
);

Slider.displayName = 'Slider';
