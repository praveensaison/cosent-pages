let url = new URL(window.location.href);
// const token = url.searchParams.get("token");
const token = 'eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI3Y2FmNTlhNS00NmE3LTQwZmQtYTJlYy01NjQ1ZWVjNGI3ZmUiLCJwYXlsb2FkIjp7ImVudGl0eUlkIjoiQUlSU0FJTlQ2NzdjYzc4NzY2IiwiZW50aXR5VHlwZSI6InBhcnRuZXJMb2FuSWQiLCJscGMiOiJBSVIiLCJjYWxsYmFja1VybCI6Ind3dy5nb29nbGUuY29tIn0sImV4cCI6MTcwMDczNzczMywiaWF0IjoxNzAwNzM1OTMzfQ.TYMAmx-haPxOAsBpmyax6McKoToAlFschoap7gm1tzOa0MTkIf1foFXFT8oBFiwyK-Xi6CbIoyxCqKqRAL82QiAcDJgBCY_ioo6Mx_FcfQloic_lBfFTZ3aS_JOV7HTQm-Fxb6TEIFMbKOtpuoKjsIl_UvvxinxyCBl42Gc9GAoP2JwP-1InzOID9N4AsX20edMNTTvX8TVSIHwONmQRWAodFkPqcCuACh1DaeEDBa2ldA3KV2vQbyXCuUiJD0Ck2Hc6YGiQYp9yDhjPrG5bnvQ7O0fmereqr1szPEYchUeOIeFRnz5Wc6mKjXD1XIQdsi0jRdoGmT6t1SbkNencDQ'
const errorPage = 'pages/ErrorPage.html?token=' + token;
const error404Page = 'pages/Error404.html?token=' + token;
const thankYouPage = 'pages/ThankYou.html?token=' + token;
const successPage = 'pages/SuccessPage.html?token=' + token;

const api_url = `https://a8fm3nym3g.execute-api.eu-west-1.amazonaws.com/qa2/api/v1/process-aadhaar`;

if (!token) {
    window.location.href = errorPage;
}

let requestId = "";
let aadhaarNo = "";

let resendOtpCount = 0;
let otpSubmitCount = 0;

const callbackUrl = getCallbackUrlFromToken()

// Validate Aadhaar Pull Status
// validateAadhaarStatus()
// document.getElementById("loader").style.display = "none";
// document.getElementById("aadhaarSection").style.display = "block";

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
    button.style.backgroundColor = button.disabled ? "gray" : "#004097"; // Change button background color to gray if disabled
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
    document.getElementById("consentCheckbox").checked = false;

    var button = document.getElementById("generateOtpButton");
    var aadhaarInput = document.getElementById("aadhaarInput");

    document.getElementById("aadhaarErrorMessage").style.display = "none";

    button.disabled = true; // Disable the button
    button.style.backgroundColor = "#CCCCCC"; // Change button color
    aadhaarInput.readOnly = true; // Make input read-only
    aadhaarInput.style.backgroundColor = "#D3D3D3"; // Change input background color

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
                button.style.backgroundColor = "#004097"; // Restore button color
                aadhaarInput.readOnly = false; // Make input editable again
                aadhaarInput.style.backgroundColor = "#F0F0F0"; // Restore input background color
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
                document.getElementById("otpErrorMessage").style.display = 'none';
                document.getElementById("otpSection").style.display = "block";
                document.querySelectorAll(".otp-field input").forEach(input => {
                    input.disabled = false;
                });
                otpSubmitCount = 0;
                clearOtpInputs();
                document.getElementById("consentCheckbox").disabled = false;

                var countdown = 60; // Countdown in seconds

                // Function to update the button text with the remaining countdown
                function updateButton() {
                    button.innerText = "Resend Otp (" + countdown + "s)";
                    button.style.color = "black" // Update button color to black
                    countdown--;
                    if (countdown >= 0) {
                        setTimeout(updateButton, 1000); // Update every 1 second
                    } else {
                        button.disabled = false; // Enable the button after countdown
                        button.style.backgroundColor = "#004097"; // Restore button color
                        aadhaarInput.readOnly = true; // Make input read only
                        button.innerText = "Resend Otp"; // Update button text to "Resend Otp"
                        button.style.color = "white" // Restore button color to white
                    }
                }

                resendOtpCount++;
                if (resendOtpCount >= 3) {
                    document.getElementById("submitButton").disabled = true;
                } else {
                    updateButton(); // Start the countdown
                }
                // Disable caching of the thank-you page
                window.history.pushState({}, '', window.location.href);
                window.onpopstate = function (event) {
                    window.location.href = errorPage;
                };

                document.getElementById("aadhaarErrorMessage").innerText = `You have ${3 - resendOtpCount} tries left on resending OTP`;
                document.getElementById("aadhaarErrorMessage").style.display = "block";
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

function redirectUrl() {
    if (callbackUrl != null) {
        document.location.href = callbackUrl;
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
        return; // Return early if OTP length is not 6
    }

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
                otpSubmitCount++;
                if (otpSubmitCount >= 3) {
                    document.querySelectorAll(".otp-field input").forEach(input => {
                        input.disabled = true;
                    });
                    document.getElementById("otpErrorMessage").innerText = `Wrong OTP. You have 0 tries left on this OTP.`;
                    document.getElementById("otpErrorMessage").style.display = "block";
                    document.getElementById("consentCheckbox").disabled = true;
                    const submitButton = document.getElementById("submitButton");
                    submitButton.disabled = true
                    submitButton.style.backgroundColor = "gray";
                    submitButton.style.borderColor = "gray";
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
                        document.getElementById("otpErrorMessage").innerText = "Sorry, you have exhausted all attempts on OTP validation. Redirecting you back to the app.";
                        document.getElementById("otpErrorMessage").style.display = "block";
                        document.getElementById("submitButton").disabled = true;
                        fetch(api_url, exceedParam).then(response => {
                            console.log(response)
                            if (response.status === 410) {
                                setTimeout(redirectUrl, 4000);
                            } else {
                                window.location.href = error404Page;
                            }
                        })
                    }

                } else {
                    const remainingTries = 3 - otpSubmitCount;
                    document.getElementById("otpErrorMessage").innerText = `Wrong OTP. You have ${remainingTries} tries left on this OTP.`;
                    document.getElementById("otpErrorMessage").style.display = "block";
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

    if (submitButton.disabled) {
        submitButton.style.backgroundColor = "gray";
        submitButton.style.borderColor = "gray";
    } else {
        submitButton.style.backgroundColor = "#004097";
    }
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
