// ==========================================
// BOOT SEQUENCE LOGIC
// ==========================================
const bootMessages = [
    "INITIALIZING PLANETARY TELEMETRY...",
    "ESTABLISHING SECURE LINK TO JPL HORIZONS...",
    "BYPASSING LOCAL CORS PROTOCOLS...",
    "DOWNLOADING REAL-TIME ORBITAL DATA...",
    "CALCULATING PHASE ANGLES...",
    "SYSTEM ONLINE."
];
  
async function runBootSequence() {
    const terminal = document.getElementById('terminal-output');
    const bootScreen = document.getElementById('boot-screen');
    document.body.style.overflow = 'hidden';
  
    for (let i = 0; i < bootMessages.length; i++) {
      terminal.innerHTML += bootMessages[i] + "<br>";
      await new Promise(r => setTimeout(r, Math.random() * 400 + 200)); 
    }
  
    await new Promise(r => setTimeout(r, 1000));
    bootScreen.style.opacity = '0';
    document.body.style.overflow = 'auto'; 
    setTimeout(() => { bootScreen.style.display = 'none'; }, 1000);
}
runBootSequence();


//sets default state for the phase demo, with an angle of 90 degrees and the left side lit
let currentAngle = 90;
let currentSide  = 'left';

// Hard-coded average orbital speeds (km/s) for display
const orbitalSpeeds = {
  'Moon': 1.022,
  'Mercury': 47.36,
  'Venus': 35.02,
  'Mars': 24.07,
  'Jupiter': 13.07,
  'Saturn': 9.68,
  'Uranus': 6.80,
  'Neptune': 5.43
};

let orbitInterval = null;
let orbitDirection = 1;

// Track animation state for each canvas
const animationState = {};

// Planet color mapping
const planetColors = {
  'phase-demo': '#FFFFFF',  // Demo planet - white
  'Moon': '#A9A9A9',       // Moon - lighter grey than Mercury
  'Mercury': '#808080',     // Grey
  'Venus': '#FFC649',       // Orange/yellow
  'Mars': '#CF3C2C',        // Red
  'Jupiter': '#C88B3A',     // Orange/brown
  'Saturn': '#FAD5A5',      // Tan/pale yellow
  'Uranus': '#4FD0E7',      // Cyan
  'Neptune': '#4169E1'      // Deep blue
};

// Cinematic Auto-Orbit
function toggleAutoOrbit() {
    const btn = document.getElementById('orbit-btn');
    const slider = document.getElementById('demo-slider');
    
    if (orbitInterval) {
      clearInterval(orbitInterval);
      orbitInterval = null;
      btn.innerHTML = "▶ Auto-Orbit";
      btn.style.boxShadow = "none";
    } else {
      btn.innerHTML = "⏸ Pause Orbit";
      btn.style.boxShadow = "0 0 15px rgba(79, 208, 231, 0.6)"; 
      
      orbitInterval = setInterval(() => {
        currentAngle += (2 * orbitDirection);
        if (currentAngle >= 180) {
          currentAngle = 180; orbitDirection = -1;
          currentSide = currentSide === 'left' ? 'Right' : 'left';
        } else if (currentAngle <= 0) {
          currentAngle = 0; orbitDirection = 1;
        }
        slider.value = currentAngle;
        phDraw(currentAngle);
  }, 50); 
    }
    
    // Add event listener only once after setup
    if (btn) {
      btn.addEventListener("click", toggleAutoOrbit);
    }
}

// Initialize the button with click handler on page load
document.addEventListener('DOMContentLoaded', function() {
  const orbitBtn = document.getElementById('orbit-btn');
  if (orbitBtn) {
    orbitBtn.addEventListener('click', toggleAutoOrbit);
  }
});

// Easing function for smooth animation
function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

// ==========================================
// LUNAR PHASE CALCULATIONS
// ==========================================
function getLunarPhaseAngle(date = new Date()) {
  const LUNAR_CYCLE = 29.53058867; // days
  const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z'); // J2000 reference

  const daysSince = (date - KNOWN_NEW_MOON) / (1000 * 60 * 60 * 24);
  const phase = ((daysSince % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  const angle = (phase / LUNAR_CYCLE) * 360;

  return angle; // 0–360°
}

function getLunarPhase(date = new Date()) {
  const angle = getLunarPhaseAngle(date);

  const phases = [
    { name: ' New Moon',        max: 22.5  },
    { name: ' Waxing Crescent', max: 67.5  },
    { name: ' First Quarter',   max: 112.5 },
    { name: ' Waxing Gibbous',  max: 157.5 },
    { name: ' Full Moon',       max: 202.5 },
    { name: ' Waning Gibbous',  max: 247.5 },
    { name: ' Last Quarter',    max: 292.5 },
    { name: ' Waning Crescent', max: 337.5 },
    { name: ' New Moon',        max: 360   },
  ];

  return phases.find(p => angle < p.max).name;
}

function initMoonPhase() {
  const now = new Date();
  const lunarAngle = getLunarPhaseAngle(now);
  const lunarPhase = getLunarPhase(now);
  
  // Convert lunar phase angle (0-360°) to phDraw angle (0-180°)
  // Lunar: 0°=new, 90°=first quarter, 180°=full, 270°=last quarter
  // phDraw: 0°=full, 90°=quarters, 180°=new
  const phDrawAngle = Math.abs(180 - lunarAngle);
  
  // Determine lit side based on lunar phase
  // 0-180°: waxing, right side lit; 180-360°: waning, left side lit
  const litSide = lunarAngle < 180 ? 'Right' : 'left';
  
  // Get the canvas and animate the drawing
  const canvas = document.getElementById('Moon');
  if (canvas) {
    const animationDuration = 800;
    const startTime = Date.now();
    
    function animatePhase() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const easedProgress = easeOutCubic(progress);
      
      // Draw the phase
      phDraw(phDrawAngle, canvas, litSide, easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animatePhase);
      } else {
        // Animation complete: update readout with lunar phase info
        updateMoonReadout();
      }
    }
    
    animatePhase();
  }
  
  return phDrawAngle;
}

 //draws a phase demo on a canvas element, given an angle and side (left or right)
function phDraw(a, cv, side, animProgress) {
  cv   = cv   || document.getElementById('phase-demo');
  side = side || currentSide;
  animProgress = animProgress || 1;  // Default to fully drawn
  
  // Animate the phase angle from 0 to the actual angle for terminator sweep effect
  const animAngle = a * animProgress;
  
  const x=cv.getContext('2d'), c=cv.width/2, fullRadius=c-3;
  const r = fullRadius * animProgress;  // Animate radius from 0 to full size
  
  // Get the planet-specific color, default to white
  const planetColor = planetColors[cv.id] || '#FFFFFF';
  const f=(s,fn)=>{x.beginPath();fn();x.fillStyle=s;x.fill()};
  x.clearRect(0,0,cv.width,cv.height);

  f('#1a1a2e', ()=>x.arc(c,c,r,0,Math.PI*2));

  
  if(side==='Right') {
    f(planetColor, ()=>{x.arc(c,c,r,-Math.PI/2,Math.PI/2,false);x.lineTo(c,c)});
  } else {
    f(planetColor, ()=>{x.arc(c,c,r,Math.PI/2,-Math.PI/2,false);x.lineTo(c,c)});
  }

  //draws ellipse over lit half to create crescent shape
  if(side==='Right') {
    f(animAngle<90?planetColor:'#1a1a2e', ()=>x.ellipse(c,c,Math.abs(Math.cos(animAngle*Math.PI/180))*r,r,0,0,Math.PI*2));
  } else {
    f(animAngle<90?planetColor:'#1a1a2e', ()=>x.ellipse(c,c,Math.abs(Math.cos(animAngle*Math.PI/180))*r,r,0,0,Math.PI*2));
  }

  x.beginPath();x.arc(c,c,r,0,Math.PI*2);x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=1.5;x.stroke();


// takes the angle and determines what phase name to display
  let phaseName = '';
if(a<=5)         phaseName = side==='Right' ? 'Full' : 'Full';
else if(a<=45)   phaseName = side==='Right' ? 'Waxing Gibbous'   : 'Waning Gibbous';
else if(a<=90)   phaseName = side==='Right' ? 'First Quarter'    : 'Third Quarter';
else if(a<=135)  phaseName = side==='Right' ? 'Waxing Crescent'  : 'Waning Crescent';
else             phaseName = 'New';


  //updates the text readout below the canvas to show the current angle, percentage lit, and which side is lit
  if(cv.id === 'phase-demo') {
    document.getElementById('phase-readout').textContent=a+'° | '+Math.round((1-a/180)*100)+'% lit — '+side+'   |   '  +phaseName+'';
  } else if(cv.id) {
    const readoutId = cv.id + '-readout';
    const readoutElement = document.getElementById(readoutId);
    if(readoutElement) {
      let readoutText = a+'° | '+Math.round((1-a/180)*100)+'% lit — '+side+'   |   '  +phaseName;
      // Add orbital speed on a new line if available
      if(orbitalSpeeds[cv.id]) {
        readoutText += '<br>Orbital Speed: ' + orbitalSpeeds[cv.id].toFixed(2) + ' km/s';
      }
      readoutElement.innerHTML = readoutText;
    }
  }
}




//draws preset phase angles for demonstration out of the empty canvas from earlier
[['Full',0],['Gibbous',30],['Quarter',60],['Half',90],['Quarter',120],['Crescent',150],['New',180]]
  .forEach(([l,a])=>{
    const d=document.createElement('div'),c=document.createElement('canvas'),s=document.createElement('span');
    c.width=c.height=48; phDraw(a,c,'left');
    Object.assign(d.style,{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'});
    Object.assign(s.style,{font:'11px sans-serif',color:'#fff'});
    s.textContent=l; d.append(c,s);
    document.getElementById('phase-presets').appendChild(d);
  });

phDraw(90);




//Connects to NASA’s Horizon API, and then pulls needed values such as phase angle to then be passed onto the phDraw function
//Makes separate API calls for phase angle and solar elongation
async function fetchPlanetPhaseAngle(planetName, horizonsCode) {


  // Fetches current date/time in ISO format for API request
  const now = new Date();
  const startTime = now.toISOString().slice(0, 19);  // Get YYYY-MM-DDTHH:mm:ss
  const stopTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);  // Add 24 hours
  const stopTimeFormatted = stopTime.toISOString().slice(0, 19);  // Get YYYY-MM-DDTHH:mm:ss


  const baseParams = {
    format: 'json',
    COMMAND: horizonsCode,
    CENTER: '500@399',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    START_TIME: startTime,   
    STOP_TIME: stopTimeFormatted,  
    STEP_SIZE: '1d'
  };

  try {
    // First API call for phase angle (quantity 24)
    const phaseParams = new URLSearchParams({
      ...baseParams,
      QUANTITIES: '24'
    });
    const phaseUrl = `https://corsproxy.io/?https://ssd.jpl.nasa.gov/api/horizons.api?${phaseParams.toString()}`;
    const phaseResponse = await fetch(phaseUrl);
    const phaseData = await phaseResponse.json();
    
    if (!phaseData.result) {
      console.error(`No phase data for ${planetName}:`, phaseData);
      return null;
    }
    
    let phaseAngle = null;
    const phaseLines = phaseData.result.split('\n');
    for (let i = 0; i < phaseLines.length; i++) {
      if (phaseLines[i].includes('$$SOE')) {
        const dataLine = phaseLines[i + 1];
        if (dataLine) {
          const values = dataLine.trim().split(/\s+/);
          phaseAngle = parseFloat(values[values.length - 1]);
          break;
        }
      }
    }
    console.log(`Phase Angle (S-T-O) for ${planetName}:`, phaseAngle);

    // Second API call for solar elongation (quantity 31)
    const elongParams = new URLSearchParams({
      ...baseParams,
      QUANTITIES: '31'
    });
    const elongUrl = `https://corsproxy.io/?https://ssd.jpl.nasa.gov/api/horizons.api?${elongParams.toString()}`;
    const elongResponse = await fetch(elongUrl);
    const elongData = await elongResponse.json();
    
    if (!elongData.result) {
      console.error(`No elongation data for ${planetName}:`, elongData);
      return null;
    }
    
    let solarElongation = null;
    const elongLines = elongData.result.split('\n');
    for (let i = 0; i < elongLines.length; i++) {
      if (elongLines[i].includes('$$SOE')) {
        const dataLine = elongLines[i + 1];
        if (dataLine) {
          const values = dataLine.trim().split(/\s+/);
          solarElongation = parseFloat(values[values.length - 1]);
          break;
        }
      }
    }
    console.log(`Solar Elongation for ${planetName}:`, solarElongation);
    
    // Orbital speed: use hard-coded averages (see `orbitalSpeeds` above).
    if (orbitalSpeeds[planetName] !== undefined) {
      console.log(`Using hardcoded orbital speed for ${planetName}:`, orbitalSpeeds[planetName]);
    }
    
    // Determine which side is lit based on solar elongation
    // Positive elongation: planet is east of sun, right side faces sun (right is lit)
    // Negative elongation: planet is west of sun, left side faces sun (left is lit)
    const litSide = solarElongation > 0 ? 'Right' : 'left';
    
    // Draw the phase with the fetched angle on the planet's canvas
    if (phaseAngle !== null) {
      const canvas = document.getElementById(planetName);
      if(canvas) {
        // Animate the drawing with easing
        const animationDuration = 800;  // milliseconds
        const startTime = Date.now();
        
        function animatePhase() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          const easedProgress = easeOutCubic(progress);
          
          phDraw(phaseAngle, canvas, litSide, easedProgress);
          
          if (progress < 1) {
            requestAnimationFrame(animatePhase);
          }
        }
        
        animatePhase();
      }
    }
    
    return phaseAngle;

  } catch(err) {
    console.error(`Fetch error for ${planetName}:`, err);
    return null;
  }
}

// Update Moon readout with lunar phase info
function updateMoonReadout() {
  const lunarAngle = getLunarPhaseAngle();
  const lunarPhase = getLunarPhase();
  const phDrawAngle = Math.abs(180 - lunarAngle);
  const percentage = Math.round((1 - phDrawAngle / 180) * 100);
  const litSide = lunarAngle < 180 ? 'Right' : 'left';
  
  const readoutElement = document.getElementById('Moon-readout');
  if (readoutElement) {
    const orbitalSpeed = orbitalSpeeds['Moon'] ? orbitalSpeeds['Moon'].toFixed(2) : 'N/A';
    readoutElement.innerHTML = `${phDrawAngle.toFixed(1)}° | ${percentage}% lit — ${litSide}   |   ${lunarPhase}<br>Orbital Speed: ${orbitalSpeed} km/s`;
  }
}

// Fetch phase angles for all planets
// Horizons codes: Moon=301, Mercury=199, Venus=299, Mars=499, Jupiter=599, Saturn=699, Uranus=799, Neptune=899
// Moon uses algorithmic lunar phase calculation instead of API
initMoonPhase();
fetchPlanetPhaseAngle('Mercury', '199');
fetchPlanetPhaseAngle('Venus', '299');
fetchPlanetPhaseAngle('Mars', '499');
fetchPlanetPhaseAngle('Jupiter', '599');
fetchPlanetPhaseAngle('Saturn', '699');
fetchPlanetPhaseAngle('Uranus', '799');
fetchPlanetPhaseAngle('Neptune', '899');
