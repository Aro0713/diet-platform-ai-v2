const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const width = 1000;
const height = 200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

ctx.clearRect(0, 0, width, height);
ctx.fillStyle = '#0044cc';
ctx.font = '48px \"Segoe Script\", cursive';
ctx.textAlign = 'center';
ctx.fillText('Rekomenduję Edyta Sroczyńska', width / 2, height / 2 + 16);

const outPath = path.join(__dirname, 'public', 'podpis-rekomendacja.png');
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync(outPath, buffer);

console.log('✅ Gotowe: podpis-rekomendacja.png zapisany w /public/');
