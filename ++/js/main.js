/* 	JavaScript for fishroot, a game about living on the open seas
* 	Version 0.1
*	
* 	To do:
*	Implement rudimentary fishing and interface in a cool way
*	Make a little bait and tackle screen
*/

/*	CONSTANT VARIABLES ===========================================================================
*	
*	============================================================================================*/
// Wrapper for constant variables
var c = {
	DEBUG: false,

	KEY_ENTER: 13,
	KEY_SHIFT: 16,
	KEY_LEFT: 37,
	KEY_UP: 38,
	KEY_RIGHT: 39,
	KEY_DOWN: 40,
	KEY_M: 77,
	KEY_F: 70,
	
	WORLD_WIDTH_PX: "600px",
	WORLD_WIDTH: 600,
	WORLD_HEIGHT_PX: "600px",
	WORLD_HEIGHT: 600,
	
	BLIP_SIZE_PX: "5px",
	BLIP_SIZE: 5,
	
	GAME_TICK_TIME: 100, 	//ms
	WIND_INTERVAL: 20, 		// in ticks, time between wind blowing boat
	WIND_MOVE_POWER: 10, 	// fraction of knots that wind pushes boats/ wind interval
	FISH_INTERVAL: 5, 		// in ticks, time between checking for fish while fishing
	
	DEPTH_PLACEHOLDER: 1000,
	LAND_LEVEL: 0,
	LATITUDE_SIZE_PX: 30,
	VISION_RADIUS: 2,
	MOVE_SPEED: 4,
	
	XMIN: -300,
	XMAX: 300,
	YMIN: -300,
	YMAX: 300,
	SMIN: 30,
	SMAX: 40,
	DMIN: 0,
	DMAX: 250,
	TMIN: 0,
	TMAX: 30,
	GMIN: -1,
	GMAX: 1
};

/*	GAME STATE VARIABLES =========================================================================
*	
*	============================================================================================*/

SEA_GRID_SIZE = c.WORLD_WIDTH / c.BLIP_SIZE;
seaGrid = [];

// environment variables
x = 300;
y = 300;
windX = 0;
windY = 0;
salinity = 40;
temperature = 30;
dfactor = 0.5;

// the game clock
totalTicks = 0;

// Whether or not we are in fishing mode, where we sit and wait
fishing = false;

// Fishtiary frequencies:
// 5-10: common
// 2-5: uncommon
// 1-2: rare
// 0.5-1: v. rare
// etc..
FISHTIARY = [
	{r: 9.0, xmin:c.XMIN, xmax:c.XMAX, ymin:c.YMIN, ymax:c.YMAX, smin:c.SMIN, smax:c.SMAX, dmin:c.DMIN, dmax:c.DMAX, tmin:c.TMIN, tmax:c.TMAX, gmin:c.GMIN, gmax:c.GMAX, name:"bluefish"},
	{r: 6.0, xmin:c.XMIN, xmax:c.XMAX, ymin:c.YMIN, ymax:c.YMAX, smin:c.SMIN, smax:c.SMAX, dmin:c.DMIN, dmax:c.DMAX, tmin:c.TMIN, tmax:c.TMAX, gmin:c.GMIN, gmax:c.GMAX, name:"redfish"},
	{r: 3.0, xmin:c.XMIN, xmax:c.XMAX, ymin:c.YMIN, ymax:c.YMAX, smin:c.SMIN, smax:c.SMAX, dmin:c.DMIN, dmax:c.DMAX, tmin:c.TMIN, tmax:c.TMAX, gmin:c.GMIN, gmax:c.GMAX, name:"greenfish"},
	];

/*	MAIN FUNCTIONS ===============================================================================
*	
*	============================================================================================*/

function bootstrap() {
	if (c.DEBUG) {
		document.getElementById("debug").innerHTML = "0. No compile errors: made it to bootstrap";
	}
	
	// initialize the sea grid
	for (i = 0; i < SEA_GRID_SIZE; i++) {
		gridRow = [];
		for (j = 0; j < SEA_GRID_SIZE; j++) {
			// high placeholder number
			gridRow[j] = c.DEPTH_PLACEHOLDER;
		}
		seaGrid[i] = gridRow;
	}
	
	// Preliminary location update
	updateLocation();
	
	// Add the key listener
	document.addEventListener("keydown", keyDownHandler, false);
	
	// Start the clock!
	setInterval(tick, c.GAME_TICK_TIME);
}

// controls environment and time-based stuff, like wind and fishing
function tick() {
	totalTicks++;
	
	if(totalTicks%c.WIND_INTERVAL == 0) {
		right(Math.round(windX/c.WIND_MOVE_POWER));
		down(Math.round(windY/c.WIND_MOVE_POWER));
	}

	if(fishing && (totalTicks%c.FISH_INTERVAL == 0)) {
		checkForFish();
	}
}

/*	ENVIRONMENT TRIGGERS =========================================================================
*	
*	============================================================================================*/

// controls input read in from the keys
function keyDownHandler(event) {
	if (!fishing) {
		if(event.keyCode == c.KEY_LEFT) {
			left(c.MOVE_SPEED);
		}
		if(event.keyCode == c.KEY_UP) {
			up(c.MOVE_SPEED);
		}
		if(event.keyCode == c.KEY_RIGHT) {
			right(c.MOVE_SPEED);
		}
		if(event.keyCode == c.KEY_DOWN) {
			down(c.MOVE_SPEED);
		}
	}
	if(event.keyCode == c.KEY_F) {
		fishing = !fishing;
	
		if (fishing) {
			document.getElementById("blip").innerHTML = "<img src=\"img/fishboatr.png\" id=\"boat\"/>";
		}
		else {
			document.getElementById("blip").innerHTML = "<img src=\"img/boatr.png\" id=\"boat\"/>";
		}
	
		document.getElementById("debug").innerHTML = "Fishing: " + fishing;
	}
}


/*	HELPER METHODS ===============================================================================
*	
*	============================================================================================*/

// Methods related to getting fish
function checkForFish() {
	currentFish = [];
	
	// Figure out what fish might be available in this region based on world conditions
	for (i = 0; i < FISHTIARY.length; i++) {
		if (fishInLocation(FISHTIARY[i], x-c.WORLD_WIDTH/2, y-c.WORLD_HEIGHT/2)) {
			currentFish.push(FISHTIARY[i]);
		}
	}
	
	// Sum the rarities of all present fish, and pick one among them.
	raritySum = 0;
	for (i = 0; i < currentFish.length; i++) {
		raritySum += currentFish[i].r;
	}
	fishSelect = Math.random()*(raritySum+10);
	for (i = 0; i < currentFish.length; i++) {
		fishSelect -= currentFish[i].r;
		if(fishSelect <= 0) {
			document.getElementById("debug").innerHTML = fishSelect + " " + raritySum+" "+currentFish[i].name;
			document.getElementById("blip").innerHTML = "<img src=\"img/boatr.png\" id=\"boat\"/>";
			fishing = false;
			return;
		}
	}
	document.getElementById("debug").innerHTML = "No fish found :(";
	fishing = false;
}
// determines whether or not a specified fish object can be found in a location in game coordinates
function fishInLocation(fish, j, k) {
	if(j >= fish.xmin && 
		j <= fish.xmax &&
		k >= fish.ymin &&
		k <= fish.ymax &&
		salinity >= fish.smin &&
		salinity <= fish.smax &&
		depth >= fish.dmin &&
		depth <= fish.dmax &&
		temperature >= fish.tmin &&
		temperature <= fish.tmax &&
		dfactor >= fish.gmin &&
		dfactor <= fish.gmax
		) {
			return true;
		}
	return false;
}

// Methods to set character position
function setPos(newx, newy){
	_setX(newx);
	_setY(newy);
}
function left(v) {
	if(seaGrid[Math.floor((x-v)/c.BLIP_SIZE)][Math.floor(y/c.BLIP_SIZE)] > c.LAND_LEVEL) {
		_setX(x - v);
	}
	updateLocation();
}
function right(v) {
	if(seaGrid[Math.floor((x+v)/c.BLIP_SIZE)][Math.floor(y/c.BLIP_SIZE)] > c.LAND_LEVEL) {
		_setX(x + v);
	}
	updateLocation();
}
function up(v) { 
	if(seaGrid[Math.floor(x/c.BLIP_SIZE)][Math.floor((y-v)/c.BLIP_SIZE)] > c.LAND_LEVEL) {
		_setY(y - v);
	}
	updateLocation();
}
function down(v) { 
	if(seaGrid[Math.floor(x/c.BLIP_SIZE)][Math.floor((y+v)/c.BLIP_SIZE)] > c.LAND_LEVEL) {
		_setY(y + v);
	}
	updateLocation();
}
function _setX(newx) {
	x = newx;
	document.getElementById("blip").style.left = x + "px";
	//document.getElementById("pointerpixel").style.left = x + "px";
	_jumpIntoBoundaries();
}
function _setY(newy) {
	y = newy;
	document.getElementById("blip").style.top = y + "px";
	//document.getElementById("pointerpixel").style.top = y + "px";
	_jumpIntoBoundaries();
}
function _jumpIntoBoundaries() {
	if (x < 0) {
		_setX(0);
	}
	if (x > c.WORLD_WIDTH - c.BLIP_SIZE) {
		_setX(c.WORLD_WIDTH - c.BLIP_SIZE);
	}
	if (y < 0) {
		_setY(0)
	}
	if (y > c.WORLD_HEIGHT - c.BLIP_SIZE) {
		_setY(c.WORLD_HEIGHT - c.BLIP_SIZE);
	}
}

function updateLocation() {
	document.getElementById("salinity").innerHTML = "("+x+","+y+")";
	for (m = -1*c.VISION_RADIUS; m <= c.VISION_RADIUS; m++) {
		for (n = -1*c.VISION_RADIUS; n <= c.VISION_RADIUS; n++) {
			if (isInBounds(x+m*5, y+n*5)) {
				if (seaGrid[Math.floor(x/c.BLIP_SIZE)+m][Math.floor(y/c.BLIP_SIZE)+n] == c.DEPTH_PLACEHOLDER) {
					createSeaGridSquare(x + m*c.BLIP_SIZE, y + n*c.BLIP_SIZE);
				}
			}
		}
	}
	
	x0 = x - c.WORLD_WIDTH/2;
	y0 = y - c.WORLD_HEIGHT/2;
	
	// Depth is determined by depth on the SeaGrid, which is generated by _generateDepth below
		document.getElementById("depth").innerHTML = seaGrid[Math.floor(x/c.BLIP_SIZE)][Math.floor(y/c.BLIP_SIZE)] + " fathoms";
	// Nautical coordinates are essentially distance from the origin. The grid is 10' by 10'
		document.getElementById("position").innerHTML = getNauticalCoordinates();
	// Temperature is warmest (30C) at the equator, and gets colder (toward 0C) as you go toward the poles
	// WOLFRAM: plot 30 - (abs(y/10)) from -300 to 300
		temperature = Math.floor(30 - (Math.abs(y-(c.WORLD_HEIGHT/2))/10)); // Degrees CONSTANT
		document.getElementById("temperature").innerHTML = temperature + "&deg;C";
		document.getElementById("tempimg").innerHTML = "<img src=\"img/temp"+Math.floor(temperature/4)+".png\" height=\"32px\" width=\"32px\"/>";
	// Salinity goes from 30 PSU (Practical salinity units) to 38 at the center of the map
	// WOLFRAM: plot 40 - (sqrt(x^2+y^2)/42) from -300 to 300
		salinity = Math.floor(40 - (Math.sqrt(x0*x0+y0*y0))/42);
		document.getElementById("salinity").innerHTML = salinity + " g/kg";
	// wind is determined by sqrt (-y, x)
	// WOLFRAM: plot
		windSpeed = Math.floor(Math.sqrt(x0*x0+y0*y0)/10);
		document.getElementById("windspeed").innerHTML = windSpeed + " knots";
		windX = Math.round(-y0/10);
		windY = Math.round(x0/10);
		windDirectionString = "";
		if (windY != 0 && Math.abs(windX/windY) < 2) {
			if (windY > 0) { windDirectionString += "S"; }
			else { windDirectionString += "N"; }
		}
		if (windX != 0 && Math.abs(windY/windX) < 2) {
			if (windX > 0) { windDirectionString += "E"; }
			else { windDirectionString += "W"; }
		}
		if (windX == 0 && windY == 0) { windDirectionString = "N"; }
		document.getElementById("winddirection").innerHTML = windDirectionString;
		document.getElementById("compass").innerHTML="<img src=\"img/compass"+windDirectionString+".png\" height=\"32px\" width=\"32px\"/>";
	// delta factor is determined by a function that makes it fairly random.
	// WOLFRAM: sin((sin(sin(x)+cos(y)) + cos(sin(x)+cos(y)))*3) from -300 to 300
		dfactor = Math.sin((Math.sin(Math.sin(x0)+Math.cos(y0)) + Math.cos(Math.sin(x0)+Math.cos(y0)))*3)*Math.sin(x0/600)*2;
		document.getElementById("dfactor").innerHTML = (Math.round(dfactor*10)/10);
	//document.getElementById("debug").innerHTML = "Total ticks: " + totalTicks;	
}

// Returns a string with latitude/longitude coordinates based on the boat's position
function getNauticalCoordinates() {
	xMod = x - c.WORLD_WIDTH/2;
	yMod = y - c.WORLD_HEIGHT/2;
	WE = "W";
	NS = "N";
	if (xMod > 0) {
		WE = "E";
	}
	if (yMod > 0) {
		NS = "S";
	}
	yMod = Math.abs(yMod);
	xMod = Math.abs(xMod);
	
	lat = Math.floor(xMod/c.LATITUDE_SIZE_PX);
	lon = Math.floor(yMod/c.LATITUDE_SIZE_PX);
	latSec = (xMod - lat*c.LATITUDE_SIZE_PX) * 2;
	lonSec = (yMod - lon*c.LATITUDE_SIZE_PX) * 2;
	return lon+"'"+lonSec+"\""+NS+" "+lat+"\'"+latSec+"\""+WE;
}
function createSeaGridSquare(j, k) {
	depth = _generateDepth(j,k);
	seaGrid[Math.floor(j/c.BLIP_SIZE)][Math.floor(k/c.BLIP_SIZE)] = depth;
	
	// create a dope-ass sea grid tile
	var div = document.createElement('div');
	div.setAttribute('class', 'seaGridTile');
	div.style.top = Math.floor(k/c.BLIP_SIZE)*c.BLIP_SIZE + "px";
	div.style.left = Math.floor(j/c.BLIP_SIZE)*c.BLIP_SIZE + "px";
	// generate the blue and green coloring for the tile
	red = "00";
	green = "FF";
	blue = "FF";
	if (depth < -18) {
		red = "00"; 
		green=((256+5*(depth+30)).toString(16)); 
		blue="10";
	}
	else if (depth < 0) {
		red = "fa"; 
		green="ec"; 
		blue="c0";
	}
	else if (depth < 256) {
		green = (256-depth).toString(16);
		if ((256-depth) < 16) {
			green = "0" + green;
		}
	}
	else if (depth >= 256) {
		green = "00";
		blue = (512-depth).toString(16);
	}
	div.style.backgroundColor = "#"+red+green+blue;
	document.getElementById("world").appendChild(div);
}

// returns a depth based on a pattern of sines and cosines
// complicated. paste the wolfram-alpha formula for the function here
function _generateDepth(j, k) {
	depth = 0;
	for (i = 0; i < 8; i++) {
		// Even term
		if(i%2 == 0) {
			depth += Math.sin(j/Math.pow(2, i))/(8-i);
			depth += Math.cos(k/(Math.pow(2, i)))/(8-i);
		}
		// Odd term
		else {
			depth += Math.cos(j/(Math.pow(2, i)))/(8-i);
			depth += Math.sin(k/(Math.pow(2, i)))/(8-i);
		}
	}
	depth -= 2;
	depth *= -47;
	depth -= Math.random()*20;
	depth -= 20;
	depth = Math.floor(depth);
	return depth;
}

function isInBounds(j, k) {
	return (j >= 0 && j < c.WORLD_WIDTH && k >= 0 && k < c.WORLD_HEIGHT);
}

// Down here is the end