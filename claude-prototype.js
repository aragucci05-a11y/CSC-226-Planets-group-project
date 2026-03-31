// =====================================================
// PLANET DETAILS
// shown when a card is clicked
// =====================================================

const planetDetails = {
  mercury: "Mercury is the smallest planet and has no atmosphere. Temperatures swing wildly from -180°C at night to 430°C during the day.",
  venus:   "Venus is the hottest planet at 465°C — hotter than Mercury — because its thick atmosphere traps heat like a blanket.",
  earth:   "Earth is the only known planet with liquid water on its surface and life. Its magnetic field protects us from solar radiation.",
  mars:    "Mars has the tallest volcano in the solar system — Olympus Mons — standing 22km high, nearly 3x the height of Everest.",
  jupiter: "Jupiter is so massive that all other planets could fit inside it. Its Great Red Spot is a storm that has raged for 350+ years.",
  saturn:  "Saturn's rings are made of ice and rock and span 282,000km across — yet are only about 10 metres thick.",
  uranus:  "Uranus rotates on its side with an axial tilt of 98°. One pole faces the Sun for 42 years straight, then sits in darkness.",
  neptune: "Neptune has the fastest winds in the solar system at 2,100 km/h. It takes 165 Earth years to complete one orbit."
};

// show the detail box when a card is clicked
function showDetails(planet) {
  const box  = document.getElementById('detail-box');
  const name = document.getElementById('detail-name');
  const text = document.getElementById('detail-text');

  // fill in the planet name and fact
  name.textContent = planet.toUpperCase();
  text.textContent = planetDetails[planet];

  // make the box visible
  box.classList.remove('hidden');

  // scroll smoothly to the detail box
  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// hide the detail box when X is clicked
function closeDetails() {
  document.getElementById('detail-box').classList.add('hidden');
}


// =====================================================
// PHASE ANGLE CHART — LIVE NASA DATA
// =====================================================

// the 7 planets we want phase angles for
const planets = ['mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

// store the chart so we can update it without redrawing
let phaseChart = null;

// fetch phase angle for ONE planet from NASA
async function getPhaseAngle(planet) {
  const url = `https://ssd.jpl.nasa.gov/api/horizons.api?format=json&COMMAND=${planet}&OBJ_DATA=YES&QUANTITIES=24`;

  // go get the data and wait for it
  const response = await fetch(url);
  const data     = await response.json();

  // search the NASA text for "Phase_angle = [number]"
  const match = data.result.match(/Phase_angle\s*=\s*([\d.]+)/);

  // return the number, or 0 if not found
  return match ? parseFloat(match[1]) : 0;
}

// fetch ALL planets and draw the chart
async function loadAllPhaseAngles() {
  const status = document.getElementById('chart-status');
  status.textContent = '⏳ Fetching live NASA data...';

  try {
    // fetch all 7 planets at the same time, wait for all to finish
    const angles = await Promise.all(
      planets.map(async p => ({
        name:  p.charAt(0).toUpperCase() + p.slice(1), // capitalise name
        angle: await getPhaseAngle(p)
      }))
    );

    status.textContent = `✅ Last updated: ${new Date().toLocaleTimeString()}`;
    renderChart(angles);

  } catch (err) {
    // if NASA API fails, show a message instead of crashing
    status.textContent = '❌ Could not reach NASA API. Try refreshing.';
    console.error(err);
  }
}

// draw (or update) the bar chart
function renderChart(data) {
  const ctx = document.getElementById('chart');

  // if chart already exists, update its data instead of redrawing
  if (phaseChart) {
    phaseChart.data.datasets[0].data = data.map(p => p.angle);
    phaseChart.update();
    return;
  }

  // first time — create the chart
  phaseChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(p => p.name),           // planet names on X axis
      datasets: [{
        label: 'Phase Angle (degrees)',
        data:  data.map(p => p.angle),          // bar heights
        backgroundColor: 'rgba(167, 139, 250, 0.5)',
        borderColor:     'rgba(167, 139, 250, 1)',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: 'white', font: { family: 'Rajdhani', size: 14 } }
        },
        tooltip: {
          callbacks: {
            // add degree symbol to tooltip
            label: ctx => ` ${ctx.parsed.y.toFixed(1)}°`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: 'white', font: { family: 'Orbitron', size: 11 } },
          grid:  { color: 'rgba(255,255,255,0.05)' }
        },
        y: {
          ticks: { color: 'white', font: { family: 'Rajdhani', size: 12 } },
          grid:  { color: 'rgba(255,255,255,0.05)' },
          title: {
            display: true,
            text:    'Degrees (°)',
            color:   'rgba(255,255,255,0.5)'
          }
        }
      }
    }
  });
}


// =====================================================
// RUN ON PAGE LOAD
// =====================================================

// load chart immediately when page opens
loadAllPhaseAngles();

// auto-refresh every 10 minutes
// 10 * 60000ms = 600000ms = 10 minutes
setInterval(loadAllPhaseAngles, 10 * 60000);
