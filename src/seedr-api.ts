import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import { logger, SEEDR_EMAIL, SEEDR_PASSWORD } from "./init-config";
import unzipper from "unzipper";

/**
 * Structure of Seedr Folder response
 */
interface ISeedrFolder {
  id: number;
  name: string;
  size: number;
  last_update: string;
}

/**
 * Structure of response data for uploading torrent to Seedr
 */
interface ISeedrTorrent {
  result: boolean;
  code: number;
  user_torrent_id: number;
  title: string;
  torrent_hash: string;
  error?: string;
}

/**
 * @returns List of folders on Seedr
 */
async function getRootFolders(): Promise<ISeedrFolder[]> {
  try {
    const response = await axios.get("https://www.seedr.cc/rest/folder", {
      auth: {
        username: SEEDR_EMAIL,
        password: SEEDR_PASSWORD,
      },
    });
    return response.data.folders;
  } catch (error: any) {
    logger.error({ method: "seedr.getRootFolders", message: error.message });
    return [];
  }
}

/**
 * Adds a torrent to Seedr via magnet link
 *
 * @param magnet_link
 * @returns Uploaded torrent data
 */
async function addTorrentMagnet(
  magnet_link: string
): Promise<ISeedrTorrent | undefined> {
  try {
    const response = await axios.post(
      "https://www.seedr.cc/rest/transfer/magnet",
      {
        magnet: magnet_link,
      },
      {
        auth: {
          username: SEEDR_EMAIL,
          password: SEEDR_PASSWORD,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    logger.error({ method: "seedr.addTorrentMagnet", message: error.message });
  }
}

/**
 * Adds a torrent to Seedr via torrent file
 *
 * @param file_path
 * @returns Uploaded torrent data
 */
async function addTorrentFile(
  file_path: string
): Promise<ISeedrTorrent | undefined> {
  try {
    const form = new FormData();
    form.append("file", createReadStream(file_path));
    const response = await axios.post(
      "https://www.seedr.cc/rest/transfer/file",
      form,
      {
        auth: {
          username: SEEDR_EMAIL,
          password: SEEDR_PASSWORD,
        },
        headers: form.getHeaders(),
      }
    );
    return response.data;
  } catch (error: any) {
    logger.error({ method: "seedr.addTorrentFile", message: error.message });
  }
}

/**
 * Downloads a folder from Seedr and unzips the download stream
 *
 * @param id Seedr folder ID
 * @param download_path Path to download files in
 * @param on_success Called if download completes successfully
 * @param on_fail Called if download fails
 */
async function downloadFolder(
  id: number,
  download_path: string,
  on_success: () => Promise<void> = () => Promise.resolve(undefined),
  on_fail: (error?: any) => Promise<void> = () => Promise.resolve(undefined)
) {
  try {
    const response = await axios.get(
      `https://www.seedr.cc/rest/folder/${id}/download`,
      {
        auth: {
          username: SEEDR_EMAIL,
          password: SEEDR_PASSWORD,
        },
        responseType: "stream",
      }
    );
    const parse_stream = unzipper.Extract({ path: download_path });
    response.data.pipe(parse_stream);
    parse_stream.on("finish", on_success);
    parse_stream.on("error", on_fail);
  } catch (error: any) {
    on_fail(error);
  }
}

export {
  ISeedrFolder,
  ISeedrTorrent,
  getRootFolders,
  addTorrentMagnet,
  addTorrentFile,
  downloadFolder,
};
