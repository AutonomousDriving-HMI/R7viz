"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var _math = require("math.gl");
var turf = _interopRequireWildcard(require("@turf/turf"));

module.exports = {
    /**
 * Given vertices and a base pose, transform the vertices to `basePose` relative coordinates
 * @param vertices {Array} list of [x, y, z] or [x, y]
 * @param basePose {Object} {x, y, z, longitude, latitude, altitude, roll, pitch, yaw}
 * @returns {Array} list of vertices in relative coordinates
 */
    getRelativeCoordinates: function (vertices, basePose) {
        if (!(basePose instanceof _math._Pose)) {
            basePose = new _math._Pose(basePose);
        }
        var transformMatrix = basePose.getTransformationMatrix();
        return vertices.map(function (p) {
            return transformMatrix.transformVector(p);
        });
    },
    /**
     * Generate trajectory for list of poses with given start frame and end frame
     * @param poses {Array}, frames of pose data,
     *   each frame contains a `pose` entry with {x, y, z, longitude, latitude, altitude, roll, pitch, yaw}
     * @param startFrame {Number}, start frame of trajectory
     * @param endFrame {Number}, end frame of trajectory
     * @returns {Array} trajectory, list of vertices
     */

    getPoseTrajectory: function (_ref) {
        var poses = _ref.poses,
            startFrame = _ref.startFrame,
            endFrame = _ref.endFrame;
        var vertices = [];
        var iterationLimit = Math.min(endFrame, poses.length);

        for (var i = startFrame; i < iterationLimit; i++) {
            vertices.push(poses[i].pose);
        }

        return vertices.map(function (m, i) {
            return getGeospatialVector(vertices[0], m, vertices[0].yaw);
        });
    },
    /**
     * Return transform matrix that can be used to transform
     * data in futurePose into the currentPose reference frame
     *
     * @param from {Object} {longitude, latitude, pitch, roll, yaw}
     * @param to {Object} {longitude, latitude, pitch, roll, yaw}
     * @returns {Object} tranformation matrix that converts 'from' relative coordinates into 'to' relative coordinates
     */

    getGeospatialToPoseTransform: function (from, to) {
        var toPose = new _math._Pose({
            x: 0,
            y: 0,
            z: 0,
            pitch: to.pitch,
            roll: to.roll,
            yaw: to.yaw
        }); // Since 'to' is the target, get the vector from 'to -> from'
        // and use that to set the position of 'from Pose'

        var v = getGeospatialVector(to, from, to.yaw);
        var fromPose = new _math._Pose({
            x: v[0],
            y: v[1],
            z: 0,
            pitch: from.pitch,
            roll: from.roll,
            yaw: from.yaw
        });
        return toPose.getTransformationMatrixToPose(fromPose);
    },
    /**
     * Get object trajectory in pose relative coordinates
     * @param targetObject {Object} {id, x, y, z, ...}
     * @param objectFrames {Array}, all the frames of objects, (object: {id, x, y, z})
     * @param poseFrames {Array}, all the frames of base poses (pose: {longitude, latitude, altitude})
     * @param startFrame {Number}, start frame of trajectory
     * @param endFrame {Number}, end frame of trajectory
     * @returns {Array} trajectory, list of vertices
     */

    getObjectTrajectory: function (_ref2) {
        var targetObject = _ref2.targetObject,
            objectFrames = _ref2.objectFrames,
            poseFrames = _ref2.poseFrames,
            startFrame = _ref2.startFrame,
            endFrame = _ref2.endFrame;
        var vertices = [];
        var startVehiclePose = poseFrames[startFrame].pose;
        var limit = Math.min(endFrame, targetObject.lastFrame);
        var motions = getObjectMotions(targetObject, objectFrames, startFrame, limit);

        for (var i = 0; i < motions.length; i++) {
            var step = motions[i];
            var currVehiclePose = poseFrames[startFrame + i].pose;

            var _getGeospatialVector = getGeospatialVector(startVehiclePose, currVehiclePose, startVehiclePose.yaw),
                _getGeospatialVector2 = _slicedToArray(_getGeospatialVector, 2),
                x = _getGeospatialVector2[0],
                y = _getGeospatialVector2[1];

            var transformMatrix = new _math._Pose(currVehiclePose).getTransformationMatrixFromPose(new _math._Pose(startVehiclePose)); // objects in curr frame are meters offset based on current vehicle pose
            // need to convert to the coordinate system of the start vehicle pose

            var p = transformMatrix.transformVector([step.x, step.y, step.z]);
            vertices.push([p[0] + x, p[1] + y, p[2]]);
        }
        return vertices;
    },
    /**
     * Get the meter vector from geospatial coordinates relative to the given heading
     *
     * @param from {Object} {longitude, latitude}
     * @param to {Object} {longitude, latitude}
     * @param heading {Number} Radian measurement, 0 = east, positive is counter clockwise
     * @returns {Array} Vector [x, y] in meters
     */

    getGeospatialVector: function (from, to) {
        var heading = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        var fromCoord = turf.point([from.longitude, from.latitude]);
        var toCoord = turf.point([to.longitude, to.latitude]);
        var distInMeters = turf.distance(fromCoord, toCoord, {
            units: 'meters'
        }); // Bearing is degrees from north, positive is clockwise

        var bearing = turf.bearing(fromCoord, toCoord); // Get the bearing relative to heading

        var relativeBearing = turf.degreesToRadians(90 - bearing);
        var radianDiff = relativeBearing - heading;
        return [distInMeters * Math.cos(radianDiff), distInMeters * Math.sin(radianDiff)];
    },

    getFrameObjects: function (frames, frameNumber) {
        if (frames instanceof Map) {
            return frames.get(frameNumber);
        }
        if (frames instanceof Array) {
            return frames[frameNumber];
        }
        return null;
    },
    /**
     * Generate motions for target object
     * @param targetObject {Object} {startFrame, endFrame, id, x, y, z,...}
     * @param objectFrames {Map | Array}, either a Map (key is frameNumber, value is list of objects) or an array of frames
     * @param startFrame {Number}
     * @param endFrame {Number}
     * @returns {Array} list of motions from given startFrame to endFrame
     */

    getObjectMotions: function (targetObject, objectFrames, startFrame, endFrame) {
        startFrame = Math.max(targetObject.firstFrame, startFrame);
        endFrame = Math.min(targetObject.lastFrame, endFrame);
        var motions = [];
        for (var i = startFrame; i < endFrame; i++) {
            var objects = getFrameObjects(objectFrames, i);
            var object = objects.find(function (obj) {
                return obj.id === targetObject.id;
            });
            motions.push(object);
        }
        return motions;
    }
}

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }
function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
//# sourceMappingURL=xviz-trajectory-helper.js.map