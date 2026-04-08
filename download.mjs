import fs from 'fs/promises';

async function download() {
  try {
    console.log("Starting download...");
    const res = await fetch("https://downsc.chinaz.net/files/download/sound/huang/cd9/wav/325.mp3", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    await fs.mkdir('public', { recursive: true });
    await fs.writeFile("public/sheep.mp3", Buffer.from(buffer));
    console.log("Download completed successfully.");
  } catch (err) {
    console.error("Download failed:", err);
  }
}
download();
