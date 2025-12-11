import React from 'react';

interface ActiveCallVisualProps {
    isSelected: boolean;
}

const ActiveCallVisual = ({ isSelected }: ActiveCallVisualProps) => {
    return (
        <>
            {/* Layer 1: Rotating Gradient (The Border) */}
            <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden rounded-[inherit]">
                <div
                    className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_3s_linear_infinite]"
                    style={{
                        background: 'conic-gradient(from 0deg, transparent 0 60%, #5865F2 80%, #00C7FF 95%, #5865F2 100%)'
                    }}
                />
            </div>

            {/* Layer 2: Inner Background (The Mask) */}
            <div
                className="absolute z-1 transition-colors duration-200 rounded-[inherit]"
                style={{
                    top: '3px', bottom: '3px', left: '3px', right: '3px',
                    backgroundColor: isSelected ? '#22c55e' : '#1A1A1A',
                }}
            />
        </>
    );
};

export default ActiveCallVisual;
