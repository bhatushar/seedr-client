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

const prisma = new PrismaClient();

export {
  prisma,
  SEEDR_EMAIL,
  SEEDR_PASSWORD,
  SONARR_BLACKHOLE,
  RADARR_BLACKHOLE,
};
