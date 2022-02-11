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
  UPLOADED = "uploaded",
  DOWNLOADING = "downloading",
  UNZIPPING = "unzipping",
  COMPLETED = "completed",
}

export { MediaManager, TorrentFileType, TorrentStatus };
