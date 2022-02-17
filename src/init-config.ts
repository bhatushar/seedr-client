import dotenv from "dotenv";
import path from "path";
import winston, { format, transports } from "winston";
import "winston-daily-rotate-file";
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

// Watch paths
const SONARR_WATCH =
  process.env.SONARR_WATCH || path.join(SONARR_BLACKHOLE, "watch");
const RADARR_WATCH =
  process.env.RADARR_WATCH || path.join(RADARR_BLACKHOLE, "watch");

const prisma = new PrismaClient();

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSSZZ" }),
    format.json()
  ),
  transports: [
    new transports.DailyRotateFile({
      dirname: process.env.LOG_DIR || "./logs/",
      filename: "app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxFiles: 7,
    }),
  ],
});

export {
  prisma,
  logger,
  SEEDR_EMAIL,
  SEEDR_PASSWORD,
  SONARR_BLACKHOLE,
  RADARR_BLACKHOLE,
  SONARR_DOWNLOAD,
  RADARR_DOWNLOAD,
  SONARR_WATCH,
  RADARR_WATCH,
};
