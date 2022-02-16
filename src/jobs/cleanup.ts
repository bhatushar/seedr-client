import fs from "fs-extra";
import path from "path";
import { TorrentStatus, MediaManager } from "../types";
import {
  prisma,
  SONARR_DOWNLOAD,
  RADARR_DOWNLOAD,
  SONARR_BLACKHOLE,
  RADARR_BLACKHOLE,
} from "../init-config";

// Remove database entires and download folders and torrents
async function cleanup() {
  const completed_torrents = await prisma.torrent.findMany({
    where: {
      status: TorrentStatus.COMPLETED,
    },
  });
  const download_paths = completed_torrents.map((torrent) => {
    let download_path =
      torrent.media_manager === MediaManager.SONARR
        ? SONARR_DOWNLOAD
        : RADARR_DOWNLOAD;
    download_path = path.join(download_path, `${torrent.seedr_id}`);
    return download_path;
  });
  const torrent_files = completed_torrents.map((torrent) => {
    let torrent_path =
      torrent.media_manager === MediaManager.SONARR
        ? SONARR_BLACKHOLE
        : RADARR_BLACKHOLE;
    torrent_path = path.join(torrent_path, torrent.filename);
    return torrent_path;
  });
  await Promise.all(download_paths.map((download) => fs.remove(download))); // Remove empty download directories
  await Promise.all(torrent_files.map((file) => fs.remove(file))); // Remove torrent file
  await prisma.torrent.deleteMany({
    where: {
      status: TorrentStatus.COMPLETED,
    },
  }); // Remove completed torrents from database
}

export default cleanup;
