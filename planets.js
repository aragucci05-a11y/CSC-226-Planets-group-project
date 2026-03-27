
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


//Connects to NASA’s Horizon API, and then pulls needed values such as phase angle to then be passed onto the phDraw function
//Async function makes the program wait until it gets the data from NASA before progressing
async function fetchMercuryPhaseAngle() {

  const params = new URLSearchParams({
    format: 'json',
    COMMAND: '199',
    CENTER: '500@399',
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    START_TIME: '2026-03-27',   //Temporily hardcoded times, needs to pull current time and put that within the parameters for the API call
    STOP_TIME: '2026-03-28',  
    STEP_SIZE: '1m',          // 1 minute step size for high resolution
    QUANTITIES: '24'          // Quantity 24 corresponds to the phase angle (S-T-O) in the Horizons API
  });

  const url = `https://corsproxy.io/?https://ssd.jpl.nasa.gov/api/horizons.api?${params.toString()}`;

  fetch(url)
    .then(r => r.json())
    .then(d => {
      // The actual table data is inside d.result as one big string
      const resultText = d.result;

      console.log("Full result from Horizons:", resultText);

      // Parse the data and extract the phase angle (Phase angle is listed under S-T-O column in table)
      const lines = resultText.split('\n');
      let phaseAngle = null;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('$$SOE')) {
          // The next line after $$SOE contains the actual data
          const dataLine = lines[i + 1];
          if (dataLine) {
            // Split on whitespace and take the S-T-O value
            const values = dataLine.trim().split(/\s+/);

            phaseAngle = values[values.length - 1];
            break;
          }
        }
      }

      console.log("Phase Angle (S-T-O):", phaseAngle);

    })
    .catch(err => console.error("Fetch error:", err));
}

fetchMercuryPhaseAngle();