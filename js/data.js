// used to parse the date 
const parseTime = d3.timeParse("%Y-%m-%d");

// function to get case data for a country of either total cases or new cases
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

// function to get vaccination overview data from owid_covid_data for a country
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

// function to get total cases for every country for the last 5 days
function getTotalCasesPerCountryLast5Days(owid_covid_data) {
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

// function to get data in between two dates for a given processed dataset
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

// function to get new cases for a list of countries
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

// function to get total cases for a list of countries
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

// function to get the effect of vaccination on total cases for a country
function getVaccinationEffect(owid_covid_data, country) {
    let vaccination_array = new Array();

    let country_data = owid_covid_data[country];
    let country_data_name = country_data.location;
    let country_data_array = country_data.data;

    for (const day in country_data_array) {
        let day_data = country_data_array[day];
        let day_date = day_data.date;
        let new_cases_smoothed = day_data.new_cases_smoothed;
        let new_deaths_smoothed = day_data.new_deaths_smoothed;
        let new_people_vaccinated_smoothed = day_data.new_people_vaccinated_smoothed;

        // check if new_cases is NaN
        if (isNaN(new_cases_smoothed)) {
            new_cases_smoothed = 0;
        }

        // check if new_deaths is NaN
        if (isNaN(new_deaths_smoothed)) {
            new_deaths_smoothed = 0;
        }

        // check if new_people_vaccinated is NaN
        if (isNaN(new_people_vaccinated_smoothed)) {
            new_people_vaccinated_smoothed = 0;
        }

        let new_cases_smoothed_vaccination_array = {
            'type': 'New Cases',
            'name': country_data_name,
            'date': day_date,
            'data': new_cases_smoothed
        };
        vaccination_array.push(new_cases_smoothed_vaccination_array);

        let new_deaths_smoothed_vaccination_array = {
            'type': 'New Deaths',
            'name': country_data_name,
            'date': day_date,
            'data': new_deaths_smoothed
        };
        vaccination_array.push(new_deaths_smoothed_vaccination_array);

        let new_people_vaccinated_smoothed_vaccination_array = {
            'type': 'New Vaccinated',
            'name': country_data_name,
            'date': day_date,
            'data': new_people_vaccinated_smoothed
        };

        vaccination_array.push(new_people_vaccinated_smoothed_vaccination_array);
    }

    return vaccination_array;
}

// function to get data in between two dates for getVaccinationOverview
function getDataBetweenDatesForVaccinationOverview(owid_covid_data, country, start_date, end_date) {

    let records = owid_covid_data[country].data;

    let max_total_vaccinations = 0;
    let max_people_vaccinated = 0;
    let max_total_boosters = 0;

    for (const day in records) {

        let day_data = records[day];
        let day_date = parseTime(day_data.date);

        if (day_date.getTime() >= start_date.getTime() && day_date.getTime() <= end_date.getTime()) {
            if (!isNaN(day_data['total_vaccinations']) && day_data['total_vaccinations'] > max_total_vaccinations) {
                max_total_vaccinations = day_data['total_vaccinations'];
            }
            if (!isNaN(day_data['people_vaccinated']) && day_data['people_vaccinated'] > max_people_vaccinated) {
                max_people_vaccinated = day_data['people_vaccinated'];
            }
            if (!isNaN(day_data['total_boosters']) && day_data['total_boosters'] > max_total_boosters) {
                max_total_boosters = day_data['total_boosters'];
            }
        }
    }

    return [
        { 'name': 'total_vaccinations', 'value': max_total_vaccinations },
        { 'name': 'people_vaccinated', 'value': max_people_vaccinated },
        { 'name': 'total_boosters', 'value': max_total_boosters },

    ]

}

// export functions to be used in other files
export { getCases, getVaccinationOverview, getTotalCasesPerCountryLast5Days, getDataBetweenDates, getNewCasesForCountries, getTotalCasesForCountries, getVaccinationEffect, getDataBetweenDatesForVaccinationOverview };