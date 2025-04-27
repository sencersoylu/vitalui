import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import SwipeSlider from '../components/SwipeSlider';

function SliderExample() {
  const [verticalValue, setVerticalValue] = useState(50);
  const [horizontalValue, setHorizontalValue] = useState(30);
  const [bgColor, setBgColor] = useState('#1a202c');

  const handleVerticalChange = (newValue: number) => {
    setVerticalValue(newValue);
  };

  const handleHorizontalChange = (newValue: number) => {
    setHorizontalValue(newValue);
  };

  // Update background color based on slider value
  useEffect(() => {
    // Interpolate between colors based on value
    const percentage = verticalValue / 100;
    const r = Math.round(26 + percentage * (255 - 26));
    const g = Math.round(32 + percentage * (255 - 32));
    const b = Math.round(44 + percentage * (255 - 44));
    setBgColor(`rgb(${r}, ${g}, ${b})`);
  }, [verticalValue]);

  return (
    <React.Fragment>
      <Head>
        <title>Swipe Slider Example</title>
      </Head>
      <div 
        className="flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-700"
        style={{ backgroundColor: bgColor }}
      >
        <div className="bg-opacity-20 bg-black p-8 rounded-xl backdrop-blur-md w-full max-w-4xl">
          <h1 className="text-3xl font-bold mb-8 text-white text-center">Brightness Control</h1>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-12 mb-8">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-white">Vertical Slider</h2>
              <SwipeSlider 
                initialValue={verticalValue} 
                onChange={handleVerticalChange} 
                className="mx-auto"
                orientation="vertical"
              />
              <p className="text-white mt-4 opacity-70 text-center">
                Swipe up for more<br />Swipe down for less
              </p>
            </div>
            
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-white">Horizontal Slider</h2>
              <SwipeSlider 
                initialValue={horizontalValue} 
                onChange={handleHorizontalChange}
                className="mx-auto"
                orientation="horizontal"
              />
              <p className="text-white mt-4 opacity-70 text-center">
                Swipe right for more<br />Swipe left for less
              </p>
            </div>
          </div>
          
          <div className="flex justify-center gap-8">
            <div className="text-white text-xl bg-black bg-opacity-30 px-4 py-2 rounded-full">
              Vertical: {verticalValue}%
            </div>
            <div className="text-white text-xl bg-black bg-opacity-30 px-4 py-2 rounded-full">
              Horizontal: {horizontalValue}%
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

export default SliderExample; 