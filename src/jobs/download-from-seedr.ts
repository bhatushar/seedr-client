import fs from "fs-extra";
import path from "path";
import Fuse from "fuse.js";
import {
  prisma,
  RADARR_DOWNLOAD,
  RADARR_WATCH,
  SONARR_DOWNLOAD,
  SONARR_WATCH,
} from "../init-config";
import { MediaManager, TorrentStatus } from "../types";
import * as seedrApi from "../seedr-api";
import { Torrent } from "@prisma/client";

// Return list of torrents that have finished downloading on Seedr
async function getFinishedTorrents() {
  // Get all torrents that have finished downloading on Seedr
  const seedr_folders = await seedrApi.getRootContent();
  // Seedr may change the folder name if it contains illegal characters
  // So, using fuzzy searching to match remote torrents with local database
  const fuse = new Fuse(seedr_folders, { keys: ["name"] });

  // All torrents that were uploaded to Seedr
  const uploaded_torrents = await prisma.torrent.findMany({
    where: { status: TorrentStatus.UPLOADED },
  });

  // Torrents that exist in Seedr root directory (finished downloading)
  const finished_torrents = uploaded_torrents.reduce(
    (torrents: Torrent[], current: Torrent) => {
      const matches = fuse.search(current.torrent_name as string);
      if (matches.length === 0) return torrents;
      const finished: Torrent = { ...current, seedr_id: matches[0].item.id };
      torrents.push(finished);
      return torrents;
    },
    []
  );
  return finished_torrents;
}

// Store Seedr ID of finished torrents
async function saveSeedrIds(finished_torrents: Torrent[]) {
  return prisma.$transaction(
    finished_torrents.map((torrent) =>
      prisma.torrent.update({
        where: { torrent_name: torrent.torrent_name as string },
        data: { seedr_id: torrent.seedr_id },
      })
    )
  );
}

// Move files from download directory to watch folder, update torrent status
const onDownloadSuccess = async (seedr_id: number, download_path: string) => {
  try {
    // Mark as downloaded so other downloads can start
    const downloaded_torrent = await prisma.torrent.update({
      where: { seedr_id },
      data: {
        status: TorrentStatus.DOWNLOADED,
      },
    });
    console.log("Download completed: ", download_path);

    // Move downloads to the watch folder
    const move_path =
      downloaded_torrent.media_manager === MediaManager.SONARR
        ? SONARR_WATCH
        : RADARR_WATCH;
    const download_files = await fs.readdir(download_path);
    await Promise.all(
      download_files.map((filename) => {
        const src = path.join(download_path, filename);
        const dst = path.join(move_path, filename);
        return fs.move(src, dst);
      })
    );
    await prisma.torrent.update({
      where: {
        filename_media_manager: {
          filename: downloaded_torrent.filename,
          media_manager: downloaded_torrent.media_manager,
        },
      },
      data: {
        status: TorrentStatus.COMPLETED,
      },
    });
  } catch (error) {
    console.error(error);
  }
};

// Revert torrent state to "uploaded" and remove partial downloads
const onDownloadFail = async (seedr_id: number, download_path: string) => {
  await prisma.torrent.update({
    where: { seedr_id },
    data: { status: TorrentStatus.UPLOADED },
  });
  await fs.rm(download_path, { recursive: true, force: true });
};

async function downloadFromSeedr() {
  const activeDownloads = await prisma.torrent.count({
    where: {
      status: TorrentStatus.DOWNLOADING,
    },
  });
  // Only download one file at a time to preserve bandwidth
  if (activeDownloads) return;

  const finished_torrents = await getFinishedTorrents();
  if (finished_torrents.length === 0) return; // No torrent to download
  await saveSeedrIds(finished_torrents);

  // Prepare download
  const download = finished_torrents[0]; // Grab the first torrent from Seedr
  const base_path =
    download.media_manager === MediaManager.SONARR
      ? SONARR_DOWNLOAD
      : RADARR_DOWNLOAD;
  const download_path = path.join(base_path, `${download.seedr_id}`);
  await fs.mkdir(download_path, { recursive: true });

  // Start downlaoding
  console.log("Downloading: ", download);
  seedrApi.downloadFolder(
    download.seedr_id as number,
    download_path,
    async () => {
      await onDownloadSuccess(download.seedr_id as number, download_path);
    },
    async (error) => {
      console.error(error);
      await onDownloadFail(download.seedr_id as number, download_path);
    }
  );
  await prisma.torrent.update({
    where: { seedr_id: download.seedr_id as number }, // Guaranteed to be a number
    data: { status: TorrentStatus.DOWNLOADING },
  });
}

export default downloadFromSeedr;
