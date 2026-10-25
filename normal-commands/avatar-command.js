const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const searchUser = require("../utils/searchUser.js");
const serverPrefix = require("../prifix.js");
const generateLoveImage = require("../imagemagick_templates/avatar-templates.js");
const { errorEmbed } = require("../utils/embeds.js");

const getAvatarURL = (target, StaticForSharp = false) => {
  const options = StaticForSharp
    ? { extension: "png", size: 512, forceStatic: true }
    : { size: 4096 };

  if (target && target.user) {
    return (
      target.avatarURL(options) || target.user.displayAvatarURL(options)
    );
  }
  return target.displayAvatarURL(options);
};

const resolveTargetMember = async (guild, arg) => {
  const mentionMatch = arg.match(/^<@!?(\d+)>$/);
  if (mentionMatch) {
    try {
      return await guild.members.fetch(mentionMatch[1]);
    } catch {
      return null;
    }
  }
  return await searchUser(guild, arg);
};

const avatarCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}av` && cmd !== `${serverPrefix}avatar`) return;

  try {
    const rawArgs = tokens.slice(1);
    const showHeart = rawArgs.includes("--heart");
    const args = rawArgs.filter(arg => arg !== "--heart");

    if (args.length > 2) {
      const provideTwoUserEmbed = errorEmbed("Please provide at most 2 users.");
      return await message.reply({ embeds: [provideTwoUserEmbed] });
    }

    let targetUser1 = null;
    let targetUser2 = null;

    if (args.length === 2) {
      targetUser1 = await resolveTargetMember(message.guild, args[0]);
      targetUser2 = await resolveTargetMember(message.guild, args[1]);

      if (!targetUser1 || !targetUser2) {
        const cantFindUserEmbed = errorEmbed(
          "Could not find both users. Please mention or provide valid usernames."
        );
        return await message.reply({ embeds: [cantFindUserEmbed] });
      }
    } else if (args.length === 1) {
      targetUser1 = await resolveTargetMember(message.guild, args[0]);
      if (!targetUser1) {
        const noUserEmbed = errorEmbed(
          `User "**${args[0]}**" could not be found.`
        );
        return await message.reply({ embeds: [noUserEmbed] });
      }
    } else {
      targetUser1 = message.member || message.author;
    }

    if (targetUser2) {
      const avatarURL1 = getAvatarURL(targetUser1, true);
      const avatarURL2 = getAvatarURL(targetUser2, true);

      const generatingEmbed = new EmbedBuilder()
        .setColor("#FFA500")
        .setDescription(
          "<a:loading:1310179353165959198>   **Generating image...**"
        );

      const generatingMessage = await message.reply({
        embeds: [generatingEmbed]
      });

      try {
        const imageBuffer = await generateLoveImage(
          avatarURL1,
          avatarURL2,
          showHeart
        );
        const attachment = new AttachmentBuilder(imageBuffer, {
          name: "output-avatar.png"
        });

        const finalEmbed = new EmbedBuilder()
          .setColor("#34dd7b")
          .setImage("attachment://output-avatar.png");

        await generatingMessage.edit({
          embeds: [finalEmbed],
          files: [attachment]
        });
      } catch (err) {
        console.error("Error generating the love image:", err);
        const wentWrongEmbed = errorEmbed(
          "Something went wrong while generating the image."
        );
        await generatingMessage.edit({ embeds: [wentWrongEmbed] });
      }
    } else {
      const avatarURL = getAvatarURL(targetUser1, false);
      const embed = new EmbedBuilder()
        .setColor("#00FFFF")
        .setImage(avatarURL);

      await message.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error("Error fetching avatars or generating image:", error);
    const unableToFetchEmbed = errorEmbed("Unable to fetch the avatar.");
    await message.reply({ embeds: [unableToFetchEmbed] });
  }
};

module.exports = avatarCommand;