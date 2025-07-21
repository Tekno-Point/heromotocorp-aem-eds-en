export const endpoint = "http://dev1.heromotocorp.com";

const geoLocationAPI = `${endpoint}/advancedmaps/v1/5b8424bdaf84cda4fccf61d669d85f5a/rev_geocode?lat={lat}&lng={long}`;
const stateCityAPI = `${endpoint}/content/hero-commerce/in/en/products/product-page/practical/jcr:content.state-and-city.json`;
const prodcutAPI = `${endpoint}/content/hero-commerce/in/en/products/product-page/practical/jcr:content.product.practical.splendor-plus.{stateCode}.{cityCode}.json`;
const sendOTPAPI = `${endpoint}/content/hero-commerce/in/en/products/product-page/executive/jcr:content.send-msg.json`;
const dealerAPI = `${endpoint}/content/hero-commerce/in/en/products/product-page/practical/jcr:content.dealers.{sku}.{stateCode}.{cityCode}.json`;
function PubSub() {
  this.events = {};
}

PubSub.prototype.subscribe = function (eventName, callback) {
  if (!this.events[eventName]) {
    this.events[eventName] = [];
  }
  this.events[eventName].push(callback);
};

PubSub.prototype.publish = function (eventName, data) {
  if (!this.events[eventName]) return;

  this.events[eventName].forEach(function (callback) {
    callback(data);
  });
};

// Create a global pubsub instance
export var pubsub = new PubSub();


export let dataMapping = {
  state_city_master: {},
};
import { getMetadata } from "./aem.js";
const apiProxy = {};
export async function fetchAPI(
  method,
  url,
  payload = { headerJSON: {}, requestJSON: {} }
) {
  return new Promise(async function (resolve, reject) {
    const key = url + method;
    if (apiProxy[key]) {
      resolve(apiProxy[key]);
      return apiProxy[key]
    }
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
      apiProxy[key] = data;
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
          resolve({ lat: 28.61, long: 77.23 });
        }
      );
    } else {
      resolve({ lat: 28.7041, long: 77.1025 });
    }
  });
}

export async function fetchStateCityMaster() {
  const data = await fetchAPI("GET", stateCityAPI);
  return data;
}

export async function fetchStateCity() {
  const [dataMapping] = await useDataMapping()
  if (dataMapping.current_location) {
    return dataMapping.current_location;
  }
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

export async function fetchStateCityCode() {
  const { state, city } = await fetchStateCity();
  const dataMapping = await getDataMapping();
  const codeData =
    dataMapping.state_city_master[state.toUpperCase()][city.toUpperCase()];
  console.log(codeData);
  return { stateCode: codeData?.stateCode || 'DEL', cityCode: codeData?.code || 'DELHI' }
}

export async function fetchProduct() {
  const { stateCode, cityCode } = await fetchStateCityCode();
  const data = await fetchAPI(
    "GET",
    prodcutAPI
      .replace("{stateCode}", stateCode)
      .replace("{cityCode}", cityCode)
  );
  console.log(data);
  return data;
}

export async function fetchDealers(sku, stateCode, cityCode) {
  const url = dealerAPI
    .replace('{sku}', sku)
    .replace('{stateCode}', stateCode)
    .replace('{cityCode}', cityCode);

  const data = await fetchAPI("GET", url);
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

export async function useDataMapping() {
  const data = await getDataMapping();
  function setDataMapping(newData) {
    sessionStorage.setItem("dataMapping", JSON.stringify(newData));
  }
  return [data, setDataMapping]

}

async function setSkuAndStateCity() {
  let getProducts = await fetchProduct();
  let selectedCityState = await fetchStateCity()
  dataMapping.sku = getProducts.data.products.items[0].variant_to_colors[0].colors[0].sku;
  dataMapping.products = {}
  dataMapping.products.variant = {};

  dataMapping.products.variant = getProducts.data.products.items[0].variant_to_colors;
  dataMapping.currentlocation = {};
  dataMapping.currentlocation.state = selectedCityState.state.toUpperCase();
  dataMapping.currentlocation.city = selectedCityState.city.toUpperCase();
  dataMapping.currentlocation.stateCode = dataMapping.state_city_master[dataMapping.currentlocation.state][dataMapping.currentlocation.city].stateCode;

  updateDataMapping(dataMapping);
}

// processDataMapping()

async function getDataMapping() {
  let data = sessionStorage.getItem("dataMapping");
  if (!data) {
    let cityMaster = await fetchStateCityMaster();
    processDataMapping(cityMaster);
    let { city, state } = await fetchStateCity();
    // debugger;
    if (city.toUpperCase() === 'NEW DELHI') {
      city = 'DELHI';
      state = 'DELHI';
    }
    const code =
      dataMapping.state_city_master[state.toUpperCase()][city.toUpperCase()] || {
        "cityCode": "DELHI",
        "label": "DELHI",
        "stateCode": "DEL"
      };
    console.log(code);
    dataMapping.current_location = {
      stateCode: code?.stateCode, cityCode: code?.code, city, state
    }
    const { data: { products: { items: [productInfo] } } } = await fetchAPI(
      "GET",
      prodcutAPI
        .replace("{stateCode}", code.stateCode)
        .replace("{cityCode}", code.cityCode)
    );
    const { variant_to_colors: variantsData, variants: allVariantsDetails } = productInfo;
    console.log(data);
    dataMapping.sku = variantsData[0].colors[0].sku;
    sessionStorage.setItem("dataMapping", JSON.stringify(dataMapping));
    data = sessionStorage.getItem("dataMapping");
    // setSkuAndStateCity();
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

//OTP value should be dynamic and should be passed.
//fetchOTP("8169850484");
export function verifyOtp(phoneNum, otp) {
  return (
    otp ===
    (Math.abs(hashCode(phoneNum + getRandomId())) % 1000000)
      .toString()
      .padStart(6, "0")
  );
}

//Verify OTP at frontend
function hashCode(s) {
  var h = 0,
    l = s.length,
    i = 0;
  if (l > 0) while (i < l) h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
  return h;
}

/* compare vehicle */
const fetchCategory = async () => {
  const response = await fetch('https://www.heromotocorp.com/content/hero-aem-website/in/en-in/homepage/jcr:content.products-by-category.json');
  const vehiclePriceData = await response.json();
  console.log(vehiclePriceData);
  const vehiclesObj = vehicleTypeFilter(vehiclePriceData.data.products.items);
  console.log(vehiclesObj);

  return { vehiclePriceData, vehiclesObj };
}

const vehicleTypeFilter = (vehicleList) => {
  const vehiclesObj = {
    scooters: [],
    motorcycles: {
      "100CC": [],
      "125CC": [],
      "premium": []
    }
  };

  const SCOOTERS_KEY_WORD = ["scooters"];

  vehicleList.forEach((vehicle) => {
    if (vehicle) {
      const categories = vehicle.categories;
      const isScooter = categories.some((category) => SCOOTERS_KEY_WORD.includes(category.url_path));
      if (isScooter) {
        vehiclesObj.scooters.push(vehicle);
      } else {
        if (Number(vehicle.type_of_cc) >= 60 && vehicle.type_of_cc <= 120) {
          vehiclesObj.motorcycles["100CC"].push(vehicle);
        }
        else if (Number(vehicle.type_of_cc) >= 124 && vehicle.type_of_cc <= 140) {
          vehiclesObj.motorcycles["125CC"].push(vehicle);
        } else if (Number(vehicle.type_of_cc) > 140) {
          vehiclesObj.motorcycles["premium"].push(vehicle);
        }
      }
    }
  })

  return vehiclesObj;
}

export { fetchCategory };

