/*
xviz styling 
https://github.com/uber/xviz/blob/master/docs/protocol-schema/style-specification.md#point
*/
const WebSocket = require('ws');
const process = require('process');

const {XVIZMetadataBuilder, XVIZBuilder, XVIZUIBuilder, encodeBinaryXVIZ} = require("@xviz/builder");


const xvizMetaBuider = new XVIZMetadataBuilder();
const xvizUIBuilder = new XVIZUIBuilder({});

//where we define the pose of the car based on the navsat data 
xvizMetaBuider.stream('/vehicle_pose')
    .category("pose");
xvizMetaBuider.stream('/camera/image_00').category("primitive").type("image");
//what we will use to make plot the desired path of the car 
xvizMetaBuider.stream('/vehicle/trajectory')
	.category('primitive')
    .type('polyline').streamStyle({
        stroke_color: '#47B27588',// a nice transparent green
        stroke_width: 1.5,
        stroke_width_min_pixels: 1
    });
xvizMetaBuider.stream('/tracklets/objects')
    .category('primitive')
    .type('polygon').streamStyle({
        "extrude": true,
        "fill_color": "#50B3FF80",
        "stroke_color": "#FF0000"
    });
    
xvizMetaBuider
    .stream('/lidar/points')
    //.stream('/point-cloud')
    .category('primitive')
    .type('point')
    .streamStyle({
        fill_color: '##00a',
        radius_pixels: 2.0
    })
    // laser scanner relative to GPS position
    // http://www.cvlibs.net/datasets/kitti/setup.php
    //.coordinate('VEHICLE_RELATIVE')
    .pose({
        x: 0.81,
        y: -0.32,
        z: 1.73
    });

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
//let _newCameraImageFlag = false;
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

function addLocationToCache(lat, lng, alt, heading, time) {

    _locationCache = {
        latitude: lat,
        longitude: lng,
        altitude: alt,
        timestamp: time,
        heading: 1.57+heading//90 degree of difference between xviz frame
    };
    //console.log("new pose (time, lat, lng, heading): ", time, lat, lng, heading)
}

//Gwang - make addLidarDataToCache
//아마도 lidar는 points, colors를 가지고 XVIZ를 만드는것으로 파악이된다.
function addLidarDataToCache(pt, col) {
    ids_list = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    ids_uint32 = new Uint32Array(ids_list);

    _lidarCache = {
        points: pt,
        colors: col,
        ids : ids_uint32
    };
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
            .position(0,0,0).orientation(0,0,_locationCache.heading);
        if (_trajectoryCache) {
            xvizBuilder.primitive('/vehicle/trajectory').polyline(_trajectoryCache);
        } else {
            //xvizBuilder.primitive('/vehicle/trajectory').polyline([[2*Math.cos(_locationCache.heading), 2*Math.sin(_locationCache.heading), 0], [10*Math.cos(_locationCache.heading), 10*Math.sin(_locationCache.heading), 0]]);
        }
        if (_ObstaclesCache) {
            //console.log("obstacle!!!", _ObstaclesCache[0]);
            for (i=0;i<_ObstaclesCache.length;i++){
                // build triangle around that obstacle location
                xvizBuilder.primitive('/tracklets/objects').polygon([
                    [_ObstaclesCache[i][0]-0.3, _ObstaclesCache[i][1]-0.3, 0],
                    [_ObstaclesCache[i][0]+0.3, _ObstaclesCache[i][1]-0.3, 0],
                    [_ObstaclesCache[i][0], _ObstaclesCache[i][1]+0.424, 0],
                    [_ObstaclesCache[i][0]-0.3, _ObstaclesCache[i][1]-0.3, 0]
                ]).style({height:1.5});
            }
        }
        //jaeketun revise camera xvizbuilder
        if (_cameraImageCache) {
            console.log("image data", nodeBufferToTypedArray(_cameraImageCache.image_data))
            xvizBuilder.primitive('/camera/image_00').
                image(nodeBufferToTypedArray(_cameraImageCache.image_data), 'png')
                .dimensions(_cameraImageCache.width,_cameraImageCache.height)
                //.dimensions(33, 11)
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
                .colors(_lidarCache.colors)
                //.ids(_lidarCache.ids)
                .style({fill_color : '#333333'});
                //.colors(fill_color : '#00ff00aa')
                //.colors(_lidarCache.colors)
        }
        //console.log(xvizBuilder.getMessage());
        const xvizFrame = encodeBinaryXVIZ(xvizBuilder.getFrame(),{});
        //const xvizFrame = JSON.stringify(xvizBuilder.getFrame());
        //console.log(xvizFrame);
        //sleep(100);
        _connectionMap.forEach((context, connectionId, map) => {
            context.sendFrame(xvizFrame);
        });
    }
    return;
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
        //clearInterval(_frameTimer);
        _wss.close();
    },

    updateLocation: function(lat, lng, alt, heading, time) {
        addLocationToCache(lat, lng, alt, heading, time);
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

    updateObstacles: function(positions) {
        _ObstaclesCache = positions;
    },

    updateCameraImage: function(image_data,width,height) {
        //console.log("new image ", image_data.length);
        add_cameraImageCache(image_data, width, height)
        tryServeFrame();
    }

};