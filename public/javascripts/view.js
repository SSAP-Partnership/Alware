/*
* Filename: public/javascripts/view.js
* Author: Nathan Ben-David
* Description: Client-side code for the website viewing page.
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

    textArea.focus();
    textArea.select();

    document.execCommand('copy');

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

    // Settings for the calendar.
    window.calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listYear'
        },

        scrollTimeReset: false,
    });

    window.calendar.render();
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

        // Posts the password and code to the server for authentication.
        post(`/auth?code=${urlParams.get('code')}`, {
            password: modalPassword.value
        })
            .then(res => {
                return res.json()
            })
            .then(res => {
                // If the server sends a redirect, go to that page.
                if (res.redirect) {
                    window.location.href = res.redirect;
                }

                if (res.success && res.forms) {
                    // If the server sends a success message, hide the popup and show the viewing data.
                    calcEvents(JSON.parse(res.forms));
                    hideModal(loginModal);
                } else {
                    // If the server sends an error message, show the error message.
                    modalPassword.value = '';
                    loginError.innerText = 'Invalid password';
                }
            });
    }
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
    const submitBtn = document.getElementById('submitBtn');

    // Redirect to the home page when the HOME button is pressed.
    homeButton.onclick = () => {
        window.location.href = '/';
    };

    // Copy the current URL to the clipboard when the SHARE button is pressed.
    shareButton.onclick = () => {
        copyTextToClipboard(window.location.href);

        // Show a success message then remove it after 3 seconds.
        btnBarError.innerText = 'Link copied to clipboard!';
        setTimeout(() => {
            btnBarError.innerText = '';
        }, 3000);
    };

    // Redirect to the submission page when the SUBMIT button is pressed.
    submitBtn.onclick = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        window.location.href = `/submit?code=${code}`;
    };
}

/*
* Function: Calculates and formats the viewing data.
* Input: The viewing data.
* Output: None.
*/

function calcEvents(forms) {
    /*
    * Function: Calculates the optimal time and sorts the data by optimalism in descending order.
    * Input: The raw viewing data to calculate optimalism for.
    * Output: The sorted viewing data.
    */

    function formatEvents(inputEvents) {
        // Transform the raw data into one long list of all the dates.
        const datesSorted = inputEvents.flat(2).map(date => Date.parse(date)).sort((dateA, dateB) => dateA - dateB);
        const outputEvents = [];

        // Iterate through all the dates.
        for (let i = 0; i < datesSorted.length - 1; i++) {

            // Skip if both dates are the same
            if (datesSorted[i] === datesSorted[i + 1]) {
                continue;
            }

            // Transform the raw data into one long list of all the date RANGES
            let dateRanges = [...inputEvents].flat(1);

            // Iterate through all the date ranges and see how frequently each date occurs.
            const frequency = dateRanges.filter(range => {
                    const start = Date.parse(range[0]);
                    const end = Date.parse(range[1]);

                    return start !== end && start <= datesSorted[i] && end >= datesSorted[i + 1];
                }
            ).length;

            // Add the date range and frequency to the output list.
            if (frequency > 0) {
                outputEvents.push({
                    start: datesSorted[i],
                    end: datesSorted[i + 1],
                    frequency: frequency
                });
            }

            // Sort the output list by frequency in descending order.
            outputEvents.sort((rangeA, rangeB) => rangeB.frequency - rangeA.frequency);
        }

        return outputEvents;
    }

    // Remove unnecessary fields from the form data.
    const rawEvents = forms.map(entry => {
        return entry.events;
    });

    // Calculate the optimal time for each form and parse them in a format that the calendar widget can use.
    const formattedEvents = formatEvents(rawEvents).map(event => {
        return {
            start: new Date(event.start),
            end: new Date(event.end),
            frequency: event.frequency
        }
    });

    // Define the minimum and maximum points for colour and frequency.
    // The following code will set the colour of the event based on the frequency.
    const maxFrequency = Math.max(...formattedEvents.map(event => event.frequency));
    const minFrequency = 1;
    const maxColour = {r: 217, g: 76, b: 44};
    const minColour = {r: 77, g: 52, b: 46};

    formattedEvents.forEach(event => {
        // Calculate the colour of the event in the specified range.
        const colour = {
            r: (event.frequency - minFrequency) / (maxFrequency - minFrequency) * (maxColour.r) + (minColour.r),
            g: (event.frequency - minFrequency) / (maxFrequency - minFrequency) * (maxColour.g) + (minColour.g),
            b: (event.frequency - minFrequency) / (maxFrequency - minFrequency) * (maxColour.b) + (minColour.b),
        }

        // Add the event to the calendar widget.
        window.calendar.addEvent({
            start: event.start,
            end: event.end,
            title: event.frequency === maxFrequency ? 'Optimal time' : '',
            backgroundColor: `rgb(${colour.r},${colour.g},${colour.b})`,
            borderColor: `rgb(${colour.r},${colour.g},${colour.b})`,
        })
    });

    // Remove unnecessary fields from the form data.
    const viewData = forms.map(entry => {
        return {name: entry.name, other: entry.other};
    });

    const formPanel = document.getElementById('formPanel');

    // Iterate through all the submissions and add their details to the page.
    // Create a label, tooltip (hover), and empty line for each submission.
    viewData.forEach(entry => {
        const div = document.createElement('div');
        div.classList.add('tooltip');
        div.innerText = (entry.name.length > 0 ? `${entry.name}'s Submission` : 'Anonymous Submission');

        const span = document.createElement('span');
        span.classList.add('tooltipText');
        span.innerText = (entry.other.length > 0 ? entry.other : 'No additional information');

        const br = document.createElement('br');

        div.appendChild(span);
        formPanel.appendChild(div);
        formPanel.appendChild(br);
    });
}

// Runs when the page finishes loading.
window.onload = () => {
    loadButtons();
    loadLogin();
    loadCalendar();
};
