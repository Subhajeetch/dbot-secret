const { errorEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const kickCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}k` && cmd !== `${serverPrefix}kick`) return;

  try {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      const noPermEmbed = errorEmbed("You don't have permissions bro.");
      return await message.reply({ embeds: [noPermEmbed] });
    }

    const args = tokens.slice(1);
    const mentionedUser = message.mentions.members.first();

    const sendKickGuide = () => {
      const kickGuideEmbed = new EmbedBuilder()
        .setTitle("🍃  Guide")
        .setColor(0x54ff32)
        .setDescription(
          `**Usage:**\n${serverPrefix}k @user\n${serverPrefix}k @user reason\n${serverPrefix}kick @user reason\n\n**Examples:**\n${serverPrefix}kick @user Spamming\n${serverPrefix}k @user Rule violations`
        )
        .setFooter({ text: "Mention a user to kick them." });
      return message.reply({ embeds: [kickGuideEmbed] });
    };

    if (!args[0] || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
      return await sendKickGuide();
    }

    if (mentionedUser.id === message.author.id) {
      return await message.reply({
        embeds: [errorEmbed("You cannot kick yourself bro.")]
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
            "You cannot kick a member with an equal or higher role than yours."
          )
        ]
      });
    }

    if (!mentionedUser.kickable) {
      const cantKickEmbed = new EmbedBuilder()
        .setTitle("<:cross:1310179339005988945>  Unsuccessful")
        .setColor(0xff0320)
        .setDescription("User is immune, can't kick.");
      return await message.reply({ embeds: [cantKickEmbed] });
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    await mentionedUser.kick(reason);

    const successKickEmbed = new EmbedBuilder()
      .setTitle("<:tick:1310179325152067676>  Success")
      .setColor(0x54ff32)
      .setDescription(
        `**Successfully kicked <@${mentionedUser.user.id}>.**\n\nReason: ${reason}.`
      );

    await message.reply({ embeds: [successKickEmbed] });
  } catch (error) {
    console.error("Error in kick command:", error);
    const errorKickEmbed = errorEmbed(
      "An error occurred while trying to kick the user."
    );
    await message.reply({ embeds: [errorKickEmbed] });
  }
};

module.exports = kickCommand;