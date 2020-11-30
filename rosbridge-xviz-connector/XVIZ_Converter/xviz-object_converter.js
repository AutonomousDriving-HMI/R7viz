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
}

function TranformVertices(marker) {
    define_RelativeTransform(marker)
    const object_depth = marker.scale.x / 2;  //is change
    const object_width = marker.scale.y / 2;
    var tran_points = [[marker.vertices.x, marker.vertices.y, marker.vertices.z]]
    transform_coord = object_transform_helper.getRelativeCoordinates(tran_points, basepose);

    const label_position = [transform_coord[0].x, transform_coord[0].y, object_height]
    
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
        xvizBuilder
    .primitive(ARROW_STREAM)
    .polyline(tarnsline)
    .style(
        {stroke_color:'#FEC56480'       //orange transform coordinate
        })
    
    xvizBuilder
    .primitive(ARROW_STREAM)
    .polyline(tarnsline2)
    .style(
            {
                stroke_color: '#7DDDD7'     //blue object IMU
            })
    xvizBuilder
    .primitive(ARROW_STREAM)
    .polyline(line2)
    .style(
         {
          stroke_color: '#D6A00080'         //salgo object vertices
            })
}

function TransformVec(marker) {
    define_RelativeTransform(marker)
    vecTransformFlag = true
    var tran_points = [[marker.vertices.x, marker.vertices.y, marker.vertices.z]]
    transform_coord = object_transform_helper.getRelativeCoordinates(tran_points, basepose);

    var transform_start = [transform_coord[0].x, transform_coord[0].y, 0]

    var tran_vec = [[marker.points[1].x, marker.points[1].y, marker.points[1].z]]

    var transform_twist = object_transform_helper.getRelativeCoordinates(tran_vec, basepose);
    var transform_twist2 = object_transform_helper.getRelativeCoordinates(transform_twist, transformpose);

    var DIR_PTR = new math.Vector3([transform_coord[0].x + transform_twist2[0].x, transform_coord[0].y + transform_twist2[0].y, 0])


    var DirectVector = [transform_start]
    DirectVector.push(DIR_PTR)

    return DirectVector
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

    //build_Arrow(marker,xvizBuilder);

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
    var { x, y, z } = marker.vertices
    var { lat, lng } = marker.geomatrix;
    object_geometrix = {
        pose: new math.Vector3([x, y, z]),
        geometrix: new math.Vector3([lat, lng, z]),
        yaw: marker.orientation.yaw
    }
    const points = _makeArrow(marker);
   
    xvizBuilder
        .primitive(Arrow_STREAM)
        .polyline(points)
        .style(
            {
                stroke_color: '#267E6380'
            })
}
//
function _makeArrow(marker) {
    const DirectVector = TransformVec(marker)
    const arrowVecA = DirectVector[1]

    const pCrossVec = arrowVecA.clone().scale(0.3);
    const pCross = _makePoint(arrowVecA, pCrossVec.toArray());

    arrowVecA.scale(0.5)
    const arrowVecB = arrowVecA.clone();

    const leftPt = _makePoint(DirectVector[1], arrowVecB.rotateZ({ radians: -Math.PI / 4 }).toArray());
    const rightPt = _makePoint(DirectVector[1], arrowVecA.rotateZ({ radians: Math.PI / 4 }).toArray());;

    DirectVector.push(DirectVector[1])

    return [DirectVector[0], DirectVector[1]]//, leftPt , DirectVector[1], rightPt, pCross];
}
function _makePoint(base, vector) {
    const v = [base[0] + vector[0], base[1] + vector[1], base[2] + vector[2]];
    return v;
}
function _makeVector(p) {
    const v = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
    return v;
}
function _makePoint(base, vector) {
    const v = [base[0] + vector[0], base[1] + vector[1], base[2] + vector[2]];
    return v;
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
    velocityHeading: function (velocity, origin_obj_yaw) {
        var input_vx = velocity.linear.x;
        var input_vy = velocity.linear.y;
        velocity.linear.x = Math.sqrt(input_vx * input_vx + input_vy * input_vy);
        velocity.linear.y = 0;
        var velocity_yaw = Math.atan2(input_vy, input_vx);
        var return_yaw = velocity_yaw + origin_obj_yaw
        return return_yaw
     }
};