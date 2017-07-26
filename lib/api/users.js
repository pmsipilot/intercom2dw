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

module.exports = {
    fetch: client => new Trampoline(() => fetchUsers(client)),
};
