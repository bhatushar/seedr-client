import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config();

if (!process.env.SEEDR_EMAIL || !process.env.SEEDR_PASSWORD) {
  console.error("Seedr credentials are not provided");
  process.exit(1);
}
const { SEEDR_EMAIL, SEEDR_PASSWORD } = process.env;

// Blackhole directories may be undefined if respective services are not being used
const SONARR_BLACKHOLE =
  process.env.SONARR_BLACKHOLE || path.join(__dirname, "../dump");
const RADARR_BLACKHOLE =
  process.env.RADARR_BLACKHOLE || path.join(__dirname, "../dump");

// Download paths
const SONARR_DOWNLOAD =
  process.env.SONARR_DOWNLOAD || path.join(SONARR_BLACKHOLE, "download");
const RADARR_DOWNLOAD =
  process.env.RADARR_DOWNLOAD || path.join(RADARR_BLACKHOLE, "download");

const prisma = new PrismaClient();

export {
  prisma,
  SEEDR_EMAIL,
  SEEDR_PASSWORD,
  SONARR_BLACKHOLE,
  RADARR_BLACKHOLE,
  SONARR_DOWNLOAD,
  RADARR_DOWNLOAD,
};
