const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    // Add queries for UPI apps
    if (!manifest.queries) {
      manifest.queries = [];
    }

    // Ensure queries is an array
    if (!Array.isArray(manifest.queries)) {
      manifest.queries = [manifest.queries];
    }

    // Check if intent already exists
    const existingIntent = manifest.queries.find(
      (query) => query.intent && query.intent[0]?.data?.some(d => d.$?.scheme === 'upi')
    );

    if (!existingIntent) {
      manifest.queries.push({
        intent: [
          {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'upi' } }],
          },
        ],
      });
    }

    return config;
  });
};
