const API_key = 'e0cf05bb3121e683735fffbd36087cec';

const giveIconUrl = (icon) =>  `http://openweathermap.org/img/wn/${icon}@2x.png`;

const DAYS  = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function calculateDayWise(forecastList){
    
    // console.log(forecastList);
    
    let dayWiseMap = new Map();

    for(let forecast of forecastList){
        let {dt_txt} = forecast;
        let date = dt_txt.split(" ")[0];
        let dayNo = new Date(date).getDay();
        const day = DAYS[dayNo];
        
        let {weather:[{icon}], main: {temp_min, temp_max}} = forecast;
        if(dayWiseMap.has(day)){
            let prevArray = dayWiseMap.get(day);
            prevArray.push([icon, temp_min, temp_max]);
        } else {
             dayWiseMap.set(day, [[icon, temp_min, temp_max]]);
        }
    }

    // store only one icon, temp_min, temp_max with every key
    for(let [key, value] of dayWiseMap){
        
        const icon = value[0][0];

        let minTemp = 200, maxTemp = -1;

        for(let arr of value){
            minTemp = Math.min(minTemp, arr[1]);
            maxTemp = Math.max(maxTemp, arr[2]);
        }

        dayWiseMap.set(key, [icon, minTemp, maxTemp]);
    }

    return  dayWiseMap;
}

function load5DaysForecast({list: forecastList}){

    const  dayWise = calculateDayWise(forecastList);
    const fiveDaysContainer = document.querySelector('.five-days-forecast');

    let htmlContent = fiveDaysContainer.innerHTML;

    let index = 0;
    for(let [day, values] of dayWise){
         
        if(index < 5){
            let today = day;
            if(index === 0){
                //today
                today = 'today';
            } 

            htmlContent += `
            <section class="five-days-day">
                <h3 class="the-day">${today}</h3>
                <img class="weather-icon" src="${giveIconUrl(values[0])}" alt="weather-icon">
                <span class="min-temp">${formatTemp(values[1])}</span>
                <span class="max-temp">${formatTemp(values[2])}</span>
            </section>
            `
        }
        
        index++;
    }

    fiveDaysContainer.innerHTML = htmlContent;
    console.log(dayWise);
}

function loadHourlyForecast({list}){
    const listOfFirst12 = list.slice(0, 12);

    const hourlyContainer = document.querySelector('.hourly-forecast');
    let newInnerHTML = hourlyContainer.innerHTML;
    // hourlyContainer.innerHTML
    listOfFirst12.forEach(elem => {
        const {main:{temp}, weather:[{description, icon}], dt_txt} = elem;
        newInnerHTML += `<section class="hourly-forecast-item">
        <h3 class="hourly-time">${dt_txt.split(" ")[1]}</h3>
        <img class="hourly-weather-icon" src="${giveIconUrl(icon)}" alt="${description}">
        <h3 class="hourly-temp">${formatTemp(temp)}</h3>
        </section>`;
    });

    hourlyContainer.innerHTML = newInnerHTML;
}

function loadFeelsLikeAndHumidity({main:{feels_like, humidity}}){
    const feelsLikeElem = document.querySelector('.feels-like > span');
    const humidityElem = document.querySelector('.humidity > span');

    feelsLikeElem.textContent = formatTemp(feels_like);
    humidityElem.textContent = `${humidity} %`;
}

function loadCurrentWeather(currentWeatherJSON){

    let {main:{temp, temp_min, temp_max}, weather: [{description}]} = currentWeatherJSON;
    const currentWeather = document.querySelector('.weather-now');
    const temperature = currentWeather.querySelector('.temperature');
    const desc = currentWeather.querySelector('.description');
    const high = currentWeather.querySelector('.high-temp-value');
    const low = currentWeather.querySelector('.low-temp-value');

    temperature.textContent = formatTemp(temp);
    desc.textContent = description.toUpperCase();
    high.textContent = formatTemp(temp_min);
    low.textContent = formatTemp(temp_max);

    //loading feels_like and Humidity
    loadFeelsLikeAndHumidity(currentWeatherJSON);

}

// 36 => 36° C
const formatTemp = (temp) => `${temp}° C`;

//get data once when DOM content has been loaded
document.addEventListener('DOMContentLoaded', async ()=>{
    
    const city = document.querySelector('.city').textContent;
    const unitOfMeasurement = 'metric'; //metric is used for celsius
    
    //current Weather forecast
    const currentWeatherAsJSONString = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_key}&units=${unitOfMeasurement}`);
    const currentWeatherJSON = await currentWeatherAsJSONString.json();  

    loadCurrentWeather(await currentWeatherJSON);

    //hourly forecast
    const hourlyForecastJSONString = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_key}&units=${unitOfMeasurement}`)
    const hourlyForecastJSON = await hourlyForecastJSONString.json();

    loadHourlyForecast(await hourlyForecastJSON);
    load5DaysForecast(await hourlyForecastJSON);
});