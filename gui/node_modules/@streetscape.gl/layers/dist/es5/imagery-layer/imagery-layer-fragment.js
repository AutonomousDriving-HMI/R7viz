"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// Copyright (c) 2019 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
var _default = "\n#extension GL_OES_standard_derivatives : enable\n#define SHADER_NAME imagery-layer-fragment-shader\n\n#ifdef GL_ES\nprecision highp float;\n#endif\n\nuniform sampler2D imageryTexture;\n\nvarying vec2 vTexCoord;\n\n// TODO/ib enables shader derivatives that facilitate debugging height maps\nvarying float vWorldHeight;\nconst float SLOPE_MAX = 0.10;\n\nuniform float desaturate;\nuniform vec4 transparentColor;\nuniform vec3 tintColor;\nuniform float opacity;\n\n// apply desaturation\nvec3 color_desaturate(vec3 color) {\n  float luminance = (color.r + color.g + color.b) * 0.333333333;\n  return mix(color, vec3(luminance), desaturate);\n}\n\n// apply tint\nvec3 color_tint(vec3 color) {\n  return color * tintColor / 255.0;\n}\n\n// blend with background color\nvec4 apply_opacity(vec3 color, float alpha) {\n  return mix(transparentColor / 255.0, vec4(color, 1.0), alpha);\n}\n\nvoid main(void) {\n  vec4 bitmapColor = texture2D(imageryTexture, vTexCoord);\n\n  // TODO/ib - discard fragments when height is changing to quickly\n  // Uncomment to debug height maps\n  // If changing more than 5 centimeter per pixel discard\n  // if (abs(dFdx(vWorldHeight)) > SLOPE_MAX || abs(dFdy(vWorldHeight)) > SLOPE_MAX) {\n  //   discard;\n  // }\n\n  if (bitmapColor.rgb == vec3(0., 0., 0.)) {\n    discard;\n  };\n\n  gl_FragColor = apply_opacity(color_tint(color_desaturate(bitmapColor.rgb)), bitmapColor.a * opacity);\n\n  // use highlight color if this fragment belongs to the selected object.\n  gl_FragColor = picking_filterHighlightColor(gl_FragColor);\n\n  // use picking color if rendering to picking FBO.\n  gl_FragColor = picking_filterPickingColor(gl_FragColor);\n}\n";
exports.default = _default;
//# sourceMappingURL=imagery-layer-fragment.js.map