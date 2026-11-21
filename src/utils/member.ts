import { Guild, GuildMember } from "discord.js";

export const searchUser = async (
  guild: Guild | null | undefined,
  searchTerm: string
): Promise<GuildMember | null> => {
  if (!guild || !searchTerm) return null;

  try {
    const cleanTerm = searchTerm.toLowerCase();

    // Query Discord API directly
    const queriedMembers = await guild.members.fetch({
      query: searchTerm,
      limit: 10
    });

    if (queriedMembers.size > 0) {
      return (
        queriedMembers.find(
          m =>
            m.user.username.toLowerCase() === cleanTerm ||
            (m.nickname && m.nickname.toLowerCase() === cleanTerm)
        ) || queriedMembers.first() || null
      );
    }

    // Fallback to cache
    return (
      guild.members.cache.find(member => {
        const username = member.user.username.toLowerCase();
        const nickname = member.nickname ? member.nickname.toLowerCase() : null;
        const globalName = member.user.globalName
          ? member.user.globalName.toLowerCase()
          : null;

        return (
          username.includes(cleanTerm) ||
          (nickname && nickname.includes(cleanTerm)) ||
          (globalName && globalName.includes(cleanTerm))
        );
      }) || null
    );
  } catch (error) {
    console.error("Error searching user:", error);
    return null;
  }
};

export const resolveTargetMember = async (
  guild: Guild | null | undefined,
  arg: string
): Promise<GuildMember | null> => {
  if (!guild || !arg) return null;
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

export default { searchUser, resolveTargetMember };
