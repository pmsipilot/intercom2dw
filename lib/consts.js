const consts = {
    TAGS: 2,
    SEGMENTS: 4,
    ADMINS: 8,
    COMPANIES: 16,
    LEADS: 32,
    USERS: 64,
    EVENTS: 128,
    CONVERSATIONS: 256,
    PARTS: 512,
};

module.exports = Object.assign({}, consts, {
    API_URL: 'https://api.intercom.io',
    DB_HOST: 'db',
    DB_PORT: 5432,
    DB_USER: 'intercom2dw',
    DB_PASS: 'intercom2dw',
    DB_NAME: 'intercom2dw',

    IGNORE_TAGS: consts.TAGS
        | consts.LEADS
        | consts.USERS
        | consts.EVENTS
        | consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_SEGMENTS: consts.SEGMENTS
        | consts.LEADS
        | consts.USERS
        | consts.EVENTS
        | consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_ADMINS: consts.ADMINS
        | consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_COMPANIES: consts.COMPANIES
        | consts.LEADS
        | consts.USERS
        | consts.EVENTS
        | consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_LEADS: consts.LEADS
        | consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_USERS: consts.USERS
        | consts.EVENTS
        | consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_EVENTS: consts.EVENTS,
    IGNORE_CONVERSATIONS: consts.CONVERSATIONS
        | consts.PARTS,
    IGNORE_PARTS: consts.PARTS,
    IGNORE_ALL_BUT_EVENTS: consts.TAGS
        | consts.SEGMENTS
        | consts.ADMINS
        | consts.COMPANIES
        | consts.LEADS
        | consts.USERS
        | consts.CONVERSATIONS
        | consts.PARTS,
});
