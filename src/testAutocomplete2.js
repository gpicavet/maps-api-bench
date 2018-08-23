const Promise = require('bluebird');
const csv = require('csvdata');

////////////////////////////////////////////////

const args = process.argv.slice(2);
const [inputCsv, apiProvider, api_key] = args;

const apiClass = require('./api/'+apiProvider+'.js').Api;
const api = new apiClass(api_key);

let table=[];
csv.load(inputCsv, {delimiter: ';', parse:false, stream:true, log:false})
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

    console.log('id;ref address;query;query lon;query lat;result 1;result 2;result 3;result 4;result 5');

    //rate limit api calls
    Promise.map(table,
        (loc, index) => {
            
            //calculate nearby location (rounding)
            let [lon, lat, radius] = [+loc.lon.toFixed(6), +loc.lat.toFixed(6), 50/*6 decimals = 11 centimeters*/];
            //let [lon, lat, radius] = [+loc.lon.toFixed(3), +loc.lat.toFixed(3), 500/*3 decimals = 111 meters*/];

            //autocomplete nearby partial address (last word)
            const addrParts = loc.street.replace(/,/g,'').replace(/"/g,'\'').toLowerCase().split(' ');
            let partialAddr = addrParts[addrParts.length-1];

            if(partialAddr.length<=4)//avoid small word
               partialAddr = addrParts[addrParts.length-2]+' '+partialAddr;

            //ge ref address with postal code
            //let refAddr=(loc.street.replace(/,/g,'')+', '+loc.postalCode+' '+loc.city).replace(/"/g,'\'').toLowerCase();
            //google ref
            let refAddr=(loc.street.replace(/,/g,'')+', '+loc.city+', france').replace(/"/g,'\'').toLowerCase();
            const outCsv = [index, refAddr, partialAddr, lon, lat];
            return api.autocomplete(partialAddr, lon, lat, radius).then(res => {
                let stringRes = [];
                if(res.length>0) {
                    //get 5 first results
                    stringRes = res.slice(0,5).map(r=>(r.street+', '+r.city).replace(/"/g,'\'').toLowerCase());
                }
                //complete to have 5 strings
                stringRes = stringRes.concat(Array(5).fill('')).slice(0,5);
                console.log(outCsv.concat(stringRes).join(';'));  
            });
            
         
        }, {concurrency:2});
    
  });
