const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                res.resume();
                reject(new Error(`Request failed with status ${res.statusCode}`));
            }
        }).on('error', reject);
    });
};

const convertToJpg = async (inputPath, outputPath) => {
    return new Promise((resolve, reject) => {
        sharp(inputPath)
            .jpeg({ quality: 90 })
            .toFile(outputPath, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(outputPath);
                }
            });
    });
};

const generateColorImage = async (user, color) => {
    return new Promise(async (resolve, reject) => {
        let tempAvatarPath = null;
        let jpgAvatarPath = null;

        try {
            // Create canvas
            const canvas = createCanvas(600, 100);
            const ctx = canvas.getContext('2d');

            // Discord background
            ctx.fillStyle = '#36393f';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Avatar settings
            const avatarSize = 40;
            const avatarX = 16;
            const avatarY = 16;

            try {
                // Get avatar URL (any format Discord gives us)
                const avatarURL = user.displayAvatarURL({ size: 256 });
                const timestamp = Date.now();
                const userId = user.id || 'unknown';

                // Temporary paths
                tempAvatarPath = path.join(__dirname, `temp-avatar-${userId}-${timestamp}.tmp`);
                jpgAvatarPath = path.join(__dirname, `temp-avatar-${userId}-${timestamp}.jpg`);

                console.log(`Downloading avatar: ${avatarURL}`);

                // Step 1: Download the image (whatever format)
                await downloadImage(avatarURL, tempAvatarPath);
                console.log(`Avatar downloaded to: ${tempAvatarPath}`);

                // Step 2: Convert to JPG format
                await convertToJpg(tempAvatarPath, jpgAvatarPath);
                console.log(`Avatar converted to JPG: ${jpgAvatarPath}`);

                // Step 3: Load the JPG image with Canvas
                const avatar = await loadImage(jpgAvatarPath);

                // Draw circular avatar
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                console.log(`Avatar loaded successfully from JPG file`);

            } catch (avatarError) {
                console.log(`Avatar processing failed: ${avatarError.message}`);

                // Fallback circle
                ctx.fillStyle = '#747f8d';
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('?', avatarX + avatarSize / 2, avatarY + avatarSize / 2 + 6);
                ctx.textAlign = 'left';
            }

            // Text elements
            const displayName = user.displayName || user.username;
            const now = new Date();
            const timeString = now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            // Username
            ctx.fillStyle = color;
            ctx.font = 'bold 16px Arial';
            ctx.fillText(displayName, 72, 35);

            // Timestamp
            ctx.fillStyle = '#72767d';
            ctx.font = '12px Arial';
            const nameWidth = ctx.measureText(displayName).width;
            ctx.fillText(`${timeString}`, 82 + nameWidth, 35);

            // Message
            ctx.fillStyle = '#dcddde';
            ctx.font = '16px Arial';
            ctx.fillText(`Look at my awesome ${color} color! 🎨`, 72, 55);

            // Decoration
            ctx.fillStyle = color;
            ctx.font = '14px Arial';
            ctx.fillText('✨', canvas.width - 30, 25);

            // Clean up temporary files
            [tempAvatarPath, jpgAvatarPath].forEach(filePath => {
                if (filePath && fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log(`Temporary file deleted: ${filePath}`);
                    } catch (deleteError) {
                        console.log(`Failed to delete temporary file: ${deleteError.message}`);
                    }
                }
            });

            // Return buffer
            const buffer = canvas.toBuffer('image/png');
            resolve(buffer);

        } catch (error) {
            console.error("Error in generateColorImage:", error);

            // Clean up temporary files on error
            [tempAvatarPath, jpgAvatarPath].forEach(filePath => {
                if (filePath && fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (deleteError) {
                        console.log(`Failed to delete temporary file: ${deleteError.message}`);
                    }
                }
            });

            reject(error);
        }
    });
};

module.exports = generateColorImage;
