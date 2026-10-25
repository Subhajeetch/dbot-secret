const { createCanvas, loadImage, registerFont } = require("canvas");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Register custom fonts if present in the repo
const semiBoldPath = path.resolve(__dirname, "../fonts/Poppins-SemiBold.ttf");
const thinPath = path.resolve(__dirname, "../fonts/Poppins-Thin.ttf");

if (fs.existsSync(semiBoldPath)) {
  registerFont(semiBoldPath, { family: "PoppinsSemiBold" });
}
if (fs.existsSync(thinPath)) {
  registerFont(thinPath, { family: "PoppinsThin" });
}

const levelUpCard = async ({
  avatarBuffer,
  currentExp,
  maxExp,
  username,
  progress
}) => {
  const width = 1280;
  const height = 400;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Gradient background (#ff7f0f to #ff04ff)
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#ff7f0f");
  gradient.addColorStop(1, "#ff04ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Avatar background rounded rectangle
  ctx.fillStyle = "#353535";
  ctx.beginPath();
  ctx.roundRect(40, 40, 240, 240, 20);
  ctx.fill();

  // Draw avatar
  if (avatarBuffer) {
    const pngAvatar = await sharp(avatarBuffer)
      .resize(200, 200)
      .png()
      .toBuffer();
    const avatarImg = await loadImage(pngAvatar);
    ctx.drawImage(avatarImg, 60, 60, 200, 200);
  }

  // Draw username
  const mainFont = fs.existsSync(semiBoldPath) ? "PoppinsSemiBold" : "Arial";
  const footerFont = fs.existsSync(thinPath) ? "PoppinsThin" : "Arial";

  ctx.fillStyle = "#353535";
  ctx.font = `bold 58px "${mainFont}"`;
  ctx.fillText(username.toUpperCase(), 300, 105);

  // Divider bar
  ctx.fillRect(300, 138, 400, 5);

  // Stats text
  ctx.font = `bold 40px "${mainFont}"`;
  ctx.fillText("Level: 24", 300, 205);
  ctx.fillText(
    `EXP: ${(Math.round(currentExp) / 1000).toFixed(1)}k/${(
      Math.round(maxExp) / 1000
    ).toFixed(1)}k`,
    550,
    205
  );
  ctx.fillText("Rank: 17", 900, 205);

  // Progress bar background
  ctx.fillStyle = "#353535";
  ctx.beginPath();
  ctx.roundRect(300, 280, 770, 42, 10);
  ctx.fill();

  // Progress bar foreground
  ctx.fillStyle = "#97FF01";
  ctx.beginPath();
  ctx.roundRect(300, 280, Math.max(20, Math.min(770, progress)), 42, 10);
  ctx.fill();

  // Footer text
  ctx.fillStyle = "#000000";
  ctx.font = `24px "${footerFont}"`;
  ctx.fillText("Powered by @Animekun AI", 940, 365);

  return canvas.toBuffer("image/png");
};

module.exports = levelUpCard;