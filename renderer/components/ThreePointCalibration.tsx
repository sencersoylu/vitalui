import React, { useState } from 'react';
import { Zap, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ThreePointCalibrationData } from '../api/chambers';
import { useCalibration } from '../hooks/useCalibration';

interface ThreePointCalibrationProps {
	chamberId: number;
	chamberName: string;
	onCalibrationComplete?: () => void;
}

const ThreePointCalibration: React.FC<ThreePointCalibrationProps> = ({
	chamberId,
	chamberName,
	onCalibrationComplete,
}) => {
	const [calibrationData, setCalibrationData] =
		useState<ThreePointCalibrationData>({
			zeroPointRaw: 0,
			midPointRaw: 0,
			hundredPointRaw: 0,
			midPointCalibrated: 21.0,
			calibratedBy: '',
			notes: '',
		});

	const { calibrating, error, performThreePoint } = useCalibration();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validation
		if (calibrationData.zeroPointRaw >= calibrationData.midPointRaw) {
			toast.error('0% noktası, orta noktadan küçük olmalıdır');
			return;
		}
		if (calibrationData.midPointRaw >= calibrationData.hundredPointRaw) {
			toast.error('Orta nokta, 100% noktasından küçük olmalıdır');
			return;
		}

		const success = await performThreePoint(chamberId, calibrationData);

		if (success) {
			toast.success(`${chamberName} 3 noktalı kalibrasyon tamamlandı!`, {
				duration: 4000,
				position: 'top-center',
			});

			// Reset form
			setCalibrationData({
				zeroPointRaw: 0,
				midPointRaw: 0,
				hundredPointRaw: 0,
				midPointCalibrated: 21.0,
				calibratedBy: '',
				notes: '',
			});

			onCalibrationComplete && onCalibrationComplete();
		} else {
			toast.error(`Kalibrasyon hatası: ${error || 'Bilinmeyen hata'}`, {
				duration: 4000,
				position: 'top-center',
			});
		}
	};

	return (
		<div className="bg-blue-50 rounded-2xl p-6">
			<div className="flex items-center gap-3 mb-6">
				<Zap className="w-6 h-6 text-brand-blue" />
				<h3 className="text-xl font-bold text-brand-blue">
					3 Noktalı Kalibrasyon
				</h3>
			</div>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
					<AlertCircle className="w-5 h-5" />
					<span>{error}</span>
				</div>
			)}

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Kalibrasyon Noktaları */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* 0% Noktası */}
					<div className="bg-white rounded-xl p-4 border-2 border-gray-200">
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							0% Noktası (Ham Değer)
						</label>
						<input
							type="number"
							step="0.0001"
							value={calibrationData.zeroPointRaw}
							onChange={(e) =>
								setCalibrationData({
									...calibrationData,
									zeroPointRaw: parseFloat(e.target.value) || 0,
								})
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="0.0000"
							required
						/>
					</div>

					{/* Orta Nokta Ham */}
					<div className="bg-white rounded-xl p-4 border-2 border-gray-200">
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							Orta Nokta (Ham Değer)
						</label>
						<input
							type="number"
							step="0.0001"
							value={calibrationData.midPointRaw}
							onChange={(e) =>
								setCalibrationData({
									...calibrationData,
									midPointRaw: parseFloat(e.target.value) || 0,
								})
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="0.0000"
							required
						/>
					</div>

					{/* 100% Noktası */}
					<div className="bg-white rounded-xl p-4 border-2 border-gray-200">
						<label className="block text-sm font-semibold text-gray-700 mb-2">
							100% Noktası (Ham Değer)
						</label>
						<input
							type="number"
							step="0.0001"
							value={calibrationData.hundredPointRaw}
							onChange={(e) =>
								setCalibrationData({
									...calibrationData,
									hundredPointRaw: parseFloat(e.target.value) || 0,
								})
							}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="0.0000"
							required
						/>
					</div>
				</div>

				{/* Orta Nokta Kalibre Değeri */}
				<div className="bg-white rounded-xl p-4 border-2 border-gray-200">
					<label className="block text-sm font-semibold text-gray-700 mb-2">
						Orta Nokta (Kalibre Edilmiş Değer) - %
					</label>
					<input
						type="number"
						step="0.1"
						value={calibrationData.midPointCalibrated}
						onChange={(e) =>
							setCalibrationData({
								...calibrationData,
								midPointCalibrated: parseFloat(e.target.value) || 21.0,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="21.0"
						required
					/>
					<p className="text-sm text-gray-500 mt-1">
						Genellikle 21% (hava ortamı referansı)
					</p>
				</div>

				{/* Kalibrasyonu Yapan */}
				<div className="bg-white rounded-xl p-4 border-2 border-gray-200">
					<label className="block text-sm font-semibold text-gray-700 mb-2">
						Kalibrasyonu Yapan Kişi
					</label>
					<input
						type="text"
						value={calibrationData.calibratedBy}
						onChange={(e) =>
							setCalibrationData({
								...calibrationData,
								calibratedBy: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="Operatör adı..."
					/>
				</div>

				{/* Notlar */}
				<div className="bg-white rounded-xl p-4 border-2 border-gray-200">
					<label className="block text-sm font-semibold text-gray-700 mb-2">
						Notlar (İsteğe bağlı)
					</label>
					<textarea
						value={calibrationData.notes}
						onChange={(e) =>
							setCalibrationData({
								...calibrationData,
								notes: e.target.value,
							})
						}
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
						rows={3}
						placeholder="Kalibrasyon notları..."
					/>
				</div>

				{/* Submit Button */}
				<button
					type="submit"
					disabled={calibrating}
					className="w-full bg-brand-blue text-white py-4 rounded-xl hover:bg-blue-600 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
					{calibrating ? (
						<>
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
							Kalibrasyon Yapılıyor...
						</>
					) : (
						<>
							<Zap className="w-5 h-5" />
							3 Noktalı Kalibrasyon Yap
							<ChevronRight className="w-5 h-5" />
						</>
					)}
				</button>
			</form>

			{/* Bilgi Kutusu */}
			<div className="mt-6 bg-blue-100 rounded-lg p-4">
				<h4 className="font-semibold text-blue-800 mb-2">
					Kalibrasyon Hakkında
				</h4>
				<ul className="text-sm text-blue-700 space-y-1">
					<li>• 0% noktası: Nitrogen gazı veya oksijensiz ortam</li>
					<li>• Orta nokta: Genellikle hava ortamı (21% O2)</li>
					<li>• 100% noktası: Saf oksijen gazı</li>
					<li>
						• Ham değerler artan sırada olmalıdır (0% &lt; orta &lt; 100%)
					</li>
				</ul>
			</div>
		</div>
	);
};

export default ThreePointCalibration;
