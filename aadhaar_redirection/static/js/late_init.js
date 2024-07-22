// Allow 'enter' key press to generate otp on aadhaar input
const aadhaarInput = document.getElementById("aadhaarInput");
aadhaarInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        generateOtp();
    }
});

const inputs = document.querySelectorAll(".otp-field input");
inputs.forEach((input, index) => {
    input.dataset.index = index;
    input.addEventListener("keyup", handleOtp);
    input.addEventListener("paste", handleOnPasteOtp);
});

// Call the toggleGenerateOtpButton function initially to set the initial state of the Generate Otp button
toggleGenerateOtpButton();

// Add event listener for checkbox change
const consentCheckbox = document.getElementById("consentCheckbox");
consentCheckbox.addEventListener("change", handleCheckboxChange);


if (url.searchParams.has("status")) {
    // Handle Digio Redirection
    digioStatus = url.searchParams.get("status")

    switch (digioStatus) {
        case "cancel":
            window.location.href = digioCancelPage;
            break;
        case "success":
            document.getElementById("loader").style.display = "block";
            document.getElementById("digio-text-section").style.display = "flex";
            digioFetchAadhaarData()
            break;
        default:
            window.location.href = failurePage;
    }
} else {
    // Validate Aadhaar Pull Status
    validateAadhaarStatus()
}
