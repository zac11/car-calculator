const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { cars } = require("./data/cars");
const { buildComparison } = require("./utils/costCalculator");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve production frontend build if present.
// This keeps frontend/backed separated in dev, but allows a single deployable server in prod.
const frontendDistDir = path.join(__dirname, "..", "..", "frontend", "dist");
const frontendIndexHtml = path.join(frontendDistDir, "index.html");
const hasFrontendBuild = fs.existsSync(frontendIndexHtml);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/cars", (_req, res) => {
  res.json({ cars });
});

app.post("/api/calculate", (req, res) => {
  try {
    const body = req.body || {};

    const electricityPricePerKwhRaw = body.electricityPricePerKwh;
    const electricityPricePerKwh = Number(electricityPricePerKwhRaw);
    if (!Number.isFinite(electricityPricePerKwh) || electricityPricePerKwh <= 0) {
      return res.status(400).json({
        error: "electricityPricePerKwh is required and must be > 0"
      });
    }

    const purchaseMode = body.purchaseMode === "cash" ? "cash" : "loan";
    const hasHomeCharging = body.hasHomeCharging === "yes";
    const publicChargingMultiplierRaw = Number(body.publicChargingMultiplier);
    const publicChargingMultiplier = Number.isFinite(publicChargingMultiplierRaw) && publicChargingMultiplierRaw >= 1
      ? publicChargingMultiplierRaw
      : 1.8;

    const depreciationOverrideRaw = body.depreciationRateYearlyPctOverride;
    const depreciationRateYearlyPctOverride =
      depreciationOverrideRaw === "" || depreciationOverrideRaw == null
        ? null
        : Number(depreciationOverrideRaw);

    const params = {
      commuteDistanceRoundTripKm: Number(body.commuteDistanceRoundTripKm) || 30,
      commuteDaysPerWeek: Number(body.commuteDaysPerWeek) || 5,
      otherKmPerMonth: Number(body.otherKmPerMonth) || 200,
      rideHailingCostPerMonth: Number(body.rideHailingCostPerMonth) || 15000,
      petrolPricePerLitre: Number(body.petrolPricePerLitre) || 105,
      electricityPricePerKwh,
      loanDownPaymentPct: Number(body.loanDownPaymentPct) || 20,
      loanTenureYears: Number(body.loanTenureYears) || 5,
      loanInterestRatePct: Number(body.loanInterestRatePct) || 10,
      parkingAndMiscPerMonth: Number(body.parkingAndMiscPerMonth) || 2000,
      purchaseMode,
      hasHomeCharging,
      publicChargingMultiplier,
      depreciationRateYearlyPctOverride:
        Number.isFinite(depreciationRateYearlyPctOverride) && depreciationRateYearlyPctOverride >= 0
          ? depreciationRateYearlyPctOverride
          : null
    };

    const comparison = buildComparison({ cars, params });
    res.json(comparison);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Error in /api/calculate", err);
    res.status(500).json({ error: "Failed to calculate comparison" });
  }
});

if (hasFrontendBuild) {
  app.use(express.static(frontendDistDir));

  // SPA fallback for client-side routing
  app.get("*", (_req, res) => {
    res.sendFile(frontendIndexHtml);
  });
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Car calculator server listening on http://localhost:${PORT}`);
});

