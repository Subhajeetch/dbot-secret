import {
  AttachmentBuilder,
  EmbedBuilder,
  GuildMember,
  Message,
  User
} from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { imageService } from "../../../services/image.service";
import { resolveTargetMember } from "../../../utils/member";
import { errorEmbed } from "../../../utils/embeds";

const getAvatarURL = (
  target: GuildMember | User,
  StaticForSharp = false
): string => {
  const options = StaticForSharp
    ? { extension: "png" as const, size: 512 as const, forceStatic: true }
    : { size: 4096 as const };

  if ("user" in target && target.user) {
    return target.avatarURL(options) || target.user.displayAvatarURL(options);
  }
  return target.displayAvatarURL(options);
};

export const avatarCommand: PrefixCommand = {
  name: "avatar",
  aliases: ["av"],
  description: "View user avatar or generate a combined love image between two users",
  category: "fun",
  async execute(message, rawArgs) {
    try {
      const showHeart = rawArgs.includes("--heart");
      const args = rawArgs.filter(arg => arg !== "--heart");

      if (args.length > 2) {
        const provideTwoUserEmbed = errorEmbed("Please provide at most 2 users.");
        return await message.reply({ embeds: [provideTwoUserEmbed] });
      }

      let targetUser1: GuildMember | User | null = null;
      let targetUser2: GuildMember | User | null = null;

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
            `User "${args[0]}" could not be found.`
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
          .setColor(2368553)
          .setDescription("Generating image...");

        const generatingMessage = await message.reply({
          embeds: [generatingEmbed]
        });

        try {
          const imageBuffer = await imageService.generateLoveImage(
            avatarURL1,
            avatarURL2,
            showHeart
          );
          const attachment = new AttachmentBuilder(imageBuffer, {
            name: "output-avatar.png"
          });

          const name1 = "user" in targetUser1 ? targetUser1.user.username : targetUser1.username;
          const name2 = targetUser2.user.username;

          const finalEmbed = new EmbedBuilder()
            .setColor(2368553)
            .setDescription(`Combined avatar of ${name1} and ${name2}`)
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
        const username = "user" in targetUser1 ? targetUser1.user.username : targetUser1.username;
        const embed = new EmbedBuilder()
          .setColor(2368553)
          .setDescription(`Avatar for **${username}**`)
          .setImage(avatarURL);

        await message.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error("Error fetching avatars or generating image:", error);
      const unableToFetchEmbed = errorEmbed("Unable to fetch the avatar.");
      await message.reply({ embeds: [unableToFetchEmbed] });
    }
  }
};

export default avatarCommand;
