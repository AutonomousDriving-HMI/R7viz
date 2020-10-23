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
// The default mesh is only half a car. Flip Y and append to the vertices.
export function mirrorMesh(_ref) {
  var indices = _ref.indices,
      positions = _ref.positions,
      normals = _ref.normals;
  var indexSize = indices.length;
  var vertexSize = positions.length;
  var vertexCount = vertexSize / 3;
  var indices2 = new Uint16Array(indexSize * 2);
  var positions2 = new Float32Array(vertexSize * 2);
  var normals2 = new Float32Array(vertexSize * 2);
  indices2.set(indices);
  indices2.set(indices, indexSize);
  positions2.set(positions);
  positions2.set(positions, vertexSize);
  normals2.set(normals);
  normals2.set(normals, vertexSize); // Flip y

  for (var i = 0; i < vertexSize; i += 3) {
    positions2[i + 1] *= -1;
    normals2[i + 1] *= -1;
  } // Indices for the 2nd half


  for (var _i = 0; _i < indexSize; _i++) {
    indices2[_i] += vertexCount;
  }

  return {
    indices: indices2,
    positions: positions2,
    normals: normals2
  };
}
//# sourceMappingURL=utils.js.map