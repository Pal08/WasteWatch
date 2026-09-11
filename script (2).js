const map = L.map('leafletMap', {
  center:[19.6, 76.2],
  zoom:7,
  zoomControl:false,
  attributionControl:false
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, subdomains:'abc' }).addTo(map);
const markerLayer = L.layerGroup().addTo(map);

document.getElementById('zoomIn').onclick = () => map.zoomIn();
document.getElementById('zoomOut').onclick = () => map.zoomOut();
document.getElementById('locateBtn').onclick = () => handleLiveLocation();

// ---- toast ----
let toastTimer = null;
function showToast(msg, ms = 3200){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

// ---- hamburger menu ----
function toggleMenu(e){
  e.stopPropagation();
  document.getElementById('menuDropdown').classList.toggle('open');
}
document.addEventListener('click', () => document.getElementById('menuDropdown').classList.remove('open'));

// ---- live location ----
let meMarker = null;
function handleLiveLocation(e){
  if(e) e.stopPropagation();
  document.getElementById('menuDropdown').classList.remove('open');
  if(!navigator.geolocation){
    showToast("Live location isn't supported on this browser/device.");
    return;
  }
  showToast('Finding your location…', 1500);
  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude, longitude } = pos.coords;
      if(meMarker) markerLayer.removeLayer(meMarker) || map.removeLayer(meMarker);
      const icon = L.divIcon({
        className:'', iconSize:[16,16], iconAnchor:[8,8],
        html:`<div style="position:relative;width:16px;height:16px;"><div class="me-pulse"></div><div class="me-dot"></div></div>`
      });
      meMarker = L.marker([latitude, longitude], { icon, zIndexOffset:1000 }).addTo(map);
      map.flyTo([latitude, longitude], 12, { duration:0.7 });
    },
    err => {
      showToast('Could not get your location. Check location permissions and try again.');
    },
    { enableHighAccuracy:true, timeout:8000 }
  );
}

// ---- precautions panel (general safety guidance, not tied to any per-place claim) ----
const PRECAUTIONS = {
  high: [
    "Avoid spending extended time right next to a site with a low treatment rate — untreated waste is more likely to be openly dumped or burned.",
    "Do not burn waste yourself — open burning adds to air pollution and health risk.",
    "Keep children, elderly residents, and anyone with respiratory conditions away from known dump sites.",
    "If you see open burning or illegal dumping, report it to MPCB or your local municipal body."
  ],
  moderate: [
    "Segregate wet and dry waste at home to help downstream treatment run efficiently.",
    "Avoid adding to informal dumping — wait for or request the next scheduled collection.",
    "Raise repeated odor, overflow, or collection-gap complaints with your local ward office."
  ],
  low: [
    "Continue segregating waste at source (wet/dry/hazardous) — this area's high treatment rate depends on it.",
    "Dispose of hazardous items (batteries, e-waste, chemicals) separately, not with regular household waste.",
    "Report any sudden dumping or burning you notice so it can be addressed early."
  ]
};
function precautionListHTML(sev){
  return `<ul class="precaution-list">${PRECAUTIONS[sev].map(p => `<li><span class="b">${sev==='high'?'🔴':sev==='moderate'?'🟠':'🟢'}</span><span>${p}</span></li>`).join('')}</ul>`;
}
function openPrecautions(e, sev){
  if(e) e.stopPropagation();
  document.getElementById('menuDropdown').classList.remove('open');
  const initial = sev || 'moderate';
  document.getElementById('cardInner').innerHTML = `
    <button class="close" onclick="closeCard()">&times;</button>
    <div class="head">
      <div class="avatar" style="background:#e8f0fe;">⚠️</div>
      <h2>Precautions</h2>
      <div class="subline">General guidance by treatment-rate tier — not a substitute for official advisories</div>
    </div>
    <div class="body">
      <div class="precaution-tabs" id="ptabs">
        <div class="ptab high" data-sev="high" onclick="switchPrecaution('high')">Low treatment</div>
        <div class="ptab moderate" data-sev="moderate" onclick="switchPrecaution('moderate')">Partial</div>
        <div class="ptab low" data-sev="low" onclick="switchPrecaution('low')">Well-treated</div>
      </div>
      <div id="precautionBody">${precautionListHTML(initial)}</div>
      <a class="govlink secondary" style="margin-top:16px;" href="${GOV_LINK}" target="_blank" rel="noopener">View MPCB portal</a>
    </div>
  `;
  switchPrecaution(initial);
  document.getElementById('overlay').classList.add('open');
}
function switchPrecaution(sev){
  document.querySelectorAll('#ptabs .ptab').forEach(t => t.classList.toggle('active', t.dataset.sev === sev));
  const body = document.getElementById('precautionBody');
  if(body) body.innerHTML = precautionListHTML(sev);
}

// ---- Real districts + real talukas of Maharashtra ----
const DISTRICTS = [
  { name:"Mumbai City", lat:18.940, lon:72.835, talukas:["Mumbai City"] },
  { name:"Mumbai Suburban", lat:19.100, lon:72.880, talukas:["Andheri","Borivali","Kurla"] },
  { name:"Thane", lat:19.218, lon:72.978, talukas:["Thane","Kalyan","Murbad","Bhiwandi","Shahapur","Ulhasnagar","Ambarnath"] },
  { name:"Palghar", lat:19.697, lon:72.765, talukas:["Palghar","Vasai","Dahanu","Talasari","Jawhar","Mokhada","Vada","Vikramgad"] },
  { name:"Raigad", lat:18.640, lon:73.050, talukas:["Alibag","Pen","Murud","Panvel","Uran","Karjat","Khalapur","Mangaon","Tala","Roha","Sudhagad-Pali","Mahad","Poladpur","Shrivardhan","Mhasala"] },
  { name:"Ratnagiri", lat:16.994, lon:73.300, talukas:["Ratnagiri","Sangameshwar","Lanja","Rajapur","Chiplun","Guhagar","Dapoli","Mandangad","Khed"] },
  { name:"Sindhudurg", lat:16.050, lon:73.680, talukas:["Kankavli","Vaibhavwadi","Devgad","Malwan","Sawantwadi","Kudal","Vengurla","Dodamarg"] },
  { name:"Nashik", lat:20.000, lon:73.789, talukas:["Nashik","Igatpuri","Dindori","Peth","Trimbakeshwar","Kalwan","Deola","Surgana","Baglan","Malegaon","Nandgaon","Chandwad","Niphad","Sinnar","Yeola"] },
  { name:"Dhule", lat:20.902, lon:74.777, talukas:["Dhule","Sakri","Sindkheda","Shirpur"] },
  { name:"Nandurbar", lat:21.370, lon:74.240, talukas:["Nandurbar","Navapur","Shahada","Talode","Akkalkuwa","Dhadgaon"] },
  { name:"Jalgaon", lat:21.005, lon:75.563, talukas:["Jalgaon","Jamner","Erandol","Dharangaon","Bhusawal","Raver","Muktainagar","Bodwad","Yawal","Amalner","Parola","Chopda","Pachora","Bhadgaon","Chalisgaon"] },
  { name:"Ahilyanagar", lat:19.094, lon:74.738, talukas:["Nagar","Shevgaon","Pathardi","Parner","Sangamner","Kopargaon","Akole","Shrirampur","Nevasa","Rahata","Rahuri","Shrigonda","Karjat","Jamkhed"] },
  { name:"Pune", lat:18.520, lon:73.856, talukas:["Pune City","Haveli","Khed","Junnar","Ambegaon","Maval","Mulshi","Shirur","Purandhar","Velhe","Bhor","Baramati","Indapur","Daund"] },
  { name:"Satara", lat:17.685, lon:73.996, talukas:["Satara","Jaoli","Koregaon","Wai","Mahabaleshwar","Khandala","Phaltan","Maan","Khatav","Patan","Karad"] },
  { name:"Sangli", lat:16.855, lon:74.575, talukas:["Miraj","Kavathemahankal","Tasgaon","Jat","Walwa","Shirala","Khanapur","Atpadi","Palus","Kadegaon"] },
  { name:"Solapur", lat:17.660, lon:75.906, talukas:["Solapur North","Barshi","Solapur South","Akkalkot","Madha","Karmala","Pandharpur","Mohol","Malshiras","Sangole","Mangalvedhe"] },
  { name:"Kolhapur", lat:16.705, lon:74.243, talukas:["Karvir","Panhala","Shahuwadi","Kagal","Hatkanangale","Shirol","Radhanagari","Gaganbawada","Bhudargad","Gadhinglaj","Chandgad","Ajra"] },
  { name:"Chhatrapati Sambhajinagar", lat:19.876, lon:75.343, talukas:["Aurangabad","Kannad","Soegaon","Sillod","Phulambri","Khuldabad","Vaijapur","Gangapur","Paithan"] },
  { name:"Jalna", lat:19.841, lon:75.886, talukas:["Jalna","Bhokardan","Jafrabad","Badnapur","Ambad","Ghansawangi","Partur","Mantha"] },
  { name:"Beed", lat:18.989, lon:75.756, talukas:["Beed","Georai","Patoda","Shirur-Kasar","Ashti","Majalgaon","Wadwani","Kaij","Dharur","Parli","Ambajogai"] },
  { name:"Latur", lat:18.401, lon:76.584, talukas:["Latur","Renapur","Ausa","Ahmedpur","Jalkot","Chakur","Shirur Anantpal","Nilanga","Deoni","Udgir"] },
  { name:"Dharashiv", lat:18.186, lon:76.042, talukas:["Osmanabad","Tuljapur","Bhum","Paranda","Washi","Kalamb","Lohara","Umarga"] },
  { name:"Nanded", lat:19.153, lon:77.321, talukas:["Nanded","Ardhapur","Mudkhed","Bhokar","Umri","Loha","Kandhar","Kinwat","Himayatnagar","Hadgaon","Mahur","Deglur","Mukhed","Dharmabad","Biloli","Naigaon"] },
  { name:"Hingoli", lat:19.716, lon:77.149, talukas:["Hingoli","Sengaon","Kalamnuri","Basmath","Aundha Nagnath"] },
  { name:"Parbhani", lat:19.267, lon:76.774, talukas:["Parbhani","Sonpeth","Gangakhed","Palam","Purna","Sailu","Jintur","Manwath","Pathri"] },
  { name:"Buldhana", lat:20.530, lon:76.180, talukas:["Buldhana","Chikhli","Deulgaon Raja","Jalgaon Jamod","Sangrampur","Malkapur","Motala","Nandura","Khamgaon","Shegaon","Mehkar","Sindkhed Raja","Lonar"] },
  { name:"Akola", lat:20.709, lon:77.002, talukas:["Akola","Akot","Telhara","Balapur","Patur","Murtajapur","Barshitakli"] },
  { name:"Washim", lat:20.110, lon:77.133, talukas:["Washim","Malegaon","Risod","Mangrulpir","Karanja","Manora"] },
  { name:"Amravati", lat:20.933, lon:77.750, talukas:["Amravati","Bhatkuli","Nandgaon Khandeshwar","Dharni","Chikhaldara","Achalpur","Chandurbazar","Morshi","Warud","Daryapur","Anjangaon-Surji","Chandur","Dhamangaon","Tiosa"] },
  { name:"Yavatmal", lat:20.389, lon:78.130, talukas:["Yavatmal","Arni","Babhulgaon","Kalamb","Darwha","Digras","Ner","Pusad","Umarkhed","Mahagaon","Kelapur","Ralegaon","Ghatanji","Wani","Maregaon","Zari Jamani"] },
  { name:"Wardha", lat:20.745, lon:78.600, talukas:["Wardha","Deoli","Seloo","Arvi","Ashti","Karanja","Hinganghat","Samudrapur"] },
  { name:"Nagpur", lat:21.146, lon:79.088, talukas:["Nagpur Urban","Nagpur Rural","Kamptee","Hingna","Katol","Narkhed","Savner","Kalameshwar","Ramtek","Mouda","Parseoni","Umred","Kuhi","Bhiwapur"] },
  { name:"Bhandara", lat:21.166, lon:79.653, talukas:["Bhandara","Tumsar","Pauni","Mohadi","Sakoli","Lakhani","Lakhandur"] },
  { name:"Gondia", lat:21.460, lon:80.192, talukas:["Gondia","Goregaon","Salekasa","Tiroda","Amgaon","Deori","Arjuni-Morgaon","Sadak-Arjuni"] },
  { name:"Gadchiroli", lat:20.184, lon:80.004, talukas:["Gadchiroli","Dhanora","Chamorshi","Mulchera","Desaiganj","Armori","Kurkheda","Korchi","Aheri","Etapalli","Bhamragad","Sironcha"] },
  { name:"Chandrapur", lat:19.947, lon:79.295, talukas:["Chandrapur","Saoli","Mul","Ballarpur","Pombhurna","Gondpimpri","Warora","Chimur","Bhadravati","Bramhapuri","Nagbhid","Sindewahi","Rajura","Korpana","Jiwati"] },
];

// =========================================================================
// REAL DATA — Maharashtra Pollution Control Board, "Annual Report on Solid
// Waste Management Rules, 2016 — For the State of Maharashtra (2021)"
// https://mpcb.gov.in/sites/default/files/solid-waste/msw_annual_report_2021_12082022.pdf
// Figures are ULBs' own Form-IV submissions to MPCB for reporting year 2021 —
// the most recent published district-wise report. This is NOT a live feed;
// MPCB does not publish real-time waste or complaint data publicly.
// =========================================================================
const DATA_SOURCE_URL = "https://mpcb.gov.in/sites/default/files/solid-waste/msw_annual_report_2021_12082022.pdf";

const STATE_SUMMARY = {
  generated_TPD: 23530.57, treated_TPD: 19980.22, treated_pct: 93.69,
  landfilled_pct: 8.96, dumped_unscientifically_pct: 4.32, segregation_pct: 92.90
};

// 12 MPCB regions: generated/treated tonnes-per-day, summed directly from the report's regional tables
const REGION_STATS = {
  "Aurangabad": { generated_TPD: 1760.08, treated_TPD: 1429.463 },
  "Nashik":     { generated_TPD: 2028.14, treated_TPD: 1550.10 },
  "Nagpur":     { generated_TPD: 1495.6055, treated_TPD: 684.045725 },
  "Chandrapur": { generated_TPD: 471.95, treated_TPD: 401.72 },
  "Pune":       { generated_TPD: 4116.18, treated_TPD: 4054.08 },
  "Kolhapur":   { generated_TPD: 796.118, treated_TPD: 741.876 },
  "Amravati":   { generated_TPD: 847.172, treated_TPD: 634.322 },
  "Raigad":     { generated_TPD: 584.16, treated_TPD: 465.68 },
  "Thane":      { generated_TPD: 2181.6, treated_TPD: 2087.01 },
  "Kalyan":     { generated_TPD: 1661.0, treated_TPD: 1020.5 },
  "Navi Mumbai":{ generated_TPD: 675.0, treated_TPD: 623.0 },
  "Mumbai":     { generated_TPD: 6750.0, treated_TPD: 6166.0 }
};

// 27 city corporations with real, individually reported population + treatment figures
const CITY_STATS = {
  "Municipal Corporation of Greater Mumbai": { population:12921605, generated_TPD:6750, treated_TPD:6166 },
  "Pune Municipal Corporation": { population:4294220, generated_TPD:2200, treated_TPD:2200 },
  "Nagpur Municipal Corporation": { population:2750000, generated_TPD:1109.74, treated_TPD:350 },
  "Thane Municipal Corporation": { population:2598591, generated_TPD:1039, treated_TPD:1039 },
  "Pimpri-Chinchwad Municipal Corporation": { population:2403859, generated_TPD:1132, treated_TPD:1132 },
  "Nashik Municipal Corporation": { population:1486053, generated_TPD:635, treated_TPD:517 },
  "Kalyan Dombivli Municipal Corporation": { population:1518762, generated_TPD:668, treated_TPD:658 },
  "Vasai-Virar City Municipal Corporation": { population:1901273, generated_TPD:620, treated_TPD:559 },
  "Aurangabad Municipal Corporation": { population:1228032, generated_TPD:450, treated_TPD:400 },
  "Navi Mumbai Municipal Corporation": { population:1120000, generated_TPD:662, treated_TPD:610 },
  "Solapur Municipal Corporation": { population:951558, generated_TPD:272, treated_TPD:240 },
  "Mira Bhaindar Municipal Corporation": { population:814786, generated_TPD:475, treated_TPD:450 },
  "Amravati Municipal Corporation": { population:825000, generated_TPD:250, treated_TPD:250 },
  "Nanded-Waghala Municipal Corporation": { population:550439, generated_TPD:250, treated_TPD:138 },
  "Jalgaon City Municipal Corporation": { population:517494, generated_TPD:280, treated_TPD:150 },
  "Malegaon Municipal Corporation": { population:541239, generated_TPD:240, treated_TPD:125 },
  "Parbhani Municipal Corporation": { population:356759, generated_TPD:150, treated_TPD:150 },
  "Latur City Municipal Corporation": { population:382940, generated_TPD:150, treated_TPD:150 },
  "Dhule Municipal Corporation": { population:458294, generated_TPD:114.45, treated_TPD:100.7 },
  "Kolhapur Municipal Corporation": { population:607419, generated_TPD:202, treated_TPD:166 },
  "Sangli-Miraj & Kupwad Municipal Corporation": { population:502793, generated_TPD:215, treated_TPD:215 },
  "Ahmednagar Municipal Corporation": { population:420000, generated_TPD:127, treated_TPD:127 },
  "Chandrapur City Municipal Corporation": { population:406789, generated_TPD:113, treated_TPD:113 },
  "Bhiwandi-Nizampur Municipal Corporation": { population:709665, generated_TPD:440, treated_TPD:48 },
  "Ulhasnagar Municipal Corporation": { population:506098, generated_TPD:290, treated_TPD:91 },
  "Panvel Municipal Corporation": { population:509901, generated_TPD:470, treated_TPD:335 },
  "Akola Municipal Corporation": { population:590591, generated_TPD:176, treated_TPD:106 }
};

// District -> nearest MPCB region (used when no direct city match exists)
const DISTRICT_TO_REGION = {
  "Mumbai City":"Mumbai", "Mumbai Suburban":"Mumbai",
  "Thane":"Thane", "Palghar":"Thane",
  "Raigad":"Raigad",
  "Ratnagiri":"Kolhapur", "Sindhudurg":"Kolhapur",
  "Nashik":"Nashik", "Dhule":"Nashik", "Nandurbar":"Nashik", "Jalgaon":"Nashik", "Ahilyanagar":"Nashik",
  "Pune":"Pune", "Satara":"Pune", "Solapur":"Pune",
  "Sangli":"Kolhapur", "Kolhapur":"Kolhapur",
  "Chhatrapati Sambhajinagar":"Aurangabad", "Jalna":"Aurangabad", "Beed":"Aurangabad",
  "Latur":"Aurangabad", "Dharashiv":"Aurangabad", "Nanded":"Aurangabad", "Hingoli":"Aurangabad", "Parbhani":"Aurangabad",
  "Buldhana":"Amravati", "Akola":"Amravati", "Washim":"Amravati", "Amravati":"Amravati", "Yavatmal":"Amravati",
  "Wardha":"Nagpur", "Nagpur":"Nagpur", "Bhandara":"Nagpur", "Gondia":"Nagpur",
  "Gadchiroli":"Chandrapur", "Chandrapur":"Chandrapur"
};

// District -> a matching city corporation with directly reported figures (best available precision)
const DISTRICT_TO_CITY = {
  "Mumbai City":"Municipal Corporation of Greater Mumbai",
  "Mumbai Suburban":"Municipal Corporation of Greater Mumbai",
  "Thane":"Thane Municipal Corporation",
  "Raigad":"Panvel Municipal Corporation",
  "Nashik":"Nashik Municipal Corporation",
  "Dhule":"Dhule Municipal Corporation",
  "Jalgaon":"Jalgaon City Municipal Corporation",
  "Ahilyanagar":"Ahmednagar Municipal Corporation",
  "Pune":"Pune Municipal Corporation",
  "Solapur":"Solapur Municipal Corporation",
  "Sangli":"Sangli-Miraj & Kupwad Municipal Corporation",
  "Kolhapur":"Kolhapur Municipal Corporation",
  "Chhatrapati Sambhajinagar":"Aurangabad Municipal Corporation",
  "Latur":"Latur City Municipal Corporation",
  "Nanded":"Nanded-Waghala Municipal Corporation",
  "Parbhani":"Parbhani Municipal Corporation",
  "Amravati":"Amravati Municipal Corporation",
  "Akola":"Akola Municipal Corporation",
  "Nagpur":"Nagpur Municipal Corporation",
  "Chandrapur":"Chandrapur City Municipal Corporation"
};

const GOV_LINK = "https://mpcb.gov.in/en";
const sevColor = { high:'#d93025', moderate:'#f9ab00', low:'#188038' };

// Real treatment-rate lookup for a district: prefers an exact city-corporation
// match, falls back to the district's MPCB region average, and finally to the
// statewide average if neither is mapped.
function statsForDistrict(districtName){
  const cityName = DISTRICT_TO_CITY[districtName];
  if(cityName && CITY_STATS[cityName]){
    const c = CITY_STATS[cityName];
    return {
      level:'city', label:cityName, population:c.population,
      generated_TPD:c.generated_TPD, treated_TPD:c.treated_TPD,
      treated_pct: Math.round((c.treated_TPD/c.generated_TPD)*1000)/10
    };
  }
  const regionName = DISTRICT_TO_REGION[districtName];
  if(regionName && REGION_STATS[regionName]){
    const r = REGION_STATS[regionName];
    return {
      level:'region', label:`${regionName} MPCB region`, population:null,
      generated_TPD:r.generated_TPD, treated_TPD:r.treated_TPD,
      treated_pct: Math.round((r.treated_TPD/r.generated_TPD)*1000)/10
    };
  }
  return {
    level:'state', label:'Maharashtra statewide average', population:null,
    generated_TPD:STATE_SUMMARY.generated_TPD, treated_TPD:STATE_SUMMARY.treated_TPD,
    treated_pct: STATE_SUMMARY.treated_pct
  };
}
function sevForPct(pct){
  if(pct < 70) return 'high';
  if(pct < 90) return 'moderate';
  return 'low';
}

// Pre-compute stats + severity once per district, then have every taluka
// inherit its parent district's figures (no independent taluka-level data
// is published, so we don't invent per-taluka numbers).
const DISTRICT_STATS = {};
DISTRICTS.forEach(d => { DISTRICT_STATS[d.name] = statsForDistrict(d.name); });

const COPY = {
  high:  { label:"Below 70% treated", desc:"MPCB's own figures show less than 70% of this area's waste is being scientifically treated. The rest is landfilled or, in some cases, dumped unscientifically — a real gap worth watching, not a prediction of fire or emergency." },
  moderate: { label:"70–90% treated", desc:"Most waste here is treated, but a meaningful share still ends up landfilled or dumped rather than processed. Room to improve collection and processing capacity." },
  low: { label:"Over 90% treated", desc:"The large majority of waste generated here is being scientifically treated per MPCB's reporting — among the better-performing areas in the state." }
};

// flatten into one list of clickable places: every district hub AND every taluka (town/rural block)
const ALL = [];
DISTRICTS.forEach(d => {
  const stats = DISTRICT_STATS[d.name];
  const sev = sevForPct(stats.treated_pct);
  ALL.push({ name:d.name, lat:d.lat, lon:d.lon, kind:'district', districtName:d.name, isHQ:true, sev, stats });
  d.talukas.forEach((t, idx) => {
    let lat, lon;
    if(idx === 0){ lat = d.lat; lon = d.lon; }
    else{
      const total = d.talukas.length - 1;
      const angle = ((idx-1)/Math.max(total,1)) * 2*Math.PI;
      const spread = Math.min(0.5, 0.16 + d.talukas.length*0.012);
      lat = d.lat + spread*Math.sin(angle)*0.85;
      lon = d.lon + spread*Math.cos(angle);
    }
    ALL.push({ name:t, lat, lon, kind:'taluka', districtName:d.name, isHQ:(idx===0), sev, stats });
  });
});

// ---- waste marker: a simple colored dot, sized a bit bigger for district hubs ----
function wasteIcon(sev, big){
  const size = big ? 13 : 9;
  const color = sevColor[sev];
  const pulse = sev === 'high' ? `<div class="pulse-ring"></div>` : '';
  const html = `
    <div class="waste-pin" style="position:relative;width:${size}px;height:${size}px;">
      ${pulse}
      <div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:1.5px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>
    </div>`;
  return L.divIcon({ className:'', html, iconSize:[size,size], iconAnchor:[size/2,size/2] });
}

function addMarker(p){
  const big = p.isHQ;
  const m = L.marker([p.lat, p.lon], { icon: wasteIcon(p.sev, big) });
  m.on('click', () => openCard(p));
  markerLayer.addLayer(m);
}

let activeFilter = 'all';
function updateMarkers(){
  markerLayer.clearLayers();
  const z = map.getZoom();
  const bounds = map.getBounds();
  let list;
  if(z < 8){
    list = ALL.filter(p => p.kind === 'district');
    document.getElementById('zoomHint').textContent = 'Zoomed out: showing district hubs. Zoom in to see every city, town and taluka.';
  } else {
    list = ALL.filter(p => bounds.contains([p.lat, p.lon]));
    document.getElementById('zoomHint').textContent = `Zoomed in: showing every mapped place in view (${list.length}).`;
  }
  if(activeFilter !== 'all') list = list.filter(p => p.sev === activeFilter);
  list.forEach(addMarker);
}
map.on('zoomend moveend', updateMarkers);

function setFilter(key, el){
  activeFilter = key;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  updateMarkers();
}

function openCard(p){
  const copy = COPY[p.sev];
  const s = p.stats;
  const kind = p.kind === 'district' ? 'District hub' : (p.isHQ ? 'District headquarters taluka' : 'Rural taluka');
  const levelNote = s.level === 'city'
    ? `Figures shown are for ${s.label} specifically (${s.population.toLocaleString('en-IN')} population), MPCB 2021 report.`
    : s.level === 'region'
      ? `No individual city-level figure is published for ${p.districtName} district — showing the ${s.label}'s average from MPCB's 2021 report instead.`
      : `No region-specific figure was mapped — showing the Maharashtra statewide average from MPCB's 2021 report.`;
  const talukaNote = p.kind === 'taluka'
    ? `<div class="data-note">MPCB does not publish separate figures per taluka — this shows the nearest available data for ${p.districtName} district. ${levelNote}</div>`
    : `<div class="data-note">${levelNote}</div>`;
  document.getElementById('cardInner').innerHTML = `
    <button class="close" onclick="closeCard()">&times;</button>
    <div class="head">
      <div class="avatar" style="background:${sevColor[p.sev]}22;">🗑️</div>
      <h2>${p.name}</h2>
      <div class="subline">${kind} · ${p.districtName} district</div>
      <span class="badge ${p.sev}"><span class="bdot"></span>${copy.label}</span>
    </div>
    <div class="body">
      <div class="desc" style="border-left:3px solid ${sevColor[p.sev]};">${copy.desc}</div>
      <div class="metrics">
        <div class="metric"><div class="ic">🗑️</div><div class="n">${Math.round(s.generated_TPD).toLocaleString('en-IN')}</div><div class="l">TPD generated</div></div>
        <div class="metric"><div class="ic">♻️</div><div class="n">${s.treated_pct}%</div><div class="l">Treated</div></div>
      </div>
      ${talukaNote}
      ${p.sev === 'high' ? `<a class="govlink" href="${GOV_LINK}" target="_blank" rel="noopener">Report an issue to MPCB &rarr;</a>` : `<a class="govlink secondary" href="${GOV_LINK}" target="_blank" rel="noopener">View MPCB portal</a>`}
      <a href="#" class="precaution-link" onclick="openPrecautions(event,'${p.sev}'); return false;">⚠️ See precautions for this tier</a>
    </div>
  `;
  document.getElementById('overlay').classList.add('open');
}
function closeCard(){ document.getElementById('overlay').classList.remove('open'); }
document.getElementById('overlay').addEventListener('click', e => { if(e.target.id === 'overlay') closeCard(); });

// search: press Enter to jump to a matching place.
// First checks our district/taluka list; if not found (e.g. a small village or
// hamlet like a rural "Sathgaon" that isn't in our taluka list), falls back to
// OpenStreetMap's geocoder scoped to Maharashtra so the map still finds it —
// just without a waste-data card, since we have no MPCB data for unlisted places.
const MH_VIEWBOX = '72.6,22.2,80.9,15.6'; // west,north,east,south
async function geocodeInMaharashtra(q){
  try{
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&viewbox=${MH_VIEWBOX}&bounded=1&q=${encodeURIComponent(q + ', Maharashtra, India')}`;
    const res = await fetch(url, { headers:{ 'Accept-Language':'en' } });
    if(!res.ok) return null;
    const data = await res.json();
    if(data && data.length) return { lat:parseFloat(data[0].lat), lon:parseFloat(data[0].lon), label:data[0].display_name };
  }catch(err){ console.warn('Geocoding failed', err); }
  return null;
}

document.getElementById('searchInput').addEventListener('keydown', async e => {
  if(e.key !== 'Enter') return;
  const q = e.target.value.trim();
  if(!q) return;
  const ql = q.toLowerCase();
  const hit = ALL.find(p => p.name.toLowerCase().includes(ql));
  if(hit){
    map.flyTo([hit.lat, hit.lon], 10, { duration:0.6 });
    setTimeout(() => openCard(hit), 650);
    return;
  }
  showToast(`Looking for "${q}"…`, 2000);
  const geo = await geocodeInMaharashtra(q);
  if(geo){
    map.flyTo([geo.lat, geo.lon], 13, { duration:0.7 });
    showToast(`Found "${q}". No MPCB waste data mapped for this spot yet.`, 4000);
  } else {
    showToast(`Couldn't find "${q}" in Maharashtra. Try a nearby bigger town or check the spelling.`, 4000);
  }
});

updateMarkers();
