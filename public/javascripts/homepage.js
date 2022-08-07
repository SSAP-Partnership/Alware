/*
* Filename: public/javascripts/homepage.js
* Author: Nathan Ben-David
* Description: Client-side code for the website homepage.
*/

/*
* Function: Helper method for making a POST request.
* Input: The URL to post to and the data to post.
* Output: A promise that resolves to the response.
*/

function post(url, data) {
    return fetch(url, {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
}

/*
* Function: Hides the popup modals.
* Input: The modal to hide.
* Output: None.
*/

function hideModal(modal) {
    modal.classList.add('hidden');

    document.body.style.overflow = 'auto'
}

/*
* Function: Shows the popup modals.
* Input: The modal to show.
* Output: None.
*/

function showModal(modal) {
    modal.classList.remove('hidden');

    document.body.style.overflow = 'hidden';

    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

// Runs when the page is initially loaded.
window.onload = () => {
    // Define all the elements on the page that will be used.

    const modalClose = document.getElementsByClassName('modalClose');
    const modalCancel = document.getElementsByClassName('modalCancel');

    const createBtn = document.getElementById('createBtn');
    const createModal = document.getElementById('createModal');
    const createSubmit = document.getElementById('createSubmit');
    const createError = document.getElementById('createError');

    const joinBtn = document.getElementById('joinBtn');
    const joinModal = document.getElementById('joinModal');
    const joinSubmit = document.getElementById('joinSubmit');
    const joinError = document.getElementById('joinError');
    const joinCode = document.getElementById('joinCode');

    const createCode = document.getElementById('createCode');
    const createPassword = document.getElementById('createPassword');
    const createPassword2 = document.getElementById('createPassword2');

    // Show the create modal when the create button is clicked.
    // Show the join modal when the join button is clicked.
    createBtn.onclick = () => showModal(createModal);
    joinBtn.onclick = () => showModal(joinModal);

    // Handle the creation of a room.
    createSubmit.onclick = () => {
        // Run some simple password validation.
        // In a production environment, this would be handled by a more robust system.
        if (createCode.value.length < 1 || createPassword.value.length < 1 || createPassword2.value.length < 1) {
            createError.innerHTML = 'Please fill out all fields';
            return;
        }
        if (createCode.value.length > 32) {
            createError.innerHTML = 'Name must be less than 32 characters';
            return;
        }
        if (createPassword.value !== createPassword2.value) {
            createError.innerHTML = 'Passwords do not match';
            return;
        }
        if (createPassword.value.length < 8) {
            createError.innerHTML = 'Password must be at least 8 characters';
            return;
        }
        if (createPassword.value.length > 32) {
            createError.innerHTML = 'Password must be less than 32 characters';
            return;
        }

        // Send the request to create a room.
        post('/create', {
            code: createCode.value,
            password: createPassword.value,
        })
            .then(res => {
                return res.json();
            })
            .then(res => {
                // Display any errors from the server.
                if (res.error) {
                    createError.innerHTML = res.error;
                }

                // Redirect to the room if successful.
                if (res.redirect) {
                    window.location.href = res.redirect;
                }
            });
    };

    // Handle the joining of a room.
    joinSubmit.onclick = () => {
        // Run some simple code validation.
        // In a production environment, this would be handled by a more robust system.
        if (joinCode.value.length < 1) {
            createError.innerHTML = 'Please fill out all fields';
            return;
        }
        if (joinCode.value.length > 32) {
            createError.innerHTML = 'Name must be less than 32 characters';
            return;
        }

        // Send the request to join a room.
        post('/join', {
            code: joinCode.value,
        })
            .then(res => {
                return res.json();
            })
            .then(res => {
                // Display any errors from the server.
                if (res.error) {
                    joinError.innerHTML = res.error;
                }

                // Redirect to the room if successful.
                if (res.redirect) {
                    window.location.href = res.redirect;
                }
            });
    }

    // Close the modals if the user clicks out of the box.
    window.onclick = event => {
        if (event.target === createModal) {
            hideModal(createModal);
        }

        if (event.target === joinModal) {
            hideModal(joinModal);
        }
    }

    // Close the modals if the user clicks the X button.
    for (const closeBtn of modalClose) {
        closeBtn.onclick = () => {
            hideModal(createModal);
            hideModal(joinModal);
        }
    }

    // Close the modals if the user clicks the cancel button.
    for (const cancelBtn of modalCancel) {
        cancelBtn.onclick = () => {
            hideModal(createModal);
            hideModal(joinModal);
        }
    }
}