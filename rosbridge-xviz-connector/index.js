const ROSLIB = require("roslib");
const xvizServer = require('./xviz-server');
//const sharp = require('@sharp');

let car_heading_utm_north = 0; // global variable that stores heading/orientation of the car
let plannedPath = null; // global variable that hold an array of planned path
let img =null;
let pointcloud = null;

const rosBridgeClient = new ROSLIB.Ros({
    url : 'ws://localhost:9090'
});

// for car location in latitude and longitude
const listener = new ROSLIB.Topic({
    ros : rosBridgeClient,
    //name : '/navsat/fix'
    name : '/vehicle/gps/fix' 
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
  name : '/vehicle/imu/data_raw '
});
const listener6 = new ROSLIB.Topic({
  ros : rosBridgeClient,
  name : '/points_raw'
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
    let timestamp = `${message.header.stamp.secs}.${message.header.stamp.nsecs}`;
    xvizServer.updateLocation(message.latitude, message.longitude, message.altitude, car_heading_utm_north, parseFloat(timestamp));
    
});
listener2.subscribe(function(message) {
    plannedPath = message.poses;
});

listener3.subscribe(function(message) {
  let {width, height, data} = message;
  createSharpImg(data,width,height)
});

//listener 4 is the odometry of the car, location in UTM and orientation
listener4.subscribe(function (message) {
    let orientation = message.orientation;
    // quaternion to heading (z component of euler angle) ref: https://en.wikipedia.org/wiki/Conversion_between_quaternions_and_Euler_angles
    // positive heading denotes rotating from north to west; while zero means north
    car_heading_utm_north = Math.atan2( 2*( orientation.z * orientation.w + orientation.x * orientation.y), 1 - 2 * ( orientation.z * orientation.z + orientation.y * orientation.y ));
});

listener6.subscribe(function (message){

  const data = stringToUint8ArrayBuffer(message.data);
  //console.log(data)
  const {height,width} = message;
  const pointsize = data.length/(height * width);
  const pointcount = data.length/pointsize;

  const buf = Buffer.from(data);
  const positions = new Float32Array(3* pointcount);
  const reflectances= new Float32Array(pointcount);
  /*
  for (var i = 0; i <pointcount; i++){
      positions[i*3 +0] = buf.readFloatLE(i*parseInt(pointsize));
      positions[i*3 +1] = buf.readFloatLE((i*parseInt(pointsize))+4);
      positions[i*3 +2] = buf.readFloatLE(i*parseInt(pointsize)+8);
      //reflectances[i] = buf.readFloatLE(i*parseInt(pointsize) +12);
    }
  //console.log(positions)
  
  for(let i=0; i< 100; i++)
  {
    positions[i] = 100 + i;
  }
  */
  xvizServer.updatePointCloud(positions);
});

async function createSharpImg(data,width_,height_) {
  img = await sharp({
    create: {
      data: data,
      width: width_,
      height: height_,
      channels: 3,
      background: { r: 0, g: 0, b: 0, alpha: 0.5 }
    }
  })
  .resize(400)
  .toFormat('png')
  .toBuffer();
  //console.log(img);
  xvizServer.updateCameraImage(img,width_,height_);
}
function stringToUint8ArrayBuffer(str){
  //const typedArray = new Uint8Array(str);
  //return typedArray;
  return new TextEncoder("utf-8").encode(str);
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