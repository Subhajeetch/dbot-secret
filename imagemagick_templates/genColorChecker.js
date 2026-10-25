const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const sharp = require("sharp");

const generateColorImage = async (user, color) => {
  const canvas = createCanvas(600, 100);
  const ctx = canvas.getContext("2d");

  // Discord background
  ctx.fillStyle = "#36393f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const avatarSize = 40;
  const avatarX = 16;
  const avatarY = 16;

  try {
    const avatarURL = user.displayAvatarURL({
      extension: "png",
      size: 128,
      forceStatic: true
    });

    const response = await axios.get(avatarURL, {
      responseType: "arraybuffer",
      timeout: 8000
    });

    // Convert to PNG buffer in memory for reliable loading in canvas
    const pngBuffer = await sharp(Buffer.from(response.data))
      .resize(avatarSize, avatarSize)
      .png()
      .toBuffer();

    const avatar = await loadImage(pngBuffer);

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  } catch (avatarError) {
    console.warn(`Avatar processing fallback: ${avatarError.message}`);
    ctx.fillStyle = "#747f8d";
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 6);
    ctx.textAlign = "left";
  }

  const displayName = user.displayName || user.username;
  const now = new Date();
  const timeString = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  // Username
  ctx.fillStyle = color;
  ctx.font = "bold 16px Arial";
  ctx.fillText(displayName, 72, 35);

  // Timestamp
  ctx.fillStyle = "#72767d";
  ctx.font = "12px Arial";
  const nameWidth = ctx.measureText(displayName).width;
  ctx.fillText(timeString, 82 + nameWidth, 35);

  // Message
  ctx.fillStyle = "#dcddde";
  ctx.font = "16px Arial";
  ctx.fillText(`Look at my awesome ${color} color! 🎨`, 72, 55);

  // Decoration
  ctx.fillStyle = color;
  ctx.font = "14px Arial";
  ctx.fillText("✨", canvas.width - 30, 25);

  return canvas.toBuffer("image/png");
};

module.exports = generateColorImage;