import { getCountryISOA3Code } from "./helper.js";
import { getCases, getVaccinationOverview, getTotalCasesPerCountryLast2Weeks, getDataBetweenDates, getNewCasesForCountries, getTotalCasesForCountries } from "./data.js";

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
                updateAreaChart(getCases(owid_covid_data, "OWID_WRL", 'date', 'new_cases_smoothed'), 'daily-linechart', "OWID_WRL");
                updateAreaChart(getCases(owid_covid_data, "OWID_WRL", 'date', 'total_cases'), "cumalative-barchart", "OWID_WRL");
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
                    updateAreaChart(getCases(owid_covid_data, country_ISO_A3, 'date', 'new_cases_smoothed'), 'daily-linechart', country_ISO_A3);
                    updateAreaChart(getCases(owid_covid_data, country_ISO_A3, 'date', 'total_cases'), "cumalative-barchart", country_ISO_A3);
                    updateBarChart(getVaccinationOverview(owid_covid_data, country_ISO_A3), "overview-barchart");
                })
        );


    let circle_data = getTotalCasesPerCountryLast2Weeks(owid_covid_data);

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
                        return circle_size(country_data);
                    } catch (error) {
                        return 0
                    }
                })
                .attr('pointer-events', 'none')
        );


}

function drawAreaChart(flatData, htmlID, country) {

    // flatData = flatData.slice(1, 700);

    let height = chart_height - margin.top - margin.bottom;
    let width = chart_width - margin.left - margin.right;

    let svg = d3.select("#" + htmlID)
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height);

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    updateAreaChart(flatData, htmlID, country);
}

function updateAreaChart(flatData, htmlID, country) {

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
    let xAxis = svg.append("g")
        .attr("transform", "translate(0, " + yMax + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%b %y"))
        );

    let y = d3.scaleLinear()
        .domain([0, d3.max(flatData, d => { return d.y_axis })])
        .range([yMax, 0]);
    // left y axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y));

    // Add a clipPath: everything out of this area won't be drawn.
    let clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", xMax)
        .attr("height", yMax)
        .attr("x", 50)
        .attr("y", 0);

    // Add brushing
    let brush = d3.brushX()                   // Add the brush feature using the d3.brush function
        .extent([[margin.left, 0], [xMax, yMax]])  // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function


    // Add the line
    // parse in an array of objects with x_axis and y_axis values
    let lines = svg.selectAll(".line")
        .data([flatData])
        .attr("clip-path", "url(#clip)");

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

    svg.on("dblclick", function () {
        svg.selectAll(".brush").remove();
        // svg.selectAll(".line").remove();
        svg.selectAll(".axis").remove();
        updateAreaChart(flatData, htmlID);
    });

    // Add the brushing
    svg.append("g")
        .attr("class", "brush")
        .call(brush);

    function updateChart(event) {

        // What are the selected boundaries?
        let extent = event.selection

        let startDate = x.invert(extent[0]);
        let endDate = x.invert(extent[1]);

        // If no selection, back to initial coordinate. Otherwise, update X axis domain
        if (!extent) {
            x.domain(d3.extent(flatData, d => { return parseTime(d.x_axis) }))
        } else {
            x.domain([startDate, endDate]);
            lines.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
        }

        // get new data based on date range so write function to extract data based on date range
        // draw new data
        // update other charts

        // Update axis and line position
        xAxis.transition().duration(1000).call(d3.axisBottom(x))

        if (htmlID == "cumalative-barchart") {
            let totalFlatData = getCases(owid_covid_data, country, 'date', 'new_cases_smoothed');
            let newFlatData = getDataBetweenDates(totalFlatData, startDate, endDate);
            updateAreaChart(newFlatData, "daily-linechart", country);
        }

        if (htmlID == "daily-linechart") {

            let totalFlatData = getCases(owid_covid_data, country, 'date', 'total_cases');
            let newFlatData = getDataBetweenDates(totalFlatData, startDate, endDate);
            updateAreaChart(newFlatData, "cumalative-barchart", country);
        }


        lines.join(
            enter => enter.select(".line")
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
        .domain([0, d3.max(flatData, d => { return +d.value })])
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
            .attr("height", d => {
                return yMax - y(d.value);
            })
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

function drawLineGraph(data, htmlID) {

    let height = chart_height - margin.top - margin.bottom;
    let width = chart_width - margin.left - margin.right;

    let svg = d3.select("#" + htmlID)
        .append("svg")
        .attr("width", chart_width)
        .attr("height", chart_height)

    svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    if (htmlID === 'query-1') {
        animateEvolution(data, htmlID, 100);
    }
    else if (htmlID === 'query-4') {
        animateEvolution(data, htmlID, 50);
    }
    else {
        updateLineGraph(data, htmlID);
    }
}

function incrementDate(dateInput, increment) {
    var dateFormatTotime = new Date(dateInput);
    var increasedDate = new Date(dateFormatTotime.getTime() + (increment * 86400000));
    return increasedDate;
}

// function to filter data based on date range
// function to get data in between two dates
function getEvolutionDataBetweenDates(flatData, start_date, end_date) {

    let data_between_dates = new Array();

    for (const day in flatData) {

        let day_date = parseTime(flatData[day].date);
        if (day_date.getTime() >= start_date.getTime() && day_date.getTime() <= end_date.getTime()) {
            data_between_dates.push(flatData[day]);
        }
    }

    return data_between_dates;
}

function animateEvolution(data, htmlID, timeout) {

    let startDate = d3.min(data, d => parseTime(d.date));
    let endDate = d3.max(data, d => parseTime(d.date));

    let diffTime = Math.abs(endDate - startDate);
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    function doSetTimeout(i) {
        setTimeout(function () {
            let renderDate = incrementDate(startDate, i);
            updateLineGraph(getEvolutionDataBetweenDates(data, startDate, renderDate), htmlID);
        }, i * timeout);
    }

    for (let renderDateIncrement = 1; renderDateIncrement < diffDays; renderDateIncrement++) {
        doSetTimeout(renderDateIncrement);
    }
}

function updateLineGraph(data, htmlID) {

    let height = chart_height - margin.top - margin.bottom;
    let width = chart_width - margin.left - margin.right;

    let xMax = chart_width - margin.left - margin.right;
    let yMax = chart_height - margin.top - margin.bottom;

    let svg = d3.select("#" + htmlID).selectAll("svg");

    svg.selectAll(".axis").remove();
    svg.selectAll(".mylines").remove();
    svg.selectAll(".mydots").remove();
    svg.selectAll(".mylabels").remove();

    let sumstat = d3.group(data, d => d.name);

    // X Axis
    let x = d3.scaleTime()
        .domain(d3.extent(data, d => { return parseTime(d.date) }))
        .range([margin.left, xMax]);
    // bottom
    let xAxis = svg.append("g")
        .attr("transform", "translate(0, " + yMax + ")")
        .attr("class", "axis")
        .call(d3.axisBottom(x)
            .tickFormat(d3.timeFormat("%b %y"))
        );

    let y = d3.scaleLinear()
        .domain([0, d3.max(data, d => { return d.data })])
        .range([yMax, 0]);
    // left y axis
    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ", 0)")
        .call(d3.axisLeft(y));

    // color palette
    const color = d3.scaleOrdinal()
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#8B8000', '#a65628', '#f781bf', '#999999'])

    // Add one dot in the legend for each name.
    var size = 20
    svg.selectAll("mydots")
        .data(sumstat)
        .enter()
        .append("rect")
        .attr('class', 'mydots')
        .attr("x", 100)
        .attr("y", function (d, i) { return 100 + i * (size + 5) }) // 100 is where the first dot appears. 25 is the distance between dots
        .attr("width", size)
        .attr("height", size)
        .style("fill", function (d) { return color(d[0]) })

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
        .data(sumstat)
        .enter()
        .append("text")
        .attr('class', 'mylabels')
        .attr("x", 100 + size * 1.2)
        .attr("y", function (d, i) { return 100 + i * (size + 5) + (size / 2) }) // 100 is where the first dot appears. 25 is the distance between dots
        .style("fill", function (d) { return color(d[0]) })
        .text(function (d) { return d[0] })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle")

    // Add the line
    let line = d3.line()
        .x(function (d) { return x(parseTime(d.date)); })
        .y(function (d) { return y(d.data); });

    let lines = svg.selectAll(".line")
        .data(sumstat)
        .join("path")
        .attr("fill", "none")
        .attr('class', 'mylines')
        .attr("stroke", function (d) { return color(d[0]) })
        .attr("stroke-width", 1.5)
        .attr("d", function (d) {
            return d3.line()
                .x(function (d) { return x(parseTime(d.date)); })
                .y(function (d) { return y(+d.data); })
                (d[1])
        });

    // exit
    lines.exit()
        .transition()
        .duration(1000)
        .attr("stroke-width", 0)
        .remove();
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
            drawAreaChart(getCases(owid_covid_data, "OWID_WRL", 'date', 'new_cases_smoothed'), "daily-linechart", 'OWID_WRL');
            drawAreaChart(getCases(owid_covid_data, "OWID_WRL", 'date', 'total_cases'), "cumalative-barchart", 'OWID_WRL');
            drawBarChart(getVaccinationOverview(owid_covid_data, "OWID_WRL"), "overview-barchart");
            drawLineGraph(getNewCasesForCountries(owid_covid_data, ['IRL', 'ARE', 'IND', 'USA', 'ARG', 'FRA']), "query-1");
            // drawLineGraph(getNewCasesForCountries(owid_covid_data, ['OWID_EUR', 'OWID_ASI', 'OWID_AFR', 'OWID_NAM', 'OWID_SAM', 'OWID_OCE']), "query-1");
            drawLineGraph(getTotalCasesForCountries(owid_covid_data, ['OWID_EUR', 'OWID_ASI', 'OWID_AFR', 'OWID_NAM', 'OWID_SAM', 'OWID_OCE']), "query-4");
        });
})