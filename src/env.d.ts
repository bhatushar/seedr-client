declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Credentials for seedr.cc authentication
      SEEDR_EMAIL: string;
      SEEDR_PASSWORD: string;
    }
  }
}

export {};
