let d = document;

let displayAlert = (alerttext, alerttype, alertdelay) => {

    let status = d.querySelector('#status');
    status.className = 'alert alert-' + alerttype;
    status.innerHTML = alerttext;
    status.style.display = 'block';
    setTimeout(function () {
        status.style.display = 'none';
    }, alertdelay);

}

d.addEventListener('DOMContentLoaded', event => {

    chrome.storage.sync.get(items => {

        let sectionRadios = d.querySelectorAll('[name="sectionRadios"]');
        let sortRadios = d.querySelectorAll('[name="sortRadios"]');
        let animated = d.querySelector('#animated');
        let topSites = d.querySelector('#topSites');
        let nsfw = d.querySelector('#nsfw');
        let oauth2 = d.querySelector('#oauth2');

        if (items.section) sectionRadios.forEach(sectionRadio => sectionRadio.checked = (items.section === sectionRadio.value));
        if (items.sort) sortRadios.forEach(sortRadio => sortRadio.checked = (items.sort === sortRadio.value));
        animated.checked = items.animated;
        topSites.checked = items.topSites;
        nsfw.checked = items.nsfw;

        if (items.account_username) {
            oauth2.innerHTML = items.account_username;
            oauth2.className = 'btn btn-success';
            oauth2.setAttribute('disabled', true);
        }

    });

});

d.querySelector('form').addEventListener('submit', event => {

    event.preventDefault();

    let sectionRadios = d.querySelectorAll('[name="sectionRadios"]');
    let sortRadios = d.querySelectorAll('[name="sortRadios"]');
    let animated = d.querySelector('#animated').checked;
    let topSites = d.querySelector('#topSites').checked;
    let nsfw = d.querySelector('#nsfw').checked;
    let section, sort;

    sectionRadios.forEach(sectionRadio => {
        if (sectionRadio.checked) section = sectionRadio.value;
    });

    sortRadios.forEach(sortRadio => {
        if (sortRadio.checked) sort = sortRadio.value;
    });

    chrome.storage.sync.set({
        'section': section,
        'sort': sort,
        'animated': animated,
        'topSites': topSites,
        'nsfw': nsfw
    }, displayAlert('Options Saved!', 'success', 4000));

});

d.querySelector('#btnReset').addEventListener('click', event => {

    chrome.storage.sync.clear(function () {
        if (chrome.runtime.lastError)
            console.log(chrome.runtime.lastError);
        else
            displayAlert('Options Reset!', 'success', 2000);
    });
    
});

d.querySelector('#oauth2').addEventListener('click', event => {

    let details = {
        url: 'https://api.imgur.com/oauth2/authorize?client_id=41bb433516d8d8e&response_type=token',
        interactive: true
    };

    chrome.identity.launchWebAuthFlow(details, responseUrl => {
        if (!chrome.runtime.lastError) {
            let _responseURL = new URL(responseUrl);
            let params = {},
                queryString = _responseURL.hash.substring(1),
                regex = /([^&=]+)=([^&]*)/g,
                m;
            while (m = regex.exec(queryString)) {
                params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }

            chrome.storage.sync.set(params, function () {
                if (chrome.runtime.lastError) console.log(chrome.runtime.lastError);
                if (params.account_username) {
                    oauth2.innerHTML = params.account_username;
                    oauth2.className = 'btn btn-success';
                    oauth2.setAttribute('disabled', true);
                }
            });
        } else
            console.log(chrome.runtime.lastError.message);
    });
});
