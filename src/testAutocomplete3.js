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
            let [lon, lat] = [loc.lon.toFixed(3), loc.lat.toFixed(3)]

            //autocomplete nearby partial address (mispelling last word)
            const addrParts = loc.street.toLowerCase().replace(',','').split(' ');
            const partialAddr = addrParts[addrParts.length-1];
            const outCsv = [index, (loc.street+', '+loc.postalCode+' '+loc.city).toLowerCase(), partialAddr, lon, lat];
            return api.autocomplete(partialAddr, lon, lat).then(res => {
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
