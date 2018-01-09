const Trampoline = require('../trampoline');

async function fetchUsers(client, scroll = null) {
    const url = `/users/scroll?sort=updated_at&order=desc${scroll ? `&scroll_param=${scroll}` : ''}`;
    const json = await client.fetch(url);

    if (json.users.length === 0) {
        return [null, null];
    }

    return [
        () => fetchUsers(client, json.scroll_param),
        json.users,
    ];
}

async function fetchCompanyUsers(client, company, page = 1) {
    const json = await client.fetch(`/companies?company_id=${company}&type=user&page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.users];
    }

    return [
        () => fetchCompanyUsers(client, company, page + 1),
        json.users,
    ];
}

async function fetchCompaniesUsers(client, companies) {
    if (companies.length === 0) {
        return [null, null];
    }

    let json = [];

    await new Trampoline(() => fetchCompanyUsers(client, companies.shift()))
        .onBounce(users => {
            json = json.concat(users);
        })
        .jump();

    return [
        () => fetchCompaniesUsers(client, companies),
        json,
    ];
}

module.exports = {
    fetch: (client, companies = []) => {
        if (companies.length) {
            return new Trampoline(() => fetchCompaniesUsers(client, [...companies]))
        }

        return new Trampoline(() => fetchUsers(client))
    }
};
