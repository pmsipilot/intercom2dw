const Trampoline = require('../trampoline');

async function fetchSegments(client, page = 1) {
    const json = await client.fetch(`/segments?page=${page}`);

    if (!json.pages || json.pages.page === json.pages.total_pages) {
        return [null, json.segments];
    }

    return [
        () => fetchSegments(client, page + 1),
        json.segments,
    ];
}

module.exports = {
    fetch: client => new Trampoline(() => fetchSegments(client)),
};
