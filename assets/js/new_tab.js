(function () {

    'use strict';

    let d = document,
        Options = {};

    let masonry = function () {

        let myHeaders = new Headers();
        myHeaders.append('Authorization', (Options.IS_LOGGEDIN) ? `Bearer ${Options.ACCESS_TOKEN}` : 'Client-ID 41bb433516d8d8e');

        fetch(`https://api.imgur.com/3/gallery/${Options.SECTION}/${Options.SORT}/${Options.PAGE++}?mature=${Options.NSFW}&album_previews=false`, {
                headers: myHeaders
            })
            .then(response => {
                if (response.ok)
                    return response;
                throw new Error(response.statusText);
            })
            .then(response => {
                response.json().then(json => {
                    if (json.success) {
                        json.data.filter((element, index) => !element.is_album && index < 50).forEach(element => {
                            if (Options.NSFW) {
                                if (element.nsfw) {
                                    createGridElement(element, true);
                                } else {
                                    createGridElement(element);
                                }
                            } else {
                                if (!element.nsfw) {
                                    createGridElement(element);
                                }
                            }
                        });

                        appendResponseHeader(response.headers)

                        let msnry = new Masonry('.grid', {
                            itemSelector: '.grid-item',
                            columnWidth: 7,
                            fitWidth: true,
                            isFitWidth: true
                        });

                        let imgLoad = imagesLoaded('.grid', instance => {});

                        imgLoad.on('progress', instance => msnry.layout());

                    }
                });
            })
            .catch(error => console.log(error));
    };

    let appendResponseHeader = headers => {
        let UserReset = headers.get('X-RateLimit-UserReset');
        let UserRemaining = headers.get('X-RateLimit-UserRemaining');
        let ClientRemaining = headers.get('X-RateLimit-ClientRemaining');
        let footer = d.querySelector('#footer');
        let date = new Date(0);

        footer.innerHTML = '';
        date.setUTCSeconds(UserReset);

        let li = d.createElement('li');
        li.innerHTML = UserRemaining;
        footer.appendChild(li);

        li = d.createElement('li');
        li.innerHTML = ClientRemaining;
        footer.appendChild(li);

        li = d.createElement('li');
        li.innerHTML = date.toLocaleTimeString();
        footer.appendChild(li);

        li = d.createElement('li');
        li.innerHTML = Options.SECTION;
        footer.appendChild(li);

        li = d.createElement('li');
        li.innerHTML = Options.SORT;
        footer.appendChild(li);

        if (Options.IS_LOGGEDIN) {
            li = d.createElement('li');
            li.innerHTML = Options.ACCOUNT_USERNAME;
            footer.appendChild(li);
        }
    }

    let bookmarksBar = function () {
        chrome.bookmarks.getSubTree("1", bookmarkTreeNodes => {
            bookmarkTreeNodes[0].children.forEach(bookmarkTreeNode => {
                createBookmark(bookmarkTreeNode);
            });
        });
    }

    let getDocHeight = function () {
        return Math.max(
            d.body.scrollHeight, d.documentElement.scrollHeight,
            d.body.offsetHeight, d.documentElement.offsetHeight,
            d.body.clientHeight, d.documentElement.clientHeight
        );
    }

    let createBookmark = bookmarkTreeNode => {
        if (!bookmarkTreeNode.children) {
            let li = d.createElement('li');
            let a = d.createElement('a');
            a.href = bookmarkTreeNode.url;
            a.title = bookmarkTreeNode.title;
            a.innerHTML = bookmarkTreeNode.title.substr(0, 20);
            a.className += 'label label-info';
            li.appendChild(a);
            d.querySelector('#topSites').appendChild(li);
        } else {
            let folder = d.createElement('ul');
            folder.className += 'bookmarksBarFolderList';
            bookmarkTreeNode.children.forEach(function (elem, index, array) {
                let li = d.createElement('li');
                li.className += 'bookmarksBarFolderListItem';
                let a = d.createElement('a');
                a.href = elem.url;
                a.title = elem.title;
                a.innerHTML = elem.title.substr(0, 20);
                li.appendChild(a);
                folder.appendChild(li);
            });
            let span = d.createElement('span');
            span.innerHTML = bookmarkTreeNode.title;
            span.className += 'label label-warning';
            let li = d.createElement('li');
            li.appendChild(span);
            li.appendChild(folder);
            li.className += 'bookmarksBarFolder';
            d.querySelector('#topSites').appendChild(li);
        }
    }

    let createGridElement = (element, is_nsfw) => {
        let div = d.createElement('div');
        div.setAttribute('class', 'grid-item');
        let a = d.createElement('a');
        a.href = 'https://imgur.com/' + element.id;
        a.title = element.title;

        let media = d.createElement('img');

        media.src = (element.animated && element.size < 20971520) ? element.link.replace('.gif', 'm.gif') : element.link; // 20958129
        if (element.animated && Options.ANIMATED) {
            media.src = element.link;
        }
        media.alt = element.title;
        media.title = element.title;
        media.width = 200;
        div.appendChild(a).appendChild(media);

        let heading = d.createElement('h1');
        heading.innerHTML = element.title;
        heading.className += 'heading';
        div.appendChild(a).appendChild(heading);

        if (element.description) {
            let p = d.createElement('p');
            p.innerHTML = element.description.replace(/\n/g, '<br>');
            p.className += 'description';
            div.appendChild(p);
        }

        let hr = d.createElement('hr');
        div.appendChild(hr);

        let points = d.createElement('div');
        points.className += 'points';
        points.innerHTML = element.points + ' points<br>' + element.views + ' views<br>' + element.comment_count + ' comments';
        div.appendChild(points);

        // section label if section information is available
        if (element.section) {
            let section = d.createElement('div');
            section.className += 'label label-pill label-info section';
            section.innerHTML = element.section;
            div.appendChild(section);
        }

        // heart icon and favorite functionality if user is logged in
        if (Options.IS_LOGGEDIN) {
            let fa = d.createElement('div');
            fa.className += 'fa';
            let favorite = d.createElement('a');
            if (element.favorite) favorite.className = 'favorite';
            favorite.innerHTML = '&#10084;';
            favorite.onclick = event => {
                event.preventDefault();
                let myHeaders = new Headers();
                myHeaders.append('Authorization', `Bearer ${Options.ACCESS_TOKEN}`);
                fetch(`https://api.imgur.com/3/image/${element.id}/favorite`, {
                    headers: myHeaders,
                    method: 'POST'
                }).then(response => {
                    if (response.ok)
                        return response.json();
                    throw new Error(response.statusText);
                }).then(json => {
                    console.log(json);
                    if (json.success)
                        event.target.className = (json.data === 'favorited') ? 'favorite' : '';
                }).catch(error => console.log(error));
            };
            fa.appendChild(favorite);
            div.appendChild(fa);
        }

        // nsfw label for mature images
        if (is_nsfw) {
            let nsfw = d.createElement('div');
            let br = d.createElement('br');
            nsfw.className += 'label label-pill label-danger nsfw';
            nsfw.innerHTML = 'nsfw';
            if (element.section) {
                div.appendChild(br);
            }
            div.appendChild(nsfw);
        }

        d.querySelector('#imgur').appendChild(div);
    }

    chrome.storage.sync.get(items => {

        Options.SECTION = items.section || 'random';
        Options.SORT = items.sort || 'random';
        Options.TOPSITES = items.topSites;
        Options.NSFW = items.nsfw;
        Options.ACCESS_TOKEN = items.access_token;
        Options.ACCOUNT_USERNAME = items.account_username;
        Options.ANIMATED = items.animated;
        Options.IS_LOGGEDIN = (Options.ACCESS_TOKEN) ? true : false;
        Options.PAGE = 0;

        if (Options.TOPSITES) {

            bookmarksBar();

            chrome.topSites.get(mostVisitedURLs => {
                mostVisitedURLs.forEach(mostVisitedURL => {
                    let a = d.createElement('a');
                    a.href = mostVisitedURL.url;
                    a.title = mostVisitedURL.title;
                    a.innerHTML = mostVisitedURL.title.substr(0, 20);
                    a.className += 'label label-success';
                    let li = d.createElement('li');
                    li.appendChild(a)
                    d.querySelector('#topSites').appendChild(li);
                });
            });

        }

        masonry();
        masonry();

        // click handler for next button
        d.querySelector('#nextLink').addEventListener('click', event => {
            masonry();
        });

        // infinite scroll
        window.addEventListener('scroll', event => {
            if (window.scrollY + window.innerHeight >= getDocHeight()) {
                setTimeout(masonry, 1000);
            }
        });
    });

})();
