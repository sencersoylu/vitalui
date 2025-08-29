import React from 'react';

interface NumericKeypadProps {
	onNumberPress: (number: string) => void;
	onBackspace: () => void;
	onClear: () => void;
}

export function NumericKeypad({
	onNumberPress,
	onBackspace,
	onClear,
}: NumericKeypadProps) {
	const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

	return (
		<div className="bg-white rounded-xl p-4 shadow-xl border border-gray-200">
			{/* Header */}
			<div className="text-center mb-4">
				<h3 className="text-lg font-bold text-brand-blue">Enter Password</h3>
			</div>

			{/* Keypad Grid */}
			<div className="grid grid-cols-3 gap-2 mb-3">
				{numbers.slice(0, 9).map((num) => (
					<button
						key={num}
						onClick={() => onNumberPress(num)}
						className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold text-gray-800 transition-colors active:scale-95">
						{num}
					</button>
				))}

				{/* Bottom row with special buttons */}
				<button
					onClick={onClear}
					className="w-12 h-12 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold text-red-600 transition-colors active:scale-95">
					Clear
				</button>
				<button
					onClick={() => onNumberPress('0')}
					className="w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-lg text-lg font-bold text-gray-800 transition-colors active:scale-95">
					0
				</button>
				<button
					onClick={onBackspace}
					className="w-12 h-12 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-xs font-bold text-yellow-600 transition-colors active:scale-95">
					Delete
				</button>
			</div>
		</div>
	);
}
