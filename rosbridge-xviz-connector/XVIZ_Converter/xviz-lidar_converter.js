const toUint8Array = require('base64-to-uint8array')

module.exports = {
     load_lidar_data: function(lidar_msg) {

       
        const pointSize = lidar_msg.point_step;
        const pointsCount = lidar_msg.row_step / pointSize;


        let points_binary = [];
        let intensity_binary = [];

        const colors = new Uint8Array(3 * pointsCount).fill(255);

      
        const Uint8arr = toUint8Array(lidar_msg.data) //uint8 buffer
        const buf = Buffer.from(Uint8arr);
      
          for (let i = 0; i < pointsCount; i++) {

          const xLE = buf.readFloatLE(i * pointSize);
          const yLE = buf.readFloatLE(i * pointSize + 4);
          const zLE = buf.readFloatLE(i * pointSize + 8);

          points_binary.push(xLE);
          points_binary.push(yLE);
          points_binary.push(zLE);
      
          const reflectance = buf.readFloatLE(i * pointSize + 16);
          intensity_binary.push(reflectance);
          //colors[i * 3 + 0] = 80 + reflectance * 80;
          //colors[i * 3 + 1] = 80 + reflectance * 80;
          //colors[i * 3 + 2] = 80 + reflectance * 60;
      
        }
        const points = new Float32Array(points_binary);
        const intensity_float = new Float32Array(intensity_binary);
      
        return [points, intensity_float];
    }
}