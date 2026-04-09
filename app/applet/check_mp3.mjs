import fs from 'fs';
const buffer = fs.readFileSync('src/assets/sheep.mp3');
console.log(buffer.slice(0, 50).toString('hex'));
console.log(buffer.slice(0, 50).toString('utf8'));
