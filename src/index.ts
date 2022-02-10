import fs from "fs/promises";
import cron from "node-cron";
import { SONARR_BLACKHOLE, RADARR_BLACKHOLE } from "./init-config";
import checkForNewTorrents from "./jobs/new-torrents";

async function main() {
  try {
    // Create directories if not exists
    await Promise.all([
      fs.mkdir(SONARR_BLACKHOLE, { recursive: true }),
      fs.mkdir(RADARR_BLACKHOLE, { recursive: true }),
    ]);

    // Every 5 seconds
    cron.schedule("*/5 * * * * *", async () => await checkForNewTorrents());
  } catch (err) {
    console.error(err);
  }
}

main();

// cron.schedule("*/5 * * * * *", () => {});
