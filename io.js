/*
* Filename: io.js
* Author: Nathan Ben-David
* Description: Handles data and files.
*/

// Import the module for reading/writing files.
// Import the module for converting JS to XML and vice versa.
const fs = require('fs');
const {XMLBuilder, XMLParser} = require('fast-xml-parser');

// Configures the XML parser and builder.
const builder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
});
const parser = new XMLParser({
    ignoreAttributes: false,
    allowBooleanAttributes: true,
});

/*
* Function: Converts the data to XML and writes it to the file.
* Input: None.
* Output: None.
*/

function save() {
    fs.writeFileSync('./data.xml', JSONtoXML(global.data), 'utf-8');
}

/*
* Function: Loads the data from the file, converts it to JS, into the global variable 'data'.
* Input: None.
* Output: None.
*/

function load() {
    global.data = {};

    if (fs.existsSync('./data.xml')) {
        global.data = XMLtoJSON(fs.readFileSync('./data.xml', 'utf-8'));
    }
}

// Converts the XML to JS using the module.
function XMLtoJSON(xml) {
    return parser.parse(xml);
}

// Converts the JS to XML using the module.
function JSONtoXML(json) {
    return builder.build(json);
}

// Make the save and load methods available to the rest of the application.
module.exports = {
    save,
    load
};