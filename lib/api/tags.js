const Trampoline = require('../trampoline');

async function fetchTags(client, page = 1) {
    const json = await client.fetch(`/tags?page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.tags];
    }

    return [
        () => fetchTags(client, page + 1),
        json.tags,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchTags(client)),
};
