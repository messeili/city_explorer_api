'use strict'

//app dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config();
const app = express();
//giving the access to any one with my heruko app link
app.use(cors());

//Define our PORT
const PORT = process.env.PORT || 3000;

//create an object from Client construction fo define which database I'm going to use
const client = new pg.Client(process.env.DATABASE_URL)

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

function locationHandler(req, res) {
    const cityData = req.query.city;
    let key = process.env.LOCATION_KEY;
    const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityData}&format=json`;

    let selectAllSQL = `SELECT * FROM city`;
    let selectSQL = `SELECT * FROM city WHERE search_query=$1`;
    let safeValues = [];
    client.query(selectAllSQL).then((result) => {
        if (result.rows.length <= 0) {
            superagent.get(url).then((data) => {
                console.log(`from API`);
                const locationData = new Location(data.body, cityData);
                insertLocationInDB(locationData);
                res.status(200).json(locationData);
            });
        } else {
            safeValues = [cityData];
            client.query(selectSQL, safeValues).then((result) => {
                if (result.rows.length <= 0) {
                    superagent.get(url).then((data1) => {
                        console.log(`From API Again`);
                        const locationData2 = new Location(data1.body, cityData);
                        insertLocationInDB(locationData2);
                        res.status(200).json(locationData2);
                    });
                } else {
                    console.log('form data base');
                    res.status(200).json(result.rows[0]);
                }
            });
        }
    });

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

function insertLocationInDB(obj) {
    let insertSQL = `INSERT INTO city (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4)`;
    let safeValues = [
        obj.search_query,
        obj.formatted_query,
        obj.latitude,
        obj.longitude,
    ];

    client.query(insertSQL, safeValues).then(() => {
        console.log('storing data in database');
    });
}

function handleNotFound(req, res) {
    res.status(404).send('NOT FOUND')

};

function errorHandler(error, req, res) {
    res.status(500).send(error);
};

function Location(location, cityData) {
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


client.connect()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Listening on PORT ${PORT}`)
        });
    });

