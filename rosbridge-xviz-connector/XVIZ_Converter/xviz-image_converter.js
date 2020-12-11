const xvizServer = require('../xviz-server');
const sharp = require('sharp');
var maxHeight = null;
var maxWidth = null;
function getResizeDimension(width__, height__) {
  const ratio = width__ / height__;
  let resizeWidth = null;
  let resizeHeight = null;
  if (maxHeight > 0 && maxWidth > 0) {
    resizeWidth = Math.min(maxWidth, maxHeight * ratio);
    resizeHeight = Math.min(maxHeight, maxWidth / ratio);
  }
  else if (maxHeight > 0) {
    resizeWidth = maxHeight * ratio;
    resizeHeight = maxHeight;
  }
  else if (maxWidth > 0) {
    resizeWidth = maxWidth;
    resizeHeight = maxWidth / ratio;
  }
  else {
    resizeWidth = width__;
    resizeHeight = height__;
  }
  return {
    resizeWidth: Math.floor(resizeWidth),
    resizeHeight: Math.floor(resizeHeight)
  }
}
module.exports = {
    //using camrea xviz builder (base64 -> uint8Array(camera input type))
    nodeBufferToTypedArray: function (buffer) {
        const typedArray = new Uint8Array(buffer);
        return typedArray;
    },
    //base64 type image(94312) => compressed image (base64, png, resize)
    createSharpImg: async function (data) {
        const width = 1920;
        const height = 1080;
        const { resizeWidth, resizeHeight } = getResizeDimension(width, height, maxWidth, maxHeight);
        //console.log("resize data",resizeWidth,resizeHeight);
        const image = await sharp(data, {
            raw: {
                width,
                height,
                channels: 3
            }
        })
            //.raw()
            .png()
            .resize(resizeWidth, resizeHeight)
            .toFormat('png')
            .toBuffer();
        xvizServer.updateCameraImage(image, resizeWidth, resizeHeight);
    }
}