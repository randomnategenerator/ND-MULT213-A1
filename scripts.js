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
const { access_token : accessToken } = await authentication.json()

const searchArtist = await fetch(`https://api.spotify.com/v1/artists/0TnOYISbd1XYRBk9myaseg`, {
    headers: {
        'Authorization': `Bearer ${accessToken}`
    }
});
const searchedArtist = await searchArtist.json();
console.log(searchedArtist.images[0].url)