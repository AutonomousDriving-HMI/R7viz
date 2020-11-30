/*
xviz styling 
https://github.com/uber/xviz/blob/master/docs/protocol-schema/style-specification.md#point
*/
const WebSocket = require('ws');
const ObjConveter= require('./xviz-object_converter')
const process = require('process');
const {XVIZMetadataBuilder, XVIZBuilder, XVIZUIBuilder, encodeBinaryXVIZ} = require("@xviz/builder");
const { Z_BLOCK } = require('zlib');
const {Vector3,_Pose} = require('math.gl')
const math = require('math.gl')
const _ = require('lodash')

//import {OBJECT_PALATTE} from '../gui/src/src/custom_styles.js';
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
//xvizMetaBuider.ui(xvizUIBuilder);
/************************metrics start************************************* */

const panel = xvizUIBuilder.panel({name: 'Metrics'});
const container = xvizUIBuilder.container({
    name: 'Metrics Panel',
    layout: 'vertical'
  });
const metrics1 = xvizUIBuilder.metric({streams: ['/vehicle/velocity'], title: 'Velocity'});
const metrics2 = xvizUIBuilder.metric({streams: ['/vehicle/acceleration'], title: 'Acceleration'});
const metrics3 = xvizUIBuilder.metric({streams: ['/vehicle/wheel_angle'], title: 'Wheel_Angle'});

container.child(metrics1);
container.child(metrics2);
container.child(metrics3);
xvizUIBuilder.child(panel).child(container);

const ui = xvizUIBuilder.getUI();
console.log(ui);

//xvizMetaBuider.ui(xvizUIBuilder);
/************************metrics end************************************* */


xvizMetaBuider.ui(xvizUIBuilder);
const _metadata = xvizMetaBuider.getMetadata();
console.log(_metadata);
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

function tryServeFrame(){
    // frame is ready, serve it to all live connections
    let xvizBuilder = new XVIZBuilder({metadata: _metadata});
    if (_locationCache) {
        /**DGIST OSM map does not specify height
         * We set the height of the car at zero.
         * Use _locationCache.altitude' when using a map with height
          */
        let no_altitude = 0;
        xvizBuilder.pose('/vehicle_pose')
        .timestamp(_locationCache.timestamp)
            .mapOrigin(_locationCache.longitude, _locationCache.latitude, _locationCache.altitude)
            .position(0,0,0)//.orientation(_locationCache.roll,_locationCache.pitch,_locationCache.yaw)
            .orientation(0,0,_locationCache.yaw);

  /*
            //.mapOrigin(_locationCache.longitude, _locationCache.latitude, _locationCache.altitude)
            .mapOrigin(_locationCache.longitude, _locationCache.latitude, no_altitude)
            .position(0,0,0).orientation(_locationCache.roll,_locationCache.pitch,_locationCache.yaw+1.57*2);
            */


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
                ObjConveter.ObjectType_Builder(_ObstaclesCache[i],xvizBuilder,i)
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
            //_locationCache = null;
            _lidarCache = null;
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
        //tryServeFrame();    
    },
    init_time: function(time){
        lastCalledTime = time
    },
    lidar_time: function(time){
        LidarTime = time
    }
};