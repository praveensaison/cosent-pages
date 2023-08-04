let url = new URL(window.location.href);
let token = url.searchParams.get("token");

const errorPage = "ErrorPage.html?token=" + token;

if (!token) window.location.href = errorPage;

const { callbackUrl, orderId, customerId, appFormId } =
  parseJwt(token)["payload"];

function parseJwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}
const wait = (callBackFunc, period) => setTimeout(() => callBackFunc(), period);

function redirectToRZ() {
  var rzp = new Razorpay({
    key: "rzp_test_yfErT76MqVVxrq",
    order_id: orderId,
    customer_id: customerId,
    recurring: "1",
    callback_url: callbackUrl,
    theme: {
      color: "#F37254",
    },
  });
  rzp.open();
}

function redirectToPtnr() {
  window.location.href = callbackUrl;
  window.history.pushState(null, document.title, location.href);
}

const isMandateCreated = () => {
  let apiUrl = `{{API_BASE_URL}}/api/v1/app-form/${appFormId}/mandate`;

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${token}`,
    },
  }).then((res) => {
    if (res.status === 200 || res.status === 500) {
      document
        .querySelector('[data-msg="prtnr-redirect"]')
        .classList.remove("hidden");
      wait(redirectToPtnr, 3000);
    } else if (res.status === 400) {
      document
        .querySelector('[data-msg="rz-redirect"]')
        .classList.remove("hidden");
      wait(redirectToRZ, 3000);
    } else {
      throw new Error("API error");
    }
  });
};

setTimeout(() => {
  isMandateCreated();
}, 1000);
