const ROSLIB = require("roslib");
const xvizServer = require('./xviz-server');
//import ROSLIB from "roslib";
//import xvizServer from "./xviz-server.js"
//const sharp = require('sharp');
const Parser = require('binary-parser').Parser;
const parser = new Parser().floatle();
var toUint8Array = require('base64-to-uint8array')

/***********Gwang - import parser to use parser.parse***************** */
//require('@babel/register');
//require('babel-polyfill');
//import pkg from 'binary-parser'
//const {Parser: BinaryParser} = pkg;
//import {Parser as BinaryParser} from 'binary-parser';
//const parser = new BinaryParser().floatle();

//const parse = require('html-react-parser');



//let car_heading_utm_north = 0; // global variable that stores heading/orientation of the car
let x_dir_velocity = 0;
let x_dir_acl = 0;
let steering_degree = 0;
let car_pos_utm = null; // global variable that stores car location in UTM
let plannedPath = null; // global variable that hold an array of planned path
let img = null;
let pointcloud = null;
let roll = null;
let yaw = null;
let pitch = null;


const rosBridgeClient = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

// for car location in latitude and longitude
const listener = new ROSLIB.Topic({
    ros : rosBridgeClient,
    //name : '/navsat/fix'
    //name : '/vehicle/gps/fix' 
    name : '/filter/positionlla'
});

// for planned path in UTM coordinate
const listener2 = new ROSLIB.Topic({
    ros : rosBridgeClient,
    name : '/PathPlanner/desired_path'
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

// for obstacle information
/*
const listener5 = new ROSLIB.Topic({
    ros : rosBridgeClient,
    name : '/planner_obstacles'
});
*/

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
  //name : '/vehicle/twist'
  name :'/filter/twist'
});

// for car Steering angle (dbw_mkz_msgs/SteeringReport)
const listener8 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/vehicle/steering_report'
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


listener.subscribe(function(message) {
    //var msgNew = 'Received message on ' + listener.name + JSON.stringify(message, null, 2) + "\n";
    //////let let is chanagble not const////
    let timestamp = `${message.header.stamp.secs}.${message.header.stamp.nsecs}`;
    let {x, y, z} = message.vector
    //console.log('GPS data test')
    //console.log(message.latitude, message.longitude, message.altitude,parseFloat(timestamp));
    xvizServer.updateLocation(x, y, z, roll, pitch, yaw, x_dir_velocity ,steering_degree, x_dir_acl, parseFloat(timestamp));
});
listener2.subscribe(function(message) {
    plannedPath = message.poses;
});
/*
listener3.subscribe(function(message) {
  //document.getElementById("camera-image").src = "data:image/jpg;base64,"+message.data;
  let {width, height} = message;
  const data_ = toUint8Array(message.data)
  const data = Buffer.from(data_);
  //console.log(data)
  //console.log(Buffer.isBuffer(data_))
  //sleep(100000)
  createSharpImg(data);
});*/

//listener 4 is the odometry of the car, location in UTM and orientation
listener4.subscribe(function (message) {
    //let orientation = message.pose.pose.orientation;
    roll, pitch, yaw = QuaternionToRoll_Pitch_Yaw(message.orientation);
    // quaternion to heading (z component of euler angle) ref: https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    // positive heading denotes rotating from north to west; while zero means north
    //car_heading_utm_north = Math.atan2( 2*( orientation.z * orientation.w + orientation.x * orientation.y), 1 - 2 * ( orientation.z * orientation.z + orientation.y * orientation.y ));
    //console.log('car_heading_utm_north');
    //console.log(car_heading_utm_north);
    /*
    if (plannedPath) {
        // if plannedPath is a valid array, then find the trajectory to display 
        // that within 100m of the car's current location in front
        trajectory = [];
        car_pos_utm = message.pose.pose.position;
        for (i=0;i<plannedPath.length;i++){
            if ( distance(plannedPath[i].pose.position, car_pos_utm) < 100 
                && isInFront(car_pos_utm, car_heading_utm_north, plannedPath[i].pose.position) ) {
                trajectory.push([
                    plannedPath[i].pose.position.x - car_pos_utm.x, plannedPath[i].pose.position.y - car_pos_utm.y, 0 ]
                );
            }
        }

        if (trajectory.length > 0) {
            xvizServer.updateCarPath(trajectory);
        } else {
            xvizServer.updateCarPath(null);
        }
    }
    */
});
/*
listener5.subscribe(function (message) {
    obstacles = [];
    for (i=0;i<message.markers.length;i++){
        let markerPos = message.markers[i].pose.position;
        if (markerPos.x>0 && markerPos.y >0) {
            obstacles.push([
                markerPos.x - car_pos_utm.x,
                markerPos.y - car_pos_utm.y,
                markerPos.z
            ]);
        }
    }
    if (obstacles.length>0){
        xvizServer.updateObstacles(obstacles);
    } else {
        xvizServer.updateObstacles(null);
    }
});
*/

listener5.subscribe(function (message){
  x_dir_acl = message.data;
});

listener6.subscribe(function (message){
  //lidar sensor에 대한 xviz converter를 정의하는 function
  pointcloud = message.is_dense;
  //console.log("pointcloud :");
  //console.log("function updateLIdar start");
  var load_lidar_data_return = []
  load_lidar_data_return = load_lidar_data(message)
  const positions = (load_lidar_data_return[0]);
  const colors = (load_lidar_data_return[1]);
  //console.log("postionts", positions);
  //var pointSize = load_lidar_data_return[1];
  xvizServer.updateLidar(positions, colors);
  //console.log("function updateLIdar finished");
  //sleep(100);

});

//TwistStamped
listener7.subscribe(function (message){
  x_dir_velocity = message.twist.linear.x * 3.6; // m/s -> km/h
});

//SteeringReport
listener8.subscribe(function (message){
  steering_degree = radToDegree(message.steering_wheel_angle)
});

let maxHeight = null;
let maxWidth = null;
//base64 type image(94312) => compressed image (base64, png, resize)
async function createSharpImg(data) {

  const width = 1920;
  const height = 1080;
  const { resizeWidth, resizeHeight } = getResizeDimension(width, height, maxWidth, maxHeight);
  //console.log("resize data",resizeWidth,resizeHeight);
  const image = await sharp(data, {
    raw: {
      width,
      height,
      channels: 3
    }
  })
    //.raw()
    .png()
    .resize(resizeWidth, resizeHeight)
    .toFormat('png')
    .toBuffer();
  xvizServer.updateCameraImage(image, resizeWidth, resizeHeight);
  //xvizServer.updateCameraImage(img,width_,height_);
}

function QuaternionToRoll_Pitch_Yaw(message){
  const {x, y, z, w} =  message;
  //console.log(x,y,z,w)
  const roll_ = Math.atan2(2*x*w + 2*y*z, 1 - 2*x*x - 2*y*y);
  const pitch_ =  Math.asin(2*w*y + 2*z*x);
  const yaw_ = Math.atan2(2*z*w + 2*x*y, 1 - 2*y*y - 2*z*z);
  return roll_, pitch_, yaw_;
}


function getResizeDimension(width__, height__){
  const ratio = width__/height__;
  let resizeWidth = null;
  let resizeHeight = null;

  if (maxHeight > 0 && maxWidth > 0) {
    resizeWidth = Math.min(maxWidth, maxHeight * ratio);
    resizeHeight = Math.min(maxHeight, maxWidth / ratio);
  }
  else if (maxHeight > 0) {
    resizeWidth = maxHeight * ratio;
    resizeHeight = maxHeight;
  }
  else if (maxWidth > 0) {
    resizeWidth = maxWidth;
    resizeHeight = maxWidth / ratio;
  }
  else {
    resizeWidth = width__;
    resizeHeight = height__;
  }
  return {
    resizeWidth: Math.floor(resizeWidth),
    resizeHeight: Math.floor(resizeHeight)
  };
}

function radToDegree(radian){
  return radian*(180/Math.PI)
}

function readBinaryData(binary) {
  //XVIZ API REFERENCE에 필요한 함수

  const res = [];
  //console.log("binary.length : ",binary.length)
  for (let i = 0; i < binary.length/1000; i = i + 4) {
    if (i + 4 > binary.length) {
      break;
    }
    //console.log("befor slice : ",binary.length)
    var buf = Buffer.from(binary);
    const parsed = parser.parse(buf.slice(i, i + 4));
    //console.log("after slice : ",binary.length)
    res.push(parsed);
  }
  return res;
}

function toBuffer(ab) {
  //Uint8Array to Buffer
  var buf = Buffer.alloc(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
  }
  return buf;
}

function str2ab(str) {
  //ArrayBuffer to Uint8Array
  var buf = new ArrayBuffer(str.length); // 2 bytes for each char
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function base64toFloat32array(b64) {
  /**매개변수 정의
   * b64 : rosbridge를 거치며 base64로 encoding된 data
   * 
   * 1002 : getfloat64 로 함수 변경하여 동작 확인해보기
   */

  var b64length = b64.length / Float32Array.BYTES_PER_ELEMENT;
  var dView = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
  var f32arr = new Float32Array(b64length);
  var p = 0;

  for (let i = 0; i < b64length; i++) {
    p = i * 4;
    dView.setUint8(0, b64.charCodeAt(p));
    dView.setUint8(1, b64.charCodeAt(p + 1));
    dView.setUint8(2, b64.charCodeAt(p + 2));
    dView.setUint8(3, b64.charCodeAt(p + 3));
    f32arr[i] = dView.getfloat32(0, true);
  }
  return f32arr;
}

function load_lidar_data(lidar_msg) {

  //const pointSize = Math.round(lidar_msg.data.length / (lidar_msg.height * lidar_msg.width));
  //console.log("Enter load_lidar_Data function");
  const pointSize = lidar_msg.point_step;
  const pointsCount = lidar_msg.row_step / pointSize;
  
  let points_binary = [];
  let intensity_binary = [];
  //let colors = []; //colors 변경
  const colors = new Uint8Array(3 * pointsCount).fill(255);
  let interval = 32;

  //var F32arr_lidarmsg = base64toFloat32array(lidar_msg.data);
  //var buf = Buffer.from(F32arr_lidarmsg);

  const Uint8arr = toUint8Array(lidar_msg.data) //uint8 buffer
  const buf = Buffer.from(Uint8arr);

  //console.log("(lidar_msg.data.length, lidar_msg.point_step)",lidar_msg.data.length, lidar_msg.point_step);
  //parser.parse용 for문
    //for (let i = 0; i < lidar_msg.data.length; i += lidar_msg.point_step) {

  //readFloatLE용 for문
    for (let i = 0; i < pointsCount; i++) {

    //const x = parser.parse(buf.slice(i, i + 4));
    //const y = parser.parse(buf.slice(i + 4, i + 8));
    //const z = parser.parse(buf.slice(i + 8, i + 12));
    //console.log("function updateLIdar x= ", x);
    //console.log("function updateLIdar y= ", y);
    //console.log("function updateLIdar z= ", z);

    const xLE = buf.readFloatLE(i * pointSize);
    const yLE = buf.readFloatLE(i * pointSize + 4);
    const zLE = buf.readFloatLE(i * pointSize + 8);
    //console.log("function updateLIdar xLE= ",xLE);
    //console.log("function updateLIdar yLE= ", yLE);
    //console.log("function updateLIdar zLE= ", zLE);

    //parser.parse용
    //points_binary.push(x);
    //points_binary.push(y);
    //points_binary.push(z);

    //readFloatLE용
    points_binary.push(xLE);
    points_binary.push(yLE);
    points_binary.push(zLE);

    //intensity는 구현해야야 함
    const reflectance = buf.readFloatLE(i * pointSize + 16);
    colors[i * 3 + 0] = 80 + reflectance * 80;
    colors[i * 3 + 1] = 80 + reflectance * 80;
    colors[i * 3 + 2] = 80 + reflectance * 60;


    //const ring = parser.parse(buf.slice(i+20, i+24));
    //console.log("function updateLIdar parse intensity finished");
    //intensity_binary.push(intensity);
  }
  const points = new Float32Array(points_binary);
  //console.log("points array =", points);
  const intensity_float = new Float32Array(intensity_binary);
  /*  
  for (let i = 0; i < intensity_float.length; ++i) {
      colors.push(255 - intensity_float[i]); // r
      colors.push(intensity_float[i]); // g
      colors.push(0); // b
      colors.push(255); // a
  }*/

  return [points, colors];
  

  /***************************XVIZ API reference************************/

  /****************1. position color를 직접 parsing*********************/
  /*const binary = readBinaryData(lidar_msg.data);
  const float = new Float32Array(binary);
  const size = Math.round(binary.length / 4);
  let points_binary = [];

  const positions = new Float32Array(3 * size);
  const colors = new Uint8Array(4 * size).fill(255);

  console.log("size", size);
  //consol.log(top -b -n1 | grep -Po '[0-9.]+ id' | awk '{print 100-$1}');


  for (let i = 0; i < size; i ++) {
    positions[i * 3 + 0] = float[i * 4 + 0];
    console.log("positions[i * 3 + 0] : ", positions[i * 3 + 0]);
    positions[i * 3 + 1] = float[i * 4 + 1];
    console.log("positions[i * 3 + 1] : ", positions[i * 3 + 1]);
    positions[i * 3 + 2] = float[i * 4 + 2];
    console.log("positions[i * 3 + 2] : ", positions[i * 3 + 2]);

    const reflectance = Math.min(float[i * 4 + 3], 3);
    colors[i * 4 + 0] = 80 + reflectance * 80;
    colors[i * 4 + 1] = 80 + reflectance * 80;
    colors[i * 4 + 2] = 80 + reflectance * 60;
  }
  return [positions, colors];*/
  /*************************************************************************/


  /****************2. position color를 logic으로 parsing*********************/
  /*const binary = readBinaryData(lidar_msg.data);
  console.log("readBinaryData is Done");
  const float = new Float32Array(binary);
  const size = Math.round(binary.length / 4);

  // We could return interleaved buffers, no conversion!
  const positions = new Array(size);
  const colors = new Array(size);

  console.log("size : ", size);

  for (let i = 0; i < size; i++) {
    positions[i] = float.subarray(i * 4, i * 4 + 3);

    const reflectance = Math.min(float[i * 4 + 3], 3);
    colors[i] = [80 + reflectance * 80, reflectance * 80, reflectance * 60];
  }
  console.log("return positions, colors");
  return {positions, colors};*/
  /*************************************************************************/

  /***************************XVIZ API reference************************/

}

function distance(UTMlocation1, UTMlocation2) {
    let delta_x = UTMlocation2.x - UTMlocation1.x; // UTM x-axis: easting
    let delta_y = UTMlocation2.y - UTMlocation1.y; // UTM y-axis: northing
    // ignoring z value
    return Math.sqrt( delta_x * delta_x + delta_y * delta_y );
}
// return a boolean that will be true if targetLocation is in front of carLocation
// give the heading of the car (zero points to north and positive denotes rotating to west)
function isInFront(carLocationUTM, heading, targetLocationUTM) {
    let delta_x = targetLocationUTM.x - carLocationUTM.x;
    let delta_y = targetLocationUTM.y - carLocationUTM.y;
    return ( -Math.sin(heading) * delta_x + Math.cos(heading) * delta_y > 0 );
}
function gracefulShutdown() {
  console.log("shutting down rosbridge-xviz-connector");
  listener.unsubscribe();
  listener2.unsubscribe();
  //listener3.unsubscribe();
  listener4.unsubscribe();
  //listener5.unsubscribe();
  rosBridgeClient.close();
  xvizServer.close();
}

function sleep (delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

/* *******************************************
    example messages from autoronto rosbag
   *******************************************
/navsat/fix
{
  "status": {
    "status": 1,
    "service": 1
  },
  "altitude": 199.7761318050325,
  "longitude": -79.49318405488258,
  "position_covariance": [
    0.0010528246732758456,
    0,
    0,
    0,
    0.0009475859465466786,
    0,
    0,
    0,
    0.003330984526718331
  ],
  "header": {
    "stamp": {
      "secs": 1547842797,
      "nsecs": 343172073
    },
    "frame_id": "odom",
    "seq": 8657
  },
  "latitude": 43.77244162032462,
  "position_covariance_type": 2
}


Sample message for path planner 

"header": {
    "stamp": {
      "secs": 1543772146,
      "nsecs": 74801286
    },
    "frame_id": "odom",
    "seq": 315
  },
  "poses": [
    {
      "header": {
        "stamp": {
          "secs": 1543772146,
          "nsecs": 74801286
        },
        "frame_id": "odom",
        "seq": 0
      },
      "pose": {
        "position": {
          "y": 4848835.091953225,
          "x": 623524.6569839834,
          "z": 191
        },
        "orientation": {
          "y": 0,
          "x": 0,
          "z": -0.15122290308358546,
          "w": 0.9884996882058044
        }
      }
    },
    ...
  ]
******************************************* */
/*
    [
      { datatype: 7,  count: 1,name: 'x', offset: 0 },
      { datatype: 7,  count: 1,name: 'y',, offset: 4 },
      { datatype: 7,  count: 1,name: 'z',   offset: 8 },
      { datatype: 7,  count: 1,name: 'intensity', offset: 16 },
      { datatype: 4,  count: 1,name: 'ring',   offset: 20 } ]
      
      false
      31
      3926976


*/
/*
{
  "update_type": "snapshot", "updates":
  [
    {
      "timestamp": 1597898167.7841446, "poses":
      {
        "/vehicle_pose":
        {
          "timestamp": 1597898167.7841446, 
          "mapOrigin":
          {
            "longitude": 128.45556833333333,
            "latitude": 35.70366333333333,
            "altitude": 6
          }
          , "position": [0, 0, 0], "orientation": [0, 0, 1.57]
        }
      }, "primitives":
      {
        "/lidar/points":
        {
          "points":
            [
              {
                "points":
                {
                  "positions":
                  {
                    "0": 78.37200164794922,
                    "1": 8.07800006866455,
                    "2": 2.872999906539917,
                    "3": 77.81600189208984,
                    "4": 9.630000114440918,
                    "5": 2.8610000610351562,
                    "6": 71.74400329589844,
                    "7": 10.137999534606934,
                    "8": 2.6589999198913574,
                    "9": 71.82499694824219,
                    "10": 10.380000114440918,
                    "11": 2.6630001068115234,
                    "12": 71.86499786376953,
                    "13": 10.616000175476074,
                    "14": 2.6659998893737793,
                    "15": 71.88899993896484
                  }, 
                    "pointSize": 32
                }, "base":
                {
                  "style":
                    { "fill_color": "#333333" }
                }
              }
            ]
        }
      }
    }
  ]
}*/
