let url = new URL(window.location.href);
const token = url.searchParams.get("token");
const errorPage = 'pages/ErrorPage.html?token=' + token;
const successPage = 'pages/SuccessPage.html?token=' + token;
const failurePage = 'pages/KycErrorPage.html?token=' + token;
const digioRedirectPage = 'pages/DigioRedirection.html?token=' + token;
const digioCancelPage = 'pages/DigioCancel.html?token=' + token;
const digioCheckLaterPage = 'pages/DigioCheckLater.html?token=' + token;

const api_url = `{{API_BASE_URL}}/api/v1/process-aadhaar`;

if (!token) {
    window.location.href = errorPage;
}

let requestId = "";
let aadhaarNo = "";

let resendOtpCount = 0;
let otpSubmitCount = 0;

const callbackUrl = getCallbackUrlFromToken()
