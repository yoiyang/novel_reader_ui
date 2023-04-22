// -------------- environment consts --------------

const BOOK_URLS = [
    { title: "Chapter One", "url": "https://litipsum.com/api" },
    { title: "Chapter Two", "url": "https://litipsum.com/api" },
    { title: "Chapter Three", "url": "https://litipsum.com/api" },
    { title: "Chapter Four", "url": "https://litipsum.com/api" }
];

const BOOKNAME = 'Unpoken';
const PROMPT_TEXT = 'Make a choice'
const VERSION_HINT = 'Hi, ver 1'
const ERROR_TEXT = 'Content unavailable'

// designed to reduce number of queries if BOOK_URLS fetched remotely
const CACHE_DURATION_IN_DAYS = -1;

