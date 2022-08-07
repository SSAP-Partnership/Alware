/*
* Filename: routes/index.js
* Author: Nathan Ben-David
* Description: The route file. Handles all requests to the website.
*/

// Imports the Router module.
// Imports the hash module for password safety.
// Imports 'io.js' for reading and writing files.
const router = require('express').Router();
const bcrypt = require('bcrypt');
const io = require('../io');

/*
* Function: Retrieves the data from the data.xml file for a specific room.
* Input: The code for the room.
* Output: The Record containing the data for the room.
*/

function getRoom(code) {
    // If no room exists, return null.
    if (!global.data.rooms) {
        global.data.rooms = {};
        return;
    }

    // Get the existing rooms. Place them in an array if no array exists.
    global.data.rooms.room = global.data.rooms.room ? [].concat(global.data.rooms.room) : [];

    // Find the room with the matching code.
    return global.data.rooms.room.find(room => room['@_code'] === code);
}

/*
* Function: Creates a new empty room.
* Input: The code for the room and the hashed password for the room.
* Output: None.
*/

function createRoom(code, hash) {
    // If no storage for rooms exists, create one.
    if (!global.data.rooms) {
        global.data.rooms = {};
    }

    // If no array for rooms exists, create one.
    if (!global.data.rooms.room) {
        global.data.rooms.room = [];
    }

    // Create a Record for the room and add it to the array.
    global.data.rooms.room.push({
        '@_code': code,
        '@_password': hash,
    });
}

/*
* Function: Adds a user's schedule form to a room.
* Input: The code for the room and the form data to add.
* Output: None.
*/

function addForm(code, formData) {
    // Get the room and exit if it doesn't exist.
    const room = getRoom(code);
    if (!room) {
        return;
    }
    room.form = room.form ? [].concat(room.form) : [];

    // Parse the events into an XML friendly format.
    const events = JSON.parse(formData.events).map(event => {
        return {
            '@_start': event[0],
            '@_end': event[1]
        };
    })

    // Add the name, other and events fields to the form.
    const newForm = {
        '@_name': formData.name,
        '@_other': formData.other,
        'event': events
    };

    // Add the form to the room.
    room.form.push(newForm);
}

/*
* Function: Retrieves the submitted forms from the data.xml file for a specific room.
* Input: The code for the room.
* Output: The Record containing the forms for the room.
*/

function getForms(code) {
    // Get the room and exit if it doesn't exist.
    const room = getRoom(code);
    if (!room) {
        return;
    }
    room.form = room.form ? [].concat(room.form) : [];

    // Return a formatted list of the forms.
    return room.form.map(entry => {
        // Parse the data from an XML-friendly format to a JavaScript-friendly format.
        return {
            name: entry['@_name'],
            other: entry['@_other'],
            events: entry.event.map(event => {
                return [event['@_start'], event['@_end']];
            })
        }
    });
}

/*
* GET REQUESTS
* '/' - Loads the homepage.
* '/submit' - Loads the submission page.
* '/view' - Loads the viewing page.
* '/admin/close' - Loads the page to shut down the site (admin-only).
 */
router.get('/', (req, res) => {
    // Serve the homepage files to the user.
    res.render(__dirname + '/../views/homepage.ejs');
});
router.get('/submit', (req, res) => {
    // Verify that the room specified in the URL exists.
    const room = getRoom(req.query.code);

    if (!room) {
        return res.redirect('/');
    }

    // Serve the submission page to the user.
    res.render(__dirname + '/../views/submit.ejs');
});
router.get('/view', (req, res) => {
    // Verify that the room specified in the URL exists.
    const room = getRoom(req.query.code);

    if (!room) {
        return res.redirect('/');
    }

    // Serve the viewing page to the user.
    res.render(__dirname + '/../views/view.ejs');
});
router.get('/admin/close', (req, res) => {
    // Serve the closing page to the user.
    res.render(__dirname + '/../views/admin/close.ejs');
});

/*
* GET REQUESTS
* '/create' - Creates a new room.
* '/join' - Joins an existing room.
* '/send' - Submits the form data to the data.xml file.
* '/auth' - Authenticate a user when they submit and view a room.
* '/admin/close' - Authenticate an admin when they shut down the site.
 */
router.post('/create', (req, res) => {

    const code = req.body.code;
    const password = req.body.password;

    // Simple password existence and range validation (8-32 characters).
    // In a production environment, this should be handled by a more secure system.
    if (code.length < 1 || password.length < 1) {
        return res.send(JSON.stringify({error: 'Please fill out all fields'}));
    }
    if (code.length > 32) {
        return res.send(JSON.stringify({error: 'Name must be less than 32 characters'}));
    }
    if (password.length < 8) {
        return res.send(JSON.stringify({error: 'Password must be at least 8 characters'}));
    }
    if (password.length > 32) {
        return res.send(JSON.stringify({error: 'Password must be less than 32 characters'}));
    }

    // Hash the password.
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Return an error if the room already exists.
    let room = getRoom(code);
    if (room) {
        return res.send(JSON.stringify({
            error: 'Room already exists. Please choose a different name.'
        }));
    }

    createRoom(code, hash);

    // Redirect the user to the submission page of their new room.
    res.send(JSON.stringify({
        redirect: `/submit?code=${code}`
    }));
});
router.post('/join', (req, res) => {
    const code = req.body.code;

    // Simple code validation (1-32 characters).
    if (code.length < 1) {
        return res.send(JSON.stringify({error: 'Please fill out all fields'}));
    }
    if (code.length > 32) {
        return res.send(JSON.stringify({error: 'Name must be less than 32 characters'}));
    }

    // Confirm that the room exists.
    const room = getRoom(code);
    if (!room) {
        return res.send(JSON.stringify({error: `That room doesn't exist.`}));
    }

    // Allow the user to join the room.
    res.send(JSON.stringify({
        redirect: `/submit?code=${code}`
    }));
});
router.post('/send', (req, res) => {
    const room = getRoom(req.query.code);

    // Verify that the room exists AND that the password is correct.
    if (!req.body.auth || !room || !(room['@_password'] === req.body.auth)) {
        return res.send(JSON.stringify({
            success: false,
            redirect: '/'
        }));
    }

    addForm(req.query.code, req.body);

    // Redirect the user to the viewing page of the room.
    res.send(JSON.stringify({
        success: true,
        redirect: `/view?code=${req.query.code}`
    }));
});
router.post('/auth', (req, res) => {
    const code = req.query.code;
    const password = req.body.password;

    // Confirm the room exists
    const room = getRoom(code);

    if (!room) {
        return res.send(JSON.stringify({
            redirect: `/`
        }));
    }

    // Verify that the password is correct.
    if (bcrypt.compareSync(password, room['@_password'])) {
        const forms = getForms(code);

        // Send a success message to the user as well as the form data.
        res.send(JSON.stringify({
            success: true,
            token: room['@_password'],
            forms: JSON.stringify(forms),
        }));
    } else {
        res.send(JSON.stringify({
            success: false,
        }));
    }
});
router.post('/admin/close', (req, res) => {
    // Run an existence check on the password.
    // Check that the password is correct.
    // In a production environment, this should be handled by a more secure system.
    if (req.body['pass'] && req.body['pass'] === process.env.ADMIN_PASSWORD) {
        res.send('Server closed.');

        // Save all changes to the data.xml file.
        io.save();

        console.log(`[${new Date().toLocaleTimeString()}] Alware-not-Malware closed`);

        // Shutdown the server
        process.exit(0);
    } else {
        res.send('Incorrect password.');
    }
});

// Make the Router public so that it can be accessed from 'app.js'.
module.exports = router;