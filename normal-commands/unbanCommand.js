const { errorEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const unbanCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}ub` && cmd !== `${serverPrefix}unban`) return;

  try {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const noPermEmbed = errorEmbed("You don't have permissions bro.");
      return await message.reply({ embeds: [noPermEmbed] });
    }

    const args = tokens.slice(1);

    const sendUnbanGuide = () => {
      const unbanGuideEmbed = new EmbedBuilder()
        .setTitle("🍃 Guide")
        .setColor(0x54ff32)
        .setDescription(
          `**Usage:**\n${serverPrefix}unban @user or userID\n${serverPrefix}ub @user or userID\n\n**Examples:**\n${serverPrefix}ub @user\n${serverPrefix}unban @user\n${serverPrefix}ub 5887437874478854`
        )
        .setFooter({
          text: "Provide a user ID or mention a user to unban them."
        });
      return message.reply({ embeds: [unbanGuideEmbed] });
    };

    if (!args[0]) {
      return await sendUnbanGuide();
    }

    const userId = args[0].replace(/[<@!>]/g, "");
    if (!/^\d+$/.test(userId)) {
      return await sendUnbanGuide();
    }

    const banList = await message.guild.bans.fetch();
    const bannedUser = banList.get(userId);

    if (!bannedUser) {
      const notFoundEmbed = new EmbedBuilder()
        .setTitle("<:cross:1310179339005988945>  Unsuccessful")
        .setColor(0xff0320)
        .setDescription("Cannot find the user in the banned list.");

      return await message.reply({ embeds: [notFoundEmbed] });
    }

    await message.guild.members.unban(userId);

    const successUnbanEmbed = new EmbedBuilder()
      .setTitle("<:tick:1310179325152067676>  Success")
      .setColor(0x54ff32)
      .setDescription(`Successfully unbanned <@${userId}>.`);

    await message.reply({ embeds: [successUnbanEmbed] });
  } catch (error) {
    console.error("Error in unban command:", error);
    const errorUnbanEmbed = errorEmbed(
      "An error occurred while trying to unban the user."
    );
    await message.reply({ embeds: [errorUnbanEmbed] });
  }
};

module.exports = unbanCommand;