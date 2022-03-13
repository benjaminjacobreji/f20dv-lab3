// helper function to return the ISO A3 code of a country based on it's ISO Numeric code
// Mainly used to link the map data to the covid data using an intermediate iso data
function getCountryISOA3Code(country_iso_number, iso_numeric_codes) {
    return iso_numeric_codes.find(function (data) {
        return data.ISO_Numeric == country_iso_number;
    }).ISO_A3;
}

export { getCountryISOA3Code };