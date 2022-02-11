declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Credentials for seedr.cc authentication
      SEEDR_EMAIL: string;
      SEEDR_PASSWORD: string;
      // Folders to watch for new torrent files
      SONARR_BLACKHOLE: string;
      RADARR_BLACKHOLE: string;
      // Path to download files in
      SONARR_DOWNLOAD: string;
      RADARR_DOWNLOAD: string;
    }
  }
}

export {};
