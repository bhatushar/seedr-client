import fs from "fs/promises";
import cron from "node-cron";
import { SONARR_BLACKHOLE, RADARR_BLACKHOLE } from "./init-config";
import checkForNewTorrents from "./jobs/new-torrents";
import uploadToSeedr from "./jobs/upload-to-seedr";

async function main() {
  try {
    // Create directories if not exists
    await Promise.all([
      fs.mkdir(SONARR_BLACKHOLE, { recursive: true }),
      fs.mkdir(RADARR_BLACKHOLE, { recursive: true }),
    ]);

    // Every 5 seconds
    cron.schedule("*/5 * * * * *", async () => await checkForNewTorrents());
    // Every minute
    cron.schedule("* * * * *", async () => await uploadToSeedr());
    /*
      Uploading is a separate job, instead of being a subroutine of checking for new torrents.
      This ensures that uploading a newly added torrents fail at first, it can be retried without
      depending on whether a new torrent is added.
      Also, I just think it's better to invoke uploading at slower intervals since it takes a couple of seconds to finish.
    */
  } catch (err) {
    console.error(err);
  }
}

main();

// cron.schedule("*/5 * * * * *", () => {});
