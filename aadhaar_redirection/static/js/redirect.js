let url = new URL(window.location.href);
const token = url.searchParams.get("token");
const callbackUrl = getCallbackUrlFromToken()

// setTimeout(redirectUrl, 4000);
