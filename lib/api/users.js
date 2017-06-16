const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchUsers(scroll = null, users = []) {
    const url = `https://api.intercom.io/users/scroll${!!scroll ? `?scroll_param=${scroll}` : ''}`;
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

    if (json.users.length === 0) {
        return users;
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchUsers(json.scroll_param, users.concat(json.users));
    }
}

module.exports = {
    fetch: async () => await utils.bounce(async () => await fetchUsers())
};