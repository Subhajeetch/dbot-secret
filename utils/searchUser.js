const searchUser = async (guild, searchTerm) => {
  if (!guild || !searchTerm) return null;

  try {
    const cleanTerm = searchTerm.toLowerCase();

    // Query Discord API directly instead of fetching every member in the server
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
        ) || queriedMembers.first()
      );
    }

    // Fallback to currently cached members
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

module.exports = searchUser;