const fetch = require('node-fetch');
const utils = require('../utils');

const appId = 'zooz4av1';
const appToken = '8514bf47c9d9cf8f4357b616dad1a18ba4c1ba34';
const auth = new Buffer(`${appId}:${appToken}`);

async function fetchCompanies(scroll = null, companies = []) {
    const url = `https://api.intercom.io/companies/scroll${!!scroll ? `?scroll_param=${scroll}` : ''}`;
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

    if (json.companies.length === 0) {
        return companies;
    }

    return async () => {
        await utils.delayUntilLimitReset(response);

        return await fetchCompanies(json.scroll_param, companies.concat(json.companies));
    };
}

module.exports = {
    fetch: async () => await utils.bounce(async () => await fetchCompanies())
};