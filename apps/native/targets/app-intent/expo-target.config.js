/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "app-intent",
  name: "CoinGecko Siri",
  bundleIdentifier: "com.weihup.cgsiri.coingecko-intents",
  entitlements: {
    // Allow network access for calling our server
    "com.apple.security.network.client": true,
    // Allow outgoing network connections
    "com.apple.security.network.server": true,
    // Share data with main app if needed
    "com.apple.security.application-groups": config.ios?.entitlements?.["com.apple.security.application-groups"] || ["group.com.weihup.cgsiri.data"],
    // Required for App Intents
    "com.apple.developer.siri": true,
  },
  deploymentTarget: "16.0",
  frameworks: [
    "Foundation",
    "AppIntents"
  ]
});