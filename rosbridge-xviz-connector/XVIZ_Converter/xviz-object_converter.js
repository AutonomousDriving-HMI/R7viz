const {Vector3,_Pose} = require('math.gl')
const math = require('math.gl')
const object_transform_helper = require('./xviz-object_coordinate_transform')
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
const PEDSTRIAN_STREAM = '/objects/shape/pedestrian'
const ARROW_STREAM = '/objects/direction/arrow'
const LINELIST_STREAM = 'objects/shape/linelist'
const TEXT_STREAM = '/labal'

//transform standard
var basepose = null          //current vehicle's orientation
var transformpose = null     //current object relative orientation(pose orientaion + velocity orientation)
var transform_coord          //transfrom position

var object_height = null
var label_position = null

//define vehicle and object RelativeTransform (is will be math.gl POSE)
function define_RelativeTransform(marker) {
    //transform relative vechile orientation
    basepose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        yaw: Number(-marker.orientation.car_yaw),
        pitch: Number(0)
    }
    //transform relative obejct orientation
    transformpose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw: Number(marker.orientation.car_yaw + marker.orientation.yaw),
        pitch: Number(0)
    }
    arrowtransformpose = {
        x: Number(0),
        y: Number(0),
        z: Number(0),
        roll: Number(0),
        //yaw : Number(2*1.57+marker.orientation.yaw-marker.orientation.car_yaw),
        yaw: Number(marker.orientation.car_yaw + marker.orientation.yaw+1.57),
        pitch: Number(0)
    }
}

function TranformVertices(marker) {
    const object_depth = marker.scale.x / 2;  //is change
    const object_width = marker.scale.y / 2;

    var tran_points = [[marker.vertices.x, marker.vertices.y, marker.vertices.z]]
    transform_coord = object_transform_helper.getRelativeCoordinates(tran_points, basepose);
    label_position = [transform_coord[0].x, transform_coord[0].y, object_height]
    /*
    this transformation is based on this metrix
    vertices = [[x + width, y - depth, 0],
                [x + width, y + depth, 0],
                [x - width, y + depth, 0],
                [x - width, y - depth, 0]]*/

    var trans1 = object_transform_helper.getRelativeCoordinates([[object_width, -object_depth, 0]], basepose)
    var Trans1 = object_transform_helper.getRelativeCoordinates(trans1, transformpose)

    var trans2 = object_transform_helper.getRelativeCoordinates([[object_width, object_depth, 0]], basepose)
    var Trans2 = object_transform_helper.getRelativeCoordinates(trans2, transformpose)

    var trans3 = object_transform_helper.getRelativeCoordinates([[-object_width, object_depth, 0]], basepose)
    var Trans3 = object_transform_helper.getRelativeCoordinates(trans3, transformpose)

    var trans4 = object_transform_helper.getRelativeCoordinates([[-object_width, -object_depth, 0]], basepose)
    var Trans4 = object_transform_helper.getRelativeCoordinates(trans4, transformpose)


    transform_vertices = [[transform_coord[0].x + Trans1[0].x, transform_coord[0].y + Trans1[0].y, 0],
                          [transform_coord[0].x + Trans2[0].x, transform_coord[0].y + Trans2[0].y, 0],
                          [transform_coord[0].x + Trans3[0].x, transform_coord[0].y + Trans3[0].y, 0],
                          [transform_coord[0].x + Trans4[0].x, transform_coord[0].y + Trans4[0].y, 0]]

    return { label_position, transform_vertices }
}
function velocitylimit(velocity_x,velocity_y,scale,velocity) {
    var endofVec;
    limitscale = 20;
    //filering
    if(velocity>limitscale){
        scale = limitscale/velocity;
    }
    endofVec = new math.Vector3([velocity_x*scale,velocity_y*scale,0])
    return endofVec;
}


function TransformVec(arrow_obj, xvizBuilder) {  
    let { origin_points, origin_endofVec, origin_pcross, origin_leftPtr, origin_rightPtr } = arrow_obj
    transform_coord = object_transform_helper.getRelativeCoordinates([origin_points], basepose);

    var transform_endofVec = object_transform_helper.getRelativeCoordinates([origin_endofVec], basepose);
    var transform_endofVec = object_transform_helper.getRelativeCoordinates(transform_endofVec, arrowtransformpose);
    const tf_endofVec = new math.Vector3([transform_coord[0].x + transform_endofVec[0].x, transform_coord[0].y + transform_endofVec[0].y, transform_coord[0].z])

    var transform_pcross = object_transform_helper.getRelativeCoordinates([origin_pcross], basepose);
    transform_pcross = object_transform_helper.getRelativeCoordinates(transform_pcross, arrowtransformpose);
    const tf_pcross = new math.Vector3([transform_coord[0].x + transform_pcross[0].x, transform_coord[0].y + transform_pcross[0].y, transform_coord[0].z])

    var transform_leftPtr = object_transform_helper.getRelativeCoordinates([origin_leftPtr], basepose);
    transform_leftPtr = object_transform_helper.getRelativeCoordinates(transform_leftPtr, arrowtransformpose);
    const tf_leftPtr = new math.Vector3([transform_coord[0].x + transform_leftPtr[0].x, transform_coord[0].y + transform_leftPtr[0].y, transform_coord[0].z])

    var transform_rightPtr = object_transform_helper.getRelativeCoordinates([origin_rightPtr], basepose);
    transform_rightPtr = object_transform_helper.getRelativeCoordinates(transform_rightPtr, arrowtransformpose);
    const tf_rightPtr = new math.Vector3([transform_coord[0].x + transform_rightPtr[0].x, transform_coord[0].y + transform_rightPtr[0].y, transform_coord[0].z])

    return [transform_coord[0],tf_pcross,tf_leftPtr,tf_endofVec,tf_rightPtr,tf_pcross]
}

function build_CubeBox(marker, xvizBuilder, i) {
    const object_depth = marker.scale.x / 2;  //is change
    const object_width = marker.scale.y / 2;  //is change

    var object_id = [VECHILE_STREAM, i].join('/');
    var object_height = marker.scale.z;

    const TF_Vector = TranformVertices(marker, object_depth, object_width)

    xvizBuilder.primitive(VECHILE_STREAM)
        .polygon(TF_Vector.transform_vertices)
        .style({
            height: object_height,
        })
        .classes(marker.object_class.toString())
        .id(object_id)

    build_Arrow(marker,xvizBuilder);

    xvizBuilder.primitive(TEXT_STREAM)
        .position(TF_Vector.label_position)
        .text(object_id)
}

function build_Sphere(marker, xvizBuilder) {
    var object_width = marker.scale.x;
    var object_depth = marker.scale.y;
    var object_id = [VECHILE_STREAM, marker.id].join('/');
    var object_height = marker.scale.z;
    //build_Arrow(marker, xvizBuilder);
    /*
    const TF_Vector = TranformVertices(marker, object_depth, object_width)

    xvizBuilder.primitive(PEDSTRIAN_STREAM)
        .polygon(TF_Vector.transform_vertices)
        .classes(marker.object_class.toString())
        .style({
            height: object_height
        })
        .id(object_id)
    xvizBuilder.primitive(TEXT_STREAM)
        .position(label_position)
        .text(object_id);
    /*
        //not use
        var raduis = marker.scale.x/2;
        xvizBuilder.primitive(PEDSTRIAN_STREAM)
        .circle(marker.vertices, raduis)
        .classes(marker.object_class.toString())
    
        xvizBuilder.primitive(TEXT_STREAM)
        .position(label_position)
        .text(object_id);*/
}
//
function build_Arrow(marker, xvizBuilder) {
    //const points = _makeArrow(marker,xvizBuilder);
    const points = _makeArrow(marker,xvizBuilder);
    xvizBuilder
        .primitive(ARROW_STREAM)
        .polyline(points)
        .style(
            {
                stroke_color: '#FEC56480', //orange
                stroke_width: 0.1
            })
}

function _makeArrow(marker,xvizBuilder) {
    const arrow_maker = {
        scale: 3.6, ////m/s => km/h
        transform_radian: Math.PI / 18, //degree :10
        point_1: 0.9
    }
    const origin = new math.Vector3([marker.vertices.x, marker.vertices.y, marker.vertices.z])
    const endofVec = velocitylimit(marker.velocity.dir_arrow[1].x, marker.velocity.dir_arrow[1].y, 3.6, marker.velocity.abs_velocity);
    const pcross = endofVec.clone()
    const leftPtr = endofVec.clone().scale(arrow_maker.point_1).rotateZ({ radians: -arrow_maker.transform_radian });
    const rightPtr = endofVec.clone().scale(arrow_maker.point_1).rotateZ({ radians: arrow_maker.transform_radian });

    const orignArrow = {
        origin_points: origin,
        origin_endofVec: endofVec,
        origin_pcross: pcross,
        origin_leftPtr: leftPtr,
        origin_rightPtr: rightPtr
    }

    return TransformVec(orignArrow, xvizBuilder);
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

function  Trigonometric(vec1, vec2){
    const length = vec1.distance(vec2);
    var offsetX = length/2;
    var offsetY = length/2*Math.sqrt(3)
    const leftPtr = new math.Vector3([vec1.x+offsetX,vec1.y+offsetY,0])
    const rightPtr = new math.Vector3([vec1.x-offsetX,vec1.y-offsetY,0])
    return [leftPtr,rightPtr]
}

function _mapPoints(points, pose) {
    const origin = new Vector3([pose.x, pose.y, 0]);

    return points.map(p => {
      p = [p.x, p.y, 0];
      return origin
        .clone()
        .add(p)
        .toArray();
    });
  }

function build_LineList(marker, xvizBuilder) {
    //console.log("before",marker.points)
    const lines = _.chunk(marker.points, 2);
    //console.log("after",lines[0])
    lines.forEach((line, index) => {
        //console.log("after2",_mapPoints(line, marker.vertices))
        xvizBuilder.primitive(LINELIST_STREAM)
            .polyline(_mapPoints(line, marker.vertices))
            .style({
                stroke_color: '#EEA2AD80',
                stroke_width: 0.1
            })
            .classes("1")//marker.object_class.toString())
    })
    /*for (let j =0; j< lines.length; j++){
        console.log(lines[j])
        var line = _mapPoints(lines[j],marker.vertices)
        console.log("line",line)
        xvizBuilder.primitive(LINELIST_STREAM)
        .polyline(line)
        .classes(marker.object_class.toString())
    }*/
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
            '1': build_Sphere.bind(this),
            '2': build_LineList.bind(this),
            '3': build_Arrow.bind(this)
            //'5': build_Line_List.bind(this),
            //'9': build_Points.bind(this)
        };

        const build_option = WRITERS[marker_obj.object_build]
        if (build_option) {
            build_option(marker_obj, xvizBuilder, i)
        }
    },
    //velocityHeading's orientation preprocessing function
    velocityPreprocessing: function (velocity, origin_obj_yaw) {
        var input_vx = velocity.linear.x;
        var input_vy = velocity.linear.y;
        velocity.linear.x = Math.sqrt(input_vx * input_vx + input_vy * input_vy);
        velocity.linear.y = 0;

        var abs_velocity = velocity.linear.x *3.6 //unit:[km]
        var dir_arrow = [{x: 0, y: 0, z: 0},{x:input_vx , y:input_vy, z:0}]

        var velocity_yaw = Math.atan2(input_vy, input_vx);
        var callback_yaw = velocity_yaw + origin_obj_yaw
        return {callback_yaw, abs_velocity, dir_arrow}
     }
};