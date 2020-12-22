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
// GPS data not use
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
//location name space//
//name : '/navsat/fix'
//name : '/vehicle/gps/fix' 
//name : '/filter/positionlla'

//mkz
//name : '/imu/data'
//name :'/filter/twist'

const rosBridgeClient = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

// for car location in (latitude and longitude) or (X,Y,Z : UTM)
const listener = new ROSLIB.Topic({
    ros : rosBridgeClient,
    name : '/current_pose'
});
// for car location in UTM coordinate and orientation
const listener2 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/imu/data_raw '
});

// for car forward x velocity (TwistStamped based)
const listener3 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/twist'

});
// for car acceleration
const listener4 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/filtered_accel'
});
// for car Steering angle (dbw_mkz_msgs/SteeringReport)
const listener5 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/steering_report'
});
const listener6 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/points_raw'
});
/*
// for camera image
const listener7 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/usb_cam/image_raw'
});*/

// for obstacle information(type visual_marker_array)
const listener8 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/detection/lidar_tracker/objects/visualization'
});
const listener9 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/detection/lidar_tracker/objects'
});

// for planned path in UTM coordinate
const listener10 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/global_waypoints_rviz'
});

const listener11 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/usb_cam/image_compressed/compressed'
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

    //car current pose (global map UTM pose)
    car_pos_utm = message.pose.position
    let {x,y,z} = car_pos_utm;
    
    //GPS converter UTM => WGS
    let wgs84_data = utmobj.convertUtmToLatLng(x+450850,y+3951350,52,'S');
    //let wgs84_data = utmobj.convertUtmToLatLng(450850,951350,52,'S');
    let {lat,lng} = wgs84_data
    
    //car orientation (heading) 
    vehicle_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(message.pose.orientation)
    roll = vehicle_heading_list[0]
    pitch = vehicle_heading_list[1]
    yaw = vehicle_heading_list[2]
    
    //local path define
    /*if(localPath_marker){
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
    }*/
    xvizServer.updateLocation(lat, lng, z, roll, pitch, yaw, x_dir_velocity ,steering_degree, x_dir_acl, parseFloat(timestamp));
    /*
    if you use another ROS Topic use this
    //mkz_rosbag - filer postionlla
    let {x,y,z} = message.vector
    xvizServer.updateLocation(x, y, z, roll, pitch, yaw, x_dir_velocity ,steering_degree, x_dir_acl, parseFloat(timestamp));
    
    //mkz_rosbag - gps-navfix
    let {latitude,longitude,altitude} = message
    xvizServer.updateLocation(latitude, longitude, altitude, roll, pitch, yaw, x_dir_velocity ,steering_degree, x_dir_acl, parseFloat(timestamp)); 
    */
  });

/*
//listener 2 is the orientation of the car, location in UTM and orientation
listener2.subscribe(function (message) {
  //let orientation = message.pose.pose.orientation;
  vehicle_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(message.orientation);
  roll = vehicle_heading_list[0]
  pitch = vehicle_heading_list[1]
  yaw = vehicle_heading_list[2]
});*/

//TwistStamped
listener3.subscribe(function (message){
  var velocity = message.twist.linear
  velocity = ObjConveter.velocityPostProcessing(velocity)
  x_dir_velocity = velocity.x * 3.6; // m/s -> km/h
});
//fillered accel
listener4.subscribe(function (message){
  x_dir_acl = message.data;
});
//SteeringReport
listener5.subscribe(function (message){
  steering_degree = Calculator.radToDegree(message.steering_wheel_angle)
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
})
/*
listener7.subscribe(function(message) {
  const data_ = toUint8Array(message.data)
  const data = Buffer.from(data_);
  //console.log(data)
  ImageConverter.createSharpImg(data);
});*/
/*
//LiDAR Object detection // msg type: maker_array msg 
listener8.subscribe(function (message) {
  marker_obstacles=[]
  for (let i = 0; i < message.markers.length; i++) {
    let {ns, id,points,scale } = message.markers[i];
    let { x, y, z } = message.markers[i].pose.position;
    var orientation = message.markers[i].pose.orientation
    var object_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(orientation)
    let marker_class
    if (car_pos_utm){
      var obj = ObjConveter.marker_type_redefine(message.markers[i],object_heading_list[2])

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
        orientation: orientation,
        object_class: obj.marker_class,
        object_build: obj.marker_build,
        scale: scale,
        velocity: obj.velocity_obj
      }
      marker_obstacles.push(marker_obj)
    }
  }
  if (marker_obstacles.length > 0) {
    xvizServer.updateObstacles(marker_obstacles);
  } else {
    xvizServer.updateObstacles(null);
  }
});*/

//LiDAR Object detection // msg type: autoware_perception msg 
listener9.subscribe(function (message){
  autoware_obstacles = []
  for (let i = 0; i < message.objects.length; i++) {
    let { id, shape, state, semantic} = message.objects[i];
    let { x, y, z } = state.pose_covariance.pose.position
    let orientation_ = state.pose_covariance.pose.orientation
    let velocity = state.twist_covariance.twist
    var object_heading_list = Calculator.QuaternionToRoll_Pitch_Yaw(orientation_)
    
    if (car_pos_utm){
      var velocity_obj = ObjConveter.velocityPreprocessing(velocity,object_heading_list[2])
      var orientation = {
        roll: object_heading_list[0],
        pitch: object_heading_list[1],
        yaw: velocity_obj.callback_yaw,
        yaw_: object_heading_list[2],
        car_yaw: yaw,
        car_pitch : pitch,
        car_roll : roll,
      }
      var autoware_obj = {
        id: id,
        vertices: new Vector3([x - car_pos_utm.x, y - car_pos_utm.y, 0]),
        car_utm: car_pos_utm,
        orientation: orientation,
        object_class: semantic.type,
        object_build: shape.type,
        scale: shape.dimensions,
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

listener10.subscribe(function(message) {
  localPath_marker = message.markers
});

listener11.subscribe(function (message){
  const data_ = toUint8Array(message.data)
  const data = Buffer.from(data_);
  const format = message.format;
  xvizServer.updateCompressedImage(data, format)
})

function gracefulShutdown() {
  console.log("shutting down rosbridge-xviz-connector");
  listener.unsubscribe();
  listener2.unsubscribe();
  listener3.unsubscribe();
  listener4.unsubscribe();
  listener5.unsubscribe();
  listener6.unsubscribe();
  //listener7.unsubscribe();
  listener8.unsubscribe();
  listener9.unsubscribe();
  //listener10.unsubscribe();
  listener11.unsubscribe();

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