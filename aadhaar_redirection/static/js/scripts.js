function validateAadhaarStatus() {
    console.log("inside validateAadhaarPull")

    const aadhaarStatusParams = {
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
                document.getElementById("id-consent-section").style.display = "flex";
                document.getElementById("consentCheckbox").checked = false;
            } else if (response.status === 500) {
                window.location.href = errorPage;
            } else if (response.status === 400) {
                window.location.href = successPage;
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200 or 400 or 500
            }
        })
        .catch(error => {
            console.log("error: ", error);
            window.location.href = errorPage;
        });
}

function generateOtp() {
    console.log("generateOtp");
    document.getElementById("id-error-popup").style.display = "none";

    const button = document.getElementById("generateOtpButton");
    const aadhaarInput = document.getElementById("aadhaarInput");
    const consentCheckbox = document.getElementById("consentCheckbox");
    document.getElementById("resendOtp").style.display = "none";

    document.getElementById("aadhaarErrorMessage").style.display = "none";
    document.getElementById("retryResendMessage").style.display = "none";

    aadhaarNo = aadhaarInput.value.replace(/\s/g, ""); // Remove spaces from aadhaarNumber
    if (aadhaarNo.length !== 12 || !consentCheckbox.checked) {
        document.getElementById("aadhaarErrorMessage").style.display = "block";
        return; // Return early if Aadhaar number length is not 12
    }

    button.disabled = true; // Disable the button
    aadhaarInput.readOnly = true; // Make input read-only
    aadhaarInput.style.backgroundColor = "#f7f7f5"; // Change input background color

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
                document.getElementById("aadhaarErrorMessage").style.display = "block";
                aadhaarInput.readOnly = false; // Make input editable again
                document.getElementById("consentCheckbox").checked = false;
            } else if (response.status === 410) {
                window.location.href = digioRedirectPage;
            } else if (response.status === 500) {
                window.location.href = errorPage;
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
                document.getElementById("aadhaarDescription").style.display = 'none';
                document.getElementById("retryResendMessage").style.display = "none";
                document.getElementById("otpErrorMessage").style.display = 'none';
                document.getElementById("otpSection").style.display = "block";
                document.getElementById("submitButton").style.display = "block";
                document.getElementById("generateOtpButton").style.display = "none";
                document.getElementById("id-consent-section").style.display = "none";
                document.querySelectorAll(".otp-field input").forEach(input => {
                    input.disabled = false;
                });
                otpSubmitCount = 0;
                clearOtpInputs();

                let countdown = 60; // Countdown in seconds

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
                window.onpopstate = function () {
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

function submitOTP() {
    console.log("submitOTP");
    document.getElementById("id-error-popup").style.display = "none";
    const otpInputs = document.querySelectorAll(".otp-field input");
    let otp = "";
    otpInputs.forEach(input => {
        otp += input.value;
    });
    if (otp.length !== 6) {
        document.getElementById("otpErrorMessage").style.display = "block";
        return; // Return early if OTP length is not 6
    }
    document.getElementById("otpErrorMessage").style.display = 'none';
    const submitOtpParams = {
        method: "POST", headers: {
            Origin: window.location.origin, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
        }, body: JSON.stringify({
            requestId: requestId, aadhaarNo: aadhaarNo, otp: otp
        }),
    };

    document.getElementById("submitButton").disabled = true

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
                    document.getElementById("submitButton").disabled = true
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
                            window.location.href = digioRedirectPage
                        })
                    }
                } else {
                    const remainingTries = 3 - otpSubmitCount;
                    document.getElementById("otpRetryMessage").innerText = `You have ${remainingTries} tries left on this OTP.`;
                    document.getElementById("id-error-popup").style.display = "flex";
                    document.getElementById("submitButton").disabled = false
                }
            } else {
                throw new Error("API error"); // Throw an error if the response status is not 200 or 400
            }
        })
        .catch(error => {
            console.log(error, 'e');
            window.location.href = digioRedirectPage
        });
}

function startDigioFlow() {
    console.log("inside startDigioFlow")

    const startDigioParams = {
        method: "POST", headers: {
            Origin: window.location.origin, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
        }, body: JSON.stringify({
            startDigio: true
        }),
    };

    document.getElementById("digioSubmitButton").disabled = true

    fetch(api_url, startDigioParams)
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                return response.json();
            } else {
                window.location.href = errorPage;
            }
        })
        .then(data => {
            if (data !== undefined && "digioUrl" in data) {
                const redirectUrl = window.location.origin + '/AadhaarRedirection.html?token=' + token
                window.location.href = data.digioUrl + '&redirect_url=' + redirectUrl
            } else {
                throw new Error("Response data is undefined");
            }
        })
        .catch(error => {
            console.log("error in startDigioFlow: ", error);
            window.location.href = errorPage;
        });
}

function digioFetchAadhaarData() {
    console.log("inside digioFetchAadhaarData")

    const fetchDataParams = {
        method: "POST", headers: {
            Origin: window.location.origin, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
        }, body: JSON.stringify({
            digioFetchAadhaarData: true
        }),
    };

    fetch(api_url, fetchDataParams)
        .then(response => {
            console.log(response);
            if (response.status === 200) {
                window.location.href = successPage;
            } else {
                window.location.href = digioCheckLaterPage;
            }
        })
        .catch(error => {
            console.log("error in digioFetchAadhaarData: ", error);
            window.location.href = digioCheckLaterPage;
        });
}
