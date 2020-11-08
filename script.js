// TEST start
const TEST_URLS = [
    { title: "One", "url": "https://litipsum.com/api" },
    { title: "Two", "url": "https://litipsum.com/api" },
    { title: "Three", "url": "https://litipsum.com/api" },
    { title: "Four", "url": "https://litipsum.com/api" }
];
// TEST end

// -------------- environment --------------
const BOOKNAME = 'Unpoken';
const PROMPT_TEXT = 'Make a choice'
const VERSION_HINT = 'Hi, ver 1'
const ERROR_TEXT = 'Content unavailable'
const CACHE_DURATION_IN_DAYS = -1;

// -------------- UI components --------------
var bookmark_choice_el = null;
var bookmark_icon_el = document.getElementById("bookmark");

var book_title_el = document.getElementById('book_hint');
var choice_title_el = document.getElementById('title');
var text_el = document.getElementById('textfield');
var choices_el = document.getElementById('choice-el');
var highlighted_choice_el = document.getElementById(current_choice_str);

var toggle_choice_btn_el = document.getElementById('toggle-choice-panel');
var toggle_font_size_btn_el = document.getElementById('font-size');

// -------------- helper vars --------------
var choice_animation_timeout = 0;
var darkmode = document.body.style;
window.choices = {}
var bookmarked_choice_str = localStorage.getItem('bookmark');
var current_choice_str = localStorage.getItem('previous_choice');
var bookmarked_icon = document.getElementById('icon-bookmarked').cloneNode(true);

// --------------Data fetch functions--------------
function get_content_URLs() {
    // get choice URLs off/online
    return new Promise(async(resolve, reject) => {
        let today = new Date()
        localStorage.date_expire = null; // TODO
        let exp_date = new Date(localStorage.date_expire)
        if (today <= exp_date) { // fetch cache
            window.choices = JSON.parse(localStorage.choices);
            console.log(`Got data from cache, size: ${Object.keys(window.choices).length}`);
            resolve(true);
        } else {
            // const snapshot = await firebase.firestore().collection("book").get({source: 'server'});
            const snapshot = TEST_URLS;
            console.log(`Got data from JSON, size: ${snapshot.length}, listing: `);

            if (snapshot.length) {
                snapshot.forEach((obj, idx) => {
                    const obj_key = idx.toString() + '.' + obj.title;
                    window.choices[obj_key] = obj.url;
                    console.log(`${obj_key}: ${obj.url}`);
                });

                // cache it for 3 days
                today.setDate(today.getDate() + CACHE_DURATION_IN_DAYS)
                localStorage.date_expire = today;
                localStorage.choices = JSON.stringify(window.choices);
                resolve(true);
            } else
                reject(null);
        }
    })
}

function get_text_for_current_choice_from_cache() {
    const seq = get_seq_num(current_choice_str)
    if (seq in localStorage) {
        setTimeout(() => { text_content_transition(delay = 20); }, 300);
        text_el.innerText = localStorage[seq]
        localStorage.setItem('previous_choice', current_choice_str);
        return true
    }
    return false
}

function get_text_for_current_choice_from_url(choice_key) {
    let client = new XMLHttpRequest();
    client.open('GET', window.choices[choice_key]);
    client.addEventListener("error", () => {
        text_el.innerText = "User doesn't have permission to access the object"
    });
    client.onreadystatechange = function() {
        // load & cache text_el
        text_el.innerText = client.responseText.replace(/\n/g, "\n\n");
        localStorage.setItem(get_seq_num(current_choice_str), text_el.innerText);
        localStorage.setItem('previous_choice', current_choice_str);
        // change UI
        text_content_transition();
    }
    client.send();
}

function get_text(choice_str) {
    // reset opacity
    show_book_title();
    darkmode.setProperty('--opacity', 0);
    current_choice_str = choice_str; // change current file
    scroll_to(0); // go to top
    cancel_choose();
    if (!get_text_for_current_choice_from_cache())
        get_text_for_current_choice_from_url(choice_str);
}

// --------------UI helper functions--------------
function bright() {
    darkmode.setProperty('--title_color', "rgb(70,80,85)");
    darkmode.setProperty('--choice-el_bg', "rgb(250,250,250)");
    darkmode.setProperty('--bg', "#fff");
    darkmode.setProperty('--text_color', "rgb(50,50,50)");
}

function dark() {
    darkmode.setProperty('--title_color', "rgb(200,200,215)");
    darkmode.setProperty('--choice-el_bg', "rgb(45,50,65)");
    darkmode.setProperty('--bg', "rgb(25,30,40)");
    darkmode.setProperty('--text_color', "rgb(180,190,210)");
}

function fade(duration) {
    darkmode.setProperty('--opacity', 0);
    let op = 0.1; // initial opacity
    let timer = setInterval(function() {
        if (op >= 1)
            clearInterval(timer);
        darkmode.setProperty('--opacity', op);
        darkmode.setProperty('--filter', `alpha(opacity=${op * 100})`);
        op += op * 0.1;
    }, duration);
}

function show_book_title() {
    // this is to fix weird safari glitch after get_text
    book_title_el.style.display = "block";
    setTimeout(() => {
        book_title_el.style.display = null;
    }, 2000);
}

function text_content_transition(delay = 15) {
    fade(delay);
    highlight_current_choice();
    draw_bookmark_icon(current_choice_str == bookmarked_choice_str)
}

function highlight_current_choice() {
    choice_title_el.innerText = trim_seq_num(current_choice_str);
    if (highlighted_choice_el != null)
        highlighted_choice_el.style.borderColor = "transparent";
    highlighted_choice_el = document.getElementById(current_choice_str);
    if (highlighted_choice_el != null)
        highlighted_choice_el.style.borderColor = "#ddd";
}

function draw_bookmark_icon(set) {
    let bookmarked_icon = document.getElementById('icon-bookmarked');
    bookmarked_icon.style.opacity = set ? 1 : 0;
}

// --------------Interaction helper functions--------------
function scroll_to(pos) {
    document.body.scrollTop = pos; // For Safari
    document.documentElement.scrollTop = pos; // For Chrome, Firefox, IE and Opera
}

function change_font_size() {
    // unable to use text_el size and date select
    if (current_choice_str == null) return;

    let current_size = parseFloat(text_el.style.fontSize.split("em")[0]);
    if (!current_size)
        text_el.style.fontSize = "1.1em";
    current_size += 0.1;
    if (current_size > 1.3)
        current_size = 0.8;
    text_el.style.fontSize = current_size.toString() + "em";
    localStorage.setItem('toggle_font_size_btn_el', text_el.style.fontSize);

    // stay at the bottom
    scroll_to(document.body.scrollHeight);
}

function apply_theme(toggle = true) {
    let current_darkmode_setting = localStorage.getItem('darkmode');
    if (localStorage.getItem('darkmode') == null) {
        localStorage.setItem('darkmode', 0);
        current_darkmode_setting = 0;
    }
    if (toggle) {
        current_darkmode_setting ^= 1;
        localStorage.setItem('darkmode', current_darkmode_setting);
    }
    if (current_darkmode_setting == 0)
        bright();
    else
        dark();
}

function update_bookmark_icon() {
    // remove last bookmark UI
    if (bookmark_choice_el != null)
        bookmark_choice_el.removeChild(bookmarked_icon);
    // draw the new one
    bookmark_choice_el = document.getElementById(bookmarked_choice_str);
    if (bookmark_choice_el != null)
        bookmark_choice_el.appendChild(bookmarked_icon);
}

function move_to_current_choice() {
    if (current_choice_str == null) return;
    // move to current file
    highlight_current_choice();
    // centering the current file
    choices_el.scrollLeft = highlighted_choice_el.offsetLeft -
        window.innerWidth / 2 +
        highlighted_choice_el.clientWidth / 2;
}

function bookmark_current_choice() {
    bookmarked_choice_str = (bookmarked_choice_str == current_choice_str) ? "" : current_choice_str; // add/remove bookmark
    draw_bookmark_icon(bookmarked_choice_str != "");
    move_to_current_choice();
    update_bookmark_icon();
    localStorage.setItem("bookmark", bookmarked_choice_str); // cache bookmark
}

function cancel_choose() {
    // do nothing if it's already cancelled
    if (text_el.onclick == null) return;

    document.body.style.overflowY = "scroll";
    text_el.style.WebkitFilter = "blur(0)";
    choices_el.style.top = "100%";
    // for smooth choices_el animation
    choice_animation_timeout = setTimeout(() => {
        choices_el.style.position = "absolute";
        choices_el.style.height = null;
    }, 1500);
    bookmark_icon_el.style.display = null;
    text_el.onclick = null;
    toggle_choice_btn_el.onclick = choice_selection_mode;
    choice_title_el.onclick = null; // TODO

    toggle_choice_btn_el.style.opacity = 1;
}

function choice_selection_mode() {
    // TODO: unable to enter selection mode
    if (current_choice_str == null) return;
    // avoid timeout conflicts
    clearTimeout(choice_animation_timeout);

    move_to_current_choice();
    scroll_to(0);

    // don't allow veritical
    document.body.style.overflowY = "hidden";

    text_el.style.WebkitFilter = "blur(5px)";
    choices_el.style.position = "fixed";
    choices_el.style.height = "100%";
    choices_el.style.top = "50%";
    bookmark_icon_el.style.display = "block";
    // ways to cancel select
    text_el.onclick = cancel_choose;
    toggle_choice_btn_el.onclick = cancel_choose;
    choice_title_el.onclick = cancel_choose;

    toggle_choice_btn_el.style.opacity = 0;
}
// --------------General helper functions--------------

// to be refactored here
function get_seq_num(date) {
    return date.substring(0, date.indexOf('.'))
}

function trim_seq_num(date) {
    return date.substring(date.indexOf('.') + 1)
}

function populate_choices() {
    get_content_URLs()
        .then((b) => {
            Object.keys(window.choices).forEach((choice_key) => {
                let entry = document.createElement("div");
                entry.id = choice_key;
                console.log(`Add div with id ${entry.id}`);
                entry.innerText = trim_seq_num(choice_key);
                entry.className = "choice"
                entry.onclick = async function() {
                    if (current_choice_str != this.id)
                        get_text(choice_key);
                };
                choices_el.appendChild(entry)
            });
            move_to_current_choice();
        }).catch((e) => {
            console.log(e);
            choice_title_el.innerText = ERROR_TEXT;
        });
}

// --------------Main functions--------------
function main() {
    scroll_to(0);
    // play async UI for loading below
    show_book_title();
    setTimeout(() => { fade(15); }, 1000);
    prepare_elements();

    // set up bookmark feature
    update_bookmark_icon();
    draw_bookmark_icon(current_choice_str == bookmarked_choice_str);
}

function prepare_elements() {
    // ------ new version updates ------
    const ver = localStorage.getItem("ver");
    book_title_el.innerText = BOOKNAME;
    if (ver == null) {
        // delete the old text_el file cache
        localStorage.clear();
        current_choice_str = null;

        book_title_el.innerText = VERSION_HINT;
        localStorage.setItem("ver", 1);
        localStorage.setItem("toggle_font_size_btn_el", '1.02em');
        setTimeout(() => { book_title_el.innerText = BOOKNAME }, 2000);
    }

    // template bookmark icon
    bookmarked_icon.setAttribute("class", "icon");
    bookmarked_icon.style.fill = "var(--title_color)";
    bookmarked_icon.style.position = "relative";
    bookmark_icon_el.onclick = bookmark_current_choice;

    document.getElementById('toggle-dark-mode').onclick = apply_theme;
    apply_theme(toggle = false);

    text_el.style.fontSize = localStorage.getItem('toggle_font_size_btn_el');
    toggle_choice_btn_el.onclick = choice_selection_mode;
    toggle_font_size_btn_el.onclick = change_font_size;

    // fetch texts from localStorage
    text_el.innerText = (current_choice_str == null) ? "" : localStorage.getItem(get_seq_num(current_choice_str));
    if (text_el.innerText == null || text_el.innerText.length < 4) {
        choice_title_el.innerText = PROMPT_TEXT;
        // not offering font size feature for in the first read
        toggle_font_size_btn_el.style.display = "none";
    } else
        choice_title_el.innerText = trim_seq_num(current_choice_str);

    populate_choices();
}

main();