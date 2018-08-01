const request = require('request');
const api_key='pk.eyJ1IjoiZ3BpY2F2ZXQiLCJhIjoiY2pqc294cmo5MDBpbzN2bnJoa3JvcmJkdyJ9.Chsy_HZ-VPg-ndGZ70AVHw';

function autocomplete(text) {
    request.get('https://api.mapbox.com/geocoding/v5/mapbox.places/'+text+'.json', 
        {
            qs:{
                autocomplete:true,
                access_token:api_key
            }, 
            json:true
        }, 
        (err,resp,json)=> {
        //console.log(JSON.stringify(json.features[0].geometry.coordinates,null,1));
            console.log(JSON.stringify(json.features[0],null,1));
        });
}

autocomplete('3 Rue Camille Berruyer, nantes');