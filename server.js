'use strict'

//app dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config();
const app = express();
//giving the access to any one with my heruko app link
app.use(cors());

//Define our PORT
const PORT = process.env.PORT || 3000;

//Define app routes
app.get('/', theMainHandler);
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler)
app.use('*', handleNotFound);
app.use(errorHandler);

//app functions

function theMainHandler(req, res) {
    res.status(200).send('you are doing great')
};

//localhost:3000/location?city=lynwood
function locationHandler(req, res) {
    const cityData = req.query.city;
    let key = process.env.LOCATION_KEY;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityData}&format=json`;
    //the purpose from the superagent is to get the data from the url
    superagent.get(url)
        .then(data => {
            let locationData = new Location(cityData, data.body);
            res.status(200).send(locationData);
        })
        .catch(() => errorHandler('Some Thing Went Wrong with location!!!', req, res));
};

function weatherHandler(req, res) {
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;
    const key2 = process.env.WEATHER_API_KEY;
    let url2 = `https://api.weatherbit.io/v2.0/forecast/daily?key=${key2}&lat=${latitude}&lon=${longitude}&days=8`;

    superagent.get(url2)
        .then(data => {
            let weatherData = data.body.data.map((item) => {
                return new Weather(item);

            })
            res.status(200).send(weatherData);
        })
        .catch(() => errorHandler('Some Thing Went Wrong with weather!!!', req, res));
};

function trailsHandler(req, res) {
    const latitude = req.query.latitude;
    const longitude = req.query.longitude;
    const key3 = process.env.TRAIL_API_KEY;
    let url3 = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${key3}`
    superagent.get(url3)
        .then(data => {
            console.log(data.body.trails);
            console.log(data);
            let trailsData = data.body.trails.map((element) => {
                return new Trails(element);
            });
            if (trailsData.length > 10) {
                trailsData = trailsData.splice(9, trailsData.length - 10)
            }
            res.status(200).send(trailsData);

        })
        .catch(() => errorHandler('Some Thing Went Wrong with trails!!!', req, res));

};

function handleNotFound(req, res) {
    res.status(404).send('NOT FOUND')

};

function errorHandler(error, req, res) {
    res.status(500).send(error);
};

function Location(cityData, location) {
    this.search_query = cityData;
    this.formatted_query = location[0].display_name;
    this.latitude = location[0].lat;
    this.longitude = location[0].lon;

}


function Weather(data) {
    this.forecast = data.weather.description;
    this.time = data.datetime;
}

function Trails(dataTwo) {
    this.name = dataTwo.name;
    this.location = dataTwo.location;
    this.length = dataTwo.length
    this.stars = dataTwo.stars;
    this.star_votes = dataTwo.starVotes;
    this.summary = dataTwo.summary;
    this.trail_url = dataTwo.url;
    this.conditions = dataTwo.conditionDetails;
    this.condition_date = dataTwo.conditionDate.split(' ')[0];
    this.condition_time = dataTwo.conditionDate.split(' ')[1];
};



app.listen(PORT, () => {
    console.log(`Listening on PORT ${PORT}`)
});