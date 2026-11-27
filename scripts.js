// used AI to help understand and import keys

import { CLIENT_ID, CLIENT_SECRET } from './config.js'


const authentication = await fetch(`https://accounts.spotify.com/api/token`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
    },
    body: `grant_type=client_credentials`
});

//turning the snake case variable into camelCase: help from ai
const { access_token: accessToken } = await authentication.json()

let searchTerm;
let searchData;
let searchItem;
let embedWrapper = document.createElement("div")
embedWrapper.id = "embedWrapper"
embedWrapper.style.display = "none"
let embedDiv = document.createElement("div")
embedDiv.id = "embed-iframe"
document.body.appendChild(embedWrapper)
embedWrapper.appendChild(embedDiv)

// https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
// used AI to implement searched tracks into the embed
let pendingEmbedUrl = null;
let embedController = null;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const options = {
        width: '100%',
        height: '250',
    };

    if (pendingEmbedUrl) {
        options.url = pendingEmbedUrl
    }

    IFrameAPI.createController(embedDiv, options, (controller) => {
        embedController = controller
        if (pendingEmbedUrl) {
            embedController.loadEntity(pendingEmbedUrl)
        }
    })
};


const dropdown = document.getElementById("typeOfSearch");
const searchForm = document.getElementById("userSearch");
const searchButton = document.getElementById("enterButton");
const searchSection = document.getElementById("searchSection")

async function assignQuery(query) {
    //used AI to help debug spelling errors and incorrect elements 
    searchTerm = query
    const searchFor = await fetch(`https://api.spotify.com/v1/search?q=${searchTerm}&type=${dropdown.value}&limit=1`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    searchData = await searchFor.json()
    if (dropdown.value == "artist") {
        searchItem = searchData.artists.items[0]
    } else if (dropdown.value == "album") {
        searchItem = searchData.albums.items[0]
    } else {
        searchItem = searchData.tracks.items[0]
    }

    let newImage = document.createElement("img")
    if (dropdown.value == "track") {
        newImage.src = searchItem.album.images[0].url
    } else {
        newImage.src = searchItem.images[0].url
    }
    let titleHeader = document.createElement("h2")
    titleHeader.textContent = searchItem.name
    if (dropdown.value == "album") {
        embedWrapper.style.display = "none"
        embedController?.pause()
        let artistSubtitle = document.createElement("h3")
        artistSubtitle.textContent = `By ${searchItem.artists[0].name}`
        let yearSubtitle = document.createElement("h3")
        yearSubtitle.textContent = `Released in ${searchItem.release_date.slice(0, 4)}`
        let trackSubtitle = document.createElement("h3")
        trackSubtitle.textContent = "Tracklist:"
        let trackList = document.createElement("ol")

        const albumTrackSearch = await fetch(`https://api.spotify.com/v1/albums/${searchItem.id}/tracks`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        let albumData = await albumTrackSearch.json();
        albumData.items.forEach(item => {
            let track = document.createElement("li")
            track.textContent = item.name
            trackList.append(track)
        })

        searchSection.append(newImage, titleHeader, artistSubtitle, yearSubtitle, trackSubtitle, trackList)
    } else if (dropdown.value == "track") {
        let artistSubtitle = document.createElement("h3")
        artistSubtitle.textContent = `By ${searchItem.artists[0].name}`
        let albumSubtitle = document.createElement("h3")
        albumSubtitle.textContent = `From: ${searchItem.album.name} Released in ${searchItem.album.release_date.slice(0, 4)}`
        if (searchItem.is_playable == true) {
            let embedUrl = searchItem.external_urls.spotify
            embedWrapper.style.display = "block"
            pendingEmbedUrl = embedUrl
            if (embedController) {
                embedController?.loadEntity(embedUrl)
            }
        } else {
            embedWrapper.style.display = "none"
            embedController?.pause()

        }

        searchSection.append(newImage, titleHeader, artistSubtitle, albumSubtitle)
    } else {
        embedDiv.style.display = "none"
        let trackSubtitle = document.createElement("h3")
        trackSubtitle.textContent = `Recent Albums:`
        let albums = document.createElement("ol")
        console.log(searchItem.id)

        const albumSearch = await fetch(`https://api.spotify.com/v1/artists/${searchItem.id}/albums`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        })
        let albumData = await albumSearch.json()
        console.log(albumData)
        albumData.items.forEach(item => {
            let track = document.createElement("li")
            track.textContent = item.name
            albums.append(track)
        })

        searchSection.append(newImage, titleHeader, trackSubtitle, albums)
    }

}

async function imageCheck(query) {
    if (searchSection.innerHTML != "") {
        searchSection.innerHTML = ""
        embedDiv.style.display - "none"
        assignQuery(query)
    } else {
        assignQuery(query)
    }
};

// Used AI to debug this event listener, wrapping it in a arrow function
searchButton.addEventListener("click", () => imageCheck(searchForm.value))
