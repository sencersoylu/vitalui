import React, { useEffect } from 'react';
import Head from 'next/head';
import { useDashboardStore } from '../store';

export default function TechnicalRoomPage() {
	const {
		darkMode,
		lp1Status,
		lp2Status,
		hp1Status,
		chillerRunning,
		chillerSetTemp,
		chillerCurrentTemp,
		hpCylinderPressure,
		airTankPressure,
		nitrogen1Pressure,
		nitrogen2Pressure,
		mainFssLevel,
		mainFssPressure,
		anteFssLevel,
		anteFssPressure,
	} = useDashboardStore();

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}, [darkMode]);

	const textBlue = darkMode ? 'text-blue-400' : 'text-[#4a90e2]';
	const textDeepBlue = darkMode ? 'text-blue-300' : 'text-[#1032bc]';
	const cardBg = darkMode ? 'bg-white/5 border border-white/10' : 'bg-[rgba(217,217,217,0.34)]';

	return (
		<>
			<Head>
				<title>Technical Room Monitoring</title>
			</Head>

			<div
				className={`w-[1920px] h-[1080px] relative overflow-hidden transition-all duration-500 ${
					darkMode
						? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
						: 'bg-gradient-to-br from-sky-100 via-slate-100 to-amber-50'
				}`}
			>
				{/* Decorative background */}
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					<div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
						darkMode ? 'bg-blue-500/10' : 'bg-sky-400/20'
					}`} />
					<div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl transition-all duration-500 ${
						darkMode ? 'bg-emerald-500/10' : 'bg-amber-400/20'
					}`} />
					<div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-500 ${
						darkMode ? 'bg-indigo-500/5' : 'bg-violet-300/10'
					}`} />
				</div>

				{/* Pressure Lines */}
				<div className="absolute left-[147px] top-[277px] w-[669px] h-[750px]">
					<img alt="" src="/external/pressure-line.svg" className="w-full h-full" draggable={false} />
				</div>

				{/* Hipertech Logo */}
				<img
					alt="Hipertech"
					src="/external/hipertechlogo2501-ygje.svg"
					className={`absolute left-[48px] top-[20px] h-[80px] w-auto ${!darkMode && 'brightness-0'}`}
					draggable={false}
				/>

				{/* LP 1 Compressor */}
				<div className="absolute left-[24px] top-[129px] w-[248px] h-[272px] overflow-hidden">
					<img
						alt="LP1 Compressor"
						src="/external/lp-compressor.png"
						className="absolute max-w-none"
						style={{ width: '192.12%', height: '135.6%', left: '-51.45%', top: '-20.87%' }}
						draggable={false}
					/>
				</div>
				<p className="absolute left-[72px] top-[212px] font-poppins font-bold text-[40px] text-white drop-shadow-lg">
					LP 1
				</p>
				<div className={`absolute left-[242px] top-[139px] w-[20px] h-[20px] rounded-full ${lp1Status ? 'led-on' : 'led-off'}`} />

				{/* LP 2 Compressor */}
				<div className="absolute left-[296px] top-[129px] w-[248px] h-[272px] overflow-hidden">
					<img
						alt="LP2 Compressor"
						src="/external/lp-compressor.png"
						className="absolute max-w-none"
						style={{ width: '192.12%', height: '135.6%', left: '-51.45%', top: '-20.87%' }}
						draggable={false}
					/>
				</div>
				<p className="absolute left-[355px] top-[212px] font-poppins font-bold text-[40px] text-white drop-shadow-lg">
					LP 2
				</p>
				<div className={`absolute left-[514px] top-[139px] w-[20px] h-[20px] rounded-full ${lp2Status ? 'led-on' : 'led-off'}`} />

				{/* HP 1 Compressor */}
				<div className="absolute left-[34px] top-[517px] w-[320px] h-[381px] overflow-hidden">
					<img
						alt="HP1 Compressor"
						src="/external/hp-compressor.png"
						className="absolute max-w-none"
						style={{ width: '138.61%', height: '112.89%', left: '-22.1%', top: '-7.42%' }}
						draggable={false}
					/>
				</div>
				<p className="absolute left-[82px] top-[658px] font-poppins font-bold text-[40px] text-white drop-shadow-lg">
					HP 1
				</p>
				<div className={`absolute left-[324px] top-[527px] w-[20px] h-[20px] rounded-full ${hp1Status ? 'led-on' : 'led-off'}`} />

				{/* Air Tank */}
				<div className="absolute left-[809px] top-[0px] w-[206px] h-[449px] overflow-hidden">
					<img
						alt="Air Tank"
						src="/external/air-tank.png"
						className="absolute max-w-none"
						style={{ width: '392.71%', height: '138.94%', left: '-165.96%', top: '-20.85%' }}
						draggable={false}
					/>
				</div>
				{/* Air Pressure Badge */}
				<div className="absolute left-[798px] top-[174px] w-[227px] h-[77px] rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center">
					<span className="font-poppins font-bold text-[32px] text-white">
						{airTankPressure} Bar
					</span>
				</div>

				{/* Cylinder Bank */}
				<div className="absolute left-[513px] top-[642px] w-[182px] h-[319px] overflow-hidden">
					<img
						alt="Cylinder Bank"
						src="/external/cylinder-bank.png"
						className="absolute max-w-none"
						style={{ width: '261.89%', height: '115.26%', left: '-107.42%', top: '-8.49%' }}
						draggable={false}
					/>
				</div>
				{/* Cylinder Pressure Badge */}
				<div className="absolute left-[480px] top-[802px] w-[227px] h-[77px] rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center">
					<span className="font-poppins font-bold text-[32px] text-white">
						{hpCylinderPressure} Bar
					</span>
				</div>

				{/* Chiller */}
				<div className="absolute left-[852px] top-[509px] w-[252px] h-[387px] overflow-hidden">
					<img
						alt="Chiller"
						src="/external/chiller.png"
						className="absolute max-w-none"
						style={{ width: '246.9%', height: '124.12%', left: '-96.32%', top: '-15.53%' }}
						draggable={false}
					/>
				</div>
				<div className={`absolute left-[1074px] top-[519px] w-[20px] h-[20px] rounded-full ${chillerRunning ? 'led-on' : 'led-off'}`} />
				{/* Chiller SV / PV Card */}
				<div
					className={`absolute left-[837px] top-[914px] w-[282px] h-[143px] rounded-[20px] flex flex-col justify-center px-7 ${
						darkMode ? 'bg-white/5 border border-white/10' : 'bg-[rgba(37,78,126,0.09)]'
					}`}
				>
					<div className="flex justify-between items-center">
						<span className={`font-poppins font-bold text-[32px] ${textBlue}`}>SV :</span>
						<span className={`font-poppins font-bold text-[32px] ${textBlue}`}>{chillerSetTemp.toFixed(1)} °C</span>
					</div>
					<div className="flex justify-between items-center">
						<span className={`font-poppins font-bold text-[32px] ${textBlue}`}>PV :</span>
						<span className={`font-poppins font-bold text-[32px] ${textBlue}`}>{chillerCurrentTemp.toFixed(1)} °C</span>
					</div>
				</div>

				{/* ========== Main Chamber FSS ========== */}
				<div className={`absolute left-[1368px] top-[20px] w-[503px] h-[500px] rounded-[80px] ${cardBg}`} />
				<p className={`absolute left-[1436px] top-[46px] w-[366px] text-center font-poppins font-bold text-[32px] ${textBlue}`}>
					Main Chamber FSS
				</p>

				{/* Main FSS Tank */}
				<div className="absolute left-[1558px] top-[104px] w-[130px] h-[331px] overflow-hidden">
					<img
						alt="Main FSS Tank"
						src="/external/fss-tank.png"
						className="absolute max-w-none"
						style={{ width: '401.18%', height: '121.92%', left: '-182.66%', top: '-13.21%' }}
						draggable={false}
					/>
				</div>
				<p className="absolute left-[1570px] top-[210px] w-[106px] text-center font-poppins font-bold text-[20px] text-white">
					Lvl: {mainFssLevel}%
				</p>

				{/* Main Chamber Nitrogen #1 (left) */}
				<div className="absolute left-[1479px] top-[130px] w-[46px] h-[221px] overflow-hidden">
					<img
						alt="Nitrogen #1"
						src="/external/nitrogen-cylinder.png"
						className="absolute max-w-none"
						style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
						draggable={false}
					/>
				</div>
				<div className="absolute left-[1489px] top-[154px] w-[27px] h-[221px] flex items-center justify-center">
					<p className="font-poppins font-bold text-[20px] text-white whitespace-nowrap origin-center -rotate-90">
						Nitrogen #1
					</p>
				</div>
				<p className={`absolute left-[1470px] top-[370px] w-[64px] text-center font-poppins font-bold text-[24px] ${textDeepBlue}`}>
					{nitrogen1Pressure} Bar
				</p>

				{/* Main Chamber Nitrogen #2 (right) */}
				<div className="absolute left-[1715px] top-[130px] w-[46px] h-[221px] overflow-hidden">
					<img
						alt="Nitrogen #2"
						src="/external/nitrogen-cylinder.png"
						className="absolute max-w-none"
						style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
						draggable={false}
					/>
				</div>
				<div className="absolute left-[1725px] top-[154px] w-[27px] h-[221px] flex items-center justify-center">
					<p className="font-poppins font-bold text-[20px] text-white whitespace-nowrap origin-center -rotate-90">
						Nitrogen #2
					</p>
				</div>
				<p className={`absolute left-[1706px] top-[370px] w-[64px] text-center font-poppins font-bold text-[24px] ${textDeepBlue}`}>
					{nitrogen2Pressure} Bar
				</p>

				{/* ========== Ante Chamber FSS ========== */}
				<div className={`absolute left-[1368px] top-[574px] w-[503px] h-[500px] rounded-[80px] ${cardBg}`} />
				<p className={`absolute left-[1436px] top-[600px] w-[366px] text-center font-poppins font-bold text-[32px] ${textBlue}`}>
					Ante Chamber FSS
				</p>

				{/* Ante FSS Tank */}
				<div className="absolute left-[1598px] top-[658px] w-[130px] h-[331px] overflow-hidden">
					<img
						alt="Ante FSS Tank"
						src="/external/fss-tank.png"
						className="absolute max-w-none"
						style={{ width: '401.18%', height: '121.92%', left: '-182.66%', top: '-13.21%' }}
						draggable={false}
					/>
				</div>
				<p className="absolute left-[1610px] top-[764px] w-[106px] text-center font-poppins font-bold text-[20px] text-white">
					Lvl: {anteFssLevel}%
				</p>

				{/* Ante Chamber Nitrogen #1 */}
				<div className="absolute left-[1519px] top-[684px] w-[46px] h-[221px] overflow-hidden">
					<img
						alt="Nitrogen #1"
						src="/external/nitrogen-cylinder.png"
						className="absolute max-w-none"
						style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
						draggable={false}
					/>
				</div>
				<div className="absolute left-[1529px] top-[708px] w-[27px] h-[221px] flex items-center justify-center">
					<p className="font-poppins font-bold text-[20px] text-white whitespace-nowrap origin-center -rotate-90">
						Nitrogen #1
					</p>
				</div>
				<p className={`absolute left-[1510px] top-[924px] w-[64px] text-center font-poppins font-bold text-[24px] ${textDeepBlue}`}>
					{nitrogen1Pressure} Bar
				</p>
			</div>
		</>
	);
}
