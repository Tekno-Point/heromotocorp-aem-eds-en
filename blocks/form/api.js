const mobileNumber = document.getElementById('form-mobile').value;

function createReqId(){
    window.sessionStorage.setItem("booktestridekey", generateRandomId().then((id) => id));
}

function generateRandomId() {
  const array = new Uint8Array(20); // 20 bytes = 160 bits = 40 hex chars
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}


export function sendotp(){
    debugger;
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      phoneNum: mobileNumber,
      pageType: "homepage",
      vehicleName: "splendor-plus",
      reqID: createReqId(),
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      "https://dev1.heromotocorp.com/content/hero-commerce/in/en/products/product-page/executive/jcr:content.send-msg.json",
      requestOptions
    )
      .then((response) => {
        verifyOtp();
        response.text();
      })
      .then((result) => console.log(result))
      .catch((error) => console.error(error));

}

function verifyOtp(){
    (
      Math.abs(
        hashCode(
          mobileNumber + window.sessionStorage.getItem("booktestridekey")
        )
      ) % 1000000
    )
      .toString()
      .padStart(6, "0");

      console.log("verified");
}

function hashCode(s) {
  var h = 0,
    l = s.length,
    i = 0;
  if (l > 0) while (i < l) h = ((h << 5) - h + s.charCodeAt(i++)) | 0;
  return h;
}

function createLead(){
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify([
      {
        Attribute: "EmailAddress",
        Value: "test@gmail.com",
      },
      {
        Attribute: "mx_UTM_Campaign",
        Value:
          "AEM-Windows-practical-Hero Splendor+: World's No.1 Motorcycle | Price, Mileage And Specs-otp",
      },
      {
        Attribute: "mx_UTM_Content",
        Value:
          "AEM-Windows-practical-Hero Splendor+: World's No.1 Motorcycle | Price, Mileage And Specs-otp",
      },
      {
        Attribute: "mx_UTM_Medium",
        Value:
          "AEM-Windows-practical-Hero Splendor+: World's No.1 Motorcycle | Price, Mileage And Specs-otp",
      },
      {
        Attribute: "mx_UTM_Source",
        Value: "AEM",
      },
      {
        Attribute: "mx_UTM_Term",
        Value:
          "AEM-Windows-practical-Hero Splendor+: World's No.1 Motorcycle | Price, Mileage And Specs-otp",
      },
      {
        Attribute: "mx_Bike_Name",
        Value: "SPLENDOR +",
      },
      {
        Attribute: "mx_Customer_Name",
        Value: "test test",
      },
      {
        Attribute: "mobile",
        Value: "9833415608",
      },
      {
        Attribute: "mx_City",
        Value: "MUMBAI",
      },
      {
        Attribute: "mx_State",
        Value: "MAHARASHTRA",
      },
      {
        Attribute: "mx_State2",
        Value: null,
      },
      {
        Attribute: "Source",
        Value: "AEM",
      },
      {
        Attribute: "mx_Interested_In",
        Value: null,
      },
      {
        Attribute: "mx_Preferred_Dealership",
        Value: null,
      },
      {
        Attribute: "mx_Vehicle_Purchase_Plan",
        Value: null,
      },
      {
        Attribute: "mx_Own_Vehicle",
        Value: null,
      },
      {
        Attribute: "mx_Date",
        Value: null,
      },
      {
        Attribute: "mx_Form_Field_10",
        Value: "L-0725-39663348-9b7b-4da7-a933-16da6ca93674",
      },
      {
        Attribute: "reqID",
        Value: "ea4c9167c55ea36cb6a18d03c1b8cf642e9b6c3d",
      },
      {
        Attribute: "OTP",
        Value: "268868",
      },
      {
        Attribute: "token",
        Value:
          "03AFcWeA6bULuy2hfgokFeDnLBGeeZDcr8ZtstOJkeXiyMbiDv5HU2dMvKVdZSKbsMCgrIP5PxnD5jmcj-HBR5uypD47qSj5F4XHRfdJB9JDroa6HVs15YxkPqnSpdzh-3E9z5SrcookLQ1CRYbTvVul0pkRfxt0p6ekeD-ZncRypOkQqXdZH7MksoqUtdzO9dK9xCYmE-CALBf08nH9R0lnM4k7GLVY6N-1tbirGBNttfq7Maydyw9HGOknCmVvhra2F2g5-3fHMpFs7DbKwOeE_4ntcDl9XCITFjbfSa0-py72gepm6VTCYw9oO585RnDxfb-UkBG_RY10htz8FRpfhiWnQJv9SNybcC5eswnwNvoA_a3OGDUIJq225_fV2x4AEoKZo1PeyhnwB9N8vogsZ3qKz1GZKcOvLbrGIy6_q3HAST2xJ9SSv3qJ8gHy3rycjnB4LJlJ8PzOjyixxwjaemuO0sTGre3A2ilm9CBEeGEZ2N-bcnQBv5bFKK5dGKqHftroGxrv4lrTJL9Y6pHCVu-U2fYoHsvop_m1EJoXnqlkJ3979voQ36tYj1EcCX4e-XdvrlPB5N2WUpL0FtVDtAWDzaxMgQIFhBD10ZTE7iEvWAMax3kZKLjndQksNFyzKktMjakAVU9Vy6PLFy4iTCIuLwdv3gLE_QAtfIW85iydH8mIgHE4dxVJUPzeFPLdvFqIJVRY6Bs0W8DLpUQTgbyXNZVcH1LRqVlIdP4l6smo2lHOKl5Vk401WWFD779fGZ2t2-n8z4R0bPYtnYUNAy9xdCCDWOQ6wgddsdEbvvRdTyWm-rH4dbiKiOLhYKdj5sCE2NW4-Mgy3M7hZBPZE2-3O2C3f45VL71zrlrHNBYyU4vBLKR0nMH_5l1Jx9eA_2BgobsnmSJfy2jyunl5HrzV5OT1NkMDOwNS6TaC7A6WNdtfDwp2YrodlatLSjE2-o45-zwMDFgJs6PHV1_3joU7eyEkauSrRvyjbdEiVR0JD-X0uMNapmBvhdOFo6juYx4ESh078uyk-3_TSOqFk6LuJd-3ozXLqED0FIf_dLrDLP9D6MnBS3XnP4fAd81rVXZ0_FLahdyul0XjNR0v1hoXHRBnxlzPw3aDgHjqtsQV4R6wtN2vJVbMc5VxYEQ21TN4zImamKNmQQ0W9t8KadL8fxIqV9IbueUN5L7md90KUeTB5qJsL2l6XTyOIrBuEaSys4nuk36bX6DvBGGPvqwK1a48mCPSr1OiHA7VQvUuvIYkO38q5f3NmMDRNnLjRYbxnOUv0aiLo9dUd4wAldI22Vqs3KZYD8dE1uznAIKy7HTF-dlzm4B2iFtEVipJY5IuqWbz_Dr7WW8C1BBweH5EQW184lQ6C6Ld8BnDBeIg39v9CscQAdPxX859jeOcgJPh-vK3GHDCclGpRIbCknLAzaAC2f1d-ItIoen_qyKIhJI9KQ9l6-vNjF8dh_n7DtlmY-MtOE5-IOEMEZ2PTcwEi39YJaaKVsrgBNnswmBVB94-r2nAniqw5attBQZzBstlbLmLY9UXLMLUFAZlH-NiKTRo4UAKmJ3MhHyjcKJrzYVCZsQPp1V7YTPADXjFIKN5Ilup2KRSGsqO_SLNK9fkneRZVr36X-jRDFuGmXUYhEY3Jv5DaDRMuWexSI_4DOFVhkRO9wzNHZwee75GD_e_7naomeCdit9tURtXT4qnhBHw3JkmHFXGkE6ouvFdLr5mezMq8E4Qf_2qS6BscUePrhyGvlJEo87fYUlWoM4F7cGA9_LmumfaTF9ri3eveOtKoPjggJ5-kzDCrkj2SnWg-ZHHd9CV6O6XlyWcPfNpdbGweNbqjSPmMykSMf5k0MDVKElkcngnN2ZO1XHjXTGG4P3PHrwrbXuR7HFZGG5920RATD4YxyZKMDW_CKqPrzehJZztQKAwurOMkZCu5Veq1BHhD13nXj-uQn17VCvxjoEPqvRoXrgJb76w06ccjeZ3QUCA43aCp9MNEM_VwwtfIsSVk18q-TySQODMqz7pSN5-as2iVc85somyEZKxQgnIeCkGHPNq527hhCiPZ0PZ4NMFgqF9PT6sbIK8gjwyuaH4Pni8Evb625IIMzP6uL_dPaXk71aMbmb1o8aEpS3m32v7z9ZTYDr5_mu_lFqcwg93_lWpCGKfsFUM8HKvlMhQ2NmJ4wNDGbcTUMza8HPVun0XIKWJZ8uQWLFG9Lk3d12pRBHGHRRI5T9a1O8iFIv3r0AjhlntiEMV_KPso0VhpGEGNtQX4kioQh6_aAIUXmm82UOrg",
      },
    ]);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch(
      "https://www.heromotocorp.com/content/hero-commerce/in/en/products/product-page/practical/jcr:content.book-test-ride.json",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.error(error));

}


//Render Data
function renderResponse(){

}
