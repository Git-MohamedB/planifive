import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const size = {
    width: 32,
    height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
    // Read the image file from the public directory
    // Note: In production, this path might need adjustment or use fetch
    const logoPath = join(process.cwd(), 'public', 'logo-five.png');
    const logoData = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;

    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    background: 'transparent',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    overflow: 'hidden',
                }}
            >
                <img
                    src={logoBase64}
                    alt="Logo"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                />
            </div>
        ),
        {
            ...size,
        }
    );
}
