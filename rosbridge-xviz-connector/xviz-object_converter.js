const _xvizTrajectoryHelper = require("./node_modules/@xviz/builder/dist/es5/builders/helpers/xviz-trajectory-helper.js");
const {XVIZBuilder} = require("@xviz/builder");


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

function build_CubeBox(marker,xvizBuilder){
    var {x,y,z} = marker.vertices;
    var object_width = marker.scale.x/2;
    var object_depth = marker.scale.y/2;
    var object_id = [VECHILE_STREAM,marker.id].join('/');
    var object_height = marker.scale.z;
    build_Arrow(marker,xvizBuilder);
    var marker = define_object_orgin(marker,object_depth,object_width)
    //console.log("cubebox marker",marker_)
    label_position = [x,y,z+object_height]
    xvizBuilder.primitive(VECHILE_STREAM)
    .polygon(marker.vertices)
    .classes(marker.object_class.toString())
    .style({
        height: object_height
    })
    .id(object_id)
    xvizBuilder.primitive('tracklets_text')
    .position(label_position)
    .text(object_id);
}

function define_map_origin(marker,width,depth){
    var {x,y,z} = marker.vertices
    var { roll, pitch, yaw, car_yaw } = marker.orientation;

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
    //based yaw's rotation matrix coordinate
    marker.vertices = _xvizTrajectoryHelper.getRelativeCoordinates(vertices,vechile_pose);
    return marker;
}


function _makeArrow(marker) {
    var depth = marker.scale.x/2;
    //var width = marker.scale.y;
    var tranform_obj = {}
    //copy for obj
    Object.keys(marker).forEach(function (key){
            tranform_obj[key] = marker[key]
        })

    //transform vector define
    let basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw : Number(-marker.orientation.car_yaw),
        pitch: Number(0)
    }

    var tran_points = tranform_obj.points
    var trans_pose = tranform_obj.vertices
    var trans_p = _mapPoints(tran_points, trans_pose);
    //console.log("real input",trans_p)
    var p_tranform = _xvizTrajectoryHelper.getRelativeCoordinates([trans_p[1]],basepose)
    ///////console.log("output p_tranform",p_tranform)
    trans_p[1] = p_tranform[0]

    //vector scaling with object depth
    var delta_x = trans_p[1].x - trans_p[0][0]
    var delta_y = trans_p[1].y - trans_p[0][1]
    var degree = radToDegree(Math.atan2(delta_y,delta_x))
    //var scale = depth/Math.sqrt( delta_x * delta_x + delta_y * delta_y );
    var trans_vecA = new Vector3(_makeVector([trans_p[1], trans_p[0]]));
    //trans_vecA.scale(scale)

    const tarns_pCrossVec = trans_vecA.clone();
    const trans_pCross = _makePoint(trans_p[1], tarns_pCrossVec.toArray());
    
    trans_vecA.scale(0.5);
    const trans_vecB = trans_vecA.clone();

    const leftPt = _makePoint(trans_p[1], trans_vecB.rotateZ({ radians: -Math.PI / 4 }).toArray());
    const rightPt = _makePoint(trans_p[1], trans_vecB.rotateZ({ radians: Math.PI / 4 }).toArray());

    trans_p.push(trans_p[1])

    trans_p.push(trans_p[1]);
    return [trans_p[0], trans_pCross , leftPt ]//, trans_p[1], rightPt, trans_pCross];
}

module.exports = {
     Objecttype_Builder: function(marker_obj_,xvizBuilder,i){
        var marker_obj = {}
        Object.keys(marker_obj_).forEach(function (key){
            marker_obj[key] = marker_obj_[key]
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
    },

}