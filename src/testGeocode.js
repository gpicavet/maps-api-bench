
const Promise = require('bluebird');
const geolib = require('geolib');
const csv = require('csvdata');

////////////////////////////////////////////////

const args = process.argv.slice(2);
const [inputCsv, apiProvider, api_key] = args;

const apiClass = require('./api/'+apiProvider+'.js').Api;
const api = new apiClass(api_key);

let table=[];
csv.load(inputCsv, {delimiter: ';', parse:false, stream:true})
  .on('data', (data) => {

                 
        data.gps_lat = parseFloat(data.gps_lat.replace(',','.'));
        data.gps_long = parseFloat(data.gps_long.replace(',','.'));
        table.push({
            street:data.address,
            city:data.city,
            postalCode:data.postal_code,
            lon:data.gps_long,
            lat:data.gps_lat
        });
    
  })
  .on('end', () => {


    table = table.slice(0,500);

    //rate limit api calls
    Promise.map(table,
        (loc) => {
            
            let addr=(loc.street.replace(',','')+', '+loc.city).toLowerCase();
            return api.geocode(addr).then(res => {
                if(res[0]) {
                    let resAddr = (res[0].street+', '+res[0].city).toLowerCase();
                    let diff = 
                        geolib.getDistance(
                            {longitude:res[0].lon, latitude:res[0].lat},
                            {longitude:loc.lon, latitude:loc.lat});
                    console.log(addr+';'+loc.lon+';'+loc.lat+';'+resAddr+';'+res[0].lon+';'+res[0].lat+';'+diff);
                } else {
                    console.log(addr+';'+loc.lon+';'+loc.lat+';'+'?'+';'+'?'+';'+'?'+';'+'?');
                }
            });

         
        }, {concurrency:2});
    
  });
