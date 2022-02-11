import path from "path";
import fs from "fs/promises";
import { prisma, RADARR_BLACKHOLE, SONARR_BLACKHOLE } from "../init-config";
import { MediaManager, TorrentFileType, TorrentStatus } from "../types";
import * as seedrApi from "../seedr-api";
import { Torrent } from "@prisma/client";

type NewTorrents = Pick<Torrent, "filename" | "media_manager" | "type">;
type UploadedTorrents = Pick<
  Torrent,
  "filename" | "media_manager" | "torrent_name"
>;

async function attemptUpload(torrents: NewTorrents[]) {
  return Promise.all(
    torrents.map(async ({ filename, media_manager, type }) => {
      try {
        const base_path =
          media_manager == MediaManager.SONARR
            ? SONARR_BLACKHOLE
            : RADARR_BLACKHOLE;
        const torrent_path = path.join(base_path, filename);
        if (type == TorrentFileType.MAGNET) {
          // For *.magnet files, read the content and pass it as a url
          const magnet_link = await fs.readFile(torrent_path, "utf8");
          return seedrApi.addTorrentMagnet(magnet_link);
        }
        // For *.torrent files
        return seedrApi.addTorrentFile(torrent_path);
      } catch (error) {
        console.error(error);
        console.log(`[${media_manager}]Failed to upload: ${filename}`);
      }
    })
  );
}

function getSuccessfulUploads(
  torrents: NewTorrents[],
  results: (seedrApi.ISeedrTorrent | undefined)[]
) {
  return torrents.reduce((uploaded: UploadedTorrents[], torrent, i) => {
    const result = results[i];
    if (result)
      uploaded.push({
        filename: torrent.filename,
        media_manager: torrent.media_manager,
        torrent_name: result.title,
      });
    return uploaded;
  }, []);
}

async function uploadToSeedr() {
  try {
    const torrents = await prisma.torrent.findMany({
      select: { filename: true, media_manager: true, type: true },
      where: { status: TorrentStatus.NEW },
    });
    console.log("Torrents to be uploaded: ", torrents);

    const results = await attemptUpload(torrents);
    const uploaded_torrents = getSuccessfulUploads(torrents, results);
    console.log("Torrents successfully uploaded: ", uploaded_torrents);

    // Mark uploaded torrent as ADDED_TO_SEEDR and save their torrent name
    await prisma.$transaction(
      uploaded_torrents.map(({ filename, media_manager, torrent_name }) => {
        return prisma.torrent.update({
          where: {
            filename_media_manager: { filename, media_manager },
          },
          data: { torrent_name, status: TorrentStatus.UPLOADED },
        });
      })
    );
  } catch (error) {
    console.error(error);
  }
}

export default uploadToSeedr;
