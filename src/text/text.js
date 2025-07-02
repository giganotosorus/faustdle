let textEntries = {};

export async function loadText(language) {
    if (language.includes("-")) language = language.split("-")[0];
    fetch(`text/${language}.json`).then(res => res.json()).then(res => {

        console.log(res);

        if (res == null) {
            if (language.includes("-")) loadText(path, language.split("-")[0], callback);
            return;
        }

        textEntries = res;

        for (const elt of document.querySelectorAll("*[data-text]")) {
            if (textEntries[elt.dataset.text] != null) elt.textContent = textEntries[elt.dataset.text];
        }

        for (const elt of document.querySelectorAll("*[data-html]")) {
            if (textEntries[elt.dataset.html] != null) elt.innerHTML = textEntries[elt.dataset.html];
        }

        for (const elt of document.querySelectorAll("*[data-title-text]")) {
            if (textEntries[elt.dataset.titleText] != null) elt.title = textEntries[elt.dataset.titleText];
        }

        for (const elt of document.querySelectorAll("*[data-placeholder-text]")) {
            if (textEntries[elt.dataset.placehold4erText] != null) elt.placeholder = textEntries[elt.dataset.placeholderText];
        }
    });
}

export function getText(fallback, id, data) {
    let text = textEntries[id];

    if (text == null) text = fallback;

    if (data != null) {
        for (const [key, value] of Object.entries(data)) text = text.replace(`{${key}}`, value);
    }

    return text;
}