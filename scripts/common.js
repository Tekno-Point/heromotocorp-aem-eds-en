const geoLocationAPI = `https://apis.mappls.com/advancedmaps/v1/5b8424bdaf84cda4fccf61d669d85f5a/rev_geocode?lat={lat}&lng={long}`;
const stateCityAPI = `https://www.heromotocorp.com/content/hero-commerce/in/en/products/product-page/practical/jcr:content.state-and-city.json`;
const prodcutAPI = `https://www.heromotocorp.com/content/hero-commerce/in/en/products/product-page/practical/jcr:content.product.practical.splendor-plus.{stateCode}.{cityCode}.json`;
const sendOTPAPI = `https://www.heromotocorp.com/content/hero-commerce/in/en/products/product-page/executive/jcr:content.send-msg.json`;
const dataMapping = {
  state_city_master: {},
};
import { getMetadata } from "./aem.js";

export async function fetchAPI(
  method,
  url,
  payload = { headerJSON: {}, requestJSON: {} }
) {
  return new Promise(async function (resolve, reject) {
    const { headerJSON, requestJSON } = payload;

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    if (headerJSON) {
      Object.keys(headerJSON).forEach(function (key) {
        headers.append(key, headerJSON[key]);
      });
    }

    const body = JSON.stringify(requestJSON);

    const request = {
      method,
      headers,
      body,
    };

    let resp;
    if (method === "GET") {
      resp = await fetch(url);
    } else if (method === "POST") {
      resp = await fetch(url, request);
    }
    if (resp.ok) {
      const data = await resp.json();
      resolve(data);
    } else {
      resolve({ error: resp.text() });
    }
  });
}

export async function getUserLatLong() {
  return new Promise(function (resolve, reject) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          resolve({ lat, long });
        },
        (error) => {
          // resolve({ state_city_master.default.state, state_city_master.default.city });
        }
      );
    } else {
      // resolve({ "Delhi", "Delhi"});
    }
  });
}
export async function fetchStateCityMaster() {
  const data = await fetchAPI("GET", stateCityAPI);
  return data;
}
export async function fetchStateCity() {
  const geolocation = await getUserLatLong();
  const data = await fetchAPI(
    "GET",
    geoLocationAPI
      .replace("{lat}", geolocation.lat)
      .replace("{long}", geolocation.long)
  );
  const { state, city } = data.results[0];
  return { state, city };
}
export async function fetchProdcut() {
  const { state, city } = await fetchStateCity();
  const dataMapping = await getDataMapping();
  const codeData =
    dataMapping.state_city_master[state.toUpperCase()][city.toUpperCase()];
  console.log(codeData);

  const data = await fetchAPI(
    "GET",
    prodcutAPI
      .replace("{stateCode}", codeData.stateCode)
      .replace("{cityCode}", codeData.code)
  );
  console.log(data);
  return data;
}

function processDataMapping(data) {
  dataMapping.state_city_master = {};
  dataMapping.state_city_master.state = [];
  data.data.stateCity.filter((item) => {
    if (!dataMapping.state_city_master[item.label]) {
      dataMapping.state_city_master.state.push(item.label);
      dataMapping.state_city_master[item.label] = {};
    }
    item.cities.forEach((city) => {
      dataMapping.state_city_master[item.label][city.code] = {
        ...city,
        stateCode: item.code,
      };
    });
  });
  sessionStorage.setItem("dataMapping", JSON.stringify(dataMapping));
}

export async function getDataMapping() {
  let data = sessionStorage.getItem("dataMapping");
  if (!data) {
    const data = await fetchStateCityMaster();
    processDataMapping(data);
    sessionStorage.setItem("dataMapping", JSON.stringify(dataMapping));
    data = sessionStorage.getItem("dataMapping");
  }
  data = JSON.parse(data);
  return data;
}


function getRandomId() {
  return sessionStorage.getItem("booktestridekey");
}

function generateRandomId() {
  const array = new Uint8Array(20); // 20 bytes = 160 bits = 40 hex chars
  crypto.getRandomValues(array);
  const id = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
  sessionStorage.setItem("booktestridekey", id);
  return getRandomId();
}
export async function fetchOTP(phoneNum) {
  const reqID = generateRandomId();
  const vehicleName = getMetadata("vehicle-name");
  const pageType = getMetadata("page-type");
  const data = await fetchAPI("POST", sendOTPAPI, {
    requestJSON: {
      phoneNum,
      pageType,
      vehicleName,
      reqID,
    },
  });
  console.log(data);
}
fetchOTP("8169850484");
export function verifyOtp(phoneNum, otp) {
  return (
    otp ===
    (Math.abs(hashCode(phoneNum + getRandomId())) % 1000000)
      .toString()
      .padStart(6, "0")
  );
}

function hashCode(s) {
  var h = 0,
    l = s.length,
    i = 0;
  if (l > 0) while (i < l) h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
  return h;
}

// const dm = await getDataMapping();
// console.log(dm);
// await fetchStateCity();
// const { state, city } = await fetchStateCity();
// await fetchProdcut()
