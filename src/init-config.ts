import dotenv from "dotenv";

dotenv.config();

if (!process.env.SEEDR_EMAIL || !process.env.SEEDR_PASSWORD) {
  console.error("Seedr credentials are not provided");
  process.exit(1);
}

const { SEEDR_EMAIL, SEEDR_PASSWORD } = process.env;

export { SEEDR_EMAIL, SEEDR_PASSWORD };
