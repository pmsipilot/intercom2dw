# Intercom2DW [![Build Status](https://travis-ci.org/pmsipilot/intercom2dw.svg?branch=master)](https://travis-ci.org/pmsipilot/intercom2dw)

Intercom2DW is an attempt at loading all the data available in an [Intercom](https://www.intercom.com/) application.

## Why?

Intercom is great, really, but it lacks advanced analytics capabilities. We wanted to be able to analyze the data we
have in an advanced manner so we built Intercom2DW: a simple application that will load all your data into a data
warehouse connected to [Metabase](http://www.metabase.com/) to let you build the queries you want and need.

## Test it

The repository contains a `docker-compose` configuration file that will let you start everything you need: a PostgreSQL
database, a Metabase instance and the Intercom2DW container. Here is how:

```sh
docker-compose up -d
docker-compose run intercom2dw bash
```

You will now have a prompt from the Intercom2DW container. From here you can start loading your data:

```sh
node /src/index.js --help
```

## Deploy

You will find a `docker-compose-prod.yml` template that you can use to deploy Intercom2DW and its database to any Docker
host.

Copy this file, tweak it and start the service to see your data going from the API to your database.

## Configuration

You'll be able to tweak Intercom2DW using several environment variables. Here they are:

| Variable                  | Default                    | Description                                                                |
|---------------------------|----------------------------|----------------------------------------------------------------------------|
| `INTERCOM2DW_APP_ID`      |                            | Your Intercom application ID only if you are using api key authentication. |
| `INTERCOM2DW_APP_TOKEN`   |                            | Your Intercom api key or your access token.                                |
| `INTERCOM2DW_API_URL`     | `https://api.intercom.io`  | The URL to use to reach the Intercom API.                                  |
| `INTERCOM2DW_DB_HOST`     | `db`                       | The host name to use to connect to the PostgreSQL database.                |
| `INTERCOM2DW_DB_PORT`     | `5432`                     | The TCP port to use to connect to the PostgreSQL database.                 |
| `INTERCOM2DW_DB_USER`     | `intercom2dw`              | The username to use to connect to the PostgreSQL database.                 |
| `INTERCOM2DW_DB_PASSWORD` | `intercom2dw`              | The password to use to connect to the PostgreSQL database.                 |
| `INTERCOM2DW_DB_NAME`     | `intercom2dw`              | The database name to use to connect to the PostgreSQL database.            |
| `INTERCOM2DW_CRON`        | `0 */12 * * *`             | The cron expression to use to schedule process executions.                 |

## Caveats

The Intercom API is not meant to be used as a datasource for such an application. To be honest, an API is not really the
best thing to use when it comes to loading data.

We sent some kind of [RFC](rfc.md) to the Intercom team. We are now wainting to see if they can and want to implement such
things to help us do what we want. Because they might already be busy building an awesome product we don't expect them to
implement everything we need so we worked with them to ensure our tool won't make you blacklisted on their backend.

**Intercom2DW actually works but it sends a pretty high number of HTTP requests to the API. It does so with respect to the
rate limit and other things that are enforced by Intercom but it will for sure send many many many HTTP requests and take
a while depending on the amount of data you will have to load.**

**Be kind, and if you try Intercom2DW, try to launch the application only once in a week or something like that. Or get in
touch with the Intercom team to let them know what you are doing.**

## License

This project is released under the [MIT license](LICENSE).
