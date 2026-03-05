var myBlock = document.getElementById("weather");

var requestURL = `http://api.weatherapi.com/v1/current.xml?key=279113872acc4f48a39115257240403&q=Utena&aqi=yes`;

var request = new XMLHttpRequest();

request.open('GET', requestURL);
request.responseType = 'document';
request.overrideMimeType = 'text/xml';

request.onload = () => {
    if (request.status === 200 && request.readyState === request.DONE) {
        var myWeather = request.response;
        displayWeather(myWeather);
        displayWindSpeed(myWeather);
    }
}

request.send();

function displayWeather(xmlOBJ) {
    var myH1 = document.createElement('H1');
    myH1.textContent = "Temperature in " + xmlOBJ.getElementsByTagName("name")[0].childNodes[0].nodeValue + " is " +
     xmlOBJ.getElementsByTagName("temp_c")[0].childNodes[0].nodeValue + " C";
    myBlock.appendChild(myH1)
}

function displayWindSpeed(xmlOBJ) {
   var myH2 = document.createElement('H2');
   myH2.textContent = "Wind speed in " + xmlOBJ.getElementsByTagName("name")[0].childNodes[0].nodeValue +
    " is " + xmlOBJ.getElementsByTagName("wind_kph")[0].childNodes[0].nodeValue + " kph";
    myBlock.appendChild(myH2)
}