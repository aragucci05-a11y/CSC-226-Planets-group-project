--== PLANET SEEKER ==--        

Created by:
Angelo Ragucci (project organizer)
Nicholas Barton
Justin Robles

A website created to track information about the planets in our solar system.
Uses real time NASA data from the Horizon API to display information about each planet.
Draws phase angles for each planet as viewed from Earth, similar to Lunar phases

---

### Challenges and thought process during creation:

**Angelo:**
When embarking on this project, I had very little experience writing in javascript,
let alone how to use an API.

I was repsonsible for the javascript portion of this project, which handles
a majority of its functionality, as the idea of this website was somthing I came
up with for our web development group project.

The first hurdle was creating a system that would display the planet along
with its lit portion, that could display any phase angle. I initially tried
describing what I wanted to Claude, however did not acheive the result I wanted.
To remedy this, I tried a new approach. I did this by looking at websites that 
showed the lunar phases, then gave Claude the link and told it make a simple function
that can draw the phase angle and that could take numeric imputs that could later be 
called from an external API. I did this to ensure I could easily change things in the future if needed.

After creating the first prototype that satisfied my vision, I asked Claude to then break down the code.
I made it explain line by line, what everything did, peice by peice in order to understand how it worked.
This greatly helped, as it explained how it made a blank canvas, used a math expression to draw an ellipse,
showed me where I could change the colors, etc. Knowing how this simple function worked allowed
me to debug the code numerous times throughout the project, and tweak minor things to my liking.

Once the system for visualizing the phase angles was implemented, I then moved to retreive the data
from JPL's Horizon API, which is an extensive database of objects tracked in realtime by NASA. The database tracks
a variety of metrics about every single object NASA tracks in space, with time series functionality.
I chose this because it made the program more modular and expandable, allowing me to add additional data
and program addittional content to my liking in the future.

The APi was challenging to work wih at first, as a simple fetch request within javascript returned a CORS error.
I then researched this and how to get around it, and figured out I could use a proxy to connect, thus
bypassing this issue. I then tested its functionality in the console to confirm it worked.

Following this breakthrough, I moved on to parsing the data returned by the API call. This was one of the hardest 
challenges faced during the project, as the API returned its information in a raw text file, making it much more
difficult to search for a specific data point. i eventually solved this by figuring out I could simply convert the
file to JSON format, then having the code sort through the text and pull what I need.

From here, things become much more smooth, as once the API data was pulled, all that was left was to pass that value
to the draw function. This was the last major technical hurdle, and after this only relatively minor visual
and aesthetic changes were made, as the system structure proved quite modular, allowing easy expansion when needed.
An example of this is that the planet speed was added late into the project, but was simple since the foundation was in place.

**Justin:**
My focus was on system architecture, API reliability, and transforming the frontend into a highly interactive, responsive "Sci-Fi HUD" dashboard. I wanted to ensure the project was not only visually engaging but also technically robust enough to survive network issues during a live presentation.

**Technical Contributions:**
* **API Queueing & Resiliency:** Refactored the NASA Horizon fetch logic to stagger API requests. This prevents CORS proxy rate-limiting and reduces the initial network payload.
* **Simulated Data Fail-Safe:** Engineered a local state machine with fallback telemetry data. If the school Wi-Fi or external proxy drops, the site seamlessly injects this local data to prevent UI crashes and ensure 100% uptime.
* **Cinematic UI/UX:** Completely redesigned the aesthetic using CSS media queries for full mobile responsiveness. Added custom styling including global CRT scanlines, holographic SVG targeting cursors, and glowing webkit scrollbars.
* **Advanced DOM Interactivity:** * Programmed an asynchronous terminal boot sequence using JS Promises.
  * Built dynamic neon tachometers that visually scale based on live planetary velocities.
  * Engineered a state-driven "Auto-Orbit" toggle and mapped Left/Right Arrow keys for manual phase scrubbing.
  * Created a "HUD Focus" hover effect that dynamically blurs inactive planetary cards.
 
 
**Nicholas:**
My focus was on the user-layer and presentation side of the website, which allowed me to contribute heavily to the project’s overall visual identity while continuing to develop my frontend programming skills. One of my most notable developments was creating a working glow-effect system across various site elements, which significantly enhanced the futuristic atmosphere and visual depth of the interface. Although the effect required extensive experimentation and revision, the process gave me valuable experience with advanced CSS styling, layering, visual rendering, and how CSS dynamically integrates with HTML elements to create responsive visual behavior.

In addition to visual development, I was responsible for making informational sections like "About", "How it Works", "The Team", "Data Sources", "Contact Us", and "Credits" pages. Developing these sections while integrating with my teammates' changes at the same time allowed the site to stay consistent. I had to make sure each contribution I added made sense, while adding to other contributions.

Throughout development, I consistently refined layouts and integration methods to allow for new ideas, changes, and sections, and made it feel cohesive with the rest of the platform. 


---
More features may be added in the future as needed.
