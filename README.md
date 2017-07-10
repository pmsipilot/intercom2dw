# Intercom2DW

Intercom2DW is an attempt at loading all the data available in an [Intercom](https://www.intercom.com/) application.

## Why?

Intercom is great, really, but it lacks advanced analytics capabilities. We wanted to be able to analyze the data we
have in an advanced manner so we built Intercom2DW: a simple application that will load all your data into a data
warehouse connected to [Metabase](http://www.metabase.com/) to let you build the queries you want and need.

## Caveats

The Intercom API is not meant to be used as a datasource for such an pplication. To be honest, an API is not really the
best thing to use when it comes to loading data.

We sent some kind of [RFC](rfc.md) to the Intercom team. We are now wainting to see if they can and want to implement such
things to help us do what we want.

**Intercom2DW actually works but it sends a pretty high number of HTTP requests to the API. It does so with respect to the
rate limit and other things that are enforced by Intercom but It will for sure send many many many HTTP requests and take
a while depending on the quantity of things you will have to load.**

**Be kind, and if you try Intercom2DW, try to launch the application only once in a week or something like that. Or get in
touch with the Intercom team to let them know what you are doing.**

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