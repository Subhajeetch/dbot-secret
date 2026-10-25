const sharp = require("sharp");
const axios = require("axios");

const fetchImageBuffer = async url => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer",
    timeout: 10000
  });
  return Buffer.from(response.data);
};

const createGlowingHeart = async (size = 100) => {
  const heartSVG = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
            fill="#ff1744" 
            stroke="#ff8a95" 
            stroke-width="0.5"/>
    </svg>
  `;

  const heartBase = await sharp(Buffer.from(heartSVG))
    .resize(size, size)
    .png()
    .toBuffer();

  const glow1 = await sharp(heartBase)
    .blur(8)
    .modulate({ brightness: 0.8 })
    .toBuffer();

  const glow2 = await sharp(heartBase)
    .blur(4)
    .modulate({ brightness: 0.9 })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: glow1, blend: "screen" },
      { input: glow2, blend: "screen" },
      { input: heartBase, blend: "over" }
    ])
    .png()
    .toBuffer();
};

const generateLoveImage = async (avatarURL1, avatarURL2, showHeart = false) => {
  const canvasWidth = 1012;
  const canvasHeight = 512;
  const avatarSize = 512;
  const heartSize = 100;

  // Download and resize both avatars in parallel in memory
  const [rawAvatar1, rawAvatar2] = await Promise.all([
    fetchImageBuffer(avatarURL1),
    fetchImageBuffer(avatarURL2)
  ]);

  const [resizedAvatar1Buffer, resizedAvatar2Buffer] = await Promise.all([
    sharp(rawAvatar1).resize(avatarSize, avatarSize).png().toBuffer(),
    sharp(rawAvatar2).resize(avatarSize, avatarSize).png().toBuffer()
  ]);

  const user1X = -5;
  const user1Y = Math.round((canvasHeight - avatarSize) / 2);
  const user2X = canvasWidth - avatarSize + 5;
  const user2Y = Math.round((canvasHeight - avatarSize) / 2);

  const compositeElements = [
    { input: resizedAvatar1Buffer, left: user1X, top: user1Y },
    { input: resizedAvatar2Buffer, left: user2X, top: user2Y }
  ];

  if (showHeart) {
    const heartBuffer = await createGlowingHeart(heartSize);
    const heartX = Math.round((canvasWidth - heartSize) / 2);
    const heartY = Math.round((canvasHeight - heartSize) / 2);
    compositeElements.push({
      input: heartBuffer,
      left: heartX,
      top: heartY,
      blend: "over"
    });
  }

  // Return final PNG buffer directly (no files written to disk)
  return sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
    .composite(compositeElements)
    .png()
    .toBuffer();
};

module.exports = generateLoveImage;