import { ImageResponse } from 'next/og';import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

export const runtime = 'edge';

export const alt = 'Control Master Dashboard';
export const size = {
  width: 1200,
  height: 630
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(

    _jsxs("div", {
      style: {
        background: '#09090b',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter'
      }, children: [

      _jsx("div", {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 40
        }, children:

        _jsx("img", {
          src: "https://res.cloudinary.com/dtgpm5idm/image/upload/v1760034292/cropped-logo-3D-preview-192x192_c8yd8r.png",
          width: "150",
          height: "150",
          style: { borderRadius: '20px' } }
        ) }
      ),
      _jsx("div", {
        style: {
          fontSize: 60,
          color: 'white',
          fontWeight: 800,
          marginBottom: 20,
          letterSpacing: '-2px'
        }, children:
        "Control Master" }

      ),
      _jsx("div", {
        style: {
          fontSize: 30,
          color: '#FF0C60',
          fontWeight: 600,
          marginTop: 10,
          textTransform: 'uppercase',
          letterSpacing: '4px'
        }, children:
        "Enlace" }

      )] }
    ),

    {
      ...size
    }
  );
}