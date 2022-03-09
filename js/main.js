const mapboxAccessTokenLeaflet = "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

// const map_width = 800;
// const map_height = 400;

const map_width = 1000;
const map_height = 500;

const map_minzoom = 1;
const map_maxzoom = 10;

var iso_numeric_codes;
var owid_covid_data;

// helper function to return the ISO A3 code of a country based on it's ISO Numeric code
// Mainly used to link the map data to the covid data using an intermediate iso data
function getCountryISOA3Code(country_iso_number){
    return iso_numeric_codes.find(function(data){
        return data.ISO_Numeric == country_iso_number;
    }).ISO_A3;
}

function drawMap(data) {

    // Define map projection
    var projection = d3.geoEquirectangular()
        .center([0, 0]) // Center the projection at [0, 0]
        .scale(map_width / (2 * Math.PI)) // Scale to fit the entire width of the map
        .translate([map_width / 2, map_height / 2]); // Translate to center the map in view

    // Define map path
    var path = d3.geoPath()
        .projection(projection);

    // Define map zoom
    var zoom = d3.zoom()
        .scaleExtent([map_minzoom, map_maxzoom])
    .on("zoom", doZoom);

    // doZoom
    function doZoom(e) {
        mapFeatures.attr("transform", e.transform);
    }

    // Define dispatcher
    var map_dispatcher = d3.dispatch('unselectAll', 'select');

    map_dispatcher.on('unselectAll', function () {
        d3.selectAll(".map-country").classed("map-country-selected", false);
    });

    // Define map
    var map = d3.select("#map")
        .append("svg")
        .attr('class', 'map')
        .attr("width", map_width)
        .attr("height", map_height)
        .on("click", function (d) {
            if (d3.select(event.target).classed('map-country')) {
                return;
            } else {
                map_dispatcher.call('unselectAll');
            }
        })
        .call(zoom);

    var mapFeatures = map.append("g")

    // Draw the map and group each country based on the passed geojson data
    mapFeatures.selectAll("path")
        .data(data.features)
        .join(
            enter => enter.append("path")
                .attr("d", path)
                .attr("id", d => d.id)
                .attr("class", "map-country")
                .on("mouseover", function (d, country) {
                    // append text to the map
                    d3.select(this).append("title")
                        .text(country.properties.name);
                })
                .on("mouseout", function (d) {
                    // remove text from the map
                    d3.select(this).select("title").remove();
                })
                .on("click", function () {
                    d3.selectAll(".map-country").classed("map-country-selected", false);
                    d3.select(this).classed("map-country-selected", true);
                    console.log(getCountryISOA3Code(d3.select(this).attr('id')));
                })
        );

}

window.addEventListener('load', function () {
    // fetch files and return both as seperate data
    // topojson file from https://unpkg.com/world-atlas@2.0.2/countries-110m.json
    // owid_covid_data from data/covid-19-data/public/data/owid-covid-data.csv
    Promise.all([
        d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json"),
        d3.json("data/iso_numeric_codes.json"),
        // d3.csv("data/covid-19-data/public/data/owid-covid-data.csv")
    ])
        .then(function ([topojson_data, iso_numeric, covid_data]) {
            // console.log(topojson_data);
            // console.log(covid_data);
            iso_numeric_codes = iso_numeric;
            owid_covid_data = covid_data;
            var geoData = topojson.feature(topojson_data, topojson_data.objects.countries);
            drawMap(geoData);
        });
})