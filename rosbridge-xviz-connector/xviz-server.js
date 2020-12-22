/*
xviz styling 
https://github.com/uber/xviz/blob/master/docs/protocol-schema/style-specification.md#point
*/
const WebSocket = require('ws');
const ObjConveter= require('./XVIZ_Converter/xviz-object_converter')
const process = require('process');
const {XVIZMetadataBuilder, XVIZBuilder, XVIZUIBuilder, encodeBinaryXVIZ} = require("@xviz/builder");
const { Z_BLOCK } = require('zlib');
const {Vector3,_Pose} = require('math.gl')
const math = require('math.gl');
const { format } = require('path');
    
var count = 0;


//import {OBJECT_PALATTE} from '../gui/src/src/custom_styles.js';
const xvizMetaBuider = new XVIZMetadataBuilder();
const xvizUIBuilder = new XVIZUIBuilder({});

//car status info name space
const VELOCITY_STREAM = '/vehicle/status/velocity'
const ACCELERATION_STREAM = '/vehicle/status/acceleration'
const STEERING_STREAM = '/vehicle/status/steering_angle'

//sensor info name space
const POSE_STREAM = '/vehicle_pose'// '/vehicle/pose/gps-imu'
const POINTCLOUD_STREAM = '/sensor/lidar/pointcloud'
const CAMERAIMAGE_STREAM = '/sensor/camera/rawimage'

//object detection name space
const VECHILE_STREAM = '/objects/shape/vehicle'
const UNKNOWN_STREAM = '/objects/shape/vehicle/unknown'
const PEDESTRIAN_STREAM = '/objects/shape/pedestrian'
const ARROW_STREAM = '/objects/direction/arrow'
const LINELIST_STREAM = 'objects/shape/linelist'
const LOCALPATH_STREAM = '/objects/localpath'

const DELAY_CHECK_STREAM = '/delay/millisecond'

// object info name space
const TEXT_STREAM = '/labal'
const OBJECT_VELOCITY_STREAM = '/objects/information/velocity'
OBJECT_HEADING_STREAM = '/objects/information/velocity'
//object class
UNKNOWN = '0'
CAR = '1'
TRUCK = '2'
BUS = '3'
BICYCLE = '4'
MOTORBIKE = '5'
PEDESTRIAN = '6'
ANIMAL = '7'

xvizMetaBuider.stream(POSE_STREAM)
    .category("pose");
xvizMetaBuider.stream(CAMERAIMAGE_STREAM).category("primitive").type("image");
//what we will use to make plot the desired path of the car 
xvizMetaBuider.stream(LOCALPATH_STREAM)
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

xvizMetaBuider.stream(PEDESTRIAN_STREAM)
    .category('primitive')
    .type('polygon').coordinate('VEHICLE_RELATIVE')
    .streamStyle({
        extruded: true,
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
xvizMetaBuider.stream(TEXT_STREAM)
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
xvizMetaBuider.stream(ARROW_STREAM)
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
    .stream(POINTCLOUD_STREAM)
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
        x: 1.2,
        y: -0.3,
        z: 1.8
    });
xvizMetaBuider
    .stream(VELOCITY_STREAM)
    .category('time_series')
    .type('float')
    .unit('m/s')

    .stream(STEERING_STREAM)
    .category('time_series')
    .type('float')
    .unit('degrees')

    .stream(ACCELERATION_STREAM)
    .category('time_series')
    .type('float')
    .unit('m/s^2')

    .stream(OBJECT_VELOCITY_STREAM)
    .category('time_series')
    .type('float')
    .unit('m/s^2')

    .stream(OBJECT_HEADING_STREAM)
    .category('time_series')
    .type('float')
    .unit('radian')

    .stream(DELAY_CHECK_STREAM)
    .category('time_series')
    .type('float')
    .unit('m/s')

xvizUIBuilder.child( xvizUIBuilder.panel({name: 'Camera'}) ).child( xvizUIBuilder.video({cameras:[CAMERAIMAGE_STREAM]}) );
//xvizMetaBuider.ui(xvizUIBuilder);
/************************metrics start************************************* */
const panel = xvizUIBuilder.panel({name: 'Metrics'});
const container = xvizUIBuilder.container({
    name: 'Metrics Panel',
    layout: 'vertical'
  });
const metrics1 = xvizUIBuilder.metric({streams: [VELOCITY_STREAM], title: 'Velocity'});
const metrics2 = xvizUIBuilder.metric({streams: [ACCELERATION_STREAM], title: 'Acceleration'});
const metrics3 = xvizUIBuilder.metric({streams: [STEERING_STREAM], title: 'Wheel_Angle'});

container.child(metrics1);
container.child(metrics2);
container.child(metrics3);
xvizUIBuilder.child(panel).child(container);

const ui = xvizUIBuilder.getUI();
//console.log(ui);
//xvizMetaBuider.ui(xvizUIBuilder);
/************************metrics end************************************* */
xvizMetaBuider.ui(xvizUIBuilder);
const _metadata = xvizMetaBuider.getMetadata();
//console.log(_metadata);
//console.log("XVIZ server meta-data: ", JSON.stringify(_metadata));
// it turns out we cannot use a constant global builder, as all the primitives keeps adding up
const xvizBuilder = new XVIZBuilder({
    metadata: _metadata
});
//const _mockImage = require('fs').readFileSync("./mock.jpg").toString('base64');

/* GlobalCache for GPS,IMU(location), LIDAR(lidarcache), CameraImage, ObjectDetection(obstaclesCatch)
 it is deal with XVIZ frame and meata data */
let _locationCache = null;
let _trajectoryCache = null;
let _ObstaclesCache = null;
let _cameraImageCache = null;
let _lidarCache = null;

// Global server object and counter
let _connectionCounter = 1;
let _connectionMap = new Map();
let _wss = null;    

let _frameTimer = null;         //global timer object to control XVIZ frame rate

function connectionId() {
  const id = _connectionCounter;
  _connectionCounter++;
  return id;
}

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
//jaekeun compressedImage_data (buffer), format: 'png'
function add_CompressedImageCache(image_data, format){
    _cameraImageCache = {
        image_data: image_data,
        format: format,
    };
}

function tryServeFrame(){
    // frame is ready, serve it to all live connections
    let xvizBuilder = new XVIZBuilder({metadata: _metadata});
    if (_locationCache) {
        /**DGIST OSM map does not specify height
         * We set the height of the car at zero.
         * Use _locationCache.altitude' when using a map with height
          */
        let no_altitude = 0;
        xvizBuilder.pose(POSE_STREAM)
        .timestamp(_locationCache.timestamp)
            .mapOrigin(_locationCache.longitude, _locationCache.latitude, 0)
            .position(0,0,0)
            //.orientation(0,0,_locationCache.yaw+ 3.141592);
            .orientation(_locationCache.roll, _locationCache.pitch, _locationCache.yaw);
        xvizBuilder.timeSeries(VELOCITY_STREAM)
            .timestamp(_locationCache.timestamp)
            .value(_locationCache.x_dir_velocity);

        xvizBuilder.timeSeries(ACCELERATION_STREAM)
            .timestamp(_locationCache.timestamp)
            .value(_locationCache.x_dir_accelation);

        xvizBuilder.timeSeries(STEERING_STREAM)
            .timestamp(_locationCache.timestamp)
            .value(_locationCache.degree_of_steering);

        xvizBuilder.timeSeries(DELAY_CHECK_STREAM)
            .timestamp(_locationCache.timestamp)
            .value(new Date().getTime());


        if (_trajectoryCache) {
            xvizBuilder.primitive(LOCALPATH_STREAM).polyline(_trajectoryCache);
        } else {
            //xvizBuilder.primitive('/vehicle/trajectory').polyline([[2*Math.cos(_locationCache.heading), 2*Math.sin(_locationCache.heading), 0], [10*Math.cos(_locationCache.heading), 10*Math.sin(_locationCache.heading), 0]]);
        }
        if (_ObstaclesCache) {
            for (i=0;i<_ObstaclesCache.length;i++){
                ObjConveter.ObjectType_Builder(_ObstaclesCache[i],xvizBuilder,i)
            }
        }
        
        if (_cameraImageCache) {
            xvizBuilder.primitive(CAMERAIMAGE_STREAM).
                //image(nodeBufferToTypedArray(_cameraImageCache.image_data), 'png')
                //.dimensions(_cameraImageCache.width, _cameraImageCache.height)
                //.position([1, 1, 1]);
                image(nodeBufferToTypedArray(_cameraImageCache.image_data), _cameraImageCache.format)
        }
        //Gwang - add lidar XvizBuilder
            if (_lidarCache) {
                xvizBuilder
                    .primitive(POINTCLOUD_STREAM)
                    .points(_lidarCache.points)
                    //.colors(_lidarCache.colors)
                    //.ids(_lidarCache.ids)
                    .style({ fill_color: '#00ff00aa' });
                //.colors(_lidarCache.colors)
        }/*
        //console.log(xvizBuilder.getMessage());
        const xvizFrame = encodeBinaryXVIZ(xvizBuilder.getFrame(), {});
        //console.log("frame time",_frameTimer)
        //const xvizFrame = JSON.stringify(xvizBuilder.getFrame());
        //console.log(xvizFrame);
        count = count + 1;
        _connectionMap.forEach((context, connectionId, map) => {
            context.sendFrame(xvizFrame);
            //_locationCache = null;
            _lidarCache = null;
        });*/
            //console.log(xvizBuilder.getMessage());
        const xvizFrame = encodeBinaryXVIZ(xvizBuilder.getFrame(), {});
        //console.log("frame time",_frameTimer)
        //const xvizFrame = JSON.stringify(xvizBuilder.getFrame());
        //console.log(xvizFrame);
        count = count + 1;
        //console.log(count);
        _connectionMap.forEach((context, connectionId, map) => {
            context.sendFrame(xvizFrame);
            //_locationCache = null;
            //_lidarCache = null;
        });
    }
    return;
}
//using camrea xviz builder (base64 -> uint8Array(camera input type))
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
    //jaekeun - vehile update location data from index.js
    updateLocation: function(lat, lng, alt, roll, pitch, yaw, speed, steering, accel, time) {
        addLocationToCache(lat, lng, alt, roll, pitch, yaw,  speed, steering, accel, time);
        tryServeFrame();
    },
    //Gwnag - Lidar approach
    updateLidar : function(pt, col)  {
        addLidarDataToCache(pt, col);
        //console.log("new updatelidar data (point, color): ", pt, col)
        //tryServeFrame();

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
    },
    //jaekeun - camera compressed image update from index.js
    updateCompressedImage: function(image_data,format) {
        add_CompressedImageCache(image_data, format)
    },

    init_time: function(time){
        lastCalledTime = time
    },
    lidar_time: function(time){
        LidarTime = time
    }
};