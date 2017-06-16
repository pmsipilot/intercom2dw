const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchConversations(page = 1, conversations = []) {
    const url = `https://api.intercom.io/conversations?page=${page}`;
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
        return conversations.concat(json.conversations);
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchConversations(++page, conversations.concat(json.conversations));
    }
}

module.exports = {
    fetch: async () => await utils.bounce(async () => await fetchConversations())
};