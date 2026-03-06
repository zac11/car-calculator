import "./styles.css";

async function fetchCalculation(payload) {
  const res = await fetch("/api/calculate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to fetch calculation");
  }

  return res.json();
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0
  })}`;
}

function formatNumber(value, digits = 1) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}

function formatDelta(delta) {
  const rounded = Math.round(Math.abs(delta));
  if (rounded === 0) return "Same as Uber";
  return (delta < 0 ? "Saves " : "Costs ") + formatCurrency(rounded) + " / month vs Uber";
}

async function reverseGeocode({ lat, lon }) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json"
    }
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data;
}

function renderApp() {
  const root = document.getElementById("app");
  root.innerHTML = `
    <div class="page">
      <header class="header">
        <div>
          <h1>Car Cost Comparison</h1>
          <p>Compare Uber/ride-hailing vs owning petrol or electric cars.</p>
        </div>
      </header>

      <main class="main">
        <section class="card">
          <h2>Your Travel Profile</h2>
          <form id="calculator-form" class="form-grid">
            <div class="field">
              <label for="rideHailingCostPerMonth">Current monthly Uber / ride-hailing spend (₹)</label>
              <input id="rideHailingCostPerMonth" name="rideHailingCostPerMonth" type="number" value="14000" min="0" />
            </div>

            <div class="field">
              <label for="commuteDistanceRoundTripKm">Daily commute distance (round trip, km)</label>
              <input id="commuteDistanceRoundTripKm" name="commuteDistanceRoundTripKm" type="number" value="50" min="0" />
            </div>

            <div class="field">
              <label for="commuteDaysPerWeek">Commute days per week</label>
              <input id="commuteDaysPerWeek" name="commuteDaysPerWeek" type="number" value="4" min="0" max="7" />
            </div>

            <div class="field">
              <label for="otherKmPerMonth">Other driving per month (km)</label>
              <input id="otherKmPerMonth" name="otherKmPerMonth" type="number" value="200" min="0" />
            </div>

            <div class="field">
              <label for="petrolPricePerLitre">Petrol price (₹/L)</label>
              <input id="petrolPricePerLitre" name="petrolPricePerLitre" type="number" value="105" min="0" step="0.1" />
            </div>

            <div class="field">
              <label for="electricityPricePerKwh">
                Electricity price (₹/kWh) <span class="required">*</span>
              </label>
              <input id="electricityPricePerKwh" name="electricityPricePerKwh" type="number" value="8" min="0" step="0.1" required />
            </div>

            <div class="field">
              <label for="purchaseMode">Purchase mode</label>
              <select id="purchaseMode" name="purchaseMode">
                <option value="loan" selected>Loan (EMI)</option>
                <option value="cash">Cash (no EMI)</option>
              </select>
            </div>

            <div class="field">
              <label for="hasHomeCharging">EV charging at home</label>
              <select id="hasHomeCharging" name="hasHomeCharging">
                <option value="yes" selected>Yes</option>
                <option value="no">No (assume public charging)</option>
              </select>
            </div>

            <div class="field">
              <label for="loanDownPaymentPct">Down payment (% of on-road price)</label>
              <input id="loanDownPaymentPct" name="loanDownPaymentPct" type="number" value="20" min="0" max="100" />
            </div>

            <div class="field">
              <label for="loanTenureYears">Loan tenure (years)</label>
              <input id="loanTenureYears" name="loanTenureYears" type="number" value="5" min="1" max="8" />
            </div>

            <div class="field">
              <label for="loanInterestRatePct">Loan interest rate (% p.a.)</label>
              <input id="loanInterestRatePct" name="loanInterestRatePct" type="number" value="10" min="0" max="20" step="0.1" />
            </div>

            <div class="field">
              <label for="parkingAndMiscPerMonth">Parking + misc fixed costs per month (₹)</label>
              <input id="parkingAndMiscPerMonth" name="parkingAndMiscPerMonth" type="number" value="2000" min="0" />
            </div>

            <div class="field">
              <label for="publicChargingMultiplier">If no home charging: public charging multiplier</label>
              <input id="publicChargingMultiplier" name="publicChargingMultiplier" type="number" value="1.8" min="1" step="0.1" />
            </div>

            <div class="field">
              <label for="depreciationRateYearlyPctOverride">Depreciation override (% / year, optional)</label>
              <input id="depreciationRateYearlyPctOverride" name="depreciationRateYearlyPctOverride" type="number" placeholder="leave blank for defaults" min="0" step="0.1" />
            </div>

            <div class="field field-wide">
              <div class="location-row">
                <div>
                  <label>Your location (optional)</label>
                  <div class="location-sub" id="location-status">Not set</div>
                </div>
                <button type="button" class="btn-secondary" id="use-location">Use my location</button>
              </div>
              <div class="location-grid">
                <div>
                  <label for="locationCity">City</label>
                  <input id="locationCity" name="locationCity" type="text" placeholder="e.g. Bengaluru" />
                </div>
                <div>
                  <label for="locationState">State</label>
                  <input id="locationState" name="locationState" type="text" placeholder="e.g. Karnataka" />
                </div>
                <div>
                  <label for="locationLat">Latitude</label>
                  <input id="locationLat" name="locationLat" type="text" readonly />
                </div>
                <div>
                  <label for="locationLon">Longitude</label>
                  <input id="locationLon" name="locationLon" type="text" readonly />
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary">Calculate</button>
              <span id="summary-monthly-km" class="summary-text"></span>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>Recommendations</h2>
          <div id="results" class="results-grid">
            <p class="placeholder">Fill in your details and click Calculate to see which petrol or electric car (new or used) makes sense vs Uber.</p>
          </div>
        </section>
      </main>

      <footer class="footer">
        <p>This is an educational estimator. Real-world costs vary by city, fuel prices, car model, and your driving style.</p>
      </footer>
    </div>
  `;

  const form = document.getElementById("calculator-form");
  const resultsContainer = document.getElementById("results");
  const summaryMonthlyKm = document.getElementById("summary-monthly-km");
  const useLocationBtn = document.getElementById("use-location");
  const locationStatus = document.getElementById("location-status");
  const locationCity = document.getElementById("locationCity");
  const locationState = document.getElementById("locationState");
  const locationLat = document.getElementById("locationLat");
  const locationLon = document.getElementById("locationLon");

  if (useLocationBtn && locationStatus && locationCity && locationState && locationLat && locationLon) {
    useLocationBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        locationStatus.textContent = "Geolocation not supported in this browser.";
        return;
      }

      useLocationBtn.disabled = true;
      useLocationBtn.textContent = "Getting…";
      locationStatus.textContent = "Requesting permission…";

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          locationLat.value = formatNumber(lat, 6);
          locationLon.value = formatNumber(lon, 6);
          locationStatus.textContent = "Coordinates captured. Looking up city/state…";

          const geo = await reverseGeocode({ lat, lon });
          const addr = geo?.address || {};
          const city = addr.city || addr.town || addr.village || addr.suburb || "";
          const state = addr.state || "";
          if (city) locationCity.value = city;
          if (state) locationState.value = state;

          locationStatus.textContent = city || state ? `Set to ${[city, state].filter(Boolean).join(", ")}` : "Coordinates set";
          useLocationBtn.disabled = false;
          useLocationBtn.textContent = "Use my location";
        },
        (err) => {
          const msg =
            err?.code === 1
              ? "Permission denied."
              : err?.code === 2
              ? "Position unavailable."
              : err?.code === 3
              ? "Timed out."
              : "Failed to get location.";
          locationStatus.textContent = msg;
          useLocationBtn.disabled = false;
          useLocationBtn.textContent = "Use my location";
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 600000
        }
      );
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());

    resultsContainer.innerHTML = '<p class="placeholder">Calculating…</p>';
    summaryMonthlyKm.textContent = "";

    fetchCalculation(payload)
      .then((result) => {
        const { monthlyKm, rideHailingCostPerMonth, rideHailingCostPerKm, results } = result;

        summaryMonthlyKm.textContent = `Estimated driving: ${monthlyKm.toFixed(
          0
        )} km / month · Current Uber spend: ${formatCurrency(rideHailingCostPerMonth)} / month`;

        if (!results || results.length === 0) {
          resultsContainer.innerHTML = '<p class="placeholder">No cars available in the catalog.</p>';
          return;
        }

        const best = results[0];
        resultsContainer.innerHTML = "";

        const summary = document.createElement("section");
        summary.className = "summary-card";
        summary.innerHTML = `
          <div>
            <div class="summary-title">Summary</div>
            <div class="summary-sub">All numbers are estimates. Edit assumptions to see what changes.</div>
          </div>
          <div class="summary-metrics">
            <div>Monthly km: <strong>${Math.round(monthlyKm)}</strong></div>
            <div>Uber: <strong>${formatCurrency(rideHailingCostPerMonth)}</strong> / month</div>
            <div>Uber ₹/km: <strong>${formatNumber(rideHailingCostPerKm, 1)}</strong></div>
            <div>Best option: <strong>${best.carName}</strong></div>
          </div>
        `;
        resultsContainer.appendChild(summary);

        const cityForSearch = (locationCity.value || "").trim();

        results.forEach((item) => {
          const card = document.createElement("article");
          card.className = "result-card";

          const isBest = item === best;
          const deltaClass =
            item.deltaVsRideHailing < -1000 ? "negative" : item.deltaVsRideHailing > 1000 ? "positive" : "neutral";
          const conditionClass = item.condition === "used" ? "used" : "new";
          const fuelClass = item.fuelType === "ev" ? "ev" : "petrol";
          const breakEven =
            item.breakEvenKmPerMonth == null ? "No break-even" : `${Math.round(item.breakEvenKmPerMonth)} km / month`;

          const query = encodeURIComponent(
            [item.carName, cityForSearch].filter(Boolean).join(" ").trim() || item.carName
          );
          const carTradeUrl = `https://www.cartrade.com/buy-used-cars/?q=${query}`;
          const carDekhoUrl = `https://www.cardekho.com/used-cars+cars+near+me.htm?city=${query}`;
          const olxUrl = `https://www.olx.in/cars_c84?search[query]=${query}`;

          card.innerHTML = `
            <div class="result-header">
              <div class="result-title">${item.carName}${isBest ? " · Best match" : ""}</div>
              <div class="result-tags">
                <span class="tag ${conditionClass}">${item.condition.toUpperCase()}</span>
                <span class="tag ${fuelClass}">${item.fuelType.toUpperCase()}</span>
                <span class="tag">On-road approx ${formatCurrency(item.onRoadPrice)}</span>
                <span class="tag">Break-even: ${breakEven}</span>
              </div>
              <div class="cost-pill">
                <strong>${formatCurrency(item.totalPerMonth)}</strong>
                <span>/ month (all-in est.)</span>
              </div>
              <div class="delta ${deltaClass}">${formatDelta(item.deltaVsRideHailing)}</div>
              <div class="market-links">
                <a class="market-link" href="${carTradeUrl}" target="_blank" rel="noopener noreferrer">CarTrade</a>
                <a class="market-link" href="${carDekhoUrl}" target="_blank" rel="noopener noreferrer">CarDekho</a>
                <a class="market-link" href="${olxUrl}" target="_blank" rel="noopener noreferrer">OLX</a>
              </div>
            </div>
            <div class="breakdown">
              <span>Fixed: ${formatCurrency(item.fixedPerMonth)}</span>
              <span>Variable (energy): ${formatCurrency(item.variablePerMonth)}</span>
              <span>Total ₹/km: ${formatNumber(item.totalCostPerKm, 1)}</span>
              <span>Variable ₹/km: ${formatNumber(item.variableCostPerKm, 1)}</span>
              <span>Depreciation: ${formatCurrency(item.depreciationPerMonth)}</span>
              <span>Maintenance: ${formatCurrency(item.maintenancePerMonth)}</span>
              <span>Insurance: ${formatCurrency(item.insurancePerMonth)}</span>
              <span>Parking+misc: ${formatCurrency(item.parkingAndMiscPerMonth)}</span>
              <span>Total km / month: ${Math.round(item.monthlyKm)} km</span>
              <span>±20% km cost: ${formatCurrency(item.sensitivity.totalLow)} to ${formatCurrency(
                item.sensitivity.totalHigh
              )}</span>
            </div>
          `;

          resultsContainer.appendChild(card);
        });
      })
      .catch((err) => {
        resultsContainer.innerHTML = `<p class="placeholder">${err.message || "Something went wrong. Please try again."}</p>`;
      });
  });
}

renderApp();

