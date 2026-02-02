import React from 'react';
import { cn } from '../utils';
import { CompressorUnit } from '../ui/CompressorUnit';

export interface CompressorPanelProps {
	isDark?: boolean;
	lp1Status: boolean;
	lp2Status: boolean;
	hp1Status: boolean;
	className?: string;
}

/**
 * CompressorPanel - Panel showing LP1, LP2, and HP1 compressors
 */
export const CompressorPanel: React.FC<CompressorPanelProps> = ({
	isDark = true,
	lp1Status,
	lp2Status,
	hp1Status,
	className,
}) => {
	return (
		<div className={cn('flex flex-col gap-6', className)}>
			{/* Low Pressure Compressors */}
			<div className="flex gap-4">
				<CompressorUnit
					label="LP1"
					status={lp1Status}
					isDark={isDark}
				/>
				<CompressorUnit
					label="LP2"
					status={lp2Status}
					isDark={isDark}
				/>
			</div>

			{/* Label for LP section */}
			<p className="text-[24px] font-poppins text-[#4a90e2] text-center">
				Low Pressure<br />Compressor
			</p>

			{/* High Pressure Compressor */}
			<div className="flex justify-center">
				<CompressorUnit
					label="HP1"
					status={hp1Status}
					isDark={isDark}
				/>
			</div>

			{/* Label for HP section */}
			<p className="text-[24px] font-poppins text-[#4a90e2] text-center">
				High Pressure<br />Compressor
			</p>
		</div>
	);
};
