
const Promise = require('bluebird');
const request = require("request");
const requestp = Promise.promisify(request);
const requestpp = Promise.promisifyAll(requestp);

class Google {

    constructor(api_key) {
        this.api_key=api_key;
    }

    getAddressComp(res, type) {
        for(let ac of res) {
            if(ac["types"].indexOf(type)>=0)
                return ac["long_name"];
        }
        return '';
    }

    autocomplete(text,lon,lat,radius) {
        return requestpp.getAsync('https://maps.googleapis.com/maps/api/place/autocomplete/json', 
            {
                qs:{
                    location:lat+','+lon,
                    radius:radius,
                    input:text,
                    language:'fr',
                    key:this.api_key
                }, 
                json:true
            }).then(
                (resp)=> {
                    if(resp.statusCode >= 300 || (resp.body && resp.body.error_message)) {
                        console.error(resp.statusCode,resp.body);
                        throw 'GoogleApiError';
                    }
                    if(resp.body.predictions)
                        return resp.body.predictions.map(f=>({
                            street:f.structured_formatting.main_text,
                            city:f.structured_formatting.secondary_text}));
                    else
                        return [];

            });
    }

    geocode(text) {
        return requestpp.getAsync('https://maps.googleapis.com/maps/api/place/textsearch/json', 
            {
                qs:{
                    query:text,
                    language:'fr',
                    key:this.api_key
                }, 
                json:true
            }).then(
                (resp)=> {
                    if(resp.body.results)
                        return resp.body.results.map(f=>({
                            lon:f.geometry.location.lng,
                            lat:f.geometry.location.lat,
                            street:f.name,
                            city:''}));
                    else
                        return [];

            });
    }

    reverse(lon,lat) {
        return requestpp.getAsync('https://maps.googleapis.com/maps/api/geocode/json', 
            {
                qs:{
                    'latlng':lat+','+lon,
                    key:this.api_key
                }, 
                json:true
            }).then(
                (resp)=> {
                    if(resp.body.results)
                        return resp.body.results.map(f=>({
                            street:this.getAddressComp(f.address_components,'street_number')+" "+this.getAddressComp(f.address_components,'route'),
                            city:this.getAddressComp(f.address_components,'postal_code')+" "+this.getAddressComp(f.address_components,'locality')
                        }));
                    else
                        return [];

            });
    }
}

module.exports = {
    Api:Google
}