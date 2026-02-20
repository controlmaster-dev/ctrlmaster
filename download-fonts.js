const fs = require('fs');
const https = require('https');
const path = require('path');

const fonts = [
    {
        url: 'https://github.com/vercel/geist-font/raw/main/packages/font/dist/geist-sans/Geist-Regular.ttf',
        dest: 'public/fonts/Geist-Regular.ttf'
    },
    {
        url: 'https://github.com/vercel/geist-font/raw/main/packages/font/dist/geist-sans/Geist-Bold.ttf',
        dest: 'public/fonts/Geist-Bold.ttf'
    }
];

// Ensure directory exists
const dir = 'public/fonts';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fonts.forEach(font => {
    const file = fs.createWriteStream(font.dest);
    https.get(font.url, function (response) {
        if (response.statusCode === 302 || response.statusCode === 301) {
            // Handle redirect
            https.get(response.headers.location, function (response) {
                response.pipe(file);
                file.on('finish', function () {
                    file.close(() => console.log(`Downloaded ${font.dest}`));
                });
            });
        } else {
            response.pipe(file);
            file.on('finish', function () {
                file.close(() => console.log(`Downloaded ${font.dest}`));
            });
        }
    }).on('error', function (err) {
        fs.unlink(font.dest);
        console.error(`Error downloading ${font.dest}: ${err.message}`);
    });
});
