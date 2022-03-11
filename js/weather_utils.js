"use strict";

$(document).ready(function () {
    let long = '-98.4916';
    let lat = '29.4252';

    getWeather(long, lat);

    mapboxgl.accessToken = getAccessToken();
    let map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        zoom: 7,
        center: [long, lat]
    });

    let search = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false
    });


    map.addControl(search);

    getMarker([long, lat]);
    map.on("click", () => {
        $(".mapboxgl-marker").remove();
    });

    map.on('load', () => {
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;

        map.addLayer(
            {
                'id': 'add-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': '#aaa',

                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 0.6
                }
            },
            labelLayerId
        );

        search.on('result', (event) => {
            getWeather(event.result.geometry.coordinates[0], event.result.geometry.coordinates[1]);
            getMarker(event.result.geometry.coordinates);
            $("#place").html(event.result.place_name)
        });
        map.on('dblclick', (event) => {
            getMarker(event.lngLat);
            getWeather(event.lngLat.lng, event.lngLat.lat);
            reverseGeocode(event.lngLat, mapboxgl.accessToken).then(function (result) {
                for (let i = 0; i < result.features.length; i++) {
                    if (result.features[i].id.includes('place')) {
                        $("#place").html(result.features[i].place_name);
                    }
                }
            });
        });
    });

    function getWeather(long, lat) {
        $.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&units=imperial&appid=${WEATHER_KEY}`).done(function (weatherObj) {
            $("#fiveDay > *").remove();
            let date = '';
            let high = weatherObj.list[0].main.temp_max;
            let low = weatherObj.list[0].main.temp_min;
            for (let i = 0; i < weatherObj.cnt; i += 8) {
                date = weatherObj.list[i].dt_txt;
                high = parseInt(weatherObj.list[i].main.temp_max);
                low = parseInt(weatherObj.list[i].main.temp_min);
                let card = $("<div id='card' class='card' style='width: 19%'>" +
                    "<div class='card-header font-weight-bolder text-center'>" +
                    date.substring(0, 10) +
                    "</div>" +
                    "<div class='card-body text-center'>" +
                    high + String.fromCharCode(176) + "F" + " / " + low + String.fromCharCode(176) + "F" +
                    "<br>" +
                    "<img src='https://openweathermap.org/img/w/" + weatherObj.list[i].weather[0].icon + ".png'>" +
                    "<hr>" +
                    "<p>Description: <strong class=''> " + weatherObj.list[i].weather[0].description + "</strong></p> " +
                    "<p>Humidity: <strong class=''> " + weatherObj.list[i].main.humidity + "</strong></p> " +
                    "<p>Wind: <strong class=''> " + weatherObj.list[i].wind.speed + "</strong></p> " +
                    "<p>Pressure: <strong class=''> " + weatherObj.list[i].main.pressure + "</strong></p> " +
                    "</div>" +
                    "</div>");
                $("#fiveDay").append(card);
            }
        });
    }

    function getMarker(result) {
        $(".mapboxgl-marker").remove();
        var marker = new mapboxgl.Marker({
            draggable: true
        })
            .setLngLat(result)
            .addTo(map);
        marker.on("dragend", (e) => {
            long = e.target._lngLat.lng;
            lat = e.target._lngLat.lat;
            getWeather(long, lat);
            reverseGeocode({lng: long, lat: lat}, mapboxgl.accessToken).then((result) => {
                for (let i = 0; i < result.features.length; i++) {
                    if (result.features[i].id.includes('place')) {
                        $("#place").html(result.features[i].place_name);
                    }
                }
            });
        })
    }

    // $("#submit").click(function () {
    //     geocode($("#search").val(), mapboxgl.accessToken).then(function (result) {
    //         map.setCenter(result);
    //         map.setZoom(10);
    //         getMarker(result);
    //         long = result[0];
    //         lat = result[1];
    //         getWeather(long, lat);
    //     })
    // });
    //
    // $("#search").keypress(function (keyCode) {
    //     if (keyCode.charCode === 13) {
    //         geocode($(this).val(), mapboxgl.accessToken).then(function (result) {
    //             map.setCenter(result);
    //             map.setZoom(10);
    //             getMarker(result);
    //             long = result[0];
    //             lat = result[1];
    //             getWeather(long, lat);
    //         });
    //     }
    //
    // });
});

