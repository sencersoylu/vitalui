import React, { useState, useRef, useEffect } from 'react';
import * as m from 'motion';

interface SwipeSliderProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  style?: React.CSSProperties;
  height?: number;
}

const SwipeSlider: React.FC<SwipeSliderProps> = ({
  initialValue = 0,
  min = 0,
  max = 100,
  onChange,
  className = '',
  orientation = 'vertical',
  style = {},
  height = 80,
}) => {
  const [value, setValue] = useState(initialValue);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const isHorizontal = orientation === 'horizontal';

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !sliderRef.current || !progressRef.current) return;

    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    
    // Get client coordinates from either mouse or touch event
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    let percentage;
    
    if (isHorizontal) {
      // For horizontal orientation (left to right)
      const width = rect.width;
      const relativeX = clientX - rect.left;
      percentage = Math.max(0, Math.min(100, (relativeX / width) * 100));
    } else {
      // For vertical orientation (bottom to top)
      const height = rect.height;
      const relativeY = rect.bottom - clientY;
      percentage = Math.max(0, Math.min(100, (relativeY / height) * 100));
    }
    
    // Calculate the actual value
    const newValue = Math.round((percentage / 100) * (max - min) + min);
    
    setValue(newValue);
    onChange?.(newValue);
    
    // Update the progress element
    if (isHorizontal) {
      progressRef.current.style.width = `${percentage}%`;
    } else {
      progressRef.current.style.height = `${percentage}%`;
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleDrag(e as unknown as React.MouseEvent);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      handleDrag(e as unknown as React.TouchEvent);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  // Calculate the initial progress based on value
  useEffect(() => {
    if (progressRef.current) {
      const percentage = ((value - min) / (max - min)) * 100;
      if (isHorizontal) {
        progressRef.current.style.width = `${percentage}%`;
      } else {
        progressRef.current.style.height = `${percentage}%`;
      }
    }
  }, [value, min, max, orientation]);

  return (
    <div className={`relative ${className}`} style={style}>
      <div 
        ref={sliderRef}
        className={`relative ${isHorizontal ? 'w-full' : 'w-32'} rounded-[40px] overflow-hidden cursor-pointer bg-[#2D2D2D] shadow-lg`}
        style={{ height: isHorizontal ? `${height}px` : '16rem' }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        {/* The dark part (background) */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#2D2D2D] z-10" />
        
        {/* The light part with progress */}
        <div 
          ref={progressRef}
          className={`absolute ${
            isHorizontal 
              ? 'left-0 top-0 h-full rounded-r-[40px]' 
              : 'bottom-0 left-0 w-full rounded-t-[40px]'
          } bg-white z-20 transition-all duration-500 ease-spring`}
          style={{ 
            width: isHorizontal ? `${((value - min) / (max - min)) * 100}%` : '100%',
            height: isHorizontal ? '100%' : `${((value - min) / (max - min)) * 100}%`,
          }}
        >
          {/* Sun icon */}
        
        </div>
        
        {/* Subtle inner shadow effect */}
        <div className="absolute inset-0 rounded-[40px] shadow-inner pointer-events-none z-30 ring-1 ring-gray-700/30" />
        
        {/* Percentage indicator in the middle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 text-center pointer-events-none">
          <div className="font-bold text-white text-lg drop-shadow-md" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {value}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default SwipeSlider; 