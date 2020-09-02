'use strict'

const express = require('express');
// const { request, response } = require('express');
require('dotenv').config();

const cors = require('cors');

const superagent = require('superagent');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(cors());

app.get('/', (request, response) => {
    response.status(200).send('you are doing great')
});


//localhost:3000/location?city=lynwood
app.get('/location', (req, res) => {
    // const location = require('./data/location.json');
    // console.log(location);
    const cityData = req.query.city;
    let key = process.env.LOCATION_KEY;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityData}&format=json`;

    superagent.get(url)
        .then(data => {
            let locationData = new Location(cityData, data.body);
            res.send(locationData);
        })
        .catch(error => errorHandler(error, req, res))
});

app.get('/weather', (req, res) => {
    allWeather = [];
    const weatherData = require('./data/weather.json');

    weatherData.data.forEach((item) => {
        new Weather(item);
    });

    res.status(200).send(allWeather);
});



function Location(cityData, location) {
    this.search_query = cityData;
    this.formatted_query = location[0].display_name;
    this.latitude = location[0].lat;
    this.longitude = location[0].lon;

}

let allWeather = [];
function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
    allWeather.push(this);
}

app.use('*', (req, res) => {
    res.status(404).send('NOT FOUND')

});

function errorHandler(error, req, res) {
    res.status(500).send(error);
};

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Litening on PORT ${PORT}`)
});