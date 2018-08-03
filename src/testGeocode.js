const path = require('path');
const Promise = require('bluebird');
const replay = require('replay');//creates a proxy http api to record/replay
const geolib = require('geolib');
const csv = require('csvdata');

////////////////////////////////////////////////

const args = process.argv.slice(2);
const [inputCsv, replayMode, apiProvider, api_key] = args;

const apiClass = require('./api/'+apiProvider+'.js').Api;
const api = new apiClass(api_key);

replay.fixtures =  path.join('replaycache',path.parse(inputCsv).name);
replay.mode = replayMode;//record|replay

let table=[];
csv.load(inputCsv, {delimiter: ';', parse:false, stream:true})
  .on('data', (data) => {

    if(data.address.match(/[1-9]+.*/) && 
        data.address.match(/.*[a-z]+.*/) && 
        data.gps_lat!=0 && data.gps_long!=0//only if geo data are present
    ) {                    
        data.gps_lat = parseFloat(data.gps_lat.replace(',','.'));
        data.gps_long = parseFloat(data.gps_long.replace(',','.'));
        table.push({
            street:data.address,
            city:data.city,
            lon:data.gps_long,
            lat:data.gps_lat
        });
    }
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
