function toggleGenerateOtpButton() {
    let consentCheckbox = document.getElementById("consentCheckbox");
    document.getElementById("generateOtpButton").disabled = !consentCheckbox.checked;
}

function handleCheckboxChange(event) {
    const checkbox = event.target;
    document.getElementById("generateOtpButton").disabled = !checkbox.checked;
}

function formatAndValidateAadhaarInput(input) {
    // Remove non-digit characters
    input.value = input.value.replace(/\D/g, "").replace(/\s/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

    if (input.value.length !== 14)
        document.getElementById("generateOtpButton").disabled = true
    else if (document.getElementById("consentCheckbox").checked)
        document.getElementById("generateOtpButton").disabled = false
}

function handleOnPasteOtp(event) {
    document.getElementById("id-error-popup").style.display = "none";
    document.getElementById("otpErrorMessage").style.display = 'none';
    const data = event.clipboardData.getData("text");
    const value = data.split("");

    let otpValid = true
    inputs.forEach((input) => otpValid = otpValid && input.value.match(/\d/))

    if (value.length === inputs.length && otpValid) {
        inputs.forEach((input, index) => (input.value = value[index]));
        document.getElementById("submitButton").disabled = false
    }
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

    let otpValid = true
    inputs.forEach((input) => otpValid = otpValid && input.value.match(/\d/))
    document.getElementById("submitButton").disabled = !otpValid
}

function clearOtpInputs() {
    const otpInputs = document.querySelectorAll(".otp-field input");
    otpInputs.forEach(input => {
        input.value = "";
    });
}

function redirectUrl() {
    if (callbackUrl != null) {
        window.location.href = callbackUrl;
    }
}

function getCallbackUrlFromToken() {
    const tokenJson = parseJwt(token);
    return tokenJson['payload']['callbackUrl'];
}

function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}
