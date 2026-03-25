const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const downloadImage = async (url, filepath) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "arraybuffer"
  });
  fs.writeFileSync(filepath, response.data);
};

// Function to clean up old avatar files (not current ones)
const cleanupOldAvatarFiles = (currentFiles = []) => {
  try {
    // Get all PNG files that start with 'avatar' or 'heart'
    const files = fs.readdirSync('.').filter(file =>
      (file.startsWith('avatar') || file.startsWith('heart')) &&
      file.endsWith('.png') &&
      !currentFiles.includes(file) // Exclude current files
    );

    console.log(`🧹 Found ${files.length} old files to clean up`);

    // Sort by modification time (oldest first)
    const filesWithStats = files.map(file => ({
      name: file,
      mtime: fs.statSync(file).mtime
    }));

    filesWithStats.sort((a, b) => a.mtime - b.mtime);

    // Try to delete old files
    let deletedCount = 0;
    filesWithStats.forEach(fileInfo => {
      try {
        fs.unlinkSync(fileInfo.name);
        console.log(`✅ Deleted old file: ${fileInfo.name}`);
        deletedCount++;
      } catch (error) {
        if (error.code === 'EBUSY') {
          console.log(`⏩ Skipping busy file: ${fileInfo.name}`);
        } else {
          console.log(`⚠️  Could not delete ${fileInfo.name}: ${error.message}`);
        }
      }
    });

    console.log(`🎯 Successfully cleaned up ${deletedCount} old files`);

  } catch (error) {
    console.log(`❌ Error during cleanup: ${error.message}`);
  }
};

// More aggressive deletion with longer delays and more retries (for current files)
const aggressiveDelete = (filepath) => {
  const attempts = [1000, 3000, 5000, 10000]; // 1s, 3s, 5s, 10s delays

  const tryDelete = (attemptIndex = 0) => {
    if (attemptIndex >= attempts.length) {
      console.log(`❌ Giving up on deleting: ${filepath}`);
      return;
    }

    setTimeout(() => {
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log(`✅ Successfully deleted: ${filepath} (attempt ${attemptIndex + 1})`);
        }
      } catch (error) {
        if (error.code === 'EBUSY') {
          console.log(`⏳ File still busy, trying again in ${attempts[attemptIndex + 1] || 'final'}ms: ${filepath}`);
          tryDelete(attemptIndex + 1);
        } else {
          console.log(`❌ Different error deleting ${filepath}:`, error.message);
        }
      }
    }, attempts[attemptIndex]);
  };

  tryDelete();
};

// Create a glowing heart using multiple layers for better effect
const createGlowingHeart = async (size = 120) => {
  // Simple heart SVG without problematic filters
  const heartSVG = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" 
            fill="#ff1744" 
            stroke="#ff8a95" 
            stroke-width="0.5"/>
    </svg>
  `;

  // Create glow effect by layering multiple blurred versions
  const heartBase = await sharp(Buffer.from(heartSVG))
    .resize(size, size)
    .png()
    .toBuffer();

  // Create glow layers with different blur amounts
  const glow1 = await sharp(heartBase)
    .blur(8)
    .modulate({ brightness: 0.8 })
    .toBuffer();

  const glow2 = await sharp(heartBase)
    .blur(4)
    .modulate({ brightness: 0.9 })
    .toBuffer();

  // Composite all layers together for glow effect
  const glowingHeart = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: glow1, blend: 'screen' },
      { input: glow2, blend: 'screen' },
      { input: heartBase, blend: 'over' }
    ])
    .png()
    .toBuffer();

  return glowingHeart;
};

const generateLoveImage = async (
  avatarURL1,
  avatarURL2,
  outputPath,
  showHeart = false,
  callback
) => {
  let avatarPath1, avatarPath2, heartPath;

  try {
    // Generate unique file names for the avatar images and optionally heart
    avatarPath1 = `avatar1_${uuidv4()}.png`;
    avatarPath2 = `avatar2_${uuidv4()}.png`;
    if (showHeart) {
      heartPath = `heart_${uuidv4()}.png`;
    }

    // FIRST: Clean up old avatar files (but not our current ones)
    cleanupOldAvatarFiles([avatarPath1, avatarPath2].concat(showHeart ? [heartPath] : []));

    // Download the avatar images
    await downloadImage(avatarURL1, avatarPath1);
    await downloadImage(avatarURL2, avatarPath2);

    // Define dimensions for the canvas and avatar positions
    const canvasWidth = 1012;
    const canvasHeight = 512;
    const avatarSize = 512;
    const heartSize = 100; // Slightly smaller for better proportion

    // Resize both avatar images to the same dimensions
    const resizedAvatar1Buffer = await sharp(avatarPath1)
      .resize(avatarSize, avatarSize)
      .toBuffer();

    const resizedAvatar2Buffer = await sharp(avatarPath2)
      .resize(avatarSize, avatarSize)
      .toBuffer();

    // Create the glowing heart
    console.log('💖 Creating glowing heart...');
    const heartBuffer = await createGlowingHeart(heartSize);

    // Calculate positions
    const user1X = -5;
    const user1Y = (canvasHeight - avatarSize) / 2;
    const user2X = canvasWidth - avatarSize - (-5);
    const user2Y = (canvasHeight - avatarSize) / 2;

    // Center the heart between the two avatars
    const heartX = (canvasWidth - heartSize) / 2;
    const heartY = (canvasHeight - heartSize) / 2;

    console.log(`💝 Positioning heart at (${heartX}, ${heartY})`);

    // Create the composite image with resized avatars and optionally the glowing heart
    const compositeElements = [
      { input: resizedAvatar1Buffer, left: user1X, top: user1Y },
      { input: resizedAvatar2Buffer, left: user2X, top: user2Y }
    ];

    // Only add heart if showHeart is true
    if (showHeart) {
      compositeElements.push({ input: heartBuffer, left: heartX, top: heartY, blend: 'over' });
    }

    await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4, // RGBA support
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite(compositeElements)
      .png()
      .toFile(outputPath);

    console.log('❤️ Love image created successfully with glowing heart!');

    // Call the callback immediately
    callback(null);

    // OPTIONAL: Still try to clean current files, but don't stress if it fails
    setTimeout(() => {
      aggressiveDelete(avatarPath1);
      aggressiveDelete(avatarPath2);
      if (showHeart && heartPath) {
        aggressiveDelete(heartPath);
      }
    }, 1000);

  } catch (err) {
    console.error("Error generating the love image with Sharp:", err);

    // Clean up on error too (but still try old cleanup first)
    cleanupOldAvatarFiles([avatarPath1, avatarPath2, heartPath]);

    if (avatarPath1) aggressiveDelete(avatarPath1);
    if (avatarPath2) aggressiveDelete(avatarPath2);
    if (heartPath) aggressiveDelete(heartPath);

    callback(err);
  }
};

module.exports = generateLoveImage;
