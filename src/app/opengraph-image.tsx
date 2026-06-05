import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Control Master Dashboard';
export const size = {
  width: 1200,
  height: 630
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 80,
            color: 'white',
            fontWeight: 800,
            marginBottom: 20,
            letterSpacing: '-2px',
            display: 'flex',
          }}
        >
          Control Master
        </div>
        <div
          style={{
            fontSize: 40,
            color: '#FF0C60',
            fontWeight: 600,
            marginTop: 10,
            textTransform: 'uppercase',
            letterSpacing: '4px',
            display: 'flex',
          }}
        >
          Enlace
        </div>
      </div>
    ),
    {
      ...size
    }
  );
}