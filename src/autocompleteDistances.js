const Promise = require('bluebird');
const replay = require('replay');//creates a proxy http api to record/replay
const geolib = require('geolib');
const csv = require('csvdata');
const stringsim = require('string-similarity');

////////////////////////////////////////////////

const args = process.argv.slice(2);
const [inputCsv, replaycacheDir, replayMode, apiProvider, api_key] = args;

const api = new require('./api/'+apiProvider+'.js')(api_key);

replay.fixtures =  replaycacheDir;
replay.mode = replayMode;//record|replay

let table=[];
csv.load(inputCsv, {delimiter: ';', parse:false, stream:true})
  .on('data', (data) => {

    if(data.address.match(/[1-9]+.*/) && 
        data.address.match(/.*[a-z]+.*/) && 
        data.gps_lat!==0 && data.gps_long!==0//only if geo data are present
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


    table = table.slice(0,100);

    //rate limit api calls
    Promise.map(table,
        (loc) => {

            //autocomplete nearby partial address (half street name with number)
            const addrParts = loc.street.replace(',','').split(' ');
            const partialAddr = addrParts.slice(0,addrParts.length-1).join(' ')+' '+addrParts[addrParts.length-1].substring(0,addrParts[addrParts.length-1].length*0.5);
            return api.autocomplete(partialAddr, 2.346319914, 48.83746719,loc.lon, loc.lat).then(res => {
                if(res.length>0) {
                    let stringRes = (res[0].street+', '+res[0].city).toLowerCase();
                    let stringRef = (loc.street.replace(',','')+', '+loc.city).toLowerCase();
                    let dist =stringsim.compareTwoStrings(stringRes, stringRef);
                    console.log(dist+';'+loc.lon+';'+loc.lat+';'+stringRes+';'+partialAddr+';'+stringRef);    
                } else {
                    console.error('no data');
                }
            });
            /*
            //autocomplete nearby partial address (last word of street name)
            const addrParts = loc.street.replace(',','').split(' ');
            const partialAddr = addrParts[addrParts.length-1].substring(0,addrParts[addrParts.length-1].length);
            return api.autocomplete(partialAddr, loc.lon, loc.lat).then(res => {
                if(res.length>0) {
                    let stringRes = (res[0].street+', '+res[0].city).toLowerCase();
                    let stringRef = (loc.street.replace(',','')+', '+loc.city).toLowerCase();
                    let dist =stringsim.compareTwoStrings(stringRes, stringRef);
                    console.log(dist+';'+loc.lon+';'+loc.lat+';'+stringRes+';'+partialAddr+';'+stringRef);    
                } else {
                    console.error('no data');
                }
            });
            */
    
            //autocomplete nearby mispelling street name
    
         
        }, {concurrency:2});
    
  });