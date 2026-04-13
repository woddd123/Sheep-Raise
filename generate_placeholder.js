const fs = require('fs');
// A simple 3x1 pixel transparent PNG base64
const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAMAAAABCAYAAAAMzE+QAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAXSURBVBhXY3jP8P8/AwPDfwYmBgYGAwB4WwP/sJ5+3wAAAABJRU5ErkJggg==";
fs.writeFileSync('public/female_sheep_sprites.png', Buffer.from(base64Data, 'base64'));
