const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchSegments(page = 1, segments = []) {
    const url = `https://api.intercom.io/segments?page=${page}`;
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

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return segments.concat(json.segments);
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchSegments(++page, segments.concat(json.segments));
    }
}

module.exports = {
    fetch: async () => await utils.bounce(async () => await fetchSegments())
};