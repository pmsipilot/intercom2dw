const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchAdmins(page = 1, admins = []) {
    const url = `https://api.intercom.io/admins?page=${page}`;
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
        return admins.concat(json.admins);
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchAdmins(++page, admins.concat(json.admins));
    }
}

module.exports = {
    fetch: async () => await utils.bounce(async () => await fetchAdmins())
};