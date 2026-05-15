"use strict";

const http = require('http');
const path = require("path");
const express = require("express");
const app = express();
const router = express.Router();
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:false}));
app.set("views", path.resolve(__dirname, "templates"));
app.use(express.static(path.resolve(__dirname, "public")));
require("dotenv").config({
    path: path.resolve(__dirname, "environment/.env"),
 });
const mongoose = require("mongoose");
const City = require("./modules/City");

mongoose.connect(process.env.MONGO_CONNECTION_STRING)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error(err));


router.get('/', async (req, res) => {
    try {

        const response = await fetch(
            "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10",
            {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": process.env.GEODB_API_KEY,
                    "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
                }
            }
        );

        const data = await response.json();
        const sortedPlaces = data["data"].sort((place1, place2) => 
            place2["population"] - place1["population"]
        );
        // console.log(sortedPlaces);
        let top5Places = [];
        for(let i = 0; i < 5; i++) {
            top5Places.push({
                name: sortedPlaces[i]["name"],
                region: sortedPlaces[i]["region"],
                population: sortedPlaces[i]["population"]
            });
        }        
        const variables = {
            places: top5Places
        }
        res.render("homepage", variables);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch places" });
    }
    
});

router.post('/saveDestination', async (req, res) => {
    try {

        const response = await fetch(
            "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10",
            {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": process.env.GEODB_API_KEY,
                    "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
                }
            }
        );

        const data = await response.json();
        const foundCity = data["data"].find(city => req.body.name === city.name) ?? null;
        const city = await City.create({
                name: foundCity.name,
                region: foundCity.region,
                latitude: foundCity.latitude,
                longitude: foundCity.longitude,
                population: foundCity.population
              });
        const variables = {
            welcome: "wekcome"
        };
        res.redirect("/displaySavedDestinations");

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch places" });
    }
});


router.get('/displaySavedDestinations', async (req, res) => {
    try {
        const cities = await City.find();
    
        res.render("savedPlaces", {
          cities: cities
        });
    
      } catch (err) {
        console.error(err);
        res.status(500).send("Error loading cities");
      }

});

router.get('/clearDatabase', async (req, res) => {
    try {
        await City.deleteMany({});
        res.render("clear");
      } catch (err) {
        console.error(err);
        res.status(500).send("Error clearing database");
      }
});

router.post('/displayPlace', async (req, res) => {
    try {

        const response = await fetch(
            "https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=10",
            {
                method: "GET",
                headers: {
                    "X-RapidAPI-Key": process.env.GEODB_API_KEY,
                    "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
                }
            }
        );

        const data = await response.json();
        const cityName = req.body.cityName;
        const foundCity = data["data"].find(city => city["name"] === cityName) ?? null;
       
        const variables = {
            city: foundCity
        }
        if(foundCity === null) {
            res.render("noCity", variables);
        } else {
            res.render("displayPlace", variables);
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch places" });
    }
});

console.log(`Web server started and running at http://localhost:5001`);

process.stdin.on('readable', () => {
    const input = process.stdin.read();
    if (input !== null) {
        const command = input.trim();
        if (command == "stop") {
            process.stdout.write("Shutting down the server");
            process.exit(0);
        }
        process.stdin.resume();
    }
});

app.use("/", router)
app.use("/displaySavedDestinations", router);
app.use("/displayPlace", router);
app.listen(5001);




//   app.listen(3000, () => console.log("Server running on port 3000"));