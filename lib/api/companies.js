const Trampoline = require('../trampoline');

async function fetchCompanies(client, scroll = null) {
    const json = await client.fetch(`/companies/scroll${scroll ? `?scroll_param=${scroll}` : ''}`);

    if (json.saveCompanies.length === 0) {
        return [null, null];
    }

    return [
        () => fetchCompanies(client, json.scroll_param),
        json.saveCompanies,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchCompanies(client)),
};
