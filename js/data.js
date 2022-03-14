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
        let country_data_array_last_2_weeks = country_data_array.slice(country_data_array.length - 14, country_data_array.length);

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

export { getCases, getVaccinationOverview, getTotalCasesPerCountryLast2Weeks };