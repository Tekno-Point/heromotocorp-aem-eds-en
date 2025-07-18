const fetchCategory = async () => {
    const response = await fetch('blocks/header/mock-category.json');
    const vehiclePriceData = await response.json();
    console.log(vehiclePriceData);
    const vehiclesObj = vehicleTypeFilter(vehiclePriceData.products.items);
    console.log(vehiclesObj);

    return {vehiclePriceData, vehiclesObj};
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
