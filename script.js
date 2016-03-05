var weatherAppId = "4a5af5d721c4e3ea83918ef2bde1f0d6";
var flickrAppId = "3c54d39ebf255af221bd20390d3cda1b";
var api = {
	dailyWeather: "http://api.openweathermap.org/data/2.5/weather?", 
	fiveDayWeather: "http://api.openweathermap.org/data/2.5/forecast?",
	flickr: "https://api.flickr.com/services/rest/?method=flickr.photos.search"
};
var temp;
var loc;
var weatherDescription;
var humdity;
var wind;
var temperatureValue;
var currentTemp;

function updateByZip(zip) {

		// Creates two Urls to handle Open Weather's API request for both daily and forecast weather data. 
		var url1 = api.dailyWeather + "zip=" + zip + ",us&type=accurate&APPID=" + weatherAppId; 
  	var url2 = api.fiveDayWeather + "zip=" + zip + ",us&type=accurate&APPID=" + weatherAppId;

  	// Store the 'zip' value to use with getLocation().
  	window.localStorage.setItem("zip", zip);
  	sendUrls(url1, url2);
}

function updateByGeo(lat, lon) {

	// Creates two urls based on the user's location.
  var url1 = api.dailyWeather + "lat=" + lat + "&lon=" + lon + "&APPID=" + weatherAppId;
  var url2 = api.fiveDayWeather + "lat=" + lat + "&lon=" + lon + "&APPID=" + weatherAppId;
  sendUrls(url1, url2);
}

function sendUrls(url1, url2) {

	// If the user is on the page with the "forecast-info" element, we want to send the second url.
	if (document.getElementById("forecast-info")) {
		return sendRequest(url2, "forecast");
	} else {
		return sendRequest(url1, "dailyWeather");
	}
}

function findLocation() {

	// Checks which page user is on to pull the value from the correct search box. 
	var onIndex = document.getElementById("search-text-index");
	var onForecast = document.getElementById("search-text-forecast");
	var input;
	if (onIndex) {
		input = onIndex.value;
    	updateByZip(input);
    }
    if (onForecast) {
		input = onForecast.value;
    	updateByZip(input);
    }
}

function sendRequest(url, requestType) {
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {

		// If the request is for today's weather, send to function requestDaily.
		if (requestType === "dailyWeather") { 
			return requestDaily(xhr);
		}

		// If the request is for a five-day forecast, send to requestForecast.
		if (requestType === "forecast") {
			return requestForecast(xhr);
		}
	};
	xhr.open("GET", url, true);
	xhr.send();
}

function requestDaily(obj) {
	if (obj.readyState === 4 && obj.status === 200) { 
		var response = JSON.parse(obj.responseText);

		// Creates a 'weather' object to hold our data from the response.
		var weather = {};
		weather.temp = response.main.temp;
		weather.loc = response.name;
		weather.weatherDescription = capitalize(response.weather[0].description);
		weather.humidity = response.main.humidity;
		weather.wind = Math.round(response.wind.speed);

		// Uses the data in the object to update the weather information on the page. 
		update(weather);

		// Add event listeners to the page to handle temperature conversion and search.
		addEvent("fahrenheit", "click", changeTempScale, "f");
		addEvent("celsius", "click", changeTempScale, "c");
		addEvent("search-text-index", "keypress", keypress);
		addEvent("search-button-index", "click", findLocation);
	}
}

function requestForecast(obj) {
	if (obj.readyState === 4 && obj.status === 200) { 
		var response = JSON.parse(obj.responseText);

		// The two things we want are the city name and the list of weather data.
		var city = response.city.name;
		var list = response.list;

		// We want to find data connected to a specific time, 15:00.
		var findTimes = function(item) {
    		var x = item.dt_txt.split(" ");
   			if (x[1] === "15:00:00") {
        		return true;
    		}
		};
		var info = list.filter(findTimes);

		// We want to map the filtered list into an array of objects. This makes it easier to read and access.
		var makeObj = function(item) {
			var day = {};
			info.forEach(function(){
				day.temp = item.main.temp;
        day.humidity = item.main.humidity;
        day.wind = item.wind.speed;
        day.date = item.dt_txt;
			});
			return day;
		};

		var forecast = info.map(makeObj);

		// We print out the name of the city and update the weather information.
		document.getElementById("location").innerHTML = city;
		updateForecast(forecast);
		addEvent("search-text-forecast", "keypress", keypress);
		addEvent("search-button-forecast", "click", findLocation);
		addEvent("name", "click", clearSession);
	}
}

function updateForecast(obj) {

	// Creates two tables, the first with labels for the forecast and the second with the weather data.
	tableLabels();

	// Our weather array has multiple objects within it and we access/format it with a loop.
	for (var i = 4; i >= 0; i--) {
		var date = obj[i].date;
		var dateArray = date.split(" ");
		var monthDay = rewriteDate(dateArray[0]);
		var fahrenheit = toFahrenheit(obj[i].temp);
		var celsius = toCelsius(fahrenheit);
		var temp = fahrenheit + " &deg;F" + " / " + celsius + " &deg;C";
		var humidity = obj[i].humidity + " %";
		var wind = Math.round(obj[i].wind) + " mph";

		// We go from one object in the array to the next by incrementing "i".
		createTable(i, "forecast-table", monthDay, temp, humidity, wind, 5);
	}
}

function tableLabels() {
	var table = document.getElementById("forecast-table-names");

	// This particular table doesn't have multiple rows, so we i = 0. 
	createTable(0, "forecast-table-names", "Date", "Temp", "Humidity", "Wind", 1);
}

function createTable(i, tableName, label1, label2, label3, label4, length) {
	var table = document.getElementById(tableName);

	// If the table rows are less than the length provided, we add a row to the table.
	if (table.rows.length < length) {
	var row = table.insertRow(0);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	var cell3 = row.insertCell(2);
	var cell4 = row.insertCell(3);
	cell1.innerHTML = label1;
	cell2.innerHTML = label2;
	cell3.innerHTML = label3;
	cell4.innerHTML = label4;
	} else {

		// If the table rows are >= the length provided, we update the rows. 
		updateTable(i, label1, label2, label3, label4);
	}
}

function updateTable(i, label1, label2, label3, label4) {

	// Updates the table rows based on the row number given. 
	var table = document.getElementById("forecast-table");
	table.rows[i].cells[0].innerHTML = label1;
	table.rows[i].cells[1].innerHTML = label2;
	table.rows[i].cells[2].innerHTML = label3;
	table.rows[i].cells[3].innerHTML = label4;
}

function clearSession() {
	window.localStorage.clear();
}

function keypress(e) {
	var key = e.which || e.keyCode;

		// This checks if the key that is pressed is "Enter".
    if (key === 13) {
    	findLocation();
    }
}

function toCelsius(num) {

	// This finds the Celsius temp based on the Fahrenheit temp.
	return Math.round((num-32) * 5/9);
}

function toFahrenheit(num) {

	// This finds the Fahrenheit temp based on the Kelvin temp
	return Math.round((num * 9/5) - 459.67);
}

function changeTempScale(param) {

	// Converts the temperature and change the style of selected temperature with changeColor().
	if (arguments[0] === "f") {
		changeColor("f");
		return temp.innerHTML = currentTemp + " &deg;F";
	}
	if (arguments[0] === "c") {
		changeColor("c");
		return temp.innerHTML = toCelsius(currentTemp) + " &deg;C";
	}
	return temp.innerHTML = "Sorry, we couldn't get the temperature."
}

function changeColor(indicator) {

	/** 
	 * This handles the color and font-weight formatting for the selected temperature scale.
	 *	If the user selects "fahrenheit", then 'F' is changed to white and bold.
	 *	'C' would then be changed to black and would have a normal weight. 
	 */
	var fahrenheit = document.getElementById("fahrenheit");
	var celsius = document.getElementById("celsius");
	if (indicator === "f") {
		fahrenheit.style.color = "#fff";
		fahrenheit.style.fontWeight = "bold";
		celsius.style.color = "#000";
		celsius.style.fontWeight = "normal";
	}
	if (indicator === "c") {
		celsius.style.color = "#fff";
		celsius.style.fontWeight = "bold";
		fahrenheit.style.color = "#000";
		fahrenheit.style.fontWeight = "normal";
	}
}

function rewriteDate(string) {

	// Date given from data is formatted like "03-03-2016". We change this to be "03/03".
   var date = string.split("-");
   return date[1] + "/" + date[2];
}

function capitalize(string) {

	// Takes a string, splits it into an array, capitalizes the first letter, puts it back with rest of the word.
	var array = string.split("");
	var firstLetter = array.slice(0,1).join("").toUpperCase();
	return firstLetter + array.slice(1).join("");
}

function addEvent(element, evnt, funct, param) {

	/** 
	 * This checks to see if the addEvent function contacts an argument at the fourth position.
	 * If it does, return the function with the param that is given.
	 */
	if (arguments[3]) {
		document.getElementById(element).addEventListener(evnt, function() {
			return funct(param);
		}, false);
	} else {

		// If there is no fourth arguement given, return the function. 
		document.getElementById(element).addEventListener(evnt, function(x) {
			return funct(x);
		}, false);
	}
}

function getBgPic() {

	// Creates url to get pictures for the background. The theme is "Big Sur".
	var url = api.flickr + "&api_key=" + flickrAppId + "&tags=big_sur&extras=url_l&format=json";
	updatePic(url);
}

function updatePic(url) {

	// Creates a script with the response. 
	var picScript = document.createElement('script');
	picScript.src = url;
	document.getElementsByTagName('head')[0].appendChild(picScript);
}

function random(obj) {
	var length = obj.length-1;
	return Math.floor(Math.random() * length) + 1;
}

function jsonFlickrApi(data){

	/** 
	 * Uses random() to get a random url of a picture from our data, puts together 
	 * the url for the image, and loads it to the page. 
	 */
	var randomNum = random(data.photos.photo);
	var photo = data.photos.photo[randomNum];
	var photoUrl = "https://farm" + photo.farm + ".staticflickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + ".jpg";
	document.querySelector("body").style.backgroundImage = "url(" + photoUrl + ")";
}

function getWeatherInfo() {

	// Checks if user is on the forecast page.
	if (document.getElementById("forecast-info")) {
		getLocation();
	} else {
		checkGeoLocation();
	}
}

function getLocation(){

	// If localStorage("zip") is not null, we want to use that zip to grab the forecast.
	if (window.localStorage.getItem("zip") !== null) {
		updateByZip(window.localStorage.getItem("zip"));
	} else {
		checkGeoLocation();
	}
}

function checkGeoLocation() {

	/**
	 * Checks if user's browser has navigator.geolocation to pull his/her latitude and longitude.
	 * Gives an option for the user to manually type in their zip.
	 */
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showPosition, locationError);
	} else {
		var zip = window.prompt("Oh no! We couldn't find your location. What's your zip code?");
		updateByZip(zip);
	}
}

function showPosition(position) {
	updateByGeo(position.coords.latitude, position.coords.longitude);
}

function locationError(error){

	// This sets an error if navigator.geolocation can't get the user's latitude and longitude.
  switch(error.code) {
    case error.TIMEOUT:
      showError("A timeout occured! Please try again!");
      break;
    case error.POSITION_UNAVAILABLE:
      showError('We can\'t detect your location. Sorry!');
      break;
    case error.PERMISSION_DENIED:
      showError('Please allow geolocation access for this to work.');
      break;
    case error.UNKNOWN_ERROR:
      showError('An unknown error occured!');
      break;
    }
}

function showError(message) {

	// Prints the error message. 
	temp.innerHTML = message;
}

function checkElementPrint(element, obj, val) {

	// This checks if the elements listed are present. If so, print the listed information to the app. 
	if (element === temp) {

		// If the element is temp, we want to call a function to handle what should be printed.
		return val(obj);
	}
	if (element) {
		return element.innerHTML = val;
	}
}

function printTemp(weather){

	// This prints the temperature and also stores it into a separate variable to use elsewhere.
	temperatureValue = Math.round(toFahrenheit(weather.temp));
	temp.innerHTML = temperatureValue + " &deg;F";
	currentTemp = temperatureValue;
}

function update(weather) {
	checkElementPrint(temp, weather, printTemp);
	checkElementPrint(loc, weather, weather.loc);
	checkElementPrint(weatherDescription, weather, weather.weatherDescription);
	checkElementPrint(humidity, weather, "Humidity: " + weather.humidity + "%");
	checkElementPrint(wind, weather, "Wind: " + weather.wind + " mph");
}

window.onload = function() {
	temp = document.getElementById("temperature");
	loc = document.getElementById("location");
	weatherDescription = document.getElementById("weather_description");
	humidity = document.getElementById("humidity");
	wind = document.getElementById("wind");
	getBgPic();
	getWeatherInfo();
}