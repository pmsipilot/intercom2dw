---
project: Intercom API
reporter: Julien Bianchi <contact@jubianchi.fr>
date: "2017-06-15"
reference: ""
location: France
version: 1.0.0
---

Intercom API as a datasource 
=================

> **TL;DR** We use the Intercom API endpoints to load all the data we gathered to one of our internal datastore which is linked to our operational softwares (CRM, Accounting, ...). The actual API is fine but it does not allow for easy incremental loading. Let's try to make it better :wink:

## :fa-info-circle: Wishlist

* We would like to load the Intercom data **on a daily basis**;
* We would like to load **as much data as possible in an efficient manner**;
* Data includes **admins, users, leads, tags, segments, companies, conversations, events**;
* We would like to be able to **incrementaly** load the data.

## :fa-info-circle: Actual implementation

We built a small utility, written in Javascript, wich hits the API to fetch the data. The process it as follow:

* Fetch **all tags**, load them in the database;
* Fetch **all segments**, load them in the database;
* Fetch **all companies**, load them in the database;
* Fetch **all leads**, load them in the database, link them to companies, tags and segments;
* Fetch **all users**, load them in the database, link them to companies, tags and segments;
* Fetch **all admins**, load them in the database;
* Fetch **all conversations**, load them in the database, link them to users and admins;
* (try to) Fetch **all events** for each user, load them in the database, link them to users.

In this list, we can distinguish two sorts of resources: small ones (tags for example) and big ones (users).

Small resources are not linked to anything (they are top-level, parent, resources) with a small number of attributes. They are also likely to exist in a limited number in Intercom apps.

Big resources have a large number of attributes (users for example have something like 20 attributes and if we flatten location and other things, we easily reach 30-40 attributes). They are also linked to many things (companies, events, conversations).

## :fa-info-circle: Limitations

While loading all tags, segments or even admins does not seem to be a problem for both users and Intercom backend, loading the whole conversations or users/events dataset could be a problem: it involves a large amount of API requests and a large amount of data to be inserted/updated in the database.

We can mitigate the problem on the users endpoints using some existing parameters:

* Use the `created_since` to fetch only new users;
* User the `sort=updated_at&order=desc` to fetch updates.

Fetching only new users is easy with the actual API. Fetching and writing updates to the database is harder, even when we using the `sort` and `order` parameters: the client application has to know when it reached a point where there is no more updates to handle. It may be really hard.

Finally if the application has any strategy to handle everything correctly, the `created_since`, `sort` and `order` parameters do not exist on every endpoints where they could be useful.

## :fa-info-circle: Proposal

* :pencil: As soon as you modify this document you will get a new unique document that belongs to you, so feel free to write anything you want. We support [CommonMark](http://commonmark.org/), and you can write `code`, FontAwesome icons :fa-flag:, and, obviously, Emoji too! :clap:;
* :family: Let your friends review your content by **sharing** the **full URL** with them;
* :page_facing_up: You can export your document as a **PDF** using the in-browser print feature (`Cmd + P` or `Ctrl + P` on Windows);
* :airplane: Monod is offline-first, meaning you can use it all the time. When you go back online, it automatically synchronizes your work;
* :lock: Everything is **encrypted in the browser** (_i.e._ on your laptop), the server does not have access or any way to decrypt your documents;
* :warning: There is no document management system: be sure to bookmark or write down the full URLs of your documents somewhere.

Read more about how and why we built Monod at: https://tailordev.fr/blog/.

---
*[Let us know your thoughts](mailto:hello@tailordev.fr?subject=About%20Monod). We would :heart: to hear from you!*



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