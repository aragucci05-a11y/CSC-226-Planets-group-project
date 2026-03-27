
//sets default state for the phase demo, with an angle of 90 degrees and the left side lit
let currentAngle = 90;
let currentSide  = 'left';


 //draws a phase demo on a canvas element, given an angle and side (left or right)
function phDraw(a, cv, side) {
  cv   = cv   || document.getElementById('phase-demo');
  side = side || currentSide;
  const x=cv.getContext('2d'), c=cv.width/2, r=c-3;
  const f=(s,fn)=>{x.beginPath();fn();x.fillStyle=s;x.fill()};
  x.clearRect(0,0,cv.width,cv.height);

  f('#1a1a2e', ()=>x.arc(c,c,r,0,Math.PI*2));


  
  if(side==='Right') {
    f('#FFFFFF', ()=>{x.arc(c,c,r,-Math.PI/2,Math.PI/2,false);x.lineTo(c,c)});
  } else {
    f('#FFFFFF', ()=>{x.arc(c,c,r,Math.PI/2,-Math.PI/2,false);x.lineTo(c,c)});
  }


  //draws ellipse over lit half to create crescent shape
  if(side==='Right') {
    f(a<90?'#FFFFFF':'#1a1a2e', ()=>x.ellipse(c,c,Math.abs(Math.cos(a*Math.PI/180))*r,r,0,0,Math.PI*2));
  } else {
    f(a<90?'#FFFFFF':'#1a1a2e', ()=>x.ellipse(c,c,Math.abs(Math.cos(a*Math.PI/180))*r,r,0,0,Math.PI*2));
  }

  x.beginPath();x.arc(c,c,r,0,Math.PI*2);x.strokeStyle='rgba(255,255,255,.2)';x.lineWidth=1.5;x.stroke();


// takes the angle and determines what phase name to display
  let phaseName = '';
if(a<=5)         phaseName = side==='Right' ? 'Full' : 'Full';
else if(a<=45)   phaseName = side==='Right' ? 'Waxing Gibbous'   : 'Waning Gibbous';
else if(a<=90)   phaseName = side==='Right' ? 'First Quarter'    : 'Third Quarter';
else if(a<=135)  phaseName = side==='Right' ? 'Waxing Crescent'  : 'Waning Crescent';
else             phaseName = 'New';


  //updates the text readout below the demo canvas to show the current angle, percentage lit, and which side is lit
  if(cv===document.getElementById('phase-demo'))
    document.getElementById('phase-readout').textContent=a+'° | '+Math.round((1-a/180)*100)+'% lit — '+side+'   |   '  +phaseName+'';
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


//Connects to NASA's Horizons API, and then pulls needed values such as phase angle to then be passed onto the phDraw function
//Async function makes the program wait until it gets the data from NASA before progressing
async function fetchMercuryPhaseAngle() {
    const params = new URLSearchParams({
        format: 'text',
        COMMAND: '199',            // Mercury
        CENTER: '500@399',         // Earth geocenter
        MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'OBSERVER',
        START_TIME: 'now',
        STOP_TIME: 'now',
        STEP_SIZE: '1 d',
        QUANTITIES: '31',          // phase angle quantity
        CSV_FORMAT: 'YES'
    });

    const url = `https://corsproxy.io/?https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Horizons request failed: ' + response.status);
    const text = await response.text();

    let phase;

    // 1) direct label match (plain text)
    let m = text.match(/PHASE(?:[_ ]ANGLE)?\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (m) phase = Number(m[1]);

    // 2) CSV block from Horizons
    if (phase == null) {
        const csvBlock = text.includes('$$SOE')
            ? text.slice(text.indexOf('$$SOE') + 5, text.indexOf('$$EOE') >= 0 ? text.indexOf('$$EOE') : undefined)
            : text;
        const lines = csvBlock.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2 && lines[0].includes(',')) {
            const headers = lines[0].replace(/"/g, '').split(',').map(h => h.trim().toLowerCase());
            const phaseIndex = headers.findIndex(h => /phase/i.test(h));
            if (phaseIndex >= 0) {
                const values = lines[1].replace(/"/g, '').split(',').map(v => v.trim());
                phase = Number(values[phaseIndex]);
            }
        }
    }

    // 3) fallback scanning for a plausible 0-180 value
    if (phase == null || Number.isNaN(phase)) {
        const nums = Array.from(text.matchAll(/[-+]?\d*\.?\d+/g), m => Number(m[0])).filter(n => !Number.isNaN(n));
        phase = nums.find(n => n >= 0 && n <= 180);
    }

    if (phase == null || Number.isNaN(phase)) {
        throw new Error('Could not parse Mercury phase angle from Horizons response');
    }

    return phase;
}

// Only one definition of getPlanetData is present for clarity
async function getPlanetData() {
    try {
        const phaseAngle = await fetchMercuryPhaseAngle();
        console.log('Mercury phase angle:', phaseAngle);
        return phaseAngle;
    } catch (err) {
        console.error(err);
        return null;
    }
}

getPlanetData();