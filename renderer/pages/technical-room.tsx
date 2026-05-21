import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useDashboardStore } from '../store';

/** Figma frame 157:50 — 1280×720 (scaled from 1920×1080) */
const CANVAS_W = 1280;
const CANVAS_H = 720;
const s = (n: number) => Math.round(n * (CANVAS_W / 1920));

export default function TechnicalRoomPage() {
	const {
		lp1Status,
		lp2Status,
		hp1Status,
		chillerRunning,
		chillerSetTemp,
		chillerCurrentTemp,
		primaryO2Pressure,
		secondaryO2Pressure,
		airTankPressure,
		nitrogen1Pressure,
		nitrogen2Pressure,
		mainFssLevel,
		anteFssLevel,
	} = useDashboardStore();

	const [scale, setScale] = useState(1);

	useEffect(() => {
		// Figma design is light-only (#f8fafc)
		document.documentElement.classList.remove('dark');
		document.body.style.backgroundColor = '#f8fafc';

		const updateScale = () => {
			setScale(Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H));
		};
		updateScale();
		window.addEventListener('resize', updateScale);
		return () => {
			window.removeEventListener('resize', updateScale);
			document.body.style.backgroundColor = '';
		};
	}, []);

	return (
		<>
			<Head>
				<title>Technical Room Monitoring</title>
			</Head>

			{/* Fill viewport; scale 1280×720 canvas to fit (Electron 1280×720 → scale 1) */}
			<div
				className="flex items-center justify-center overflow-hidden"
				style={{ width: '100vw', height: '100vh', backgroundColor: '#f8fafc' }}
			>
				<div
					style={{
						width: CANVAS_W,
						height: CANVAS_H,
						transform: `scale(${scale})`,
						transformOrigin: 'center center',
						position: 'relative',
						flexShrink: 0,
					}}
				>
					{/* Pressure Lines */}
					<div
						className="absolute"
						style={{ left: s(147), top: s(277), width: s(889), height: s(752) }}
					>
						<img alt="" src="/external/pressure-line.svg" className="w-full h-full" draggable={false} />
					</div>

					{/* Logo — native blue SVG, no brightness filter */}
					<img
						alt="Hipertech"
						src="/external/hipertechlogo2501-ygje.svg"
						className="absolute w-auto"
						style={{ left: s(48), top: s(7), height: s(91) }}
						draggable={false}
					/>

					{/* LP 1 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(24), top: s(129), width: s(248), height: s(272) }}
					>
						<img
							alt="LP1 Compressor"
							src="/external/lp-compressor.png"
							className="absolute max-w-none"
							style={{ width: '192.12%', height: '135.6%', left: '-51.45%', top: '-20.87%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(72), top: s(212), fontSize: s(40) }}
					>
						LP 1
					</p>
					<div
						className={`absolute rounded-full ${lp1Status ? 'led-on' : 'led-off'}`}
						style={{ left: s(242), top: s(139), width: s(20), height: s(20) }}
					/>

					{/* LP 2 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(296), top: s(129), width: s(248), height: s(272) }}
					>
						<img
							alt="LP2 Compressor"
							src="/external/lp-compressor.png"
							className="absolute max-w-none"
							style={{ width: '192.12%', height: '135.6%', left: '-51.45%', top: '-20.87%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(355), top: s(212), fontSize: s(40) }}
					>
						LP 2
					</p>
					<div
						className={`absolute rounded-full ${lp2Status ? 'led-on' : 'led-off'}`}
						style={{ left: s(514), top: s(139), width: s(20), height: s(20) }}
					/>

					{/* HP 1 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(34), top: s(517), width: s(320), height: s(381) }}
					>
						<img
							alt="HP1 Compressor"
							src="/external/hp-compressor.png"
							className="absolute max-w-none"
							style={{ width: '138.61%', height: '112.89%', left: '-22.1%', top: '-7.42%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute font-poppins font-bold text-white drop-shadow-md"
						style={{ left: s(82), top: s(658), fontSize: s(40) }}
					>
						HP 1
					</p>
					<div
						className={`absolute rounded-full ${hp1Status ? 'led-on' : 'led-off'}`}
						style={{ left: s(324), top: s(527), width: s(20), height: s(20) }}
					/>

					{/* Air Tank */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(1023), top: s(7), width: s(206), height: s(449) }}
					>
						<img
							alt="Air Tank"
							src="/external/air-tank.png"
							className="absolute max-w-none"
							style={{ width: '392.71%', height: '138.94%', left: '-165.96%', top: '-20.85%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center"
						style={{ left: s(1012), top: s(181), width: s(227), height: s(77) }}
					>
						<span className="font-poppins font-bold text-white" style={{ fontSize: s(32) }}>
							{airTankPressure} Bar
						</span>
					</div>

					{/* Cylinder Bank 1 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(447), top: s(609), width: s(182), height: s(319) }}
					>
						<img
							alt="Cylinder Bank 1"
							src="/external/cylinder-bank.png"
							className="absolute max-w-none"
							style={{ width: '261.89%', height: '115.26%', left: '-107.42%', top: '-8.49%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center"
						style={{ left: s(414), top: s(769), width: s(227), height: s(77) }}
					>
						<span className="font-poppins font-bold text-white" style={{ fontSize: s(32) }}>
							{primaryO2Pressure} Bar
						</span>
					</div>

					{/* Cylinder Bank 2 */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(699), top: s(609), width: s(182), height: s(319) }}
					>
						<img
							alt="Cylinder Bank 2"
							src="/external/cylinder-bank.png"
							className="absolute max-w-none"
							style={{ width: '261.89%', height: '115.26%', left: '-107.42%', top: '-8.49%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute rounded-full bg-[rgba(37,78,126,0.8)] flex items-center justify-center"
						style={{ left: s(666), top: s(769), width: s(227), height: s(77) }}
					>
						<span className="font-poppins font-bold text-white" style={{ fontSize: s(32) }}>
							{secondaryO2Pressure} Bar
						</span>
					</div>

					{/* Chiller — image scaled to 60% (40% smaller), anchored at bottom-center */}
					<div
						className="absolute overflow-hidden"
						style={{ left: s(1062), top: s(664), width: s(151), height: s(232) }}
					>
						<img
							alt="Chiller"
							src="/external/chiller.png"
							className="absolute max-w-none"
							style={{ width: '246.9%', height: '124.12%', left: '-96.32%', top: '-15.53%' }}
							draggable={false}
						/>
					</div>
					<div
						className={`absolute rounded-full ${chillerRunning ? 'led-on' : 'led-off'}`}
						style={{ left: s(1196), top: s(670), width: s(20), height: s(20) }}
					/>
					<div
						className="absolute flex flex-col justify-center bg-[rgba(37,78,126,0.09)]"
						style={{
							left: s(997),
							top: s(914),
							width: s(282),
							height: s(143),
							borderRadius: s(20),
							paddingLeft: s(28),
							paddingRight: s(28),
						}}
					>
						<div className="flex justify-between items-center">
							<span className="font-poppins font-bold text-[#4a90e2]" style={{ fontSize: s(32) }}>
								SV :
							</span>
							<span className="font-poppins font-bold text-[#4a90e2]" style={{ fontSize: s(32) }}>
								{chillerSetTemp.toFixed(1)} °C
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="font-poppins font-bold text-[#4a90e2]" style={{ fontSize: s(32) }}>
								PV :
							</span>
							<span className="font-poppins font-bold text-[#4a90e2]" style={{ fontSize: s(32) }}>
								{chillerCurrentTemp.toFixed(1)} °C
							</span>
						</div>
					</div>

					{/* Main Chamber FSS */}
					<div
						className="absolute bg-[rgba(217,217,217,0.34)]"
						style={{
							left: s(1368),
							top: s(20),
							width: s(503),
							height: s(500),
							borderRadius: s(80),
						}}
					/>
					<p
						className="absolute text-center font-poppins font-bold text-[#4a90e2]"
						style={{ left: s(1436), top: s(46), width: s(366), fontSize: s(32) }}
					>
						Main Chamber FSS
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1558), top: s(104), width: s(130), height: s(331) }}
					>
						<img
							alt="Main FSS Tank"
							src="/external/fss-tank.png"
							className="absolute max-w-none"
							style={{ width: '401.18%', height: '121.92%', left: '-182.66%', top: '-13.21%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-white"
						style={{ left: s(1570), top: s(210), width: s(106), fontSize: s(20) }}
					>
						Lvl: {mainFssLevel}%
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1479), top: s(130), width: s(46), height: s(221) }}
					>
						<img
							alt="Nitrogen #1"
							src="/external/nitrogen-cylinder.png"
							className="absolute max-w-none"
							style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: s(1489), top: s(154), width: s(27), height: s(221) }}
					>
						<p
							className="font-poppins font-bold text-white whitespace-nowrap origin-center -rotate-90"
							style={{ fontSize: s(20) }}
						>
							Nitrogen #1
						</p>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-[#1032bc]"
						style={{ left: s(1470), top: s(370), width: s(64), fontSize: s(24) }}
					>
						{nitrogen1Pressure} Bar
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1715), top: s(130), width: s(46), height: s(221) }}
					>
						<img
							alt="Nitrogen #2"
							src="/external/nitrogen-cylinder.png"
							className="absolute max-w-none"
							style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: s(1725), top: s(154), width: s(27), height: s(221) }}
					>
						<p
							className="font-poppins font-bold text-white whitespace-nowrap origin-center -rotate-90"
							style={{ fontSize: s(20) }}
						>
							Nitrogen #2
						</p>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-[#1032bc]"
						style={{ left: s(1706), top: s(370), width: s(64), fontSize: s(24) }}
					>
						{nitrogen2Pressure} Bar
					</p>

					{/* Ante Chamber FSS */}
					<div
						className="absolute bg-[rgba(217,217,217,0.34)]"
						style={{
							left: s(1368),
							top: s(574),
							width: s(503),
							height: s(500),
							borderRadius: s(80),
						}}
					/>
					<p
						className="absolute text-center font-poppins font-bold text-[#4a90e2]"
						style={{ left: s(1436), top: s(600), width: s(366), fontSize: s(32) }}
					>
						Ante Chamber FSS
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1598), top: s(658), width: s(130), height: s(331) }}
					>
						<img
							alt="Ante FSS Tank"
							src="/external/fss-tank.png"
							className="absolute max-w-none"
							style={{ width: '401.18%', height: '121.92%', left: '-182.66%', top: '-13.21%' }}
							draggable={false}
						/>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-white"
						style={{ left: s(1610), top: s(764), width: s(106), fontSize: s(20) }}
					>
						Lvl: {anteFssLevel}%
					</p>

					<div
						className="absolute overflow-hidden"
						style={{ left: s(1519), top: s(684), width: s(46), height: s(221) }}
					>
						<img
							alt="Nitrogen #1"
							src="/external/nitrogen-cylinder.png"
							className="absolute max-w-none"
							style={{ width: '407.2%', height: '119.73%', left: '-137.32%', top: '-11.06%' }}
							draggable={false}
						/>
					</div>
					<div
						className="absolute flex items-center justify-center"
						style={{ left: s(1529), top: s(708), width: s(27), height: s(221) }}
					>
						<p
							className="font-poppins font-bold text-white whitespace-nowrap origin-center -rotate-90"
							style={{ fontSize: s(20) }}
						>
							Nitrogen #1
						</p>
					</div>
					<p
						className="absolute text-center font-poppins font-bold text-[#1032bc]"
						style={{ left: s(1510), top: s(924), width: s(64), fontSize: s(24) }}
					>
						{nitrogen1Pressure} Bar
					</p>
				</div>
			</div>
		</>
	);
}
