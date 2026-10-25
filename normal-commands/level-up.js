const { AttachmentBuilder } = require("discord.js");
const axios = require("axios");
const levelUpCard = require("../imagemagick_templates/levelUpCard.js");
const serverPrefix = require("../prifix.js");

const levelUp = async message => {
  if (message.content.trim() === `${serverPrefix}lv`) {
    try {
      const currentExp = 1400;
      const maxExp = 8500;
      const percentage = (currentExp / maxExp) * 100;
      const progress = (percentage / 100) * 770;

      const avatarURL = message.author.displayAvatarURL({
        extension: "png",
        size: 256,
        forceStatic: true
      });

      const response = await axios.get(avatarURL, {
        responseType: "arraybuffer",
        timeout: 8000
      });

      const cardBuffer = await levelUpCard({
        avatarBuffer: Buffer.from(response.data),
        currentExp,
        maxExp,
        username: message.author.username,
        progress
      });

      const attachment = new AttachmentBuilder(cardBuffer, {
        name: "level-up.png"
      });

      await message.reply({ files: [attachment] });
    } catch (error) {
      console.error("Error generating level-up card:", error);
      await message.reply("Failed to generate the level-up image.");
    }
  }
};

module.exports = levelUp;