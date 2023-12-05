let url = new URL(window.location.href);
const token = url.searchParams.get("token");
const errorPage = 'pages/ErrorPage.html?token=' + token;
const error404Page = 'pages/Error404.html?token=' + token;
const thankYouPage = 'pages/ThankYou.html?token=' + token;
const successPage = 'pages/SuccessPage.html?token=' + token;
const failurePage = 'pages/KycErrorPage.html?token=' + token;

const api_url = `{{API_BASE_URL}}/api/v1/process-aadhaar`;

if (!token) {
    window.location.href = errorPage;
}

let requestId = "";
let aadhaarNo = "";

let resendOtpCount = 0;
let otpSubmitCount = 0;

const callbackUrl = getCallbackUrlFromToken()

// Validate Aadhaar Pull Status
validateAadhaarStatus()

function getCallbackUrlFromToken() {
    var tokenJson = parseJwt(token);
    return tokenJson['payload']['callbackUrl'];
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function formatAndValidateAadhaarInput(input) {
    var inputValue = input.value;
    var digitsOnly = inputValue.replace(/\D/g, ""); // Remove non-digit characters
    input.value = digitsOnly;
    let value = input.value.replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");
    input.value = value;

    let button = document.getElementById("generateOtpButton");
    button.disabled = input.value.length !== 14; // Disable the button if Aadhaar number length is not 14
}

function validateAadhaarStatus() {
    console.log("validateAadhaarPull")

    var aadhaarStatusParams = {
            method: "POST", headers: {
                Origin: window.location.origin, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
            }, body: JSON.stringify({
                aadhaarStatus: true
            }),
        };

    fetch(api_url, aadhaarStatusParams)
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                document.getElementById("loader").style.display = "none";
                document.getElementById("aadhaarSection").style.display = "block";
                document.getElementById("generateOtpButton").style.display = "block";
            } else if (response.status === 400 || response.status === 500) {
                window.location.href = errorPage;
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200 or 400 or 500
            }
        })
        .catch(error => {
            console.log("error: ", error);
            window.location.href = error404Page;
        });
}

function generateOtp() {
    console.log("generateOtp");
    document.getElementById("id-error-popup").style.display = "none";
    document.getElementById("consentCheckbox").checked = false;

    var button = document.getElementById("generateOtpButton");
    var aadhaarInput = document.getElementById("aadhaarInput");
    document.getElementById("resendOtp").style.display = "none";


    document.getElementById("aadhaarErrorMessage").style.display = "none";
    document.getElementById("retryResendMessage").style.display = "none";


    button.disabled = true; // Disable the button
    aadhaarInput.readOnly = true; // Make input read-only
    // aadhaarInput.style.backgroundColor = "#f7f7f5"; // Change input background color

    aadhaarNo = aadhaarInput.value.replace(/\s/g, ""); // Remove spaces from aadhaarNumber
    if (aadhaarNo.length !== 12) {
        document.getElementById("aadhaarErrorMessage").style.display = "block";
        return; // Return early if Aadhaar number length is not 12
    }

    const requestBody = {
        aadhaarNo: aadhaarNo
    };
    const other_params = {
        method: 'POST', headers: {
            'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token
        }, body: JSON.stringify(requestBody)
    };

    fetch(api_url, other_params)
        .then(response => {
            // handle the response
            console.log(response);
            if (response.status === 200) {
                return response.json(); // Parse the response JSON
            } else if (response.status === 400) {
                // Show invalid aadhaar number message
                document.getElementById("aadhaarErrorMessage").innerText = 'Please enter a valid Aadhaar number.'
                document.getElementById("aadhaarErrorMessage").style.display = "block";
                aadhaarInput.readOnly = false; // Make input editable again
                // aadhaarInput.style.backgroundColor = "#F0F0F0"; // Restore input background color
            } else if (response.status === 500) {
                window.location.href = error404Page;
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200
            }
        })
        .then(data => {
            // Handle the response and show OTP section if status is 200
            // Otherwise, show an error message
            if (data !== undefined && "requestId" in data) {
                // Store the requestId and aadhaarNumber from the response data
                requestId = data.requestId
                // Remove error message if any
                document.getElementById("aadhaarErrorMessage").style.display = 'none';
                document.getElementById("retryResendMessage").style.display = "none";
                document.getElementById("otpErrorMessage").style.display = 'none';
                document.getElementById("otpSection").style.display = "block";
                document.getElementById("submitButton").style.display = "block";
                document.getElementById("id-consent-section").style.display = "flex";
                document.getElementById("generateOtpButton").style.display = "none";
                document.querySelectorAll(".otp-field input").forEach(input => {
                    input.disabled = false;
                });
                otpSubmitCount = 0;
                clearOtpInputs();
                document.getElementById("consentCheckbox").disabled = false;

                var countdown = 60; // Countdown in seconds

                // Function to update the button text with the remaining countdown
                function updateButton() {
                    document.getElementById("resendCounter").style.display = "block";
                    document.getElementById("resendCounter").innerText = "Resend in " + countdown + "s";
                    countdown--;
                    if (countdown >= 0) {
                        setTimeout(updateButton, 1000); // Update every 1 second
                    } else {
                        document.getElementById("resendCounter").style.display = "none";
                        document.getElementById("resendOtp").style.display = "block";
                        aadhaarInput.readOnly = true; // Make input read only
                        
                    }
                }

                resendOtpCount++;
                if (resendOtpCount >= 3) {
                    document.getElementById("submitButton").disabled = true;
                    document.getElementById("resendOtp").style.display = "none";
                } else {
                    updateButton(); // Start the countdown
                }
                // Disable caching of the thank-you page
                window.history.pushState({}, '', window.location.href);
                window.onpopstate = function (event) {
                    window.location.href = errorPage;
                };

                document.getElementById("retryResendMessage").innerText = `You have ${3 - resendOtpCount} tries left on resending OTP`;
                document.getElementById("retryResendMessage").style.display = "block";
            } else {
                console.log("Invalid response: ", data); // Log error if the requestId is missing from the response
            }
        })
        .catch(error => {
            console.log("error: ", error);
            window.location.href = errorPage;
        });
}

function handleOtp(event) {
    document.getElementById("id-error-popup").style.display = "none";
    document.getElementById("otpErrorMessage").style.display = 'none';
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
    document.getElementById("id-error-popup").style.display = "none";
    document.getElementById("otpErrorMessage").style.display = 'none';
    const data = event.clipboardData.getData("text");
    const value = data.split("");
    if (value.length === inputs.length) {
        inputs.forEach((input, index) => (input.value = value[index]));
    }
}

function redirectUrl() {
    if (callbackUrl != null) {
        window.location.href = callbackUrl.includes['https://'] ?  callbackUrl : "https://" + callbackUrl;
    }
}

function submitOTP() {
    console.log("submitOTP");
    document.getElementById("id-error-popup").style.display = "none";
    var otpInputs = document.querySelectorAll(".otp-field input");
    var otp = "";
    otpInputs.forEach(input => {
        otp += input.value;
    });
    if (otp.length !== 6) {
        document.getElementById("otpErrorMessage").style.display = "block";
        return; // Return early if OTP length is not 6
    }
    document.getElementById("otpErrorMessage").style.display = 'none';
    var submitOtpParams = {
        method: "POST", headers: {
            Origin: window.location.origin, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
        }, body: JSON.stringify({
            requestId: requestId, aadhaarNo: aadhaarNo, otp: otp
        }),
    };

    const submitButton = document.getElementById("submitButton");
    submitButton.disabled = true

    fetch(api_url, submitOtpParams)
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                window.location.href = successPage;
            } else if (response.status === 400) {
                document.getElementById("otpErrorMessage").style.display = 'block';
                otpSubmitCount++;
                if (otpSubmitCount >= 3) {
                    document.querySelectorAll(".otp-field input").forEach(input => {
                        input.disabled = true;
                    });
                    document.getElementById("otpRetryMessage").innerText = `You have 0 tries left on this OTP.`;
                    document.getElementById("id-error-popup").style.display = "flex";
                    document.getElementById("consentCheckbox").disabled = true;
                    const submitButton = document.getElementById("submitButton");
                    submitButton.disabled = true
                    if (resendOtpCount >= 3) {
                        const exceedParam = {
                            method: "POST", headers: {
                                Origin: window.location.origin,
                                Authorization: `Bearer ${token}`,
                                "Content-Type": "application/json",
                            }, body: JSON.stringify({
                                aadhaarNo: aadhaarNo, limitExceeded: true
                            }),
                        };
                        document.getElementById("otpRetryMessage").innerText = "Sorry, you have exhausted all attempts";
                        document.getElementById("id-error-popup").style.display = "flex";
                        document.getElementById("submitButton").disabled = true;
                        fetch(api_url, exceedParam).then(response => {
                            console.log(response)
                            if (response.status === 410) {
                                window.location.href = failurePage;
                                // setTimeout(redirectUrl, 4000);
                            } else {
                                window.location.href = error404Page;
                            }
                        })
                    }

                } else {
                    const remainingTries = 3 - otpSubmitCount;
                    document.getElementById("otpRetryMessage").innerText = `You have ${remainingTries} tries left on this OTP.`;
                    document.getElementById("id-error-popup").style.display = "flex";
                    const submitButton = document.getElementById("submitButton");
                    submitButton.disabled = false
                }
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200 or 401
            }
        })
        .catch(error => {
            console.log(error, 'e');
            window.location.href = errorPage;
        });
}

function toggleSubmitButton() {
    let consentCheckbox = document.getElementById("consentCheckbox");
    const submitButton = document.getElementById("submitButton");

    submitButton.disabled = !consentCheckbox.checked;
}

function handleCheckboxChange(event) {
    const checkbox = event.target;
    const submitButton = document.getElementById("submitButton");

    submitButton.disabled = !checkbox.checked;
}

function clearOtpInputs() {
    const otpInputs = document.querySelectorAll(".otp-field input");
    otpInputs.forEach(input => {
        input.value = "";
    });
}
