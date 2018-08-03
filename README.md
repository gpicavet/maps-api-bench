# test geocoding
node src/testGeocode.js query-impala-restaurants-paris.csv [replay|record] [google|geocodeEarth] [apikey]
# test reverse geocoding
node src/testReverse.js query-impala-restaurants-paris.csv [replay|record] [google|geocodeEarth] [apikey]
# test autocomplete 1 
node src/testAutocomplete1.js query-impala-restaurants-paris.csv [replay|record] [google|geocodeEarth] [apikey]
