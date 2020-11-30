/*
xviz styling 
https://github.com/uber/xviz/blob/master/docs/protocol-schema/style-specification.md#point
*/
const WebSocket = require('ws');
const ObjConveter= require('./xviz-object_converter')
const process = require('process');
const object_build_helper = require('./xviz-object_coordinate_transform')
const {XVIZMetadataBuilder, XVIZBuilder, XVIZUIBuilder, encodeBinaryXVIZ} = require("@xviz/builder");
const { Z_BLOCK } = require('zlib');
const {Vector3,_Pose} = require('math.gl')
const math = require('math.gl')
const _ = require('lodash')
const _xvizTrajectoryHelper = require("./node_modules/@xviz/builder/dist/es5/builders/helpers/xviz-trajectory-helper.js");


//import {OBJECT_PALATTE} from '../gui/src/src/custom_styles.js';

//jaekeun object info name space
const VECHILE_STREAM= '/objects/shape/vehicle'
const PEDSTRIAN_STREAM='/objects/shape/pedestrian'
const Arrow_STREAM='/objects/arrow'
const UNKNOWN_STREAM='/objects/shape/vehicle/unknown'

const LINELIST_STREAM= 'marker/shape/linelist'

//object class
UNKNOWN='0'
CAR='1'
TRUCK='2'
BUS='3'
BICYCLE='4'
MOTORBIKE='5'
PEDESTRIAN='6'
ANIMAL='7'

var basepose = null
var transformpose = null
var transform_coord
var vecTransformFlag = false;

const xvizMetaBuider = new XVIZMetadataBuilder();
const xvizUIBuilder = new XVIZUIBuilder({});

xvizMetaBuider.stream('/vehicle_pose')
    .category("pose");
xvizMetaBuider.stream('/camera/image_00').category("primitive").type("image");
//what we will use to make plot the desired path of the car 
xvizMetaBuider.stream('/vehicle/trajectory')
	.category('primitive')
    .type('polyline').streamStyle({
        stroke_color: '#47B27588',// a nice transparent green
        stroke_width: 2,
        stroke_width_min_pixels: 1
    });
xvizMetaBuider.stream(VECHILE_STREAM)
    .category('primitive')
    .type('polygon').coordinate('VEHICLE_RELATIVE')//.coordinate('VEHICLE_RELATIVE')/////
    .streamStyle({
        extruded: true,
        fill_color: '#00000080'
    })
    .styleClass(UNKNOWN, {
        fill_color: '#FFC6AF80',
        stroke_color: '#FFC6AF',     //orange
    })
    .styleClass(CAR, {
        fill_color: '#7DDDD780',
        stroke_color: '#7DDDD7'     //blue
    })
    .styleClass(TRUCK, {
        fill_color: '#267E6380',
        stroke_color: '#267E63'
    })
    .styleClass(BUS, {
        fill_color: '#957FCE80', 
        stroke_color: '#957FCE',    
    })
    .styleClass(BICYCLE, {
        fill_color: '#DA70BF80',
        stroke_color: '#DA70BF'
    })
    .styleClass(MOTORBIKE, {
        fill_color: '#EEA2AD80',
        stroke_color: '#EEA2AD'  //purple
    })

xvizMetaBuider.stream(PEDSTRIAN_STREAM)
    .category('primitive')
    .type('polygon').coordinate('VEHICLE_RELATIVE')
    .streamStyle({
        fill_color: '#00000080'
    })
    .styleClass(PEDESTRIAN, {
        fill_color: '#FEC56480',
        stroke_color: '#FEC564'
    })
    .styleClass(ANIMAL, {
        fill_color: '#D6A00080',
        stroke_color: '#D6A000'
    })
    .pose({
        x: 0,
        y: 0,
        z: 0
    });    /*
    .styleClass(category.streamName,OBJECT_PALATTE[category.streamName]) 
    /*.pose(this.FIXTURE_TRANSFORM_POSE*/
xvizMetaBuider.stream('tracklets_text')
    .category('primitive').type('text')
    .streamStyle({
        size: 30,
        fill_color: '#DCDCCD'
    })
    .coordinate('VEHICLE_RELATIVE')
    .pose({
        x: 0,
        y: 0,
        z: 0
    });
xvizMetaBuider.stream(Arrow_STREAM)
    .category('primitive')
    .type('polyline')
    .coordinate('VEHICLE_RELATIVE')
    .pose({
        x: 0,
        y: 0,
        z: 0
    }); 
xvizMetaBuider.stream(LINELIST_STREAM)
    .category('primitive') 
    .type('polyline').coordinate('IDENTITY')
    .streamStyle({
        fill_color: '#00000080',//will be change
        stroke_width: 0.5,
        stroke_width_min_pixels: 1
    })
    .pose({
        x: 0,
        y: 0,
        z: 0
    }); 
xvizMetaBuider
    .stream('/lidar/points')
    //.stream('/point-cloud')
    .category('primitive')
    .type('point')
    .streamStyle({
        fill_color: '##00a',
        radius_pixels: 1.0
    })
    // laser scanner relative to GPS position
    // http://www.cvlibs.net/datasets/kitti/setup.php
    .coordinate('VEHICLE_RELATIVE')
    .pose({
        x: 0,
        y: 0,
        z: 0
    });
xvizMetaBuider
    .stream('/vehicle/velocity')
    .category('time_series')
    .type('float')
    .unit('m/s')

    .stream('/vehicle/wheel_angle')
    .category('time_series')
    .type('float')
    .unit('degrees')

    .stream('/vehicle/acceleration')
    .category('time_series')
    .type('float')
    .unit('m/s^2');

xvizUIBuilder.child( xvizUIBuilder.panel({name: 'Camera'}) ).child( xvizUIBuilder.video({cameras:["/camera/image_00"]}) );
xvizMetaBuider.ui(xvizUIBuilder);
const _metadata = xvizMetaBuider.getMetadata();
//console.log("XVIZ server meta-data: ", JSON.stringify(_metadata));
// it turns out we cannot use a constant global builder, as all the primitives keeps adding up
const xvizBuilder = new XVIZBuilder({
    metadata: _metadata
});

//const _mockImage = require('fs').readFileSync("./mock.jpg").toString('base64');

// Global cache for location and trajectory
let _locationCache = null;
let _trajectoryCache = null;
let _ObstaclesCache = null;
// cache and flag for camera image
let _cameraImageCache = null;
//let _newCameraImageFlag = false;333333
// Global counter and cache for connections
let _connectionCounter = 1;
let _connectionMap = new Map();
// Global server object
let _wss = null;
// glober timer object to control XVIZ frame rate
let _frameTimer = null;

//Gwang- make LidarCache
let _lidarCache = null;

var object_width = null;
var object_depth = null;
var object_id = null;
var object_height = null;

function connectionId() {
  const id = _connectionCounter;
  _connectionCounter++;
  return id;
}
var label_position = null
var marker_current = null;
var marker_before = null;
var first_flag = true


function ObjectType_Builder(marker_obj_,xvizBuilder,i){
    var marker_obj = {}
    Object.keys(marker_obj_).forEach(function (key){
        marker_obj[key] = marker_obj_[key]
    //define_RelativeTransform(marker_obj)
    })
    const WRITERS = {
        '0': build_CubeBox.bind(this),//(_ObstaclesCache,xvizBuilder),
        '1': build_Sphere.bind(this),//(_ObstaclesCache,xvizBuilder),
        '2': build_LineList.bind(this),//(_ObstaclesCache,xvizBuilder),
        '3': build_Arrow.bind(this)
        //'5': build_Line_List.bind(this),
        //'9': build_Points.bind(this)
      };

      const build_option = WRITERS[marker_obj.object_build]
      if (build_option){
        build_option(marker_obj,xvizBuilder,i)
      }
}

function define_RelativeTransform(marker){
    //transform relative vechile orientation
    basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        yaw: Number(-marker.orientation.car_yaw),
        pitch: Number(0)
    }
    //transform relative obejct orientation
    transformpose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw: Number(marker.orientation.car_yaw - marker.orientation.yaw),
        pitch: Number(0)
    }
}

function build_CubeBox_test(marker, xvizBuilder,i){
    
    var {x,y,z} = marker.vertices;
    var car_utm = marker.car_utm
    var points = marker.points
    var pose = marker.vertices
    let basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw : Number(-marker.orientation.car_yaw),
        pitch: Number(0)
    }
    // origin vector
    var p = _mapPoints(points, pose);
    var vecA = new Vector3(_makeVector([p[1], p[0]]));
    const pCrossVec = vecA.clone().scale(0.3);
    const pCross = _makePoint(p[1], pCrossVec.toArray());
    p.push(p[1])
    var points =  [p[0], pCross]
    xvizBuilder
    .primitive(Arrow_STREAM)
    .polyline(points)
    .style(
        {stroke_color:'#D6A00080'//will be change)
        })
    
    //bounding box
    var depth = marker.scale.x;
    var width = marker.scale.y;
    var object_id = [VECHILE_STREAM,i].join('/');
    var object_height = marker.scale.z;
    label_position = [x,y,z+marker.scale.z]

    var vertices = [[x + width, y - depth ,z],
                [x + width, y + depth, z],
                [x - width, y + depth, z],
                [x - width, y - depth, z]]
    xvizBuilder.primitive(VECHILE_STREAM)
    .polygon(vertices)
    .classes(marker.object_class.toString())
    .style({
        height: object_height
    })
    
    .id(object_id)
    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text(object_id);

    //console.log("i:",i,"pitch:",basepose.pitch,"yaw:",basepose.yaw)
    //tarnsform vector
    var tranform_obj = {}
    Object.keys(marker).forEach(function (key){
            tranform_obj[key] = marker[key]
        })
    var tran_points = tranform_obj.points
    var trans_pose = tranform_obj.vertices
    var trans_p = _mapPoints(tran_points, trans_pose);
    //console.log("real input",trans_p)
    var p_tranform = _xvizTrajectoryHelper.getRelativeCoordinates([p[1]],basepose)
    ///////console.log("output p_tranform",p_tranform)
    trans_p[1] = p_tranform[0]

    //transform vector based bounding box
    var delta_x = trans_p[1].x - trans_p[0][0]
    var delta_y = trans_p[1].y - trans_p[0][1]
    var degree = radToDegree(Math.atan2(delta_y,delta_x))
    //console.log("degree",degree)
    var scale = depth/Math.sqrt( delta_x * delta_x + delta_y * delta_y );
    var trans_vecA = new Vector3(_makeVector([trans_p[1], trans_p[0]]));
    trans_vecA.scale(scale)

    const tarns_pCrossVec = trans_vecA.clone();
    //const tarns_pCrossVec = trans_vecA.clone().scale(0.3);
    const trans_pCross = _makePoint(p[1], tarns_pCrossVec.toArray());
    trans_p.push(trans_p[1])
    var trans_points =  [trans_p[0], trans_pCross]
    //console.log("trans_points",trans_points)
    ///////console.log("output2 trans_points",trans_points)
    
    xvizBuilder
    .primitive(Arrow_STREAM)
    .polyline(trans_points)
    .style(
        {stroke_color:'#267E6380'
        })

        /*
    var tarn_x =trans_pCross[0]
    var tarn_y = trans_pCross[1]
    var tran_width1 = width*Math.cos(90-degree)
    var tran_detph1 = width*Math.sin(90-degree)
    var tran_width2 = 2*depth*Math.cos(degree)
    var tran_detph2 = 2*depth*Math.sin(degree)
    
    var tarns_vertices = [[tarn_x - tran_width1, tarn_y + tran_detph1 ,z],
                    [tarn_x + tran_width1, tarn_y - tran_detph1, z],
                    [tarn_x + tran_width1-tran_width2, tarn_y - tran_detph1-tran_detph2, z],
                    [tarn_x - tran_width1-tran_width2, tarn_y + tran_detph1-tran_detph2, z]]

    xvizBuilder.primitive(VECHILE_STREAM)
    .polygon(tarns_vertices)
    .style({
        height: object_height,
        fill_color: '#FEC56480',
        stroke_color: '#FEC564'
    })
    .id(object_id)
    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text(object_id);
    */

    //tarnsform object
    var transform_vertices = _xvizTrajectoryHelper.getRelativeCoordinates(vertices,basepose);
    //console.log("transform_vertices",transform_vertices)
    xvizBuilder.primitive(VECHILE_STREAM)
    .polygon(transform_vertices)
    .style({
        height: object_height,
        fill_color: '#FEC56480',
        stroke_color: '#FEC564'
    })
    .id(object_id)
    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text(object_id);
}

// if function return object that is not useable
function define_map_origin(marker,depth,width){
    var {x,y,z} = marker.vertices
    var { roll, pitch, yaw, car_yaw } = marker.orientation;
    var object_height = marker.scale.z;
    let vechile_pose={ 
        x: 0,//Number(x)-_locationCache.latitude,
        y: 0,//Number(y)-_locationCache.longitude,
        z: 0,//Number(z)-_locationCache.altitude,
        roll: Number(0),
        pitch: Number(0), 
        yaw: Number(-car_yaw),
        //yaw: Number(1.57*3),//vechile realtive labl indentity but not matched
        //yaw: Number(1.57*3+yaw-_locationCache.yaw), vechile realtive coord
    }
    vertices = [[x + width, y - depth, 0],
                [x + width, y + depth, 0],
                [x - width, y + depth, 0],
                [x - width, y - depth, 0]]
    label_position = [x, y, z + object_height]

    marker.vertices = _xvizTrajectoryHelper.getRelativeCoordinates(vertices,vechile_pose);
    return marker;
}

function _makeArrow(marker) {
    const DirectVector = TransformVec(marker)
    const arrowVecA = DirectVector[1]

    const pCrossVec = arrowVecA.clone().scale(0.3);
    const pCross = _makePoint(arrowVecA, pCrossVec.toArray());

    arrowVecA.scale(0.5)
    const arrowVecB = arrowVecA.clone();

    const leftPt = _makePoint(DirectVector[1], arrowVecB.rotateZ({radians: -Math.PI / 4}).toArray());
    const rightPt = _makePoint(DirectVector[1], arrowVecA.rotateZ({radians: Math.PI / 4}).toArray());;

    DirectVector.push(DirectVector[1])

    return [DirectVector[0], DirectVector[1] ]//, leftPt , DirectVector[1], rightPt, pCross];
}

function build_Arrow(marker, xvizBuilder){
    var {x,y,z} = marker.vertices
    var {lat,lng} =marker.geomatrix;
    object_geometrix ={
        pose: new Vector3([x,y,z]),
        geometrix: new Vector3([lat,lng,z]),
        yaw : marker.orientation.yaw
    }
    const points = _makeArrow(marker);
    xvizBuilder
    .primitive(Arrow_STREAM)
    .polyline(points)
    .style(
        {stroke_color:'#267E6380'
        })
}

function build_LineList(marker, xvizBuilder){
    //console.log("before",marker.points)
    const lines = _.chunk(marker.points, 2);
    //console.log("after",lines[0])
    lines.forEach((line, index) => {
        //console.log("after2",_mapPoints(line, marker.vertices))
        xvizBuilder.primitive(LINELIST_STREAM)
        .polyline(_mapPoints(line, marker.vertices))
        .style({
            stroke_color: '#EEA2AD80',
            stroke_width: 0.1
        })
        .classes("1")//marker.object_class.toString())
    })
    /*for (let j =0; j< lines.length; j++){
        console.log(lines[j])
        var line = _mapPoints(lines[j],marker.vertices)
        console.log("line",line)
        xvizBuilder.primitive(LINELIST_STREAM)
        .polyline(line)
        .classes(marker.object_class.toString())
    }*/
}
function _mapPoints(points,pose){
    const origin = new Vector3([pose.x, pose.y, pose.z]);
    return points.map(p =>{
      p = [p.x,p.y,p.z];
      //console.log("points",p)
      //console.log(origin.add(p))
      return origin
        .clone()
        .add(p)
        .toArray()
    });
  }

function _makeVector(p) {
    const v = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
    return v;
  }

function _makePoint(base, vector) {
    const v = [base[0] + vector[0], base[1] + vector[1], base[2] + vector[2]];
    return v;
  }

function TransformVec(marker){
    basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        yaw: Number(-marker.orientation.car_yaw),
        pitch: Number(0)
    }
    //transform relative obejct orientation
    transformpose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw: Number(marker.orientation.car_yaw - marker.orientation.yaw),
        pitch: Number(0)
    }

    vecTransformFlag = true
    var tran_points = [[marker.vertices.x,marker.vertices.y,marker.vertices.z]]
    transform_coord = _xvizTrajectoryHelper.getRelativeCoordinates(tran_points,basepose);
    
    var transform_start = [transform_coord[0].x,transform_coord[0].y,0]

    var tran_vec =[[marker.points[1].x, marker.points[1].y, marker.points[1].z]]
    var transform_twist = _xvizTrajectoryHelper.getRelativeCoordinates(tran_vec,basepose);
    //console.log("transform_twist",transform_twist.x)
    var transform_twist2 = _xvizTrajectoryHelper.getRelativeCoordinates(transform_twist, transformpose);
    //var DirectVec = [[transform_coord[0].x+transform_twist[0].x,transform_coord[0].y+transform_twist[0].y,0]
     //               ,[transform_coord[0].x,transform_coord[0].y,0]]
    
    var DIR_PTR = new Vector3([transform_coord[0].x+transform_twist2[0].x,transform_coord[0].y+transform_twist2[0].y,0])

    
    var DirectVector = [transform_start]
    DirectVector.push(DIR_PTR)
    
    return DirectVector
}

function TranformVertices(marker){
    basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        yaw: Number(-marker.orientation.car_yaw),
        pitch: Number(0)
    }
    //transform relative obejct orientation
    transformpose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw: Number(marker.orientation.car_yaw - marker.orientation.yaw),
        pitch: Number(0)
    }

    const object_depth = marker.scale.x/2;  //is change
    const object_width = marker.scale.y/2;
    var tran_points = [[marker.vertices.x,marker.vertices.y,marker.vertices.z]]
    transform_coord = _xvizTrajectoryHelper.getRelativeCoordinates(tran_points,basepose);

    const label_position = [transform_coord[0].x,transform_coord[0].y,object_height]

    var trans1 = _xvizTrajectoryHelper.getRelativeCoordinates([[object_width,-object_depth,0]],basepose)
    var Trans1 = _xvizTrajectoryHelper.getRelativeCoordinates(trans1,transformpose)

    var trans2 = _xvizTrajectoryHelper.getRelativeCoordinates([[object_width,object_depth,0]],basepose)
    var Trans2 = _xvizTrajectoryHelper.getRelativeCoordinates(trans2,transformpose)

    var trans3 = _xvizTrajectoryHelper.getRelativeCoordinates([[-object_width,object_depth,0]],basepose)
    var Trans3 = _xvizTrajectoryHelper.getRelativeCoordinates(trans3,transformpose)

    var trans4 = _xvizTrajectoryHelper.getRelativeCoordinates([[-object_width,-object_depth,0]],basepose)
    var Trans4 = _xvizTrajectoryHelper.getRelativeCoordinates(trans4,transformpose)
    

    transform_vertices = [[transform_coord[0].x + Trans1[0].x , transform_coord[0].y+ Trans1[0].y , 0],
                           [transform_coord[0].x + Trans2[0].x, transform_coord[0].y + Trans2[0].y, 0],
                           [transform_coord[0].x + Trans3[0].x, transform_coord[0].y + Trans3[0].y, 0],
                           [transform_coord[0].x + Trans4[0].x, transform_coord[0].y + Trans4[0].y, 0]]
    
    return {label_position, transform_vertices}
    

    xvizBuilder
    .primitive(Arrow_STREAM)
    .polyline(tarnsline)
    .style(
        {stroke_color:'#FEC56480'       //orange transform coordinate
        })
    
    xvizBuilder
    .primitive(Arrow_STREAM)
    .polyline(tarnsline2)
    .style(
            {
                stroke_color: '#7DDDD7'     //blue object IMU
            })
    xvizBuilder
    .primitive(Arrow_STREAM)
    .polyline(line2)
    .style(
         {
          stroke_color: '#D6A00080'         //salgo object vertices
            })
}

function build_CubeBox(marker,xvizBuilder,i){
    var {x,y,z} = marker.vertices;
    const object_depth = marker.scale.x/2;  //is change
    const object_width = marker.scale.y/2;  //is change
    //var depth = marker.scale.x;
    //var width = marker.scale.y;
    var object_id = [VECHILE_STREAM,i].join('/');
    var object_height = marker.scale.z;
    //build_Arrow(marker,xvizBuilder);
    const TF_Vector = TranformVertices(marker,object_depth,object_width)
    /*
    xvizBuilder.primitive(VECHILE_STREAM)
    .polygon(marker.vertices)
    .classes(marker.object_class.toString())
    .style({
        height: object_height
    })
    .id("transform origin Ego realtive")
    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text("transform origin Ego realtive");*/

    
    //console.log("transform_vertices",transform_vertices2)        
    xvizBuilder.primitive(VECHILE_STREAM)
    .polygon(TF_Vector.transform_vertices)
    .style({
        height: object_height,
    })
    .classes(marker.object_class.toString())
    .id(object_id)

    //build_Arrow(marker,xvizBuilder);

    xvizBuilder.primitive('tracklets_text')
    .position(TF_Vector.label_position)
    .text(object_id)   
}

function build_Sphere(marker,xvizBuilder){
    var {x,y,z} = marker.vertices;
    var object_width = marker.scale.x;
    var object_depth = marker.scale.y;
    var object_id = [VECHILE_STREAM,marker.id].join('/');
    var object_height = marker.scale.z;
    //build_Arrow(marker,xvizBuilder);
    var marker = define_map_origin(marker,object_depth,object_width)
    label_position = [x,y,z+object_height]

    xvizBuilder.primitive(PEDSTRIAN_STREAM)
    .polygon(marker.vertices)
    .classes(marker.object_class.toString())
    .style({
        height: object_height
    })
    .id(object_id)
    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text(object_id);
/*
    //not use
    var raduis = marker.scale.x/2;
    xvizBuilder.primitive(PEDSTRIAN_STREAM)
    .circle(marker.vertices, raduis)
    .classes(marker.object_class.toString())

    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text(object_id);*/
}

function radToDegree(radian) {
    return radian * (180 / Math.PI)
}

var flag = true;
// add a new location message 
function addLocationToCache(lat, lng, alt, roll, ptich, yaw,speed,steering, accel, time) {

    _locationCache = {
        latitude: lat,
        longitude: lng,
        altitude: alt,
        roll: roll,
        ptich: ptich,
        yaw: yaw,
        x_dir_velocity: speed,
        degree_of_steering: steering,
        x_dir_accelation :accel,
        timestamp: time,
    };
    if (flag && _locationCache){
        //object_build_helper.getStartVehiclePose(_locationCache)
        flag = false
    }
    
    //console.log("new pose (time, lat, lng, heading): ", time, lat, lng, heading)
}

//Gwang - make addLidarDataToCache
//아마도 lidar는 points, colors를 가지고 XVIZ를 만드는것으로 파악이된다.
function addLidarDataToCache(pt, col) {

    _lidarCache = {
        points: pt,
        colors: col,
    };
    //console.log("new lidar data (point, pointSizem ids_uint32): ", pt, col);
    //console.log("new lidar data (point, pointSizem ids_uint32): ", pt, col,ids_uint32);
}
//jaekeun image_data (base64), width (resized width), height(resized height)
function add_cameraImageCache(image_data, width, height){
    //console.log("camera information update!")
    //console.log(_cameraImageCache)
    _cameraImageCache = {
        image_data: image_data,
        width: width,
        height: height  
    };
}

function tryServeFrame(){
    // frame is ready, serve it to all live connections
    let xvizBuilder = new XVIZBuilder({metadata: _metadata});
    if (_locationCache) {
        xvizBuilder.pose('/vehicle_pose')
        .timestamp(_locationCache.timestamp)
            .mapOrigin(_locationCache.longitude, _locationCache.latitude, _locationCache.altitude)
            .position(0,0,0)//.orientation(_locationCache.roll,_locationCache.pitch,_locationCache.yaw)
            .orientation(0,0,_locationCache.yaw);

        xvizBuilder.timeSeries('/vehicle/velocity')
        .timestamp(_locationCache.timestamp)
            .value(_locationCache.x_dir_velocity);
        
        xvizBuilder.timeSeries('/vehicle/acceleration')
        .timestamp(_locationCache.timestamp)
            .value(_locationCache.x_dir_accelation);

        xvizBuilder.timeSeries('/vehicle/wheel_angle')
        .timestamp(_locationCache.timestamp)
            .value(_locationCache.degree_of_steering);

        if (_trajectoryCache) {
            xvizBuilder.primitive('/vehicle/trajectory').polyline(_trajectoryCache);
        } else {
            //xvizBuilder.primitive('/vehicle/trajectory').polyline([[2*Math.cos(_locationCache.heading), 2*Math.sin(_locationCache.heading), 0], [10*Math.cos(_locationCache.heading), 10*Math.sin(_locationCache.heading), 0]]);
        }
        if (_ObstaclesCache) {
            for (i=0;i<_ObstaclesCache.length;i++){
                //console.log(_ObstaclesCache[i])
                ObjectType_Builder(_ObstaclesCache[i],xvizBuilder,i)
                /*xvizBuilder.primitive('tracklets_text').position([_ObstaclesCache[i][0],_ObstaclesCache[i][1],3])
                .text(object_id);*/
            }
        }
        //jaeketun revise camera xvizbuilder
        if (_cameraImageCache) {
            //console.log("image data", nodeBufferToTypedArray(_cameraImageCache.image_data))
            xvizBuilder.primitive('/camera/image_00').
                image(nodeBufferToTypedArray(_cameraImageCache.image_data), 'png')
                .dimensions(_cameraImageCache.width,_cameraImageCache.height)
                .position([1, 1, 1]);
            //_newCameraImageFlag = false;
            //console.log("serving image ", _cameraImageCache.length);
        }

        //Gwang - add lidar XvizBuilder
        if (_lidarCache) {
            xvizBuilder
                .primitive('/lidar/points')
                //.primitive('/point-cloud')
                .points(_lidarCache.points)
                //.colors(_lidarCache.colors)
                //.ids(_lidarCache.ids)
                .style({fill_color : '#00ff00aa'});
                //.colors(fill_color : '#00ff00aa')
                //.colors(_lidarCache.colors)
        }
        //console.log(xvizBuilder.getMessage());
        const xvizFrame = encodeBinaryXVIZ(xvizBuilder.getFrame(),{});
        //console.log("frame time",_frameTimer)
        //const xvizFrame = JSON.stringify(xvizBuilder.getFrame());
        //console.log(xvizFrame);
        _connectionMap.forEach((context, connectionId, map) => {
            context.sendFrame(xvizFrame);
            _locationCache = null
            _lidarCache = null
        });
    }
    return;
}
//define object's status
function object_type_info(type,i){
    //object = person
    if (type ==0){
        object_width = 1.4;
        object_depth = 1.2;
        object_id = [NAMESPACE_PEDSTRIAN,i].join('/')
        object_height = 2.5;
    //object = vechile
    }else if (type ==1){
        object_width = 1.8;
        object_depth = 3.6;
        object_id = [NAMESPACE_VECHILE,i].join('/')
        object_height = 2;
    //object =obstacle
    }else if (type ==2){
        object_width = 2;
        object_depth = 2;
        object_height = 2;
        object_id = [NAMESPACE_OBSTACLE,i].join('/')
    }
}

//using camrea xviz builder (base64 -> uint8Array (camera input type))
function nodeBufferToTypedArray(buffer){
    const typedArray = new Uint8Array(buffer);
    return typedArray;
}

class ConnectionContext {
    constructor() {
        this.connectionID = connectionId();
        this.t_start_time = null;
        this.initConnection.bind(this);
        this.onClose.bind(this);
        this.onMessage.bind(this);
        this.sendFrame.bind(this);
    }
    log(msg) {
        const prefix = `[id:${this.connectionID}]`;
        console.log(`${prefix} ${msg}`);
    }
    initConnection(ws) {
        this.log('> New connection from Client.');
        
        this.t_start_time = process.hrtime();
        this.ws = ws;

        ws.on('close', event => this.onClose(event));
    
        // Respond to control messages from the browser
        ws.on('message', msg => this.onMessage(msg));
    
        // On connection send metadata
        this.ws.send(JSON.stringify({
            type: "xviz/metadata",
            data: _metadata}), {compress: true});
        
        // add this connection context into global map
        _connectionMap.set(this.connectionID, this);

        // 'live' mode will not get the 'xviz/transform_log' message
        // so start sending immediately
        // sending will be triggered by new messages coming to server
    }
    
    onClose(event) {
        this.log(`> Connection Closed. Code: ${event.code} Reason: ${event.reason}`);
        _connectionMap.delete(this.connectionID);
    }
    
    onMessage(message) {
        const msg = JSON.parse(message);
        this.log(`> Message ${msg.type} from Client`);
        switch (msg.type) {
            case 'xviz/start': {
                // not sure why but there is no logic in Uber's example for start message
                break;
            }
            case 'xviz/transform_log': {
                // we are doing live streaming so no need to handle transform_log
                // ref: https://avs.auto/#/xviz/protocol/schema/session-protocol
                break;
            }
            default:
                this.log(`|  Unknown message ${msg}`);
        }
    }
    sendFrame(frame) {
        if (frame instanceof Buffer) {
            this.ws.send(frame);
        } else {
            this.ws.send(frame, {compress: true});
        }
        //this.log(`< sent frame.`);
    }
}
function sleep(t){
    return new Promise(resolve=>setTimeout(resolve,t));
 }
 
module.exports = {
    startListenOn: function (portNum) {
        console.log(`xviz server starting on ws://localhost:${portNum}`);
        if (_wss) {
            console.log("startListenOn can only be called one time")
            process.exit(-1);
        }

        _wss = new WebSocket.Server({port: portNum});
        // Setups initial connection state
        _wss.on('connection', ws => {
            const context = new ConnectionContext();
            context.initConnection(ws);
        });
        //_frameTimer = setInterval(tryServeFrame, 30);
    },

    close: function(){
        console.log("xviz server shutting down");
        //learInterval(_frameTimer);
        _wss.close();
    },
    //jaekeun - car status approach
    updateLocation: function(lat, lng, alt, roll, pitch, yaw, speed, steering, accel, time) {
        addLocationToCache(lat, lng, alt, roll, pitch, yaw,  speed, steering, accel, time);
        tryServeFrame();
    },
    //Gwnag - Lidar approach
    updateLidar : function(pt, col)  {
        addLidarDataToCache(pt, col);
        //console.log("new updatelidar data (point, color): ", pt, col)
        tryServeFrame();

    },

    updateCarPath: function(positions) {
        _trajectoryCache = positions;
    },

    updateObstacles: function(obj_list) {
        _ObstaclesCache = obj_list;
    },

    updateCameraImage: function(image_data,width,height) {
        //console.log("new image ", image_data.length);
        // Initialize a new ImageData object
        add_cameraImageCache(image_data, width, height)
        tryServeFrame();
    }
};