import fs from "fs-extra";
import { prisma, SONARR_BLACKHOLE, RADARR_BLACKHOLE } from "../init-config";
import { MediaManager, TorrentFileType, TorrentStatus } from "../types";

function getTorrentFileType(filename: string): TorrentFileType {
  const filename_lower = filename.toLowerCase();
  if (filename_lower.endsWith(".torrent")) return TorrentFileType.TORRENT;
  else if (filename_lower.endsWith(".magnet")) return TorrentFileType.MAGNET;
  throw "Non-torrent file provided";
}

// True for *.torrent and *.magnet files
function isTorrentFile(filename: string): boolean {
  return [".torrent", ".magnet"].some((ext) =>
    filename.toLowerCase().endsWith(ext)
  );
}

// Check if a new torrent file is added to the blackhole directories and add them to the database
async function checkForNewTorrents() {
  try {
    // Get all files from blackhole directories
    let [sonarr_files, radarr_files] = await Promise.all([
      fs.readdir(SONARR_BLACKHOLE),
      fs.readdir(RADARR_BLACKHOLE),
    ]);

    // Map file type and category to torrent file
    let torrent_files = sonarr_files.filter(isTorrentFile).map((file) => ({
      filename: file,
      type: getTorrentFileType(file),
      media_manager: MediaManager.SONARR,
    }));
    torrent_files.push(
      ...radarr_files.filter(isTorrentFile).map((file) => ({
        filename: file,
        type: getTorrentFileType(file),
        media_manager: MediaManager.RADARR,
      }))
    );

    // Insert new files in the table
    await prisma.$transaction(
      torrent_files.map((file) =>
        prisma.torrent.upsert({
          where: {
            filename_media_manager: {
              filename: file.filename,
              media_manager: file.media_manager,
            },
          },
          update: {}, // If entry exists, don't update
          create: {
            ...file,
            status: TorrentStatus.NEW,
          },
        })
      )
    );
  } catch (error) {
    console.error(error);
  }
}

export default checkForNewTorrents;
