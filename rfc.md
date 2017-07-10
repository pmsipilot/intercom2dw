---
project: Intercom API
reporter: Julien Bianchi <contact@jubianchi.fr>
location: France
date: 2017-06-15
---

Intercom API as a datasource with incremental updates
=================

> **TL;DR** We use the Intercom API endpoints to load all the data we gathered to one of our internal datastore which is linked to our operational softwares (CRM, Accounting, ...). The actual API is fine but it does not allow for easy incremental loading. Let's try to make it better :wink:

## ℹ️ Wishlist

* We would like to load the Intercom data **on a daily basis**;
* We would like to load **as much data as possible in an efficient manner**;
* Data includes **admins, users, leads, tags, segments, companies, conversations, events**;
* We would like to be able to **incrementaly** load the data.

## ℹ️ Actual implementation

We built a small utility, written in Javascript, wich hits the API to fetch the data. The process it as follow:

* Fetch **all tags**, load them in the database;
* Fetch **all segments**, load them in the database;
* Fetch **all companies**, load them in the database;
* Fetch **all leads**, load them in the database, link them to companies, tags and segments;
* Fetch **all users**, load them in the database, link them to companies, tags and segments;
* Fetch **all admins**, load them in the database;
* Fetch **all conversations**, load them in the database, link them to users and admins;
* (try to) Fetch **all events** for each user, load them in the database, link them to users.

_:pencil: Side note: API requests are automatically delayed if the client application reaches the rate-limit._

In this list, we can distinguish two sorts of resources: small ones (tags for example) and big ones (users).

Small resources are not linked to anything (they are top-level, parent, resources) with a small number of attributes. They are also likely to exist in a limited number in Intercom apps.

Big resources have a large number of attributes (users for example have something like 20 attributes and if we flatten location and other things, we easily reach 30-40 attributes). They are also linked to many things (companies, events, conversations).

## ℹ️ Limitations

While loading all tags, segments or even admins does not seem to be a problem for both users and Intercom backend, loading the whole conversations or users/events dataset could be a problem: it involves a large amount of API requests and a large amount of data to be inserted/updated in the database.

We can mitigate the problem on the users endpoints using some existing parameters:

* Use the `created_since` to fetch only new users;
* User the `sort=updated_at&order=desc` to fetch updates.

Fetching only new users is easy with the actual API. Fetching and writing updates to the database is harder, even when we using the `sort` and `order` parameters: the client application has to know when it reached a point where there is no more updates to handle. It may be really hard.

Finally if the application has any strategy to handle everything correctly, the `created_since`, `sort` and `order` parameters do not exist on every endpoints where they could be useful.

Loading every single entity each time we want to update our datastore takes time. Really.

It also requires a lot of read/writes operations on the database. Here is a typical SQL query:

```sql
INSERT INTO "user"
VALUES(
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
    $23, $24, $25, $26, $27
)
ON CONFLICT (id) DO
UPDATE SET
    user_id=$2, email=$3, phone=$4, name=$5,
    updated_at=$6, last_seen_ip=$7, enabled=$8, last_request_at=$9,
    unsubscribed_from_emails=$10, signed_up_at=$11, created_at=$12, session_count=$13,
    user_agent_data=$14, pseudonym=$15, anonymous=$16, avatar=$17,
    social_profiles=$18, city_name=$19, continent_code=$20, country_code=$21,
    country_name=$22, latitude=$23, longitude=$24, postal_code=$25,
    region_name=$26, timezone=$27
WHERE "user".id=$1
```

In the worst case, this query will involves writes, reads, constraint checks, ... On a 10k+ user list, it generated an heavy load on the database.

We won't be able to remove all these operations, but by reducing the data we fetch to only what's really necessary, we'll be able to decrease on the workload on the database.

## ℹ️ Proposal

To solve those limitations and make creating client application more developer-friendly and more backend-friendly, I'd like to propose the addition of a new parameter: `since`.

This new parameters would be added on every timestamped endpoints and would work much the same way as `created_since` with a single difference that would make it really powerful.

`created_since` only filters on the `created_at` attribute. `since` would filter both `created_at` and `updated_at` attributes allowing any client to fetch newly created or updated resources.

If a client application sends a `GET` request on en ednpoint with `?since=2017-06-14` it would translate to the following SQL on the backend side: `WHERE created_at >= '2017-06-14' OR updated_at >= '2017-06-14'`.

This parameter may be applied to both "standard" API endpoints and scroll endpoints.

_:pencil: Side note: A scroll endpoint on events and conversations would be awesome._

This would allow using real incremental updates of the database without emitting to much API calls and thus, avoiding overloading Intercom backend, avoiding reaching rate limits to quickly (which is likely to end in delaying requests in a well-implemented client) and avoiding too much reads/writes on the database side.