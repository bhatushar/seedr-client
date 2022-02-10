// Application responsible for managing torrent after downloading
enum MediaManager {
  SONARR = "sonarr",
  RADARR = "radarr",
}

enum TorrentFileType {
  TORRENT = "torrent",
  MAGNET = "magnet",
}

enum TorrentStatus {
  NEW = "new",
  ADDED_TO_SEEDR = "addedToSeedr",
  DOWNLOADING = "downloading",
  UNZIPPING = "unzipping",
  COMPLETED = "completed",
}

export { MediaManager, TorrentFileType, TorrentStatus };
