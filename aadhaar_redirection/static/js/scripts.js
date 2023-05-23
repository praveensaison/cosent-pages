let domain = window.location.origin.replace('aadhaarredirection', 'api');

let url = new URL(window.location.href);
const token = url.searchParams.get("token");
const errorPage = 'pages/ErrorPage.html';
const error404Page = 'pages/Error404.html';
const thankYouPage = 'pages/ThankYou.html';
const api_url = `https://a8fm3nym3g.execute-api.eu-west-1.amazonaws.com/qa2/api/v1/process-aadhaar`;

if (!token) {
    window.location.href = errorPage;
}

function formatAndValidateAadhaarInput(input) {
    var inputValue = input.value;
    var digitsOnly = inputValue.replace(/\D/g, ""); // Remove non-digit characters
    input.value = digitsOnly;
    let value = input.value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
    input.value = value;

    let button = document.getElementById("generateOtpButton");
    button.disabled = input.value.length !== 14; // Disable the button if Aadhaar number length is not 14
    button.style.backgroundColor = button.disabled ? "gray" : "#004097"; // Change button background color to gray if disabled
}

var requestId = "";
var aadhaarNo = "";

function generateOtp() {
    console.log("submitAadhaar");

    var countdown = 30; // Countdown in seconds

    var button = document.getElementById("generateOtpButton");
    var aadhaarInput = document.getElementById("aadhaarInput");

    button.disabled = true; // Disable the button
    button.style.backgroundColor = "#CCCCCC"; // Change button color
    aadhaarInput.readOnly = true; // Make input read-only
    aadhaarInput.style.backgroundColor = "#D3D3D3"; // Change input background color

    // Function to update the button text with the remaining countdown
    function updateButton() {
        button.innerText = "Resend Otp (" + countdown + "s)";
        countdown--;
        if (countdown >= 0) {
            setTimeout(updateButton, 1000); // Update every 1 second
        } else {
            button.disabled = false; // Enable the button after countdown
            button.style.backgroundColor = "#004097"; // Restore button color
            aadhaarInput.readOnly = false; // Make input editable again
            aadhaarInput.style.backgroundColor = "#F0F0F0"; // Restore input background color
            button.innerText = "Resend Otp"; // Update button text to "Resend Otp"
        }
    }

    updateButton(); // Start the countdown

    aadhaarNo = aadhaarInput.value.replace(/\s/g, ""); // Remove spaces from aadhaarNumber
    if (aadhaarNo.length !== 12) {
        document.getElementById("aadhaarErrorMessage").style.display = "block";
        return; // Return early if Aadhaar number length is not 12
    }

    const requestBody = {
        aadhaarNo: aadhaarNo
    };
    const other_params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(requestBody)
    };

    fetch(api_url, other_params)
        .then(response => {
            // handle the response
            console.log(response);
            if (response.status === 200) {
                return response.json(); // Parse the response JSON
            } else if (response.status === 404) {
                window.location.href = error404Page;
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200
            }
        })
        .then(data => {
            // Store the requestId and aadhaarNumber from the response data
            requestId = data.requestId;
            aadhaarNo = data.aadhaarNumber;
            // Handle the response and show OTP section if status is 200
            // Otherwise, show an error message
            if (requestId) {
                document.getElementById("aadhaarErrorMessage").style.display = 'none';
                document.getElementById("otpSection").style.display = "block";
            } else {
                window.location.href = errorPage;
            }
        })
        .catch(error => {
            console.log(error, 'e');
            window.location.href = errorPage;
        });
}

function handleOtp(event) {
    const input = event.target;
    let value = input.value;
    let isValidInput = value.match(/\d/); // Only allow digits
    input.value = isValidInput ? value[0] : "";
    let fieldIndex = input.dataset.index;
    if (fieldIndex < inputs.length - 1 && isValidInput) {
        input.nextElementSibling.focus();
    }
    if (event.key === "Backspace" && fieldIndex > 0) {
        input.previousElementSibling.focus();
    }
}


function handleOnPasteOtp(event) {
    const data = event.clipboardData.getData("text");
    const value = data.split("");
    if (value.length === inputs.length) {
        inputs.forEach((input, index) => (input.value = value[index]));
    }
}

function submitOTP() {
    console.log("submitOTP");
    var otpInputs = document.querySelectorAll(".otp-field input");
    var otp = "";
    otpInputs.forEach(input => {
        otp += input.value;
    });
    if (otp.length !== 6) {
        document.getElementById("otpErrorMessage").style.display = "block";
        return; // Return early if Aadhaar number length is not 12
    }
    var submitOtpParams = {
        method: "POST",
        headers: {
            Origin: window.location.origin,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            requestId: requestId,
            aadhaarNo: aadhaarNo,
            otp: otp,
        }),
    };

    fetch(api_url, submitOtpParams)
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                window.location.href = thankYouPage;
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200
            }
        })
        .then(data => {
            document.getElementById("otpSection").style.display = "none";
        })
        .catch(error => {
            console.log(error, 'e');
            window.location.href = errorPage;
        });
}

