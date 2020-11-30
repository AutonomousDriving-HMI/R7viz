  /***************************XVIZ API reference************************/

  /****************1. position color를 직접 parsing*********************/
  /*const binary = readBinaryData(lidar_msg.data);
  const float = new Float32Array(binary);
  const size = Math.round(binary.length / 4);
  let points_binary = [];

  const positions = new Float32Array(3 * size);
  const colors = new Uint8Array(4 * size).fill(255);

  console.log("size", size);
  //consol.log(top -b -n1 | grep -Po '[0-9.]+ id' | awk '{print 100-$1}');


  for (let i = 0; i < size; i ++) {
    positions[i * 3 + 0] = float[i * 4 + 0];
    console.log("positions[i * 3 + 0] : ", positions[i * 3 + 0]);
    positions[i * 3 + 1] = float[i * 4 + 1];
    console.log("positions[i * 3 + 1] : ", positions[i * 3 + 1]);
    positions[i * 3 + 2] = float[i * 4 + 2];
    console.log("positions[i * 3 + 2] : ", positions[i * 3 + 2]);

    const reflectance = Math.min(float[i * 4 + 3], 3);
    colors[i * 4 + 0] = 80 + reflectance * 80;
    colors[i * 4 + 1] = 80 + reflectance * 80;
    colors[i * 4 + 2] = 80 + reflectance * 60;
  }
  return [positions, colors];*/
  /*************************************************************************/


  /****************2. position color를 logic으로 parsing*********************/
  /*const binary = readBinaryData(lidar_msg.data);
  console.log("readBinaryData is Done");
  const float = new Float32Array(binary);
  const size = Math.round(binary.length / 4);

  // We could return interleaved buffers, no conversion!
  const positions = new Array(size);
  const colors = new Array(size);

  console.log("size : ", size);

  for (let i = 0; i < size; i++) {
    positions[i] = float.subarray(i * 4, i * 4 + 3);

    const reflectance = Math.min(float[i * 4 + 3], 3);
    colors[i] = [80 + reflectance * 80, reflectance * 80, reflectance * 60];
  }
  console.log("return positions, colors");
  return {positions, colors};*/
  /*************************************************************************/

  /***************************XVIZ API reference************************/
  
const toUint8Array = require('base64-to-uint8array')
module.exports = {
     load_lidar_data: function(lidar_msg) {

        //const pointSize = Math.round(lidar_msg.data.length / (lidar_msg.height * lidar_msg.width));
        //console.log("Enter load_lidar_Data function");
        const pointSize = lidar_msg.point_step;
        const pointsCount = lidar_msg.row_step / pointSize;
        //console.log(pointSize,pointsCount)
      
        let points_binary = [];
        let intensity_binary = [];
        //let colors = []; //colors 변경
        const colors = new Uint8Array(3 * pointsCount).fill(255);
        let interval = 32;
      
        //var F32arr_lidarmsg = base64toFloat32array(lidar_msg.data);
        //var buf = Buffer.from(F32arr_lidarmsg);
      
        const Uint8arr = toUint8Array(lidar_msg.data) //uint8 buffer
        const buf = Buffer.from(Uint8arr);
      
        //console.log("(lidar_msg.data.length, lidar_msg.point_step)",lidar_msg.data.length, lidar_msg.point_step);
        //parser.parse용 for문
          //for (let i = 0; i < lidar_msg.data.length; i += lidar_msg.point_step) {
      
        //readFloatLE용 for문
          for (let i = 0; i < pointsCount; i++) {
      
          //const x = parser.parse(buf.slice(i, i + 4));
          //const y = parser.parse(buf.slice(i + 4, i + 8));
          //const z = parser.parse(buf.slice(i + 8, i + 12));
          //console.log("function updateLIdar x= ", x);
          //console.log("function updateLIdar y= ", y);
          //console.log("function updateLIdar z= ", z);
      
          const xLE = buf.readFloatLE(i * pointSize);
          const yLE = buf.readFloatLE(i * pointSize + 4);
          const zLE = buf.readFloatLE(i * pointSize + 8);
          //console.log("function updateLIdar xLE= ",xLE);
          //console.log("function updateLIdar yLE= ", yLE);
          //console.log("function updateLIdar zLE= ", zLE);
      
          //parser.parse용
          //points_binary.push(x);
          //points_binary.push(y);
          //points_binary.push(z);
      
          //readFloatLE용
          points_binary.push(xLE);
          points_binary.push(yLE);
          points_binary.push(zLE);
      
          //intensity는 구현해야야 함
          const reflectance = buf.readFloatLE(i * pointSize + 16);
          colors[i * 3 + 0] = 80 + reflectance * 80;
          colors[i * 3 + 1] = 80 + reflectance * 80;
          colors[i * 3 + 2] = 80 + reflectance * 60;
      
      
          //const ring = parser.parse(buf.slice(i+20, i+24));
          //console.log("function updateLIdar parse intensity finished");
          //intensity_binary.push(intensity);
        }
        const points = new Float32Array(points_binary);
        //console.log("points array =", points);
        const intensity_float = new Float32Array(intensity_binary);
        /*  
        for (let i = 0; i < intensity_float.length; ++i) {
            colors.push(255 - intensity_float[i]); // r
            colors.push(intensity_float[i]); // g
            colors.push(0); // b
            colors.push(255); // a
        }*/
      
        return [points, colors];
    }
}