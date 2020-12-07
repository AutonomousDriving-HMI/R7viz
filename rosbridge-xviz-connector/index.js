const ROSLIB = require("roslib");
const xvizServer = require('./xviz-server');
const Parser = require('binary-parser').Parser;
const parser = new Parser().floatle();
const toUint8Array = require('base64-to-uint8array')
const utmConverter = require('utm-latlng');
const {Vector3,_Euler} = require('math.gl')
const _ = require('lodash')
var math = require("math.gl");

const ImageConverter = require("./XVIZ_Converter/xviz-image_converter")
const LidarConverter = require("./XVIZ_Converter/xviz-lidar_converter")
const ObjConveter= require('./XVIZ_Converter/xviz-object_converter')
const Calculator = require("./Calculator")

const object_transform_helper = require('./XVIZ_Converter/xviz-object_coordinate_transform')
//global variable
/*
0. utmobj: WGS Converter object(UTM -> WGS)
1. car_pos_utm: current vechile global position (UTM coordinate Pose.x, Pose.y, Pose.z)
2. localPathMaker: array of local path (WGS coordinate Pose.x, Pose.y, Pose.z)
3. roll yaw pitch: current vechile orientation (result of convertation quaternion into euler angle)
4. velocity, acl, steering anlgle : car current status
*/
// UTM data
var utmobj = new utmConverter();
let car_pos_utm = null; 
let localPath_marker = null;
// GPS data
let longitude = null;
let latitude = null;
// orientation data (euler angle)
let roll = null;
let yaw = null;
let pitch = null;
// car status data
let x_dir_velocity = 0;
let x_dir_acl = 0;
let steering_degree = 0;

let pointcloud = null;

const rosBridgeClient = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

// for car location in (latitude and longitude) or (X,Y,Z : UTM)
const listener = new ROSLIB.Topic({
    ros : rosBridgeClient,
    //name : '/navsat/fix'
    //name : '/vehicle/gps/fix' 
    //name : '/filter/positionlla'
    name : '/current_pose'
});

// for planned path in UTM coordinate
const listener2 = new ROSLIB.Topic({
    ros : rosBridgeClient,
    name : '/global_waypoints_rviz'
});

// for camera image
const listener3 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/usb_cam/image_raw'
});

// for car location in UTM coordinate and orientation
const listener4 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  //name : '/navsat/odom'//there is another topic '/imu/data' that has orientation
  name : '/imu/data'
  //name : '/vehicle/imu/data_raw '
});

// for car acceleration
const listener5 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/filtered_accel'
});

const listener6 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/points_raw'
});

// for car forward x velocity (TwistStamped based)
const listener7 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/twist'
  //name :'/filter/twist'
});

// for car Steering angle (dbw_mkz_msgs/SteeringReport)
const listener8 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/steering_report'
});

// for obstacle information(type visual_marker_array)
const listener9 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/detection/lidar_tracker/objects/visualization'
  //name : '/planner_roads'   //make point data
});

const listener10 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/detection/lidar_tracker/objects'
});

xvizServer.startListenOn(8081);

process.on('SIGTERM', gracefulShutdown);      //is not supported on Windows
process.on('SIGINT', gracefulShutdown);       //ctrl c

rosBridgeClient.on('connection', function() {     //event name and function
    console.log('Connected to rosbridge websocket server.');
});

rosBridgeClient.on('error', function(error) {
    console.log('Error connecting to rosbridge websocket server: ', error);
});

rosBridgeClient.on('close', function() {
    console.log('Connection to rosbridge websocket server closed.');
});


listener.subscribe(function (message) {
    //var msgNew = 'Received message on ' + listener.name + JSON.stringify(message, null, 2) + "\n";
    let timestamp = `${message.header.stamp.secs}.${message.header.stamp.nsecs}`;
    //let {x,y,z} = message.vector
  
    //car current pose (global map UTM pose)
    car_pos_utm = message.pose.position
    let {x,y,z} = car_pos_utm;
    
    //GPS converter UTM => WGS
    let gps_data = utmobj.convertUtmToLatLng(x+450850,y+3951350,52,'S');
    let gps_data_ = utmobj.convertUtmToLatLng(x,y,52,'S');
    let {lat,lng} = gps_data;
    longitude=gps_data_.lat
    latitude=gps_data_.lng
    console.log("longitude",lat," latitude",lng)
    //car orientation (heading) 
    vehicle_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(message.pose.orientation)
    roll = vehicle_heading_list[0]
    pitch = vehicle_heading_list[1]
    yaw = vehicle_heading_list[2]
    console.log("yaw",yaw)
    //local path define
    if(localPath_marker){
      localPath = [];
      for(let i =0; i<localPath_marker.length; i++){
        var path_pose_utm = localPath_marker[i].pose.position
        if(Calculator.isInFront(car_pos_utm , yaw, path_pose_utm)){
            localPath.push([
              path_pose_utm.x - x,
              path_pose_utm.y - y
            ]);
           }
      }
      if (localPath.length > 0) {
        xvizServer.updateCarPath(localPath);
      } else {
        xvizServer.updateCarPath(null);
      }
    }
    
    //Location_data = UTMXYToLatLon(x+450850,y+3951350,false,52);
    /*var gps_data = L.utm({x: message.pose.position.x, 
                          y: message.pose.position.y,
                          zone: 52,
                          band: 'S'});
    var coord = gps_data.latLng();*/
    //console.log(coord)
    //var latitude = Location_data[0]
    //var longitude = Location_data[1]
    //console.log("GPS",latitude,longitude)
    //longitude = message.longitude;
    //latitude = message.latitude
    //console.log('GPS data test')
    //console.log(message.latitude, message.longitude, message.altitude,parseFloat(timestamp));
    //xvizServer.updateLocation(x, y, z, roll, pitch, yaw, x_dir_velocity ,steering_degree, x_dir_acl, parseFloat(timestamp));
    xvizServer.updateLocation(lat, lng, z, roll, pitch, yaw, x_dir_velocity ,steering_degree, x_dir_acl, parseFloat(timestamp));
});

listener2.subscribe(function(message) {
  localPath_marker = message.markers
});

listener3.subscribe(function(message) {
  let {width, height} = message;
  const data_ = toUint8Array(message.data)
  const data = Buffer.from(data_);
  //console.log(data)
  ImageConverter.createSharpImg(data);
  xvizServer.updateCameraImage(image, resizeWidth, resizeHeight);
});

//listener 4 is the orientation of the car, location in UTM and orientation
listener4.subscribe(function (message) {
    //let orientation = message.pose.pose.orientation;
    vehicle_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(message.orientation);
    roll = vehicle_heading_list[0]
    pitch = vehicle_heading_list[1]
    yaw = vehicle_heading_list[2]
});

listener5.subscribe(function (message){
  x_dir_acl = message.data;
});

//lidar sensor에 대한 xviz converter를 정의하는 function
listener6.subscribe(function (message){
  pointcloud = message.is_dense;
  var load_lidar_data_return = []
  load_lidar_data_return = LidarConverter.load_lidar_data(message)
  const positions = (load_lidar_data_return[0]);
  const colors = (load_lidar_data_return[1]);
  //var pointSize = load_lidar_data_return[1];
  xvizServer.updateLidar(positions, colors);
});
//TwistStamped
listener7.subscribe(function (message){
  var velocity = message.twist.linear
  velocity = ObjConveter.velocityPostProcessing(velocity)
  x_dir_velocity = velocity.x * 3.6; // m/s -> km/h
  
});
//SteeringReport
listener8.subscribe(function (message){
  steering_degree = radToDegree(message.steering_wheel_angle)
});
/*
//makerarray-object detection data
listener9.subscribe(function (message) {
  marker_obstacles=[]
  for (let i = 0; i < message.markers.length; i++) {
    let {ns, id,type,points,scale } = message.markers[i];
    let { x, y, z } = message.markers[i].pose.position;
    var orientation = message.markers[i].pose.orientation
    var object_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(orientation)
    let marker_class
    if(ns=="shape"){
      if(points.length==24){
        //console.log("marker points",message.markers[0].points[0].z)
        //console.log("len",points.length)
      }
      console.log("cylinder len", points.length)
      marker_class=2
    }else if (ns == "twist"){
      marker_class=3
      var velocity_obj = ObjConveter.velocityPreprocessing_marker(points,object_heading_list[2])
    }else{
      marker_class=null
    }
    if (car_pos_utm){
      pose={
        x:x,
        y:y,
        z:z,
      }
      var orientation = {
        roll: object_heading_list[0],
        pitch: object_heading_list[1],
        //yaw: velocity_obj.callback_yaw,
        yaw: object_heading_list[2],
        yaw_: object_heading_list[2],
        car_yaw: yaw,
        car_pitch : pitch,
        car_roll : roll
      }
      var marker_obj ={
        id: [ns, id].join('/'),
        vertices: new Vector3([x - car_pos_utm.x, y - car_pos_utm.y, z]),
        car_utm: car_pos_utm,
        points: points,
        geomatrix: pose,
        orientation: orientation,
        object_class: marker_class,
        object_build: marker_class,
        scale: scale,
        velocity: velocity_obj
      }
      marker_obstacles.push(marker_obj)
    }
  }
  if (marker_obstacles.length > 0) {
    
    xvizServer.updateObstacles(marker_obstacles);
  } else {
    xvizServer.updateObstacles(null);
  }
});
*/
//autoware_perception 
listener10.subscribe(function (message){
  autoware_obstacles = []
  for (let i = 0; i < message.objects.length; i++) {
    let { id, shape, state, semantic} = message.objects[i];
    let { x, y, z } = state.pose_covariance.pose.position
    let orientation_ = state.pose_covariance.pose.orientation
    let velocity = state.twist_covariance.twist
    var object_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(orientation_)
    
    let object_geomatrix = utmobj.convertUtmToLatLng(x - car_pos_utm.x+450850,y - car_pos_utm.y+3951350,52,'S');
    let lat_ = object_geomatrix.lat
    let lng_ = object_geomatrix.lng;
    
    if (car_pos_utm){
      var velocity_obj = ObjConveter.velocityPreprocessing(velocity,object_heading_list[2])
      var vector =[{x: 0, y: 0, z: 0},{x:0 , y:shape.dimensions.y, z:0}]
      var pose={
        x:x,
        y:y,
        z:z,
        lat: lat_,
        lng: lng_
      }
      var orientation = {
        roll: object_heading_list[0],
        pitch: object_heading_list[1],
        yaw: velocity_obj.callback_yaw,
        yaw_: object_heading_list[2],
        car_yaw: yaw,
        car_pitch : pitch,
        car_roll : roll
      }
      var autoware_obj = {
        id: id,
        vertices: new Vector3([x - car_pos_utm.x, y - car_pos_utm.y, z]),
        car_utm: car_pos_utm,
        //geomatrix: pose,
        orientation: orientation,
        object_class: semantic.type,
        object_build: shape.type,
        scale: shape.dimensions,
        points : vector,
        velocity: velocity_obj
      }
  
      autoware_obstacles.push(autoware_obj);
    }
  }
  if (autoware_obstacles.length > 0) {
    xvizServer.updateObstacles(autoware_obstacles);
  } else {
    xvizServer.updateObstacles(null);
  }
});

function gracefulShutdown() {
  console.log("shutting down rosbridge-xviz-connector");
  listener.unsubscribe();
  listener2.unsubscribe();
  listener3.unsubscribe();
  listener4.unsubscribe();
  listener5.unsubscribe();
  listener6.unsubscribe();
  listener7.unsubscribe();
  listener8.unsubscribe();
  listener9.unsubscribe();
  listener10.unsubscribe();

  rosBridgeClient.close();
  xvizServer.close();
}

function sleep (delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

//processing time check function
function requestAnimFrame() {

  if(!lastCalledTime) {
     lastCalledTime = Date.now();
     fps = 0;
     return;
  }
  delta = (Date.now() - lastCalledTime)/1000;
  lastCalledTime = Date.now();
  fps = 1/delta;
}