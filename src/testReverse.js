const path = require('path');
const Promise = require('bluebird');
const replay = require('replay');//creates a proxy http api to record/replay
const csv = require('csvdata');
const stringsim = require('string-similarity');

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
                  
        data.gps_lat = parseFloat(data.gps_lat.replace(',','.'));
        data.gps_long = parseFloat(data.gps_long.replace(',','.'));
        table.push({
            street:data.address,
            postalCode:data.postal_code,
            city:data.city,
            lon:data.gps_long,
            lat:data.gps_lat
        });
    
  })
  .on('end', () => {


    table = table.slice(0,200);

    console.log('lon;lat;ref address;match address;levenstein dist');
    //rate limit api calls
    Promise.map(table,
        (loc) => {

            let stringRef = (loc.street.replace(',','')+', '+loc.postalCode+' '+loc.city).toLowerCase();

            return api.reverse(loc.lon, loc.lat).then(res => {
            if(res.length>0) {
                let stringRes = (res[0].street+', '+res[0].city).toLowerCase();
                let dist =stringsim.compareTwoStrings(stringRes, stringRef);
                console.log(loc.lon+';'+loc.lat+';'+stringRef+';'+stringRes+';'+(''+dist).replace('.',','));
            } else {
                console.log(loc.lon+';'+loc.lat+';'+stringRef+';'+'?'+';'+'99999');
            }
            });  
             
        }, {concurrency:2});
    
  });
