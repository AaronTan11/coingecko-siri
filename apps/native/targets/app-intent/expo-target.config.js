/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "app-intent",
  name: "CoinGecko Siri",
  bundleIdentifier: ".coingecko-intents",
  entitlements: {
    // Allow network access for calling our server
    "com.apple.security.network.client": true,
    // Share data with main app if needed
    "com.apple.security.application-groups": config.ios?.entitlements?.["com.apple.security.application-groups"] || ["group.com.weihup.cgsiri.data"],
  },
  deploymentTarget: "16.0",
  frameworks: [
    "Foundation",
    "AppIntents"
  ]
});