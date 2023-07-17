let url = new URL(window.location.href);
const callbackUrl = url.searchParams.get("callbackUrl");

if (url.pathname === "/pages/ThankYou.html") {
    setTimeout(redirectUrl, 2000);
} else {
    setTimeout(redirectUrl, 4000);
}

function redirectUrl() {
    if (callbackUrl != null) {
        document.location.href = callbackUrl;
    }
}
