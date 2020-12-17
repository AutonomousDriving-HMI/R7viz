module.exports = {
    UTMdistance: function (UTMlocation1, UTMlocation2) {
        let delta_x = UTMlocation2.x - UTMlocation1.x; // UTM x-axis: easting
        let delta_y = UTMlocation2.y - UTMlocation1.y; // UTM y-axis: northing
        // ignoring z value
        return Math.sqrt(delta_x * delta_x + delta_y * delta_y);
    },

    radToDegree: function (radian) {
        return radian * (180 / Math.PI)
    },

    Degreetoradian: function (degree) {
        return degree * (Math.PI / 180)
    },

    QuaternionToRoll_Pitch_Yaw: function (message) {
        const { x, y, z, w } = message;
        //console.log(x,y,z,w)
        const roll_ = Math.atan2(2 * x * w + 2 * y * z, 1 - 2 * x * x - 2 * y * y);
        const pitch_ = Math.asin(2 * w * y + 2 * z * x);
        const yaw_ = Math.atan2(2 * z * w + 2 * x * y, 1 - 2 * y * y - 2 * z * z);
        return [roll_, pitch_, yaw_];
    },

    quaternionToEuler: function ({ w, x, y, z }) {
        const ysqr = y * y;
        const t0 = -2.0 * (ysqr + z * z) + 1.0;
        const t1 = +2.0 * (x * y + w * z);
        let t2 = -2.0 * (x * z - w * y);
        const t3 = +2.0 * (y * z + w * x);
        const t4 = -2.0 * (x * x + ysqr) + 1.0;

        t2 = t2 > 1.0 ? 1.0 : t2;
        t2 = t2 < -1.0 ? -1.0 : t2;

        const ans = {};
        ans.pitch = Math.asin(t2);
        ans.roll = Math.atan2(t3, t4);
        ans.yaw = Math.atan2(t1, t0);

        return ans;
    },

    // return a boolean that will be true if targetLocation is in front of carLocation
    // give the heading of the car (zero points to north and positive denotes rotating to west)
    isInFront: function (carLocationUTM, heading, targetLocationUTM) {
        let delta_x = targetLocationUTM.x - carLocationUTM.x;
        let delta_y = targetLocationUTM.y - carLocationUTM.y;
        return (-Math.sin(heading) * delta_x + Math.cos(heading) * delta_y > 0);
    },
}