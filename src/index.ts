import fs from "fs-extra";
import cron from "node-cron";
import {
  SONARR_BLACKHOLE,
  RADARR_BLACKHOLE,
  SONARR_DOWNLOAD,
  RADARR_DOWNLOAD,
  SONARR_WATCH,
  RADARR_WATCH,
} from "./init-config";
import checkForNewTorrents from "./jobs/new-torrents";
import uploadToSeedr from "./jobs/upload-to-seedr";
import downloadFromSeedr from "./jobs/download-from-seedr";
import cleanup from "./jobs/cleanup";

async function main() {
  try {
    // Create necessary directories
    const directories = [
      SONARR_BLACKHOLE,
      RADARR_BLACKHOLE,
      SONARR_DOWNLOAD,
      RADARR_DOWNLOAD,
      SONARR_WATCH,
      RADARR_WATCH,
    ];
    await Promise.all(directories.map((dir) => fs.mkdirp(dir)));

    // Schedule jobs
    cron.schedule("0 * * * * *", async () => await checkForNewTorrents());
    cron.schedule("15 * * * * *", async () => await uploadToSeedr());
    cron.schedule("30 * * * * *", async () => await downloadFromSeedr());
    cron.schedule("45 * * * * *", async () => cleanup());
  } catch (err) {
    console.error(err);
  }
}

main();
