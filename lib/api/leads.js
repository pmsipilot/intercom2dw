const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchLeads(scroll = null, contacts = []) {
    const url = `https://api.intercom.io/contacts/scroll${!!scroll ? `?scroll_param=${scroll}` : ''}`;
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

    if (json.contacts.length === 0) {
        return contacts;
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchLeads(json.scroll_param, contacts.concat(json.contacts));
    }
}

module.exports = {
    fetch: async () => await utils.bounce(async () => await fetchLeads())
};