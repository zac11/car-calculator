// Core cost calculation logic shared by API routes.

function calculateMonthlyKm({
  commuteDistanceRoundTripKm,
  commuteDaysPerWeek,
  otherKmPerMonth
}) {
  const weeklyCommuteKm = commuteDistanceRoundTripKm * commuteDaysPerWeek;
  const monthlyCommuteKm = weeklyCommuteKm * 4.3; // average weeks per month
  return monthlyCommuteKm + otherKmPerMonth;
}

function calculateLoanEmi({
  principal,
  annualInterestRatePct,
  tenureYears
}) {
  if (!principal || principal <= 0 || tenureYears <= 0) {
    return 0;
  }

  const monthlyRate = annualInterestRatePct ? annualInterestRatePct / 12 / 100 : 0;
  const n = tenureYears * 12;

  if (!monthlyRate) {
    return principal / n;
  }

  const factor = Math.pow(1 + monthlyRate, n);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return emi;
}

function getDepreciationRateYearlyPct({ car, depreciationRateYearlyPctOverride }) {
  if (Number.isFinite(depreciationRateYearlyPctOverride) && depreciationRateYearlyPctOverride >= 0) {
    return depreciationRateYearlyPctOverride;
  }

  // Coarse defaults. Real depreciation varies heavily by brand/model/city.
  // Kept intentionally simple and transparent.
  if (car.condition === "new") {
    return car.fuelType === "ev" ? 12 : 10;
  }
  return car.fuelType === "ev" ? 10 : 8;
}

function calculateCarMonthlyCost({
  car,
  monthlyKm,
  petrolPricePerLitre,
  electricityPricePerKwh,
  usesPublicCharging,
  publicChargingMultiplier,
  loanDownPaymentPct,
  loanTenureYears,
  loanInterestRatePct,
  purchaseMode,
  depreciationRateYearlyPctOverride,
  parkingAndMiscPerMonth
}) {
  const price = car.onRoadPrice;
  const downPayment = (loanDownPaymentPct / 100) * price;
  const loanAmount = Math.max(price - downPayment, 0);

  const emi =
    purchaseMode === "cash"
      ? 0
      : calculateLoanEmi({
          principal: loanAmount,
          annualInterestRatePct: loanInterestRatePct,
          tenureYears: loanTenureYears
        });

  let energyCostPerMonth = 0;
  if (car.fuelType === "petrol") {
    const litresPerMonth = monthlyKm / car.efficiency;
    energyCostPerMonth = litresPerMonth * petrolPricePerLitre;
  } else if (car.fuelType === "ev") {
    const kwhPerMonth = (car.efficiency / 100) * monthlyKm;
    const effectiveElectricityPrice = usesPublicCharging
      ? electricityPricePerKwh * publicChargingMultiplier
      : electricityPricePerKwh;
    energyCostPerMonth = kwhPerMonth * effectiveElectricityPrice;
  }

  const maintenancePerMonth = (car.maintenanceFactor * price) / 1000;
  const insurancePerMonth = ((car.insuranceRateYearlyPct / 100) * price) / 12;
  const depreciationRateYearlyPct = getDepreciationRateYearlyPct({
    car,
    depreciationRateYearlyPctOverride
  });
  const depreciationPerMonth = ((depreciationRateYearlyPct / 100) * price) / 12;

  const fixedPerMonth =
    emi + maintenancePerMonth + insurancePerMonth + parkingAndMiscPerMonth + depreciationPerMonth;
  const variablePerMonth = energyCostPerMonth;
  const totalPerMonth = fixedPerMonth + variablePerMonth;

  const variableCostPerKm = monthlyKm > 0 ? variablePerMonth / monthlyKm : 0;
  const totalCostPerKm = monthlyKm > 0 ? totalPerMonth / monthlyKm : 0;

  return {
    emi,
    energyCostPerMonth,
    maintenancePerMonth,
    insurancePerMonth,
    depreciationPerMonth,
    parkingAndMiscPerMonth,
    fixedPerMonth,
    variablePerMonth,
    variableCostPerKm,
    totalCostPerKm,
    totalPerMonth
  };
}

function computeBreakEvenKmPerMonth({ fixedPerMonth, variableCostPerKm, rideHailingCostPerKm }) {
  if (!Number.isFinite(rideHailingCostPerKm) || rideHailingCostPerKm <= 0) return null;

  const denom = rideHailingCostPerKm - variableCostPerKm;
  if (denom <= 0) return null; // Ownership variable cost already >= ride-hailing

  const km = fixedPerMonth / denom;
  if (!Number.isFinite(km) || km < 0) return null;
  return km;
}

function buildComparison({
  cars,
  params
}) {
  const monthlyKm = calculateMonthlyKm({
    commuteDistanceRoundTripKm: params.commuteDistanceRoundTripKm,
    commuteDaysPerWeek: params.commuteDaysPerWeek,
    otherKmPerMonth: params.otherKmPerMonth
  });

  const rideHailingCostPerMonth = params.rideHailingCostPerMonth;
  const rideHailingCostPerKm = monthlyKm > 0 ? rideHailingCostPerMonth / monthlyKm : null;

  const results = cars.map((car) => {
    const breakdown = calculateCarMonthlyCost({
      car,
      monthlyKm,
      petrolPricePerLitre: params.petrolPricePerLitre,
      electricityPricePerKwh: params.electricityPricePerKwh,
      usesPublicCharging: car.fuelType === "ev" ? !params.hasHomeCharging : false,
      publicChargingMultiplier: params.publicChargingMultiplier,
      loanDownPaymentPct: params.loanDownPaymentPct,
      loanTenureYears: params.loanTenureYears,
      loanInterestRatePct: params.loanInterestRatePct,
      purchaseMode: params.purchaseMode,
      depreciationRateYearlyPctOverride: params.depreciationRateYearlyPctOverride,
      parkingAndMiscPerMonth: params.parkingAndMiscPerMonth
    });

    const deltaVsRideHailing = breakdown.totalPerMonth - rideHailingCostPerMonth;
    const breakEvenKmPerMonth = computeBreakEvenKmPerMonth({
      fixedPerMonth: breakdown.fixedPerMonth,
      variableCostPerKm: breakdown.variableCostPerKm,
      rideHailingCostPerKm
    });

    const kmLow = monthlyKm * 0.8;
    const kmHigh = monthlyKm * 1.2;
    const totalLow = breakdown.fixedPerMonth + breakdown.variableCostPerKm * kmLow;
    const totalHigh = breakdown.fixedPerMonth + breakdown.variableCostPerKm * kmHigh;

    return {
      carId: car.id,
      carName: car.name,
      condition: car.condition,
      fuelType: car.fuelType,
      onRoadPrice: car.onRoadPrice,
      monthlyKm,
      rideHailingCostPerMonth,
      rideHailingCostPerKm,
      ...breakdown,
      deltaVsRideHailing
      ,
      breakEvenKmPerMonth,
      sensitivity: {
        kmLow,
        kmHigh,
        totalLow,
        totalHigh,
        deltaLow: totalLow - rideHailingCostPerMonth,
        deltaHigh: totalHigh - rideHailingCostPerMonth
      }
    };
  });

  const sorted = results.sort((a, b) => a.totalPerMonth - b.totalPerMonth);

  return {
    monthlyKm,
    rideHailingCostPerMonth,
    rideHailingCostPerKm,
    results: sorted
  };
}

module.exports = {
  calculateMonthlyKm,
  calculateLoanEmi,
  calculateCarMonthlyCost,
  computeBreakEvenKmPerMonth,
  buildComparison
};

