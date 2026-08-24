import React from 'react';

interface ActiveCallVisualProps {
    isSelected?: boolean;
    variant?: 'call' | 'gold';
}

const ActiveCallVisual = ({ isSelected = false, variant = 'call' }: ActiveCallVisualProps) => {
    const isGold = variant === 'gold';
    const gradId = isGold ? 'goldBorderGrad' : 'blueBorderGrad';

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor={isGold ? '#FDE047' : '#00C7FF'} />
                    <stop offset="100%" stopColor={isGold ? '#EAB308' : '#5865F2'} />
                </linearGradient>
            </defs>

            {/* Base clean border */}
            <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                fill="none"
                stroke={isGold ? 'rgba(234, 179, 8, 0.45)' : 'rgba(88, 101, 242, 0.45)'}
                strokeWidth="2"
            />

            {/* Animated traveling border highlight */}
            <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth="2.5"
                strokeDasharray="60 140"
                style={{
                    animation: 'borderTravel 2s linear infinite',
                }}
            />
        </svg>
    );
};

export default ActiveCallVisual;
