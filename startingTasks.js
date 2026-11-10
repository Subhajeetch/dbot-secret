const { ActivityType } = require("discord.js");
const fs = require("fs");
const path = require("path");

const avatars = [
  "images/snow_animekun.gif",
  "images/picture2.jpg",
  "images/picture3.jpg",
  "images/picture4.jpg",
  "images/picture5.jpg",
  "images/picture6.jpg",
  "images/picture7.jpg",
  "images/picture8.jpg",
  "images/picture9.jpg"
];

const statuses = [
  { name: "Watching You Pooping", type: ActivityType.Watching },
  { name: "Listening to your Nonsense", type: ActivityType.Listening },
  { name: "Playing with your Heart", type: ActivityType.Playing },
  { name: "Listening to your excuses", type: ActivityType.Listening },
  { name: "Watching you pretend to work", type: ActivityType.Watching },
  { name: "Playing nice... for now!", type: ActivityType.Playing },
  { name: "Watching you struggle", type: ActivityType.Watching },
  { name: "Playing dumb", type: ActivityType.Playing },
  { name: "Watching you panic", type: ActivityType.Watching },
  { name: "Playing it cool", type: ActivityType.Playing },
  { name: "Watching your mess", type: ActivityType.Watching },
  { name: "Playing along", type: ActivityType.Playing },
  { name: "Watching your every move", type: ActivityType.Watching },
  { name: "Playing hide and seek", type: ActivityType.Playing },
  { name: "Watching the world burn", type: ActivityType.Watching },
  { name: "Listening to your problems", type: ActivityType.Listening },
  { name: "Watching your every mistake", type: ActivityType.Watching },
  { name: "Playing with your mind", type: ActivityType.Playing },
  { name: "Playing nice with everyone", type: ActivityType.Playing },
  { name: "Watching you fail again", type: ActivityType.Watching },
  { name: "Listening to endless drama", type: ActivityType.Listening },
  { name: "Playing with broken hearts", type: ActivityType.Playing },
  { name: "Watching you overthink everything", type: ActivityType.Watching },
  { name: "Listening endless excuses", type: ActivityType.Listening },
  { name: "Playing on borrowed time", type: ActivityType.Playing },
  { name: "Listening you complain", type: ActivityType.Listening },
  { name: "Watching you lose control", type: ActivityType.Watching },
  { name: "Listening to bad advices", type: ActivityType.Listening },
  { name: "Playing tricks on you", type: ActivityType.Playing },
  { name: "Watching your bold moves", type: ActivityType.Watching },
  { name: "Listening to daily drama", type: ActivityType.Listening },
  { name: "Watching you act tough", type: ActivityType.Watching },
  { name: "Playing dumb today", type: ActivityType.Playing },
  { name: "Watching your cringe texts", type: ActivityType.Watching },
  { name: "Playing with fire", type: ActivityType.Playing }
];

let currentAvatarIndex = 0;
let currentStatusIndex = 0;
let isAvatarChanging = false;
let lastAvatarChange = 0;
const MIN_AVATAR_COOLDOWN = 6 * 60 * 60 * 1000; // 6 hours (Discord strictly limits avatar changes)

async function changeBotAvatar(client) {
  if (isAvatarChanging) return;

  // Prevent hitting Discord's strict avatar rate limit
  if (Date.now() - lastAvatarChange < MIN_AVATAR_COOLDOWN) {
    return;
  }

  isAvatarChanging = true;
  try {
    const avatarPath = path.resolve(__dirname, avatars[currentAvatarIndex]);
    currentAvatarIndex = (currentAvatarIndex + 1) % avatars.length;

    if (!fs.existsSync(avatarPath)) {
      isAvatarChanging = false;
      return;
    }

    const imageBuffer = await fs.promises.readFile(avatarPath);
    await client.user.setAvatar(imageBuffer);
    lastAvatarChange = Date.now();
    console.log("Successfully rotated bot avatar.");
  } catch (error) {
    if (error.rawError?.message?.includes("AVATAR_RATE_LIMIT") || error.message?.includes("AVATAR_RATE_LIMIT")) {
      console.warn("Discord avatar rate limit active. Backing off for 6 hours.");
      lastAvatarChange = Date.now(); // Back off to avoid spamming Discord
    } else {
      console.error("Failed to change bot avatar:", error.message);
    }
  } finally {
    isAvatarChanging = false;
  }
}

function changeStatus(client) {
  try {
    const status = statuses[currentStatusIndex];
    client.user.setActivity(status.name, { type: status.type });
    currentStatusIndex = (currentStatusIndex + 1) % statuses.length;
  } catch (error) {
    console.error("Failed to change bot status:", error.message);
  }
}

function startTasks(client, botStatusChangeTime = 1, botIconChangeHours = 6) {
  // Start status activity rotation (every 1 minute)
  changeStatus(client);
  setInterval(() => changeStatus(client), botStatusChangeTime * 60 * 1000);

  // Avatar rotation (every 6 hours)
  setInterval(() => changeBotAvatar(client), botIconChangeHours * 60 * 60 * 1000);
}

module.exports = { changeBotAvatar, changeStatus, startTasks };