-- CreateTable
CREATE TABLE "torrents" (
    "filename" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "media_manager" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "seedr_id" INTEGER,
    "torrent_name" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "torrents_seedr_id_key" ON "torrents"("seedr_id");

-- CreateIndex
CREATE UNIQUE INDEX "torrents_torrent_name_key" ON "torrents"("torrent_name");

-- CreateIndex
CREATE UNIQUE INDEX "torrents_filename_media_manager_key" ON "torrents"("filename", "media_manager");
