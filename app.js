/*
* Filename: app.js
* Author: Nathan Ben-David
* Description: The main application file. Runs the web server and loads the other files.
*/

// Imports the modules for running websites.
// Imports 'io.js' for reading and writing files.
// Imports the module for configuration.
const express = require('express');
const app = express();
const io = require('./io')
require('dotenv').config();

// Defines the hostname and port of the website from config '.env'.
const hostname = require('ip').address();
let port = parseInt(process.env.PORT);

// Validates the port with an existence check and a range check. Defaults to port 80 if invalid.
if (!port || port < 1 || port > 65535) {
    port = 443;
}

// Loads the previously saved data from data.xml into the global variable 'data'.
io.load();

// Starts the web server on the defined hostname and port.
app.listen(port, hostname, () => {
    console.log(`[${new Date().toLocaleTimeString()}] Alware-not-Malware started on http://${hostname}:${port}`);
});


// Loads the routes (how requests are handled) for the website. Sets the view engine to 'ejs'.
// Static files from '/public'
// Libraries from '/lib'
// Also allows handling of JSON requests and more.
// The custom webpages defined by the developers in '/routes/index.js'.
app.set('view engine', 'ejs');
app.use('/lib', express.static('node_modules'));
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use('/', require('./routes/index'));