const Trampoline = require('../trampoline');

async function fetchAdmins(client, page = 1) {
    const json = await client.fetch(`/admins?page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.saveAdmins];
    }

    return [
        () => fetchAdmins(client, page + 1),
        json.saveAdmins,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchAdmins(client)),
};
