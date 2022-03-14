import { getCountryISOA3Code } from "./helper.js";
import { getCases, getVaccinationOverview, getTotalCasesPerCountryLast2Weeks } from "./data.js";

const mapboxAccessTokenLeaflet = "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";
const parseTime = d3.timeParse("%Y-%m-%d");

const map_width = 900;
const map_height = 400;

const chart_width = 900;
const chart_height = 400;

const margin = { top: 20, right: 20, bottom: 30, left: 60 };

const map_minzoom = 1;
const map_maxzoom = 10;

let iso_numeric_codes;
let owid_covid_data;
let geoData;


function drawMap(data, htmlID) {

    // Define map projection
    let projection = d3.geoEquirectangular()
        .center([0, 0]) // Center the projection at [0, 0]
        .scale(map_width / (2 * Math.PI)) // Scale to fit the entire width of the map
        .translate([map_width / 2, map_height / 2]); // Translate to center the map in view

    // Define map path
    let path = d3.geoPath()
        .projection(projection);

    // Define map zoom
    let zoom = d3.zoom()
        .scaleExtent([map_minzoom, map_maxzoom])
        .on("zoom", doZoom);

    // doZoom
    function doZoom(e) {
        mapFeatures.attr("transform", e.transform);
    }

    // Define dispatcher
    let map_dispatcher = d3.dispatch('unselectAll', 'select');

    map_dispatcher.on('unselectAll', function () {
        d3.selectAll(".map-country").classed("map-country-selected", false);
    });

    // Define map
    let map = d3.select("#" + htmlID)
        .append("svg")
        .attr('class', 'map')
        .attr("width", map_width)
        .attr("height", map_height)
        .on("click", function (d) {
            if (d3.select(event.target).classed('map-country')) {
                return;
            } else {
                map_dispatcher.call('unselectAll');
                updateLineGraph(getCases(owid_covid_data, "OWID_WRL", 'date', 'new_cases_smoothed'), 'daily-linechart');
                updateLineGraph(getCases(owid_covid_data, "OWID_WRL", 'date', 'total_cases'), "cumalative-barchart");
            }
        })
        .call(zoom);

    let mapFeatures = map.append("g")

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
                    let country_ISO_A3 = getCountryISOA3Code(d3.select(this).attr('id'), iso_numeric_codes)
                    updateLineGraph(getCases(owid_covid_data, country_ISO_A3, 'date', 'new_cases_smoothed'), 'daily-linechart');
                    updateLineGraph(getCases(owid_covid_data, country_ISO_A3, 'date', 'total_cases'), "cumalative-barchart");
                    updateBarChart(getVaccinationOverview(owid_covid_data, country_ISO_A3), "overview-barchart");
                })
        );


    let circle_data = getTotalCasesPerCountryLast2Weeks(owid_covid_data);
    console.log(circle_data);

    // Add a scale for bubble size
    var circle_size = d3.scalePow()
        .domain(d3.extent(circle_data, d => { return d.data }))  // What's in the data
        .range([4, 500])  // Size in pixel

    // Draw the map bubbles
    mapFeatures.selectAll("circle")
        .attr("class", "map-bubble")
        .data(data.features)
        .join(
            enter => enter.append("circle")
                .attr("class", "map-bubble")
                .attr("transform", function (d) {
                    return "translate(" + path.centroid(d) + ")";
                })
                .attr("r", function (d) {
                    try {
                        let country_ISO_A3 = getCountryISOA3Code(d.id, iso_numeric_codes)
                        // get .data from circle_data based on iso_a3
                        let country_data = circle_data.filter(function (d) {
                            return d.iso_a3 == country_ISO_A3;
                        })[0].data;
                        console.log(circle_size(country_data));
                        return circle_size(country_data);
                    } catch (error) {
                        return 0
                    }
                })
                .attr('pointer-events', 'none')
        );


}

function drawLineChart(flatData, htmlID) {

    // flatData = flatData.slice(1, 700);

    let height = chart_height - margin.top - margin.bottom;
    let width = chart_width - margin.left - margin.right;

    let svg = d3.select("#" + htmlID)
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    updateLineGraph(flatData, htmlID);
}

function updateLineGraph(flatData, htmlID) {

    let xMax = chart_width - margin.left - margin.right;
    let yMax = chart_height - margin.top - margin.bottom;

    let svg = d3.select("#" + htmlID).selectAll("svg");

    svg.selectAll(".axis").remove();
    // svg.selectAll(".line").remove();

    // X Axis
    let x = d3.scaleTime()
        .domain(d3.extent(flatData, d => { return parseTime(d.x_axis) }))
        .range([margin.left, xMax]);
    // bottom
    svg.append("g")
        .attr("transform", "translate(0, " + yMax + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%b %y"))
        );

    let y = d3.scaleLinear()
        .domain(d3.extent(flatData, d => { return d.y_axis }))
        .range([yMax, 0]);
    // left y axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y));

    // Add the line
    // parse in an array of objects with x_axis and y_axis values
    let lines = svg.selectAll(".line")
        .data([flatData]);

    lines.join(
        enter => enter.append("path")
            .attr("class", "line")
            .merge(lines)
            .transition()
            .duration(2000)
            .attr("d", d3.area()
                .x(function (d) { return x(parseTime(d.x_axis)); })
                .y1(function (d) { return y(d.y_axis); })
                .y0(y(0))
            ),
        update => update,
        exit => exit
            .transition()
            .duration(2000)
            .attr("opacity", 0)
            .remove()
    );
}

function drawBarChart(flatData, htmlID) {

    let height = chart_height - margin.top - margin.bottom;
    let width = chart_width - margin.left - margin.right;

    let svg = d3.select("#" + htmlID)
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height)

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    updateBarChart(flatData, htmlID);
}

function updateBarChart(flatData, htmlID) {

    let height = chart_height - margin.top - margin.bottom;
    let width = chart_width - margin.left - margin.right;

    let xMax = chart_width - margin.left - margin.right;
    let yMax = chart_height - margin.top - margin.bottom;

    let svg = d3.select("#" + htmlID).selectAll("svg");

    svg.selectAll(".axis").remove();

    // X Axis
    let x = d3.scaleBand()
        .domain(flatData.map(d => d.name))
        .range([margin.left, xMax])
        .padding(0.5);
    // bottom
    svg.append("g")
        .attr("transform", "translate(0, " + yMax + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x));

    let y = d3.scaleLinear()
        .domain(d3.extent(flatData, d => { return d.value }))
        .range([yMax, 0]);
    // left y axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y));

    // Add the bars

    let bars = svg.selectAll(".bar")
        .data(flatData);

    bars.join(
        enter => enter.append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition()
            .duration(2000)
            .attr("x", d => x(d.name))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => yMax - y(d.value))
            .attr("fill", "steelblue"),
        update => update
            .transition()
            .duration(2000)
            .attr("x", d => x(d.name))
            .attr("y", d => y(d.value))
            .attr("width", x.bandwidth())
            .attr("height", d => yMax - y(d.value))
            .attr("fill", "steelblue"),
        exit => exit
            .transition()
            .duration(2000)
            .attr("height", 0)
            .remove()
    );

}

window.addEventListener('load', function () {
    // fetch files and return both as seperate data
    // topojson file from https://unpkg.com/world-atlas@2.0.2/countries-110m.json
    // owid_covid_data from data/covid-19-data/public/data/owid-covid-data.csv
    Promise.all([
        d3.json("https://unpkg.com/world-atlas@2.0.2/countries-110m.json"),
        d3.json("data/iso_numeric_codes.json"),
        d3.json("data/owid-covid-data.json")
    ])
        .then(function ([topojson_data, iso_numeric, covid_data]) {
            iso_numeric_codes = iso_numeric;
            owid_covid_data = covid_data;
            geoData = topojson.feature(topojson_data, topojson_data.objects.countries);
            drawMap(geoData, "map");
            drawLineChart(getCases(owid_covid_data, "OWID_WRL", 'date', 'new_cases_smoothed'), "daily-linechart");
            drawLineChart(getCases(owid_covid_data, "OWID_WRL", 'date', 'total_cases'), "cumalative-barchart");
            drawBarChart(getVaccinationOverview(owid_covid_data, "OWID_WRL"), "overview-barchart");
        });
})