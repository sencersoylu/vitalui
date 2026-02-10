import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils';

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	showCloseButton?: boolean;
	closeOnBackdropClick?: boolean;
	closeOnEscape?: boolean;
	className?: string;
}

/**
 * Modal component with backdrop, animations, and accessibility features
 *
 * @example
 * <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Settings" size="md">
 *   <p>Modal content here</p>
 * </Modal>
 */
export const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
	(
		{
			isOpen,
			onClose,
			title,
			children,
			size = 'md',
			showCloseButton = true,
			closeOnBackdropClick = true,
			closeOnEscape = true,
			className,
		},
		ref
	) => {
		const modalRef = useRef<HTMLDivElement>(null);
		const previousActiveElement = useRef<HTMLElement | null>(null);

		// Focus trap and scroll lock
		useEffect(() => {
			if (isOpen) {
				previousActiveElement.current = document.activeElement as HTMLElement;
				document.body.style.overflow = 'hidden';

				// Focus first focusable element
				const focusableElements = modalRef.current?.querySelectorAll(
					'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
				);
				if (focusableElements && focusableElements.length > 0) {
					(focusableElements[0] as HTMLElement).focus();
				}
			} else {
				document.body.style.overflow = '';
				previousActiveElement.current?.focus();
			}

			return () => {
				document.body.style.overflow = '';
			};
		}, [isOpen]);

		// Handle escape key
		useEffect(() => {
			const handleEscape = (e: KeyboardEvent) => {
				if (e.key === 'Escape' && closeOnEscape && isOpen) {
					onClose();
				}
			};

			if (isOpen) {
				document.addEventListener('keydown', handleEscape);
			}

			return () => {
				document.removeEventListener('keydown', handleEscape);
			};
		}, [isOpen, closeOnEscape, onClose]);

		// Handle backdrop click
		const handleBackdropClick = (e: React.MouseEvent) => {
			if (e.target === e.currentTarget && closeOnBackdropClick) {
				onClose();
			}
		};

		// Focus trap
		const handleTabKeyDown = (e: React.KeyboardEvent) => {
			if (e.key !== 'Tab') return;

			const focusableElements = modalRef.current?.querySelectorAll(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);
			if (!focusableElements || focusableElements.length === 0) return;

			const firstElement = focusableElements[0] as HTMLElement;
			const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

			if (e.shiftKey && document.activeElement === firstElement) {
				e.preventDefault();
				lastElement.focus();
			} else if (!e.shiftKey && document.activeElement === lastElement) {
				e.preventDefault();
				firstElement.focus();
			}
		};

		const sizeClasses = {
			sm: 'max-w-md',
			md: 'max-w-lg',
			lg: 'max-w-2xl',
			xl: 'max-w-4xl',
		};

		if (!isOpen) return null;

		return (
			<div
				className="fixed inset-0 z-50 flex items-center justify-center p-4"
				onClick={handleBackdropClick}
				aria-modal="true"
				role="dialog">
				{/* Backdrop */}
				<div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

				{/* Modal content */}
				<div
					ref={(node) => {
						modalRef.current = node;
						if (typeof ref === 'function') {
							ref(node);
						} else if (ref) {
							ref.current = node;
						}
					}}
					className={cn(
						'relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-zoom-in',
						sizeClasses[size],
						className
					)}
					onKeyDown={handleTabKeyDown}>
					{/* Header */}
					{title || showCloseButton ? (
						<div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
							{title && (
								<h2 className="text-xl font-bold text-slate-900 dark:text-white">
									{title}
								</h2>
							)}
							{showCloseButton && (
								<button
									onClick={onClose}
									className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
									aria-label="Close modal">
									<X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
								</button>
							)}
						</div>
					) : null}

					{/* Content */}
					<div className="p-6">{children}</div>
				</div>
			</div>
		);
	}
);

Modal.displayName = 'Modal';
