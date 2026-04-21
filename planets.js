//sets default state for the phase demo, with an angle of 90 degrees and the left side lit
let currentAngle = 90;
let currentSide  = 'left';

// Store orbital speeds for each planet
const orbitalSpeeds = {};

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

// Easing function for smooth animation
function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
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

  // Draw planet with glow effect
  drawPlanetWithGlow(x, c, r, planetColor, animProgress);

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

  // Enhanced glow effect
  const litFraction = 1 - (a / 180);
  const glowIntensity = litFraction * 60 * animProgress;
  const glowAlpha = litFraction * 0.9 * animProgress;

  if (glowIntensity > 0.5) {
    const glowColor = planetColors[cv.id] || '#FFFFFF';
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `${r},${g},${b}`;
    };
    const rgb = hexToRgb(glowColor);

    // Multiple glow layers for stronger effect
    for (let i = 3; i > 0; i--) {
      x.save();
      x.shadowBlur = glowIntensity * i;
      x.shadowColor = `rgba(${rgb}, ${glowAlpha * (1 - i * 0.3)})`;
      x.beginPath();
      x.arc(c, c, r + i, 0, Math.PI * 2);
      x.strokeStyle = `rgba(${rgb}, ${glowAlpha * 0.4})`;
      x.lineWidth = 2;
      x.stroke();
      x.restore();
    }
  }

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
    
    // Third API call for orbital speed/heliocentric distance rate (quantity 20)
    const speedParams = new URLSearchParams({
      ...baseParams,
      QUANTITIES: '20'
    });
    const speedUrl = `https://corsproxy.io/?https://ssd.jpl.nasa.gov/api/horizons.api?${speedParams.toString()}`;
    const speedResponse = await fetch(speedUrl);
    const speedData = await speedResponse.json();
    
    if (!speedData.result) {
      console.error(`No speed data for ${planetName}:`, speedData);
      return null;
    }
    
    let orbitalSpeed = null;
    const speedLines = speedData.result.split('\n');
    for (let i = 0; i < speedLines.length; i++) {
      if (speedLines[i].includes('$$SOE')) {
        const dataLine = speedLines[i + 1];
        if (dataLine) {
          const values = dataLine.trim().split(/\s+/);
          // Quantity 20 is the range rate, convert to km/s if needed
          orbitalSpeed = Math.abs(parseFloat(values[values.length - 1]));
          break;
        }
      }
    }
    console.log(`Orbital Speed for ${planetName}:`, orbitalSpeed);
    
    // Store orbital speed for display in readout
    if(orbitalSpeed !== null) {
      orbitalSpeeds[planetName] = orbitalSpeed;
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

// Fetch phase angles for all planets
// Horizons codes: Moon=301, Mercury=199, Venus=299, Mars=499, Jupiter=599, Saturn=699, Uranus=799, Neptune=899
fetchPlanetPhaseAngle('Moon', '301');
fetchPlanetPhaseAngle('Mercury', '199');
fetchPlanetPhaseAngle('Venus', '299');
fetchPlanetPhaseAngle('Mars', '499');
fetchPlanetPhaseAngle('Jupiter', '599');
fetchPlanetPhaseAngle('Saturn', '699');
fetchPlanetPhaseAngle('Uranus', '799');
fetchPlanetPhaseAngle('Neptune', '899');

// Planet image URLs
const planetImages = {
  'Moon': './images/moon.jpg',
  'Mercury': './images/mercury.jpg',
  'Venus': './images/venus.jpg',
  'Mars': './images/mars.jpg',
  'Jupiter': './images/jupiter.jpg',
  'Saturn': './images/saturn.jpg',
  'Uranus': './images/uranus.jpg',
  'Neptune': './images/neptune.jpg'
};

// Store loaded planet images
const loadedImages = {};

// Preload planet images
async function preloadPlanetImages() {
  for (const [planetName, url] of Object.entries(planetImages)) {
    const img = new Image();
    img.onload = () => {
      loadedImages[planetName] = img;
    };
    img.onerror = () => {
      console.warn(`Failed to load image for ${planetName}: ${url}`);
    };
    img.src = url;
  }
}

// Modified phDraw function to use planet images
function phDraw(a, cv, side, animProgress) {
  cv   = cv   || document.getElementById('phase-demo');
  side = side || currentSide;
  animProgress = animProgress || 1;
  
  const animAngle = a * animProgress;
  const x = cv.getContext('2d'), c = cv.width/2, fullRadius = c - 3;
  const r = fullRadius * animProgress;
  
  const planetColor = planetColors[cv.id] || '#FFFFFF';
  const f = (s, fn) => {x.beginPath(); fn(); x.fillStyle = s; x.fill()};
  x.clearRect(0, 0, cv.width, cv.height);

  // Draw background shadow sphere
  f('#1a1a2e', () => x.arc(c, c, r, 0, Math.PI * 2));

  // Draw planet image if available
  const planetImg = loadedImages[cv.id];
  if (planetImg && planetImg.complete) {
    x.save();
    x.beginPath();
    x.arc(c, c, r, 0, Math.PI * 2);
    x.clip();
    x.drawImage(planetImg, c - r, c - r, r * 2, r * 2);
    x.restore();
  }

  // Draw lit/dark side
  if (side === 'Right') {
    f(planetColor, () => {x.arc(c, c, r, -Math.PI/2, Math.PI/2, false); x.lineTo(c, c)});
  } else {
    f(planetColor, () => {x.arc(c, c, r, Math.PI/2, -Math.PI/2, false); x.lineTo(c, c)});
  }

  // Draw crescent shape
  if (side === 'Right') {
    f(animAngle < 90 ? planetColor : '#1a1a2e', () => x.ellipse(c, c, Math.abs(Math.cos(animAngle * Math.PI/180)) * r, r, 0, 0, Math.PI * 2));
  } else {
    f(animAngle < 90 ? planetColor : '#1a1a2e', () => x.ellipse(c, c, Math.abs(Math.cos(animAngle * Math.PI/180)) * r, r, 0, 0, Math.PI * 2));
  }

  x.beginPath(); x.arc(c, c, r, 0, Math.PI * 2); x.strokeStyle = 'rgba(255,255,255,.2)'; x.lineWidth = 1.5; x.stroke();

  // Enhanced glow effect
  const litFraction = 1 - (a / 180);
  const glowIntensity = litFraction * 60 * animProgress;
  const glowAlpha = litFraction * 0.9 * animProgress;

  if (glowIntensity > 0.5) {
    const glowColor = planetColors[cv.id] || '#FFFFFF';
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `${r},${g},${b}`;
    };
    const rgb = hexToRgb(glowColor);

    // Multiple glow layers for stronger effect
    for (let i = 3; i > 0; i--) {
      x.save();
      x.shadowBlur = glowIntensity * i;
      x.shadowColor = `rgba(${rgb}, ${glowAlpha * (1 - i * 0.3)})`;
      x.beginPath();
      x.arc(c, c, r + i, 0, Math.PI * 2);
      x.strokeStyle = `rgba(${rgb}, ${glowAlpha * 0.4})`;
      x.lineWidth = 2;
      x.stroke();
      x.restore();
    }
  }

  // ...existing phase name and readout code...
}

// Call this when the page loads
preloadPlanetImages();









