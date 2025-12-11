import React from 'react';

interface ActiveCallVisualProps {
    isSelected: boolean;
}

const ActiveCallVisual = ({ isSelected }: ActiveCallVisualProps) => {
    return (
        <>
            {/* Layer 1: Background Color */}
            <div
                className="absolute inset-0 z-0 transition-colors duration-200"
                style={{ backgroundColor: isSelected ? '#22c55e' : '#1A1A1A' }}
            />

            {/* Layer 2: Animated SVG Border */}
            <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                <rect
                    x="2"
                    y="2"
                    width="calc(100% - 4px)"
                    height="calc(100% - 4px)"
                    fill="none"
                    stroke="#5865F2"
                    strokeWidth="4"
                    strokeDasharray="40 10"
                    className="animate-dash"
                />
            </svg>
        </>
    );
};

export default ActiveCallVisual;
