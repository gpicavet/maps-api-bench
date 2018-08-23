
const Promise = require('bluebird');
const request = require("request");
const requestp = Promise.promisify(request);
const requestpp = Promise.promisifyAll(requestp);

class GeocodeEarth {

    constructor(api_key) {
        this.api_key=api_key;
    }

    autocomplete(text,lon,lat,radius) {
        let ext={};
        if(radius) {
            ext = {
                'boundary.circle.lon':(+lon).toFixed(6),
                'boundary.circle.lat':(+lat).toFixed(6),
                'boundary.circle.radius':(radius/1000).toFixed(3)
            }
        }
        return requestpp.getAsync('https://api.geocode.earth/v1/autocomplete', 
            {
                qs:{...{
                    'focus.point.lon':(+lon).toFixed(6),
                    'focus.point.lat':(+lat).toFixed(6),
                    layers:'address',
                    //sources:'oa',//openaddresses
                    text:text,
                    api_key:this.api_key
                },...ext}, 
                json:true
            }).then(
                (resp)=> {
                    if(resp.statusCode >= 300)
                        console.error(resp.statusCode,resp.body);
                    if(resp.body.features)
                        return resp.body.features.map(f=>({
                            street:f.properties.name,
                            city:f.properties.postalcode+' '+f.properties.locality}));
                    else
                        return [];

            });
    }

    geocode(text) {
        return requestpp.getAsync('https://api.geocode.earth/v1/search', 
            {
                qs:{
                    text:text,
                    api_key:this.api_key
                }, 
                json:true
            }).then(
                (resp)=> {
                    if(resp.statusCode >= 300)
                        console.error(resp.statusCode,resp.body);
                    if(resp.body.features)
                        return resp.body.features.map(f=>({
                            lon:f.geometry.coordinates[0],
                            lat:f.geometry.coordinates[1],
                            street:f.properties.name,
                            city:f.properties.locality}));
                    else
                        return [];

            });
    }

    reverse(lon,lat) {
        return requestpp.getAsync('https://api.geocode.earth/v1/reverse', 
            {
                qs:{
                    'point.lon':lon,
                    'point.lat':lat,
                    layers:'address',
                    api_key:this.api_key
                }, 
                json:true
            }).then(
                (resp)=> {
                    if(resp.body.features)
                        return resp.body.features.map(f=>({
                            street:f.properties.name,
                            city:f.properties.postalcode+' '+f.properties.locality}));
                    else
                        return [];

            });
    }
}

module.exports = {
    Api:GeocodeEarth
}