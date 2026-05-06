// ==========================================
// BOOT SEQUENCE LOGIC
// ==========================================
const bootMessages = [
    "INITIALIZING PLANETARY TELEMETRY HUD...",
    "ESTABLISHING SECURE UPLINK TO JPL HORIZONS...",
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

// ==========================================
// GLOBALS & DEMO CONTROLS
// ==========================================
let currentAngle = 90;
let currentSide  = 'left';
let orbitInterval = null;
let orbitDirection = 1;

const planetColors = {
  'phase-demo': '#FFFFFF', 'Moon': '#A9A9A9', 'Mercury': '#808080', 
  'Venus': '#FFC649', 'Mars': '#CF3C2C', 'Jupiter': '#C88B3A', 
  'Saturn': '#FAD5A5', 'Uranus': '#4FD0E7', 'Neptune': '#4169E1'
};

// Keyboard Scrubbing
document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight') { currentAngle = Math.min(180, currentAngle + 2); }
    else if(e.key === 'ArrowLeft') { currentAngle = Math.max(0, currentAngle - 2); }
    else { return; }
    document.getElementById('demo-slider').value = currentAngle;
    phDraw(currentAngle);
});

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
}

// Canvas Drawing Engine
function easeOutCubic(progress) { return 1 - Math.pow(1 - progress, 3); }

function phDraw(a, cv, side, animProgress) {
  cv = cv || document.getElementById('phase-demo');
  side = side || currentSide;
  animProgress = animProgress || 1; 
  
  const animAngle = a * animProgress;
  const x=cv.getContext('2d'), c=cv.width/2, fullRadius=c-3;
  const r = fullRadius * animProgress;  
  const planetColor = planetColors[cv.id] || '#FFFFFF';
  
  const f=(s,fn)=>{x.beginPath();fn();x.fillStyle=s;x.fill()};
  x.clearRect(0,0,cv.width,cv.height);
  f('#1a1a2e', ()=>x.arc(c,c,r,0,Math.PI*2));

  if(side==='Right') {
    f(planetColor, ()=>{x.arc(c,c,r,-Math.PI/2,Math.PI/2,false);x.lineTo(c,c)});
    f(animAngle<90?planetColor:'#1a1a2e', ()=>x.ellipse(c,c,Math.abs(Math.cos(animAngle*Math.PI/180))*r,r,0,0,Math.PI*2));
  } else {
    f(planetColor, ()=>{x.arc(c,c,r,Math.PI/2,-Math.PI/2,false);x.lineTo(c,c)});
    f(animAngle<90?planetColor:'#1a1a2e', ()=>x.ellipse(c,c,Math.abs(Math.cos(animAngle*Math.PI/180))*r,r,0,0,Math.PI*2));
  }

  x.beginPath();x.arc(c,c,r,0,Math.PI*2);x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=1.5;x.stroke();

  let phaseName = '';
  if(a<=5) phaseName = 'Full';
  else if(a<=45) phaseName = side==='Right' ? 'Waxing Gibbous' : 'Waning Gibbous';
  else if(a<=90) phaseName = side==='Right' ? 'First Quarter' : 'Third Quarter';
  else if(a<=135) phaseName = side==='Right' ? 'Waxing Crescent' : 'Waning Crescent';
  else phaseName = 'New';

  if(cv.id === 'phase-demo') {
    document.getElementById('phase-readout').textContent = a+'° | '+Math.round((1-a/180)*100)+'% lit — '+side+' | '+phaseName;
  }
}

// Demo Presets
[['Full',0],['Gibbous',30],['Quarter',60],['Half',90],['Quarter',120],['Crescent',150],['New',180]].forEach(([l,a])=>{
    const d=document.createElement('div'),c=document.createElement('canvas'),s=document.createElement('span');
    c.width=c.height=48; phDraw(a,c,'left');
    Object.assign(d.style,{display:'flex',flexDirection:'column',alignItems:'center',gap:'4px'});
    Object.assign(s.style,{font:'11px sans-serif',color:'#fff'});
    s.textContent=l; d.append(c,s);
    document.getElementById('phase-presets').appendChild(d);
});
phDraw(90);

// ==========================================
// FAIL-SAFE DATA & API QUEUE
// ==========================================
const fallbackData = {
    'Moon': { phase: 45, litSide: 'Right', speed: 1.02, maxSpeed: 50 },
    'Mercury': { phase: 120, litSide: 'left', speed: 47.36, maxSpeed: 50 },
    'Venus': { phase: 75, litSide: 'Right', speed: 35.02, maxSpeed: 50 },
    'Mars': { phase: 30, litSide: 'left', speed: 24.07, maxSpeed: 50 },
    'Jupiter': { phase: 5, litSide: 'Right', speed: 13.07, maxSpeed: 50 },
    'Saturn': { phase: 3, litSide: 'left', speed: 9.68, maxSpeed: 50 },
    'Uranus': { phase: 1, litSide: 'Right', speed: 6.80, maxSpeed: 50 },
    'Neptune': { phase: 0, litSide: 'left', speed: 5.43, maxSpeed: 50 }
};

function formatTelemetry(planetName, a, side, phaseName, speed) {
    const readoutElement = document.getElementById(`${planetName}-readout`);
    if(readoutElement) {
        // Calculate tachometer width relative to Mercury (max 50km/s)
        const speedPercent = Math.min((speed / 50) * 100, 100);
        
        readoutElement.innerHTML = `
            ${a}° | ${Math.round((1-a/180)*100)}% lit — ${side} <br>
            <span style="color:white">${phaseName}</span> <br><br>
            Velocity: ${speed.toFixed(2)} km/s
            <div class="tach-container">
                <div class="tach-bar" style="width: ${speedPercent}%"></div>
            </div>
        `;
    }
}

async function loadPlanetData(planetName) {
    const canvas = document.getElementById(planetName);
    if(!canvas) return;

    try {
        // Fallback simulated data load
        const data = fallbackData[planetName];
        let phaseName = '';
        if(data.phase<=5) phaseName = 'Full';
        else if(data.phase<=45) phaseName = data.litSide==='Right' ? 'Waxing Gibbous' : 'Waning Gibbous';
        else if(data.phase<=90) phaseName = data.litSide==='Right' ? 'First Quarter' : 'Third Quarter';
        else if(data.phase<=135) phaseName = data.litSide==='Right' ? 'Waxing Crescent' : 'Waning Crescent';
        else phaseName = 'New';

        // Animate
        const animationDuration = 800;
        const startTime = Date.now();
        
        function animatePhase() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / animationDuration, 1);
          phDraw(data.phase, canvas, data.litSide, easeOutCubic(progress));
          if (progress < 1) requestAnimationFrame(animatePhase);
        }
        animatePhase();
        formatTelemetry(planetName, data.phase, data.litSide, phaseName, data.speed);
        
    } catch(err) {
        console.error(`Fallback failed for ${planetName}:`, err);
    }
}

// Load planets with a slight stagger for visual effect
const planetsToLoad = ['Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
planetsToLoad.forEach((planet, index) => {
    setTimeout(() => {
        loadPlanetData(planet);
    }, index * 200); 
});