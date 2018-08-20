const Promise = require('bluebird');
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
        (loc, index) => {
            
            //calculate nearby location (rounding)
            let [lon, lat, radius] = [+loc.lon.toFixed(3), +loc.lat.toFixed(3), 500/*3 decimals = 111,1 meters*/];

            //autocomplete nearby partial address (half street name with number)
            const addrParts = loc.street.toLowerCase().replace(',','').split(' ');
            const partialAddr = addrParts.slice(0,addrParts.length-1).join(' ')+' '+addrParts[addrParts.length-1].substring(0,addrParts[addrParts.length-1].length*0.5);
            const outCsv = [index, (loc.street+', '+loc.postalCode+' '+loc.city).toLowerCase(), partialAddr, lon, lat];
            return api.autocomplete(partialAddr, lon, lat, radius).then(res => {
                if(res.length>0) {
                    //get 5 first results
                    let stringRes = res.slice(0,5).map(r=>(r.street+', '+r.city).toLowerCase());
                    console.log(outCsv.concat(stringRes).join(';'));    
                } else {
                    console.log(outCsv.join(';'));  
               }

            });
         
        }, {concurrency:2});
    
  });
