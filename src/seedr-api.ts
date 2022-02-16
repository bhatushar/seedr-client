import axios from "axios";
import FormData from "form-data";
import { createReadStream } from "fs";
import { SEEDR_EMAIL, SEEDR_PASSWORD } from "./init-config";
import unzipper from "unzipper";

interface ISeedrFolder {
  id: number;
  name: string;
  size: number;
  last_update: string;
}

interface ISeedrTorrent {
  result: boolean;
  code: number;
  user_torrent_id: number;
  title: string;
  torrent_hash: string;
}

async function getRootContent(): Promise<ISeedrFolder[]> {
  try {
    const response = await axios.get("https://www.seedr.cc/rest/folder", {
      auth: {
        username: SEEDR_EMAIL,
        password: SEEDR_PASSWORD,
      },
    });
    return response.data.folders;
  } catch (error) {
    console.error(error);
    return [];
  }
}

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
  } catch (error) {
    console.error(error);
  }
}

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
  } catch (error) {
    console.error(error);
  }
}

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
  } catch (error) {
    on_fail(error);
  }
}

export {
  ISeedrFolder,
  ISeedrTorrent,
  getRootContent,
  addTorrentMagnet,
  addTorrentFile,
  downloadFolder,
};
