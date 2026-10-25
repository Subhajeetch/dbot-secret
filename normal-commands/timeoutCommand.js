const { errorEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const timeoutCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}m` && cmd !== `${serverPrefix}mute`) return;

  try {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      const noPermEmbed = errorEmbed(
        "You don't have the required permissions bro."
      );
      return await message.reply({ embeds: [noPermEmbed] });
    }

    const args = tokens.slice(1);
    const mentionedUser = message.mentions.members.first();

    const sendMuteGuide = () => {
      const muteGuideEmbed = new EmbedBuilder()
        .setTitle("🔇 Mute Guide")
        .setColor(0x54ff32)
        .setDescription(
          `**Usage:**\n${serverPrefix}mute @user [duration] [reason]\n${serverPrefix}m @user [duration] [reason]\n\n**Examples:**\n${serverPrefix}m @user\n${serverPrefix}mute @user 30s Spamming\n${serverPrefix}m @user 1h Inappropriate behavior\n\n**Duration format:**\ns - seconds | m - minutes | h - hours | d - days\n\nDefault duration is 5 minutes if not specified.\nMinimum duration: 10 seconds | Maximum duration: 14 days`
        )
        .setFooter({ text: "Mention a user to mute them." });
      return message.reply({ embeds: [muteGuideEmbed] });
    };

    if (!args[0] || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
      return await sendMuteGuide();
    }

    if (mentionedUser.id === message.author.id) {
      return await message.reply({
        embeds: [errorEmbed("You cannot mute yourself bro.")]
      });
    }

    if (
      message.author.id !== message.guild.ownerId &&
      message.member.roles.highest.position <=
        mentionedUser.roles.highest.position
    ) {
      return await message.reply({
        embeds: [
          errorEmbed(
            "You cannot mute a member with an equal or higher role than yours."
          )
        ]
      });
    }

    if (mentionedUser.isCommunicationDisabled()) {
      const alreadyMutedEmbed = errorEmbed("This user is already muted bro.");
      return await message.reply({ embeds: [alreadyMutedEmbed] });
    }

    if (!mentionedUser.moderatable) {
      const cantMuteEmbed = new EmbedBuilder()
        .setTitle("<:cross:1310179339005988945>  Unsuccessful")
        .setColor(0xff0320)
        .setDescription("User is immune, can't be muted.");
      return await message.reply({ embeds: [cantMuteEmbed] });
    }

    let duration = 300000; // Default 5 minutes
    let reason = "No reason provided";

    if (args.length >= 2) {
      const timeMatch = args[1].match(/^(\d+)([smhd])$/i);
      if (timeMatch) {
        const time = parseInt(timeMatch[1], 10);
        const unit = timeMatch[2].toLowerCase();
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        duration = time * multipliers[unit];
        reason = args.slice(2).join(" ") || reason;
      } else {
        reason = args.slice(1).join(" ") || reason;
      }
    }

    if (duration < 10000 || duration > 1209600000) {
      const invalidDurationEmbed = errorEmbed(
        "Invalid duration. Duration must be between 10 seconds and 14 days."
      );
      return await message.reply({ embeds: [invalidDurationEmbed] });
    }

    await mentionedUser.timeout(duration, reason);

    let readableDuration;
    if (duration < 60000) {
      readableDuration = `${Math.floor(duration / 1000)} second(s)`;
    } else if (duration < 3600000) {
      readableDuration = `${Math.floor(duration / 60000)} minute(s)`;
    } else if (duration < 86400000) {
      readableDuration = `${Math.floor(duration / 3600000)} hour(s)`;
    } else {
      readableDuration = `${Math.floor(duration / 86400000)} day(s)`;
    }

    const successMuteEmbed = new EmbedBuilder()
      .setTitle("<:tick:1310179325152067676>  Success")
      .setColor(0x54ff32)
      .setDescription(
        `**Successfully muted <@${mentionedUser.user.id}>.**\n\nDuration: ${readableDuration}.\nReason: ${reason}.`
      );
    await message.reply({ embeds: [successMuteEmbed] });
  } catch (error) {
    console.error("Error in timeout command:", error);
    const errorMuteEmbed = errorEmbed(
      "An error occurred while trying to mute the user."
    );
    await message.reply({ embeds: [errorMuteEmbed] });
  }
};

module.exports = timeoutCommand;