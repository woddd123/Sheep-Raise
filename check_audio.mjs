import fs from 'fs';

const buffer = fs.readFileSync('src/assets/sheep.mp3');
console.log('File size:', buffer.length);
console.log('First 10 bytes:', buffer.subarray(0, 10).toString('hex'));
