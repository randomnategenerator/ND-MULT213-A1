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
    console.log(searchItem)

    let newImage = document.createElement("img")
    if (dropdown.value == "track") {
        newImage.src = searchItem.album.images[0].url
    } else {
        newImage.src = searchItem.images[0].url
    }
    let titleHeader = document.createElement("h2")
    titleHeader.textContent = searchItem.name
    if (dropdown.value == "album") {
        let artistSubtitle = document.createElement("h3")
        artistSubtitle.textContent = `By ${searchItem.artists[0].name}`
        let yearSubtitle = document.createElement("h3")
        yearSubtitle.textContent = `Released in ${searchItem.release_date.slice(0,4)}`
        let trackSubtitle = document.createElement("h3")
        trackSubtitle.textContent = "Tracklist:"

        let trackList = document.createElement("ol")
        const albumTrackSearch = await fetch(`https://api.spotify.com/v1/albums/${searchItem.id}/tracks`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        } })
        let albumData = await albumTrackSearch.json();
        console.log(albumData.items)
        albumData.items.forEach(item => {
            let track = document.createElement("li")
            track.textContent = item.name
            trackList.append(track)
        })
        
        searchSection.append(newImage, titleHeader, artistSubtitle, yearSubtitle, trackSubtitle, trackList)
    } else if (dropdown.value == "track") {
        searchSection.append(newImage, titleHeader)
    } else {
        searchSection.append(newImage, titleHeader)
    }

}

async function imageCheck(query) {
    if (searchSection.innerHTML != "") {
        searchSection.innerHTML = ""
        assignQuery(query)
    } else {
        assignQuery(query)
    }
};

// Used AI to debug this event listener, wrapping it in a arrow function
searchButton.addEventListener("click", () => imageCheck(searchForm.value))
