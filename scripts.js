// used AI to help understand and import keys and cover error handling
import { CLIENT_ID, CLIENT_SECRET } from './config.js'

let accessToken;

// try and catch block for the authentication of my API token
try {
    //tries to fetch an api token using my credentials, placed in config.js which are ignored by git
    const authentication = await fetch(`https://accounts.spotify.com/api/token`, {
        method: 'POST',
        headers: {
            //validates the request and encodes the combined client id and client secret using btoa()
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)
        },
        body: `grant_type=client_credentials`
    });

    //if the authentication fails, generate an error message
    if (!authentication.ok) {
        throw new Error(`Authentication Failed: ${authentication.status}`)
    }
    //turning the snake case variable into camelCase: AI helped me to do this as Spotify returns snake case by default
    const { access_token } = await authentication.json()
    accessToken = access_token

    //if theres any other errors with authentication, display an error message with a header
} catch (error) {
    let tokenError = document.createElement("h2")
    tokenError.textContent = `Token Error: ${error}`
}

// declare variables for JSON data and divs for the Spotify embed to sit in
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
// used AI to implement searched tracks into the embed wrapper
let pendingEmbedUrl = null;
let embedController = null;

//function uses the Spotify embed API to create an embedded link when a user searches for a track that can be played on Spotify.
window.onSpotifyIframeApiReady = (IFrameAPI) => {
    const options = {
        width: '100%',
        height: '250',
    };

    //uses the url of the searched track as the url for the embed
    if (pendingEmbedUrl) {
        options.url = pendingEmbedUrl
    }

    //creates a controller in the div, using the url of the searched track
    IFrameAPI.createController(embedDiv, options, (controller) => {
        embedController = controller
        if (pendingEmbedUrl) {
            embedController.loadEntity(pendingEmbedUrl)
        }
    })
};

// grab and declare as variables the search input and output sections of the HTML
const dropdown = document.getElementById("typeOfSearch");
const searchForm = document.getElementById("userSearch");
const searchButton = document.getElementById("enterButton");
const searchSection = document.getElementById("searchSection")

//main async function for searching 
async function assignQuery(query) {
    //used AI to help debug spelling errors and incorrect elements 
    searchTerm = query

    //if there is no search term when the user presses search, display an error message
    if (!searchTerm) {
        let errorMessage = document.createElement("h2")
        errorMessage.textContent = `Please enter a search term.`
        searchSection.append(errorMessage)
    } else {
        //try catch block containing most of the search code
        try {

            //try to fetch using the Spotify Search endpoint, taking the user's searched item and whatever value is in the dropdown
            const searchFor = await fetch(`https://api.spotify.com/v1/search?q=${searchTerm}&type=${dropdown.value}&limit=1`, {
                headers: {
                    //gets authorization through the access token generated earlier
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            //if there is an error with the search, display an error message. Pretty rare to see but still possible if a user inputs nonsense characters
            if (searchFor.error) {
                let errorMessage = document.createElement("h2")
                errorMessage.textContent = "Sorry, we couldn't find anything. Please try searching again."
            } else {
                //searchData holds the JSON data
                searchData = await searchFor.json()

                //checks what kind of search it is based on the dropdown, and assigns searchItem to either the artist, album, or track for the next endpoint searches
                if (dropdown.value == "artist") {
                    searchItem = searchData.artists.items[0]
                } else if (dropdown.value == "album") {
                    searchItem = searchData.albums.items[0]
                } else {
                    searchItem = searchData.tracks.items[0]
                }

                //displays the image of the searched item by generating an image tag with the src value of the image Spotify responds with
                let newImage = document.createElement("img")
                newImage.classList.add('img-fluid', 'rounded')
                if (dropdown.value == "track") {
                    newImage.src = searchItem.album.images[0].url
                } else {
                    newImage.src = searchItem.images[0].url
                }

                //Shows a header of the search's name. Spotify's search autocorrects and capitalizes names
                let titleHeader = document.createElement("h2")
                titleHeader.textContent = searchItem.name

                //if the user is searching for an album:
                if (dropdown.value == "album") {
                    //don't display the embed wrapper and pause the song if it's playing
                    embedWrapper.style.display = "none"
                    embedController?.pause()
                    //create DOM elements for the name, release date, and tracklist of the album
                    let artistSubtitle = document.createElement("h3")
                    artistSubtitle.textContent = `By ${searchItem.artists[0].name}`
                    let yearSubtitle = document.createElement("h3")
                    yearSubtitle.textContent = `Released in ${searchItem.release_date.slice(0, 4)}`
                    let trackSubtitle = document.createElement("h3")
                    trackSubtitle.textContent = "Tracklist:"
                    let trackList = document.createElement("ol")

                    //uses the search to go to the Album endpoint, using the unique Spotify id of the album
                    const albumTrackSearch = await fetch(`https://api.spotify.com/v1/albums/${searchItem.id}/tracks`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    })
                    //albumData holds the JSON data, and a for each loop is used to add the full tracklist to the organized list HTML element
                    let albumData = await albumTrackSearch.json();
                    albumData.items.forEach(item => {
                        let track = document.createElement("li")
                        track.textContent = item.name
                        trackList.append(track)
                    })

                    //append all this information to the search section (this is done in each branch)
                    searchSection.append(newImage, titleHeader, artistSubtitle, yearSubtitle, trackSubtitle, trackList)
                    //if the user searches for a song:
                } else if (dropdown.value == "track") {
                    //create DOM elements for the song's name, what album it's from, who made it, and when it was released
                    let artistSubtitle = document.createElement("h3")
                    artistSubtitle.textContent = `By ${searchItem.artists[0].name}`
                    let albumSubtitle = document.createElement("h3")
                    albumSubtitle.textContent = `From: ${searchItem.album.name} Released in ${searchItem.album.release_date.slice(0, 4)}`
                    
                    //check what the width of the screen is (checking for mobile users)
                    let screenWidth = document.documentElement.clientWidth
                    //if the song can be played and if the user is not on mobile, display the embed. Embeds are too large for mobile screens
                    if (searchItem.is_playable == true && screenWidth > 460) {
                        //set the embedUrl to the url of the song, so the embed function can display the correct song
                        let embedUrl = searchItem.external_urls.spotify
                        //display the hidden embed wrapper
                        embedWrapper.style.display = "block"
                        pendingEmbedUrl = embedUrl
                        if (embedController) {
                            //create the embed
                            embedController?.loadEntity(embedUrl)
                        }
                        //if neither are true:
                    } else {
                        //hide the wrapper and pause playback
                        embedWrapper.style.display = "none"
                        embedController?.pause()

                    }

                    searchSection.append(newImage, titleHeader, artistSubtitle, albumSubtitle)
                    //if the user searches for an artist:
                } else {
                    //hide the embed wrapper again
                    embedWrapper.style.display = "none"
                    //create DOM elements for the artist's recent albums
                    let albumSubtitle = document.createElement("h3")
                    albumSubtitle.textContent = `Recent Albums:`
                    let albums = document.createElement("ol")

                    //similar process to the tracklist when searching for an album: use the Get Artist's Albums endpoint to list the five most recent albums the artist's released
                    const albumSearch = await fetch(`https://api.spotify.com/v1/artists/${searchItem.id}/albums`, {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    })
                    let albumData = await albumSearch.json()
                    //use a for each loop to display the albums
                    albumData.items.forEach(item => {
                        let track = document.createElement("li")
                        track.textContent = item.name
                        albums.append(track)
                    })

                    searchSection.append(newImage, titleHeader, albumSubtitle, albums)
                }
            }

            //if there's an error, display an error message
        } catch (error) {
            let errorMessage = document.createElement("h2")
            errorMessage.textContent = `Sorry, something went wrong. Please try searching again.`
            searchSection.append(errorMessage)
        }
    }
}

//async function checking if something has already been searched
async function imageCheck(query) {
    if (searchSection.innerHTML != "") {
        //if theres something in the div already, clear it and hide the embed wrapper, then run the function
        searchSection.innerHTML = ""
        embedWrapper.style.display - "none"
        assignQuery(query)
    } else {
        //if theres nothing in the div, run the function as normal
        assignQuery(query)
    }
};

// Used AI to debug this event listener, wrapping it in a arrow function
searchButton.addEventListener("click", () => imageCheck(searchForm.value))
