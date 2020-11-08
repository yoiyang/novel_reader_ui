# Unspoken: A book reader website template
Demo: https://unspoken-4578c.firebaseapp.com/

# Get started
0. Fork this project
1. Edit **env.js** with your book's info, such as titles and URLs
2. Done! Visit what's new in **index.html**

# Specs
- Languages: HTML, CSS, Vanilla Javascript
- Unspoken utilize `localStorage` to cache data such as:
  - `choices`: stores all mappings between titles <-> content URLs
  - `darkmode`: if enabled dark mode
  - `date_expire`: the date to refresh `choices` from env.js
  - `ver`: version number to keep track of software release