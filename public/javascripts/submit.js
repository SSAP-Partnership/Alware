/*
* Filename: public/javascripts/submit.js
* Author: Nathan Ben-David
* Description: Client-side code for the website submission page.
*/

/*
* Function: Shows the popup modals.
* Input: The modal to show.
* Output: None.
*/

function hideModal(modal) {
    modal.classList.add('hidden');

    document.body.style.overflow = 'auto'
}

/*
* Function: Copies the current URL to the clipboard.
* Input: The text to copy.
* Output: None.
*/

function copyTextToClipboard(text) {
    // Creates a fake textarea element, sets its value from `text` property,
    const textArea = document.createElement("textarea");

    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    textArea.value = text;

    document.body.appendChild(textArea);

    // Selects the text inside the textarea

    textArea.focus();
    textArea.select();

    // Copies the text to the clipboard

    document.execCommand('copy');

    // Deletes the textarea

    document.body.removeChild(textArea);
}

/*
* Function: Helper method for making a POST request.
* Input: The URL to post to and the data to post.
* Output: A promise that resolves to the response.
*/

function post(url, data) {
    return fetch(url, {method: "POST", headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)});
}

/*
* Function: Configures and renders the calendar widget.
* Input: None.
* Output: None.
*/

function loadCalendar() {
    const calendarEl = document.getElementById('calendar');

    // Settings for the calendar
    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listYear'
        },

        editable: true,
        selectable: true,
        selectMirror: true,
        unselectAuto: false,
        droppable: true,
        eventResizableFromStart: true,
        scrollTimeReset: false,

        select: function (info) {
            // Creates an event when a date is selected.
            calendar.addEvent({
                start: info.start,
                end: info.end,
                allDay: info.allDay,
                title: '',
            });

            // Reloads the calendar to show the new event properly.
            calendar.incrementDate('00:00:00');
        },
        eventClick: function (info) {
            // Removes an event when it is clicked.
            info.event.remove();
        },
    });

    window.calendar.render();
}

/*
* Function: Adds functionality to the buttons on the page.
* Input: None.
* Output: None.
*/

function loadButtons() {
    const btnBarError = document.getElementById('btnBarError');

    const homeButton = document.getElementById('homeBtn');
    const shareButton = document.getElementById('shareBtn');
    const viewButton = document.getElementById('resultBtn');

    homeButton.onclick = () => {
        window.location.href = '/';
    };

    shareButton.onclick = () => {
        copyTextToClipboard(window.location.href);

        btnBarError.innerText = 'Link copied to clipboard!';

        setTimeout(() => {
            btnBarError.innerText = '';
        }, 3000);
    };

    viewButton.onclick = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        window.location.href = `/view?code=${code}`;
    };

    const formName = document.getElementById('formName');
    const formOther = document.getElementById('formOther');
    const formSubmit = document.getElementById('formSubmit');

    formSubmit.onclick = () => {
        if (!window.authToken) {
            return window.location.href = '/';
        }

        const urlParams = new URLSearchParams(window.location.search);

        const events = window.calendar.getEvents()
            .map(event => {
                return [event.start, event.end];
            });

        post(`/send?code=${urlParams.get('code')}`, {
            auth: window.authToken,
            name: formName.value,
            other: formOther.value,
            events: JSON.stringify([...events]),
        })
            .then(res => {
                return res.json();
            })
            .then(res => {
                window.location.href = res.redirect;
            });
    };
}

/*
* Function: Displays the login modal and handles authentication.
* Input: None.
* Output: None.
*/

function loadLogin() {
    // Define the layout elements that will be used.
    const loginModal = document.getElementById('loginModal');
    const loginError = document.getElementById('loginError');
    const modalCancel = document.getElementById('modalCancel');
    const modalSubmit = document.getElementById('modalSubmit');
    const modalPassword = document.getElementById('modalPassword');

    // Redirect to the home page if the user clicks the cancel button.
    modalCancel.onclick = () => {
        window.location.href = '/';
    }

    // Handle the login button.
    modalSubmit.onclick = () => {
        // Retrieves the room code from the URL.
        const urlParams = new URLSearchParams(window.location.search);

        // Sends the code and password to the server.
        post(`/auth?code=${urlParams.get('code')}`, {
            password: modalPassword.value
        })
            .then(res => {
                return res.json()
            })
            .then(res => {
                // If the server returns a redirect, redirect to the new page.
                if (res.redirect) {
                    window.location.href = res.redirect;
                }

                if (res.success && res.token) {
                    // If the server returns a token, store it in the global variable for submission.
                    // Hide the login popup.
                    window.authToken = res.token;
                    hideModal(loginModal);
                } else {
                    // If the server returns an error, display it.
                    modalPassword.value = '';
                    loginError.innerText = 'Invalid password';
                }
            });
    }
}

// Runs when the page is initialized.
window.onload = () => {
    loadCalendar();
    loadButtons();
    loadLogin();
};

