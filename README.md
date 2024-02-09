> [!WARNING]
> ***THIS PROJECT IS NOT SUPPORTED ANYMORE!***

## Solana validators monitoring

Solana validators performance monitoring like skip rate and downtime

## Installation

```bash
$ yarn install
```

## Run via docker-compose

1. Use `.env.example` file content to create your own `.env` file
2. Build app image via `docker-compose build app`
3. Create `.volumes` directory from `docker` directory:
 ```bash
 cp -r docker .volumes
 chown -R 70:70 .volumes/pgdata
 chown -R 65534:65534 .volumes/prometheus
 chown -R 65534:65534 .volumes/alertmanager
 chown -R 472:472 .volumes/grafana
 ```
4. Run `docker-compose up -d`
5. Open Grafana UI at `http://localhost:8082/`
   (login: `admin`, password: `MYPASSWORT`) and wait
   first app cycle execution for display data

## Run via node

1. Run `yarn install`
2. Run DB
 ```bash
 docker-compose up -d db
 ```
3. Tweak `.env` file from `.env.example`
4. Run `npm run build`
5. Run `npm run start:debug`


## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

## License

API Template is [MIT licensed](LICENSE).

## Release flow

To create new release:

1. Merge all changes to the `master` branch
1. Navigate to Repo => Actions
1. Run action "Prepare release" action against `master` branch
1. When action execution is finished, navigate to Repo => Pull requests
1. Find pull request named "chore(release): X.X.X" review and merge it with "Rebase and merge" (or "Squash and merge")
1. After merge release action will be triggered automatically
1. Navigate to Repo => Actions and see last actions logs for further details 
