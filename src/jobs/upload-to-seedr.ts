import path from "path";
import fs from "fs-extra";
import {
  logger,
  prisma,
  RADARR_BLACKHOLE,
  SONARR_BLACKHOLE,
} from "../init-config";
import { MediaManager, TorrentFileType, TorrentStatus } from "../types";
import * as seedrApi from "../seedr-api";
import { Torrent } from "@prisma/client";

type NewTorrents = Pick<Torrent, "filename" | "media_manager" | "type">;
type UploadedTorrents = Pick<
  Torrent,
  "filename" | "media_manager" | "torrent_name"
>;

/**
 * Sends upload request for provided torrent file or magnet link to Seedr
 *
 * @param torrents New torrents in the database
 * @returns List of responses from Seedr for respective upload request
 */
async function attemptUpload(torrents: NewTorrents[]) {
  return Promise.all(
    torrents.map(async ({ filename, media_manager, type }) => {
      try {
        const base_path =
          media_manager == MediaManager.SONARR
            ? SONARR_BLACKHOLE
            : RADARR_BLACKHOLE;
        const torrent_path = path.join(base_path, filename);
        if (type === TorrentFileType.MAGNET) {
          // For *.magnet files, read the content and pass it as a url
          const magnet_link = await fs.readFile(torrent_path, "utf8");
          return seedrApi.addTorrentMagnet(magnet_link);
        }
        // For *.torrent files
        return seedrApi.addTorrentFile(torrent_path);
      } catch (error: any) {
        logger.error({
          file: filename,
          provider: media_manager,
          message: error.message,
        });
      }
    })
  );
}

/**
 * Merges torrent with it corresponding result and filters out unsuccessful uploads
 *
 * @param torrents New torrents in the database (same as the one passed to attemptUpload)
 * @param results Seedr response to the upload request (returned by attemptUpload)
 * @returns List of torrent objects that were successfully added to Seedr along with their `torrent_name`
 */
function getSuccessfulUploads(
  torrents: NewTorrents[],
  results: (seedrApi.ISeedrTorrent | undefined)[]
) {
  return torrents.reduce((uploaded: UploadedTorrents[], torrent, i) => {
    const result = results[i];
    if (result) {
      if (result.error) {
        // File uploaded, but rejected by Seedr
        logger.error({
          file: torrent.filename,
          provider: torrent.media_manager,
          message: result.error,
        });
      } else {
        uploaded.push({
          filename: torrent.filename,
          media_manager: torrent.media_manager,
          torrent_name: result.title,
        });
        logger.info({
          file: torrent.filename,
          provider: torrent.media_manager,
          torrent: result.title,
          message: "Upload successful",
        });
      }
    } // else error handled by attemptUpload()

    return uploaded;
  }, []);
}

/**
 * Collects all newly added torrents (`status` = new) and attempts to upload them to Seedr.
 * Updates status of torrents that were successfully uploaded and store their `torrent_name`.
 */
async function uploadToSeedr() {
  try {
    const torrents = await prisma.torrent.findMany({
      select: { filename: true, media_manager: true, type: true },
      where: { status: TorrentStatus.NEW },
    });
    if (torrents.length === 0) return; // No torrents to upload

    const results = await attemptUpload(torrents);
    const uploaded_torrents = getSuccessfulUploads(torrents, results);

    // Mark uploaded torrent as UPLOADED and save their torrent name
    await prisma.$transaction(
      uploaded_torrents.map(({ filename, media_manager, torrent_name }) => {
        return prisma.torrent.update({
          where: { filename_media_manager: { filename, media_manager } },
          data: { torrent_name, status: TorrentStatus.UPLOADED },
        });
      })
    );
  } catch (error: any) {
    logger.error({ method: "jobs.uploadToSeedr", message: error.message });
  }
}

export default uploadToSeedr;
