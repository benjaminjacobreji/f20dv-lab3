const parseTime = d3.timeParse("%Y-%m-%d");

function getCases(owid_covid_data, country, x_axis, y_axis) {
    let records = owid_covid_data[country].data;

    let flatData = new Array();

    for (const day in records) {
        if (isNaN(records[day][y_axis])) {
            records[day][y_axis] = 0;
        }
        let newEntry = {
            x_axis: records[day][x_axis],
            y_axis: records[day][y_axis]
        };
        flatData.push(newEntry);
    }

    return flatData;
}

function getVaccinationOverview(owid_covid_data, country) {
    let records = owid_covid_data[country].data;

    let max_total_vaccinations = 0;
    let max_people_vaccinated = 0;
    let max_total_boosters = 0;

    for (const day in records) {
        if (!isNaN(records[day]['total_vaccinations']) && records[day]['total_vaccinations'] > max_total_vaccinations) {
            max_total_vaccinations = records[day]['total_vaccinations'];
        }
        if (!isNaN(records[day]['people_vaccinated']) && records[day]['people_vaccinated'] > max_people_vaccinated) {
            max_people_vaccinated = records[day]['people_vaccinated'];
        }
        if (!isNaN(records[day]['total_boosters']) && records[day]['total_boosters'] > max_total_boosters) {
            max_total_boosters = records[day]['total_boosters'];
        }
    }

    return [
        { 'name': 'total_vaccinations', 'value': max_total_vaccinations },
        { 'name': 'people_vaccinated', 'value': max_people_vaccinated },
        { 'name': 'total_boosters', 'value': max_total_boosters },

    ]
}

function getTotalCasesPerCountryLast2Weeks(owid_covid_data) {
    let new_cases_per_country = new Array();

    for (const country in owid_covid_data) {
        let country_data = owid_covid_data[country];
        let country_data_array = country_data.data;

        // slice the country_data_array to the last 14 elements
        let country_data_array_last_2_weeks = country_data_array.slice(country_data_array.length - 5, country_data_array.length);

        let new_cases_total = 0;

        for (const day in country_data_array_last_2_weeks) {
            let day_data = country_data_array[day];
            let day_date = day_data.date;

            new_cases_total += day_data.new_cases;

        }

        // check if new_cases_total is NaN
        if (isNaN(new_cases_total)) {
            new_cases_total = 0;
        }

        let new_cases_per_country_entry = {
            'iso_a3': country,
            'data': new_cases_total
        };
        new_cases_per_country.push(new_cases_per_country_entry);
    }

    return new_cases_per_country;
}

// function to get data in between two dates
function getDataBetweenDates(flatData, start_date, end_date) {

    let data_between_dates = new Array();

    for (const day in flatData) {
        let day_date = parseTime(flatData[day].x_axis);

        if (day_date.getTime() >= start_date.getTime() && day_date.getTime() <= end_date.getTime()) {
            data_between_dates.push(flatData[day]);
        }
    }

    return data_between_dates;
}

function getNewCasesForCountries(owid_covid_data, countries) {
    let new_cases_per_country = new Array();

    for (const country in countries) {

        let iso_code = countries[country];
        let country_data = owid_covid_data[iso_code];
        let country_data_name = country_data.location;
        let country_data_array = country_data.data;

        for (const day in country_data_array) {
            let day_data = country_data_array[day];
            let day_date = day_data.date;
            let new_cases = day_data.new_cases_smoothed;

            // check if new_cases is NaN
            if (isNaN(new_cases)) {
                new_cases = 0;
            }

            let new_cases_per_country_entry = {
                'iso_a3': iso_code,
                'name': country_data_name,
                'date': day_date,
                'data': new_cases
            };

            new_cases_per_country.push(new_cases_per_country_entry);
        }
    }
    return new_cases_per_country;
}

function getTotalCasesForCountries(owid_covid_data, countries) {
    let new_cases_per_country = new Array();

    for (const country in countries) {

        let iso_code = countries[country];
        let country_data = owid_covid_data[iso_code];
        let country_data_name = country_data.location;
        let country_data_array = country_data.data;

        for (const day in country_data_array) {
            let day_data = country_data_array[day];
            let day_date = day_data.date;
            let new_cases = day_data.total_cases;

            // check if new_cases is NaN
            if (isNaN(new_cases)) {
                new_cases = 0;
            }

            let new_cases_per_country_entry = {
                'iso_a3': iso_code,
                'name': country_data_name,
                'date': day_date,
                'data': new_cases
            };

            new_cases_per_country.push(new_cases_per_country_entry);
        }
    }
    return new_cases_per_country;
}

export { getCases, getVaccinationOverview, getTotalCasesPerCountryLast2Weeks, getDataBetweenDates, getNewCasesForCountries, getTotalCasesForCountries };