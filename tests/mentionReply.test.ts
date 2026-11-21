import assert from "assert";
import { settingsService } from "../src/services/settings.service";

async function runTests() {
  console.log("▶ Running Bot Mention Reply Tests...");

  const testGuildId = "test_guild_99999";

  // Test 1: Default Settings
  const defaults = settingsService.getSettings(testGuildId);
  assert.strictEqual(defaults.mentionReplyEnabled, true, "Default mentionReplyEnabled should be true");
  assert.strictEqual(defaults.mentionMessage, undefined, "Default mentionMessage should be undefined");
  assert.strictEqual(defaults.mentionChannelId, undefined, "Default mentionChannelId should be undefined");

  // Test 2: Default mention reply format with no channel
  let reply = settingsService.getMentionReply(testGuildId);
  assert.strictEqual(reply, "Need Help? go here: #general", "Should default to #general when no channel set");

  // Test 3: Set main channel and verify fallback
  await settingsService.setMainChannel(testGuildId, "1127657540021391501");
  reply = settingsService.getMentionReply(testGuildId);
  assert.strictEqual(reply, "Need Help? go here: <#1127657540021391501>", "Should use mainChannelId if mentionChannelId not set");

  // Test 4: Set custom target channel for mention
  await settingsService.setMentionChannel(testGuildId, "123456789012345678");
  reply = settingsService.getMentionReply(testGuildId);
  assert.strictEqual(reply, "Need Help? go here: <#123456789012345678>", "Should use mentionChannelId when set");

  // Test 5: Set custom message template with {channel} and {prefix}
  await settingsService.setMentionMessage(testGuildId, "Need assistance? Visit {channel} or type {prefix}help!");
  reply = settingsService.getMentionReply(testGuildId);
  assert.strictEqual(
    reply,
    "Need assistance? Visit <#123456789012345678> or type ?help!",
    "Should replace {channel} and {prefix} correctly"
  );

  // Test 6: Reset target channel
  await settingsService.resetMentionChannel(testGuildId);
  reply = settingsService.getMentionReply(testGuildId);
  assert.strictEqual(
    reply,
    "Need assistance? Visit <#1127657540021391501> or type ?help!",
    "Should fall back to main channel after resetting mention channel"
  );

  // Test 7: Reset custom message
  await settingsService.resetMentionMessage(testGuildId);
  reply = settingsService.getMentionReply(testGuildId);
  assert.strictEqual(
    reply,
    "Need Help? go here: <#1127657540021391501>",
    "Should revert to default message template after reset"
  );

  // Test 8: Toggle mention reply
  const disabled = await settingsService.toggleMentionReply(testGuildId, false);
  assert.strictEqual(disabled, false, "Should toggle to false");
  assert.strictEqual(settingsService.getSettings(testGuildId).mentionReplyEnabled, false);

  const reEnabled = await settingsService.toggleMentionReply(testGuildId);
  assert.strictEqual(reEnabled, true, "Should toggle back to true");
  assert.strictEqual(settingsService.getSettings(testGuildId).mentionReplyEnabled, true);

  // Clean up test guild
  const cache = (settingsService as any).cache;
  if (cache) delete cache[testGuildId];
  await settingsService.save();

  console.log("✅ All Bot Mention Reply Tests Passed Successfully!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
