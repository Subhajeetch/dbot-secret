import axios from "axios";
import sharp, { OverlayOptions } from "sharp";
import { createCanvas, loadImage, registerFont } from "canvas";
import { User } from "discord.js";
import { LevelUpCardOptions } from "../core/types";
import { getFontPath } from "../utils/paths";

export class ImageService {
  private static instance: ImageService;
  private fontsRegistered = false;

  private constructor() {
    this.registerFonts();
  }

  public static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  private registerFonts(): void {
    if (this.fontsRegistered) return;
    const semiBold = getFontPath("Poppins-SemiBold.ttf");
    const thin = getFontPath("Poppins-Thin.ttf");

    if (semiBold) registerFont(semiBold, { family: "PoppinsSemiBold" });
    if (thin) registerFont(thin, { family: "PoppinsThin" });
    this.fontsRegistered = true;
  }

  public async fetchImageBuffer(url: string): Promise<Buffer> {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: 10000
    });
    return Buffer.from(response.data);
  }

  public async createGlowingHeart(size = 100): Promise<Buffer> {
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
  }

  public async generateLoveImage(
    avatarURL1: string,
    avatarURL2: string,
    showHeart = false
  ): Promise<Buffer> {
    const canvasWidth = 1012;
    const canvasHeight = 512;
    const avatarSize = 512;
    const heartSize = 100;

    const [rawAvatar1, rawAvatar2] = await Promise.all([
      this.fetchImageBuffer(avatarURL1),
      this.fetchImageBuffer(avatarURL2)
    ]);

    const [resized1, resized2] = await Promise.all([
      sharp(rawAvatar1).resize(avatarSize, avatarSize).png().toBuffer(),
      sharp(rawAvatar2).resize(avatarSize, avatarSize).png().toBuffer()
    ]);

    const user1X = -5;
    const user1Y = Math.round((canvasHeight - avatarSize) / 2);
    const user2X = canvasWidth - avatarSize + 5;
    const user2Y = Math.round((canvasHeight - avatarSize) / 2);

    const compositeElements: OverlayOptions[] = [
      { input: resized1, left: user1X, top: user1Y },
      { input: resized2, left: user2X, top: user2Y }
    ];

    if (showHeart) {
      const heartBuffer = await this.createGlowingHeart(heartSize);
      const heartX = Math.round((canvasWidth - heartSize) / 2);
      const heartY = Math.round((canvasHeight - heartSize) / 2);
      compositeElements.push({
        input: heartBuffer,
        left: heartX,
        top: heartY,
        blend: "over"
      });
    }

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
  }

  public async generateColorCard(user: User, color: string): Promise<Buffer> {
    const canvas = createCanvas(600, 100);
    const ctx = canvas.getContext("2d");

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

      const rawBuffer = await this.fetchImageBuffer(avatarURL);
      const pngBuffer = await sharp(rawBuffer)
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
    } catch (avatarError: any) {
      console.warn(`Avatar processing fallback: ${avatarError?.message}`);
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

    ctx.fillStyle = color;
    ctx.font = "bold 16px Arial";
    ctx.fillText(displayName, 72, 35);

    ctx.fillStyle = "#72767d";
    ctx.font = "12px Arial";
    const nameWidth = ctx.measureText(displayName).width;
    ctx.fillText(timeString, 82 + nameWidth, 35);

    ctx.fillStyle = "#dcddde";
    ctx.font = "16px Arial";
    ctx.fillText(`Look at my awesome ${color} color! 🎨`, 72, 55);

    ctx.fillStyle = color;
    ctx.font = "14px Arial";
    ctx.fillText("✨", canvas.width - 30, 25);

    return canvas.toBuffer("image/png");
  }

  public async generateLevelUpCard(options: LevelUpCardOptions): Promise<Buffer> {
    const { avatarBuffer, currentExp, maxExp, username, progress } = options;
    const width = 1280;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#ff7f0f");
    gradient.addColorStop(1, "#ff04ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#353535";
    ctx.beginPath();
    ctx.roundRect(40, 40, 240, 240, 20);
    ctx.fill();

    if (avatarBuffer) {
      const pngAvatar = await sharp(avatarBuffer)
        .resize(200, 200)
        .png()
        .toBuffer();
      const avatarImg = await loadImage(pngAvatar);
      ctx.drawImage(avatarImg, 60, 60, 200, 200);
    }

    const semiBold = getFontPath("Poppins-SemiBold.ttf");
    const thin = getFontPath("Poppins-Thin.ttf");
    const mainFont = semiBold ? "PoppinsSemiBold" : "Arial";
    const footerFont = thin ? "PoppinsThin" : "Arial";

    ctx.fillStyle = "#353535";
    ctx.font = `bold 58px "${mainFont}"`;
    ctx.fillText(username.toUpperCase(), 300, 105);

    ctx.fillRect(300, 138, 400, 5);

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

    ctx.fillStyle = "#353535";
    ctx.beginPath();
    ctx.roundRect(300, 280, 770, 42, 10);
    ctx.fill();

    ctx.fillStyle = "#97FF01";
    ctx.beginPath();
    ctx.roundRect(300, 280, Math.max(20, Math.min(770, progress)), 42, 10);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = `24px "${footerFont}"`;
    ctx.fillText("Powered by @Animekun AI", 940, 365);

    return canvas.toBuffer("image/png");
  }
}

export const imageService = ImageService.getInstance();
