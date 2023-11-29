let url = new URL(window.location.href);
const token = url.searchParams.get("token");
const callbackUrl = getCallbackUrlFromToken()

if (url.pathname === "/pages/ThankYou.html") {
    setTimeout(redirectUrl, 2000);
} else {
    setTimeout(redirectUrl, 4000);
}

function redirectUrl() {
    if (callbackUrl != null) {
        window.location.replace = callbackUrl;
    }
}

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
