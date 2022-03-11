# seedr-client

Seedr.cc download client to connect with Sonarr/Radarr.

Application workflow:

1. Sonarr/Radarr adds a `.torrent` or `.magnet` file to the blackhole.
2. seedr-client picks up the file and uploads it to seedr.cc.
3. Once the torrent finishes downloading on seedr.cc, it is copied to the local machine.
4. Once fetching is complete, the files are moved to the Sonarr/Radarr watch folder.

## Installation

Clone the project:

```
git clone https://github.com/bhatushar/seedr-client.git
```

Define the environment variables in a `.env` file. See `.env.sample` for reference.

Install the packages:

```
yarn install
```

Create the SQLite database:

```
yarn prisma migrate deploy
```

Compile the Typescript files:

```
yarn build
```

Start the application

```
yarn start
```
