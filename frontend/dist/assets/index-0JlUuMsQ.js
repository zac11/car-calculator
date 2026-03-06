(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))l(e);new MutationObserver(e=>{for(const o of e)if(o.type==="childList")for(const m of o.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&l(m)}).observe(document,{childList:!0,subtree:!0});function a(e){const o={};return e.integrity&&(o.integrity=e.integrity),e.referrerPolicy&&(o.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?o.credentials="include":e.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function l(e){if(e.ep)return;e.ep=!0;const o=a(e);fetch(e.href,o)}})();async function T(i){const n=await fetch("/api/calculate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(!n.ok){const a=await n.json().catch(()=>({}));throw new Error((a==null?void 0:a.error)||"Failed to fetch calculation")}return n.json()}function r(i){return`₹${Number(i||0).toLocaleString("en-IN",{maximumFractionDigits:0})}`}function h(i,n=1){return Number.isFinite(i)?i.toLocaleString("en-IN",{maximumFractionDigits:n,minimumFractionDigits:n}):"—"}function H(i){const n=Math.round(Math.abs(i));return n===0?"Same as Uber":(i<0?"Saves ":"Costs ")+r(n)+" / month vs Uber"}async function I({lat:i,lon:n}){const a=new URL("https://nominatim.openstreetmap.org/reverse");a.searchParams.set("format","jsonv2"),a.searchParams.set("lat",String(i)),a.searchParams.set("lon",String(n)),a.searchParams.set("zoom","10"),a.searchParams.set("addressdetails","1");const l=await fetch(a.toString(),{headers:{Accept:"application/json"}});return l.ok?await l.json().catch(()=>null):null}function S(){const i=document.getElementById("app");i.innerHTML=`
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
  `;const n=document.getElementById("calculator-form"),a=document.getElementById("results"),l=document.getElementById("summary-monthly-km"),e=document.getElementById("use-location"),o=document.getElementById("location-status"),m=document.getElementById("locationCity"),P=document.getElementById("locationState"),C=document.getElementById("locationLat"),M=document.getElementById("locationLon");e&&o&&m&&P&&C&&M&&e.addEventListener("click",()=>{if(!navigator.geolocation){o.textContent="Geolocation not supported in this browser.";return}e.disabled=!0,e.textContent="Getting…",o.textContent="Requesting permission…",navigator.geolocation.getCurrentPosition(async s=>{const p=s.coords.latitude,g=s.coords.longitude;C.value=h(p,6),M.value=h(g,6),o.textContent="Coordinates captured. Looking up city/state…";const d=await I({lat:p,lon:g}),c=(d==null?void 0:d.address)||{},u=c.city||c.town||c.village||c.suburb||"",v=c.state||"";u&&(m.value=u),v&&(P.value=v),o.textContent=u||v?`Set to ${[u,v].filter(Boolean).join(", ")}`:"Coordinates set",e.disabled=!1,e.textContent="Use my location"},s=>{const p=(s==null?void 0:s.code)===1?"Permission denied.":(s==null?void 0:s.code)===2?"Position unavailable.":(s==null?void 0:s.code)===3?"Timed out.":"Failed to get location.";o.textContent=p,e.disabled=!1,e.textContent="Use my location"},{enableHighAccuracy:!1,timeout:1e4,maximumAge:6e5})}),n.addEventListener("submit",s=>{s.preventDefault();const p=new FormData(n),g=Object.fromEntries(p.entries());a.innerHTML='<p class="placeholder">Calculating…</p>',l.textContent="",T(g).then(d=>{const{monthlyKm:c,rideHailingCostPerMonth:u,rideHailingCostPerKm:v,results:f}=d;if(l.textContent=`Estimated driving: ${c.toFixed(0)} km / month · Current Uber spend: ${r(u)} / month`,!f||f.length===0){a.innerHTML='<p class="placeholder">No cars available in the catalog.</p>';return}const L=f[0];a.innerHTML="";const y=document.createElement("section");y.className="summary-card",y.innerHTML=`
          <div>
            <div class="summary-title">Summary</div>
            <div class="summary-sub">All numbers are estimates. Edit assumptions to see what changes.</div>
          </div>
          <div class="summary-metrics">
            <div>Monthly km: <strong>${Math.round(c)}</strong></div>
            <div>Uber: <strong>${r(u)}</strong> / month</div>
            <div>Uber ₹/km: <strong>${h(v,1)}</strong></div>
            <div>Best option: <strong>${L.carName}</strong></div>
          </div>
        `,a.appendChild(y),f.forEach(t=>{const b=document.createElement("article");b.className="result-card";const k=t===L,w=t.deltaVsRideHailing<-1e3?"negative":t.deltaVsRideHailing>1e3?"positive":"neutral",$=t.condition==="used"?"used":"new",x=t.fuelType==="ev"?"ev":"petrol",E=t.breakEvenKmPerMonth==null?"No break-even":`${Math.round(t.breakEvenKmPerMonth)} km / month`;b.innerHTML=`
            <div class="result-header">
              <div class="result-title">${t.carName}${k?" · Best match":""}</div>
              <div class="result-tags">
                <span class="tag ${$}">${t.condition.toUpperCase()}</span>
                <span class="tag ${x}">${t.fuelType.toUpperCase()}</span>
                <span class="tag">On-road approx ${r(t.onRoadPrice)}</span>
                <span class="tag">Break-even: ${E}</span>
              </div>
              <div class="cost-pill">
                <strong>${r(t.totalPerMonth)}</strong>
                <span>/ month (all-in est.)</span>
              </div>
              <div class="delta ${w}">${H(t.deltaVsRideHailing)}</div>
            </div>
            <div class="breakdown">
              <span>Fixed: ${r(t.fixedPerMonth)}</span>
              <span>Variable (energy): ${r(t.variablePerMonth)}</span>
              <span>Total ₹/km: ${h(t.totalCostPerKm,1)}</span>
              <span>Variable ₹/km: ${h(t.variableCostPerKm,1)}</span>
              <span>Depreciation: ${r(t.depreciationPerMonth)}</span>
              <span>Maintenance: ${r(t.maintenancePerMonth)}</span>
              <span>Insurance: ${r(t.insurancePerMonth)}</span>
              <span>Parking+misc: ${r(t.parkingAndMiscPerMonth)}</span>
              <span>Total km / month: ${Math.round(t.monthlyKm)} km</span>
              <span>±20% km cost: ${r(t.sensitivity.totalLow)} to ${r(t.sensitivity.totalHigh)}</span>
            </div>
          `,a.appendChild(b)})}).catch(d=>{a.innerHTML=`<p class="placeholder">${d.message||"Something went wrong. Please try again."}</p>`})})}S();
