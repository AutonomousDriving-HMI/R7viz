export function moduleToFilter(module) {
  var fs = null;

  if (module.filter) {
    var args = Array.isArray(module.filter) ? ", ".concat(module.filter.join(',')) : '';
    fs = "".concat(module.fs, "\n\nuniform sampler2D texture;\nuniform vec2 texSize;\nvarying vec2 texCoord;\n\nvoid main() {\n  gl_FragColor = texture2D(texture, texCoord);\n  gl_FragColor = ").concat(module.name, "_filterColor(gl_FragColor").concat(args, ");\n}\n");
  }

  if (module.sampler) {
    fs = "".concat(module.fs, "\n\nuniform sampler2D texture;\nuniform vec2 texSize;\nvarying vec2 texCoord;\n\nvoid main() {\n  gl_FragColor = ").concat(module.name, "_sampleColor(texture, texCoord, texSize);\n}\n");
  }

  if (!fs) {
    throw new Error("".concat(module.name, " no fragment shader generated"));
  }

  return fs;
}
//# sourceMappingURL=shader-pass.js.map