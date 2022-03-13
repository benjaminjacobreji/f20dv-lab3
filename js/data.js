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

function getOverview(owid_covid_data, country) {
    let records = owid_covid_data[country].data;

    let max_new_cases = 0;
    let max_total_deaths = 0;
    let max_new_vaccinations = 0;

    console.log(records);

    for(const day in records) {
        if(!isNaN(records[day]['new_cases']) && records[day]['new_cases'] > max_new_cases) {
            max_new_cases = records[day]['new_cases'];
        }
        if(!isNaN(records[day]['total_deaths']) && records[day]['total_deaths'] > max_total_deaths) {
            max_total_deaths = records[day]['total_deaths'];
        }
        if(!isNaN(records[day]['new_vaccinations']) && records[day]['new_vaccinations'] > max_new_vaccinations) {
            max_new_vaccinations = records[day]['new_vaccinations'];
        }
    }

    return [
        { 'name': 'new_cases', 'value': max_new_cases },
        { 'name': 'total_deaths', 'value': max_total_deaths },
        { 'name': 'new_vaccinations', 'value': max_new_vaccinations },
    ]
}


export { getCases, getOverview };