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
const searchForm = document.getElementById("userSearch");
const searchButton = document.getElementById("enterButton");
async function assignQuery(query) {
    //used AI to help debug spelling errors and incorrect elements 
    console.log(searchForm.value)
    searchTerm = query

    const searchFor = await fetch(`https://api.spotify.com/v1/search?q=${searchTerm}&type=artist&limit=1`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    searchData = await searchFor.json()
    console.log(searchData)
    //TODO: create a variable to store the endpoint, then going from there
};

// Used AI to debug this event listener, wrapping it in a arrow function
searchButton.addEventListener("click", () => assignQuery(searchForm.value))
