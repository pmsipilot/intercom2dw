CREATE TABLE lead_tag_full (
  lead_id TEXT NOT NULL,
  name TEXT NOT NULL,
  CONSTRAINT pk_lead_tag_full PRIMARY KEY (lead_id, name),
  CONSTRAINT fk_lead_tag_full_user_id FOREIGN KEY (lead_id) REFERENCES lead(id)
);

INSERT INTO lead_tag
SELECT lead.id, tag.name
FROM lead
JOIN lead_tag ON lead_tag.lead_id = lead.id
JOIN tag ON lead_tag.tag_id = tag.id;



CREATE TABLE user_tag_full (
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  CONSTRAINT pk_user_tag_full PRIMARY KEY (user_id, name),
  CONSTRAINT fk_user_tag_full_user_id FOREIGN KEY (user_id) REFERENCES "user" (id)
);

INSERT INTO user_tag
SELECT "user".id, tag.name
FROM "user"
JOIN user_tag ON user_tag.user_id = "user".id
JOIN tag ON user_tag.tag_id = tag.id;

DROP MATERIALIZED VIEW lead_tag;
DROP TABLE lead_tag_assoc;

DROP MATERIALIZED VIEW user_tag;
DROP TABLE user_tag;

SELECT COUNT(*) FROM user_tag_assoc;

DROP INDEX public.lead_tag.pk_user_tag CASCADE;

REFRESH MATERIALIZED VIEW CONCURRENTLY lead_tag;
REFRESH MATERIALIZED VIEW CONCURRENTLY user_tag;

SELECT "user".id, company.name
FROM "user"
JOIN user_company ON user_company.user_id="user".id
JOIN company ON company.id=user_company.company_id

TRUNCATE TABLE conversation;

TRUNCATE company CASCADE;

SELECT CONCAT('USERS: ', COUNT(*)) FROM "user" UNION
SELECT CONCAT('OUTDATED: ', COUNT(*)) FROM outdated_user UNION
SELECT CONCAT('EVENTS: ', COUNT(*)) FROM "event" ORDER BY 1 ASC;


WITH user_event(user_id, created_at) AS (
  SELECT user_id, MAX(created_at) AS created_at
  FROM "event"
  GROUP BY user_id
)

SELECT "user".id
FROM "user"
LEFT JOIN user_event ON user_event.user_id = "user".id
WHERE user_event.created_at IS NULL
OR "user".last_request_at >= user_event.created_at;

SELECT COUNT(DISTINCT id) FROM outdated_user;

DROP TABLE "event" CASCADE;

-- https://www.periscopedata.com/blog/predicting-exponential-growth-with-sql.html
DROP TABLE IF EXISTS foo;
CREATE TABLE foo AS
WITH
  daily_new_users AS (
    SELECT
      to_timestamp(created_at)::DATE AS dt,
      COUNT(*) AS daily_ct
    FROM "event"
    WHERE to_timestamp(created_at)::DATE > '2015-03-31'
    GROUP BY 1
  ),
  daily_user_volume AS (
    SELECT
      dt,
      dt - '2015-03-31' AS dt_id, -- integer version of date
      (SELECT COUNT(*) FROM "event" WHERE to_timestamp(created_at)::DATE <= '2015-03-31') + SUM(daily_ct) OVER (
        ORDER BY dt
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ) AS user_ct
      FROM daily_new_users
    ),
    estimate_b AS (
      SELECT
        SUM(covar.s) / SUM(var.s) AS b
      FROM (
        SELECT
          (dt_id - avg(dt_id::FLOAT8) OVER ()) * (log(user_ct) - avg(log(user_ct)) over ()) AS s
        FROM daily_user_volume
      ) AS covar
      JOIN (
        SELECT POWER(dt_id - avg(dt_id::FLOAT8) OVER (), 2) AS s
        FROM daily_user_volume
      ) AS var ON TRUE
    ),
    estimate_a AS (
      SELECT
        avg(log(user_ct)) - avg(dt_id::FLOAT) * (SELECT b FROM estimate_b) AS a
      FROM daily_user_volume
    ),
    predictions AS (
      SELECT
        '2015-03-31'::DATE + i AS date,
        COALESCE(user_ct, 334546) AS user_ct, -- last real count
        POWER(10, (SELECT a FROM estimate_a) + (select b from estimate_b) * i) estimate
      FROM
        -- make more dt_ids for the projection
        generate_series(1, 1000, 1) i
      LEFT JOIN daily_user_volume ON i = daily_user_volume.dt_id
  )
SELECT * FROM predictions ORDER BY "date";

WITH
  daily_ev AS (
    SELECT
      event_name,
      to_timestamp(created_at) :: DATE as dt,
      to_timestamp(created_at) :: DATE - '2015-12-31' AS x,
      count(*)                                        AS y
    FROM
      event
    WHERE
      to_timestamp(created_at) :: DATE > '2015-12-31' AND
      event_name = 'access module bi ssr'
    GROUP BY
      event_name,
      to_timestamp(created_at) :: DATE,
      x
    ORDER BY x ASC
  ),
  regr_a AS (
    SELECT regr_intercept(y, x) FROM daily_ev
  ),
  regr_b AS (
    SELECT regr_slope(y, x) FROM daily_ev
  )
SELECT
  event_name,
  dt,
  x,
  y,
  ROUND((SELECT * FROM regr_a) + ((SELECT * FROM regr_b) * x))
FROM daily_ev
ORDER BY x;


WITH
  start AS (
      SELECT
        id,
        created_at AS startdt
      FROM conversation
  ),
  finish AS (
      SELECT
        conversation_id,
        MAX(created_at) as enddt
      FROM conversation_part
      WHERE part_type='comment'
      GROUP BY conversation_id
  )
SELECT DISTINCT
  conversation_part.conversation_id,
  startdt,
  enddt,
  ((enddt - startdt)::FLOAT / 60)
FROM conversation_part
JOIN start ON conversation_part.conversation_id = start.id
JOIN finish ON conversation_part.conversation_id = finish.conversation_id
ORDER BY startdt;

CREATE TABLE calendar AS (
  SELECT DISTINCT created_at, to_timestamp(created_at) :: TIMESTAMP AS date
  FROM (
         SELECT DISTINCT company.created_at
         FROM company
         UNION
         SELECT DISTINCT conversation.created_at
         FROM conversation
         UNION
         SELECT DISTINCT conversation_part.created_at
         FROM conversation_part
         UNION
         SELECT DISTINCT event.created_at
         FROM event
         UNION
         SELECT DISTINCT lead.created_at
         FROM lead
         UNION
         SELECT DISTINCT segment.created_at
         FROM segment
         UNION
         SELECT DISTINCT "user".created_at
         FROM "user") AS dates
  ORDER BY 1
);
ALTER TABLE public.calendar ADD CONSTRAINT pk_calendar PRIMARY KEY (date);

CREATE OR REPLACE FUNCTION _final_median(NUMERIC[])
  RETURNS NUMERIC AS
$$
SELECT AVG(val)
FROM (
       SELECT val
       FROM unnest($1) val
       ORDER BY 1
       LIMIT  2 - MOD(array_upper($1, 1), 2)
       OFFSET CEIL(array_upper($1, 1) / 2.0) - 1
     ) sub;
$$
LANGUAGE 'sql' IMMUTABLE;

CREATE AGGREGATE median(NUMERIC) (
SFUNC=array_append,
STYPE=NUMERIC[],
FINALFUNC=_final_median,
INITCOND='{}'
);

WITH conversation_part_date AS (
    SELECT
      id,
      conversation_id,
      MIN(created_at) AS created_at
    FROM conversation_part
    WHERE part_type = 'comment'
          AND author_admin IS NOT NULL
    GROUP BY id, conversation_id
  ),
  conversation_response_time AS (
    SELECT
      conversation.id,
      conversation_part_date.id,
      conversation_part_date.created_at - conversation.created_at
    FROM conversation_part_date
      JOIN conversation ON conversation.id=conversation_part_date.conversation_id
    WHERE conversation.author_user IS NOT NULL;
  )
SELECT
  EXTRACT(YEAR FROM to_timestamp(conversation.created_at)),
  MEDIAN(conversation_part_date.created_at - conversation.created_at) / 60
FROM conversation_part_date
JOIN conversation ON conversation.id=conversation_part_date.conversation_id
WHERE conversation.author_user IS NOT NULL
GROUP BY EXTRACT(YEAR FROM to_timestamp(conversation.created_at));

DROP MATERIALIZED VIEW conversation_response_time;
REFRESH MATERIALIZED VIEW CONCURRENTLY conversation_part_response_time;

SELECT
  created_at - lag(created_at) OVER(
    PARTITION BY conversation_id
    ORDER BY conversation_id, created_at ASC
    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
  ) AS rtime, *,
  lag(author_user) OVER(
    PARTITION BY conversation_id
    ORDER BY conversation_id, created_at ASC
    ROWS BETWEEN 1 PRECEDING AND CURRENT ROW
  ) AS prev_user
FROM conversation_part;

SELECT EXTRACT(YEAR FROM to_timestamp(times.created_at)), EXTRACT(MONTH FROM to_timestamp(times.created_at)), median(rtime/60) FROM(
SELECT created_at - lag(created_at) OVER(PARTITION BY conversation_id ORDER BY conversation_id, created_at ASC ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) as rtime, *
FROM conversation_part) as times
WHERE times.author_admin IS NOT NULL
GROUP BY EXTRACT(YEAR FROM to_timestamp(times.created_at)), EXTRACT(MONTH FROM to_timestamp(times.created_at));

SELECT EXTRACT(YEAR FROM to_timestamp(last_request_at)), EXTRACT(MONTH FROM to_timestamp(last_request_at)), COUNT(*)
FROM "user"
GROUP BY EXTRACT(YEAR FROM to_timestamp(last_request_at)), EXTRACT(MONTH FROM to_timestamp(last_request_at));

SELECT * FROM conversation WHERE lead IS NOT NULL;

TRUNCATE TABLE conversation CASCADE;
DROP TABLE conversation CASCADE;