const WebSocket = require('ws');
const process = require('process');

const {XVIZMetadataBuilder, XVIZBuilder, XVIZUIBuilder, encodeBinaryXVIZ} = require("@xviz/builder");

const xvizMetaBuider = new XVIZMetadataBuilder();
const xvizUIBuilder = new XVIZUIBuilder({});

//where we define the pose of the car based on the navsat data 
xvizMetaBuider
    .stream("/vehicle_pose").category("pose")
    .stream("/camera/image_00")
        .category("primitive").type("image")
    .stream("/vehicle/trajectory")
        .category("primitive").type("polyline")
        .streamStyle({
            stroke_color: '#47B27588',// a nice transparent green
            stroke_width: 1.5,
            stroke_width_min_pixels: 1
        })
    .stream("/tracklets/objects")
        .category("primitive").type("polygon")
        .streamStyle({
            "extrude": true,
            "fill_color": "#50B3FF80",
            "stroke_color": "#FF0000"
        })
    .stream("/lidar/points")
        .category("primitive").type("point")//.Coordinate('VEHICLE_RELATIVE')
        .streamStyle({
            "point_color_mode": 'ELEVATION',
            "radius_pixels": 2.0,
            "fill_color": "#47B27588"
        });

xvizUIBuilder.child( xvizUIBuilder.panel({name: 'Camera'}) ).child( xvizUIBuilder.video({cameras:["/camera/image_00"]}) );
xvizMetaBuider.ui(xvizUIBuilder);
const _metadata = xvizMetaBuider.getMetadata();
//console.log("XVIZ server meta-data: ", JSON.stringify(_metadata));

// it turns out we cannot use a constant global builder, as all the primitives keeps adding up
//const xvizBuilder = new XVIZBuilder({
//    metadata: _metadata
//});

//const _mockImage = require('fs').readFileSync("./mock.jpg").toString('base64');

// Global cache for location and trajectory

let _locationCache = null;
let _trajectoryCache = null;
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

function tryServeFrame(){
    let xvizBuilder = new XVIZBuilder({metadata: _metadata});
    xvizBuilder.primitive('/lidar/points').points(_PointCloudCache).style({fill_color: '#47B27588'});
    //xvizBuilder.primitive('/lidar/points').points(new Float32Array([1.23, 0.45, 56],[1.23, 5, 16],[1.23, 0.41, 0.06],[13, 65, 16],[53, 45, 66],[23, 45, 6],[123, 0.45, 0.58],[1.23, 0.45, 0.05])).style({fill_color: [0, 0, 0, 255]});
    if (_locationCache) {
        // frame is ready, serve it to all live connections
        xvizBuilder.pose('/vehicle_pose').timestamp(_locationCache.timestamp)
            .mapOrigin(_locationCache.longitude, _locationCache.latitude, _locationCache.altitude)
            .position(0,0,0).orientation(0,0,_locationCache.heading);
        if (_trajectoryCache) {
            xvizBuilder.primitive('/vehicle/trajectory').polyline(_trajectoryCache);
        } else {
            //xvizBuilder.primitive('/vehicle/trajectory').polyline([[2*Math.cos(_locationCache.heading), 2*Math.sin(_locationCache.heading), 0], [10*Math.cos(_locationCache.heading), 10*Math.sin(_locationCache.heading), 0]]);
        }
        /*
        if(_PointCloudCache)
        {
            //console.log("pointcloud");
            //console.log(_PointCloudCache[0]);
            xvizBuilder.primitive('/lidar/points').points(_PointCloudCache).style({fill_color: '#00ff00aa'});
        } */

        if (_cameraImageCache)
        {
            xvizBuilder.primitive('/camera/image_00').image(_cameraImageCache, "jpg");
            //xvizBuilder.primitive('/camera/image_00').image(nodeBufferToTypedArray(_cameraImageCache.image_data), "png").dimensions(_cameraImageCache.width,_cameraImageCache.height);
            //_newCameraImageFlag = false;
            //console.log("serving image ", _cameraImageCache.length);
        }
        //const xvizFrame = encodeBinaryXVIZ(xvizBuilder.getFrame(),{});
        const xvizFrame = JSON.stringify(xvizBuilder.getFrame());
        //console.log( xvizFrame);
        _connectionMap.forEach((context, connectionId, map) => {
            context.sendFrame(xvizFrame);
        });
    }
    return;
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
        //clearInterval(_frameTimer);
        _wss.close();
    },
    updatePointCloud: function(pointcloud){
        for(let i=0; i< 99; i++)
        {
            pointcloud[i] = 100+i
        }
        _PointCloudCache = pointcloud;
        tryServeFrame();
        //console.log(_PointCloudCache);
    },
    updateLocation: function(lat, lng, alt, heading, time) {
        addLocationToCache(lat, lng, alt, heading, time);
        tryServeFrame();
    },

    updateCameraImage: function(image_data, width, height) {
        //console.log("new image ", image_data.length, width,height);
        add_cameraImageCache(image_data, width, height)
        tryServeFrame();
    }
};