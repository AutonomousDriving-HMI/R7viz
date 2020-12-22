const {Vector3,_Pose} = require('math.gl')
const Calculator = require('../Calculator')
const math = require('math.gl')
const object_transform_helper = require('./xviz-object_coordinate_transform')
const _ = require('lodash')
/*
this is Uber XVIZ modules for object Transform
you will search for directory ros-connecter node modules
you should "yarn first" 
" cd node_modules/@xviz/builder/dist/es5/builders/helpers &&
  sudo nano xviz-trajectory-helper.js "
*/

//jaekeun object info name space
const VECHILE_STREAM = '/objects/shape/vehicle'
const UNKNOWN_STREAM = '/objects/shape/vehicle/unknown'
const PEDESTRIAN_STREAM = '/objects/shape/pedestrian'
const ARROW_STREAM = '/objects/direction/arrow'
const LINELIST_STREAM = 'objects/shape/linelist'
const TEXT_STREAM = '/labal'
const OBJECT_VELOCITY_STREAM = '/objects/information'

//transform standard
var basepose = null          //current vehicle's orientation
var transform_pose = null     //current object relative orientation(pose orientaion + velocity orientation)
var transform_coord          //transfrom position
var transform_arrow = null

var object_height = null
var label_position = null

//define vehicle and object RelativeTransform (is will be math.gl POSE)
function define_RelativeTransform(marker) {
    //transform relative vechile orientation
    basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(-marker.orientation.car_roll),
        pitch: Number(-marker.orientation.car_pitch),
        yaw: Number(-marker.orientation.car_yaw)
    }
    //transform relative obejct orientation
    transform_pose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll:  Number(marker.orientation.roll),
        pitch: Number(marker.orientation.pitch),
        yaw: Number(marker.orientation.yaw)
        // object realtive transformation = car_yaw +(-car_yaw + object's yaw) = object's yaw
    }
    transform_arrow = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll:  Number(marker.orientation.roll),
        pitch: Number(marker.orientation.pitch),
        //yaw: Number(marker.velocity.velocity_yaw)
        yaw: Number(marker.orientation.yaw_)
        //pitch: Number(marker.orientation.car_pitch + marker.orientation.pitch+1.57),
        //roll: Number(marker.orientation.car_roll + marker.orientation.roll+1.57)
    }
}

function velocitylimit(velocity_x,velocity_y,scale,velocity) {
    var endofVec;
    limitscale = 20.0;
    //filering
    if(velocity>limitscale){
        scale = limitscale/velocity;
    }
    endofVec = new math.Vector3([velocity_x*scale,velocity_y*scale,0])
    return endofVec;
}

function build_CubeBox(marker, xvizBuilder, i) {
    var object_label = class_name(marker.object_class)
    var object_id = [VECHILE_STREAM,object_label, i].join('/');
    var object_height = marker.scale.z;
    const BoundingBox = TranformVertices(marker)

    xvizBuilder.primitive(VECHILE_STREAM)
        //.polygon(TF_Vector.transform_vertices)
        .polygon(BoundingBox.transform_vertices)
        .style({
            height: object_height,
        })
        .classes(marker.object_class.toString())
        .id(object_id)

    build_Arrow(marker,xvizBuilder);

    xvizBuilder.primitive(TEXT_STREAM)
        .position(BoundingBox.label_position)
        .text(object_id)
}

function build_Cylinder(marker, xvizBuilder) {
    var object_id = [PEDESTRIAN_STREAM, marker.id].join('/');
    var object_height = marker.scale.z;
    const Cylinder = CylinderVertices(marker)

    xvizBuilder.primitive(PEDESTRIAN_STREAM)
        .polygon(Cylinder.cycle_vertices)
        .style({
            height: object_height
        })
        .classes(marker.object_class.toString())
        .id(object_id)

    build_Arrow(marker, xvizBuilder);

    xvizBuilder.primitive(TEXT_STREAM)
        .position(Cylinder.label_position)
        .text(object_id)
}
//
function build_Arrow(marker, xvizBuilder) {
    const Points = _makeArrow(marker,xvizBuilder);
    xvizBuilder
        .primitive(ARROW_STREAM)
        .polyline(Points)
        .style(
            {
                stroke_color: '#FF0000', //red
                stroke_width: 0.1
            })
}

function build_LineList(marker, xvizBuilder) {
    //console.log(marker.points[0])
    var {x,y,z} =marker.vertices
    //console.log("before_z",marker.vertices.z)
    //marker.vertices.z = marker.vertices.z+marker.points[0].z
    marker.vertices.z = marker.points[0].z
    const lines = _.chunk(marker.points, 2);
    console.log("start")
    for (var i = 0; i<lines.length; i++){
        line = lines[i]
        //console.log("output",_mapPoints(line, marker.vertices))
        xvizBuilder.primitive(LINELIST_STREAM)
        .polyline(_mapPoints(line, marker.vertices))
        .style({
            stroke_color: '#EEA2AD80',
            stroke_width: 0.1
        })
        .classes("1")//marker.object_class.toString())
    }
    //console.log("after_z",marker.vertices.z)
    //console.log("marker.vertices",marker.vertices)
    //console.log("before",marker.points)
    
    //console.log("what is chunk",lines)
    
    
    /*lines.forEach((line, index) => {
        console.log("vertices",marker.vertices.z,"line",line)
        console.log("output",_mapPoints(line, marker.vertices))
        xvizBuilder.primitive(LINELIST_STREAM)
            .polyline(_mapPoints(line, marker.vertices))
            .style({
                stroke_color: '#EEA2AD80',
                stroke_width: 0.1
            })
            .classes("1")//marker.object_class.toString())
    })*/
    /*for (let j =0; j< lines.length; j++){
        console.log(lines[j])
        var line = _mapPoints(lines[j],marker.vertices)
        console.log("line",line)
        xvizBuilder.primitive(LINELIST_STREAM)
        .polyline(line)
        .classes(marker.object_class.toString())
    }*/
}

function TranformVertices(marker) {
    var object_width = marker.scale.x / 2;
    var object_depth = marker.scale.y / 2;
    var {x,y,z} = marker.vertices
    var tran_points = [[marker.vertices.x, marker.vertices.y, marker.vertices.z]]
    transform_coord = object_transform_helper.getRelativeCoordinates(tran_points, basepose);
    label_position = [transform_coord[0].x, transform_coord[0].y, object_height]
    
    //this transformation is based on this metrix
    vertices = [[x + object_width, y - object_depth, 0],
                [x + object_width, y + object_depth, 0],
                [x - object_width, y + object_depth, 0],
                [x - object_width, y - object_depth, 0]]

    var trans1 = object_transform_helper.getRelativeCoordinates([[+object_width, -object_depth, 0]], basepose)
    var Trans1 = object_transform_helper.getRelativeCoordinates(trans1, transform_pose)
    
    var trans2 = object_transform_helper.getRelativeCoordinates([[+object_width, +object_depth, 0]], basepose)
    var Trans2 = object_transform_helper.getRelativeCoordinates(trans2, transform_pose)

    var trans3 = object_transform_helper.getRelativeCoordinates([[-object_width, +object_depth, 0]], basepose)
    var Trans3 = object_transform_helper.getRelativeCoordinates(trans3, transform_pose)

    var trans4 = object_transform_helper.getRelativeCoordinates([[-object_width, -object_depth, 0]], basepose)
    var Trans4 = object_transform_helper.getRelativeCoordinates(trans4, transform_pose)
    /*
    transform_vertices = [[transform_coord[0].x + trans1[0].x, transform_coord[0].y + trans1[0].y, 0],
                          [transform_coord[0].x + trans2[0].x, transform_coord[0].y + trans2[0].y, 0],
                          [transform_coord[0].x + trans3[0].x, transform_coord[0].y + trans3[0].y, 0],
                          [transform_coord[0].x + trans4[0].x, transform_coord[0].y + trans4[0].y, 0]]
    */
    transform_vertices = [[transform_coord[0].x + Trans1[0].x, transform_coord[0].y + Trans1[0].y, transform_coord.z],
                          [transform_coord[0].x + Trans2[0].x, transform_coord[0].y + Trans2[0].y, transform_coord.z],
                          [transform_coord[0].x + Trans3[0].x, transform_coord[0].y + Trans3[0].y, transform_coord.z],
                          [transform_coord[0].x + Trans4[0].x, transform_coord[0].y + Trans4[0].y, transform_coord.z]]

    return { label_position, transform_vertices }   //vertices}
}
function CylinderVertices(marker) {
    var cycle_vertices = []
    var object_radis = marker.scale.x/2;
    var n = 20.0
    var tran_points = [[marker.vertices.x, marker.vertices.y, marker.vertices.z]]
    transform_coord = object_transform_helper.getRelativeCoordinates(tran_points, basepose);
    label_position = [transform_coord[0].x, transform_coord[0].y, 0]
    
    for (var i =0.0; i<n; ++i){
        //radius_x = object_radis* Math.cos(Calculator.Degreetoradian(i/n));
        //radius_y = object_radis* Math.sin(Calculator.Degreetoradian(i/n));
        radius_x = object_radis* Math.cos((i/n)*2.0 * Math.PI + Math.PI/n)
        radius_y = object_radis* Math.sin((i/n)*2.0 * Math.PI + Math.PI/n)
        cycle_points =[transform_coord[0].x+radius_x, transform_coord[0].y+radius_y, 0];
        cycle_vertices.push(cycle_points)
    }
    //console.log("cycle_vertices",cycle_vertices)
    return { label_position, cycle_vertices }
}

function _makeArrow(marker,xvizBuilder) {
    const arrow_maker = {
        scale: 1, ///
        ptr_axis: Math.PI / 18, //=degree :10
        ptr_scale: 0.9,
        point2: 0.9
    }
    const origin = new math.Vector3([marker.vertices.x, marker.vertices.y,marker.vertices.z])
    const endofVec = velocitylimit(marker.velocity.dir_arrow[1].x, marker.velocity.dir_arrow[1].y, arrow_maker.scale, marker.velocity.abs_velocity);
    //const pcross = endofVec.clone()
    const leftPtr = endofVec.clone().scale(arrow_maker.ptr_scale).rotateZ({ radians: -arrow_maker.ptr_axis });
    const rightPtr = endofVec.clone().scale(arrow_maker.ptr_scale).rotateZ({ radians: arrow_maker.ptr_axis });

    const orignArrow = {
        origin_points: origin,
        origin_endofVec: endofVec,
        //origin_pcross: pcross,    //not use
        origin_leftPtr: leftPtr,
        origin_rightPtr: rightPtr
    }
    return TransformVec(orignArrow, xvizBuilder);
}

function TransformVec(arrow_obj, xvizBuilder) {  
    let { origin_points, origin_endofVec, origin_leftPtr, origin_rightPtr } = arrow_obj
    transform_coord = object_transform_helper.getRelativeCoordinates([origin_points], basepose);

    var transform_endofVec = object_transform_helper.getRelativeCoordinates([origin_endofVec], basepose);
    var transform_endofVec = object_transform_helper.getRelativeCoordinates(transform_endofVec, transform_arrow);
    const tf_endofVec = new math.Vector3([transform_coord[0].x + transform_endofVec[0].x, 
                                          transform_coord[0].y + transform_endofVec[0].y,
                                          transform_coord[0].z])
    /* //not use
    var transform_pcross = object_transform_helper.getRelativeCoordinates([origin_pcross], basepose);
    transform_pcross = object_transform_helper.getRelativeCoordinates(transform_pcross, transform_arrow);
    const tf_pcross = new math.Vector3([transform_coord[0].x + transform_pcross[0].x, transform_coord[0].y + transform_pcross[0].y, transform_coord[0].z])
    */
    var transform_leftPtr = object_transform_helper.getRelativeCoordinates([origin_leftPtr], basepose);
    transform_leftPtr = object_transform_helper.getRelativeCoordinates(transform_leftPtr, transform_arrow);
    const tf_leftPtr = new math.Vector3([transform_coord[0].x + transform_leftPtr[0].x, 
                                         transform_coord[0].y + transform_leftPtr[0].y,
                                         transform_coord[0].z])

    var transform_rightPtr = object_transform_helper.getRelativeCoordinates([origin_rightPtr], basepose);
    transform_rightPtr = object_transform_helper.getRelativeCoordinates(transform_rightPtr, transform_arrow);
    const tf_rightPtr = new math.Vector3([transform_coord[0].x + transform_rightPtr[0].x, 
                                          transform_coord[0].y + transform_rightPtr[0].y, 
                                          transform_coord[0].z])

    return [transform_coord[0], tf_endofVec, tf_leftPtr,tf_endofVec,tf_rightPtr]
}

function _mapPoints(points, pose) {
    const origin = new Vector3([pose.x, pose.y, pose.z]);

    return points.map(p => {
      p = [p.y, p.x, p.z];
      return origin
        .clone()
        .add(p)
        .toArray();
    });
  }
function class_name(obj_class){
    var obj_name;
    if (obj_class == 0){
        obj_name = "UNKNOWN"
    }else if(obj_class == 1){
        obj_name = "CAR"
    }else if(obj_class == 2){
        obj_name = "TRUCK"
    }else if(obj_class == 3){
        obj_name = "BUS"
    }else if(obj_class == 4){
        obj_name = "BICYCLE"
    }else if(obj_class == 5){
        obj_name = "MOTORBIKE"
    }else if(obj_class == 6){
        obj_name = "PEDESTRIAN"
    }else if(obj_class == 7){
        obj_name = "ANIMAL"
    }
    return obj_name;
}

//is will change
function velocityPreprocessing_marker(points, origin_obj_yaw) {
    //console.log("points",points)
    var input_vx = points[1].x;
    var input_vy = points[1].y;

    var abs_velocity = Math.sqrt(input_vx * input_vx + input_vy * input_vy);
    abs_velocity = abs_velocity * 3.6 //unit:[km]
    var dir_arrow = points

    var velocity_yaw = Math.atan2(input_vx, input_vy);
    var callback_yaw = velocity_yaw + origin_obj_yaw
    return { callback_yaw, abs_velocity, dir_arrow }
}

function vectorAngle(vec1,vec2){
    var deltaX = vec2.x - vec1.x 
    var delayY = vec2.y - vec1.y

    var degree = Math.atan(deltaX/delayY)

    return degree
}

function vecScale(vec1, vec2,scale){
    //var degree = vectorAngle(vec1,vec2)
    var distance = vec1.distance(vec2)
    var degree = vec1.angle(vec2)
    var lengthX = distance*Math.cos(degree)*scale
    var lengthY = distance*Math.sin(degree)*scale
    var output = new math.Vector3([vec1.x+lengthX,vec1.y+lengthY,0])
    return output
}

function Trigonometric(vec1, vec2){
    const length = vec1.distance(vec2);
    var offsetX = length/2;
    var offsetY = length/2*Math.sqrt(3)
    const leftPtr = new math.Vector3([vec1.x+offsetX,vec1.y+offsetY,0])
    const rightPtr = new math.Vector3([vec1.x-offsetX,vec1.y-offsetY,0])
    return [leftPtr,rightPtr]
}
module.exports = {
    ObjectType_Builder: function (marker_obj_, xvizBuilder, i) {
        var marker_obj = {}
        Object.keys(marker_obj_).forEach(function (key) {
            marker_obj[key] = marker_obj_[key]
        })
        define_RelativeTransform(marker_obj)
        const WRITERS = {
            '0': build_CubeBox.bind(this),
            '1': build_Cylinder.bind(this),
            '2': build_LineList.bind(this),
            '3': build_Arrow.bind(this),
            //'4': build_Text.bind(this)
            //'5': build_Line_List.bind(this),
            //'9': build_Points.bind(this)
        };

        const build_option = WRITERS[marker_obj.object_build]
        if (build_option) {
            build_option(marker_obj, xvizBuilder, i)
        }
    },

    velocityPostProcessing: function (velocity) {
        var input_vx = velocity.x;
        var input_vy = velocity.y;
        velocity.x = Math.sqrt(input_vx * input_vx + input_vy * input_vy);
        velocity.y = 0
        return velocity
    },
    //velocityHeading's orientation preprocessing function
    velocityPreprocessing: function (velocity, origin_obj_yaw) {
        //velocity = velocityPostProcessing(velocity)
        var input_vx = velocity.linear.x;
        var input_vy = velocity.linear.y;
        velocity.linear.x = Math.sqrt(input_vx * input_vx + input_vy * input_vy);
        velocity.linear.y = 0;

        var abs_velocity = velocity.linear.x *3.6 //unit:[km]
        var dir_arrow = [{x: 0, y: 0, z: 0},{x:input_vx , y:input_vy, z:0}]

        var velocity_yaw = Math.atan2(input_vy, input_vx);
        var callback_yaw = velocity_yaw + origin_obj_yaw
        return {callback_yaw, abs_velocity, dir_arrow, velocity_yaw}
        
     },
    marker_type_redefine: function (marker_obj, yaw) {
        var marker_class
        var marker_build
        if (marker_obj.ns == "shape") {
            if (marker_obj.points.length == 24) {
                marker_build = 0
                marker_class = 1
            }
            marker_build = 2
            marker_class = 6
        } else if (namespace == "twist") {
            marker_build = 3
            var velocity_obj = velocityPreprocessing_marker(marker_obj.points, yaw)
        } else {
            marker_class = null
        }
        return { marker_class, marker_build , velocity_obj }
    }
};