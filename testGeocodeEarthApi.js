
const Promise = require('bluebird');
const request = require("request");
const fs = require('fs');
const replay = require('replay');//creates a proxy http api to record/replay
const geolib = require('geolib');
const stringsim = require('string-similarity');


const fsp = Promise.promisifyAll(fs);
const requestp = Promise.promisify(request);
const requestpp = Promise.promisifyAll(requestp);

function autocomplete(text) {
    return requestpp.getAsync('https://api.geocode.earth/v1/autocomplete', 
        {
            qs:{
                text:text,
                api_key:api_key
            }, 
            json:true
        }).then(
            (resp)=> {
                if(resp.body.features && resp.body.features[0])
                    return resp.body.features[0];
                else
                    return null;

        });
}

function search(text) {
    return requestpp.getAsync('https://api.geocode.earth/v1/search', 
        {
            qs:{
                text:text,
                api_key:api_key
            }, 
            json:true
        }).then(
            (resp)=> {
                if(resp.body.features && resp.body.features[0])
                    return resp.body.features[0];
                else
                    return null;

        });
}

function reverse({lon,lat}) {
    return requestpp.getAsync('https://api.geocode.earth/v1/reverse', 
        {
            qs:{
                'point.lon':lon,
                'point.lat':lat,
                layers:'address',
                api_key:api_key
            }, 
            json:true
        }).then(
            (resp)=> {
                if(resp.body.features && resp.body.features[0])
                    return resp.body.features[0];
                else
                    return null;

        });
}

let args = process.argv.slice(2);
let [inputCsv, replaycacheDir, replayMode, api_key] = args;

replay.fixtures = replaycacheDir;
replay.mode = replayMode;

fsp.readFileAsync(inputCsv, 'utf8').then((data) => {

    let headers={};
    let addresses=data.split('\r').map((row, ind) => {
        row = row.trim();
        if(ind===0) {
            row.split(';').forEach((h,i)=> {
                headers[h]=i;
            });
        } else {
            let cells = row.split(';');
            if(cells.length === Object.keys(headers).length) {
                let lat = parseFloat(cells[headers['gps_lat']].replace(',','.'));
                let lon = parseFloat(cells[headers['gps_long']].replace(',','.'));
                let addr = cells[headers['address']];
                if(addr.match(/[1-9]+.*/) && 
                    addr.match(/.*[a-z]+.*/) && 
                    addr.indexOf('"')<0 && // valid street number + name
                    lat!==0 && lon!==0 //only if geo data are present
                    ) {
                    
                        addr = addr.replace(',','');
                        addr = addr +', '+cells[headers['city']];
                    
                        return {addr:addr,lat:lat,lon:lon};
                }
            }
            return null;
        }
    }).filter(locCsv=>locCsv).slice(0,100);

    return Promise.map(addresses,
        (loc) => {
            /*
            return search(loc.addr).then(json => {
                console.log("call search api", loc.addr);
                if(json !== null && json.geometry) {
                    let diff = 
                        geolib.getDistance(
                            {longitude:json.geometry.coordinates[0], latitude:json.geometry.coordinates[1]},
                            {longitude:loc.lon, latitude:loc.lat});
                    console.log(diff + " meters diff", "coords", json.geometry.coordinates);
                } else {
                    console.warn('no data');
                }
            });
            */
           return reverse(loc).then(json => {
            if(json !== null && json.properties) {
                let stringRes = (json.properties.name+', '+json.properties.locality).toLowerCase();
                let stringRef = loc.addr.toLowerCase();
                let dist =stringsim.compareTwoStrings(stringRes, stringRef);
                console.log(dist+';'+loc.lon+';'+loc.lat+';'+stringRes+';'+stringRef);
            } else {
                console.warn('no data');
            }
        });           
        }, {concurrency:2});//rate limit api
});
