/**
 * Application responsible for managing torrents after downloading
 *
 * Values for `torrents.media_manager`
 */
enum MediaManager {
  SONARR = "sonarr",
  RADARR = "radarr",
}

/**
 * Valid file types
 *
 * Values for `torrents.type`
 */
enum TorrentFileType {
  TORRENT = "torrent",
  MAGNET = "magnet",
}

/**
 * Possible state of a torrent
 *
 * Values for `torrents.status`
 */
enum TorrentStatus {
  NEW = "new",
  UPLOADED = "uploaded",
  DOWNLOADING = "downloading",
  DOWNLOADED = "downloaded",
  COMPLETED = "completed",
}

export { MediaManager, TorrentFileType, TorrentStatus };
