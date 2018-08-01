
const Promise = require('bluebird');
const request = require("request");
const requestp = Promise.promisify(request);
const requestpp = Promise.promisifyAll(requestp);

export default class GeocodeEarth {

    constructor(api_key) {
        this.api_key=api_key;
    }

    autocomplete(text) {
        return requestpp.getAsync('https://api.geocode.earth/v1/autocomplete', 
            {
                qs:{
                    text:text,
                    api_key:this.api_key
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

    search(text) {
        return requestpp.getAsync('https://api.geocode.earth/v1/search', 
            {
                qs:{
                    text:text,
                    api_key:this.api_key
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

    reverse({lon,lat}) {
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
}