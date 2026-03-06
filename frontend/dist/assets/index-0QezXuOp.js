(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))l(t);new MutationObserver(t=>{for(const o of t)if(o.type==="childList")for(const d of o.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&l(d)}).observe(document,{childList:!0,subtree:!0});function a(t){const o={};return t.integrity&&(o.integrity=t.integrity),t.referrerPolicy&&(o.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?o.credentials="include":t.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function l(t){if(t.ep)return;t.ep=!0;const o=a(t);fetch(t.href,o)}})();async function K(i){const n=await fetch("/api/calculate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)});if(!n.ok){const a=await n.json().catch(()=>({}));throw new Error((a==null?void 0:a.error)||"Failed to fetch calculation")}return n.json()}function s(i){return`₹${Number(i||0).toLocaleString("en-IN",{maximumFractionDigits:0})}`}function h(i,n=1){return Number.isFinite(i)?i.toLocaleString("en-IN",{maximumFractionDigits:n,minimumFractionDigits:n}):"—"}function N(i){const n=Math.round(Math.abs(i));return n===0?"Same as Uber":(i<0?"Saves ":"Costs ")+s(n)+" / month vs Uber"}async function B({lat:i,lon:n}){const a=new URL("https://nominatim.openstreetmap.org/reverse");a.searchParams.set("format","jsonv2"),a.searchParams.set("lat",String(i)),a.searchParams.set("lon",String(n)),a.searchParams.set("zoom","10"),a.searchParams.set("addressdetails","1");const l=await fetch(a.toString(),{headers:{Accept:"application/json"}});return l.ok?await l.json().catch(()=>null):null}function R(){const i=document.getElementById("app");i.innerHTML=`
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
  `;const n=document.getElementById("calculator-form"),a=document.getElementById("results"),l=document.getElementById("summary-monthly-km"),t=document.getElementById("use-location"),o=document.getElementById("location-status"),d=document.getElementById("locationCity"),C=document.getElementById("locationState"),k=document.getElementById("locationLat"),M=document.getElementById("locationLon");t&&o&&d&&C&&k&&M&&t.addEventListener("click",()=>{if(!navigator.geolocation){o.textContent="Geolocation not supported in this browser.";return}t.disabled=!0,t.textContent="Getting…",o.textContent="Requesting permission…",navigator.geolocation.getCurrentPosition(async r=>{const p=r.coords.latitude,f=r.coords.longitude;k.value=h(p,6),M.value=h(f,6),o.textContent="Coordinates captured. Looking up city/state…";const u=await B({lat:p,lon:f}),c=(u==null?void 0:u.address)||{},m=c.city||c.town||c.village||c.suburb||"",v=c.state||"";m&&(d.value=m),v&&(C.value=v),o.textContent=m||v?`Set to ${[m,v].filter(Boolean).join(", ")}`:"Coordinates set",t.disabled=!1,t.textContent="Use my location"},r=>{const p=(r==null?void 0:r.code)===1?"Permission denied.":(r==null?void 0:r.code)===2?"Position unavailable.":(r==null?void 0:r.code)===3?"Timed out.":"Failed to get location.";o.textContent=p,t.disabled=!1,t.textContent="Use my location"},{enableHighAccuracy:!1,timeout:1e4,maximumAge:6e5})}),n.addEventListener("submit",r=>{r.preventDefault();const p=new FormData(n),f=Object.fromEntries(p.entries());a.innerHTML='<p class="placeholder">Calculating…</p>',l.textContent="",K(f).then(u=>{const{monthlyKm:c,rideHailingCostPerMonth:m,rideHailingCostPerKm:v,results:g}=u;if(l.textContent=`Estimated driving: ${c.toFixed(0)} km / month · Current Uber spend: ${s(m)} / month`,!g||g.length===0){a.innerHTML='<p class="placeholder">No cars available in the catalog.</p>';return}const w=g[0];a.innerHTML="";const y=document.createElement("section");y.className="summary-card",y.innerHTML=`
          <div>
            <div class="summary-title">Summary</div>
            <div class="summary-sub">All numbers are estimates. Edit assumptions to see what changes.</div>
          </div>
          <div class="summary-metrics">
            <div>Monthly km: <strong>${Math.round(c)}</strong></div>
            <div>Uber: <strong>${s(m)}</strong> / month</div>
            <div>Uber ₹/km: <strong>${h(v,1)}</strong></div>
            <div>Best option: <strong>${w.carName}</strong></div>
          </div>
        `,a.appendChild(y);const L=(d.value||"").trim();g.forEach(e=>{const b=document.createElement("article");b.className="result-card";const $=e===w,x=e.deltaVsRideHailing<-1e3?"negative":e.deltaVsRideHailing>1e3?"positive":"neutral",E=e.condition==="used"?"used":"new",T=e.fuelType==="ev"?"ev":"petrol",D=e.breakEvenKmPerMonth==null?"No break-even":`${Math.round(e.breakEvenKmPerMonth)} km / month`,P=encodeURIComponent([e.carName,L].filter(Boolean).join(" ").trim()||e.carName),I=`https://www.cartrade.com/buy-used-cars/?q=${P}`,S=`https://www.cardekho.com/used-cars+cars+near+me.htm?city=${P}`,H=`https://www.olx.in/cars_c84?search[query]=${P}`;b.innerHTML=`
            <div class="result-header">
              <div class="result-title">${e.carName}${$?" · Best match":""}</div>
              <div class="result-tags">
                <span class="tag ${E}">${e.condition.toUpperCase()}</span>
                <span class="tag ${T}">${e.fuelType.toUpperCase()}</span>
                <span class="tag">On-road approx ${s(e.onRoadPrice)}</span>
                <span class="tag">Break-even: ${D}</span>
              </div>
              <div class="cost-pill">
                <strong>${s(e.totalPerMonth)}</strong>
                <span>/ month (all-in est.)</span>
              </div>
              <div class="delta ${x}">${N(e.deltaVsRideHailing)}</div>
              <div class="market-links">
                <a class="market-link" href="${I}" target="_blank" rel="noopener noreferrer">CarTrade</a>
                <a class="market-link" href="${S}" target="_blank" rel="noopener noreferrer">CarDekho</a>
                <a class="market-link" href="${H}" target="_blank" rel="noopener noreferrer">OLX</a>
              </div>
            </div>
            <div class="breakdown">
              <span>Fixed: ${s(e.fixedPerMonth)}</span>
              <span>Variable (energy): ${s(e.variablePerMonth)}</span>
              <span>Total ₹/km: ${h(e.totalCostPerKm,1)}</span>
              <span>Variable ₹/km: ${h(e.variableCostPerKm,1)}</span>
              <span>Depreciation: ${s(e.depreciationPerMonth)}</span>
              <span>Maintenance: ${s(e.maintenancePerMonth)}</span>
              <span>Insurance: ${s(e.insurancePerMonth)}</span>
              <span>Parking+misc: ${s(e.parkingAndMiscPerMonth)}</span>
              <span>Total km / month: ${Math.round(e.monthlyKm)} km</span>
              <span>±20% km cost: ${s(e.sensitivity.totalLow)} to ${s(e.sensitivity.totalHigh)}</span>
            </div>
          `,a.appendChild(b)})}).catch(u=>{a.innerHTML=`<p class="placeholder">${u.message||"Something went wrong. Please try again."}</p>`})})}R();
