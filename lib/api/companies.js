const Trampoline = require('../trampoline');

async function fetchCompanies(client, scroll = null) {
    const json = await client.fetch(`/companies/scroll${scroll ? `?scroll_param=${scroll}` : ''}`);

    if (json.companies.length === 0) {
        return [null, null];
    }

    return [
        () => fetchCompanies(client, json.scroll_param),
        json.companies,
    ];
}

async function fetchCompanyList(client, companies) {
    if (companies.length === 0) {
        return [null, null];
    }

    const json = await client.fetch(`/companies?company_id=${companies.shift()}`);

    return [
        () => fetchCompanyList(client, companies),
        json ? [json] : null,
    ];
}

module.exports = {
    fetch: (client, companies = []) => {
        if (companies.length) {
            return new Trampoline(() => fetchCompanyList(client, [...companies]))
        }

        return new Trampoline(() => fetchCompanies(client));
    }
};
