const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchEvents(user, page = 1, events = []) {
    const url = `https://api.intercom.io/events?type=user&intercom_user_id=${user}&page=${page}`;
    const response = await fetch(
        url,
        {
            headers: {
                accept: 'application/json',
                authorization: `Basic ${auth.toString('base64')}`
            }
        }
    );
    const json = await response.json();

    if (json.type === 'error.list') {
        throw new Error(json.errors[0].message);
    }

    console.log('Limit: ', response.headers.get('X-RateLimit-Remaining'));
    await utils.delayUntilLimitReset(response);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return events.concat(json.events);
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchEvents(user, ++page, events.concat(json.events));
    }
}

module.exports = {
    fetch: async (user) => await utils.bounce(async () => await fetchEvents(user))
};