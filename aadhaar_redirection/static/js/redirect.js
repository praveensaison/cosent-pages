let url = new URL(window.location.href);
const callbackUrl = url.searchParams.get("callbackUrl");

setTimeout(redirectUrl, 5000);

function redirectUrl() {
    if (callbackUrl != null) {
        document.location.href = callbackUrl;
    }
}
