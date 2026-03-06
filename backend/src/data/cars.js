// Sample catalog of cars (mix of new/used, petrol/EV)
// Prices are rough and purely illustrative (in INR).

const cars = [
  {
    id: "used-petrol-hatch-1",
    name: "Used City Hatchback",
    brand: "Generic",
    variant: "1.2L Petrol",
    condition: "used",
    fuelType: "petrol",
    onRoadPrice: 350000,
    // km per litre
    efficiency: 15,
    // relative maintenance factor (per month as % of price / 1000)
    maintenanceFactor: 0.35,
    // yearly insurance as % of on-road price
    insuranceRateYearlyPct: 3
  },
  {
    id: "used-petrol-sedan-1",
    name: "Used Compact Sedan",
    brand: "Generic",
    variant: "1.5L Petrol",
    condition: "used",
    fuelType: "petrol",
    onRoadPrice: 500000,
    efficiency: 14,
    maintenanceFactor: 0.4,
    insuranceRateYearlyPct: 3
  },
  {
    id: "new-petrol-hatch-1",
    name: "New Efficient Hatchback",
    brand: "Generic",
    variant: "1.2L Petrol",
    condition: "new",
    fuelType: "petrol",
    onRoadPrice: 700000,
    efficiency: 18,
    maintenanceFactor: 0.3,
    insuranceRateYearlyPct: 3
  },
  {
    id: "used-ev-hatch-1",
    name: "Used City EV",
    brand: "Generic",
    variant: "30 kWh Pack",
    condition: "used",
    fuelType: "ev",
    onRoadPrice: 800000,
    // kWh per 100 km
    efficiency: 15,
    maintenanceFactor: 0.25,
    insuranceRateYearlyPct: 3
  },
  {
    id: "new-ev-compact-1",
    name: "New Compact EV",
    brand: "Generic",
    variant: "40 kWh Pack",
    condition: "new",
    fuelType: "ev",
    onRoadPrice: 1200000,
    efficiency: 16,
    maintenanceFactor: 0.22,
    insuranceRateYearlyPct: 3
  }
];

module.exports = {
  cars
};

