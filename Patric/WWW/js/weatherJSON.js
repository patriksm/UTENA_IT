var myBlock = document.getElementById("weather");

var requestURL = `http://api.weatherapi.com/v1/current.json?key=279113872acc4f48a39115257240403&q=Utena&aqi=yes
`;

var request = new XMLHttpRequest();

request.open('GET', requestURL);
request.responseType = 'json';

request.onload = () => {
    if (request.status === 200 && request.readyState === request.DONE) {
        var myWeather = request.response;
        displayWeather(myWeather);
    }
}

request.send();

function displayWeather(jsonOBJ) {
    var myH1 = document.createElement('H1');
    // myH1.textContent = "Temperature in " + jsonOBJ['location'].name + " is " + jsonOBJ['current'].temp_c + String.fromCharCode(176) + "C";
    myH1.textContent = `Temperature in ${jsonOBJ['location'].name} is ${jsonOBJ['current'].temp_c} ${String.fromCharCode(176)}C`; //nicer format
    myBlock.appendChild(myH1)
}