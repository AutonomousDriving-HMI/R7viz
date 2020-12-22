const Calculator = require('../Calculator');
const utmConverter = require('utm-latlng');

var isUTM = false;
var latitude
var longitude
var altitude

function UTMtoLatLng(coordinate,pose) {
    let {x,y,z} = pose
    var wgs84_data = utmobj.convertUtmToLatLng(x+coordinate.utm_offset_e,y+coordinate.utm_offset_n,52,'S');
    latitude = wgs84_data.lat
    longitude = wgs84_data.lng
    altitude =  z 
    return {latitude,longitude,altitude}
}
function latlong(pose) {
    latitude = pose.x
    longitude = pose.y
    altitude = pose.z
    return {latitude,longitude,altitude}
}

module.exports = {
    getXVIZVehiclePose: function (coordinate, pose) {
        /*uint8 UTM=0
          uint8 LATLON=1
          uint8 SENSOR=2*/
        if (coordinate.type ==0){
            {latitude,longitude,altitude} = UTMtoLatLng(coordinate,pose)
        }
        else if (coordinate.type ==1){
            {latitude,longitude,altitude} = latlong(pose)
        } 
        else if (coordinate.type ==2){
            {latitude,longitude,altitude} = latlong(pose)
        }   
        return {latitude,longitude,altitude}
    },
}