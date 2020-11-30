 
const turf = _interopRequireWildcard(require("@turf/turf"));
const math = require("math.gl");


var StartVehiclePose = null;
var StartVehicleData = null;
var StartVehiclegeoMartix  = null;

var isfirst_data = true;



module.exports = {
    getVectorTranformToyaw: function(object_yaw,current_car_yaw, vector){
        var yaw_offset =object_yaw-current_car_yaw
        var basepose = {
            x: 0,
            y: 0,
            z: 0,
            roll: 0,
            yaw: 0,
            pitch: yaw_offset,
        }
        var transformMatrix = new math._Pose(basepose).getTransformationMatrix();
        console.log(transformMatrix)
        console.log("same?",transformMatrix.transformVector(vector))
        return  vector.map(function (p) {
            return transformMatrix.transformVector(p);     });
        //return transformMatrix.transformVector(vector)
   
    },
    
    getRelativeCoordinates: function(vertices, basePose) {
        console.log("0")
        if (!(basePose instanceof math._Pose)) {
            console.log("1")  
            basePose = new math._Pose(basePose);    
        }
        console.log("2")
        var transformMatrix = basePose.getTransformationMatrix();
        console.log("transformMatrix",transformMatrix)
        console.log("transformMatrix_vector",transformMatrix.transformVector(vertices))
        return vertices.map(function (p) {
            console.log("p",p)
          return transformMatrix.transformVector(p);
        });
      },

    getStartVehiclePose: function(locationCache){
        console.log("is work second?")
        if(isfirst_data){
            //StartVehiclePose define
            StartVehiclePose={
                latitude: locationCache.latitude,
                longitude: locationCache.longitude,
                altitude: locationCache.altitude,
                roll: locationCache.roll,
                pitch: locationCache.ptich,
                yaw: locationCache.yaw
            }
            //Martix lat long alt
            StartVehiclegeoMartix ={
                latitude: StartVehiclePose.latitude,
                longitude:StartVehiclePose.longitude,
                altitude: StartVehiclePose.altitude
            }
            StartVehicleData = new math._Pose(StartVehiclegeoMartix)
        }
    },

    getObjectTrajectory: function(object){
        var vertices = [];
        var object_pose = object.pose;
        var object_geometrix = object.geometrix;
        console.log("StartVehiclePose",StartVehiclePose)
        console.log("object_geometrix",object_geometrix)
        var getGeospatialVector = _getGeospatialVector(object_geometrix,object.yaw);
        console.log("is work?")
        var getGeospatialVector2= _slicedToArray(getGeospatialVector,2) 
            x = getGeospatialVector2[0],
            y = getGeospatialVector2[1];
            console.log("x,y)",x,y)
            var transformMatrix = new math._Pose(object_geometrix)
                                          .getTransformationMatrixFromPose(StartVehicleData)
            var point = transformMatrix.transformVector([object_pose.x,
                                                         object_pose.y,
                                                         object_pose.z])
            vertices.push([point[0] +x, point[1]+ y, point[2]])
            
            //console.log([point[0] +x, point[1]+ y, point[2]])
            return vertices
        },
};

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }
function _getGeospatialVector(current,yaw){
    //var heading = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
    var heading = yaw;
    console.log("current",current)
    console.log("heading",heading)
    const fromCoord = turf.point([ Number(StartVehiclePose.longitude),
                                   Number(StartVehiclePose.latitude),
                                   Number(StartVehiclePose.altitude)]);
    console.log("fromCoord",fromCoord)
    var toCoord = turf.point( [Number(current.y),Number(current.x),Number(current.z)]);
    console.log("toCoord",toCoord)
    var distance = turf.distance(fromCoord,toCoord, {
        unit: 'meters'
    })
    var bearing = turf.bearing(fromCoord, toCoord);
    console.log("bearing",bearing)
    var relativeBearing = turf.degreesToRadians(90 - bearing);
    console.log("relativeBearing",relativeBearing)
    var radianDiff = relativeBearing - heading;
    console.log("radianDiff",radianDiff)
    return [distance * Math.cos(radianDiff), distance * Math.sin(radianDiff)];
}
