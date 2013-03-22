// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((ptr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 22924;
assert(STATICTOP < TOTAL_MEMORY);
var _stdout;
var _stdin;
var _stderr;
__ATINIT__ = __ATINIT__.concat([
  { func: function() { __GLOBAL__I_a242() } },
  { func: function() { __GLOBAL__I_a291() } }
]);
var ___dso_handle;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
allocate([502,0,0,0,274,0,0,0,0,0,0,0,0,0,0,0,664,0,0,0,446,0,0,0,752,0,0,0,446,0,0,0,400,0,0,0,194,0,0,0,554,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5242880);
allocate([73,109,112,108,101,109,101,110,116,97,116,105,111,110,44,70,105,108,101,44,69,108,97,112,115,101,100,44,80,97,114,115,101,115,44,83,101,99,111,110,100,80,101,114,80,97,114,115,101,0] /* Implementation,File, */, "i8", ALLOC_NONE, 5242924);
var _stdout = _stdout=allocate(4, "i8", ALLOC_STATIC);
var _stdin = _stdin=allocate(4, "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate(4, "i8", ALLOC_STATIC);
allocate([5,0,0,0,13,0,0,0,23,0,0,0,53,0,0,0,97,0,0,0,193,0,0,0,133,1,0,0,1,3,0,0,7,6,0,0,7,12,0,0,7,24,0,0,1,48,0,0,17,96,0,0,5,192,0,0,13,128,1,0,5,0,3,0,25,0,6,0,1,0,12,0,5,0,24,0,11,0,48,0,13,0,96,0,5,0,192,0,19,0,128,1,5,0,0,3,23,0,0,6,19,0,0,12,5,0,0,24,89,0,0,48,5,0,0,96], "i8", ALLOC_NONE, 5242976);
allocate([0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,136,195,64,0,0,0,0,132,215,151,65,0,128,224,55,121,195,65,67,23,110,5,181,181,184,147,70,245,249,63,233,3,79,56,77,50,29,48,249,72,119,130,90,60,191,115,127,221,79,21,117], "i8", ALLOC_NONE, 5243092);
allocate(24, "i8", ALLOC_NONE, 5243164);
allocate([5,0,0,0,255,255,255,255], "i8", ALLOC_NONE, 5243188);
allocate([7,0,0,0,255,255,255,255], "i8", ALLOC_NONE, 5243196);
allocate([6,0,0,0,255,255,255,255], "i8", ALLOC_NONE, 5243204);
allocate([2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,1,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,4,5,4,4,4,5,0,0,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16] /* \02\02\02\02\02\02\0 */, "i8", ALLOC_NONE, 5243212);
allocate([65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243468);
allocate([77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243484);
allocate([34,0] /* \22\00 */, "i8", ALLOC_NONE, 5243500);
allocate([70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243504);
allocate([32,0] /*  \00 */, "i8", ALLOC_NONE, 5243520);
allocate([74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243524);
allocate([10,0] /* \0A\00 */, "i8", ALLOC_NONE, 5243540);
allocate([78,111,116,32,97,108,108,32,111,98,106,101,99,116,115,47,97,114,114,97,121,115,32,104,97,118,101,32,98,101,101,110,32,112,114,111,112,101,114,108,121,32,99,108,111,115,101,100,0] /* Not all objects/arra */, "i8", ALLOC_NONE, 5243544);
allocate([68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243596);
allocate([78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243632);
allocate([79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243668);
allocate([83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243700);
allocate([33,40,99,32,38,32,48,120,70,48,41,0] /* !(c & 0xF0)\00 */, "i8", ALLOC_NONE, 5243740);
allocate([117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0] /* unsupported locale f */, "i8", ALLOC_NONE, 5243752);
allocate([65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243792);
allocate([40,99,116,120,45,62,115,116,97,99,107,32,61,61,32,78,85,76,76,41,32,124,124,32,89,65,74,76,95,73,83,95,79,66,74,69,67,84,32,40,118,41,32,124,124,32,89,65,74,76,95,73,83,95,65,82,82,65,89,32,40,118,41,0] /* (ctx-_stack == NULL) */, "i8", ALLOC_NONE, 5243820);
allocate([74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243884);
allocate([99,111,110,116,101,120,116,95,112,111,112,58,32,66,111,116,116,111,109,32,111,102,32,115,116,97,99,107,32,114,101,97,99,104,101,100,32,112,114,101,109,97,116,117,114,101,108,121,0] /* context_pop: Bottom  */, "i8", ALLOC_NONE, 5243904);
allocate([121,97,106,108,0] /* yajl\00 */, "i8", ALLOC_NONE, 5243956);
allocate([74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5243964);
allocate([89,65,74,76,95,73,83,95,79,66,74,69,67,84,40,111,98,106,41,0] /* YAJL_IS_OBJECT(obj)\ */, "i8", ALLOC_NONE, 5243984);
allocate([65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5244004);
allocate([111,98,106,32,33,61,32,78,85,76,76,0] /* obj != NULL\00 */, "i8", ALLOC_NONE, 5244028);
allocate([77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5244040);
allocate([66,97,100,32,102,108,111,97,116,32,110,117,109,98,101,114,0] /* Bad float number\00 */, "i8", ALLOC_NONE, 5244064);
allocate([70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5244084);
allocate([89,65,74,76,95,73,83,95,65,82,82,65,89,40,97,114,114,97,121,41,0] /* YAJL_IS_ARRAY(array) */, "i8", ALLOC_NONE, 5244120);
allocate([74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5244144);
allocate([37,115,0] /* %s\00 */, "i8", ALLOC_NONE, 5244176);
allocate([118,97,108,117,101,32,33,61,32,78,85,76,76,0] /* value != NULL\00 */, "i8", ALLOC_NONE, 5244180);
allocate([37,115,32,110,101,97,114,32,101,110,100,32,111,102,32,102,105,108,101,0] /* %s near end of file\ */, "i8", ALLOC_NONE, 5244196);
allocate([80,77,0] /* PM\00 */, "i8", ALLOC_NONE, 5244216);
allocate([37,115,32,110,101,97,114,32,39,37,115,39,0] /* %s near '%s'\00 */, "i8", ALLOC_NONE, 5244220);
allocate([99,111,110,116,101,120,116,95,97,100,100,95,118,97,108,117,101,58,32,67,97,110,110,111,116,32,97,100,100,32,118,97,108,117,101,32,116,111,32,97,32,118,97,108,117,101,32,111,102,32,116,121,112,101,32,37,35,48,52,120,32,40,110,111,116,32,97,32,99,111,109,112,111,115,105,116,101,32,116,121,112,101,41,0] /* context_add_value: C */, "i8", ALLOC_NONE, 5244236);
allocate([65,77,0] /* AM\00 */, "i8", ALLOC_NONE, 5244320);
allocate([115,116,114,91,48,93,32,61,61,32,39,117,39,0] /* str[0] == 'u'\00 */, "i8", ALLOC_NONE, 5244324);
allocate([99,111,110,116,101,120,116,95,97,100,100,95,118,97,108,117,101,58,32,79,98,106,101,99,116,32,107,101,121,32,105,115,32,110,111,116,32,97,32,115,116,114,105,110,103,32,40,37,35,48,52,120,41,0] /* context_add_value: O */, "i8", ALLOC_NONE, 5244340);
allocate([48,0] /* 0\00 */, "i8", ALLOC_NONE, 5244396);
allocate([98,97,115,105,99,95,115,116,114,105,110,103,0] /* basic_string\00 */, "i8", ALLOC_NONE, 5244400);
allocate([99,116,120,45,62,114,111,111,116,32,61,61,32,78,85,76,76,0] /* ctx-_root == NULL\00 */, "i8", ALLOC_NONE, 5244416);
allocate([118,106,115,111,110,0] /* vjson\00 */, "i8", ALLOC_NONE, 5244436);
allocate([80,0,0,0,77,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5244444);
allocate([92,117,48,48,48,48,32,105,115,32,110,111,116,32,97,108,108,111,119,101,100,0] /* \5Cu0000 is not allo */, "i8", ALLOC_NONE, 5244456);
allocate([118,32,33,61,32,78,85,76,76,0] /* v != NULL\00 */, "i8", ALLOC_NONE, 5244480);
allocate([65,0,0,0,77,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5244492);
allocate([105,110,118,97,108,105,100,32,85,110,105,99,111,100,101,32,39,92,117,37,48,52,88,39,0] /* invalid Unicode '\5C */, "i8", ALLOC_NONE, 5244504);
allocate([99,116,120,32,33,61,32,78,85,76,76,0] /* ctx != NULL\00 */, "i8", ALLOC_NONE, 5244532);
allocate([105,110,118,97,108,105,100,32,85,110,105,99,111,100,101,32,39,92,117,37,48,52,88,92,117,37,48,52,88,39,0] /* invalid Unicode '\5C */, "i8", ALLOC_NONE, 5244544);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,121,97,106,108,45,102,52,98,50,98,49,97,47,115,114,99,47,121,97,106,108,95,116,114,101,101,46,99,0] /* ./third-party/yajl-f */, "i8", ALLOC_NONE, 5244576);
allocate([105,110,118,97,108,105,100,32,101,115,99,97,112,101,0] /* invalid escape\00 */, "i8", ALLOC_NONE, 5244620);
allocate([66,97,100,32,105,110,116,101,103,101,114,32,110,117,109,98,101,114,0] /* Bad integer number\0 */, "i8", ALLOC_NONE, 5244636);
allocate([99,111,110,116,114,111,108,32,99,104,97,114,97,99,116,101,114,32,48,120,37,120,0] /* control character 0x */, "i8", ALLOC_NONE, 5244656);
allocate([97,102,116,101,114,32,97,114,114,97,121,32,101,108,101,109,101,110,116,44,32,73,32,101,120,112,101,99,116,32,39,44,39,32,111,114,32,39,93,39,0] /* after array element, */, "i8", ALLOC_NONE, 5244680);
allocate([117,110,101,120,112,101,99,116,101,100,32,110,101,119,108,105,110,101,0] /* unexpected newline\0 */, "i8", ALLOC_NONE, 5244724);
allocate([97,102,116,101,114,32,107,101,121,32,97,110,100,32,118,97,108,117,101,44,32,105,110,115,105,100,101,32,109,97,112,44,32,73,32,101,120,112,101,99,116,32,39,44,39,32,111,114,32,39,125,39,0] /* after key and value, */, "i8", ALLOC_NONE, 5244744);
allocate([112,114,101,109,97,116,117,114,101,32,101,110,100,32,111,102,32,105,110,112,117,116,0] /* premature end of inp */, "i8", ALLOC_NONE, 5244800);
allocate([111,98,106,101,99,116,32,107,101,121,32,97,110,100,32,118,97,108,117,101,32,109,117,115,116,32,98,101,32,115,101,112,97,114,97,116,101,100,32,98,121,32,97,32,99,111,108,111,110,32,40,39,58,39,41,0] /* object key and value */, "i8", ALLOC_NONE, 5244824);
allocate([114,101,97,108,32,110,117,109,98,101,114,32,111,118,101,114,102,108,111,119,0] /* real number overflow */, "i8", ALLOC_NONE, 5244880);
allocate([105,110,118,97,108,105,100,32,111,98,106,101,99,116,32,107,101,121,32,40,109,117,115,116,32,98,101,32,97,32,115,116,114,105,110,103,41,0] /* invalid object key ( */, "i8", ALLOC_NONE, 5244904);
allocate([101,110,100,32,61,61,32,115,97,118,101,100,95,116,101,120,116,32,43,32,108,101,120,45,62,115,97,118,101,100,95,116,101,120,116,46,108,101,110,103,116,104,0] /* end == saved_text +  */, "i8", ALLOC_NONE, 5244944);
allocate([114,98,0] /* rb\00 */, "i8", ALLOC_NONE, 5244988);
allocate([105,110,118,97,108,105,100,32,116,111,107,101,110,44,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,0] /* invalid token, inter */, "i8", ALLOC_NONE, 5244992);
allocate([116,111,111,32,98,105,103,32,105,110,116,101,103,101,114,0] /* too big integer\00 */, "i8", ALLOC_NONE, 5245024);
allocate([117,110,97,108,108,111,119,101,100,32,116,111,107,101,110,32,97,116,32,116,104,105,115,32,112,111,105,110,116,32,105,110,32,74,83,79,78,32,116,101,120,116,0] /* unallowed token at t */, "i8", ALLOC_NONE, 5245040);
allocate([115,97,106,115,111,110,0] /* sajson\00 */, "i8", ALLOC_NONE, 5245084);
allocate([116,111,111,32,98,105,103,32,110,101,103,97,116,105,118,101,32,105,110,116,101,103,101,114,0] /* too big negative int */, "i8", ALLOC_NONE, 5245092);
allocate([110,117,109,101,114,105,99,32,40,102,108,111,97,116,105,110,103,32,112,111,105,110,116,41,32,111,118,101,114,102,108,111,119,0] /* numeric (floating po */, "i8", ALLOC_NONE, 5245120);
allocate([117,110,97,98,108,101,32,116,111,32,100,101,99,111,100,101,32,98,121,116,101,32,48,120,37,120,0] /* unable to decode byt */, "i8", ALLOC_NONE, 5245156);
allocate([105,110,116,101,103,101,114,32,111,118,101,114,102,108,111,119,0] /* integer overflow\00 */, "i8", ALLOC_NONE, 5245184);
allocate([99,111,117,110,116,32,62,61,32,50,0] /* count _= 2\00 */, "i8", ALLOC_NONE, 5245204);
allocate([99,108,105,101,110,116,32,99,97,110,99,101,108,108,101,100,32,112,97,114,115,101,32,118,105,97,32,99,97,108,108,98,97,99,107,32,114,101,116,117,114,110,32,118,97,108,117,101,0] /* client cancelled par */, "i8", ALLOC_NONE, 5245216);
allocate([108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0] /* locale not supported */, "i8", ALLOC_NONE, 5245268);
allocate([115,116,114,101,97,109,45,62,98,117,102,102,101,114,91,115,116,114,101,97,109,45,62,98,117,102,102,101,114,95,112,111,115,93,32,61,61,32,99,0] /* stream-_buffer[strea */, "i8", ALLOC_NONE, 5245292);
allocate([116,114,97,105,108,105,110,103,32,103,97,114,98,97,103,101,0] /* trailing garbage\00 */, "i8", ALLOC_NONE, 5245332);
allocate([100,97,116,97,32,33,61,32,78,85,76,76,0] /* data != NULL\00 */, "i8", ALLOC_NONE, 5245352);
allocate([85,110,107,110,111,119,110,32,105,100,101,110,116,105,102,105,101,114,0] /* Unknown identifier\0 */, "i8", ALLOC_NONE, 5245368);
allocate([115,116,114,101,97,109,45,62,98,117,102,102,101,114,95,112,111,115,32,62,32,48,0] /* stream-_buffer_pos _ */, "i8", ALLOC_NONE, 5245388);
allocate([112,114,101,109,97,116,117,114,101,32,69,79,70,0] /* premature EOF\00 */, "i8", ALLOC_NONE, 5245412);
allocate([37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245428);
allocate([99,32,61,61,32,100,0] /* c == d\00 */, "i8", ALLOC_NONE, 5245476);
allocate([105,32,60,61,32,55,49,0] /* i _= 71\00 */, "i8", ALLOC_NONE, 5245484);
allocate([37,73,58,37,77,58,37,83,32,37,112,0] /* %I:%M:%S %p\00 */, "i8", ALLOC_NONE, 5245492);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,106,97,110,115,115,111,110,45,50,46,52,47,115,114,99,47,108,111,97,100,46,99,0] /* ./third-party/jansso */, "i8", ALLOC_NONE, 5245504);
allocate([37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245544);
allocate([39,125,39,32,101,120,112,101,99,116,101,100,0] /* '}' expected\00 */, "i8", ALLOC_NONE, 5245628);
allocate([32,101,114,114,111,114,0] /*  error\00 */, "i8", ALLOC_NONE, 5245644);
allocate([37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0] /* %a %b %d %H:%M:%S %Y */, "i8", ALLOC_NONE, 5245652);
allocate([39,58,39,32,101,120,112,101,99,116,101,100,0] /* ':' expected\00 */, "i8", ALLOC_NONE, 5245676);
allocate([108,101,120,105,99,97,108,0] /* lexical\00 */, "i8", ALLOC_NONE, 5245692);
allocate([37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245700);
allocate([112,97,114,115,101,0] /* parse\00 */, "i8", ALLOC_NONE, 5245736);
allocate([115,97,106,115,111,110,32,112,97,114,115,101,32,101,114,114,111,114,58,32,37,115,10,0] /* sajson parse error:  */, "i8", ALLOC_NONE, 5245744);
allocate([115,116,114,105,110,103,32,111,114,32,39,125,39,32,101,120,112,101,99,116,101,100,0] /* string or '}' expect */, "i8", ALLOC_NONE, 5245768);
allocate([40,104,97,110,100,45,62,115,116,97,116,101,83,116,97,99,107,41,46,117,115,101,100,32,62,32,48,0] /* (hand-_stateStack).u */, "i8", ALLOC_NONE, 5245792);
allocate([37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5245820);
allocate([39,93,39,32,101,120,112,101,99,116,101,100,0] /* ']' expected\00 */, "i8", ALLOC_NONE, 5245856);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,121,97,106,108,45,102,52,98,50,98,49,97,47,115,114,99,47,121,97,106,108,95,112,97,114,115,101,114,46,99,0] /* ./third-party/yajl-f */, "i8", ALLOC_NONE, 5245872);
allocate([117,110,101,120,112,101,99,116,101,100,32,116,111,107,101,110,0] /* unexpected token\00 */, "i8", ALLOC_NONE, 5245920);
allocate([32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,40,114,105,103,104,116,32,104,101,114,101,41,32,45,45,45,45,45,45,94,10,0] /*                      */, "i8", ALLOC_NONE, 5245940);
allocate([105,110,118,97,108,105,100,32,116,111,107,101,110,0] /* invalid token\00 */, "i8", ALLOC_NONE, 5245984);
allocate([117,110,107,110,111,119,110,32,101,114,114,111,114,32,99,111,100,101,0] /* unknown error code\0 */, "i8", ALLOC_NONE, 5246000);
allocate([98,117,102,32,33,61,32,78,85,76,76,0] /* buf != NULL\00 */, "i8", ALLOC_NONE, 5246020);
allocate([85,110,114,101,99,111,103,110,105,122,101,100,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,0] /* Unrecognized escape  */, "i8", ALLOC_NONE, 5246032);
allocate([102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5246064);
allocate([101,110,100,32,111,102,32,102,105,108,101,32,101,120,112,101,99,116,101,100,0] /* end of file expected */, "i8", ALLOC_NONE, 5246088);
allocate([112,114,111,98,97,98,108,101,32,99,111,109,109,101,110,116,32,102,111,117,110,100,32,105,110,32,105,110,112,117,116,32,116,101,120,116,44,32,99,111,109,109,101,110,116,115,32,97,114,101,32,110,111,116,32,101,110,97,98,108,101,100,46,0] /* probable comment fou */, "i8", ALLOC_NONE, 5246112);
allocate([102,97,108,115,101,0] /* false\00 */, "i8", ALLOC_NONE, 5246176);
allocate([39,91,39,32,111,114,32,39,123,39,32,101,120,112,101,99,116,101,100,0] /* '[' or '{' expected\ */, "i8", ALLOC_NONE, 5246184);
allocate([109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,44,32,97,32,100,105,103,105,116,32,105,115,32,114,101,113,117,105,114,101,100,32,97,102,116,101,114,32,116,104,101,32,109,105,110,117,115,32,115,105,103,110,46,0] /* malformed number, a  */, "i8", ALLOC_NONE, 5246204);
allocate([116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5246264);
allocate([109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,44,32,97,32,100,105,103,105,116,32,105,115,32,114,101,113,117,105,114,101,100,32,97,102,116,101,114,32,116,104,101,32,100,101,99,105,109,97,108,32,112,111,105,110,116,46,0] /* malformed number, a  */, "i8", ALLOC_NONE, 5246284);
allocate([109,97,108,102,111,114,109,101,100,32,110,117,109,98,101,114,44,32,97,32,100,105,103,105,116,32,105,115,32,114,101,113,117,105,114,101,100,32,97,102,116,101,114,32,116,104,101,32,101,120,112,111,110,101,110,116,46,0] /* malformed number, a  */, "i8", ALLOC_NONE, 5246348);
allocate([105,110,118,97,108,105,100,32,115,116,114,105,110,103,32,105,110,32,106,115,111,110,32,116,101,120,116,46,0] /* invalid string in js */, "i8", ALLOC_NONE, 5246408);
allocate([105,110,118,97,108,105,100,32,99,104,97,114,32,105,110,32,106,115,111,110,32,116,101,120,116,46,0] /* invalid char in json */, "i8", ALLOC_NONE, 5246440);
allocate([106,97,110,115,115,111,110,32,102,97,105,108,101,100,32,116,111,32,112,97,114,115,101,10,0] /* jansson failed to pa */, "i8", ALLOC_NONE, 5246468);
allocate([60,98,117,102,102,101,114,62,0] /* _buffer_\00 */, "i8", ALLOC_NONE, 5246496);
allocate([105,110,118,97,108,105,100,32,40,110,111,110,45,104,101,120,41,32,99,104,97,114,97,99,116,101,114,32,111,99,99,117,114,115,32,97,102,116,101,114,32,39,92,117,39,32,105,110,115,105,100,101,32,115,116,114,105,110,103,46,0] /* invalid (non-hex) ch */, "i8", ALLOC_NONE, 5246508);
allocate([105,110,118,97,108,105,100,32,99,104,97,114,97,99,116,101,114,32,105,110,115,105,100,101,32,115,116,114,105,110,103,46,0] /* invalid character in */, "i8", ALLOC_NONE, 5246572);
allocate([117,110,107,110,111,119,110,0] /* unknown\00 */, "i8", ALLOC_NONE, 5246608);
allocate([105,110,115,105,100,101,32,97,32,115,116,114,105,110,103,44,32,39,92,39,32,111,99,99,117,114,115,32,98,101,102,111,114,101,32,97,32,99,104,97,114,97,99,116,101,114,32,119,104,105,99,104,32,105,116,32,109,97,121,32,110,111,116,46,0] /* inside a string, '\5 */, "i8", ALLOC_NONE, 5246616);
allocate([83,101,99,111,110,100,32,114,111,111,116,46,32,79,110,108,121,32,111,110,101,32,114,111,111,116,32,97,108,108,111,119,101,100,0] /* Second root. Only on */, "i8", ALLOC_NONE, 5246684);
allocate([105,110,118,97,108,105,100,32,98,121,116,101,115,32,105,110,32,85,84,70,56,32,115,116,114,105,110,103,46,0] /* invalid bytes in UTF */, "i8", ALLOC_NONE, 5246720);
allocate([42,111,117,116,76,101,110,32,62,61,32,50,0] /* _outLen _= 2\00 */, "i8", ALLOC_NONE, 5246752);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,121,97,106,108,45,102,52,98,50,98,49,97,47,115,114,99,47,121,97,106,108,95,98,117,102,46,99,0] /* ./third-party/yajl-f */, "i8", ALLOC_NONE, 5246768);
allocate([66,97,100,32,117,110,105,99,111,100,101,32,99,111,100,101,112,111,105,110,116,0] /* Bad unicode codepoin */, "i8", ALLOC_NONE, 5246812);
allocate([105,110,118,97,108,105,100,32,99,104,97,114,97,99,116,101,114,32,105,110,32,117,110,105,99,111,100,101,32,101,115,99,97,112,101,0] /* invalid character in */, "i8", ALLOC_NONE, 5246836);
allocate([79,117,116,32,111,102,32,109,101,109,111,114,121,0] /* Out of memory\00 */, "i8", ALLOC_NONE, 5246872);
allocate([99,111,100,101,112,111,105,110,116,32,60,32,48,120,50,48,48,48,48,48,0] /* codepoint _ 0x200000 */, "i8", ALLOC_NONE, 5246888);
allocate([117,110,107,110,111,119,110,32,101,115,99,97,112,101,0] /* unknown escape\00 */, "i8", ALLOC_NONE, 5246912);
allocate([42,111,102,102,115,101,116,32,60,61,32,106,115,111,110,84,101,120,116,76,101,110,0] /* _offset _= jsonTextL */, "i8", ALLOC_NONE, 5246928);
allocate([105,110,118,97,108,105,100,32,85,84,70,45,49,54,32,116,114,97,105,108,32,115,117,114,114,111,103,97,116,101,0] /* invalid UTF-16 trail */, "i8", ALLOC_NONE, 5246952);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,121,97,106,108,45,102,52,98,50,98,49,97,47,115,114,99,47,121,97,106,108,95,108,101,120,46,99,0] /* ./third-party/yajl-f */, "i8", ALLOC_NONE, 5246984);
allocate([101,120,112,101,99,116,101,100,32,92,117,0] /* expected \5Cu\00 */, "i8", ALLOC_NONE, 5247028);
allocate([102,97,108,115,101,32,38,38,32,34,117,110,107,110,111,119,110,32,110,111,100,101,32,116,121,112,101,34,0] /* false && \22unknown  */, "i8", ALLOC_NONE, 5247040);
allocate([119,114,111,110,103,32,97,114,103,117,109,101,110,116,115,0] /* wrong arguments\00 */, "i8", ALLOC_NONE, 5247072);
allocate([117,110,101,120,112,101,99,116,101,100,32,101,110,100,32,111,102,32,105,110,112,117,116,32,100,117,114,105,110,103,32,85,84,70,45,49,54,32,115,117,114,114,111,103,97,116,101,32,112,97,105,114,0] /* unexpected end of in */, "i8", ALLOC_NONE, 5247088);
allocate([105,108,108,101,103,97,108,32,117,110,112,114,105,110,116,97,98,108,101,32,99,111,100,101,112,111,105,110,116,32,105,110,32,115,116,114,105,110,103,0] /* illegal unprintable  */, "i8", ALLOC_NONE, 5247144);
allocate([101,120,112,101,99,116,101,100,32,39,110,117,108,108,39,0] /* expected 'null'\00 */, "i8", ALLOC_NONE, 5247184);
allocate([101,120,112,101,99,116,101,100,32,39,102,97,108,115,101,39,0] /* expected 'false'\00 */, "i8", ALLOC_NONE, 5247200);
allocate([118,101,99,116,111,114,0] /* vector\00 */, "i8", ALLOC_NONE, 5247220);
allocate([110,117,108,108,0] /* null\00 */, "i8", ALLOC_NONE, 5247228);
allocate([67,111,110,116,114,111,108,32,99,104,97,114,97,99,116,101,114,115,32,110,111,116,32,97,108,108,111,119,101,100,32,105,110,32,115,116,114,105,110,103,115,0] /* Control characters n */, "i8", ALLOC_NONE, 5247236);
allocate([101,120,112,101,99,116,101,100,32,39,116,114,117,101,39,0] /* expected 'true'\00 */, "i8", ALLOC_NONE, 5247280);
allocate([116,114,121,95,100,111,117,98,108,101,0] /* try_double\00 */, "i8", ALLOC_NONE, 5247296);
allocate([116,114,117,101,0] /* true\00 */, "i8", ALLOC_NONE, 5247308);
allocate([116,104,105,114,100,45,112,97,114,116,121,47,115,97,106,115,111,110,47,115,97,106,115,111,110,46,104,0] /* third-party/sajson/s */, "i8", ALLOC_NONE, 5247316);
allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_NONE, 5247344);
allocate([101,120,112,101,99,116,101,100,32,101,110,100,32,111,102,32,105,110,112,117,116,0] /* expected end of inpu */, "i8", ALLOC_NONE, 5247360);
allocate([37,46,48,76,102,0] /* %.0Lf\00 */, "i8", ALLOC_NONE, 5247384);
allocate([99,97,110,110,111,116,32,112,97,114,115,101,32,117,110,107,110,111,119,110,32,118,97,108,117,101,0] /* cannot parse unknown */, "i8", ALLOC_NONE, 5247392);
allocate([37,99,10,0] /* %c\0A\00 */, "i8", ALLOC_NONE, 5247420);
allocate([121,97,106,108,32,112,97,114,115,101,32,101,114,114,111,114,58,32,37,115,10,0] /* yajl parse error: %s */, "i8", ALLOC_NONE, 5247424);
allocate([101,120,112,101,99,116,101,100,32,93,0] /* expected ]\00 */, "i8", ALLOC_NONE, 5247448);
allocate([109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0] /* money_get error\00 */, "i8", ALLOC_NONE, 5247460);
allocate([101,120,112,101,99,116,101,100,32,125,0] /* expected }\00 */, "i8", ALLOC_NONE, 5247476);
allocate([37,76,102,0] /* %Lf\00 */, "i8", ALLOC_NONE, 5247488);
allocate([117,110,101,120,112,101,99,116,101,100,32,101,110,100,32,111,102,32,105,110,112,117,116,0] /* unexpected end of in */, "i8", ALLOC_NONE, 5247492);
allocate([34,116,104,105,115,32,115,104,111,117,108,100,32,110,101,118,101,114,32,104,97,112,112,101,110,34,32,61,61,32,78,85,76,76,0] /* \22this should never */, "i8", ALLOC_NONE, 5247516);
allocate([101,120,112,101,99,116,101,100,32,58,0] /* expected :\00 */, "i8", ALLOC_NONE, 5247552);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,121,97,106,108,45,102,52,98,50,98,49,97,47,115,114,99,47,121,97,106,108,95,101,110,99,111,100,101,46,99,0] /* ./third-party/yajl-f */, "i8", ALLOC_NONE, 5247564);
allocate([115,116,100,58,58,98,97,100,95,99,97,115,116,0] /* std::bad_cast\00 */, "i8", ALLOC_NONE, 5247612);
allocate([111,98,106,101,99,116,32,107,101,121,32,109,117,115,116,32,98,101,32,113,117,111,116,101,100,0] /* object key must be q */, "i8", ALLOC_NONE, 5247628);
allocate([85,110,101,120,112,101,99,116,101,100,32,99,104,97,114,97,99,116,101,114,0] /* Unexpected character */, "i8", ALLOC_NONE, 5247656);
allocate([9,0] /* \09\00 */, "i8", ALLOC_NONE, 5247680);
allocate([101,120,112,101,99,116,101,100,32,44,0] /* expected ,\00 */, "i8", ALLOC_NONE, 5247684);
allocate([8,0] /* \08\00 */, "i8", ALLOC_NONE, 5247696);
allocate([37,112,0] /* %p\00 */, "i8", ALLOC_NONE, 5247700);
allocate([100,111,99,117,109,101,110,116,32,114,111,111,116,32,109,117,115,116,32,98,101,32,111,98,106,101,99,116,32,111,114,32,97,114,114,97,121,0] /* document root must b */, "i8", ALLOC_NONE, 5247704);
allocate([12,0] /* \0C\00 */, "i8", ALLOC_NONE, 5247744);
allocate([110,111,32,114,111,111,116,32,101,108,101,109,101,110,116,0] /* no root element\00 */, "i8", ALLOC_NONE, 5247748);
allocate([105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0] /* ios_base::clear\00 */, "i8", ALLOC_NONE, 5247764);
allocate([47,0] /* /\00 */, "i8", ALLOC_NONE, 5247780);
allocate([37,115,44,37,115,44,37,102,44,37,100,44,37,102,10,0] /* %s,%s,%f,%d,%f\0A\00 */, "i8", ALLOC_NONE, 5247784);
allocate([89,65,74,76,95,73,83,95,78,85,77,66,69,82,40,110,111,100,101,41,0] /* YAJL_IS_NUMBER(node) */, "i8", ALLOC_NONE, 5247800);
allocate([92,0] /* \5C\00 */, "i8", ALLOC_NONE, 5247824);
allocate([13,0] /* \0D\00 */, "i8", ALLOC_NONE, 5247828);
allocate([67,0] /* C\00 */, "i8", ALLOC_NONE, 5247832);
allocate([102,97,105,108,101,100,32,116,111,32,111,112,101,110,32,102,105,108,101,58,32,37,115,10,0] /* failed to open file: */, "i8", ALLOC_NONE, 5247836);
allocate([63,0] /* ?\00 */, "i8", ALLOC_NONE, 5247864);
allocate([101,110,100,32,61,61,32,115,116,114,98,117,102,102,101,114,45,62,118,97,108,117,101,32,43,32,115,116,114,98,117,102,102,101,114,45,62,108,101,110,103,116,104,0] /* end == strbuffer-_va */, "i8", ALLOC_NONE, 5247868);
allocate([83,97,116,0] /* Sat\00 */, "i8", ALLOC_NONE, 5247912);
allocate([70,114,105,0] /* Fri\00 */, "i8", ALLOC_NONE, 5247916);
allocate([84,104,117,0] /* Thu\00 */, "i8", ALLOC_NONE, 5247920);
allocate([87,101,100,0] /* Wed\00 */, "i8", ALLOC_NONE, 5247924);
allocate([84,117,101,0] /* Tue\00 */, "i8", ALLOC_NONE, 5247928);
allocate([77,111,110,0] /* Mon\00 */, "i8", ALLOC_NONE, 5247932);
allocate([83,117,110,0] /* Sun\00 */, "i8", ALLOC_NONE, 5247936);
allocate([83,97,116,117,114,100,97,121,0] /* Saturday\00 */, "i8", ALLOC_NONE, 5247940);
allocate([105,111,115,116,114,101,97,109,0] /* iostream\00 */, "i8", ALLOC_NONE, 5247952);
allocate([70,114,105,100,97,121,0] /* Friday\00 */, "i8", ALLOC_NONE, 5247964);
allocate([84,104,117,114,115,100,97,121,0] /* Thursday\00 */, "i8", ALLOC_NONE, 5247972);
allocate([46,47,116,104,105,114,100,45,112,97,114,116,121,47,106,97,110,115,115,111,110,45,50,46,52,47,115,114,99,47,115,116,114,99,111,110,118,46,99,0] /* ./third-party/jansso */, "i8", ALLOC_NONE, 5247984);
allocate([87,101,100,110,101,115,100,97,121,0] /* Wednesday\00 */, "i8", ALLOC_NONE, 5248024);
allocate([84,117,101,115,100,97,121,0] /* Tuesday\00 */, "i8", ALLOC_NONE, 5248036);
allocate([116,101,115,116,100,97,116,97,47,117,112,100,97,116,101,45,99,101,110,116,101,114,46,106,115,111,110,0] /* testdata/update-cent */, "i8", ALLOC_NONE, 5248044);
allocate([77,111,110,100,97,121,0] /* Monday\00 */, "i8", ALLOC_NONE, 5248072);
allocate([111,107,44,32,110,111,32,101,114,114,111,114,0] /* ok, no error\00 */, "i8", ALLOC_NONE, 5248080);
allocate([83,117,110,100,97,121,0] /* Sunday\00 */, "i8", ALLOC_NONE, 5248096);
allocate([77,105,115,109,97,116,99,104,32,99,108,111,115,105,110,103,32,98,114,97,99,101,47,98,114,97,99,107,101,116,0] /* Mismatch closing bra */, "i8", ALLOC_NONE, 5248104);
allocate([83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248136);
allocate([70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248152);
allocate([84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248168);
allocate([87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248184);
allocate([84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248200);
allocate([77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248216);
allocate([83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248232);
allocate([116,101,115,116,100,97,116,97,47,109,101,115,104,46,106,115,111,110,0] /* testdata/mesh.json\0 */, "i8", ALLOC_NONE, 5248248);
allocate([83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248268);
allocate([70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248304);
allocate([84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248332);
allocate([87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248368);
allocate([84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248408);
allocate([77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248440);
allocate([83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248468);
allocate([68,101,99,0] /* Dec\00 */, "i8", ALLOC_NONE, 5248496);
allocate([78,111,118,0] /* Nov\00 */, "i8", ALLOC_NONE, 5248500);
allocate([116,101,115,116,100,97,116,97,47,105,110,115,116,114,117,109,101,110,116,115,46,106,115,111,110,0] /* testdata/instruments */, "i8", ALLOC_NONE, 5248504);
allocate([79,99,116,0] /* Oct\00 */, "i8", ALLOC_NONE, 5248532);
allocate([83,101,112,0] /* Sep\00 */, "i8", ALLOC_NONE, 5248536);
allocate([65,117,103,0] /* Aug\00 */, "i8", ALLOC_NONE, 5248540);
allocate([74,117,108,0] /* Jul\00 */, "i8", ALLOC_NONE, 5248544);
allocate([74,117,110,0] /* Jun\00 */, "i8", ALLOC_NONE, 5248548);
allocate([65,112,114,0] /* Apr\00 */, "i8", ALLOC_NONE, 5248552);
allocate([77,97,114,0] /* Mar\00 */, "i8", ALLOC_NONE, 5248556);
allocate([70,101,98,0] /* Feb\00 */, "i8", ALLOC_NONE, 5248560);
allocate([74,97,110,0] /* Jan\00 */, "i8", ALLOC_NONE, 5248564);
allocate([58,32,0] /* : \00 */, "i8", ALLOC_NONE, 5248568);
allocate([68,101,99,101,109,98,101,114,0] /* December\00 */, "i8", ALLOC_NONE, 5248572);
allocate([116,101,115,116,100,97,116,97,47,103,105,116,104,117,98,95,101,118,101,110,116,115,46,106,115,111,110,0] /* testdata/github_even */, "i8", ALLOC_NONE, 5248584);
allocate([78,111,118,101,109,98,101,114,0] /* November\00 */, "i8", ALLOC_NONE, 5248612);
allocate([79,99,116,111,98,101,114,0] /* October\00 */, "i8", ALLOC_NONE, 5248624);
allocate([83,101,112,116,101,109,98,101,114,0] /* September\00 */, "i8", ALLOC_NONE, 5248632);
allocate([65,117,103,117,115,116,0] /* August\00 */, "i8", ALLOC_NONE, 5248644);
allocate([117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0] /* unspecified iostream */, "i8", ALLOC_NONE, 5248652);
allocate([74,117,108,121,0] /* July\00 */, "i8", ALLOC_NONE, 5248688);
allocate([74,117,110,101,0] /* June\00 */, "i8", ALLOC_NONE, 5248696);
allocate([77,97,121,0] /* May\00 */, "i8", ALLOC_NONE, 5248704);
allocate([65,112,114,105,108,0] /* April\00 */, "i8", ALLOC_NONE, 5248708);
allocate([77,97,114,99,104,0] /* March\00 */, "i8", ALLOC_NONE, 5248716);
allocate([70,101,98,114,117,97,114,121,0] /* February\00 */, "i8", ALLOC_NONE, 5248724);
allocate([116,101,115,116,100,97,116,97,47,97,112,97,99,104,101,95,98,117,105,108,100,115,46,106,115,111,110,0] /* testdata/apache_buil */, "i8", ALLOC_NONE, 5248736);
allocate([74,97,110,117,97,114,121,0] /* January\00 */, "i8", ALLOC_NONE, 5248764);
allocate([68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248772);
allocate([78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248788);
allocate([79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248804);
allocate([83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248820);
allocate([65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248836);
allocate([74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248852);
allocate([74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248868);
allocate([77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5248884);
allocate([106,97,110,115,115,111,110,0] /* jansson\00 */, "i8", ALLOC_NONE, 5248900);
allocate([112,101,114,102,46,99,112,112,0] /* perf.cpp\00 */, "i8", ALLOC_NONE, 5248908);
allocate([118,106,115,111,110,32,112,97,114,115,101,32,101,114,114,111,114,58,32,37,115,10,0] /* vjson parse error: % */, "i8", ALLOC_NONE, 5248920);
allocate(472, "i8", ALLOC_NONE, 5248944);
allocate([121,97,106,108,95,115,116,114,105,110,103,95,100,101,99,111,100,101,0] /* yajl_string_decode\0 */, "i8", ALLOC_NONE, 5249416);
allocate([121,97,106,108,95,114,101,110,100,101,114,95,101,114,114,111,114,95,115,116,114,105,110,103,0] /* yajl_render_error_st */, "i8", ALLOC_NONE, 5249436);
allocate([121,97,106,108,95,108,101,120,95,108,101,120,0] /* yajl_lex_lex\00 */, "i8", ALLOC_NONE, 5249464);
allocate([121,97,106,108,95,100,111,95,112,97,114,115,101,0] /* yajl_do_parse\00 */, "i8", ALLOC_NONE, 5249480);
allocate([121,97,106,108,95,100,111,95,102,105,110,105,115,104,0] /* yajl_do_finish\00 */, "i8", ALLOC_NONE, 5249496);
allocate([121,97,106,108,95,98,117,102,95,102,114,101,101,0] /* yajl_buf_free\00 */, "i8", ALLOC_NONE, 5249512);
allocate([121,97,106,108,95,98,117,102,95,101,110,115,117,114,101,95,97,118,97,105,108,97,98,108,101,0] /* yajl_buf_ensure_avai */, "i8", ALLOC_NONE, 5249528);
allocate([121,97,106,108,95,98,117,102,95,97,112,112,101,110,100,0] /* yajl_buf_append\00 */, "i8", ALLOC_NONE, 5249556);
allocate([115,116,114,101,97,109,95,117,110,103,101,116,0] /* stream_unget\00 */, "i8", ALLOC_NONE, 5249572);
allocate([115,116,114,101,97,109,95,103,101,116,0] /* stream_get\00 */, "i8", ALLOC_NONE, 5249588);
allocate([111,98,106,101,99,116,95,97,100,100,95,107,101,121,118,97,108,0] /* object_add_keyval\00 */, "i8", ALLOC_NONE, 5249600);
allocate([108,101,120,95,117,110,103,101,116,95,117,110,115,97,118,101,0] /* lex_unget_unsave\00 */, "i8", ALLOC_NONE, 5249620);
allocate([108,101,120,95,115,99,97,110,95,115,116,114,105,110,103,0] /* lex_scan_string\00 */, "i8", ALLOC_NONE, 5249640);
allocate([108,101,120,95,115,99,97,110,95,110,117,109,98,101,114,0] /* lex_scan_number\00 */, "i8", ALLOC_NONE, 5249656);
allocate([106,115,111,110,112,95,115,116,114,116,111,100,0] /* jsonp_strtod\00 */, "i8", ALLOC_NONE, 5249672);
allocate([104,101,120,84,111,68,105,103,105,116,0] /* hexToDigit\00 */, "i8", ALLOC_NONE, 5249688);
allocate([100,101,99,111,100,101,95,117,110,105,99,111,100,101,95,101,115,99,97,112,101,0] /* decode_unicode_escap */, "i8", ALLOC_NONE, 5249700);
allocate([99,111,110,116,101,120,116,95,112,117,115,104,0] /* context_push\00 */, "i8", ALLOC_NONE, 5249724);
allocate([99,111,110,116,101,120,116,95,97,100,100,95,118,97,108,117,101,0] /* context_add_value\00 */, "i8", ALLOC_NONE, 5249740);
allocate([97,114,114,97,121,95,97,100,100,95,118,97,108,117,101,0] /* array_add_value\00 */, "i8", ALLOC_NONE, 5249760);
var ___dso_handle = ___dso_handle=allocate(4, "i8", ALLOC_STATIC);
allocate([118,111,105,100,32,121,97,106,108,95,116,101,115,116,58,58,116,114,97,118,101,114,115,101,40,106,115,111,110,115,116,97,116,115,32,38,44,32,121,97,106,108,95,118,97,108,41,0] /* void yajl_test::trav */, "i8", ALLOC_NONE, 5249776);
allocate([115,97,106,115,111,110,58,58,112,97,114,115,101,114,58,58,112,97,114,115,101,95,114,101,115,117,108,116,32,115,97,106,115,111,110,58,58,112,97,114,115,101,114,58,58,112,97,114,115,101,95,110,117,109,98,101,114,40,41,0] /* sajson::parser::pars */, "i8", ALLOC_NONE, 5249824);
allocate([118,111,105,100,32,115,97,106,115,111,110,58,58,112,97,114,115,101,114,58,58,119,114,105,116,101,95,117,116,102,56,40,117,110,115,105,103,110,101,100,32,105,110,116,44,32,99,104,97,114,32,42,38,41,0] /* void sajson::parser: */, "i8", ALLOC_NONE, 5249884);
allocate([118,111,105,100,32,106,97,110,115,115,111,110,95,116,101,115,116,58,58,116,114,97,118,101,114,115,101,40,106,115,111,110,115,116,97,116,115,32,38,44,32,106,115,111,110,95,116,32,42,41,0] /* void jansson_test::t */, "i8", ALLOC_NONE, 5249940);
allocate([118,111,105,100,32,115,97,106,115,111,110,95,116,101,115,116,58,58,116,114,97,118,101,114,115,101,40,106,115,111,110,115,116,97,116,115,32,38,44,32,99,111,110,115,116,32,115,97,106,115,111,110,58,58,118,97,108,117,101,32,38,41,0] /* void sajson_test::tr */, "i8", ALLOC_NONE, 5249992);
allocate(288, "i8", ALLOC_NONE, 5250056);
allocate(168, "i8", ALLOC_NONE, 5250344);
allocate(288, "i8", ALLOC_NONE, 5250512);
allocate(288, "i8", ALLOC_NONE, 5250800);
allocate(168, "i8", ALLOC_NONE, 5251088);
allocate(288, "i8", ALLOC_NONE, 5251256);
allocate(4, "i8", ALLOC_NONE, 5251544);
allocate(4, "i8", ALLOC_NONE, 5251548);
allocate(4, "i8", ALLOC_NONE, 5251552);
allocate(4, "i8", ALLOC_NONE, 5251556);
allocate(4, "i8", ALLOC_NONE, 5251560);
allocate(8, "i8", ALLOC_NONE, 5251564);
allocate(8, "i8", ALLOC_NONE, 5251572);
allocate(8, "i8", ALLOC_NONE, 5251580);
allocate(8, "i8", ALLOC_NONE, 5251588);
allocate(12, "i8", ALLOC_NONE, 5251596);
allocate(12, "i8", ALLOC_NONE, 5251608);
allocate(12, "i8", ALLOC_NONE, 5251620);
allocate(12, "i8", ALLOC_NONE, 5251632);
allocate(28, "i8", ALLOC_NONE, 5251644);
allocate(24, "i8", ALLOC_NONE, 5251672);
allocate(8, "i8", ALLOC_NONE, 5251696);
allocate(8, "i8", ALLOC_NONE, 5251704);
allocate(8, "i8", ALLOC_NONE, 5251712);
allocate(8, "i8", ALLOC_NONE, 5251720);
allocate(8, "i8", ALLOC_NONE, 5251728);
allocate(8, "i8", ALLOC_NONE, 5251736);
allocate(8, "i8", ALLOC_NONE, 5251744);
allocate(8, "i8", ALLOC_NONE, 5251752);
allocate(12, "i8", ALLOC_NONE, 5251760);
allocate(8, "i8", ALLOC_NONE, 5251772);
allocate(8, "i8", ALLOC_NONE, 5251780);
allocate(8, "i8", ALLOC_NONE, 5251788);
allocate(148, "i8", ALLOC_NONE, 5251796);
allocate(8, "i8", ALLOC_NONE, 5251944);
allocate(16, "i8", ALLOC_NONE, 5251952);
allocate(8, "i8", ALLOC_NONE, 5251968);
allocate(8, "i8", ALLOC_NONE, 5251976);
allocate(8, "i8", ALLOC_NONE, 5251984);
allocate(8, "i8", ALLOC_NONE, 5251992);
allocate([48,49,50,51,52,53,54,55,56,57,0] /* 0123456789\00 */, "i8", ALLOC_NONE, 5252000);
allocate([48,49,50,51,52,53,54,55,56,57,0] /* 0123456789\00 */, "i8", ALLOC_NONE, 5252012);
allocate([37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0], "i8", ALLOC_NONE, 5252024);
allocate([37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0], "i8", ALLOC_NONE, 5252056);
allocate([37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0], "i8", ALLOC_NONE, 5252076);
allocate([37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0], "i8", ALLOC_NONE, 5252120);
allocate([37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0], "i8", ALLOC_NONE, 5252152);
allocate([37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0], "i8", ALLOC_NONE, 5252184);
allocate([37,72,58,37,77,58,37,83] /* %H:%M:%S */, "i8", ALLOC_NONE, 5252216);
allocate([37,72,58,37,77] /* %H:%M */, "i8", ALLOC_NONE, 5252224);
allocate([37,73,58,37,77,58,37,83,32,37,112] /* %I:%M:%S %p */, "i8", ALLOC_NONE, 5252232);
allocate([37,89,45,37,109,45,37,100] /* %Y-%m-%d */, "i8", ALLOC_NONE, 5252244);
allocate([37,109,47,37,100,47,37,121] /* %m/%d/%y */, "i8", ALLOC_NONE, 5252252);
allocate([37,72,58,37,77,58,37,83] /* %H:%M:%S */, "i8", ALLOC_NONE, 5252260);
allocate([37,0,0,0,0,0] /* %\00\00\00\00\00 */, "i8", ALLOC_NONE, 5252268);
allocate([37,112,0,0,0,0] /* %p\00\00\00\00 */, "i8", ALLOC_NONE, 5252276);
allocate(4, "i8", ALLOC_NONE, 5252284);
allocate(4, "i8", ALLOC_NONE, 5252288);
allocate(4, "i8", ALLOC_NONE, 5252292);
allocate(12, "i8", ALLOC_NONE, 5252296);
allocate(12, "i8", ALLOC_NONE, 5252308);
allocate(12, "i8", ALLOC_NONE, 5252320);
allocate(12, "i8", ALLOC_NONE, 5252332);
allocate(4, "i8", ALLOC_NONE, 5252344);
allocate(4, "i8", ALLOC_NONE, 5252348);
allocate(4, "i8", ALLOC_NONE, 5252352);
allocate(12, "i8", ALLOC_NONE, 5252356);
allocate(12, "i8", ALLOC_NONE, 5252368);
allocate(12, "i8", ALLOC_NONE, 5252380);
allocate(12, "i8", ALLOC_NONE, 5252392);
allocate([2,0,0,0,0,0,0,0,20,0,0,0,0,0,0,0,202,0,0,0,0,0,0,0,232,7,0,0,0,0,0,0,16,79,0,0,0,0,0,0,162,22,3,0,0,0,0,0,87,226,30,0,0,0,0,0,97,215,52,1,0,0,0,0,205,105,16,12,0,0,0,0,5,34,164,120,0,0,0,0,51,84,105,182,4,0,0,0,251,73,29,32,47,0,0,0,209,227,36,65,215,1,0,0,43,230,112,139,104,18,0,0,175,253,104,114,21,184,0,0,210,232,25,120,214,48,7,0,13,198,64,44,24,250,49,0,145,247,80,55,158,120,102,0,117,53,37,197,197,22,156,0,105,65,55,155,59,142,209,0,195,17,5,130,202,241,5,1,52,86,134,34,61,110,59,1,225,245,147,53,230,36,113,1,89,243,248,194,31,110,165,1,47,48,183,179,167,201,218,1,29,126,82,208,8,190,16,2,165,29,103,4,139,237,68,2,14,229,128,197,237,40,122,2,41,143,112,155,148,89,176,2,243,178,76,194,249,111,228,2,176,223,223,50,248,139,25,3,156,215,151,63,246,238,79,3,193,230,190,231,89,245,131,3,114,160,174,97,176,242,184,3,142,72,26,122,92,47,239,3,89,109,80,204,153,125,35,4,175,136,100,63,0,93,88,4,219,170,61,79,64,116,142,4,201,138,134,49,168,8,195,4,123,45,232,61,210,202,247,4,217,56,98,205,134,189,45,5,136,99,93,64,116,150,98,5,106,188,116,80,17,60,151,5,132,235,145,164,21,11,205,5,51,51,219,134,237,38,2,6,255,255,145,232,168,176,54,6,255,127,182,34,211,92,108,6,0,16,178,245,3,186,161,6,255,147,30,243,132,40,214,6,255,56,230,47,166,178,11,7,160,227,239,221,167,79,65,7,135,220,107,213,145,163,117,7,169,211,198,74,118,12,171,7,74,68,188,238,201,231,224,7,92,85,107,106,188,33,21,8,179,42,6,133,43,106,74,8,176,218,35,51,91,130,128,8,92,209,236,255,241,162,180,8,179,5,232,127,174,203,233,8,144,3,241,15,77,31,32,9,116,68,237,83,32,39,84,9,145,149,232,104,232,48,137,9,245,186,34,131,34,125,191,9,217,180,245,145,53,174,243,9,16,34,115,246,194,153,40,10,147,234,15,180,51,192,94,10,156,242,137,80,32,56,147,10,67,111,172,100,40,6,200,10,20,139,215,125,178,7,254,10,236,182,166,142,207,196,50,11,168,100,80,114,3,118,103,11,209,125,228,78,132,83,157,11,163,206,78,177,50,84,210,11,76,130,162,93,63,233,6,12,223,34,11,53,143,163,60,12,203,245,38,129,57,230,113,12,62,179,112,225,199,95,166,12,13,224,204,217,185,247,219,12,8,12,32,40,212,122,17,13,10,15,40,50,137,217,69,13,205,18,178,126,235,79,123,13,192,75,47,47,243,17,177,13,176,30,251,250,111,86,229,13,92,230,185,249,11,172,26,14,250,47,20,124,135,171,80,14,248,59,25,91,105,214,132,14,246,138,223,177,3,12,186,14,218,182,43,79,130,71,240,14,144,164,246,226,98,89,36,15,180,77,180,155,187,111,89,15,33,97,161,130,170,203,143,15,181,220,164,145,74,223,195,15,226,19,14,54,29,215,248,15,219,152,145,131,228,12,47,16,137,255,58,210,14,104,99,16,107,191,201,134,18,66,152,16,69,47,124,40,151,82,206,16,139,157,77,121,158,243,2,17,238,4,161,23,134,176,55,17,42,70,137,157,167,156,109,17,218,203,117,194,232,129,162,17,209,62,19,243,98,34,215,17,133,14,216,175,251,234,12,18,19,9,231,77,221,18,66,18,88,203,96,161,148,151,118,18,46,254,184,201,121,61,172,18,221,158,19,30,108,166,225,18,148,134,152,37,7,16,22,19,57,168,254,238,8,148,75,19,35,41,95,149,133,60,129,19,108,243,182,250,166,139,181,19,71,176,100,185,144,238,234,19,45,238,222,115,26,213,32,20,184,169,214,16,97,10,85,20,38,84,12,85,249,76,138,20,152,180,39,213,27,112,192,20,189,161,113,202,34,140,244,20,45,10,14,125,43,175,41,21,92,198,40,46,123,13,96,21,243,247,178,249,217,16,148,21,240,181,31,120,16,21,201,21,108,163,39,150,84,90,255,21,35,198,216,221,116,152,51,22,172,247,78,21,146,126,104,22,151,181,162,154,54,158,158,22,126,177,165,32,226,34,211,22,222,29,207,168,154,235,7,23,86,229,2,83,129,230,61,23,86,207,225,211,16,176,114,23,43,67,218,8,21,92,167,23,246,211,16,75,26,51,221,23,122,132,234,110,240,63,18,24,152,37,165,138,236,207,70,24,254,110,78,173,231,131,124,24,95,5,81,204,112,210,177,24,182,70,101,255,12,71,230,24,100,152,62,63,208,216,27,25,62,31,135,39,130,103,81,25,14,231,104,177,98,193,133,25,210,32,195,93,187,49,187,25,131,244,153,26,21,255,240,25,164,113,64,97,218,62,37,26,13,142,144,249,144,142,90,26,200,88,250,155,26,153,144,26,250,238,248,66,97,191,196,26,184,42,183,147,57,239,249,26,179,122,82,252,131,53,48,27,96,25,103,251,228,66,100,27,184,223,64,58,158,83,153,27,166,23,209,200,133,168,207,27,200,174,130,157,83,201,3,28,122,90,227,132,168,187,56,28,24,49,28,166,146,234,110,28,175,158,209,167,155,82,163,28,91,6,198,145,66,39,216,28,242,135,55,54,19,49,14,29,247,180,226,1,172,222,66,29,53,98,91,2,87,150,119,29,194,58,242,194,236,123,173,29,185,100,215,249,115,109,226,29,231,61,77,248,208,8,23,30,97,141,96,54,5,203,76,30,93,88,252,65,227,254,129,30,116,110,123,18,156,126,182,30,17,74,26,23,67,30,236,30,75,110,112,238,233,146,33,31,221,137,12,106,164,247,85,31,85,172,143,132,141,117,139,31,181,203,217,114,120,41,193,31,162,62,144,143,214,115,245,31,75,78,116,51,204,208,42,32,239,176,40,160,127,194,96,32,42,221,50,136,31,243,148,32,117,148,63,106,231,47,202,32,201,188,103,162,240,93,0,33,251,171,1,203,108,117,52,33,250,22,194,253,199,146,105,33,185,156,50,253,121,247,159,33,243,161,63,62,172,250,211,33,112,138,207,77,87,249,8,34,12,109,67,33,173,55,63,34,40,36,202,52,204,130,115,34,50,173,252,65,127,99,168,34,126,216,123,18,95,124,222,34,79,103,141,107,187,13,19,35,35,193,112,70,42,209,71,35,107,241,12,216,116,197,125,35,227,22,8,7,105,155,178,35,156,28,202,72,67,66,231,35,195,163,252,26,212,18,29,36,90,230,221,144,196,43,82,36,240,95,21,181,181,182,134,36,236,183,90,34,99,100,188,36,244,178,120,245,189,190,241,36,176,223,214,114,109,46,38,37,157,151,140,207,8,186,91,37,194,222,183,129,69,84,145,37,114,214,37,226,86,169,197,37,15,76,175,154,172,19,251,37,137,143,173,224,75,236,48,38,108,243,216,216,94,39,101,38,71,48,15,143,54,113,154,38,44,126,105,25,194,134,208,38,183,221,195,159,114,168,4,39,37,213,180,71,143,210,57,39,55,5,209,140,153,35,112,39,133,70,5,240,127,44,164,39,38,152,6,236,159,55,217,39,48,62,8,231,135,133,15,40,222,38,101,240,116,179,67,40,149,112,126,44,82,160,120,40,186,12,158,183,102,200,174,40,245,199,194,50,64,61,227,40,242,121,115,63,144,12,24,41,110,88,80,79,180,15,78,41,69,55,146,177,208,201,130,41,22,197,246,221,68,124,183,41,91,118,116,21,86,91,237,41,249,201,104,205,21,89,34,42,119,252,194,64,91,239,86,42,149,187,243,16,50,171,140,42,61,85,152,74,255,234,193,42,141,106,62,29,191,101,246,42,48,5,142,228,46,255,43,43,62,195,216,78,125,127,97,43,13,244,142,162,92,223,149,43,17,177,50,203,51,87,203,43,170,174,255,94,128,22,1,44,85,154,191,118,32,92,53,44,234,128,111,148,40,179,106,44,146,176,197,92,249,175,160,44,183,28,247,179,247,219,212,44,229,227,244,160,245,18,10,45,111,14,153,132,217,75,64,45,11,82,191,229,207,94,116,45,141,38,47,223,131,118,169,45,49,240,250,214,36,212,223,45,31,214,92,6,151,228,19,46,166,11,244,199,188,221,72,46,144,14,241,249,43,21,127,46,26,169,54,124,59,109,179,46,96,83,68,91,138,72,232,46,56,104,21,242,172,90,30,47,35,97,77,23,172,248,82,47,108,185,32,29,215,182,135,47,199,231,104,228,140,164,189,47,220,144,193,14,216,134,242,47,19,245,113,18,142,40,39,48,88,114,14,151,177,242,92,48,119,7,105,254,174,23,146,48,85,73,3,190,154,157,198,48,170,27,132,109,1,69,252,48,74,145,114,228,32,171,49,49,157,53,143,29,233,21,102,49,4,3,243,100,99,155,155,49,227,225,23,31,30,65,209,49,91,218,221,166,101,145,5,50,242,80,149,16,191,245,58,50,151,82,93,106,151,217,112,50,61,167,244,68,253,15,165,50,13,209,49,150,252,83,218,50,168,34,223,221,125,116,16,51,82,235,86,85,157,145,68,51,38,166,172,170,4,182,121,51,216,231,171,234,194,17,176,51,206,225,86,165,51,22,228,51,65,154,172,142,192,27,25,52,210,192,87,178,176,98,79,52,131,216,118,111,174,157,131,52,164,142,84,11,26,133,184,52,77,178,41,142,96,166,238,52,112,15,218,88,252,39,35,53,76,147,16,111,251,241,87,53,31,184,212,74,122,238,141,53,19,243,196,110,12,181,194,53,216,47,118,138,79,98,247,53,206,187,19,109,227,58,45,54,97,85,44,36,206,68,98,54,185,106,55,173,1,214,150,54,103,69,133,24,130,139,204,54,97,75,83,79,49,215,1,55,57,30,40,163,253,76,54,55,199,37,242,11,61,224,107,55,156,87,119,39,38,108,161,55,131,45,85,177,47,199,213,55,228,120,170,157,251,56,11,56,143,139,138,66,157,3,65,56,114,46,45,147,132,68,117,56,15,122,248,183,165,149,170,56,73,76,251,146,135,157,224,56,92,31,186,119,233,196,20,57,51,167,168,213,35,246,73,57,128,104,137,101,214,57,128,57,160,194,235,254,75,72,180,57,71,179,166,254,94,90,233,57,25,96,80,190,246,176,31,58,16,60,242,54,154,206,83,58,20,203,174,196,64,194,136,58,217,125,218,245,208,242,190,58,167,142,168,153,194,87,243,58,81,178,18,64,179,45,40,59,230,94,23,16,32,57,94,59,79,155,14,10,180,227,146,59,35,66,146,12,161,156,199,59,172,210,182,79,201,131,253,59,172,67,210,209,93,114,50,60,151,212,70,70,245,14,103,60,188,137,216,151,178,210,156,60,22,86,231,158,175,3,210,60,155,43,161,134,155,132,6,61,130,118,73,104,194,37,60,61,17,234,45,129,153,151,113,61,149,100,121,225,127,253,165,61,187,189,215,217,223,124,219,61,149,214,38,232,11,46,17,62,58,140,48,226,142,121,69,62,72,175,188,154,242,215,122,62,141,237,181,160,247,198,176,62,241,104,227,136,181,248,228,62,45,67,28,235,226,54,26,63,252,169,241,210,77,98,80,63,123,20,174,71,225,122,132,63,154,153,153,153,153,153,185,63,0,0,0,0,0,0,240,63,0,0,0,0,0,0,36,64,0,0,0,0,0,0,89,64,0,0,0,0,0,64,143,64,0,0,0,0,0,136,195,64,0,0,0,0,0,106,248,64,0,0,0,0,128,132,46,65,0,0,0,0,208,18,99,65,0,0,0,0,132,215,151,65,0,0,0,0,101,205,205,65,0,0,0,32,95,160,2,66,0,0,0,232,118,72,55,66,0,0,0,162,148,26,109,66,0,0,64,229,156,48,162,66,0,0,144,30,196,188,214,66,0,0,52,38,245,107,12,67,0,128,224,55,121,195,65,67,0,160,216,133,87,52,118,67,0,200,78,103,109,193,171,67,0,61,145,96,228,88,225,67,64,140,181,120,29,175,21,68,80,239,226,214,228,26,75,68,146,213,77,6,207,240,128,68,246,74,225,199,2,45,181,68,180,157,217,121,67,120,234,68,145,2,40,44,42,139,32,69,53,3,50,183,244,173,84,69,2,132,254,228,113,217,137,69,129,18,31,47,231,39,192,69,33,215,230,250,224,49,244,69,234,140,160,57,89,62,41,70,36,176,8,136,239,141,95,70,23,110,5,181,181,184,147,70,156,201,70,34,227,166,200,70,3,124,216,234,155,208,254,70,130,77,199,114,97,66,51,71,227,32,121,207,249,18,104,71,27,105,87,67,184,23,158,71,177,161,22,42,211,206,210,71,29,74,156,244,135,130,7,72,165,92,195,241,41,99,61,72,231,25,26,55,250,93,114,72,97,160,224,196,120,245,166,72,121,200,24,246,214,178,220,72,76,125,207,89,198,239,17,73,158,92,67,240,183,107,70,73,198,51,84,236,165,6,124,73,92,160,180,179,39,132,177,73,115,200,161,160,49,229,229,73,143,58,202,8,126,94,27,74,154,100,126,197,14,27,81,74,192,253,221,118,210,97,133,74,48,125,149,20,71,186,186,74,62,110,221,108,108,180,240,74,206,201,20,136,135,225,36,75,65,252,25,106,233,25,90,75,169,61,80,226,49,80,144,75,19,77,228,90,62,100,196,75,87,96,157,241,77,125,249,75,109,184,4,110,161,220,47,76,68,243,194,228,228,233,99,76,21,176,243,29,94,228,152,76,27,156,112,165,117,29,207,76,145,97,102,135,105,114,3,77,245,249,63,233,3,79,56,77,114,248,143,227,196,98,110,77,71,251,57,14,187,253,162,77,25,122,200,209,41,189,215,77,159,152,58,70,116,172,13,78,100,159,228,171,200,139,66,78,61,199,221,214,186,46,119,78,12,57,149,140,105,250,172,78,167,67,221,247,129,28,226,78,145,148,212,117,162,163,22,79,181,185,73,19,139,76,76,79,17,20,14,236,214,175,129,79,22,153,17,167,204,27,182,79,91,255,213,208,191,162,235,79,153,191,133,226,183,69,33,80,127,47,39,219,37,151,85,80,95,251,240,81,239,252,138,80,27,157,54,147,21,222,192,80,98,68,4,248,154,21,245,80,123,85,5,182,1,91,42,81,109,85,195,17,225,120,96,81,200,42,52,86,25,151,148,81,122,53,193,171,223,188,201,81,108,193,88,203,11,22,0,82,199,241,46,190,142,27,52,82,57,174,186,109,114,34,105,82,199,89,41,9,15,107,159,82,29,216,185,101,233,162,211,82,36,78,40,191,163,139,8,83,173,97,242,174,140,174,62,83,12,125,87,237,23,45,115,83,79,92,173,232,93,248,167,83,99,179,216,98,117,246,221,83,30,112,199,93,9,186,18,84,37,76,57,181,139,104,71,84,46,159,135,162,174,66,125,84,125,195,148,37,173,73,178,84,92,244,249,110,24,220,230,84,115,113,184,138,30,147,28,85,232,70,179,22,243,219,81,85,162,24,96,220,239,82,134,85,202,30,120,211,171,231,187,85,63,19,43,100,203,112,241,85,14,216,53,61,254,204,37,86,18,78,131,204,61,64,91,86,203,16,210,159,38,8,145,86,254,148,198,71,48,74,197,86,61,58,184,89,188,156,250,86,102,36,19,184,245,161,48,87,128,237,23,38,115,202,100,87,224,232,157,239,15,253,153,87,140,177,194,245,41,62,208,87,239,93,51,115,180,77,4,88,107,53,0,144,33,97,57,88,197,66,0,244,105,185,111,88,187,41,128,56,226,211,163,88,42,52,160,198,218,200,216,88,53,65,72,120,17,251,14,89,193,40,45,235,234,92,67,89,241,114,248,165,37,52,120,89,173,143,118,15,47,65,174,89,204,25,170,105,189,232,226,89,63,160,20,196,236,162,23,90,79,200,25,245,167,139,77,90,50,29,48,249,72,119,130,90,126,36,124,55,27,21,183,90,158,45,91,5,98,218,236,90,130,252,88,67,125,8,34,91,163,59,47,148,156,138,86,91,140,10,59,185,67,45,140,91,151,230,196,83,74,156,193,91,61,32,182,232,92,3,246,91,77,168,227,34,52,132,43,92,48,73,206,149,160,50,97,92,124,219,65,187,72,127,149,92,91,82,18,234,26,223,202,92,121,115,75,210,112,203,0,93,87,80,222,6,77,254,52,93,109,228,149,72,224,61,106,93,196,174,93,45,172,102,160,93,117,26,181,56,87,128,212,93,18,97,226,6,109,160,9,94,171,124,77,36,68,4,64,94,214,219,96,45,85,5,116,94,204,18,185,120,170,6,169,94,127,87,231,22,85,72,223,94,175,150,80,46,53,141,19,95,91,188,228,121,130,112,72,95,114,235,93,24,163,140,126,95,39,179,58,239,229,23,179,95,241,95,9,107,223,221,231,95,237,183,203,69,87,213,29,96,244,82,159,139,86,165,82,96,177,39,135,46,172,78,135,96,157,241,40,58,87,34,189,96,2,151,89,132,118,53,242,96,195,252,111,37,212,194,38,97,244,251,203,46,137,115,92,97,120,125,63,189,53,200,145,97,214,92,143,44,67,58,198,97,12,52,179,247,211,200,251,97,135,0,208,122,132,93,49,98,169,0,132,153,229,180,101,98,212,0,229,255,30,34,155,98,132,32,239,95,83,245,208,98,165,232,234,55,168,50,5,99,207,162,229,69,82,127,58,99,193,133,175,107,147,143,112,99,50,103,155,70,120,179,164,99,254,64,66,88,86,224,217,99,159,104,41,247,53,44,16,100,198,194,243,116,67,55,68,100,120,179,48,82,20,69,121,100,86,224,188,102,89,150,175,100,54,12,54,224,247,189,227,100,67,143,67,216,117,173,24,101,20,115,84,78,211,216,78,101,236,199,244,16,132,71,131,101,232,249,49,21,101,25,184,101,97,120,126,90,190,31,238,101,61,11,143,248,214,211,34,102,12,206,178,182,204,136,87,102,143,129,95,228,255,106,141,102,249,176,187,238,223,98,194,102,56,157,106,234,151,251,246,102,134,68,5,229,125,186,44,103,212,74,35,175,142,244,97,103,137,29,236,90,178,113,150,103,235,36,167,241,30,14,204,103,19,119,8,87,211,136,1,104,215,148,202,44,8,235,53,104,13,58,253,55,202,101,107,104,72,68,254,98,158,31,161,104,90,213,189,251,133,103,213,104,177,74,173,122,103,193,10,105,175,78,172,172,224,184,64,105,90,98,215,215,24,231,116,105,241,58,205,13,223,32,170,105,214,68,160,104,139,84,224,105,12,86,200,66,174,105,20,106,143,107,122,211,25,132,73,106,115,6,89,72,32,229,127,106,8,164,55,45,52,239,179,106,10,141,133,56,1,235,232,106,76,240,166,134,193,37,31,107,48,86,40,244,152,119,83,107,187,107,50,49,127,85,136,107,170,6,127,253,222,106,190,107,42,100,111,94,203,2,243,107,53,61,11,54,126,195,39,108,130,12,142,195,93,180,93,108,209,199,56,154,186,144,146,108,198,249,198,64,233,52,199,108,55,184,248,144,35,2,253,108,35,115,155,58,86,33,50,109,235,79,66,201,171,169,102,109,230,227,146,187,22,84,156,109,112,206,59,53,142,180,209,109,12,194,138,194,177,33,6,110,143,114,45,51,30,170,59,110,153,103,252,223,82,74,113,110,127,129,251,151,231,156,165,110,223,97,250,125,33,4,219,110,44,125,188,238,148,226,16,111,118,156,107,42,58,27,69,111,148,131,6,181,8,98,122,111,61,18,36,113,69,125,176,111,204,22,109,205,150,156,228,111,127,92,200,128,188,195,25,112,207,57,125,208,85,26,80,112,67,136,156,68,235,32,132,112,84,170,195,21,38,41,185,112,233,148,52,155,111,115,239,112,17,221,0,193,37,168,35,113,86,20,65,49,47,146,88,113,107,89,145,253,186,182,142,113,227,215,122,222,52,50,195,113,220,141,25,22,194,254,247,113,83,241,159,155,114,254,45,114,212,246,67,161,7,191,98,114,137,244,148,137,201,110,151,114,171,49,250,235,123,74,205,114,11,95,124,115,141,78,2,115,205,118,91,208,48,226,54,115,129,84,114,4,189,154,108,115,208,116,199,34,182,224,161,115,4,82,121,171,227,88,214,115,134,166,87,150,28,239,11,116,20,200,246,221,113,117,65,116,24,122,116,85,206,210,117,116,158,152,209,234,129,71,171,116,99,255,194,50,177,12,225,116,60,191,115,127,221,79,21,117,11,175,80,223,212,163,74,117,103,109,146,11,101,166,128,117,192,8,119,78,254,207,180,117,241,202,20,226,253,3,234,117,214,254,76,173,126,66,32,118,140,62,160,88,30,83,84,118,47,78,200,238,229,103,137,118,187,97,122,106,223,193,191,118,21,125,140,162,43,217,243,118,90,156,47,139,118,207,40,119,112,131,251,45,84,3,95,119,38,50,189,156,20,98,147,119,176,126,236,195,153,58,200,119,92,158,231,52,64,73,254,119,249,194,16,33,200,237,50,120,184,243,84,41,58,169,103,120,165,48,170,179,136,147,157,120,103,94,74,112,53,124,210,120,1,246,92,204,66,27,7,121,130,51,116,127,19,226,60,121,49,160,168,47,76,13,114,121,61,200,146,59,159,144,166,121,77,122,119,10,199,52,220,121,112,172,138,102,252,160,17,122,140,87,45,128,59,9,70,122,111,173,56,96,138,139,123,122,101,108,35,124,54,55,177,122,127,71,44,27,4,133,229,122,94,89,247,33,69,230,26,123,219,151,58,53,235,207,80,123,210,61,137,2,230,3,133,123,70,141,43,131,223,68,186,123,76,56,251,177,11,107,240,123,95,6,122,158,206,133,36,124,246,135,24,70,66,167,89,124,250,84,207,107,137,8,144,124,56,42,195,198,171,10,196,124,199,244,115,184,86,13,249,124,248,241,144,102,172,80,47,125,59,151,26,192,107,146,99,125,10,61,33,176,6,119,152,125,76,140,41,92,200,148,206,125,176,247,153,57,253,28,3,126,156,117,0,136,60,228,55,126,3,147,0,170,75,221,109,126,226,91,64,74,79,170,162,126,218,114,208,28,227,84,215,126,144,143,4,228,27,42,13,127,186,217,130,110,81,58,66,127,41,144,35,202,229,200,118,127,51,116,172,60,31,123,172,127,160,200,235,133,243,204,225,127], "i8", ALLOC_NONE, 5252404);
allocate([0,0,0,0,124,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257460);
allocate(1, "i8", ALLOC_NONE, 5257480);
allocate([0,0,0,0,136,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257484);
allocate(1, "i8", ALLOC_NONE, 5257504);
allocate([0,0,0,0,148,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257508);
allocate(1, "i8", ALLOC_NONE, 5257528);
allocate([0,0,0,0,160,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257532);
allocate(1, "i8", ALLOC_NONE, 5257552);
allocate([0,0,0,0,172,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257556);
allocate(1, "i8", ALLOC_NONE, 5257576);
allocate([0,0,0,0,192,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257580);
allocate(1, "i8", ALLOC_NONE, 5257608);
allocate([0,0,0,0,224,77,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257612);
allocate(1, "i8", ALLOC_NONE, 5257640);
allocate([0,0,0,0,0,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257644);
allocate(1, "i8", ALLOC_NONE, 5257672);
allocate([0,0,0,0,32,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257676);
allocate(1, "i8", ALLOC_NONE, 5257704);
allocate([0,0,0,0,184,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257708);
allocate(1, "i8", ALLOC_NONE, 5257732);
allocate([0,0,0,0,216,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257736);
allocate(1, "i8", ALLOC_NONE, 5257760);
allocate([0,0,0,0,248,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,255,255,255,248,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257764);
allocate(1, "i8", ALLOC_NONE, 5257848);
allocate([0,0,0,0,32,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,255,255,255,32,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257852);
allocate(1, "i8", ALLOC_NONE, 5257936);
allocate([0,0,0,0,72,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257940);
allocate(1, "i8", ALLOC_NONE, 5257980);
allocate([0,0,0,0,84,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5257984);
allocate(1, "i8", ALLOC_NONE, 5258024);
allocate([0,0,0,0,96,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258028);
allocate(1, "i8", ALLOC_NONE, 5258060);
allocate([0,0,0,0,128,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258064);
allocate(1, "i8", ALLOC_NONE, 5258096);
allocate([0,0,0,0,160,79,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258100);
allocate(1, "i8", ALLOC_NONE, 5258116);
allocate([0,0,0,0,168,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258120);
allocate(1, "i8", ALLOC_NONE, 5258140);
allocate([0,0,0,0,180,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258144);
allocate(1, "i8", ALLOC_NONE, 5258196);
allocate([0,0,0,0,212,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258200);
allocate(1, "i8", ALLOC_NONE, 5258252);
allocate([0,0,0,0,244,79,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258256);
allocate(1, "i8", ALLOC_NONE, 5258320);
allocate([0,0,0,0,20,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258324);
allocate(1, "i8", ALLOC_NONE, 5258388);
allocate([0,0,0,0,52,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258392);
allocate(1, "i8", ALLOC_NONE, 5258424);
allocate([0,0,0,0,64,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258428);
allocate(1, "i8", ALLOC_NONE, 5258460);
allocate([0,0,0,0,76,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258464);
allocate(1, "i8", ALLOC_NONE, 5258512);
allocate([0,0,0,0,108,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258516);
allocate(1, "i8", ALLOC_NONE, 5258564);
allocate([0,0,0,0,140,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258568);
allocate(1, "i8", ALLOC_NONE, 5258616);
allocate([0,0,0,0,172,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258620);
allocate(1, "i8", ALLOC_NONE, 5258668);
allocate([0,0,0,0,204,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258672);
allocate(1, "i8", ALLOC_NONE, 5258692);
allocate([0,0,0,0,216,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258696);
allocate(1, "i8", ALLOC_NONE, 5258716);
allocate([0,0,0,0,228,80,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258720);
allocate(1, "i8", ALLOC_NONE, 5258788);
allocate([0,0,0,0,4,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258792);
allocate(1, "i8", ALLOC_NONE, 5258844);
allocate([0,0,0,0,52,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258848);
allocate(1, "i8", ALLOC_NONE, 5258884);
allocate([0,0,0,0,64,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258888);
allocate(1, "i8", ALLOC_NONE, 5258936);
allocate([0,0,0,0,76,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258940);
allocate(1, "i8", ALLOC_NONE, 5258988);
allocate([0,0,0,0,88,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5258992);
allocate(1, "i8", ALLOC_NONE, 5259056);
allocate([0,0,0,0,96,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259060);
allocate(1, "i8", ALLOC_NONE, 5259124);
allocate([4,0,0,0,0,0,0,0,144,81,80,0,0,0,0,0,0,0,0,0,252,255,255,255,252,255,255,255,144,81,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259128);
allocate(1, "i8", ALLOC_NONE, 5259168);
allocate([4,0,0,0,0,0,0,0,168,81,80,0,0,0,0,0,0,0,0,0,252,255,255,255,252,255,255,255,168,81,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259172);
allocate(1, "i8", ALLOC_NONE, 5259212);
allocate([8,0,0,0,0,0,0,0,192,81,80,0,0,0,0,0,0,0,0,0,248,255,255,255,248,255,255,255,192,81,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259216);
allocate(1, "i8", ALLOC_NONE, 5259256);
allocate([8,0,0,0,0,0,0,0,216,81,80,0,0,0,0,0,0,0,0,0,248,255,255,255,248,255,255,255,216,81,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259260);
allocate(1, "i8", ALLOC_NONE, 5259300);
allocate([0,0,0,0,240,81,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259304);
allocate(1, "i8", ALLOC_NONE, 5259324);
allocate([0,0,0,0,16,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259328);
allocate(1, "i8", ALLOC_NONE, 5259392);
allocate([0,0,0,0,28,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259396);
allocate(1, "i8", ALLOC_NONE, 5259460);
allocate([0,0,0,0,72,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259464);
allocate(1, "i8", ALLOC_NONE, 5259520);
allocate([0,0,0,0,104,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259524);
allocate(1, "i8", ALLOC_NONE, 5259580);
allocate([0,0,0,0,136,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259584);
allocate(1, "i8", ALLOC_NONE, 5259640);
allocate([0,0,0,0,168,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259644);
allocate(1, "i8", ALLOC_NONE, 5259700);
allocate([0,0,0,0,224,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259704);
allocate(1, "i8", ALLOC_NONE, 5259768);
allocate([0,0,0,0,236,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259772);
allocate(1, "i8", ALLOC_NONE, 5259836);
allocate([0,0,0,0,248,82,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259840);
allocate(1, "i8", ALLOC_NONE, 5259880);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,4,83,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
allocate(1, "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,16,83,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
allocate(1, "i8", ALLOC_STATIC);
allocate([83,116,57,116,121,112,101,95,105,110,102,111,0] /* St9type_info\00 */, "i8", ALLOC_NONE, 5259884);
allocate([83,116,57,101,120,99,101,112,116,105,111,110,0] /* St9exception\00 */, "i8", ALLOC_NONE, 5259900);
allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_NONE, 5259916);
allocate([83,116,56,98,97,100,95,99,97,115,116,0] /* St8bad_cast\00 */, "i8", ALLOC_NONE, 5259932);
allocate([83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0] /* St13runtime_error\00 */, "i8", ALLOC_NONE, 5259944);
allocate([83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0] /* St12length_error\00 */, "i8", ALLOC_NONE, 5259964);
allocate([83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0] /* St11logic_error\00 */, "i8", ALLOC_NONE, 5259984);
allocate([78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0] /* NSt3__19time_baseE\0 */, "i8", ALLOC_NONE, 5260000);
allocate([78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0] /* NSt3__19money_putIwN */, "i8", ALLOC_NONE, 5260020);
allocate([78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0] /* NSt3__19money_putIcN */, "i8", ALLOC_NONE, 5260092);
allocate([78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0] /* NSt3__19money_getIwN */, "i8", ALLOC_NONE, 5260164);
allocate([78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0] /* NSt3__19money_getIcN */, "i8", ALLOC_NONE, 5260236);
allocate([78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0] /* NSt3__19basic_iosIwN */, "i8", ALLOC_NONE, 5260308);
allocate([78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0] /* NSt3__19basic_iosIcN */, "i8", ALLOC_NONE, 5260352);
allocate([78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0] /* NSt3__19__num_putIwE */, "i8", ALLOC_NONE, 5260396);
allocate([78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0] /* NSt3__19__num_putIcE */, "i8", ALLOC_NONE, 5260420);
allocate([78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0] /* NSt3__19__num_getIwE */, "i8", ALLOC_NONE, 5260444);
allocate([78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0] /* NSt3__19__num_getIcE */, "i8", ALLOC_NONE, 5260468);
allocate([78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0] /* NSt3__18time_putIwNS */, "i8", ALLOC_NONE, 5260492);
allocate([78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0] /* NSt3__18time_putIcNS */, "i8", ALLOC_NONE, 5260564);
allocate([78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0] /* NSt3__18time_getIwNS */, "i8", ALLOC_NONE, 5260636);
allocate([78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0] /* NSt3__18time_getIcNS */, "i8", ALLOC_NONE, 5260708);
allocate([78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0] /* NSt3__18numpunctIwEE */, "i8", ALLOC_NONE, 5260780);
allocate([78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0] /* NSt3__18numpunctIcEE */, "i8", ALLOC_NONE, 5260804);
allocate([78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0] /* NSt3__18messagesIwEE */, "i8", ALLOC_NONE, 5260828);
allocate([78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0] /* NSt3__18messagesIcEE */, "i8", ALLOC_NONE, 5260852);
allocate([78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0] /* NSt3__18ios_baseE\00 */, "i8", ALLOC_NONE, 5260876);
allocate([78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0] /* NSt3__18ios_base7fai */, "i8", ALLOC_NONE, 5260896);
allocate([78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0] /* NSt3__17num_putIwNS_ */, "i8", ALLOC_NONE, 5260924);
allocate([78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0] /* NSt3__17num_putIcNS_ */, "i8", ALLOC_NONE, 5260992);
allocate([78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0] /* NSt3__17num_getIwNS_ */, "i8", ALLOC_NONE, 5261060);
allocate([78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0] /* NSt3__17num_getIcNS_ */, "i8", ALLOC_NONE, 5261128);
allocate([78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0] /* NSt3__17collateIwEE\ */, "i8", ALLOC_NONE, 5261196);
allocate([78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0] /* NSt3__17collateIcEE\ */, "i8", ALLOC_NONE, 5261216);
allocate([78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0] /* NSt3__17codecvtIwc10 */, "i8", ALLOC_NONE, 5261236);
allocate([78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0] /* NSt3__17codecvtIcc10 */, "i8", ALLOC_NONE, 5261272);
allocate([78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0] /* NSt3__17codecvtIDsc1 */, "i8", ALLOC_NONE, 5261308);
allocate([78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,48,95,109,98,115,116,97,116,101,95,116,69,69,0] /* NSt3__17codecvtIDic1 */, "i8", ALLOC_NONE, 5261344);
allocate([78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0] /* NSt3__16locale5facet */, "i8", ALLOC_NONE, 5261380);
allocate([78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0] /* NSt3__16locale5__imp */, "i8", ALLOC_NONE, 5261404);
allocate([78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0] /* NSt3__15ctypeIwEE\00 */, "i8", ALLOC_NONE, 5261428);
allocate([78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0] /* NSt3__15ctypeIcEE\00 */, "i8", ALLOC_NONE, 5261448);
allocate([78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0] /* NSt3__120__time_get_ */, "i8", ALLOC_NONE, 5261468);
allocate([78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0] /* NSt3__120__time_get_ */, "i8", ALLOC_NONE, 5261504);
allocate([78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0] /* NSt3__119__iostream_ */, "i8", ALLOC_NONE, 5261540);
allocate([78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0] /* NSt3__117__widen_fro */, "i8", ALLOC_NONE, 5261572);
allocate([78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0] /* NSt3__116__narrow_to */, "i8", ALLOC_NONE, 5261608);
allocate([78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0] /* NSt3__115basic_strea */, "i8", ALLOC_NONE, 5261644);
allocate([78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0] /* NSt3__115basic_strea */, "i8", ALLOC_NONE, 5261696);
allocate([78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0] /* NSt3__114error_categ */, "i8", ALLOC_NONE, 5261748);
allocate([78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0] /* NSt3__114__shared_co */, "i8", ALLOC_NONE, 5261776);
allocate([78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0] /* NSt3__114__num_put_b */, "i8", ALLOC_NONE, 5261804);
allocate([78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0] /* NSt3__114__num_get_b */, "i8", ALLOC_NONE, 5261832);
allocate([78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0] /* NSt3__113messages_ba */, "i8", ALLOC_NONE, 5261860);
allocate([78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0] /* NSt3__113basic_ostre */, "i8", ALLOC_NONE, 5261884);
allocate([78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0] /* NSt3__113basic_ostre */, "i8", ALLOC_NONE, 5261932);
allocate([78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0] /* NSt3__113basic_istre */, "i8", ALLOC_NONE, 5261980);
allocate([78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0] /* NSt3__113basic_istre */, "i8", ALLOC_NONE, 5262028);
allocate([78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0] /* NSt3__112system_erro */, "i8", ALLOC_NONE, 5262076);
allocate([78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0] /* NSt3__112codecvt_bas */, "i8", ALLOC_NONE, 5262100);
allocate([78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0] /* NSt3__112__do_messag */, "i8", ALLOC_NONE, 5262124);
allocate([78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0] /* NSt3__111__stdoutbuf */, "i8", ALLOC_NONE, 5262148);
allocate([78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0] /* NSt3__111__stdoutbuf */, "i8", ALLOC_NONE, 5262176);
allocate([78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0] /* NSt3__111__money_put */, "i8", ALLOC_NONE, 5262204);
allocate([78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0] /* NSt3__111__money_put */, "i8", ALLOC_NONE, 5262232);
allocate([78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0] /* NSt3__111__money_get */, "i8", ALLOC_NONE, 5262260);
allocate([78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0] /* NSt3__111__money_get */, "i8", ALLOC_NONE, 5262288);
allocate([78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0] /* NSt3__110moneypunctI */, "i8", ALLOC_NONE, 5262316);
allocate([78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0] /* NSt3__110moneypunctI */, "i8", ALLOC_NONE, 5262344);
allocate([78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0] /* NSt3__110moneypunctI */, "i8", ALLOC_NONE, 5262372);
allocate([78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0] /* NSt3__110moneypunctI */, "i8", ALLOC_NONE, 5262400);
allocate([78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0] /* NSt3__110money_baseE */, "i8", ALLOC_NONE, 5262428);
allocate([78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0] /* NSt3__110ctype_baseE */, "i8", ALLOC_NONE, 5262452);
allocate([78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0] /* NSt3__110__time_putE */, "i8", ALLOC_NONE, 5262476);
allocate([78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0] /* NSt3__110__stdinbufI */, "i8", ALLOC_NONE, 5262500);
allocate([78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0] /* NSt3__110__stdinbufI */, "i8", ALLOC_NONE, 5262524);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv121__vmi */, "i8", ALLOC_NONE, 5262548);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv120__si_ */, "i8", ALLOC_NONE, 5262588);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv117__cla */, "i8", ALLOC_NONE, 5262628);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv116__shi */, "i8", ALLOC_NONE, 5262664);
allocate(8, "i8", ALLOC_NONE, 5262700);
allocate(8, "i8", ALLOC_NONE, 5262708);
allocate([0,0,0,0,0,0,0,0,116,77,80,0], "i8", ALLOC_NONE, 5262716);
allocate([0,0,0,0,0,0,0,0,116,77,80,0], "i8", ALLOC_NONE, 5262728);
allocate([0,0,0,0,0,0,0,0,116,77,80,0], "i8", ALLOC_NONE, 5262740);
allocate([0,0,0,0,0,0,0,0,172,77,80,0], "i8", ALLOC_NONE, 5262752);
allocate([0,0,0,0,0,0,0,0,116,77,80,0], "i8", ALLOC_NONE, 5262764);
allocate(8, "i8", ALLOC_NONE, 5262776);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,40,82,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262784);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,48,82,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262816);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,56,82,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262848);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,64,82,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262880);
allocate([0,0,0,0,0,0,0,0,160,79,80,0], "i8", ALLOC_NONE, 5262912);
allocate([0,0,0,0,0,0,0,0,160,79,80,0], "i8", ALLOC_NONE, 5262924);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,120,81,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262936);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,120,81,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262960);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,128,81,80,0,0,0,0,0], "i8", ALLOC_NONE, 5262984);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,128,81,80,0,0,0,0,0], "i8", ALLOC_NONE, 5263008);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,216,82,80,0,0,8,0,0], "i8", ALLOC_NONE, 5263032);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,216,82,80,0,0,8,0,0], "i8", ALLOC_NONE, 5263064);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,204,80,80,0,2,0,0,0,184,77,80,0,2,0,0,0,36,81,80,0,0,8,0,0], "i8", ALLOC_NONE, 5263096);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,204,80,80,0,2,0,0,0,184,77,80,0,2,0,0,0,44,81,80,0,0,8,0,0], "i8", ALLOC_NONE, 5263136);
allocate([0,0,0,0,0,0,0,0,204,80,80,0], "i8", ALLOC_NONE, 5263176);
allocate([0,0,0,0,0,0,0,0,204,80,80,0], "i8", ALLOC_NONE, 5263188);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,136,81,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263200);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,136,81,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263232);
allocate(8, "i8", ALLOC_NONE, 5263264);
allocate([0,0,0,0,0,0,0,0,240,81,80,0], "i8", ALLOC_NONE, 5263272);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,88,78,80,0,0,0,0,0], "i8", ALLOC_NONE, 5263284);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,112,78,80,0,0,0,0,0], "i8", ALLOC_NONE, 5263316);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,136,78,80,0,0,0,0,0], "i8", ALLOC_NONE, 5263348);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,160,78,80,0,0,0,0,0], "i8", ALLOC_NONE, 5263380);
allocate([0,0,0,0,0,0,0,0,204,80,80,0], "i8", ALLOC_NONE, 5263412);
allocate([0,0,0,0,0,0,0,0,204,80,80,0], "i8", ALLOC_NONE, 5263424);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,252,81,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263436);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,252,81,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263468);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,252,81,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263500);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,252,81,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263532);
allocate([0,0,0,0,0,0,0,0,112,81,80,0], "i8", ALLOC_NONE, 5263564);
allocate([0,0,0,0,0,0,0,0,204,80,80,0], "i8", ALLOC_NONE, 5263576);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,208,82,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263588);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,208,82,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263620);
allocate(8, "i8", ALLOC_NONE, 5263652);
allocate(8, "i8", ALLOC_NONE, 5263660);
allocate([0,0,0,0,0,0,0,0,4,82,80,0], "i8", ALLOC_NONE, 5263668);
allocate([0,0,0,0,0,0,0,0,172,80,80,0], "i8", ALLOC_NONE, 5263680);
allocate([0,0,0,0,0,0,0,0,172,80,80,0], "i8", ALLOC_NONE, 5263692);
allocate(8, "i8", ALLOC_NONE, 5263704);
allocate(8, "i8", ALLOC_NONE, 5263712);
allocate(8, "i8", ALLOC_NONE, 5263720);
allocate(8, "i8", ALLOC_NONE, 5263728);
allocate(8, "i8", ALLOC_NONE, 5263736);
allocate(8, "i8", ALLOC_NONE, 5263744);
allocate(8, "i8", ALLOC_NONE, 5263752);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,64,78,80,0,3,244,255,255], "i8", ALLOC_NONE, 5263760);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,76,78,80,0,3,244,255,255], "i8", ALLOC_NONE, 5263784);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,64,78,80,0,3,244,255,255], "i8", ALLOC_NONE, 5263808);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,76,78,80,0,3,244,255,255], "i8", ALLOC_NONE, 5263832);
allocate([0,0,0,0,0,0,0,0,148,77,80,0], "i8", ALLOC_NONE, 5263856);
allocate(8, "i8", ALLOC_NONE, 5263868);
allocate([0,0,0,0,0,0,0,0,104,81,80,0], "i8", ALLOC_NONE, 5263876);
allocate([0,0,0,0,0,0,0,0,88,81,80,0], "i8", ALLOC_NONE, 5263888);
allocate([0,0,0,0,0,0,0,0,96,81,80,0], "i8", ALLOC_NONE, 5263900);
allocate(8, "i8", ALLOC_NONE, 5263912);
allocate(8, "i8", ALLOC_NONE, 5263920);
allocate(8, "i8", ALLOC_NONE, 5263928);
allocate(8, "i8", ALLOC_NONE, 5263936);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,200,82,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263944);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,200,82,80,0,2,0,0,0], "i8", ALLOC_NONE, 5263976);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,200,82,80,0,2,0,0,0], "i8", ALLOC_NONE, 5264008);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,204,80,80,0,2,0,0,0,200,82,80,0,2,0,0,0], "i8", ALLOC_NONE, 5264040);
allocate(8, "i8", ALLOC_NONE, 5264072);
allocate(8, "i8", ALLOC_NONE, 5264080);
allocate(8, "i8", ALLOC_NONE, 5264088);
allocate([0,0,0,0,0,0,0,0,88,81,80,0], "i8", ALLOC_NONE, 5264096);
allocate([0,0,0,0,0,0,0,0,96,81,80,0], "i8", ALLOC_NONE, 5264108);
allocate([0,0,0,0,0,0,0,0,16,83,80,0], "i8", ALLOC_NONE, 5264120);
allocate([0,0,0,0,0,0,0,0,16,83,80,0], "i8", ALLOC_NONE, 5264132);
allocate([0,0,0,0,0,0,0,0,28,83,80,0], "i8", ALLOC_NONE, 5264144);
allocate([0,0,0,0,0,0,0,0,108,77,80,0], "i8", ALLOC_NONE, 5264156);
allocate(52, "i8", ALLOC_NONE, 5264168);
allocate(52, "i8", ALLOC_NONE, 5264220);
allocate(56, "i8", ALLOC_NONE, 5264272);
allocate(52, "i8", ALLOC_NONE, 5264328);
allocate(52, "i8", ALLOC_NONE, 5264380);
allocate(56, "i8", ALLOC_NONE, 5264432);
allocate([255,255,255,255], "i8", ALLOC_NONE, 5264488);
allocate([255,255,255,255], "i8", ALLOC_NONE, 5264492);
allocate(8, "i8", ALLOC_NONE, 5264496);
allocate(8, "i8", ALLOC_NONE, 5264504);
allocate(8, "i8", ALLOC_NONE, 5264512);
allocate(8, "i8", ALLOC_NONE, 5264520);
allocate(8, "i8", ALLOC_NONE, 5264528);
allocate(8, "i8", ALLOC_NONE, 5264536);
allocate(8, "i8", ALLOC_NONE, 5264544);
allocate(8, "i8", ALLOC_NONE, 5264552);
allocate(8, "i8", ALLOC_NONE, 5264560);
allocate(8, "i8", ALLOC_NONE, 5264568);
allocate(8, "i8", ALLOC_NONE, 5264576);
allocate(8, "i8", ALLOC_NONE, 5264584);
allocate(8, "i8", ALLOC_NONE, 5264592);
allocate(8, "i8", ALLOC_NONE, 5264600);
allocate(8, "i8", ALLOC_NONE, 5264608);
allocate(8, "i8", ALLOC_NONE, 5264616);
allocate(8, "i8", ALLOC_NONE, 5264624);
allocate(8, "i8", ALLOC_NONE, 5264632);
allocate(8, "i8", ALLOC_NONE, 5264640);
allocate(8, "i8", ALLOC_NONE, 5264648);
allocate(8, "i8", ALLOC_NONE, 5264656);
allocate(8, "i8", ALLOC_NONE, 5264664);
allocate(4, "i8", ALLOC_NONE, 5264672);
allocate(84, "i8", ALLOC_NONE, 5264676);
allocate(84, "i8", ALLOC_NONE, 5264760);
allocate(84, "i8", ALLOC_NONE, 5264844);
allocate(8, "i8", ALLOC_NONE, 5264928);
allocate(8, "i8", ALLOC_NONE, 5264936);
allocate(88, "i8", ALLOC_NONE, 5264944);
allocate(84, "i8", ALLOC_NONE, 5265032);
allocate(84, "i8", ALLOC_NONE, 5265116);
allocate(84, "i8", ALLOC_NONE, 5265200);
allocate(88, "i8", ALLOC_NONE, 5265284);
allocate(1, "i8", ALLOC_NONE, 5265372);
allocate([48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0] /* 0123456789abcdefABCD */, "i8", ALLOC_NONE, 5265376);
allocate(8, "i8", ALLOC_NONE, 5265412);
allocate(8, "i8", ALLOC_NONE, 5265420);
allocate(8, "i8", ALLOC_NONE, 5265428);
allocate(8, "i8", ALLOC_NONE, 5265436);
allocate(4, "i8", ALLOC_NONE, 5265444);
allocate(4, "i8", ALLOC_NONE, 5265448);
allocate(8, "i8", ALLOC_NONE, 5265452);
allocate(8, "i8", ALLOC_NONE, 5265460);
allocate(8, "i8", ALLOC_NONE, 5265468);
allocate(8, "i8", ALLOC_NONE, 5265476);
allocate(8, "i8", ALLOC_NONE, 5265484);
allocate(8, "i8", ALLOC_NONE, 5265492);
allocate(8, "i8", ALLOC_NONE, 5265500);
allocate(8, "i8", ALLOC_NONE, 5265508);
allocate(8, "i8", ALLOC_NONE, 5265516);
allocate(8, "i8", ALLOC_NONE, 5265524);
allocate(8, "i8", ALLOC_NONE, 5265532);
allocate(8, "i8", ALLOC_NONE, 5265540);
allocate(8, "i8", ALLOC_NONE, 5265548);
allocate(8, "i8", ALLOC_NONE, 5265556);
allocate(8, "i8", ALLOC_NONE, 5265564);
allocate(8, "i8", ALLOC_NONE, 5265572);
allocate(8, "i8", ALLOC_NONE, 5265580);
allocate(8, "i8", ALLOC_NONE, 5265588);
allocate(8, "i8", ALLOC_NONE, 5265596);
allocate(8, "i8", ALLOC_NONE, 5265604);
allocate(8, "i8", ALLOC_NONE, 5265612);
allocate(8, "i8", ALLOC_NONE, 5265620);
allocate(8, "i8", ALLOC_NONE, 5265628);
allocate(8, "i8", ALLOC_NONE, 5265636);
allocate(8, "i8", ALLOC_NONE, 5265644);
allocate(8, "i8", ALLOC_NONE, 5265652);
allocate(8, "i8", ALLOC_NONE, 5265660);
allocate(8, "i8", ALLOC_NONE, 5265668);
allocate(8, "i8", ALLOC_NONE, 5265676);
allocate(8, "i8", ALLOC_NONE, 5265684);
allocate(8, "i8", ALLOC_NONE, 5265692);
allocate(8, "i8", ALLOC_NONE, 5265700);
allocate(8, "i8", ALLOC_NONE, 5265708);
allocate(8, "i8", ALLOC_NONE, 5265716);
allocate(8, "i8", ALLOC_NONE, 5265724);
allocate(8, "i8", ALLOC_NONE, 5265732);
allocate(8, "i8", ALLOC_NONE, 5265740);
allocate(8, "i8", ALLOC_NONE, 5265748);
allocate(8, "i8", ALLOC_NONE, 5265756);
allocate(8, "i8", ALLOC_NONE, 5265764);
allocate(8, "i8", ALLOC_NONE, 5265772);
allocate(8, "i8", ALLOC_NONE, 5265780);
allocate(8, "i8", ALLOC_NONE, 5265788);
allocate(8, "i8", ALLOC_NONE, 5265796);
HEAP32[((5257468)>>2)]=(348);
HEAP32[((5257472)>>2)]=(328);
HEAP32[((5257476)>>2)]=(578);
HEAP32[((5257492)>>2)]=(378);
HEAP32[((5257496)>>2)]=(442);
HEAP32[((5257500)>>2)]=(216);
HEAP32[((5257516)>>2)]=(44);
HEAP32[((5257520)>>2)]=(764);
HEAP32[((5257524)>>2)]=(230);
HEAP32[((5257540)>>2)]=(70);
HEAP32[((5257544)>>2)]=(20);
HEAP32[((5257548)>>2)]=(618);
HEAP32[((5257564)>>2)]=(8);
HEAP32[((5257568)>>2)]=(42);
HEAP32[((5257572)>>2)]=(618);
HEAP32[((5257588)>>2)]=(452);
HEAP32[((5257592)>>2)]=(236);
HEAP32[((5257596)>>2)]=(118);
HEAP32[((5257600)>>2)]=(494);
HEAP32[((5257604)>>2)]=(52);
HEAP32[((5257620)>>2)]=(686);
HEAP32[((5257624)>>2)]=(504);
HEAP32[((5257628)>>2)]=(118);
HEAP32[((5257632)>>2)]=(714);
HEAP32[((5257636)>>2)]=(102);
HEAP32[((5257652)>>2)]=(440);
HEAP32[((5257656)>>2)]=(508);
HEAP32[((5257660)>>2)]=(118);
HEAP32[((5257664)>>2)]=(496);
HEAP32[((5257668)>>2)]=(736);
HEAP32[((5257684)>>2)]=(758);
HEAP32[((5257688)>>2)]=(390);
HEAP32[((5257692)>>2)]=(118);
HEAP32[((5257696)>>2)]=(482);
HEAP32[((5257700)>>2)]=(560);
HEAP32[((5257716)>>2)]=(744);
HEAP32[((5257720)>>2)]=(40);
HEAP32[((5257724)>>2)]=(118);
HEAP32[((5257728)>>2)]=(122);
HEAP32[((5257744)>>2)]=(438);
HEAP32[((5257748)>>2)]=(310);
HEAP32[((5257752)>>2)]=(118);
HEAP32[((5257756)>>2)]=(178);
HEAP32[((5257772)>>2)]=(86);
HEAP32[((5257776)>>2)]=(312);
HEAP32[((5257780)>>2)]=(118);
HEAP32[((5257784)>>2)]=(656);
HEAP32[((5257788)>>2)]=(24);
HEAP32[((5257792)>>2)]=(510);
HEAP32[((5257796)>>2)]=(32);
HEAP32[((5257800)>>2)]=(212);
HEAP32[((5257804)>>2)]=(658);
HEAP32[((5257808)>>2)]=(242);
HEAP32[((5257820)>>2)]=(114);
HEAP32[((5257824)>>2)]=(48);
HEAP32[((5257828)>>2)]=(186);
HEAP32[((5257832)>>2)]=(74);
HEAP32[((5257836)>>2)]=(10);
HEAP32[((5257840)>>2)]=(172);
HEAP32[((5257844)>>2)]=(688);
HEAP32[((5257860)>>2)]=(728);
HEAP32[((5257864)>>2)]=(670);
HEAP32[((5257868)>>2)]=(118);
HEAP32[((5257872)>>2)]=(110);
HEAP32[((5257876)>>2)]=(134);
HEAP32[((5257880)>>2)]=(690);
HEAP32[((5257884)>>2)]=(402);
HEAP32[((5257888)>>2)]=(170);
HEAP32[((5257892)>>2)]=(16);
HEAP32[((5257896)>>2)]=(640);
HEAP32[((5257908)>>2)]=(374);
HEAP32[((5257912)>>2)]=(592);
HEAP32[((5257916)>>2)]=(642);
HEAP32[((5257920)>>2)]=(678);
HEAP32[((5257924)>>2)]=(334);
HEAP32[((5257928)>>2)]=(254);
HEAP32[((5257932)>>2)]=(290);
HEAP32[((5257948)>>2)]=(462);
HEAP32[((5257952)>>2)]=(514);
HEAP32[((5257956)>>2)]=(118);
HEAP32[((5257960)>>2)]=(272);
HEAP32[((5257964)>>2)]=(240);
HEAP32[((5257968)>>2)]=(116);
HEAP32[((5257972)>>2)]=(380);
HEAP32[((5257976)>>2)]=(466);
HEAP32[((5257992)>>2)]=(124);
HEAP32[((5257996)>>2)]=(180);
HEAP32[((5258000)>>2)]=(118);
HEAP32[((5258004)>>2)]=(248);
HEAP32[((5258008)>>2)]=(500);
HEAP32[((5258012)>>2)]=(166);
HEAP32[((5258016)>>2)]=(488);
HEAP32[((5258020)>>2)]=(6);
HEAP32[((5258036)>>2)]=(732);
HEAP32[((5258040)>>2)]=(2);
HEAP32[((5258044)>>2)]=(118);
HEAP32[((5258048)>>2)]=(416);
HEAP32[((5258052)>>2)]=(750);
HEAP32[((5258056)>>2)]=(576);
HEAP32[((5258072)>>2)]=(112);
HEAP32[((5258076)>>2)]=(636);
HEAP32[((5258080)>>2)]=(118);
HEAP32[((5258084)>>2)]=(668);
HEAP32[((5258088)>>2)]=(222);
HEAP32[((5258092)>>2)]=(196);
HEAP32[((5258108)>>2)]=(382);
HEAP32[((5258112)>>2)]=(324);
HEAP32[((5258128)>>2)]=(434);
HEAP32[((5258132)>>2)]=(388);
HEAP32[((5258136)>>2)]=(230);
HEAP32[((5258152)>>2)]=(14);
HEAP32[((5258156)>>2)]=(460);
HEAP32[((5258160)>>2)]=(118);
HEAP32[((5258164)>>2)]=(566);
HEAP32[((5258168)>>2)]=(84);
HEAP32[((5258172)>>2)]=(78);
HEAP32[((5258176)>>2)]=(82);
HEAP32[((5258180)>>2)]=(76);
HEAP32[((5258184)>>2)]=(92);
HEAP32[((5258188)>>2)]=(90);
HEAP32[((5258192)>>2)]=(160);
HEAP32[((5258208)>>2)]=(270);
HEAP32[((5258212)>>2)]=(264);
HEAP32[((5258216)>>2)]=(118);
HEAP32[((5258220)>>2)]=(546);
HEAP32[((5258224)>>2)]=(550);
HEAP32[((5258228)>>2)]=(540);
HEAP32[((5258232)>>2)]=(548);
HEAP32[((5258236)>>2)]=(538);
HEAP32[((5258240)>>2)]=(544);
HEAP32[((5258244)>>2)]=(542);
HEAP32[((5258248)>>2)]=(464);
HEAP32[((5258264)>>2)]=(88);
HEAP32[((5258268)>>2)]=(50);
HEAP32[((5258272)>>2)]=(118);
HEAP32[((5258276)>>2)]=(602);
HEAP32[((5258280)>>2)]=(600);
HEAP32[((5258284)>>2)]=(590);
HEAP32[((5258288)>>2)]=(594);
HEAP32[((5258292)>>2)]=(498);
HEAP32[((5258296)>>2)]=(598);
HEAP32[((5258300)>>2)]=(588);
HEAP32[((5258304)>>2)]=(608);
HEAP32[((5258308)>>2)]=(606);
HEAP32[((5258312)>>2)]=(604);
HEAP32[((5258316)>>2)]=(360);
HEAP32[((5258332)>>2)]=(140);
HEAP32[((5258336)>>2)]=(4);
HEAP32[((5258340)>>2)]=(118);
HEAP32[((5258344)>>2)]=(722);
HEAP32[((5258348)>>2)]=(712);
HEAP32[((5258352)>>2)]=(706);
HEAP32[((5258356)>>2)]=(708);
HEAP32[((5258360)>>2)]=(684);
HEAP32[((5258364)>>2)]=(710);
HEAP32[((5258368)>>2)]=(704);
HEAP32[((5258372)>>2)]=(720);
HEAP32[((5258376)>>2)]=(718);
HEAP32[((5258380)>>2)]=(716);
HEAP32[((5258384)>>2)]=(596);
HEAP32[((5258400)>>2)]=(210);
HEAP32[((5258404)>>2)]=(256);
HEAP32[((5258408)>>2)]=(118);
HEAP32[((5258412)>>2)]=(356);
HEAP32[((5258416)>>2)]=(536);
HEAP32[((5258420)>>2)]=(314);
HEAP32[((5258436)>>2)]=(64);
HEAP32[((5258440)>>2)]=(468);
HEAP32[((5258444)>>2)]=(118);
HEAP32[((5258448)>>2)]=(528);
HEAP32[((5258452)>>2)]=(630);
HEAP32[((5258456)>>2)]=(46);
HEAP32[((5258472)>>2)]=(154);
HEAP32[((5258476)>>2)]=(368);
HEAP32[((5258480)>>2)]=(118);
HEAP32[((5258484)>>2)]=(532);
HEAP32[((5258488)>>2)]=(146);
HEAP32[((5258492)>>2)]=(526);
HEAP32[((5258496)>>2)]=(96);
HEAP32[((5258500)>>2)]=(332);
HEAP32[((5258504)>>2)]=(108);
HEAP32[((5258508)>>2)]=(408);
HEAP32[((5258524)>>2)]=(692);
HEAP32[((5258528)>>2)]=(164);
HEAP32[((5258532)>>2)]=(118);
HEAP32[((5258536)>>2)]=(56);
HEAP32[((5258540)>>2)]=(302);
HEAP32[((5258544)>>2)]=(174);
HEAP32[((5258548)>>2)]=(610);
HEAP32[((5258552)>>2)]=(574);
HEAP32[((5258556)>>2)]=(484);
HEAP32[((5258560)>>2)]=(570);
HEAP32[((5258576)>>2)]=(138);
HEAP32[((5258580)>>2)]=(372);
HEAP32[((5258584)>>2)]=(118);
HEAP32[((5258588)>>2)]=(746);
HEAP32[((5258592)>>2)]=(148);
HEAP32[((5258596)>>2)]=(68);
HEAP32[((5258600)>>2)]=(754);
HEAP32[((5258604)>>2)]=(260);
HEAP32[((5258608)>>2)]=(262);
HEAP32[((5258612)>>2)]=(106);
HEAP32[((5258628)>>2)]=(188);
HEAP32[((5258632)>>2)]=(418);
HEAP32[((5258636)>>2)]=(118);
HEAP32[((5258640)>>2)]=(342);
HEAP32[((5258644)>>2)]=(346);
HEAP32[((5258648)>>2)]=(558);
HEAP32[((5258652)>>2)]=(204);
HEAP32[((5258656)>>2)]=(404);
HEAP32[((5258660)>>2)]=(156);
HEAP32[((5258664)>>2)]=(344);
HEAP32[((5258680)>>2)]=(132);
HEAP32[((5258684)>>2)]=(72);
HEAP32[((5258688)>>2)]=(118);
HEAP32[((5258704)>>2)]=(376);
HEAP32[((5258708)>>2)]=(424);
HEAP32[((5258712)>>2)]=(118);
HEAP32[((5258728)>>2)]=(748);
HEAP32[((5258732)>>2)]=(228);
HEAP32[((5258736)>>2)]=(118);
HEAP32[((5258740)>>2)]=(392);
HEAP32[((5258744)>>2)]=(198);
HEAP32[((5258748)>>2)]=(340);
HEAP32[((5258752)>>2)]=(740);
HEAP32[((5258756)>>2)]=(200);
HEAP32[((5258760)>>2)]=(562);
HEAP32[((5258764)>>2)]=(518);
HEAP32[((5258768)>>2)]=(60);
HEAP32[((5258772)>>2)]=(120);
HEAP32[((5258776)>>2)]=(646);
HEAP32[((5258780)>>2)]=(292);
HEAP32[((5258784)>>2)]=(202);
HEAP32[((5258800)>>2)]=(218);
HEAP32[((5258804)>>2)]=(80);
HEAP32[((5258808)>>2)]=(118);
HEAP32[((5258812)>>2)]=(26);
HEAP32[((5258816)>>2)]=(54);
HEAP32[((5258820)>>2)]=(362);
HEAP32[((5258824)>>2)]=(638);
HEAP32[((5258828)>>2)]=(150);
HEAP32[((5258832)>>2)]=(366);
HEAP32[((5258836)>>2)]=(444);
HEAP32[((5258840)>>2)]=(398);
HEAP32[((5258856)>>2)]=(184);
HEAP32[((5258860)>>2)]=(660);
HEAP32[((5258864)>>2)]=(428);
HEAP32[((5258868)>>2)]=(568);
HEAP32[((5258872)>>2)]=(336);
HEAP32[((5258876)>>2)]=(614);
HEAP32[((5258880)>>2)]=(620);
HEAP32[((5258896)>>2)]=(448);
HEAP32[((5258900)>>2)]=(238);
HEAP32[((5258904)>>2)]=(118);
HEAP32[((5258908)>>2)]=(342);
HEAP32[((5258912)>>2)]=(346);
HEAP32[((5258916)>>2)]=(558);
HEAP32[((5258920)>>2)]=(204);
HEAP32[((5258924)>>2)]=(404);
HEAP32[((5258928)>>2)]=(156);
HEAP32[((5258932)>>2)]=(344);
HEAP32[((5258948)>>2)]=(768);
HEAP32[((5258952)>>2)]=(406);
HEAP32[((5258956)>>2)]=(118);
HEAP32[((5258960)>>2)]=(342);
HEAP32[((5258964)>>2)]=(346);
HEAP32[((5258968)>>2)]=(558);
HEAP32[((5258972)>>2)]=(204);
HEAP32[((5258976)>>2)]=(404);
HEAP32[((5258980)>>2)]=(156);
HEAP32[((5258984)>>2)]=(344);
HEAP32[((5259000)>>2)]=(352);
HEAP32[((5259004)>>2)]=(696);
HEAP32[((5259008)>>2)]=(206);
HEAP32[((5259012)>>2)]=(412);
HEAP32[((5259016)>>2)]=(266);
HEAP32[((5259020)>>2)]=(492);
HEAP32[((5259024)>>2)]=(520);
HEAP32[((5259028)>>2)]=(582);
HEAP32[((5259032)>>2)]=(632);
HEAP32[((5259036)>>2)]=(158);
HEAP32[((5259040)>>2)]=(142);
HEAP32[((5259044)>>2)]=(128);
HEAP32[((5259048)>>2)]=(760);
HEAP32[((5259052)>>2)]=(512);
HEAP32[((5259068)>>2)]=(22);
HEAP32[((5259072)>>2)]=(330);
HEAP32[((5259076)>>2)]=(516);
HEAP32[((5259080)>>2)]=(680);
HEAP32[((5259084)>>2)]=(676);
HEAP32[((5259088)>>2)]=(316);
HEAP32[((5259092)>>2)]=(276);
HEAP32[((5259096)>>2)]=(506);
HEAP32[((5259100)>>2)]=(358);
HEAP32[((5259104)>>2)]=(36);
HEAP32[((5259108)>>2)]=(62);
HEAP32[((5259112)>>2)]=(698);
HEAP32[((5259116)>>2)]=(338);
HEAP32[((5259120)>>2)]=(162);
HEAP32[((5259140)>>2)]=(104);
HEAP32[((5259144)>>2)]=(626);
HEAP32[((5259160)>>2)]=(396);
HEAP32[((5259164)>>2)]=(350);
HEAP32[((5259184)>>2)]=(652);
HEAP32[((5259188)>>2)]=(700);
HEAP32[((5259204)>>2)]=(304);
HEAP32[((5259208)>>2)]=(564);
HEAP32[((5259228)>>2)]=(244);
HEAP32[((5259232)>>2)]=(766);
HEAP32[((5259248)>>2)]=(478);
HEAP32[((5259252)>>2)]=(694);
HEAP32[((5259272)>>2)]=(300);
HEAP32[((5259276)>>2)]=(586);
HEAP32[((5259292)>>2)]=(384);
HEAP32[((5259296)>>2)]=(136);
HEAP32[((5259312)>>2)]=(738);
HEAP32[((5259316)>>2)]=(480);
HEAP32[((5259320)>>2)]=(230);
HEAP32[((5259336)>>2)]=(734);
HEAP32[((5259340)>>2)]=(674);
HEAP32[((5259344)>>2)]=(38);
HEAP32[((5259348)>>2)]=(412);
HEAP32[((5259352)>>2)]=(266);
HEAP32[((5259356)>>2)]=(492);
HEAP32[((5259360)>>2)]=(294);
HEAP32[((5259364)>>2)]=(582);
HEAP32[((5259368)>>2)]=(632);
HEAP32[((5259372)>>2)]=(158);
HEAP32[((5259376)>>2)]=(142);
HEAP32[((5259380)>>2)]=(128);
HEAP32[((5259384)>>2)]=(760);
HEAP32[((5259388)>>2)]=(702);
HEAP32[((5259404)>>2)]=(420);
HEAP32[((5259408)>>2)]=(474);
HEAP32[((5259412)>>2)]=(318);
HEAP32[((5259416)>>2)]=(680);
HEAP32[((5259420)>>2)]=(676);
HEAP32[((5259424)>>2)]=(316);
HEAP32[((5259428)>>2)]=(522);
HEAP32[((5259432)>>2)]=(506);
HEAP32[((5259436)>>2)]=(358);
HEAP32[((5259440)>>2)]=(36);
HEAP32[((5259444)>>2)]=(62);
HEAP32[((5259448)>>2)]=(698);
HEAP32[((5259452)>>2)]=(338);
HEAP32[((5259456)>>2)]=(182);
HEAP32[((5259472)>>2)]=(662);
HEAP32[((5259476)>>2)]=(394);
HEAP32[((5259480)>>2)]=(118);
HEAP32[((5259484)>>2)]=(370);
HEAP32[((5259488)>>2)]=(648);
HEAP32[((5259492)>>2)]=(432);
HEAP32[((5259496)>>2)]=(742);
HEAP32[((5259500)>>2)]=(58);
HEAP32[((5259504)>>2)]=(286);
HEAP32[((5259508)>>2)]=(284);
HEAP32[((5259512)>>2)]=(224);
HEAP32[((5259516)>>2)]=(364);
HEAP32[((5259532)>>2)]=(296);
HEAP32[((5259536)>>2)]=(152);
HEAP32[((5259540)>>2)]=(118);
HEAP32[((5259544)>>2)]=(628);
HEAP32[((5259548)>>2)]=(12);
HEAP32[((5259552)>>2)]=(580);
HEAP32[((5259556)>>2)]=(666);
HEAP32[((5259560)>>2)]=(682);
HEAP32[((5259564)>>2)]=(250);
HEAP32[((5259568)>>2)]=(634);
HEAP32[((5259572)>>2)]=(470);
HEAP32[((5259576)>>2)]=(144);
HEAP32[((5259592)>>2)]=(672);
HEAP32[((5259596)>>2)]=(326);
HEAP32[((5259600)>>2)]=(118);
HEAP32[((5259604)>>2)]=(94);
HEAP32[((5259608)>>2)]=(322);
HEAP32[((5259612)>>2)]=(436);
HEAP32[((5259616)>>2)]=(422);
HEAP32[((5259620)>>2)]=(756);
HEAP32[((5259624)>>2)]=(472);
HEAP32[((5259628)>>2)]=(556);
HEAP32[((5259632)>>2)]=(490);
HEAP32[((5259636)>>2)]=(298);
HEAP32[((5259652)>>2)]=(220);
HEAP32[((5259656)>>2)]=(458);
HEAP32[((5259660)>>2)]=(118);
HEAP32[((5259664)>>2)]=(584);
HEAP32[((5259668)>>2)]=(612);
HEAP32[((5259672)>>2)]=(280);
HEAP32[((5259676)>>2)]=(644);
HEAP32[((5259680)>>2)]=(258);
HEAP32[((5259684)>>2)]=(208);
HEAP32[((5259688)>>2)]=(430);
HEAP32[((5259692)>>2)]=(624);
HEAP32[((5259696)>>2)]=(616);
HEAP32[((5259712)>>2)]=(246);
HEAP32[((5259716)>>2)]=(190);
HEAP32[((5259720)>>2)]=(354);
HEAP32[((5259724)>>2)]=(412);
HEAP32[((5259728)>>2)]=(266);
HEAP32[((5259732)>>2)]=(492);
HEAP32[((5259736)>>2)]=(520);
HEAP32[((5259740)>>2)]=(582);
HEAP32[((5259744)>>2)]=(632);
HEAP32[((5259748)>>2)]=(386);
HEAP32[((5259752)>>2)]=(486);
HEAP32[((5259756)>>2)]=(176);
HEAP32[((5259760)>>2)]=(760);
HEAP32[((5259764)>>2)]=(512);
HEAP32[((5259780)>>2)]=(30);
HEAP32[((5259784)>>2)]=(654);
HEAP32[((5259788)>>2)]=(534);
HEAP32[((5259792)>>2)]=(680);
HEAP32[((5259796)>>2)]=(676);
HEAP32[((5259800)>>2)]=(316);
HEAP32[((5259804)>>2)]=(276);
HEAP32[((5259808)>>2)]=(506);
HEAP32[((5259812)>>2)]=(358);
HEAP32[((5259816)>>2)]=(98);
HEAP32[((5259820)>>2)]=(126);
HEAP32[((5259824)>>2)]=(34);
HEAP32[((5259828)>>2)]=(338);
HEAP32[((5259832)>>2)]=(162);
HEAP32[((5259848)>>2)]=(306);
HEAP32[((5259852)>>2)]=(552);
HEAP32[((5259856)>>2)]=(168);
HEAP32[((5259860)>>2)]=(410);
HEAP32[((5259864)>>2)]=(214);
HEAP32[((5259868)>>2)]=(66);
HEAP32[((5259872)>>2)]=(650);
HEAP32[((5259876)>>2)]=(288);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(8))>>2)]=(308);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(12))>>2)]=(730);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(16))>>2)]=(168);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(20))>>2)]=(410);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(24))>>2)]=(214);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(28))>>2)]=(100);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(32))>>2)]=(252);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(36))>>2)]=(282);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(8))>>2)]=(476);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(12))>>2)]=(234);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(16))>>2)]=(168);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(20))>>2)]=(410);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(24))>>2)]=(214);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(28))>>2)]=(572);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(32))>>2)]=(278);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(36))>>2)]=(426);
HEAP32[((5262700)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5262704)>>2)]=((5259884)|0);
HEAP32[((5262708)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5262712)>>2)]=((5259900)|0);
HEAP32[((5262716)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262720)>>2)]=((5259916)|0);
HEAP32[((5262728)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262732)>>2)]=((5259932)|0);
HEAP32[((5262740)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262744)>>2)]=((5259944)|0);
HEAP32[((5262752)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262756)>>2)]=((5259964)|0);
HEAP32[((5262764)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262768)>>2)]=((5259984)|0);
HEAP32[((5262776)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5262780)>>2)]=((5260000)|0);
HEAP32[((5262784)>>2)]=(((5259848)|0));
HEAP32[((5262788)>>2)]=((5260020)|0);
HEAP32[((5262816)>>2)]=(((5259848)|0));
HEAP32[((5262820)>>2)]=((5260092)|0);
HEAP32[((5262848)>>2)]=(((5259848)|0));
HEAP32[((5262852)>>2)]=((5260164)|0);
HEAP32[((5262880)>>2)]=(((5259848)|0));
HEAP32[((5262884)>>2)]=((5260236)|0);
HEAP32[((5262912)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262916)>>2)]=((5260308)|0);
HEAP32[((5262924)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5262928)>>2)]=((5260352)|0);
HEAP32[((5262936)>>2)]=(((5259848)|0));
HEAP32[((5262940)>>2)]=((5260396)|0);
HEAP32[((5262960)>>2)]=(((5259848)|0));
HEAP32[((5262964)>>2)]=((5260420)|0);
HEAP32[((5262984)>>2)]=(((5259848)|0));
HEAP32[((5262988)>>2)]=((5260444)|0);
HEAP32[((5263008)>>2)]=(((5259848)|0));
HEAP32[((5263012)>>2)]=((5260468)|0);
HEAP32[((5263032)>>2)]=(((5259848)|0));
HEAP32[((5263036)>>2)]=((5260492)|0);
HEAP32[((5263064)>>2)]=(((5259848)|0));
HEAP32[((5263068)>>2)]=((5260564)|0);
HEAP32[((5263096)>>2)]=(((5259848)|0));
HEAP32[((5263100)>>2)]=((5260636)|0);
HEAP32[((5263136)>>2)]=(((5259848)|0));
HEAP32[((5263140)>>2)]=((5260708)|0);
HEAP32[((5263176)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263180)>>2)]=((5260780)|0);
HEAP32[((5263188)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263192)>>2)]=((5260804)|0);
HEAP32[((5263200)>>2)]=(((5259848)|0));
HEAP32[((5263204)>>2)]=((5260828)|0);
HEAP32[((5263232)>>2)]=(((5259848)|0));
HEAP32[((5263236)>>2)]=((5260852)|0);
HEAP32[((5263264)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263268)>>2)]=((5260876)|0);
HEAP32[((5263272)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263276)>>2)]=((5260896)|0);
HEAP32[((5263284)>>2)]=(((5259848)|0));
HEAP32[((5263288)>>2)]=((5260924)|0);
HEAP32[((5263316)>>2)]=(((5259848)|0));
HEAP32[((5263320)>>2)]=((5260992)|0);
HEAP32[((5263348)>>2)]=(((5259848)|0));
HEAP32[((5263352)>>2)]=((5261060)|0);
HEAP32[((5263380)>>2)]=(((5259848)|0));
HEAP32[((5263384)>>2)]=((5261128)|0);
HEAP32[((5263412)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263416)>>2)]=((5261196)|0);
HEAP32[((5263424)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263428)>>2)]=((5261216)|0);
HEAP32[((5263436)>>2)]=(((5259848)|0));
HEAP32[((5263440)>>2)]=((5261236)|0);
HEAP32[((5263468)>>2)]=(((5259848)|0));
HEAP32[((5263472)>>2)]=((5261272)|0);
HEAP32[((5263500)>>2)]=(((5259848)|0));
HEAP32[((5263504)>>2)]=((5261308)|0);
HEAP32[((5263532)>>2)]=(((5259848)|0));
HEAP32[((5263536)>>2)]=((5261344)|0);
HEAP32[((5263564)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263568)>>2)]=((5261380)|0);
HEAP32[((5263576)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263580)>>2)]=((5261404)|0);
HEAP32[((5263588)>>2)]=(((5259848)|0));
HEAP32[((5263592)>>2)]=((5261428)|0);
HEAP32[((5263620)>>2)]=(((5259848)|0));
HEAP32[((5263624)>>2)]=((5261448)|0);
HEAP32[((5263652)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263656)>>2)]=((5261468)|0);
HEAP32[((5263660)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263664)>>2)]=((5261504)|0);
HEAP32[((5263668)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263672)>>2)]=((5261540)|0);
HEAP32[((5263680)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263684)>>2)]=((5261572)|0);
HEAP32[((5263692)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263696)>>2)]=((5261608)|0);
HEAP32[((5263704)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263708)>>2)]=((5261644)|0);
HEAP32[((5263712)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263716)>>2)]=((5261696)|0);
HEAP32[((5263720)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263724)>>2)]=((5261748)|0);
HEAP32[((5263728)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263732)>>2)]=((5261776)|0);
HEAP32[((5263736)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263740)>>2)]=((5261804)|0);
HEAP32[((5263744)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263748)>>2)]=((5261832)|0);
HEAP32[((5263752)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263756)>>2)]=((5261860)|0);
HEAP32[((5263760)>>2)]=(((5259848)|0));
HEAP32[((5263764)>>2)]=((5261884)|0);
HEAP32[((5263784)>>2)]=(((5259848)|0));
HEAP32[((5263788)>>2)]=((5261932)|0);
HEAP32[((5263808)>>2)]=(((5259848)|0));
HEAP32[((5263812)>>2)]=((5261980)|0);
HEAP32[((5263832)>>2)]=(((5259848)|0));
HEAP32[((5263836)>>2)]=((5262028)|0);
HEAP32[((5263856)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263860)>>2)]=((5262076)|0);
HEAP32[((5263868)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263872)>>2)]=((5262100)|0);
HEAP32[((5263876)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263880)>>2)]=((5262124)|0);
HEAP32[((5263888)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263892)>>2)]=((5262148)|0);
HEAP32[((5263900)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5263904)>>2)]=((5262176)|0);
HEAP32[((5263912)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263916)>>2)]=((5262204)|0);
HEAP32[((5263920)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263924)>>2)]=((5262232)|0);
HEAP32[((5263928)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263932)>>2)]=((5262260)|0);
HEAP32[((5263936)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5263940)>>2)]=((5262288)|0);
HEAP32[((5263944)>>2)]=(((5259848)|0));
HEAP32[((5263948)>>2)]=((5262316)|0);
HEAP32[((5263976)>>2)]=(((5259848)|0));
HEAP32[((5263980)>>2)]=((5262344)|0);
HEAP32[((5264008)>>2)]=(((5259848)|0));
HEAP32[((5264012)>>2)]=((5262372)|0);
HEAP32[((5264040)>>2)]=(((5259848)|0));
HEAP32[((5264044)>>2)]=((5262400)|0);
HEAP32[((5264072)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5264076)>>2)]=((5262428)|0);
HEAP32[((5264080)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5264084)>>2)]=((5262452)|0);
HEAP32[((5264088)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5264092)>>2)]=((5262476)|0);
HEAP32[((5264096)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5264100)>>2)]=((5262500)|0);
HEAP32[((5264108)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5264112)>>2)]=((5262524)|0);
HEAP32[((5264120)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5264124)>>2)]=((5262548)|0);
HEAP32[((5264132)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5264136)>>2)]=((5262588)|0);
HEAP32[((5264144)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5264148)>>2)]=((5262628)|0);
HEAP32[((5264156)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5264160)>>2)]=((5262664)|0);
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],(+(HEAPF64[(tempDoublePtr)>>3])));
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*') || nullString;
              var argLength = _strlen(arg);
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              for (var i = 0; i < argLength; i++) {
                ret.push(HEAPU8[((arg++)|0)]);
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length; // Keep dense
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      exitRuntime();
      ABORT = true;
      throw 'exit(' + status + ') called, at ' + new Error().stack;
    }function _exit(status) {
      __exit(status);
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      if (FS.streams[fildes] && !FS.streams[fildes].object.isDevice) {
        var stream = FS.streams[fildes];
        var position = offset;
        if (whence === 1) {  // SEEK_CUR.
          position += stream.position;
        } else if (whence === 2) {  // SEEK_END.
          position += stream.object.contents.length;
        }
        if (position < 0) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        } else {
          stream.ungotten = [];
          stream.position = position;
          return position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      } else {
        FS.streams[stream].eof = false;
        return 0;
      }
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      if (FS.streams[stream]) {
        stream = FS.streams[stream];
        if (stream.object.isDevice) {
          ___setErrNo(ERRNO_CODES.ESPIPE);
          return -1;
        } else {
          return stream.position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000/1000));
    }
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      var flush = function(filedes) {
        // Right now we write all data directly, except for output devices.
        if (FS.streams[filedes] && FS.streams[filedes].object.output) {
          if (!FS.streams[filedes].isTerminal) { // don't flush terminals, it would cause a \n to also appear
            FS.streams[filedes].object.output(null);
          }
        }
      };
      try {
        if (stream === 0) {
          for (var i = 0; i < FS.streams.length; i++) if (FS.streams[i]) flush(i);
        } else {
          flush(stream);
        }
        return 0;
      } catch (e) {
        ___setErrNo(ERRNO_CODES.EIO);
        return -1;
      }
    }
  function _llvm_umul_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return ((asm.setTempRet0(x*y > 4294967295),(x*y)>>>0)|0);
    }
   var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
   var _llvm_memset_p0i8_i32=_memset;
  function _llvm_va_end() {}
  function ___fpclassifyf(x) {
      if (isNaN(x)) return 0;
      if (!isFinite(x)) return 1;
      if (x == 0) return 2;
      // FP_SUBNORMAL..?
      return 4;
    }var ___fpclassifyd=___fpclassifyf;
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  var _vsnprintf=_snprintf;
  var ERRNO_MESSAGES={1:"Operation not permitted",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"Input/output error",6:"No such device or address",8:"Exec format error",9:"Bad file descriptor",10:"No child processes",11:"Resource temporarily unavailable",12:"Cannot allocate memory",13:"Permission denied",14:"Bad address",16:"Device or resource busy",17:"File exists",18:"Invalid cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Inappropriate ioctl for device",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read-only file system",31:"Too many links",32:"Broken pipe",33:"Numerical argument out of domain",34:"Numerical result out of range",35:"Resource deadlock avoided",36:"File name too long",37:"No locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many levels of symbolic links",42:"No message of desired type",43:"Identifier removed",60:"Device not a stream",61:"No data available",62:"Timer expired",63:"Out of streams resources",67:"Link has been severed",71:"Protocol error",72:"Multihop attempted",74:"Bad message",75:"Value too large for defined data type",84:"Invalid or incomplete multibyte or wide character",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Protocol not supported",95:"Operation not supported",97:"Address family not supported by protocol",98:"Address already in use",99:"Cannot assign requested address",100:"Network is down",101:"Network is unreachable",102:"Network dropped connection on reset",103:"Software caused connection abort",104:"Connection reset by peer",105:"No buffer space available",106:"Transport endpoint is already connected",107:"Transport endpoint is not connected",110:"Connection timed out",111:"Connection refused",113:"No route to host",114:"Operation already in progress",115:"Operation now in progress",116:"Stale NFS file handle",122:"Disk quota exceeded",125:"Operation canceled",130:"Owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
   var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function _localeconv() {
      // %struct.timeval = type { char* decimal point, other stuff... }
      // var indexes = Runtime.calculateStructAlignment({ fields: ['i32', 'i32'] });
      var me = _localeconv;
      if (!me.ret) {
        me.ret = allocate([allocate(intArrayFromString('.'), 'i8', ALLOC_NORMAL)], 'i8*', ALLOC_NORMAL); // just decimal point, for now
      }
      return me.ret;
    }
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var start = str;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm.setTempRet0(0),0)|0);
      }
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      try {
        i64Math.fromString(Pointer_stringify(start, str - start), finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
      return ((asm.setTempRet0(((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }
  function _pthread_mutex_lock() {}
  function _pthread_mutex_unlock() {}
  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }
  function ___gxx_personality_v0() {
    }
  function ___cxa_guard_abort() {}
  function ___cxa_guard_release() {}
  function _pthread_cond_broadcast() {
      return 0;
    }
  function _pthread_cond_wait() {
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function ___cxa_free_exception(ptr) {
      return _free(ptr);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }function ___cxa_find_matching_catch(thrown, throwntype, typeArray) {
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm.setTempRet0(typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm.setTempRet0(throwntype),thrown)|0);
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      return ptr;
    }
  function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm.setThrew(0);
      // Clear type.
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=0
      // Call destructor if one is registered then clear it.
      var ptr = HEAP32[((_llvm_eh_exception.buf)>>2)];
      var destructor = HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)];
      if (destructor) {
        Runtime.dynCall('vi', destructor, [ptr]);
        HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=0
      }
      // Free ptr if it isn't null.
      if (ptr) {
        ___cxa_free_exception(ptr);
        HEAP32[((_llvm_eh_exception.buf)>>2)]=0
      }
    }
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      if (FS.streams[stream]) {
        c = unSign(c & 0xFF);
        FS.streams[stream].ungotten.push(c);
        return c;
      } else {
        return -1;
      }
    }
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      if (!FS.streams[stream]) return -1;
      var streamObj = FS.streams[stream];
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _read(stream, _fgetc.ret, 1);
      if (ret == 0) {
        streamObj.eof = true;
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;
  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      throw HEAP32[((_llvm_eh_exception.buf)>>2)] + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function _wmemmove() { throw 'wmemmove not implemented' }
  function _wmemset() { throw 'wmemset not implemented' }
  function _wmemcpy() { throw 'wmemcpy not implemented' }
  function _wcslen() { throw 'wcslen not implemented' }
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }var _isxdigit_l=_isxdigit;
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }var _isdigit_l=_isdigit;
  function __isFloat(text) {
      return !!(/^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.exec(text));
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[' '] = 1;
        __scanString.whiteSpace['\t'] = 1;
        __scanString.whiteSpace['\n'] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        // TODO: Support strings like "%5c" etc.
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'c') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          fields++;
          next = get();
          HEAP8[(argPtr)]=next
          formatIndex += 2;
          continue;
        }
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if(format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' || type == 'E') {
            var last = 0;
            next = get();
            while (next > 0) {
              buffer.push(String.fromCharCode(next));
              if (__isFloat(buffer.join(''))) {
                last = buffer.length;
              }
              next = get();
            }
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   (type === 'x' && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if(longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,Math.min(Math.floor((parseInt(text, 10))/(+(4294967296))), (+(4294967295)))>>>0],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'f':
            case 'e':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                (HEAPF64[(tempDoublePtr)>>3]=parseFloat(text),HEAP32[((argPtr)>>2)]=((HEAP32[((tempDoublePtr)>>2)])|0),HEAP32[(((argPtr)+(4))>>2)]=((HEAP32[(((tempDoublePtr)+(4))>>2)])|0))
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex] in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      var get = function() { return HEAP8[(((s)+(index++))|0)]; };
      var unget = function() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function __Z7catopenPKci() { throw 'catopen not implemented' }
  function __Z7catgetsP8_nl_catdiiPKc() { throw 'catgets not implemented' }
  function __Z8catcloseP8_nl_catd() { throw 'catclose not implemented' }
  function _newlocale(mask, locale, base) {
      return 0;
    }
  function _freelocale(locale) {}
  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i]
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i]
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }
  function _strftime(s, maxsize, format, timeptr) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      // TODO: Implement.
      return 0;
    }var _strftime_l=_strftime;
  function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }var _strtoull_l=_strtoull;
  var _strtoll_l=_strtoll;
  function _uselocale(locale) {
      return 0;
    }
  function _mbsrtowcs() { throw 'mbsrtowcs not implemented' }
  function _mbrlen() { throw 'mbrlen not implemented' }
  function ___locale_mb_cur_max() { throw '__locale_mb_cur_max not implemented' }
  function _mbtowc(pwc, pmb, maxx) {
      // XXX doesn't really handle multibyte at all
      if (!pmb) return 0;
      maxx = Math.min(85, maxx);
      var i;
      for (i = 0; i < maxx; i++) {
        var curr = HEAP8[(pmb)];
        if (pwc) {
          HEAP8[(pwc)]=curr;
          HEAP8[(((pwc)+(1))|0)]=0;
          pwc += 2;
        }
        pmb++;
        if (!curr) break;
      }
      return i;
    }
  function _mbrtowc() { throw 'mbrtowc not implemented' }
  function _mbsnrtowcs() { throw 'mbsnrtowcs not implemented' }
  function _wcrtomb(s, wc, ps) {
      // XXX doesn't really handle multibyte at all
      if (s) {
        HEAP8[(s)]=wc;
      }
      return 1;
    }
  function _wcsnrtombs() { throw 'wcsnrtombs not implemented' }
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }var _vasprintf=_asprintf;
  var _vsprintf=_sprintf;
  var _vsscanf=_sscanf;
  var _llvm_memset_p0i8_i64=_memset;
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var Math_min = Math.min;
var i64Math_add = function(a, b, c, d) { i64Math.add(a, b, c, d) };
var i64Math_subtract = function(a, b, c, d) { i64Math.subtract(a, b, c, d) };
var i64Math_multiply = function(a, b, c, d) { i64Math.multiply(a, b, c, d) };
var i64Math_divide = function(a, b, c, d, e) { i64Math.divide(a, b, c, d, e) };
var i64Math_modulo = function(a, b, c, d, e) { i64Math.modulo(a, b, c, d, e) };
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stdin|0;var n=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var o=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var p=env._stderr|0;var q=env._stdout|0;var r=env.___dso_handle|0;var s=+env.NaN;var t=+env.Infinity;var u=0;var v=0;var w=0,x=0,y=0,z=0,A=0.0,B=0,C=0,D=0,E=0.0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=0;var O=0;var P=global.Math.floor;var Q=global.Math.abs;var R=global.Math.sqrt;var S=global.Math.pow;var T=global.Math.cos;var U=global.Math.sin;var V=global.Math.tan;var W=global.Math.acos;var X=global.Math.asin;var Y=global.Math.atan;var Z=global.Math.atan2;var _=global.Math.exp;var $=global.Math.log;var aa=global.Math.ceil;var ab=global.Math.imul;var ac=env.abort;var ad=env.assert;var ae=env.asmPrintInt;var af=env.asmPrintFloat;var ag=env.copyTempDouble;var ah=env.copyTempFloat;var ai=env.min;var aj=env.i64Math_add;var ak=env.i64Math_subtract;var al=env.i64Math_multiply;var am=env.i64Math_divide;var an=env.i64Math_modulo;var ao=env._llvm_lifetime_end;var ap=env._lseek;var aq=env.__scanString;var ar=env._fclose;var as=env._pthread_mutex_lock;var at=env._mbrlen;var au=env.___cxa_end_catch;var av=env._strtoull;var aw=env._fflush;var ax=env._wcsnrtombs;var ay=env._fputc;var az=env._fwrite;var aA=env._strncmp;var aB=env._llvm_eh_exception;var aC=env._fputs;var aD=env._llvm_umul_with_overflow_i32;var aE=env._isspace;var aF=env._wmemset;var aG=env._read;var aH=env._fsync;var aI=env.___cxa_guard_abort;var aJ=env._newlocale;var aK=env.___gxx_personality_v0;var aL=env._pthread_cond_wait;var aM=env.___cxa_rethrow;var aN=env._strcmp;var aO=env._llvm_va_end;var aP=env._mbtowc;var aQ=env._snprintf;var aR=env._fgetc;var aS=env.__isFloat;var aT=env._atexit;var aU=env.___cxa_free_exception;var aV=env._close;var aW=env._strchr;var aX=env._clock;var aY=env.___setErrNo;var aZ=env._isxdigit;var a_=env._ftell;var a$=env._exit;var a0=env._sprintf;var a1=env.___ctype_b_loc;var a2=env._freelocale;var a3=env.__Z7catopenPKci;var a4=env._asprintf;var a5=env.___cxa_is_number_type;var a6=env.___cxa_does_inherit;var a7=env.___cxa_guard_acquire;var a8=env.___locale_mb_cur_max;var a9=env.___cxa_begin_catch;var ba=env.__parseInt64;var bb=env.__ZSt18uncaught_exceptionv;var bc=env.___cxa_call_unexpected;var bd=env.__exit;var be=env._strftime;var bf=env._wmemmove;var bg=env.___cxa_throw;var bh=env._printf;var bi=env._pread;var bj=env._fopen;var bk=env._open;var bl=env._puts;var bm=env._wcslen;var bn=env.___cxa_find_matching_catch;var bo=env._mbrtowc;var bp=env.__formatString;var bq=env._pthread_cond_broadcast;var br=env._mbsrtowcs;var bs=env._pthread_mutex_unlock;var bt=env._sbrk;var bu=env._localeconv;var bv=env.___errno_location;var bw=env._strerror;var bx=env._llvm_lifetime_start;var by=env.___cxa_guard_release;var bz=env._ungetc;var bA=env._uselocale;var bB=env._sscanf;var bC=env._sysconf;var bD=env._fread;var bE=env._abort;var bF=env._fprintf;var bG=env.___fpclassifyf;var bH=env._isdigit;var bI=env._strtoll;var bJ=env._wmemcpy;var bK=env.__reallyNegative;var bL=env.__Z7catgetsP8_nl_catdiiPKc;var bM=env._fseek;var bN=env._write;var bO=env.___cxa_allocate_exception;var bP=env.__Z8catcloseP8_nl_catd;var bQ=env.___ctype_toupper_loc;var bR=env.___ctype_tolower_loc;var bS=env.___assert_func;var bT=env._pwrite;var bU=env._strerror_r;var bV=env._time;var bW=env._wcrtomb;var bX=env._mbsnrtowcs;
// EMSCRIPTEN_START_FUNCS
function cf(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+3>>2<<2;return b|0}function cg(){return i|0}function ch(a){a=a|0;i=a}function ci(a){a=a|0;u=a}function cj(a){a=a|0;F=a}function ck(a){a=a|0;G=a}function cl(a){a=a|0;H=a}function cm(a){a=a|0;I=a}function cn(a){a=a|0;J=a}function co(a){a=a|0;K=a}function cp(a){a=a|0;L=a}function cq(a){a=a|0;M=a}function cr(a){a=a|0;N=a}function cs(a){a=a|0;O=a}function ct(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,i=0,j=0.0,l=0.0;d=c[b+24>>2]|0;if((d|0)==0){e=a|0;c[e>>2]=(c[e>>2]|0)+1|0;return}else if((d|0)==1){e=a+16|0;c[e>>2]=(c[e>>2]|0)+1|0;e=c[b+8>>2]|0;if((e|0)==0){return}f=a+36|0;i=e;while(1){c[f>>2]=(c[f>>2]|0)+1|0;ct(a,i);e=c[i+4>>2]|0;if((e|0)==0){break}else{i=e}}return}else if((d|0)==2){i=a+20|0;c[i>>2]=(c[i>>2]|0)+1|0;i=c[b+8>>2]|0;if((i|0)==0){return}f=a+32|0;e=i;while(1){c[f>>2]=(c[f>>2]|0)+1|0;ct(a,e);i=c[e+4>>2]|0;if((i|0)==0){break}else{e=i}}return}else if((d|0)==3){e=a+24|0;c[e>>2]=(c[e>>2]|0)+1|0;e=j8(c[b+20>>2]|0)|0;f=a+28|0;c[f>>2]=(c[f>>2]|0)+e|0;return}else if((d|0)==4){e=a+12|0;c[e>>2]=(c[e>>2]|0)+1|0;j=+(c[b+20>>2]|0);e=a+40|0;l=(c[k>>2]=c[e>>2]|0,c[k+4>>2]=c[e+4>>2]|0,+h[k>>3])+j;h[k>>3]=l,c[e>>2]=c[k>>2]|0,c[e+4>>2]=c[k+4>>2]|0;return}else if((d|0)==5){e=a+12|0;c[e>>2]=(c[e>>2]|0)+1|0;l=+g[b+20>>2];e=a+40|0;j=(c[k>>2]=c[e>>2]|0,c[k+4>>2]=c[e+4>>2]|0,+h[k>>3])+l;h[k>>3]=j,c[e>>2]=c[k>>2]|0,c[e+4>>2]=c[k+4>>2]|0;return}else if((d|0)==6){if((c[b+20>>2]|0)==0){b=a+4|0;c[b>>2]=(c[b>>2]|0)+1|0;return}else{b=a+8|0;c[b>>2]=(c[b>>2]|0)+1|0;return}}else{return}}function cu(b,d){b=b|0;d=d|0;var e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0.0,aq=0,ar=0.0,as=0.0,at=0,au=0.0,av=0.0,aw=0.0,ax=0,ay=0.0,az=0,aA=0,aB=0.0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0.0,aJ=0,aK=0.0,aL=0.0,aM=0,aN=0,aO=0,aP=0;e=i;f=d+4|0;h=(c[f>>2]|0)+1|0;j=(h|0)==0?1:h;while(1){k=j$(j)|0;if((k|0)!=0){break}h=(D=c[1316362]|0,c[1316362]=D+0,D);if((h|0)==0){l=36;break}b7[h&1023]()}if((l|0)==36){j=bO(4)|0;c[j>>2]=5257468;bg(j|0,5262716,348)}j=c[f>>2]|0;j9(k,c[d+8>>2]|0,j);a[k+j|0]=0;j=a[k]|0;L40:do{if(j<<24>>24==0){m=0;n=0;l=245}else{d=0;f=k;h=0;o=0;q=0;r=j;s=0;L41:while(1){t=r<<24>>24;do{if((t|0)==123|(t|0)==91){do{if((s|0)==0){l=46}else{u=c[s+4>>2]|0;if((u+28|0)>>>0>(c[s>>2]|0)>>>0){l=46;break}else{v=u;x=s;break}}}while(0);if((l|0)==46){l=0;u=j$(1024)|0;c[u>>2]=1024;c[u+4>>2]=16;c[u+8>>2]=u;c[u+12>>2]=s;v=16;x=u}u=c[x+8>>2]|0;y=u+v|0;c[x+4>>2]=v+28|0;z=y;c[y>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;c[y+12>>2]=0;c[y+16>>2]=0;c[y+20>>2]=0;c[y+24>>2]=0;c[u+(v+16|0)>>2]=h;c[u+(v+24|0)>>2]=a[f]<<24>>24==123?1:2;A=f+1|0;if((o|0)==0){if((q|0)==0){B=z;C=z;E=0;F=A;G=d;H=x;break}else{l=52;break L41}}c[y>>2]=o;y=o+12|0;u=c[y>>2]|0;if((u|0)==0){c[y>>2]=z;c[o+8>>2]=z;B=q;C=z;E=0;F=A;G=d;H=x;break}else{c[u+4>>2]=z;c[y>>2]=z;B=q;C=z;E=0;F=A;G=d;H=x;break}}else if((t|0)==125|(t|0)==93){if((o|0)==0){l=57;break L41}if((c[o+24>>2]|0)!=((r<<24>>24==125?1:2)|0)){l=57;break L41}B=q;C=c[o>>2]|0;E=h;F=f+1|0;G=d;H=s}else if((t|0)==58){if((o|0)==0){l=64;break L41}if((c[o+24>>2]|0)!=1){l=64;break L41}B=q;C=o;E=h;F=f+1|0;G=d;H=s}else if((t|0)==44){if((o|0)==0){l=70;break L41}B=q;C=o;E=h;F=f+1|0;G=d;H=s}else if((t|0)==34){if((o|0)==0){l=76;break L41}I=f+1|0;z=a[I]|0;L66:do{if(z<<24>>24==0){J=I;K=d}else{L=d;y=I;u=I;M=z;L67:while(1){N=y;O=u;P=M;while(1){if((P&255)<32){l=83;break L41}if((P<<24>>24|0)==92){break}else if((P<<24>>24|0)==34){break L67}Q=N+1|0;a[O]=P;R=a[Q]|0;if(R<<24>>24==0){J=Q;K=L;break L66}else{N=Q;O=O+1|0;P=R}}P=a[N+1|0]<<24>>24;do{if((P|0)==34){a[O]=34;S=O;T=N;U=L}else if((P|0)==92){a[O]=92;S=O;T=N;U=L}else if((P|0)==47){a[O]=47;S=O;T=N;U=L}else if((P|0)==98){a[O]=8;S=O;T=N;U=L}else if((P|0)==102){a[O]=12;S=O;T=N;U=L}else if((P|0)==110){a[O]=10;S=O;T=N;U=L+1|0}else if((P|0)==114){a[O]=13;S=O;T=N;U=L}else if((P|0)==116){a[O]=9;S=O;T=N;U=L}else if((P|0)==117){R=a[N+2|0]|0;Q=R<<24>>24;do{if((R-48&255)<10){V=Q-48|0}else{if((R-97&255)<6){V=Q-87|0;break}if((R-65&255)>=6){l=103;break L41}V=Q-55|0}}while(0);Q=a[N+3|0]|0;R=Q<<24>>24;do{if((Q-48&255)<10){W=R-48|0}else{if((Q-97&255)<6){W=R-87|0;break}if((Q-65&255)>=6){l=103;break L41}W=R-55|0}}while(0);R=W+(V<<4)|0;Q=N+4|0;X=a[Q]|0;Y=X<<24>>24;do{if((X-48&255)<10){Z=Y-48|0}else{if((X-97&255)<6){Z=Y-87|0;break}if((X-65&255)>=6){l=103;break L41}Z=Y-55|0}}while(0);Y=Z+(R<<4)|0;X=a[N+5|0]|0;_=X<<24>>24;do{if((X-48&255)<10){$=_-48|0}else{if((X-97&255)<6){$=_-87|0;break}if((X-65&255)>=6){l=103;break L41}$=_-55|0}}while(0);_=$+(Y<<4)|0;if(_>>>0<128){a[O]=_&255;S=O;T=Q;U=L;break}if(_>>>0<2048){X=O+1|0;a[O]=(_>>>6|192)&255;a[X]=(_&63|128)&255;S=X;T=Q;U=L;break}if(_>>>0>=65536){S=O;T=Q;U=L;break}a[O]=(_>>>12|224)&255;X=O+2|0;a[O+1|0]=(_>>>6&63|128)&255;a[X]=(_&63|128)&255;S=X;T=Q;U=L}else{l=113;break L41}}while(0);P=T+2|0;X=a[P]|0;if(X<<24>>24==0){J=P;K=U;break L66}else{L=U;y=P;u=S+1|0;M=X}}a[O]=0;J=N+1|0;K=L}}while(0);if((h|0)==0){if((c[o+24>>2]|0)==1){B=q;C=o;E=I;F=J;G=K;H=s;break}}do{if((s|0)==0){l=123}else{z=c[s+4>>2]|0;if((z+28|0)>>>0>(c[s>>2]|0)>>>0){l=123;break}else{aa=z;ac=s;break}}}while(0);if((l|0)==123){l=0;z=j$(1024)|0;c[z>>2]=1024;c[z+4>>2]=16;c[z+8>>2]=z;c[z+12>>2]=s;aa=16;ac=z}z=c[ac+8>>2]|0;M=z+aa|0;c[ac+4>>2]=aa+28|0;u=M;c[M>>2]=0;c[M+4>>2]=0;c[M+8>>2]=0;c[M+12>>2]=0;c[M+16>>2]=0;c[M+20>>2]=0;c[M+24>>2]=0;c[z+(aa+16|0)>>2]=h;c[z+(aa+24|0)>>2]=3;c[z+(aa+20|0)>>2]=I;c[M>>2]=o;M=o+12|0;z=c[M>>2]|0;if((z|0)==0){c[M>>2]=u;c[o+8>>2]=u;B=q;C=o;E=0;F=J;G=K;H=ac;break}else{c[z+4>>2]=u;c[M>>2]=u;B=q;C=o;E=0;F=J;G=K;H=ac;break}}else if((t|0)==110|(t|0)==116|(t|0)==102){if((o|0)==0){l=128;break L41}do{if((s|0)==0){l=134}else{u=c[s+4>>2]|0;if((u+28|0)>>>0>(c[s>>2]|0)>>>0){l=134;break}else{ad=u;ae=s;break}}}while(0);if((l|0)==134){l=0;u=j$(1024)|0;c[u>>2]=1024;c[u+4>>2]=16;c[u+8>>2]=u;c[u+12>>2]=s;ad=16;ae=u}u=c[ae+8>>2]|0;M=u+ad|0;c[ae+4>>2]=ad+28|0;z=M;c[M>>2]=0;c[M+4>>2]=0;c[M+8>>2]=0;c[M+12>>2]=0;c[M+16>>2]=0;c[M+20>>2]=0;c[M+24>>2]=0;c[u+(ad+16|0)>>2]=h;af=a[f]|0;if((af<<24>>24|0)==110){if(a[f+1|0]<<24>>24!=117){l=149;break L41}if(a[f+2|0]<<24>>24!=108){l=149;break L41}if(a[f+3|0]<<24>>24!=108){l=149;break L41}c[u+(ad+24|0)>>2]=0;ag=f+4|0}else if((af<<24>>24|0)==116){if(a[f+1|0]<<24>>24!=114){l=149;break L41}if(a[f+2|0]<<24>>24!=117){l=149;break L41}if(a[f+3|0]<<24>>24!=101){l=149;break L41}c[u+(ad+24|0)>>2]=6;c[u+(ad+20|0)>>2]=1;ag=f+4|0}else if((af<<24>>24|0)==102){if(a[f+1|0]<<24>>24!=97){l=149;break L41}if(a[f+2|0]<<24>>24!=108){l=149;break L41}if(a[f+3|0]<<24>>24!=115){l=149;break L41}if(a[f+4|0]<<24>>24!=101){l=149;break L41}c[u+(ad+24|0)>>2]=6;c[u+(ad+20|0)>>2]=0;ag=f+5|0}else{l=149;break L41}c[M>>2]=o;M=o+12|0;u=c[M>>2]|0;if((u|0)==0){c[M>>2]=z;c[o+8>>2]=z;B=q;C=o;E=0;F=ag;G=d;H=ae;break}else{c[u+4>>2]=z;c[M>>2]=z;B=q;C=o;E=0;F=ag;G=d;H=ae;break}}else if((t|0)==45|(t|0)==48|(t|0)==49|(t|0)==50|(t|0)==51|(t|0)==52|(t|0)==53|(t|0)==54|(t|0)==55|(t|0)==56|(t|0)==57){if((o|0)==0){l=157;break L41}do{if((s|0)==0){l=163}else{z=c[s+4>>2]|0;if((z+28|0)>>>0>(c[s>>2]|0)>>>0){l=163;break}else{ah=z;ai=s;break}}}while(0);if((l|0)==163){l=0;z=j$(1024)|0;c[z>>2]=1024;c[z+4>>2]=16;c[z+8>>2]=z;c[z+12>>2]=s;ah=16;ai=z}z=c[ai+8>>2]|0;M=z+ah|0;c[ai+4>>2]=ah+28|0;u=M;c[M>>2]=0;c[M+4>>2]=0;c[M+8>>2]=0;c[M+12>>2]=0;c[M+16>>2]=0;c[M+20>>2]=0;c[M+24>>2]=0;c[z+(ah+16|0)>>2]=h;y=z+(ah+24|0)|0;c[y>>2]=4;X=f;P=4;while(1){_=a[X]|0;if((_<<24>>24|0)==46|(_<<24>>24|0)==101|(_<<24>>24|0)==69){c[y>>2]=5;aj=5}else if((_<<24>>24|0)==32|(_<<24>>24|0)==9|(_<<24>>24|0)==13|(_<<24>>24|0)==10|(_<<24>>24|0)==44|(_<<24>>24|0)==93|(_<<24>>24|0)==125){break}else{aj=P}X=X+1|0;P=aj}L175:do{if((P|0)==4){y=z+(ah+20|0)|0;do{if((f|0)==(X|0)){ak=1;al=f}else{_=a[f]|0;if((_<<24>>24|0)==45){ak=-1;al=f+1|0;break}else if((_<<24>>24|0)==43){ak=1;al=f+1|0;break}else{ak=1;al=f;break}}}while(0);L183:do{if((al|0)==(X|0)){am=0}else{_=al;R=0;while(1){an=a[_]|0;if((an-48&255)>=10){break}ao=((R*10&-1)-48|0)+(an<<24>>24)|0;an=_+1|0;if((an|0)==(X|0)){am=ao;break L183}else{_=an;R=ao}}c[y>>2]=ab(R,ak);if((_|0)==(X|0)){break L175}else{l=178;break L41}}}while(0);c[y>>2]=ab(am,ak)}else if((P|0)==5){ao=z+(ah+20|0)|0;do{if((f|0)==(X|0)){ap=1.0;aq=f}else{an=a[f]|0;if((an<<24>>24|0)==45){ap=-1.0;aq=f+1|0;break}else if((an<<24>>24|0)==43){ap=1.0;aq=f+1|0;break}else{ap=1.0;aq=f;break}}}while(0);L196:do{if((aq|0)==(X|0)){ar=0.0;l=192}else{y=aq;as=0.0;while(1){at=a[y]|0;if((at-48&255)>=10){break}au=as*10.0+ +((at<<24>>24)-48|0);an=y+1|0;if((an|0)==(X|0)){ar=au;l=192;break L196}else{y=an;as=au}}L201:do{if(at<<24>>24==46){_=y+1|0;if((_|0)==(X|0)){ar=as;l=192;break L196}else{av=as;aw=.10000000149011612;ax=_}while(1){_=a[ax]|0;if((_-48&255)>=10){ay=av;az=ax;aA=_;break L201}au=av+aw*+((_<<24>>24)-48|0);_=ax+1|0;if((_|0)==(X|0)){ar=au;l=192;break L196}else{av=au;aw=aw*.10000000149011612;ax=_}}}else{ay=as;az=y;aA=at}}while(0);as=ap*ay;if((az|0)==(X|0)){aB=as;break}do{if((aA<<24>>24|0)==101|(aA<<24>>24|0)==69){y=az+1|0;Q=a[y]|0;if((Q<<24>>24|0)==45){aC=1;aD=az+2|0}else if((Q<<24>>24|0)==43){aC=0;aD=az+2|0}else{aC=0;aD=y}if((aD|0)==(X|0)){aB=as;break L196}else{aE=aD;aF=0}while(1){y=a[aE]|0;if((y-48&255)>=10){aG=aE;aH=aF;break}Q=((aF*10&-1)-48|0)+(y<<24>>24)|0;y=aE+1|0;if((y|0)==(X|0)){aG=X;aH=Q;break}else{aE=y;aF=Q}}if((aH|0)==0){aI=as;aJ=aG;break}L219:do{if((aH|0)>1){Q=aH;au=10.0;while(1){aK=au*10.0;y=Q-1|0;if((y|0)>1){Q=y;au=aK}else{aL=aK;break L219}}}else{aL=10.0}}while(0);if(aC<<24>>24==0){aI=as*aL;aJ=aG;break}else{aI=as/aL;aJ=aG;break}}else{aI=as;aJ=az}}while(0);g[ao>>2]=aI;if((aJ|0)==(X|0)){break L175}else{l=209;break L41}}}while(0);if((l|0)==192){l=0;aB=ap*ar}g[ao>>2]=aB}}while(0);c[M>>2]=o;z=o+12|0;P=c[z>>2]|0;if((P|0)==0){c[z>>2]=u;c[o+8>>2]=u;B=q;C=o;E=0;F=X;G=d;H=ai;break}else{c[P+4>>2]=u;c[z>>2]=u;B=q;C=o;E=0;F=X;G=d;H=ai;break}}else{l=216;break L41}}while(0);aM=F;while(1){t=a[aM]|0;if((t<<24>>24|0)==0){l=222;break L41}else if(!((t<<24>>24|0)==32|(t<<24>>24|0)==9|(t<<24>>24|0)==13|(t<<24>>24|0)==10)){d=G;f=aM;h=E;o=C;q=B;r=t;s=H;continue L41}aM=aM+1|0}}if((l|0)==52){if((A|0)==(k|0)){m=x;n=5246684;l=245;break}q=A;o=1-d|0;while(1){h=a[q]<<24>>24==10?o+1|0:o;t=q-1|0;if((t|0)==(k|0)){m=x;n=5246684;l=245;break L40}else{q=t;o=h}}}else if((l|0)==57){if((f|0)==(k|0)){m=s;n=5248104;l=245;break}o=f;q=1-d|0;h=r;while(1){t=o-1|0;if((t|0)==(k|0)){m=s;n=5248104;l=245;break L40}o=t;q=h<<24>>24==10?q+1|0:q;h=a[t]|0}}else if((l|0)==64){if((f|0)==(k|0)){m=s;n=5247656;l=245;break}h=f;q=1-d|0;o=r;while(1){t=h-1|0;if((t|0)==(k|0)){m=s;n=5247656;l=245;break L40}h=t;q=o<<24>>24==10?q+1|0:q;o=a[t]|0}}else if((l|0)==70){if((f|0)==(k|0)){m=s;n=5247656;l=245;break}o=f;q=1-d|0;h=r;while(1){t=o-1|0;if((t|0)==(k|0)){m=s;n=5247656;l=245;break L40}o=t;q=h<<24>>24==10?q+1|0:q;h=a[t]|0}}else if((l|0)==76){if((f|0)==(k|0)){m=s;n=5247656;l=245;break}h=f;q=1-d|0;o=r;while(1){t=h-1|0;if((t|0)==(k|0)){m=s;n=5247656;l=245;break L40}h=t;q=o<<24>>24==10?q+1|0:q;o=a[t]|0}}else if((l|0)==83){if((I|0)==(k|0)){m=s;n=5247236;l=245;break}o=I;q=1-L|0;while(1){h=a[o]<<24>>24==10?q+1|0:q;t=o-1|0;if((t|0)==(k|0)){m=s;n=5247236;l=245;break L40}else{o=t;q=h}}}else if((l|0)==103){if((N|0)==(k|0)){m=s;n=5246812;l=245;break}q=N;o=1-L|0;h=0;while(1){t=q-1|0;if((t|0)==(k|0)){m=s;n=5246812;l=245;break L40}q=t;o=h?o+1|0:o;h=a[t]<<24>>24==10}}else if((l|0)==113){if((I|0)==(k|0)){m=s;n=5246032;l=245;break}h=I;o=1-L|0;while(1){q=a[h]<<24>>24==10?o+1|0:o;t=h-1|0;if((t|0)==(k|0)){m=s;n=5246032;l=245;break L40}else{h=t;o=q}}}else if((l|0)==128){if((f|0)==(k|0)){m=s;n=5247656;l=245;break}o=f;h=1-d|0;q=r;while(1){t=o-1|0;if((t|0)==(k|0)){m=s;n=5247656;l=245;break L40}o=t;h=q<<24>>24==10?h+1|0:h;q=a[t]|0}}else if((l|0)==149){if((f|0)==(k|0)){m=ae;n=5245368;l=245;break}q=f;h=1-d|0;o=af;while(1){t=q-1|0;if((t|0)==(k|0)){m=ae;n=5245368;l=245;break L40}q=t;h=o<<24>>24==10?h+1|0:h;o=a[t]|0}}else if((l|0)==157){if((f|0)==(k|0)){m=s;n=5247656;l=245;break}o=f;h=1-d|0;q=r;while(1){t=o-1|0;if((t|0)==(k|0)){m=s;n=5247656;l=245;break L40}o=t;h=q<<24>>24==10?h+1|0:h;q=a[t]|0}}else if((l|0)==178){if((f|0)==(k|0)){m=ai;n=5244636;l=245;break}q=f;h=1-d|0;while(1){o=a[q]<<24>>24==10?h+1|0:h;t=q-1|0;if((t|0)==(k|0)){m=ai;n=5244636;l=245;break L40}else{q=t;h=o}}}else if((l|0)==209){if((f|0)==(k|0)){m=ai;n=5244064;l=245;break}h=f;q=1-d|0;while(1){o=a[h]<<24>>24==10?q+1|0:q;t=h-1|0;if((t|0)==(k|0)){m=ai;n=5244064;l=245;break L40}else{h=t;q=o}}}else if((l|0)==216){if((f|0)==(k|0)){m=s;n=5247656;l=245;break}q=f;h=1-d|0;o=r;while(1){t=q-1|0;if((t|0)==(k|0)){m=s;n=5247656;l=245;break L40}q=t;h=o<<24>>24==10?h+1|0:h;o=a[t]|0}}else if((l|0)==222){if((C|0)==0){if((B|0)==0){m=H;n=0;l=245;break}else{aN=B;aO=H;break}}if((aM|0)==(k|0)){m=H;n=5243544;l=245;break}o=aM;h=1-G|0;q=0;while(1){s=o-1|0;if((s|0)==(k|0)){m=H;n=5243544;l=245;break L40}o=s;h=q?h+1|0:h;q=a[s]<<24>>24==10}}}}while(0);if((l|0)==245){l=c[p>>2]|0;bF(l|0,5248920,(w=i,i=i+4|0,c[w>>2]=n,w)|0);bE();aN=0;aO=m}ct(b,aN);if((aO|0)==0){j0(k);i=e;return}else{aP=aO}while(1){aO=c[aP+12>>2]|0;j0(aP);if((aO|0)==0){break}else{aP=aO}}j0(k);i=e;return}function cv(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,i=0,j=0,l=0,m=0.0,n=0.0;if((b|0)==0){bS(5248908,273,5249776,5247800);d=a+12|0;c[d>>2]=(c[d>>2]|0)+1|0;return}d=b|0;e=c[d>>2]|0;if((e|0)==1){f=a+24|0;c[f>>2]=(c[f>>2]|0)+1|0;if((c[d>>2]|0)==1){g=c[b+4>>2]|0}else{g=0}f=j8(g)|0;g=a+28|0;c[g>>2]=(c[g>>2]|0)+f|0;return}else if((e|0)==4){f=a+20|0;c[f>>2]=(c[f>>2]|0)+1|0;if((c[d>>2]|0)==4){i=b+4|0}else{i=0}f=c[i+4>>2]|0;g=a+32|0;c[g>>2]=(c[g>>2]|0)+f|0;if((f|0)==0){return}g=i|0;i=0;while(1){cv(a,c[(c[g>>2]|0)+(i<<2)>>2]|0);j=i+1|0;if((j|0)==(f|0)){break}else{i=j}}return}else if((e|0)==2){i=a+12|0;c[i>>2]=(c[i>>2]|0)+1|0}else if((e|0)==3){i=a+16|0;c[i>>2]=(c[i>>2]|0)+1|0;if((c[d>>2]|0)==3){l=b+4|0}else{l=0}i=c[l+8>>2]|0;f=a+36|0;c[f>>2]=(c[f>>2]|0)+i|0;if((i|0)==0){return}f=l+4|0;l=0;while(1){cv(a,c[(c[f>>2]|0)+(l<<2)>>2]|0);g=l+1|0;if((g|0)==(i|0)){break}else{l=g}}return}else if((e|0)==6){l=a+4|0;c[l>>2]=(c[l>>2]|0)+1|0;return}else if((e|0)==5){l=a+8|0;c[l>>2]=(c[l>>2]|0)+1|0;return}else if((e|0)==7){e=a|0;c[e>>2]=(c[e>>2]|0)+1|0;return}else{bS(5248908,273,5249776,5247800);e=a+12|0;c[e>>2]=(c[e>>2]|0)+1|0}if((c[d>>2]|0)!=2){return}d=c[b+24>>2]|0;if((d&1|0)!=0){e=b+4|0;m=+((c[e>>2]|0)>>>0)+ +(c[e+4>>2]|0)*4294967296.0;e=a+40|0;n=(c[k>>2]=c[e>>2]|0,c[k+4>>2]=c[e+4>>2]|0,+h[k>>3])+m;h[k>>3]=n,c[e>>2]=c[k>>2]|0,c[e+4>>2]=c[k+4>>2]|0;return}if((d&2|0)==0){return}d=b+12|0;n=(c[k>>2]=c[d>>2]|0,c[k+4>>2]=c[d+4>>2]|0,+h[k>>3]);d=a+40|0;m=n+(c[k>>2]=c[d>>2]|0,c[k+4>>2]=c[d+4>>2]|0,+h[k>>3]);h[k>>3]=m,c[d>>2]=c[k>>2]|0,c[d+4>>2]=c[k+4>>2]|0;return}function cw(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0.0,t=0.0;d=b|0;e=c[d>>2]|0;if((e|0)==7){f=a|0;c[f>>2]=(c[f>>2]|0)+1|0;return}else if((e|0)==6){f=a+4|0;c[f>>2]=(c[f>>2]|0)+1|0;return}else if((e|0)==5){f=a+8|0;c[f>>2]=(c[f>>2]|0)+1|0;return}else if((e|0)==1){f=a+20|0;c[f>>2]=(c[f>>2]|0)+1|0;if((c[d>>2]|0)!=1){return}f=b+12|0;g=c[f>>2]|0;i=a+32|0;c[i>>2]=(c[i>>2]|0)+g|0;if((g|0)==0){return}i=b+16|0;j=0;while(1){do{if((c[d>>2]|0)==1){if((c[f>>2]|0)>>>0<=j>>>0){l=0;break}l=c[(c[i>>2]|0)+(j<<2)>>2]|0}else{l=0}}while(0);cw(a,l);m=j+1|0;if((m|0)==(g|0)){break}else{j=m}}return}else if((e|0)==0){j=a+16|0;c[j>>2]=(c[j>>2]|0)+1|0;if((c[d>>2]|0)==0){n=c[b+8>>2]|0}else{n=0}j=a+36|0;c[j>>2]=(c[j>>2]|0)+n|0;do{if((c[d>>2]|0)==0){n=c[b+24>>2]|0;if((n|0)==(b+20|0)){o=0;break}o=n}else{o=0}}while(0);n=(o|0)==0?0:o+16|0;if((n|0)==0){return}o=b+20|0;j=n;while(1){if((j-16|0)==0){p=331;break}n=c[j-8>>2]|0;if((n|0)==0){p=332;break}cw(a,n);do{if((c[d>>2]|0)==0){n=c[j-12>>2]|0;if((n|0)==(o|0)){q=0;break}q=n}else{q=0}}while(0);n=(q|0)==0?0:q+16|0;if((n|0)==0){p=333;break}else{j=n}}if((p|0)==331){return}else if((p|0)==332){return}else if((p|0)==333){return}}else if((e|0)==2){p=c[b+8>>2]|0;j=a+24|0;c[j>>2]=(c[j>>2]|0)+1|0;j=j8(p)|0;p=a+28|0;c[p>>2]=(c[p>>2]|0)+j|0;return}else if((e|0)==4){j=a+12|0;c[j>>2]=(c[j>>2]|0)+1|0;if((c[d>>2]|0)==4){j=b+8|0;r=(c[k>>2]=c[j>>2]|0,c[k+4>>2]=c[j+4>>2]|0,+h[k>>3])}else{r=0.0}j=a+40|0;s=r+(c[k>>2]=c[j>>2]|0,c[k+4>>2]=c[j+4>>2]|0,+h[k>>3]);h[k>>3]=s,c[j>>2]=c[k>>2]|0,c[j+4>>2]=c[k+4>>2]|0;return}else if((e|0)==3){e=a+12|0;c[e>>2]=(c[e>>2]|0)+1|0;if((c[d>>2]|0)==3){d=b+8|0;t=+((c[d>>2]|0)>>>0)+ +(c[d+4>>2]|0)*4294967296.0}else{t=0.0}d=a+40|0;s=t+(c[k>>2]=c[d>>2]|0,c[k+4>>2]=c[d+4>>2]|0,+h[k>>3]);h[k>>3]=s,c[d>>2]=c[k>>2]|0,c[d+4>>2]=c[k+4>>2]|0;return}else{bS(5248908,355,5249940,5247040);return}}function cx(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,u=0,v=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0;f=i;i=i+1112|0;g=f|0;h=f+72|0;j=f+88|0;k=e+4|0;l=(c[k>>2]|0)+1|0;m=(l|0)==0?1:l;while(1){n=j$(m)|0;if((n|0)!=0){break}l=(D=c[1316362]|0,c[1316362]=D+0,D);if((l|0)==0){o=347;break}b7[l&1023]()}if((o|0)==347){m=bO(4)|0;c[m>>2]=5257468;bg(m|0,5262716,348)}m=c[k>>2]|0;j9(n,c[e+8>>2]|0,m);a[n+m|0]=0;m=j|0;j=h;c[j>>2]=0;c[j+4>>2]=0;c[h+8>>2]=m;c[h+12>>2]=1024;kb(m|0,0,1024);j=j$(60)|0;e=j;k=j+40|0;l=k;q=k;x=130;a[q]=x&255;x=x>>8;a[q+1|0]=x&255;x=x>>8;a[q+2|0]=x&255;x=x>>8;a[q+3|0]=x&255;k=j+44|0;x=622;a[k]=x&255;x=x>>8;a[k+1|0]=x&255;x=x>>8;a[k+2|0]=x&255;x=x>>8;a[k+3|0]=x&255;r=j+48|0;x=192;a[r]=x&255;x=x>>8;a[r+1|0]=x&255;x=x>>8;a[r+2|0]=x&255;x=x>>8;a[r+3|0]=x&255;s=j+52|0;x=0;a[s]=x&255;x=x>>8;a[s+1|0]=x&255;x=x>>8;a[s+2|0]=x&255;x=x>>8;a[s+3|0]=x&255;c[j>>2]=5242880;c[j+4>>2]=h;t=j+8|0;c[t>>2]=0;u=j+16|0;c[u>>2]=0;v=j$(16)|0;kb(v|0,0,12);c[v+12>>2]=l;c[j+20>>2]=v;v=j+56|0;c[v>>2]=0;y=j+24|0;c[y>>2]=0;z=j+32|0;c[z>>2]=0;c[j+36>>2]=l;c[j+28>>2]=128;A=bY[c[k>>2]&1023](c[s>>2]|0,0,128)|0;c[y>>2]=A;k=c[z>>2]|0;c[z>>2]=k+1|0;a[A+k|0]=0;cM(e,(w=i,i=i+4|0,c[w>>2]=1,w)|0);k=j8(n)|0;if((c[t>>2]|0)==0){A=c[v>>2]|0;B=cc[c[q>>2]&1023](c[s>>2]|0,36)|0;kb(B|0,0,36);C=cc[c[q>>2]&1023](c[s>>2]|0,16)|0;kb(C|0,0,12);c[C+12>>2]=l;c[B+12>>2]=C;c[B+24>>2]=A&1;c[B+28>>2]=A>>>1&1^1;c[B+32>>2]=l;c[t>>2]=B}cO(e,n,k);if((c[t>>2]|0)==0){k=c[v>>2]|0;B=cc[c[q>>2]&1023](c[s>>2]|0,36)|0;kb(B|0,0,36);A=cc[c[q>>2]&1023](c[s>>2]|0,16)|0;kb(A|0,0,12);c[A+12>>2]=l;c[B+12>>2]=A;c[B+24>>2]=k&1;c[B+28>>2]=k>>>1&1^1;c[B+32>>2]=l;c[t>>2]=B}L445:do{if((cO(e,5243520,1)|0)==0){B=c[z>>2]|0;if((B|0)==0){bS(5245872,162,5249496,5245792);E=c[z>>2]|0}else{E=B}B=(c[y>>2]|0)+(E-1|0)|0;l=d[B]|0;do{if((l|0)==2|(l|0)==3){o=363;break L445}else if(!((l|0)==12|(l|0)==1)){if((c[v>>2]&16|0)!=0){break}a[B]=2;c[j+12>>2]=5245412;o=363;break L445}}while(0);cN(e);B=c[h+4>>2]|0;if((B|0)==0){break}else{F=B}cv(b,F);c2(F);j0(n);i=f;return}else{o=363}}while(0);if((o|0)==363){h=j8(n)|0;v=g|0;E=c[u>>2]|0;u=c[z>>2]|0;if((u|0)==0){bS(5245872,71,5249436,5245792);G=c[z>>2]|0}else{G=u}u=c[y>>2]|0;L460:do{if(a[u+(G-1|0)|0]<<24>>24==2){B=c[j+12>>2]|0;if((B|0)==0){H=13;I=0;J=5245736;K=0;break}else{L=B;M=5245736;N=15;o=383;break}}else{if((G|0)==0){bS(5245872,74,5249436,5245792);O=c[z>>2]|0;P=c[y>>2]|0}else{O=G;P=u}if(a[P+(O-1|0)|0]<<24>>24!=3){H=15;I=0;J=5246608;K=0;break}B=c[t>>2]|0;do{if((B|0)!=0){l=c[B+8>>2]|0;if((l|0)==1){L=5246720;M=5245692;N=17;o=383;break L460}else if((l|0)==2){L=5246616;M=5245692;N=17;o=383;break L460}else if((l|0)==3){L=5246572;M=5245692;N=17;o=383;break L460}else if((l|0)==0){L=5248080;M=5245692;N=17;o=383;break L460}else if((l|0)==9){L=5246204;M=5245692;N=17;o=383;break L460}else if((l|0)==10){L=5246112;M=5245692;N=17;o=383;break L460}else if((l|0)==4){L=5246508;M=5245692;N=17;o=383;break L460}else if((l|0)==5){L=5246440;M=5245692;N=17;o=383;break L460}else if((l|0)==6){L=5246408;M=5245692;N=17;o=383;break L460}else if((l|0)==8){L=5246348;M=5245692;N=17;o=383;break L460}else if((l|0)==7){L=5246284;M=5245692;N=17;o=383;break L460}else{break}}}while(0);L=5246e3;M=5245692;N=17;o=383;break}}while(0);if((o|0)==383){H=N+(j8(L)|0)|0;I=L;J=M;K=1}M=cc[c[q>>2]&1023](c[s>>2]|0,H)|0;if((M|0)==0){Q=0}else{a[M]=0;kc(M,J);J=M+(j8(M)|0)|0;a[J]=a[5245644]|0;a[J+1|0]=a[5245645|0]|0;a[J+2|0]=a[5245646|0]|0;a[J+3|0]=a[5245647|0]|0;a[J+4|0]=a[5245648|0]|0;a[J+5|0]=a[5245649|0]|0;a[J+6|0]=a[5245650|0]|0;if(K){K=M+(j8(M)|0)|0;a[K]=a[5248568]|0;a[K+1|0]=a[5248569|0]|0;a[K+2|0]=a[5248570|0]|0;kc(M,I)}I=M+(j8(M)|0)|0;x=10;a[I]=x&255;x=x>>8;a[I+1|0]=x&255;I=E>>>0>29?E-30|0:0;K=E+30|0;J=(E>>>0>30?E+10|0:40)-E|0;kb(v|0,32,J|0);L489:do{if(I>>>0<(K>>>0>h>>>0?h:K)>>>0){H=h^-1;L=-31-E|0;N=((J-1|0)-I|0)-(L>>>0<H>>>0?H:L)|0;L=I;H=J;while(1){o=a[n+L|0]|0;if((o<<24>>24|0)==10|(o<<24>>24|0)==13){a[g+H|0]=32}else{a[g+H|0]=o}o=H+1|0;if((o|0)==(N|0)){R=N;break L489}else{L=L+1|0;H=o}}}else{R=J}}while(0);if(R>>>0>=72){bS(5245872,123,5249436,5245484)}a[g+R|0]=10;a[g+(R+1|0)|0]=0;R=c[q>>2]|0;q=c[s>>2]|0;g=j8(M)|0;J=(g+43|0)+(j8(v)|0)|0;g=cc[R&1023](q,J)|0;if((g|0)!=0){a[g]=0;kc(g,M);kc(g,v);j9(g+(j8(g)|0)|0,5245940,43)}b0[c[r>>2]&1023](c[s>>2]|0,M);Q=g}aQ(m|0,1024,5244176,(w=i,i=i+4|0,c[w>>2]=Q,w)|0);cN(e)}bF(c[p>>2]|0,5247424,(w=i,i=i+4|0,c[w>>2]=m,w)|0);bE();F=0;cv(b,F);c2(F);j0(n);i=f;return}function cy(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0;f=i;i=i+328|0;g=f|0;h=f+64|0;j=f+76|0;a[j+92|0]=0;c[j>>2]=-1;c[j+4>>2]=-1;k=j+8|0;c[k>>2]=0;j9(j+12|0,5246496,9);do{if((e|0)==0){c6(j,0,5247072,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0)}else{c[h>>2]=e;c[h+8>>2]=0;c[h+4>>2]=d;c[g>>2]=18;c[g+4>>2]=h;a[g+8|0]=0;c[g+16>>2]=0;c[g+20>>2]=0;c[g+24>>2]=1;c[g+28>>2]=0;l=g+36|0;c[l>>2]=0;m=g+48|0;c[m>>2]=16;n=g+44|0;c[n>>2]=0;o=j$(16)|0;q=g+40|0;c[q>>2]=o;if((o|0)==0){break}a[o]=0;o=g+52|0;c[o>>2]=-1;c9(g,j);r=c[o>>2]|0;do{if((r|0)==91|(r|0)==123){s=da(g,j)|0;if((s|0)==0){t=0;break}c9(g,j);if((c[o>>2]|0)==0){c[k>>2]=c[l>>2]|0;t=s;break}c6(j,g,5246088,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);u=s+4|0;v=c[u>>2]|0;if((v|0)==-1){t=0;break}x=v-1|0;c[u>>2]=x;if((x|0)!=0){t=0;break}c8(s);t=0}else{c6(j,g,5246184,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);t=0}}while(0);do{if((c[o>>2]|0)==256){l=c[g+56>>2]|0;if((l|0)==0){break}j0(l)}}while(0);o=c[q>>2]|0;if((o|0)!=0){j0(o)}c[m>>2]=0;c[n>>2]=0;c[q>>2]=0;if((t|0)==0){break}cw(b,t);o=t+4|0;l=c[o>>2]|0;if((l|0)==-1){i=f;return}r=l-1|0;c[o>>2]=r;if((r|0)!=0){i=f;return}c8(t);i=f;return}}while(0);az(5246468,24,1,c[p>>2]|0);bE();cw(b,0);i=f;return}function cz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0,x=0.0;d=i;i=i+24|0;e=d|0;f=d+12|0;g=b|0;j=c[g>>2]|0;if((j|0)==2){l=a|0;c[l>>2]=(c[l>>2]|0)+1|0;i=d;return}else if((j|0)==3){l=a+4|0;c[l>>2]=(c[l>>2]|0)+1|0;i=d;return}else if((j|0)==4){l=a+8|0;c[l>>2]=(c[l>>2]|0)+1|0;i=d;return}else if((j|0)==6){l=a+20|0;c[l>>2]=(c[l>>2]|0)+1|0;l=b+4|0;m=c[c[l>>2]>>2]|0;n=a+32|0;c[n>>2]=(c[n>>2]|0)+m|0;if((m|0)==0){i=d;return}n=b+8|0;o=e|0;p=e+4|0;q=e+8|0;r=0;while(1){s=r+1|0;t=c[l>>2]|0;u=c[t+(s<<2)>>2]|0;v=c[n>>2]|0;c[o>>2]=u>>>29;c[p>>2]=t+((u&536870911)<<2)|0;c[q>>2]=v;cz(a,e);if((s|0)==(m|0)){break}else{r=s}}i=d;return}else if((j|0)==7){r=a+16|0;c[r>>2]=(c[r>>2]|0)+1|0;r=b+4|0;m=c[c[r>>2]>>2]|0;e=a+36|0;c[e>>2]=(c[e>>2]|0)+m|0;if((m|0)==0){i=d;return}e=b+8|0;q=f|0;p=f+4|0;o=f+8|0;n=0;while(1){l=c[r>>2]|0;s=c[l+((n*3&-1)+3<<2)>>2]|0;v=c[e>>2]|0;c[q>>2]=s>>>29;c[p>>2]=l+((s&536870911)<<2)|0;c[o>>2]=v;cz(a,f);v=n+1|0;if((v|0)==(m|0)){break}else{n=v}}i=d;return}else if((j|0)==5){n=a+24|0;c[n>>2]=(c[n>>2]|0)+1|0;n=c[b+4>>2]|0;m=a+28|0;c[m>>2]=((c[n+4>>2]|0)-(c[n>>2]|0)|0)+(c[m>>2]|0)|0;i=d;return}else if((j|0)==1|(j|0)==0){j=a+12|0;c[j>>2]=(c[j>>2]|0)+1|0;j=c[b+4>>2]|0;if((c[g>>2]|0)==0){w=+(c[j>>2]|0)}else{g=j;w=(c[k>>2]=c[g>>2]|0,c[k+4>>2]=c[g+4>>2]|0,+h[k>>3])}g=a+40|0;x=w+(c[k>>2]=c[g>>2]|0,c[k+4>>2]=c[g+4>>2]|0,+h[k>>3]);h[k>>3]=x,c[g>>2]=c[k>>2]|0,c[g+4>>2]=c[k+4>>2]|0;i=d;return}else{bS(5248908,422,5249992,5247040);i=d;return}}function cA(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,q=0,r=0,s=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0.0,aL=0,aM=0,aN=0.0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0.0,aV=0,aW=0,aX=0,aY=0,aZ=0.0,a_=0,a$=0.0,a0=0,a1=0.0,a2=0,a3=0,a4=0,a5=0,a6=0.0,a7=0,a8=0,a9=0,ba=0.0,bb=0,bc=0,bd=0,be=0,bf=0.0,bi=0,bj=0.0,bk=0,bl=0.0,bm=0,bn=0,bo=0.0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0;e=i;i=i+160|0;f=e|0;g=e+8|0;j=e+16|0;l=e+24|0;m=e+36|0;n=e+92|0;o=e+136|0;q=e+148|0;r=d+4|0;s=c[r>>2]|0;u=(s|0)==0?1:s;while(1){v=j$(u)|0;if((v|0)!=0){break}s=(D=c[1316362]|0,c[1316362]=D+0,D);if((s|0)==0){x=466;break}b7[s&1023]()}if((x|0)==466){u=bO(4)|0;c[u>>2]=5257468;bg(u|0,5262716,348)}u=c[r>>2]|0;j9(v,c[d+8>>2]|0,u);while(1){y=j$(4)|0;if((y|0)!=0){break}d=(D=c[1316362]|0,c[1316362]=D+0,D);if((d|0)==0){x=480;break}b7[d&1023]()}if((x|0)==480){d=bO(4)|0;c[d>>2]=5257468;bg(d|0,5262716,348)}d=y;c[d>>2]=1;r=(u|0)==0?1:u;while(1){z=j$(r)|0;if((z|0)!=0){break}s=(D=c[1316362]|0,c[1316362]=D+0,D);if((s|0)==0){x=492;break}b7[s&1023]()}if((x|0)==492){r=bO(4)|0;c[r>>2]=5257468;bg(r|0,5262716,348)}j9(z,v,u);r=aD(u|0,4)|0;s=F?-1:r;r=(s|0)==0?1:s;while(1){A=j$(r)|0;if((A|0)!=0){break}s=(D=c[1316362]|0,c[1316362]=D+0,D);if((s|0)==0){x=507;break}b7[s&1023]()}if((x|0)==507){r=bO(4)|0;c[r>>2]=5257468;bg(r|0,5262716,348)}r=A;s=m|0;c[s>>2]=d;c[d>>2]=2;B=m+4|0;c[B>>2]=u;C=m+8|0;c[C>>2]=z;E=m+12|0;G=z+u|0;c[E>>2]=G;H=m+16|0;c[H>>2]=r;I=m+20|0;c[I>>2]=z;J=m+24|0;c[J>>2]=r;K=m+28|0;c[K>>2]=2;L=m+32|0;c[L>>2]=r+(u<<2)|0;M=m+36|0;N=M;c[N>>2]=0;c[N+4>>2]=0;c[N+8>>2]=0;c[N+12>>2]=0;c[N+16>>2]=0;N=l;L604:do{if((u|0)==0){x=517}else{l=z;while(1){O=a[l]|0;P=O<<24>>24;if(!((P|0)==32|(P|0)==9|(P|0)==10|(P|0)==13)){break}P=l+1|0;c[I>>2]=P;if((P|0)==(G|0)){x=517;break L604}else{l=P}}if((O<<24>>24|0)==0){x=517;break}else if((O<<24>>24|0)==123){Q=7}else if((O<<24>>24|0)==91){Q=6}else{c[M>>2]=1;c[m+40>>2]=1;dW(m+44|0,5247704);R=0;break}c[I>>2]=l+1|0;c[J>>2]=A+4|0;c[r>>2]=Q<<29|536870911;P=m+40|0;S=m+44|0;T=g;U=j;V=Q;W=r;X=0;L613:while(1){Y=V;Z=W;while(1){_=(Y|0)==7;$=c[I>>2]|0;aa=c[E>>2]|0;L617:do{if(($|0)==(aa|0)){ab=0;ac=$}else{ad=$;while(1){ae=a[ad]|0;af=ae<<24>>24;if(!((af|0)==32|(af|0)==9|(af|0)==10|(af|0)==13)){ab=ae;ac=ad;break L617}ae=ad+1|0;c[I>>2]=ae;if((ae|0)==(aa|0)){ab=0;ac=aa;break L617}else{ad=ae}}}}while(0);$=c[J>>2]|0;ag=Z+4|0;L622:do{if($>>>0>ag>>>0){if((ab<<24>>24|0)==((_?125:93)|0)){ah=ab;ai=ac;break}if(ab<<24>>24!=44){x=531;break L613}ad=ac+1|0;c[I>>2]=ad;if((ad|0)==(aa|0)){ah=0;ai=aa;break}else{aj=ad}while(1){ad=a[aj]|0;ae=ad<<24>>24;if(!((ae|0)==32|(ae|0)==9|(ae|0)==10|(ae|0)==13)){ah=ad;ai=aj;break L622}ad=aj+1|0;c[I>>2]=ad;if((ad|0)==(aa|0)){ah=0;ai=aa;break L622}else{aj=ad}}}else{ah=ab;ai=ac}}while(0);if(ah<<24>>24==125|_^1){ak=aa;al=$;am=ai}else{if(ah<<24>>24!=34){x=534;break L613}cD(f,m,$);ad=c[I>>2]|0;ae=c[E>>2]|0;if((ad|0)==(ae|0)){x=539;break L613}else{an=ad}while(1){ao=a[an]|0;ad=ao<<24>>24;if(!((ad|0)==32|(ad|0)==9|(ad|0)==10|(ad|0)==13)){break}ad=an+1|0;c[I>>2]=ad;if((ad|0)==(ae|0)){x=539;break L613}else{an=ad}}if(ao<<24>>24!=58){x=539;break L613}$=an+1|0;c[I>>2]=$;aa=(c[J>>2]|0)+8|0;c[J>>2]=aa;ak=ae;al=aa;am=$}L639:do{if((am|0)==(ak|0)){ap=0;aq=ak;ar=am}else{$=am;while(1){aa=a[$]|0;ad=aa<<24>>24;if(!((ad|0)==32|(ad|0)==9|(ad|0)==10|(ad|0)==13)){ap=aa;aq=$;ar=$;break L639}aa=$+1|0;c[I>>2]=aa;if((aa|0)==(ak|0)){ap=0;aq=ak;ar=ak;break L639}else{$=aa}}}}while(0);ae=ap<<24>>24;if((ae|0)==34){x=616;break}else if((ae|0)==123){as=7}else if((ae|0)==91){as=6}else if((ae|0)==93){x=619;break}else if((ae|0)==0){x=545;break L613}else if((ae|0)==110){x=546;break}else if((ae|0)==102){x=552;break}else if((ae|0)==116){x=558;break}else if((ae|0)==48|(ae|0)==49|(ae|0)==50|(ae|0)==51|(ae|0)==52|(ae|0)==53|(ae|0)==54|(ae|0)==55|(ae|0)==56|(ae|0)==57|(ae|0)==45){x=564;break}else if((ae|0)==125){x=621;break}else{x=629;break L613}c[I>>2]=aq+1|0;ae=Z-(c[H>>2]|0)>>2|Y<<29;c[J>>2]=al+4|0;c[al>>2]=ae;Y=as;Z=al}L647:do{if((x|0)==616){x=0;cD(g,m,0);at=Y;au=Z;av=c[T>>2]&255;aw=c[T+4>>2]|0;ax=X;x=630;break}else if((x|0)==619){x=0;if((Y|0)==6){ay=226;x=623;break}else{x=620;break L613}}else if((x|0)==546){x=0;if((ak-aq|0)<=3){x=547;break L613}if(a[aq+1|0]<<24>>24!=117){x=550;break L613}if(a[aq+3|0]<<24>>24!=108|a[aq+2|0]<<24>>24!=108){x=550;break L613}c[I>>2]=aq+4|0;az=2;aA=Z;aB=Y;aC=X;aE=al;break}else if((x|0)==552){x=0;if((ak-aq|0)<=4){x=553;break L613}if(a[aq+1|0]<<24>>24!=97){x=556;break L613}if(a[aq+3|0]<<24>>24!=115|a[aq+2|0]<<24>>24!=108|a[aq+4|0]<<24>>24!=101){x=556;break L613}c[I>>2]=aq+5|0;az=3;aA=Z;aB=Y;aC=X;aE=al;break}else if((x|0)==558){x=0;if((ak-aq|0)<=3){x=559;break L613}if(a[aq+1|0]<<24>>24!=114){x=562;break L613}if(a[aq+3|0]<<24>>24!=101|a[aq+2|0]<<24>>24!=117){x=562;break L613}c[I>>2]=aq+4|0;az=4;aA=Z;aB=Y;aC=X;aE=al;break}else if((x|0)==564){x=0;ae=a[ar]|0;if(ae<<24>>24==45){$=ar+1|0;c[I>>2]=$;if(($|0)==(ak|0)){x=567;break L613}aF=1;aG=$;aH=a[$]|0}else{aF=0;aG=ar;aH=ae}L667:do{if((aH-48&255)>9){aI=0;aJ=aH;aK=0.0;aL=0;aM=aG}else{aN=0.0;ae=0;$=0;aa=aG;ad=aH;while(1){if(($&1)<<24>>24==0){af=ae;aO=aa;aP=ad;while(1){aQ=aO+1|0;c[I>>2]=aQ;if((aQ|0)==(ak|0)){x=574;break L613}aR=aP-48&255;if((af|0)>214748355){break}aS=(aR<<24>>24)+(af*10&-1)|0;aT=a[aQ]|0;if((aT-48&255)>9){aI=aS;aJ=aT;aK=aN;aL=$;aM=aQ;break L667}else{af=aS;aO=aQ;aP=aT}}aU=+(af|0);aV=1;aW=af;aX=aR;aY=aQ}else{aP=aa+1|0;c[I>>2]=aP;if((aP|0)==(ak|0)){x=574;break L613}aU=aN;aV=$;aW=ae;aX=ad-48&255;aY=aP}aZ=+(aX<<24>>24|0)+aU*10.0;aP=a[aY]|0;if((aP-48&255)>9){aI=aW;aJ=aP;aK=aZ;aL=aV;aM=aY;break L667}else{aN=aZ;ae=aW;$=aV;aa=aY;ad=aP}}}}while(0);L680:do{if(aJ<<24>>24==46){if((aL&1)<<24>>24==0){a_=1;a$=+(aI|0)}else{a_=aL;a$=aK}ad=aM+1|0;c[I>>2]=ad;if((ad|0)==(ak|0)){x=583;break L613}aa=a[ad]|0;if((aa-48&255)>9){a0=a_;a1=a$;a2=0;a3=ad;a4=aa;break}else{a5=0;a6=a$;a7=ad;a8=aa}while(1){aa=a7+1|0;c[I>>2]=aa;if((aa|0)==(ak|0)){x=585;break L613}aN=a6*10.0+ +((a8<<24>>24)-48|0);ad=a5-1|0;$=a[aa]|0;if(($-48&255)>9){a0=a_;a1=aN;a2=ad;a3=aa;a4=$;break L680}else{a5=ad;a6=aN;a7=aa;a8=$}}}else{a0=aL;a1=aK;a2=0;a3=aM;a4=aJ}}while(0);if((a4<<24>>24|0)==101|(a4<<24>>24|0)==69){if((a0&1)<<24>>24==0){a9=1;ba=+(aI|0)}else{a9=a0;ba=a1}$=a3+1|0;c[I>>2]=$;if(($|0)==(ak|0)){x=591;break L613}aa=a[$]|0;if((aa<<24>>24|0)==45){ad=a3+2|0;c[I>>2]=ad;if((ad|0)==(ak|0)){x=594;break L613}else{bb=1;bc=ad}}else if((aa<<24>>24|0)==43){aa=a3+2|0;c[I>>2]=aa;if((aa|0)==(ak|0)){x=596;break L613}else{bb=0;bc=aa}}else{bb=0;bc=$}$=a[bc]|0;L700:do{if(($-48&255)>9){bd=0}else{aa=0;ad=bc;ae=$;while(1){aP=ad+1|0;c[I>>2]=aP;if((aP|0)==(ak|0)){x=599;break L613}aO=((aa*10&-1)-48|0)+(ae<<24>>24)|0;aT=a[aP]|0;if((aT-48&255)>9){bd=aO;break L700}else{aa=aO;ad=aP;ae=aT}}}}while(0);be=a9;bf=ba;bi=(bb?-bd|0:bd)+a2|0}else{be=a0;bf=a1;bi=a2}$=be&1;if((bi|0)==0){bj=bf;bk=$}else{if($<<24>>24==0){bS(5247316,799,5249824,5247296)}do{if((bi|0)>308){bl=+t}else{if((bi|0)<-323){bl=0.0;break}ae=5252404+(bi+323<<3)|0;bl=(c[k>>2]=c[ae>>2]|0,c[k+4>>2]=c[ae+4>>2]|0,+h[k>>3])}}while(0);bj=bf*bl;bk=$}do{if(aF){if(bk<<24>>24==0){bm=-aI|0;bn=c[L>>2]|0;break}else{bo=-0.0-bj;x=613;break}}else{bo=bj;x=613}}while(0);do{if((x|0)==613){x=0;$=c[L>>2]|0;if(bk<<24>>24==0){bm=aI;bn=$;break}ae=$-8|0;c[L>>2]=ae;h[k>>3]=bo;$=c[k+4>>2]|0;ad=ae;c[ad>>2]=c[k>>2]|0;c[ad+4>>2]=$;bp=1;bq=1;br=Z;bs=Y;x=631;break L647}}while(0);$=bn-4|0;c[L>>2]=$;c[$>>2]=bm;bp=0;bq=0;br=Z;bs=Y;x=631;break}else if((x|0)==621){x=0;if(_){ay=726;x=623;break}else{x=622;break L613}}}while(0);do{if((x|0)==623){x=0;c[I>>2]=aq+1|0;Y=c[Z>>2]|0;bZ[ay&1023](j,m,ag);bt=c[U+4>>2]|0;$=Y&536870911;if(($|0)==536870911){x=624;break L613}ad=c[U>>2]&255;c[J>>2]=Z;at=Y>>>29;au=(c[H>>2]|0)+($<<2)|0;av=ad;aw=bt;ax=X;x=630;break}}while(0);do{if((x|0)==630){x=0;if((av&1)<<24>>24==0){R=0;break L604}else{bp=ax;bq=aw;br=au;bs=at;x=631;break}}}while(0);if((x|0)==631){x=0;az=bq;aA=br;aB=bs;aC=bp;aE=c[J>>2]|0}Z=((c[L>>2]|0)-aA>>2)-1|az<<29;c[J>>2]=aE+4|0;c[aE>>2]=Z;V=aB;W=aA;X=aC}if((x|0)==599){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==594){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==591){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==620){c[M>>2]=1;c[P>>2]=1;dW(S,5247476);R=0;break}else if((x|0)==622){c[M>>2]=1;c[P>>2]=1;dW(S,5247448);R=0;break}else if((x|0)==624){c[K>>2]=bt;X=c[I>>2]|0;W=c[E>>2]|0;if((X|0)==(W|0)){R=1;break}else{bu=X}while(1){bv=a[bu]|0;X=bv<<24>>24;if(!((X|0)==32|(X|0)==9|(X|0)==10|(X|0)==13)){break}X=bu+1|0;c[I>>2]=X;if((X|0)==(W|0)){R=1;break L604}else{bu=X}}if(bv<<24>>24==0){R=1;break}c[M>>2]=1;c[P>>2]=1;dW(S,5247360);R=0;break}else if((x|0)==531){c[M>>2]=1;c[P>>2]=1;dW(S,5247684);R=0;break}else if((x|0)==534){c[M>>2]=1;c[P>>2]=1;dW(S,5247628);R=0;break}else if((x|0)==539){c[M>>2]=1;c[P>>2]=1;dW(S,5247552);R=0;break}else if((x|0)==545){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==547){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==550){c[M>>2]=1;c[P>>2]=1;dW(S,5247184);R=0;break}else if((x|0)==553){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==556){c[M>>2]=1;c[P>>2]=1;dW(S,5247200);R=0;break}else if((x|0)==559){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==562){c[M>>2]=1;c[P>>2]=1;dW(S,5247280);R=0;break}else if((x|0)==567){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==574){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==583){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==585){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}else if((x|0)==629){bh(5247420,(w=i,i=i+4|0,c[w>>2]=a[aq]<<24>>24,w)|0);c[M>>2]=1;c[P>>2]=1;dW(S,5247392);R=0;break}else if((x|0)==596){c[M>>2]=1;c[P>>2]=1;dW(S,5247492);R=0;break}}}while(0);if((x|0)==517){c[M>>2]=1;c[m+40>>2]=1;dW(m+44|0,5247748);R=0}aq=c[H>>2]|0;do{if(R){H=c[K>>2]|0;bv=c[L>>2]|0;c[N>>2]=0;c[N+4>>2]=0;c[N+8>>2]=0;bu=c[s>>2]|0;c[n>>2]=bu;c[bu>>2]=(c[bu>>2]|0)+1|0;c[n+4>>2]=c[B>>2]|0;c[n+8>>2]=c[C>>2]|0;c[n+12>>2]=aq;c[n+16>>2]=H;c[n+20>>2]=bv;c[n+24>>2]=0;c[n+28>>2]=0;bv=n+32|0;c[bv>>2]=c[N>>2]|0;c[bv+4>>2]=c[N+4>>2]|0;c[bv+8>>2]=c[N+8>>2]|0;bw=m+44|0}else{if((aq|0)!=0){j0(aq)}bv=c[M>>2]|0;H=c[m+40>>2]|0;bu=c[s>>2]|0;c[n>>2]=bu;c[bu>>2]=(c[bu>>2]|0)+1|0;c[n+4>>2]=c[B>>2]|0;c[n+8>>2]=c[C>>2]|0;c[n+12>>2]=0;c[n+16>>2]=2;c[n+20>>2]=0;c[n+24>>2]=bv;c[n+28>>2]=H;H=n+32|0;bv=m+44|0;if((a[bv]&1)<<24>>24==0){bu=H;c[bu>>2]=c[bv>>2]|0;c[bu+4>>2]=c[bv+4>>2]|0;c[bu+8>>2]=c[bv+8>>2]|0;bw=bv;break}bu=c[m+52>>2]|0;I=c[m+48>>2]|0;if((I|0)==-1){dZ()}do{if(I>>>0<11){a[H]=I<<1&255;bx=H+1|0}else{E=I+16&-16;bt=(E|0)==0?1:E;while(1){by=j$(bt)|0;if((by|0)!=0){x=655;break}aC=(D=c[1316362]|0,c[1316362]=D+0,D);if((aC|0)==0){break}b7[aC&1023]()}if((x|0)==655){c[n+40>>2]=by;c[H>>2]=E|1;c[n+36>>2]=I;bx=by;break}bt=bO(4)|0;c[bt>>2]=5257468;bg(bt|0,5262716,348)}}while(0);j9(bx,bu,I);a[bx+I|0]=0;bw=bv}}while(0);do{if((a[bw]&1)<<24>>24!=0){bx=c[m+52>>2]|0;if((bx|0)==0){break}j0(bx)}}while(0);m=c[s>>2]|0;bw=c[m>>2]|0;do{if((bw|0)==1){bx=c[C>>2]|0;if((bx|0)==0){c[m>>2]=0;x=665;break}else{j0(bx);bx=c[s>>2]|0;bz=bx;bA=c[bx>>2]|0;x=664;break}}else{bz=m;bA=bw;x=664}}while(0);do{if((x|0)==664){bw=bA-1|0;c[bz>>2]=bw;if((bw|0)==0){x=665;break}else{break}}}while(0);do{if((x|0)==665){bz=c[s>>2]|0;if((bz|0)==0){break}j0(bz)}}while(0);s=c[d>>2]|0;if((s|0)==1){j0(z);bB=c[d>>2]|0}else{bB=s}s=bB-1|0;c[d>>2]=s;if((s|0)==0){j0(y)}y=n+12|0;if((c[y>>2]|0)==0){s=c[p>>2]|0;d=n+32|0;if((a[d]&1)<<24>>24==0){bB=o;c[bB>>2]=c[d>>2]|0;c[bB+4>>2]=c[d+4>>2]|0;c[bB+8>>2]=c[d+8>>2]|0;bC=a[bB]|0;bD=bB}else{bB=c[n+40>>2]|0;d=c[n+36>>2]|0;if((d|0)==-1){dZ()}do{if(d>>>0<11){z=d<<1&255;bz=o;a[bz]=z;bG=o+1|0;bH=z;bI=bz}else{bz=d+16&-16;z=(bz|0)==0?1:bz;while(1){bJ=j$(z)|0;if((bJ|0)!=0){x=689;break}bA=(D=c[1316362]|0,c[1316362]=D+0,D);if((bA|0)==0){break}b7[bA&1023]()}if((x|0)==689){c[o+8>>2]=bJ;z=bz|1;c[o>>2]=z;c[o+4>>2]=d;bG=bJ;bH=z&255;bI=o;break}z=bO(4)|0;c[z>>2]=5257468;bg(z|0,5262716,348)}}while(0);j9(bG,bB,d);a[bG+d|0]=0;bC=bH;bD=bI}if((bC&1)<<24>>24==0){bK=o+1|0}else{bK=c[o+8>>2]|0}bF(s|0,5245744,(w=i,i=i+4|0,c[w>>2]=bK,w)|0);do{if((a[bD]&1)<<24>>24!=0){bK=c[o+8>>2]|0;if((bK|0)==0){break}j0(bK)}}while(0);bE()}o=c[n+20>>2]|0;bD=n+8|0;bK=c[bD>>2]|0;c[q>>2]=c[n+16>>2]|0;c[q+4>>2]=o;c[q+8>>2]=bK;cz(b,q);q=c[y>>2]|0;if((q|0)!=0){j0(q)}do{if((a[n+32|0]&1)<<24>>24!=0){q=c[n+40>>2]|0;if((q|0)==0){break}j0(q)}}while(0);q=n|0;n=c[q>>2]|0;y=c[n>>2]|0;do{if((y|0)==1){b=c[bD>>2]|0;if((b|0)==0){c[n>>2]=0;break}else{j0(b);b=c[q>>2]|0;bL=b;bM=c[b>>2]|0;x=707;break}}else{bL=n;bM=y;x=707}}while(0);do{if((x|0)==707){y=bM-1|0;c[bL>>2]=y;if((y|0)==0){break}j0(v);i=e;return}}while(0);bL=c[q>>2]|0;if((bL|0)==0){j0(v);i=e;return}j0(bL);j0(v);i=e;return}function cB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=d+24|0;g=c[f>>2]|0;h=e;i=g-h>>2;j=d+32|0;L862:do{if(g>>>0>e>>>0){d=c[j>>2]|0;k=h-(d+((i^-1)<<2)|0)>>2;l=g;m=d;while(1){d=l-4|0;c[f>>2]=d;n=(c[d>>2]|0)+k|0;d=m-4|0;c[j>>2]=d;c[d>>2]=n;n=c[f>>2]|0;if(n>>>0<=e>>>0){break L862}l=n;m=c[j>>2]|0}}}while(0);e=(c[j>>2]|0)-4|0;c[j>>2]=e;c[e>>2]=i;a[b|0]=1;c[b+4>>2]=6;return}function cC(a,b){a=a|0;b=b|0;var d=0,e=0;bl(5242924);if((a|0)<2){cF(5248736);cF(5248584);cF(5248504);cF(5248248);cF(5248044);return 0}else{d=1;while(1){cF(c[b+(d<<2)>>2]|0);e=d+1|0;if((e|0)==(a|0)){break}else{d=e}}return 0}return 0}function cD(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;f=i;i=i+24|0;g=f|0;h=f+4|0;j=f+12|0;k=f+16|0;if((e|0)==0){l=d+32|0;m=(c[l>>2]|0)-8|0;c[l>>2]=m;n=m}else{n=e}e=d+20|0;m=(c[e>>2]|0)+1|0;c[e>>2]=m;l=d+8|0;o=m-(c[l>>2]|0)|0;p=d+12|0;q=c[p>>2]|0;L879:do{if(m>>>0<q>>>0){r=m;while(1){s=a[r]|0;if((s&255)<32){t=730;break}u=s<<24>>24;if((u|0)==34){t=732;break}else if((u|0)==92){t=733;break}u=r+1|0;c[e>>2]=u;if(u>>>0<q>>>0){r=u}else{break L879}}if((t|0)==732){c[n>>2]=o;c[n+4>>2]=(c[e>>2]|0)-(c[l>>2]|0)|0;c[e>>2]=(c[e>>2]|0)+1|0;a[b|0]=1;c[b+4>>2]=5;i=f;return}else if((t|0)==730){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247144);a[b|0]=0;i=f;return}else if((t|0)==733){u=h|0;L890:do{if(r>>>0<q>>>0){v=k;w=h;x=r;y=q;z=r;A=s;L892:while(1){if(A<<24>>24<32){t=737;break}B=A<<24>>24;do{if((B|0)==34){t=739;break L892}else if((B|0)==92){C=x+1|0;c[e>>2]=C;if(C>>>0>=y>>>0){t=741;break L892}D=a[C]<<24>>24;if((D|0)==92){E=92}else if((D|0)==98){E=8}else if((D|0)==102){E=12}else if((D|0)==116){E=9}else if((D|0)==34){E=34}else if((D|0)==47){E=47}else if((D|0)==117){C=x+2|0;c[e>>2]=C;if((y-C|0)<=3){t=754;break L892}c[g>>2]=0;cL(h,d,g);if((a[u]&1)<<24>>24==0){t=756;break L892}C=c[g>>2]|0;if((C-55296|0)>>>0<1024){F=c[e>>2]|0;if(((c[p>>2]|0)-F|0)<=5){t=759;break L892}if(a[F]<<24>>24!=92){t=762;break L892}if(a[F+1|0]<<24>>24!=117){t=762;break L892}c[e>>2]=F+2|0;c[j>>2]=0;cL(k,d,j);G=c[v>>2]|0;H=c[v+4>>2]|0;c[w>>2]=G;c[w+4>>2]=H;if((G&1|0)==0&(H&0|0)==0){t=764;break L892}F=(c[j>>2]|0)-56320|0;if(F>>>0>1023){t=766;break L892}I=((C<<10)-56623104|F)+65536|0;c[g>>2]=I;J=I}else{J=C}if(J>>>0<128){a[z]=J&255;K=z+1|0;break}if(J>>>0<2048){a[z]=(J>>>6|192)&255;a[z+1|0]=(J&63|128)&255;K=z+2|0;break}if(J>>>0<65536){a[z]=(J>>>12|224)&255;a[z+1|0]=(J>>>6&63|128)&255;a[z+2|0]=(J&63|128)&255;K=z+3|0;break}if(J>>>0>=2097152){bS(5247316,950,5249884,5246888)}a[z]=(J>>>18|240)&255;a[z+1|0]=(J>>>12&63|128)&255;a[z+2|0]=(J>>>6&63|128)&255;a[z+3|0]=(J&63|128)&255;K=z+4|0;break}else if((D|0)==110){E=10}else if((D|0)==114){E=13}else{t=777;break L892}a[z]=E;c[e>>2]=(c[e>>2]|0)+1|0;K=z+1|0}else{c[e>>2]=x+1|0;a[z]=a[x]|0;K=z+1|0}}while(0);B=c[e>>2]|0;D=c[p>>2]|0;if(B>>>0>=D>>>0){break L890}x=B;y=D;z=K;A=a[B]|0}if((t|0)==762){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247028);a[b|0]=0;i=f;return}else if((t|0)==759){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247088);a[b|0]=0;i=f;return}else if((t|0)==764){A=b;c[A>>2]=G;c[A+4>>2]=H;i=f;return}else if((t|0)==737){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247144);a[b|0]=0;i=f;return}else if((t|0)==739){c[n>>2]=o;c[n+4>>2]=z-(c[l>>2]|0)|0;c[e>>2]=(c[e>>2]|0)+1|0;a[b|0]=1;c[b+4>>2]=5;i=f;return}else if((t|0)==766){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5246952);a[b|0]=0;i=f;return}else if((t|0)==754){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247492);a[b|0]=0;i=f;return}else if((t|0)==777){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5246912);a[b|0]=0;i=f;return}else if((t|0)==741){c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247492);a[b|0]=0;i=f;return}else if((t|0)==756){A=b;y=c[w+4>>2]|0;c[A>>2]=c[w>>2]|0;c[A+4>>2]=y;i=f;return}}}while(0);c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247492);a[b|0]=0;i=f;return}}}while(0);c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5247492);a[b|0]=0;i=f;return}function cE(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=i;i=i+4|0;g=f|0;h=d+24|0;j=e;k=(c[h>>2]|0)-j>>2;l=(k|0)/3&-1;m=e;c[g>>2]=c[d+8>>2]|0;cG(m,m+(l*12&-1)|0,g);g=d+32|0;if((k+2|0)>>>0<5){n=c[g>>2]|0;o=n-4|0;c[g>>2]=o;c[o>>2]=l;p=b|0;a[p]=1;q=b+4|0;c[q>>2]=7;i=f;return}k=c[g>>2]|0;d=j-(k+((l*-3&-1)-1<<2)|0)>>2;j=l;m=k;while(1){k=j-1|0;e=(c[h>>2]|0)-4|0;c[h>>2]=e;r=(c[e>>2]|0)+d|0;e=m-4|0;c[g>>2]=e;c[e>>2]=r;r=(c[h>>2]|0)-4|0;c[h>>2]=r;e=c[r>>2]|0;r=(c[g>>2]|0)-4|0;c[g>>2]=r;c[r>>2]=e;e=(c[h>>2]|0)-4|0;c[h>>2]=e;r=c[e>>2]|0;e=(c[g>>2]|0)-4|0;c[g>>2]=e;c[e>>2]=r;if((k|0)==0){break}j=k;m=c[g>>2]|0}n=c[g>>2]|0;o=n-4|0;c[g>>2]=o;c[o>>2]=l;p=b|0;a[p]=1;q=b+4|0;c[q>>2]=7;i=f;return}function cF(b){b=b|0;var d=0,e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0.0,z=0,A=0,B=0,C=0,E=0,F=0;d=i;i=i+108|0;e=d|0;f=d+12|0;g=d+60|0;j=bj(b|0,5244988)|0;if((j|0)==0){l=c[p>>2]|0;bF(l|0,5247836,(w=i,i=i+4|0,c[w>>2]=b,w)|0);a$(1)}bM(j|0,0,2);l=a_(j|0)|0;L970:do{if((l|0)==0){m=0}else{if((l|0)<0){h_()}while(1){n=j$(l)|0;if((n|0)!=0){o=l;r=n;break}s=(D=c[1316362]|0,c[1316362]=D+0,D);if((s|0)==0){t=814;break}b7[s&1023]()}if((t|0)==814){s=bO(4)|0;c[s>>2]=5257468;bg(s|0,5262716,348)}while(1){if((r|0)==0){u=0}else{a[r]=0;u=r}s=o-1|0;if((s|0)==0){m=n;break L970}else{o=s;r=u+1|0}}}}while(0);bM(j|0,0,0);bD(m|0,1,l|0,j|0);ar(j|0);c[e>>2]=b;j=e+4|0;c[j>>2]=l;l=e+8|0;c[l>>2]=m;kb(f|0,0,48);u=g;kb(u|0,0,48);cA(f,e);r=aX()|0;o=r+1e3|0;n=0;while(1){cA(g,e);v=n+1|0;x=aX()|0;if(x>>>0<o>>>0){n=v}else{break}}y=+((x-r|0)>>>0>>>0)/1.0e3;bh(5247784,(w=i,i=i+28|0,c[w>>2]=5245084,c[w+4>>2]=b,h[k>>3]=y,c[w+8>>2]=c[k>>2]|0,c[w+12>>2]=c[k+4>>2]|0,c[w+16>>2]=v,h[k>>3]=y/+(v|0),c[w+20>>2]=c[k>>2]|0,c[w+24>>2]=c[k+4>>2]|0,w)|0);aw(c[q>>2]|0);kb(u|0,0,48);cu(f,e);v=aX()|0;r=v+1e3|0;x=0;while(1){cu(g,e);z=x+1|0;A=aX()|0;if(A>>>0<r>>>0){x=z}else{break}}y=+((A-v|0)>>>0>>>0)/1.0e3;bh(5247784,(w=i,i=i+28|0,c[w>>2]=5244436,c[w+4>>2]=b,h[k>>3]=y,c[w+8>>2]=c[k>>2]|0,c[w+12>>2]=c[k+4>>2]|0,c[w+16>>2]=z,h[k>>3]=y/+(z|0),c[w+20>>2]=c[k>>2]|0,c[w+24>>2]=c[k+4>>2]|0,w)|0);aw(c[q>>2]|0);kb(u|0,0,48);cx(f,e);z=aX()|0;v=z+1e3|0;A=0;while(1){cx(g,e);B=A+1|0;C=aX()|0;if(C>>>0<v>>>0){A=B}else{break}}y=+((C-z|0)>>>0>>>0)/1.0e3;bh(5247784,(w=i,i=i+28|0,c[w>>2]=5243956,c[w+4>>2]=b,h[k>>3]=y,c[w+8>>2]=c[k>>2]|0,c[w+12>>2]=c[k+4>>2]|0,c[w+16>>2]=B,h[k>>3]=y/+(B|0),c[w+20>>2]=c[k>>2]|0,c[w+24>>2]=c[k+4>>2]|0,w)|0);aw(c[q>>2]|0);kb(u|0,0,48);u=c[j>>2]|0;j=c[l>>2]|0;cy(f,u,j);f=aX()|0;l=f+1e3|0;B=0;while(1){cy(g,u,j);E=B+1|0;F=aX()|0;if(F>>>0<l>>>0){B=E}else{break}}y=+((F-f|0)>>>0>>>0)/1.0e3;bh(5247784,(w=i,i=i+28|0,c[w>>2]=5248900,c[w+4>>2]=b,h[k>>3]=y,c[w+8>>2]=c[k>>2]|0,c[w+12>>2]=c[k+4>>2]|0,c[w+16>>2]=E,h[k>>3]=y/+(E|0),c[w+20>>2]=c[k>>2]|0,c[w+24>>2]=c[k+4>>2]|0,w)|0);aw(c[q>>2]|0);if((m|0)==0){i=d;return}j0(m);i=d;return}function cG(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0;e=i;i=i+72|0;f=e+60|0;g=e|0;h=d|0;j=e+12|0;k=e+36|0;l=e+48|0;m=e+24|0;n=a;a=b;L1004:while(1){b=a;o=a-12|0;p=a-24|0;q=a-12+4|0;r=o|0;s=o;t=n;L1006:while(1){u=t;v=b-u|0;w=(v|0)/12&-1;if((w|0)==0|(w|0)==1){x=924;break L1004}else if((w|0)==2){x=836;break L1004}else if((w|0)==5){x=842;break L1004}else if((w|0)==4){x=841;break L1004}else if((w|0)==3){x=840;break L1004}if((v|0)<372){x=844;break L1004}w=(v|0)/24&-1;y=t+(w*12&-1)|0;if((v|0)>11988){z=(v|0)/48&-1;A=cJ(t,t+(z*12&-1)|0,y,t+((z+w|0)*12&-1)|0,o,d)|0}else{A=cH(t,y,o,d)|0}z=t+4|0;v=t|0;B=c[v>>2]|0;C=(c[z>>2]|0)-B|0;D=c[y>>2]|0;E=(c[t+(w*12&-1)+4>>2]|0)-D|0;L1014:do{if(C>>>0<E>>>0){F=o;G=A}else{if(C>>>0<=E>>>0){w=c[h>>2]|0;if((ka(w+B|0,w+D|0,C)|0)<0){F=o;G=A;break}}L1019:do{if((t|0)!=(p|0)){w=o;H=p;while(1){I=c[H>>2]|0;J=(c[w-12+4>>2]|0)-I|0;if(J>>>0<E>>>0){break}if(J>>>0<=E>>>0){K=c[h>>2]|0;if((ka(K+I|0,K+D|0,J)|0)<0){break}}J=H-12|0;if((t|0)==(J|0)){break L1019}else{w=H;H=J}}w=t;c[m>>2]=c[w>>2]|0;c[m+4>>2]=c[w+4>>2]|0;c[m+8>>2]=c[w+8>>2]|0;J=H;c[w>>2]=c[J>>2]|0;c[w+4>>2]=c[J+4>>2]|0;c[w+8>>2]=c[J+8>>2]|0;c[J>>2]=c[m>>2]|0;c[J+4>>2]=c[m+4>>2]|0;c[J+8>>2]=c[m+8>>2]|0;F=H;G=A+1|0;break L1014}}while(0);J=t+12|0;w=c[r>>2]|0;K=(c[q>>2]|0)-w|0;do{if(C>>>0<K>>>0){L=J}else{if(C>>>0<=K>>>0){I=c[h>>2]|0;if((ka(I+B|0,I+w|0,C)|0)<0){L=J;break}}if((J|0)==(o|0)){x=920;break L1004}else{M=J}while(1){I=c[M>>2]|0;N=(c[M+4>>2]|0)-I|0;if(C>>>0<N>>>0){break}if(C>>>0<=N>>>0){N=c[h>>2]|0;if((ka(N+B|0,N+I|0,C)|0)<0){break}}I=M+12|0;if((I|0)==(o|0)){x=921;break L1004}else{M=I}}H=M;c[l>>2]=c[H>>2]|0;c[l+4>>2]=c[H+4>>2]|0;c[l+8>>2]=c[H+8>>2]|0;c[H>>2]=c[s>>2]|0;c[H+4>>2]=c[s+4>>2]|0;c[H+8>>2]=c[s+8>>2]|0;c[s>>2]=c[l>>2]|0;c[s+4>>2]=c[l+4>>2]|0;c[s+8>>2]=c[l+8>>2]|0;L=M+12|0}}while(0);if((L|0)==(o|0)){x=922;break L1004}else{O=o;P=L}while(1){J=c[v>>2]|0;w=(c[z>>2]|0)-J|0;K=c[P>>2]|0;H=(c[P+4>>2]|0)-K|0;L1043:do{if(w>>>0<H>>>0){Q=P}else{I=P;N=K;R=H;while(1){if(w>>>0<=R>>>0){S=c[h>>2]|0;if((ka(S+J|0,S+N|0,w)|0)<0){Q=I;break L1043}}S=I+12|0;T=c[S>>2]|0;U=(c[I+16>>2]|0)-T|0;if(w>>>0<U>>>0){Q=S;break L1043}else{I=S;N=T;R=U}}}}while(0);H=O;while(1){V=H-12|0;K=c[V>>2]|0;R=(c[H-12+4>>2]|0)-K|0;if(w>>>0<R>>>0){H=V;continue}if(w>>>0>R>>>0){break}R=c[h>>2]|0;if((ka(R+J|0,R+K|0,w)|0)<0){H=V}else{break}}if(Q>>>0>=V>>>0){t=Q;continue L1006}H=Q;c[k>>2]=c[H>>2]|0;c[k+4>>2]=c[H+4>>2]|0;c[k+8>>2]=c[H+8>>2]|0;w=V;c[H>>2]=c[w>>2]|0;c[H+4>>2]=c[w+4>>2]|0;c[H+8>>2]=c[w+8>>2]|0;c[w>>2]=c[k>>2]|0;c[w+4>>2]=c[k+4>>2]|0;c[w+8>>2]=c[k+8>>2]|0;O=V;P=Q+12|0}}}while(0);z=t+12|0;L1057:do{if(z>>>0<F>>>0){v=F;C=z;B=G;D=y;while(1){E=c[D>>2]|0;w=(c[D+4>>2]|0)-E|0;H=C;while(1){J=c[H>>2]|0;K=(c[H+4>>2]|0)-J|0;if(K>>>0>=w>>>0){if(K>>>0>w>>>0){break}R=c[h>>2]|0;if((ka(R+J|0,R+E|0,K)|0)>=0){break}}H=H+12|0}K=v-12|0;R=c[K>>2]|0;J=(c[v-12+4>>2]|0)-R|0;L1067:do{if(J>>>0<w>>>0){W=K}else{N=K;I=R;U=J;while(1){if(U>>>0<=w>>>0){T=c[h>>2]|0;if((ka(T+I|0,T+E|0,U)|0)<0){W=N;break L1067}}T=N-12|0;S=c[T>>2]|0;X=(c[N-12+4>>2]|0)-S|0;if(X>>>0<w>>>0){W=T;break L1067}else{N=T;I=S;U=X}}}}while(0);if(H>>>0>W>>>0){Y=H;Z=B;_=D;break L1057}w=H;c[j>>2]=c[w>>2]|0;c[j+4>>2]=c[w+4>>2]|0;c[j+8>>2]=c[w+8>>2]|0;E=W;c[w>>2]=c[E>>2]|0;c[w+4>>2]=c[E+4>>2]|0;c[w+8>>2]=c[E+8>>2]|0;c[E>>2]=c[j>>2]|0;c[E+4>>2]=c[j+4>>2]|0;c[E+8>>2]=c[j+8>>2]|0;v=W;C=H+12|0;B=B+1|0;D=(D|0)==(H|0)?W:D}}else{Y=z;Z=G;_=y}}while(0);do{if((Y|0)==(_|0)){$=Z}else{y=c[_>>2]|0;z=(c[_+4>>2]|0)-y|0;D=c[Y>>2]|0;B=(c[Y+4>>2]|0)-D|0;if(z>>>0>=B>>>0){if(z>>>0>B>>>0){$=Z;break}B=c[h>>2]|0;if((ka(B+y|0,B+D|0,z)|0)>=0){$=Z;break}}z=Y;c[g>>2]=c[z>>2]|0;c[g+4>>2]=c[z+4>>2]|0;c[g+8>>2]=c[z+8>>2]|0;D=_;c[z>>2]=c[D>>2]|0;c[z+4>>2]=c[D+4>>2]|0;c[z+8>>2]=c[D+8>>2]|0;c[D>>2]=c[g>>2]|0;c[D+4>>2]=c[g+4>>2]|0;c[D+8>>2]=c[g+8>>2]|0;$=Z+1|0}}while(0);if(($|0)==0){aa=cK(t,Y,d)|0;D=Y+12|0;if(cK(D,a,d)|0){x=906;break}if(aa){t=D;continue}}D=Y;if((D-u|0)>=(b-D|0)){x=910;break}cG(t,Y,d);t=Y+12|0}if((x|0)==910){x=0;cG(Y+12|0,a,d);n=t;a=Y;continue}else if((x|0)==906){x=0;if(aa){x=916;break}else{n=t;a=Y;continue}}}if((x|0)==916){i=e;return}else if((x|0)==920){i=e;return}else if((x|0)==921){i=e;return}else if((x|0)==922){i=e;return}else if((x|0)==924){i=e;return}else if((x|0)==836){Y=c[r>>2]|0;r=(c[q>>2]|0)-Y|0;q=c[t>>2]|0;n=(c[t+4>>2]|0)-q|0;do{if(r>>>0>=n>>>0){if(r>>>0>n>>>0){i=e;return}aa=c[h>>2]|0;if((ka(aa+Y|0,aa+q|0,r)|0)<0){break}i=e;return}}while(0);r=f;f=t;c[r>>2]=c[f>>2]|0;c[r+4>>2]=c[f+4>>2]|0;c[r+8>>2]=c[f+8>>2]|0;c[f>>2]=c[s>>2]|0;c[f+4>>2]=c[s+4>>2]|0;c[f+8>>2]=c[s+8>>2]|0;c[s>>2]=c[r>>2]|0;c[s+4>>2]=c[r+4>>2]|0;c[s+8>>2]=c[r+8>>2]|0;i=e;return}else if((x|0)==844){r=t+24|0;cH(t,t+12|0,r,d);s=t+36|0;if((s|0)==(a|0)){i=e;return}else{ab=r;ac=s}while(1){s=c[ac+4>>2]|0;r=c[ac>>2]|0;f=s-r|0;q=c[ab>>2]|0;Y=(c[ab+4>>2]|0)-q|0;do{if(f>>>0<Y>>>0){x=848}else{if(f>>>0>Y>>>0){break}n=c[h>>2]|0;if((ka(n+r|0,n+q|0,f)|0)<0){x=848;break}else{break}}}while(0);if((x|0)==848){x=0;q=c[ac+8>>2]|0;Y=ac;n=ab;c[Y>>2]=c[n>>2]|0;c[Y+4>>2]=c[n+4>>2]|0;c[Y+8>>2]=c[n+8>>2]|0;L1116:do{if((ab|0)==(t|0)){ad=t}else{n=ab;while(1){Y=n-12|0;aa=c[Y>>2]|0;$=(c[n-12+4>>2]|0)-aa|0;if(f>>>0>=$>>>0){if(f>>>0>$>>>0){ad=n;break L1116}$=c[h>>2]|0;if((ka($+r|0,$+aa|0,f)|0)>=0){ad=n;break L1116}}aa=n;$=Y;c[aa>>2]=c[$>>2]|0;c[aa+4>>2]=c[$+4>>2]|0;c[aa+8>>2]=c[$+8>>2]|0;if((Y|0)==(t|0)){ad=t;break L1116}else{n=Y}}}}while(0);c[ad>>2]=r;c[ad+4>>2]=s;c[ad+8>>2]=q}f=ac+12|0;if((f|0)==(a|0)){break}else{ab=ac;ac=f}}i=e;return}else if((x|0)==842){cJ(t,t+12|0,t+24|0,t+36|0,o,d);i=e;return}else if((x|0)==841){cI(t,t+12|0,t+24|0,o,d);i=e;return}else if((x|0)==840){cH(t,t+12|0,o,d);i=e;return}}function cH(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+60|0;g=f|0;h=f+12|0;j=f+24|0;k=f+36|0;l=f+48|0;m=b+4|0;n=b|0;o=c[n>>2]|0;p=(c[m>>2]|0)-o|0;q=a+4|0;r=a|0;s=c[r>>2]|0;t=(c[q>>2]|0)-s|0;do{if(p>>>0<t>>>0){u=1}else{if(p>>>0>t>>>0){u=0;break}v=c[e>>2]|0;u=(ka(v+o|0,v+s|0,p)|0)<0}}while(0);s=d+4|0;t=d|0;v=c[t>>2]|0;w=(c[s>>2]|0)-v|0;do{if(w>>>0<p>>>0){x=1}else{if(w>>>0>p>>>0){x=0;break}y=c[e>>2]|0;x=(ka(y+v|0,y+o|0,w)|0)<0}}while(0);if(!u){if(!x){z=0;i=f;return z|0}u=l;l=b;c[u>>2]=c[l>>2]|0;c[u+4>>2]=c[l+4>>2]|0;c[u+8>>2]=c[l+8>>2]|0;w=d;c[l>>2]=c[w>>2]|0;c[l+4>>2]=c[w+4>>2]|0;c[l+8>>2]=c[w+8>>2]|0;c[w>>2]=c[u>>2]|0;c[w+4>>2]=c[u+4>>2]|0;c[w+8>>2]=c[u+8>>2]|0;u=c[n>>2]|0;w=(c[m>>2]|0)-u|0;o=c[r>>2]|0;r=(c[q>>2]|0)-o|0;do{if(w>>>0>=r>>>0){if(w>>>0>r>>>0){z=1;i=f;return z|0}q=c[e>>2]|0;if((ka(q+u|0,q+o|0,w)|0)<0){break}else{z=1}i=f;return z|0}}while(0);w=j;j=a;c[w>>2]=c[j>>2]|0;c[w+4>>2]=c[j+4>>2]|0;c[w+8>>2]=c[j+8>>2]|0;c[j>>2]=c[l>>2]|0;c[j+4>>2]=c[l+4>>2]|0;c[j+8>>2]=c[l+8>>2]|0;c[l>>2]=c[w>>2]|0;c[l+4>>2]=c[w+4>>2]|0;c[l+8>>2]=c[w+8>>2]|0;z=2;i=f;return z|0}if(x){x=g;g=a;c[x>>2]=c[g>>2]|0;c[x+4>>2]=c[g+4>>2]|0;c[x+8>>2]=c[g+8>>2]|0;w=d;c[g>>2]=c[w>>2]|0;c[g+4>>2]=c[w+4>>2]|0;c[g+8>>2]=c[w+8>>2]|0;c[w>>2]=c[x>>2]|0;c[w+4>>2]=c[x+4>>2]|0;c[w+8>>2]=c[x+8>>2]|0;z=1;i=f;return z|0}x=h;h=a;c[x>>2]=c[h>>2]|0;c[x+4>>2]=c[h+4>>2]|0;c[x+8>>2]=c[h+8>>2]|0;a=b;c[h>>2]=c[a>>2]|0;c[h+4>>2]=c[a+4>>2]|0;c[h+8>>2]=c[a+8>>2]|0;c[a>>2]=c[x>>2]|0;c[a+4>>2]=c[x+4>>2]|0;c[a+8>>2]=c[x+8>>2]|0;x=c[t>>2]|0;t=(c[s>>2]|0)-x|0;s=c[n>>2]|0;n=(c[m>>2]|0)-s|0;do{if(t>>>0>=n>>>0){if(t>>>0>n>>>0){z=1;i=f;return z|0}m=c[e>>2]|0;if((ka(m+x|0,m+s|0,t)|0)<0){break}else{z=1}i=f;return z|0}}while(0);t=k;c[t>>2]=c[a>>2]|0;c[t+4>>2]=c[a+4>>2]|0;c[t+8>>2]=c[a+8>>2]|0;k=d;c[a>>2]=c[k>>2]|0;c[a+4>>2]=c[k+4>>2]|0;c[a+8>>2]=c[k+8>>2]|0;c[k>>2]=c[t>>2]|0;c[k+4>>2]=c[t+4>>2]|0;c[k+8>>2]=c[t+8>>2]|0;z=2;i=f;return z|0}function cI(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;g=i;i=i+36|0;h=g|0;j=g+12|0;k=g+24|0;l=cH(a,b,d,f)|0;m=c[e>>2]|0;n=(c[e+4>>2]|0)-m|0;o=d+4|0;p=d|0;q=c[p>>2]|0;r=(c[o>>2]|0)-q|0;do{if(n>>>0>=r>>>0){if(n>>>0>r>>>0){s=l;i=g;return s|0}t=c[f>>2]|0;if((ka(t+m|0,t+q|0,n)|0)<0){break}else{s=l}i=g;return s|0}}while(0);n=k;k=d;c[n>>2]=c[k>>2]|0;c[n+4>>2]=c[k+4>>2]|0;c[n+8>>2]=c[k+8>>2]|0;d=e;c[k>>2]=c[d>>2]|0;c[k+4>>2]=c[d+4>>2]|0;c[k+8>>2]=c[d+8>>2]|0;c[d>>2]=c[n>>2]|0;c[d+4>>2]=c[n+4>>2]|0;c[d+8>>2]=c[n+8>>2]|0;n=l+1|0;d=c[p>>2]|0;p=(c[o>>2]|0)-d|0;o=b+4|0;e=b|0;q=c[e>>2]|0;m=(c[o>>2]|0)-q|0;do{if(p>>>0>=m>>>0){if(p>>>0>m>>>0){s=n;i=g;return s|0}r=c[f>>2]|0;if((ka(r+d|0,r+q|0,p)|0)<0){break}else{s=n}i=g;return s|0}}while(0);n=h;h=b;c[n>>2]=c[h>>2]|0;c[n+4>>2]=c[h+4>>2]|0;c[n+8>>2]=c[h+8>>2]|0;c[h>>2]=c[k>>2]|0;c[h+4>>2]=c[k+4>>2]|0;c[h+8>>2]=c[k+8>>2]|0;c[k>>2]=c[n>>2]|0;c[k+4>>2]=c[n+4>>2]|0;c[k+8>>2]=c[n+8>>2]|0;n=l+2|0;k=c[e>>2]|0;e=(c[o>>2]|0)-k|0;o=c[a>>2]|0;b=(c[a+4>>2]|0)-o|0;do{if(e>>>0>=b>>>0){if(e>>>0>b>>>0){s=n;i=g;return s|0}p=c[f>>2]|0;if((ka(p+k|0,p+o|0,e)|0)<0){break}else{s=n}i=g;return s|0}}while(0);n=j;j=a;c[n>>2]=c[j>>2]|0;c[n+4>>2]=c[j+4>>2]|0;c[n+8>>2]=c[j+8>>2]|0;c[j>>2]=c[h>>2]|0;c[j+4>>2]=c[h+4>>2]|0;c[j+8>>2]=c[h+8>>2]|0;c[h>>2]=c[n>>2]|0;c[h+4>>2]=c[n+4>>2]|0;c[h+8>>2]=c[n+8>>2]|0;s=l+3|0;i=g;return s|0}function cJ(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;h=i;i=i+48|0;j=h|0;k=h+12|0;l=h+24|0;m=h+36|0;n=cI(a,b,d,e,g)|0;o=c[f>>2]|0;p=(c[f+4>>2]|0)-o|0;q=e+4|0;r=e|0;s=c[r>>2]|0;t=(c[q>>2]|0)-s|0;do{if(p>>>0>=t>>>0){if(p>>>0>t>>>0){u=n;i=h;return u|0}v=c[g>>2]|0;if((ka(v+o|0,v+s|0,p)|0)<0){break}else{u=n}i=h;return u|0}}while(0);p=m;m=e;c[p>>2]=c[m>>2]|0;c[p+4>>2]=c[m+4>>2]|0;c[p+8>>2]=c[m+8>>2]|0;e=f;c[m>>2]=c[e>>2]|0;c[m+4>>2]=c[e+4>>2]|0;c[m+8>>2]=c[e+8>>2]|0;c[e>>2]=c[p>>2]|0;c[e+4>>2]=c[p+4>>2]|0;c[e+8>>2]=c[p+8>>2]|0;p=n+1|0;e=c[r>>2]|0;r=(c[q>>2]|0)-e|0;q=d+4|0;f=d|0;s=c[f>>2]|0;o=(c[q>>2]|0)-s|0;do{if(r>>>0>=o>>>0){if(r>>>0>o>>>0){u=p;i=h;return u|0}t=c[g>>2]|0;if((ka(t+e|0,t+s|0,r)|0)<0){break}else{u=p}i=h;return u|0}}while(0);p=k;k=d;c[p>>2]=c[k>>2]|0;c[p+4>>2]=c[k+4>>2]|0;c[p+8>>2]=c[k+8>>2]|0;c[k>>2]=c[m>>2]|0;c[k+4>>2]=c[m+4>>2]|0;c[k+8>>2]=c[m+8>>2]|0;c[m>>2]=c[p>>2]|0;c[m+4>>2]=c[p+4>>2]|0;c[m+8>>2]=c[p+8>>2]|0;p=n+2|0;m=c[f>>2]|0;f=(c[q>>2]|0)-m|0;q=b+4|0;d=b|0;r=c[d>>2]|0;s=(c[q>>2]|0)-r|0;do{if(f>>>0>=s>>>0){if(f>>>0>s>>>0){u=p;i=h;return u|0}e=c[g>>2]|0;if((ka(e+m|0,e+r|0,f)|0)<0){break}else{u=p}i=h;return u|0}}while(0);p=j;j=b;c[p>>2]=c[j>>2]|0;c[p+4>>2]=c[j+4>>2]|0;c[p+8>>2]=c[j+8>>2]|0;c[j>>2]=c[k>>2]|0;c[j+4>>2]=c[k+4>>2]|0;c[j+8>>2]=c[k+8>>2]|0;c[k>>2]=c[p>>2]|0;c[k+4>>2]=c[p+4>>2]|0;c[k+8>>2]=c[p+8>>2]|0;p=n+3|0;k=c[d>>2]|0;d=(c[q>>2]|0)-k|0;q=c[a>>2]|0;b=(c[a+4>>2]|0)-q|0;do{if(d>>>0>=b>>>0){if(d>>>0>b>>>0){u=p;i=h;return u|0}f=c[g>>2]|0;if((ka(f+k|0,f+q|0,d)|0)<0){break}else{u=p}i=h;return u|0}}while(0);p=l;l=a;c[p>>2]=c[l>>2]|0;c[p+4>>2]=c[l+4>>2]|0;c[p+8>>2]=c[l+8>>2]|0;c[l>>2]=c[j>>2]|0;c[l+4>>2]=c[j+4>>2]|0;c[l+8>>2]=c[j+8>>2]|0;c[j>>2]=c[p>>2]|0;c[j+4>>2]=c[p+4>>2]|0;c[j+8>>2]=c[p+8>>2]|0;u=n+4|0;i=h;return u|0}function cK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=i;i=i+12|0;f=e|0;g=(b-a|0)/12&-1;if((g|0)==4){h=a+12|0;j=a+24|0;k=b-12|0;cI(a,h,j,k,d);k=1;i=e;return k|0}else if((g|0)==5){cJ(a,a+12|0,a+24|0,a+36|0,b-12|0,d);k=1;i=e;return k|0}else if((g|0)==0|(g|0)==1){k=1;i=e;return k|0}else if((g|0)==3){cH(a,a+12|0,b-12|0,d);k=1;i=e;return k|0}else if((g|0)==2){g=b-12|0;j=c[g>>2]|0;h=(c[b-12+4>>2]|0)-j|0;l=c[a>>2]|0;m=(c[a+4>>2]|0)-l|0;do{if(h>>>0>=m>>>0){if(h>>>0>m>>>0){k=1;i=e;return k|0}n=c[d>>2]|0;if((ka(n+j|0,n+l|0,h)|0)<0){break}else{k=1}i=e;return k|0}}while(0);h=f;f=a;c[h>>2]=c[f>>2]|0;c[h+4>>2]=c[f+4>>2]|0;c[h+8>>2]=c[f+8>>2]|0;l=g;c[f>>2]=c[l>>2]|0;c[f+4>>2]=c[l+4>>2]|0;c[f+8>>2]=c[l+8>>2]|0;c[l>>2]=c[h>>2]|0;c[l+4>>2]=c[h+4>>2]|0;c[l+8>>2]=c[h+8>>2]|0;k=1;i=e;return k|0}else{h=a+24|0;cH(a,a+12|0,h,d);l=a+36|0;if((l|0)==(b|0)){k=1;i=e;return k|0}f=d|0;d=h;h=0;g=l;while(1){l=c[g+4>>2]|0;j=c[g>>2]|0;m=l-j|0;n=c[d>>2]|0;o=(c[d+4>>2]|0)-n|0;do{if(m>>>0<o>>>0){p=1006}else{if(m>>>0>o>>>0){q=h;break}r=c[f>>2]|0;if((ka(r+j|0,r+n|0,m)|0)<0){p=1006;break}else{q=h;break}}}while(0);if((p|0)==1006){p=0;n=c[g+8>>2]|0;o=g;r=d;c[o>>2]=c[r>>2]|0;c[o+4>>2]=c[r+4>>2]|0;c[o+8>>2]=c[r+8>>2]|0;L1233:do{if((d|0)==(a|0)){s=a}else{r=d;while(1){o=r-12|0;t=c[o>>2]|0;u=(c[r-12+4>>2]|0)-t|0;if(m>>>0>=u>>>0){if(m>>>0>u>>>0){s=r;break L1233}u=c[f>>2]|0;if((ka(u+j|0,u+t|0,m)|0)>=0){s=r;break L1233}}t=r;u=o;c[t>>2]=c[u>>2]|0;c[t+4>>2]=c[u+4>>2]|0;c[t+8>>2]=c[u+8>>2]|0;if((o|0)==(a|0)){s=a;break L1233}else{r=o}}}}while(0);c[s>>2]=j;c[s+4>>2]=l;c[s+8>>2]=n;m=h+1|0;if((m|0)==8){break}else{q=m}}m=g+12|0;if((m|0)==(b|0)){k=1;p=1015;break}else{d=g;h=q;g=m}}if((p|0)==1015){i=e;return k|0}k=(g+12|0)==(b|0);i=e;return k|0}return 0}function cL(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=d+20|0;g=c[f>>2]|0;h=g+1|0;c[f>>2]=h;i=a[g]|0;j=i-48&255;do{if((j&255)<10){k=j;l=1031}else{if((i-97&255)<6){k=i-87&255;l=1031;break}if((i-65&255)>=6){break}k=i-55&255;l=1031;break}}while(0);L1269:do{if((l|0)==1031){i=k&255;j=g+2|0;c[f>>2]=j;m=a[h]|0;n=m-48&255;do{if((n&255)<10){o=n}else{if((m-97&255)<6){o=m-87&255;break}if((m-65&255)>=6){break L1269}o=m-55&255}}while(0);m=(o&255)+(i<<4)|0;n=g+3|0;c[f>>2]=n;p=a[j]|0;q=p-48&255;do{if((q&255)<10){r=q}else{if((p-97&255)<6){r=p-87&255;break}if((p-65&255)>=6){break L1269}r=p-55&255}}while(0);p=(r&255)+(m<<4)|0;c[f>>2]=g+4|0;q=a[n]|0;j=q-48&255;do{if((j&255)<10){s=j}else{if((q-97&255)<6){s=q-87&255;break}if((q-65&255)>=6){break L1269}s=q-55&255}}while(0);c[e>>2]=(s&255)+(p<<4)|0;a[b|0]=1;c[b+4>>2]=2;return}}while(0);c[d+36>>2]=1;c[d+40>>2]=1;dW(d+44|0,5246836);a[b|0]=0;return}function cM(a,b){a=a|0;b=b|0;var d=0,e=0;d=i;i=i+4|0;e=d|0;c[e>>2]=b;b=c[e>>2]|0;c[e>>2]=b+4|0;e=a+56|0;a=c[e>>2]|0;if((c[b>>2]|0)==0){c[e>>2]=a&-2;i=d;return}else{c[e>>2]=a|1;i=d;return}}function cN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;b=c[a+24>>2]|0;if((b|0)!=0){d=c[a+36>>2]|0;b0[c[d+8>>2]&1023](c[d+12>>2]|0,b)}b=c[a+20>>2]|0;if((b|0)==0){bS(5246768,66,5249512,5246020)}d=c[b+8>>2]|0;e=b+12|0;if((d|0)!=0){f=c[e>>2]|0;b0[c[f+8>>2]&1023](c[f+12>>2]|0,d)}d=c[e>>2]|0;b0[c[d+8>>2]&1023](c[d+12>>2]|0,b);b=a+8|0;d=c[b>>2]|0;if((d|0)==0){g=a+48|0;h=c[g>>2]|0;i=a+52|0;j=c[i>>2]|0;k=a;b0[h&1023](j,k);return}e=c[d+12>>2]|0;if((e|0)==0){bS(5246768,66,5249512,5246020)}f=c[e+8>>2]|0;l=e+12|0;if((f|0)!=0){m=c[l>>2]|0;b0[c[m+8>>2]&1023](c[m+12>>2]|0,f)}f=c[l>>2]|0;b0[c[f+8>>2]&1023](c[f+12>>2]|0,e);e=c[d+32>>2]|0;b0[c[e+8>>2]&1023](c[e+12>>2]|0,d);c[b>>2]=0;g=a+48|0;h=c[g>>2]|0;i=a+52|0;j=c[i>>2]|0;k=a;b0[h&1023](j,k);return}function cO(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0.0,ac=0,ad=0,ae=0;g=i;i=i+8|0;h=g|0;j=g+4|0;l=b+16|0;c[l>>2]=0;m=b+32|0;n=b+24|0;o=b+56|0;p=b+8|0;q=b+12|0;r=b|0;s=b+4|0;u=b+28|0;v=b+36|0;w=b+20|0;L1322:while(1){b=c[m>>2]|0;while(1){if((b|0)==0){bS(5245872,193,5249480,5245792);x=c[m>>2]|0}else{x=b}y=(c[n>>2]|0)+(x-1|0)|0;z=d[y]|0;if((z|0)==10){A=cV(c[p>>2]|0,e,f,l,h,j)|0;if((A|0)==4){B=1208;break}else if((A|0)==2){B=1207;break}else if((A|0)==3){C=0;B=1213;break L1322}else if((A|0)!=8){B=1209;break}A=c[r>>2]|0;do{if((A|0)!=0){D=c[A+40>>2]|0;if((D|0)==0){break}if((b2[D&1023](c[s>>2]|0)|0)==0){B=1205;break L1322}}}while(0);A=(c[m>>2]|0)-1|0;c[m>>2]=A;b=A;continue}else if((z|0)==4|(z|0)==8){A=cV(c[p>>2]|0,e,f,l,h,j)|0;if((A|0)==4){B=1166;break}else if((A|0)==3){C=0;B=1218;break L1322}else if((A|0)==12){B=1172;break}else if((A|0)==13){B=1167;break}else if((A|0)!=9){B=1165;break}A=c[m>>2]|0;if((A|0)==0){bS(5245872,399,5249480,5245792);E=c[m>>2]|0}else{E=A}A=c[n>>2]|0;if(a[A+(E-1|0)|0]<<24>>24!=4){G=E;H=A;B=1185;break}A=c[r>>2]|0;do{if((A|0)==0){I=E}else{D=c[A+32>>2]|0;if((D|0)==0){I=E;break}J=(b2[D&1023](c[s>>2]|0)|0)==0;K=c[m>>2]|0;if(J){B=1183;break L1322}else{I=K}}}while(0);A=I-1|0;c[m>>2]=A;b=A;continue}else if((z|0)==7){A=cV(c[p>>2]|0,e,f,l,h,j)|0;if((A|0)==2){B=1196;break}else if((A|0)==4){B=1197;break}else if((A|0)==3){C=0;B=1222;break L1322}else if((A|0)!=9){B=1198;break}A=c[r>>2]|0;do{if((A|0)!=0){J=c[A+32>>2]|0;if((J|0)==0){break}if((b2[J&1023](c[s>>2]|0)|0)==0){B=1194;break L1322}}}while(0);A=(c[m>>2]|0)-1|0;c[m>>2]=A;b=A;continue}else if((z|0)==0|(z|0)==12|(z|0)==6|(z|0)==11|(z|0)==9){A=cV(c[p>>2]|0,e,f,l,h,j)|0;if((A|0)==10){B=1110;break}else if((A|0)==4){B=1083;break}else if((A|0)==13){B=1088;break}else if((A|0)==7){B=1098;break}else if((A|0)==3){C=0;B=1226;break L1322}else if((A|0)==6){B=1102;break}else if((A|0)==5){B=1106;break}else if((A|0)==0){B=1094;break}else if((A|0)==1|(A|0)==2|(A|0)==9){B=1151;break}else if((A|0)==11){B=1129;break}else if((A|0)==12){B=1084;break}else if((A|0)!=8){B=1152;break}A=c[m>>2]|0;if((A|0)==0){bS(5245872,328,5249480,5245792);L=c[m>>2]|0}else{L=A}if(a[(c[n>>2]|0)+(L-1|0)|0]<<24>>24!=9){B=1151;break}A=c[r>>2]|0;do{if((A|0)==0){M=L}else{J=c[A+40>>2]|0;if((J|0)==0){M=L;break}D=(b2[J&1023](c[s>>2]|0)|0)==0;N=c[m>>2]|0;if(D){B=1149;break L1322}else{M=N}}}while(0);A=M-1|0;c[m>>2]=A;b=A;continue}else if((z|0)==3|(z|0)==2){C=2;B=1220;break L1322}else if((z|0)==5){B=1186;break}else if((z|0)==1){B=1076;break}else{B=1210;break L1322}}do{if((B|0)==1208){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=3;continue L1322}else if((B|0)==1209){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5244680;continue L1322}else if((B|0)==1207){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=11;continue L1322}else if((B|0)==1110){B=0;b=c[r>>2]|0;if((b|0)==0){O=0;B=1153;break}A=c[b+16>>2]|0;if((A|0)!=0){if((bY[A&1023](c[s>>2]|0,c[h>>2]|0,c[j>>2]|0)|0)==0){B=1113;break L1322}else{O=0;B=1153;break}}if((c[b+8>>2]|0)==0){O=0;B=1153;break}b=c[h>>2]|0;A=c[j>>2]|0;D=a[b]<<24>>24==45;J=D?b+1|0:b;P=a[J]<<24>>24==43?J+1|0:J;J=b+A|0;L1372:do{if(P>>>0<J>>>0){b=0;Q=0;R=P;while(1){S=214748364;if((b|0)>(S|0)|(b|0)==(S|0)&Q>>>0>-858993453>>>0){B=1117;break}S=(al(Q|0,b|0,10,0),c[k>>2]|0);T=c[k+4>>2]|0;U=(ak(-1|0,2147483647,S|0,T|0),c[k>>2]|0);V=c[k+4>>2]|0;W=(d[R]|0)-48|0;X=W;Y=(W|0)<0?-1:0;if((V|0)<(Y|0)|(V|0)==(Y|0)&U>>>0<X>>>0){B=1119;break}U=R+1|0;V=kf(X,Y,S,T);T=F;if(U>>>0<J>>>0){b=T;Q=V;R=U}else{Z=T;_=V;B=1121;break L1372}}if((B|0)==1117){B=0;c[bv()>>2]=34;$=D?-2147483648:2147483647;aa=D?0:-1;break}else if((B|0)==1119){B=0;c[bv()>>2]=34;$=D?-2147483648:2147483647;aa=D?0:-1;break}}else{Z=0;_=0;B=1121}}while(0);if((B|0)==1121){B=0;J=(al(_|0,Z|0,(D?-1:1)|0,(D?-1:0)|0),c[k>>2]|0);$=c[k+4>>2]|0;aa=J}J=kf(aa,$,1,-2147483648);P=F;z=0;do{if(P>>>0<z>>>0|P>>>0==z>>>0&J>>>0<2>>>0){if((c[bv()>>2]|0)!=34){break}a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245184;R=c[l>>2]|0;if(R>>>0<A>>>0){c[l>>2]=0;continue L1322}else{c[l>>2]=R-A|0;continue L1322}}}while(0);if((bY[c[(c[r>>2]|0)+8>>2]&1023](c[s>>2]|0,aa,$)|0)==0){B=1128;break L1322}else{O=0;B=1153;break}}else if((B|0)==1165){B=0;G=c[m>>2]|0;H=c[n>>2]|0;B=1185;break}else if((B|0)==1166){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=3;continue L1322}else if((B|0)==1083){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=3;continue L1322}else if((B|0)==1088){B=0;A=c[r>>2]|0;if((A|0)==0){O=0;B=1153;break}if((c[A+20>>2]|0)==0){O=0;B=1153;break}A=c[w>>2]|0;c[A+4>>2]=0;J=c[A+8>>2]|0;if((J|0)!=0){a[J]=0}cT(c[w>>2]|0,c[h>>2]|0,c[j>>2]|0);J=c[w>>2]|0;if((bY[c[(c[r>>2]|0)+20>>2]&1023](c[s>>2]|0,c[J+8>>2]|0,c[J+4>>2]|0)|0)==0){B=1093;break L1322}else{O=0;B=1153;break}}else if((B|0)==1196){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=8;continue L1322}else if((B|0)==1197){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=3;continue L1322}else if((B|0)==1198){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5244744;J=c[l>>2]|0;A=c[j>>2]|0;if(J>>>0<A>>>0){c[l>>2]=0;continue L1322}else{c[l>>2]=J-A|0;continue L1322}}else if((B|0)==1098){B=0;A=c[r>>2]|0;if((A|0)==0){O=0;B=1153;break}J=c[A>>2]|0;if((J|0)==0){O=0;B=1153;break}if((b2[J&1023](c[s>>2]|0)|0)==0){B=1101;break L1322}else{O=0;B=1153;break}}else if((B|0)==1186){B=0;J=cV(c[p>>2]|0,e,f,l,h,j)|0;if((J|0)==3){C=0;B=1227;break L1322}else if((J|0)==1){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=6;continue L1322}else if((J|0)==4){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=3;continue L1322}else{a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5244824;continue L1322}}else if((B|0)==1102){B=0;J=c[r>>2]|0;if((J|0)==0){O=4;B=1153;break}A=c[J+24>>2]|0;if((A|0)==0){O=4;B=1153;break}if((b2[A&1023](c[s>>2]|0)|0)==0){B=1105;break L1322}else{O=4;B=1153;break}}else if((B|0)==1076){B=0;A=c[o>>2]|0;if((A&8|0)!=0){a[y]=12;continue L1322}if((A&4|0)!=0){C=0;B=1225;break L1322}if((c[l>>2]|0)==(f|0)){C=0;B=1224;break L1322}if((cV(c[p>>2]|0,e,f,l,h,j)|0)==3){continue L1322}a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245332;continue L1322}else if((B|0)==1152){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5244992;continue L1322}else if((B|0)==1167){B=0;A=c[r>>2]|0;if((A|0)==0){break}if((c[A+28>>2]|0)==0){B=1172;break}A=c[w>>2]|0;c[A+4>>2]=0;J=c[A+8>>2]|0;if((J|0)!=0){a[J]=0}cT(c[w>>2]|0,c[h>>2]|0,c[j>>2]|0);J=c[w>>2]|0;c[h>>2]=c[J+8>>2]|0;c[j>>2]=c[J+4>>2]|0;B=1172;break}else if((B|0)==1106){B=0;J=c[r>>2]|0;if((J|0)==0){O=9;B=1153;break}A=c[J+36>>2]|0;if((A|0)==0){O=9;B=1153;break}if((b2[A&1023](c[s>>2]|0)|0)==0){B=1109;break L1322}else{O=9;B=1153;break}}else if((B|0)==1094){B=0;A=c[r>>2]|0;if((A|0)==0){O=0;B=1153;break}J=c[A+4>>2]|0;if((J|0)==0){O=0;B=1153;break}if((cc[J&1023](c[s>>2]|0,a[c[h>>2]|0]<<24>>24==116&1)|0)==0){B=1097;break L1322}else{O=0;B=1153;break}}else if((B|0)==1151){B=0;a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245040;continue L1322}else if((B|0)==1129){B=0;J=c[r>>2]|0;if((J|0)==0){O=0;B=1153;break}A=c[J+16>>2]|0;if((A|0)!=0){if((bY[A&1023](c[s>>2]|0,c[h>>2]|0,c[j>>2]|0)|0)==0){B=1132;break L1322}else{O=0;B=1153;break}}if((c[J+12>>2]|0)==0){O=0;B=1153;break}J=c[w>>2]|0;c[J+4>>2]=0;A=c[J+8>>2]|0;if((A|0)!=0){a[A]=0}A=c[j>>2]|0;cS(c[w>>2]|0,c[h>>2]|0,A);J=c[(c[w>>2]|0)+8>>2]|0;c[h>>2]=J;ab=+j7(J,0);do{if(ab==+t|ab==+-t){if((c[bv()>>2]|0)!=34){break}a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245120;J=c[l>>2]|0;if(J>>>0<A>>>0){c[l>>2]=0;continue L1322}else{c[l>>2]=J-A|0;continue L1322}}}while(0);if((b3[c[(c[r>>2]|0)+12>>2]&1](c[s>>2]|0,ab)|0)==0){B=1142;break L1322}else{O=0;B=1153;break}}else if((B|0)==1084){B=0;A=c[r>>2]|0;if((A|0)==0){O=0;B=1153;break}J=c[A+20>>2]|0;if((J|0)==0){O=0;B=1153;break}if((bY[J&1023](c[s>>2]|0,c[h>>2]|0,c[j>>2]|0)|0)==0){B=1087;break L1322}else{O=0;B=1153;break}}}while(0);do{if((B|0)==1172){B=0;J=c[r>>2]|0;if((J|0)==0){break}A=c[J+28>>2]|0;if((A|0)==0){break}if((bY[A&1023](c[s>>2]|0,c[h>>2]|0,c[j>>2]|0)|0)==0){B=1175;break L1322}}else if((B|0)==1185){B=0;a[H+(G-1|0)|0]=2;c[q>>2]=5244904;continue L1322}else if((B|0)==1153){B=0;A=c[m>>2]|0;if((A|0)==0){bS(5245872,355,5249480,5245792);ac=c[m>>2]|0}else{ac=A}A=(c[n>>2]|0)+(ac-1|0)|0;J=a[A]|0;if((J<<24>>24|0)==12|(J<<24>>24|0)==0){a[A]=1}else if((J<<24>>24|0)==6){a[A]=7}else{a[A]=10}if((O|0)==0){continue L1322}A=c[u>>2]|0;J=c[m>>2]|0;if((A|0)==(J|0)){z=A+128|0;c[u>>2]=z;A=c[v>>2]|0;P=bY[c[A+4>>2]&1023](c[A+12>>2]|0,c[n>>2]|0,z)|0;c[n>>2]=P;ad=c[m>>2]|0;ae=P}else{ad=J;ae=c[n>>2]|0}c[m>>2]=ad+1|0;a[ae+ad|0]=O&255;continue L1322}}while(0);a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=5}if((B|0)==1132){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1210){bE();return 0}else if((B|0)==1205){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1087){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1109){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1093){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1101){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1097){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1194){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1213){i=g;return C|0}else if((B|0)==1218){i=g;return C|0}else if((B|0)==1220){i=g;return C|0}else if((B|0)==1222){i=g;return C|0}else if((B|0)==1224){i=g;return C|0}else if((B|0)==1225){i=g;return C|0}else if((B|0)==1226){i=g;return C|0}else if((B|0)==1227){i=g;return C|0}else if((B|0)==1175){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1183){a[(c[n>>2]|0)+(K-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1142){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1113){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1105){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1149){a[(c[n>>2]|0)+(N-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}else if((B|0)==1128){a[(c[n>>2]|0)+((c[m>>2]|0)-1|0)|0]=2;c[q>>2]=5245216;C=1;i=g;return C|0}return 0}function cP(a,b){a=a|0;b=b|0;return j$(b)|0}function cQ(a,b){a=a|0;b=b|0;j0(b);return}function cR(a,b,c){a=a|0;b=b|0;c=c|0;return j1(b,c)|0}function cS(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;if((b|0)==0){bS(5246768,37,5249528,5246020)}f=b+8|0;g=b|0;if((c[f>>2]|0)==0){c[g>>2]=2048;h=c[b+12>>2]|0;i=cc[c[h>>2]&1023](c[h+12>>2]|0,2048)|0;c[f>>2]=i;a[i]=0}i=c[g>>2]|0;h=b+4|0;j=c[h>>2]|0;k=i;while(1){if((k-j|0)>>>0>e>>>0){break}else{k=k<<1}}if((k|0)!=(i|0)){i=c[b+12>>2]|0;c[f>>2]=bY[c[i+4>>2]&1023](c[i+12>>2]|0,c[f>>2]|0,k)|0;c[g>>2]=k}if((e|0)==0){return}if((d|0)==0){bS(5246768,75,5249556,5245352)}j9((c[f>>2]|0)+(c[h>>2]|0)|0,d,e);d=(c[h>>2]|0)+e|0;c[h>>2]=d;a[(c[f>>2]|0)+d|0]=0;return}function cT(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;g=i;i=i+16|0;h=g|0;j=g+8|0;k=g+12|0;l=h|0;m=h+1|0;n=h+2|0;o=h+3|0;p=h+4|0;h=0;L1540:while(1){q=h;while(1){if(q>>>0>=f>>>0){break L1540}r=q+1|0;if(a[e+q|0]<<24>>24==92){break}else{q=r}}cS(b,e+h|0,q-h|0);s=d[e+r|0]|0;L1546:do{if((s|0)==34){t=5243500;u=r;v=1282;break}else if((s|0)==116){t=5247680;u=r;v=1282;break}else if((s|0)==47){t=5247780;u=r;v=1282;break}else if((s|0)==92){t=5247824;u=r;v=1282;break}else if((s|0)==114){t=5247828;u=r;v=1282}else if((s|0)==98){t=5247696;u=r;v=1282;break}else if((s|0)==110){t=5243540;u=r;v=1282;break}else if((s|0)==102){t=5247744;u=r;v=1282;break}else if((s|0)==117){c[j>>2]=0;cU(j,e+(q+2|0)|0);w=q+5|0;x=c[j>>2]|0;if((x&64512|0)==55296){y=q+6|0;if(a[e+y|0]<<24>>24!=92){t=5247864;u=y;v=1282;break}if(a[e+(q+7|0)|0]<<24>>24!=117){t=5247864;u=y;v=1282;break}c[k>>2]=0;cU(k,e+(q+8|0)|0);y=c[k>>2]&1023|x<<10&64512|(x>>>6<<16&983040)+65536;c[j>>2]=y;z=q+11|0;A=y}else{z=w;A=x}do{if(A>>>0<128){a[l]=A&255;a[m]=0}else{if(A>>>0<2048){a[l]=(A>>>6|192)&255;a[m]=(A&63|128)&255;a[n]=0;t=l;u=z;v=1282;break L1546}if(A>>>0<65536){a[l]=(A>>>12|224)&255;a[m]=(A>>>6&63|128)&255;a[n]=(A&63|128)&255;a[o]=0;t=l;u=z;v=1282;break L1546}if(A>>>0<2097152){a[l]=(A>>>18|240)&255;a[m]=(A>>>12&63|128)&255;a[n]=(A>>>6&63|128)&255;a[o]=(A&63|128)&255;a[p]=0;break}else{a[l]=63;a[m]=0;t=l;u=z;v=1282;break L1546}}}while(0);if((A|0)!=0){t=l;u=z;v=1282;break}cS(b,l,1);B=z;break}else{bS(5247564,169,5249416,5247516);t=5247864;u=r;v=1282;break}}while(0);if((v|0)==1282){v=0;cS(b,t,j8(t)|0);B=u}h=B+1|0}cS(b,e+h|0,q-h|0);i=g;return}function cU(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=a[d]|0;if((e&255)>64){f=(e&-33)-7&255}else{f=e}e=f-48&255;if((e&240|0)!=0){bS(5247564,85,5249688,5243740)}f=c[b>>2]<<4|e;c[b>>2]=f;e=a[d+1|0]|0;if((e&255)>64){g=(e&-33)-7&255}else{g=e}e=g-48&255;if((e&240|0)==0){h=f}else{bS(5247564,85,5249688,5243740);h=c[b>>2]|0}f=h<<4|e;c[b>>2]=f;e=a[d+2|0]|0;if((e&255)>64){i=(e&-33)-7&255}else{i=e}e=i-48&255;if((e&240|0)==0){j=f}else{bS(5247564,85,5249688,5243740);j=c[b>>2]|0}f=j<<4|e;c[b>>2]=f;e=a[d+3|0]|0;if((e&255)>64){k=(e&-33)-7&255}else{k=e}e=k-48&255;if((e&240|0)==0){l=f;m=l<<4;n=m|e;c[b>>2]=n;return}bS(5247564,85,5249688,5243740);l=c[b>>2]|0;m=l<<4;n=m|e;c[b>>2]=n;return}function cV(b,e,f,g,h,i){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0;j=c[g>>2]|0;c[h>>2]=0;c[i>>2]=0;k=b+20|0;l=b+24|0;m=b+12|0;n=b+16|0;o=j;L1606:while(1){j=c[g>>2]|0;if(j>>>0>f>>>0){bS(5246984,511,5249464,5246928);p=c[g>>2]|0}else{p=j}if(p>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1311}else{j=c[m>>2]|0;r=c[j+4>>2]|0;if((r|0)==0){q=1311;break}s=c[n>>2]|0;if(s>>>0>=r>>>0){q=1311;break}r=c[j+8>>2]|0;c[n>>2]=s+1|0;t=r+s|0;break}}while(0);if((q|0)==1311){q=0;c[g>>2]=p+1|0;t=e+p|0}s=d[t]|0;if((s|0)==93){q=1316;break}else if((s|0)==9|(s|0)==10|(s|0)==11|(s|0)==12|(s|0)==13|(s|0)==32){o=o+1|0;continue}else if((s|0)==110){q=1313;break}else if((s|0)==45|(s|0)==48|(s|0)==49|(s|0)==50|(s|0)==51|(s|0)==52|(s|0)==53|(s|0)==54|(s|0)==55|(s|0)==56|(s|0)==57){q=1452;break}else if((s|0)==58){q=1318;break}else if((s|0)==44){q=1317;break}else if((s|0)==34){q=1353;break}else if((s|0)==116){q=1315;break}else if((s|0)==123){q=1583;break}else if((s|0)==125){q=1584;break}else if((s|0)==91){u=5;q=1585;break}else if((s|0)==102){q=1314;break}else if((s|0)!=47){q=1581;break}v=c[g>>2]|0;if((c[l>>2]|0)==0){q=1541;break}if(v>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1550}else{s=c[m>>2]|0;r=c[s+4>>2]|0;if((r|0)==0){q=1550;break}j=c[n>>2]|0;if(j>>>0>=r>>>0){q=1550;break}r=c[s+8>>2]|0;c[n>>2]=j+1|0;w=r+j|0;break}}while(0);if((q|0)==1550){q=0;c[g>>2]=v+1|0;w=e+v|0}j=a[w]|0;L1631:do{if((j<<24>>24|0)==42){r=c[g>>2]|0;if(r>>>0<f>>>0){x=r}else{q=1586;break L1606}while(1){do{if((c[k>>2]|0)==0){q=1564}else{r=c[m>>2]|0;s=c[r+4>>2]|0;if((s|0)==0){q=1564;break}y=c[n>>2]|0;if(y>>>0>=s>>>0){q=1564;break}s=c[r+8>>2]|0;c[n>>2]=y+1|0;z=s+y|0;break}}while(0);if((q|0)==1564){q=0;c[g>>2]=x+1|0;z=e+x|0}do{if(a[z]<<24>>24==42){y=c[g>>2]|0;if(y>>>0>=f>>>0){q=1586;break L1606}do{if((c[k>>2]|0)==0){q=1571}else{s=c[m>>2]|0;r=c[s+4>>2]|0;if((r|0)==0){q=1571;break}A=c[n>>2]|0;if(A>>>0>=r>>>0){q=1571;break}r=c[s+8>>2]|0;c[n>>2]=A+1|0;B=r+A|0;break}}while(0);if((q|0)==1571){q=0;c[g>>2]=y+1|0;B=e+y|0}if(a[B]<<24>>24==47){break L1631}A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0;break}else{c[g>>2]=A-1|0;break}}}while(0);A=c[g>>2]|0;if(A>>>0<f>>>0){x=A}else{q=1586;break L1606}}}else if((j<<24>>24|0)==47){while(1){A=c[g>>2]|0;if(A>>>0>=f>>>0){q=1586;break L1606}do{if((c[k>>2]|0)==0){q=1558}else{r=c[m>>2]|0;s=c[r+4>>2]|0;if((s|0)==0){q=1558;break}C=c[n>>2]|0;if(C>>>0>=s>>>0){q=1558;break}s=c[r+8>>2]|0;c[n>>2]=C+1|0;D=s+C|0;break}}while(0);if((q|0)==1558){q=0;c[g>>2]=A+1|0;D=e+A|0}if(a[D]<<24>>24==10){break L1631}}}else{q=1577;break L1606}}while(0);j=c[m>>2]|0;c[j+4>>2]=0;C=c[j+8>>2]|0;if((C|0)!=0){a[C]=0}c[k>>2]=0;o=c[g>>2]|0}L1671:do{if((q|0)==1316){u=8;q=1585;break}else if((q|0)==1313){D=c[g>>2]|0;if(D>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1346}else{x=c[m>>2]|0;B=c[x+4>>2]|0;if((B|0)==0){q=1346;break}z=c[n>>2]|0;if(z>>>0>=B>>>0){q=1346;break}B=c[x+8>>2]|0;c[n>>2]=z+1|0;E=B+z|0;break}}while(0);if((q|0)==1346){c[g>>2]=D+1|0;E=e+D|0}do{if(a[E]<<24>>24==117){z=c[g>>2]|0;if(z>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1635}else{B=c[m>>2]|0;x=c[B+4>>2]|0;if((x|0)==0){q=1635;break}w=c[n>>2]|0;if(w>>>0>=x>>>0){q=1635;break}x=c[B+8>>2]|0;c[n>>2]=w+1|0;F=x+w|0;break}}while(0);if((q|0)==1635){c[g>>2]=z+1|0;F=e+z|0}if(a[F]<<24>>24!=108){break}w=c[g>>2]|0;if(w>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1642}else{x=c[m>>2]|0;B=c[x+4>>2]|0;if((B|0)==0){q=1642;break}l=c[n>>2]|0;if(l>>>0>=B>>>0){q=1642;break}B=c[x+8>>2]|0;c[n>>2]=l+1|0;G=B+l|0;break}}while(0);if((q|0)==1642){c[g>>2]=w+1|0;G=e+w|0}if(a[G]<<24>>24==108){u=7;q=1585;break L1671}}}while(0);D=c[g>>2]|0;if((D|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=D-1|0}c[b+8>>2]=6;u=4;q=1585;break}else if((q|0)==1452){D=c[g>>2]|0;if((D|0)==0){c[n>>2]=(c[n>>2]|0)-1|0;H=c[g>>2]|0}else{z=D-1|0;c[g>>2]=z;H=z}if(H>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1460}else{z=c[m>>2]|0;D=c[z+4>>2]|0;if((D|0)==0){q=1460;break}l=c[n>>2]|0;if(l>>>0>=D>>>0){q=1460;break}D=c[z+8>>2]|0;c[n>>2]=l+1|0;I=D+l|0;break}}while(0);if((q|0)==1460){c[g>>2]=H+1|0;I=e+H|0}l=a[I]|0;if(l<<24>>24==45){D=c[g>>2]|0;if(D>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1467}else{z=c[m>>2]|0;B=c[z+4>>2]|0;if((B|0)==0){q=1467;break}x=c[n>>2]|0;if(x>>>0>=B>>>0){q=1467;break}B=c[z+8>>2]|0;c[n>>2]=x+1|0;J=B+x|0;break}}while(0);if((q|0)==1467){c[g>>2]=D+1|0;J=e+D|0}K=a[J]|0}else{K=l}L1730:do{if(K<<24>>24==48){x=c[g>>2]|0;if(x>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1475}else{B=c[m>>2]|0;z=c[B+4>>2]|0;if((z|0)==0){q=1475;break}t=c[n>>2]|0;if(t>>>0>=z>>>0){q=1475;break}z=c[B+8>>2]|0;c[n>>2]=t+1|0;L=z+t|0;break}}while(0);if((q|0)==1475){c[g>>2]=x+1|0;L=e+x|0}M=a[L]|0}else{if((K-49&255)>=9){w=c[g>>2]|0;if((w|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=w-1|0}c[b+8>>2]=9;u=4;q=1585;break L1671}while(1){w=c[g>>2]|0;if(w>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1483}else{t=c[m>>2]|0;z=c[t+4>>2]|0;if((z|0)==0){q=1483;break}B=c[n>>2]|0;if(B>>>0>=z>>>0){q=1483;break}z=c[t+8>>2]|0;c[n>>2]=B+1|0;N=z+B|0;break}}while(0);if((q|0)==1483){q=0;c[g>>2]=w+1|0;N=e+w|0}A=a[N]|0;if((A-48&255)>=10){M=A;break L1730}}}}while(0);do{if(M<<24>>24==46){l=c[g>>2]|0;if(l>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1495}else{D=c[m>>2]|0;x=c[D+4>>2]|0;if((x|0)==0){q=1495;break}A=c[n>>2]|0;if(A>>>0>=x>>>0){q=1495;break}x=c[D+8>>2]|0;c[n>>2]=A+1|0;O=x+A|0;break}}while(0);if((q|0)==1495){c[g>>2]=l+1|0;O=e+l|0}if(((a[O]|0)-48&255)<10){A=1;while(1){x=c[g>>2]|0;if(x>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1502}else{D=c[m>>2]|0;B=c[D+4>>2]|0;if((B|0)==0){q=1502;break}z=c[n>>2]|0;if(z>>>0>=B>>>0){q=1502;break}B=c[D+8>>2]|0;c[n>>2]=z+1|0;P=B+z|0;break}}while(0);if((q|0)==1502){q=0;c[g>>2]=x+1|0;P=e+x|0}Q=a[P]|0;if((Q-48&255)>=10){break}A=A+1|0}if((A|0)!=0){R=11;S=Q;break}}l=c[g>>2]|0;if((l|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=l-1|0}c[b+8>>2]=7;u=4;q=1585;break L1671}else{R=10;S=M}}while(0);L1787:do{if((S<<24>>24|0)==101|(S<<24>>24|0)==69){l=c[g>>2]|0;if(l>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1516}else{w=c[m>>2]|0;z=c[w+4>>2]|0;if((z|0)==0){q=1516;break}B=c[n>>2]|0;if(B>>>0>=z>>>0){q=1516;break}z=c[w+8>>2]|0;c[n>>2]=B+1|0;T=z+B|0;break}}while(0);if((q|0)==1516){c[g>>2]=l+1|0;T=e+l|0}A=a[T]|0;if((A<<24>>24|0)==43|(A<<24>>24|0)==45){B=c[g>>2]|0;if(B>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1523}else{z=c[m>>2]|0;w=c[z+4>>2]|0;if((w|0)==0){q=1523;break}D=c[n>>2]|0;if(D>>>0>=w>>>0){q=1523;break}w=c[z+8>>2]|0;c[n>>2]=D+1|0;U=w+D|0;break}}while(0);if((q|0)==1523){c[g>>2]=B+1|0;U=e+B|0}V=a[U]|0}else{V=A}if((V-48&255)>=10){l=c[g>>2]|0;if((l|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=l-1|0}c[b+8>>2]=8;u=4;q=1585;break L1671}while(1){l=c[g>>2]|0;if(l>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1531}else{D=c[m>>2]|0;w=c[D+4>>2]|0;if((w|0)==0){q=1531;break}z=c[n>>2]|0;if(z>>>0>=w>>>0){q=1531;break}w=c[D+8>>2]|0;c[n>>2]=z+1|0;W=w+z|0;break}}while(0);if((q|0)==1531){q=0;c[g>>2]=l+1|0;W=e+l|0}if(((a[W]|0)-48&255)>=10){X=11;break L1787}}}else{X=R}}while(0);A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0;u=X;q=1585;break}else{c[g>>2]=A-1|0;u=X;q=1585;break}}else if((q|0)==1541){if((v|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=v-1|0}c[b+8>>2]=10;u=4;q=1585;break}else if((q|0)==1318){u=1;q=1585;break}else if((q|0)==1577){c[b+8>>2]=5;u=4;q=1585;break}else if((q|0)==1317){u=2;q=1585;break}else if((q|0)==1353){A=b+28|0;B=0;L1837:while(1){while(1){do{if((c[k>>2]|0)==0){q=1363}else{x=c[m>>2]|0;z=c[x+4>>2]|0;if((z|0)==0){q=1363;break}w=c[n>>2]|0;if(w>>>0>=z>>>0){q=1363;break}D=z-w|0;L1845:do{if((z|0)==(w|0)){Y=0}else{t=(c[A>>2]|0)!=0?26:10;p=(c[x+8>>2]|0)+w|0;C=0;while(1){if(((d[5243212+(d[p]|0)|0]|0)&t|0)!=0){Y=C;break L1845}j=C+1|0;if(j>>>0<D>>>0){p=p+1|0;C=j}else{Y=j;break L1845}}}}while(0);c[n>>2]=Y+w|0;Z=c[g>>2]|0;break}}while(0);do{if((q|0)==1363){q=0;l=c[g>>2]|0;if(l>>>0>=f>>>0){Z=l;break}D=f-l|0;L1854:do{if((l|0)==(f|0)){_=0}else{x=(c[A>>2]|0)!=0?26:10;z=e+l|0;y=0;while(1){if(((d[5243212+(d[z]|0)|0]|0)&x|0)!=0){_=y;break L1854}C=y+1|0;if(C>>>0<D>>>0){z=z+1|0;y=C}else{_=C;break L1854}}}}while(0);D=_+l|0;c[g>>2]=D;Z=D}}while(0);if(Z>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1374}else{D=c[m>>2]|0;w=c[D+4>>2]|0;if((w|0)==0){q=1374;break}y=c[n>>2]|0;if(y>>>0>=w>>>0){q=1374;break}w=c[D+8>>2]|0;c[n>>2]=y+1|0;ab=w+y|0;break}}while(0);if((q|0)==1374){q=0;c[g>>2]=Z+1|0;ab=e+Z|0}y=a[ab]|0;w=y&255;if((y<<24>>24|0)==92){break}else if((y<<24>>24|0)==34){$=12;aa=B;break L1837}if((a[w+5243212|0]&2)<<24>>24!=0){q=1401;break L1837}if((c[A>>2]|0)==0|y<<24>>24>-1){continue}if((w&224|0)==192){y=c[g>>2]|0;if(y>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1412}else{D=c[m>>2]|0;z=c[D+4>>2]|0;if((z|0)==0){q=1412;break}x=c[n>>2]|0;if(x>>>0>=z>>>0){q=1412;break}z=c[D+8>>2]|0;c[n>>2]=x+1|0;ac=z+x|0;break}}while(0);if((q|0)==1412){q=0;c[g>>2]=y+1|0;ac=e+y|0}if((a[ac]&-64)<<24>>24==-128){continue}else{q=1451;break L1837}}if((w&240|0)==224){x=c[g>>2]|0;if(x>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1420}else{z=c[m>>2]|0;D=c[z+4>>2]|0;if((D|0)==0){q=1420;break}C=c[n>>2]|0;if(C>>>0>=D>>>0){q=1420;break}D=c[z+8>>2]|0;c[n>>2]=C+1|0;ad=D+C|0;break}}while(0);if((q|0)==1420){q=0;c[g>>2]=x+1|0;ad=e+x|0}if((a[ad]&-64)<<24>>24!=-128){q=1451;break L1837}y=c[g>>2]|0;if(y>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1427}else{C=c[m>>2]|0;D=c[C+4>>2]|0;if((D|0)==0){q=1427;break}z=c[n>>2]|0;if(z>>>0>=D>>>0){q=1427;break}D=c[C+8>>2]|0;c[n>>2]=z+1|0;ae=D+z|0;break}}while(0);if((q|0)==1427){q=0;c[g>>2]=y+1|0;ae=e+y|0}if((a[ae]&-64)<<24>>24==-128){continue}else{q=1451;break L1837}}if((w&248|0)!=240){q=1451;break L1837}x=c[g>>2]|0;if(x>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1435}else{z=c[m>>2]|0;D=c[z+4>>2]|0;if((D|0)==0){q=1435;break}C=c[n>>2]|0;if(C>>>0>=D>>>0){q=1435;break}D=c[z+8>>2]|0;c[n>>2]=C+1|0;af=D+C|0;break}}while(0);if((q|0)==1435){q=0;c[g>>2]=x+1|0;af=e+x|0}if((a[af]&-64)<<24>>24!=-128){q=1451;break L1837}w=c[g>>2]|0;if(w>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1442}else{y=c[m>>2]|0;C=c[y+4>>2]|0;if((C|0)==0){q=1442;break}D=c[n>>2]|0;if(D>>>0>=C>>>0){q=1442;break}C=c[y+8>>2]|0;c[n>>2]=D+1|0;ag=C+D|0;break}}while(0);if((q|0)==1442){q=0;c[g>>2]=w+1|0;ag=e+w|0}if((a[ag]&-64)<<24>>24!=-128){q=1451;break L1837}x=c[g>>2]|0;if(x>>>0>=f>>>0){$=3;aa=B;break L1837}do{if((c[k>>2]|0)==0){q=1449}else{D=c[m>>2]|0;C=c[D+4>>2]|0;if((C|0)==0){q=1449;break}y=c[n>>2]|0;if(y>>>0>=C>>>0){q=1449;break}C=c[D+8>>2]|0;c[n>>2]=y+1|0;ah=C+y|0;break}}while(0);if((q|0)==1449){q=0;c[g>>2]=x+1|0;ah=e+x|0}if((a[ah]&-64)<<24>>24!=-128){q=1451;break L1837}}w=c[g>>2]|0;if(w>>>0>=f>>>0){$=3;aa=1;break}do{if((c[k>>2]|0)==0){q=1381}else{y=c[m>>2]|0;C=c[y+4>>2]|0;if((C|0)==0){q=1381;break}D=c[n>>2]|0;if(D>>>0>=C>>>0){q=1381;break}C=c[y+8>>2]|0;c[n>>2]=D+1|0;ai=C+D|0;break}}while(0);if((q|0)==1381){q=0;c[g>>2]=w+1|0;ai=e+w|0}D=a[ai]|0;if(D<<24>>24==117){aj=0}else{if((a[5243212+(D&255)|0]&1)<<24>>24==0){q=1396;break}else{B=1;continue}}while(1){if(aj>>>0>=4){B=1;continue L1837}D=c[g>>2]|0;if(D>>>0>=f>>>0){$=3;aa=1;break L1837}do{if((c[k>>2]|0)==0){q=1389}else{C=c[m>>2]|0;y=c[C+4>>2]|0;if((y|0)==0){q=1389;break}z=c[n>>2]|0;if(z>>>0>=y>>>0){q=1389;break}y=c[C+8>>2]|0;c[n>>2]=z+1|0;ak=y+z|0;break}}while(0);if((q|0)==1389){q=0;c[g>>2]=D+1|0;ak=e+D|0}if((a[5243212+(d[ak]|0)|0]&4)<<24>>24==0){q=1391;break L1837}else{aj=aj+1|0}}}if((q|0)==1391){A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=A-1|0}c[b+8>>2]=4;$=4;aa=1}else if((q|0)==1451){c[b+8>>2]=1;$=4;aa=B}else if((q|0)==1396){A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=A-1|0}c[b+8>>2]=2;$=4;aa=1}else if((q|0)==1401){A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=A-1|0}c[b+8>>2]=3;$=4;aa=B}A=(aa|0)!=0&($|0)==12?13:$;if((A|0)==3){q=1586;break}else{u=A;q=1585;break}}else if((q|0)==1315){A=c[g>>2]|0;if(A>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1324}else{w=c[m>>2]|0;x=c[w+4>>2]|0;if((x|0)==0){q=1324;break}z=c[n>>2]|0;if(z>>>0>=x>>>0){q=1324;break}x=c[w+8>>2]|0;c[n>>2]=z+1|0;al=x+z|0;break}}while(0);if((q|0)==1324){c[g>>2]=A+1|0;al=e+A|0}do{if(a[al]<<24>>24==114){B=c[g>>2]|0;if(B>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1602}else{z=c[m>>2]|0;x=c[z+4>>2]|0;if((x|0)==0){q=1602;break}w=c[n>>2]|0;if(w>>>0>=x>>>0){q=1602;break}x=c[z+8>>2]|0;c[n>>2]=w+1|0;am=x+w|0;break}}while(0);if((q|0)==1602){c[g>>2]=B+1|0;am=e+B|0}if(a[am]<<24>>24!=117){break}w=c[g>>2]|0;if(w>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1609}else{x=c[m>>2]|0;z=c[x+4>>2]|0;if((z|0)==0){q=1609;break}y=c[n>>2]|0;if(y>>>0>=z>>>0){q=1609;break}z=c[x+8>>2]|0;c[n>>2]=y+1|0;an=z+y|0;break}}while(0);if((q|0)==1609){c[g>>2]=w+1|0;an=e+w|0}if(a[an]<<24>>24==101){u=0;q=1585;break L1671}}}while(0);A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=A-1|0}c[b+8>>2]=6;u=4;q=1585;break}else if((q|0)==1581){c[b+8>>2]=5;u=4;q=1585;break}else if((q|0)==1583){u=6;q=1585;break}else if((q|0)==1584){u=9;q=1585;break}else if((q|0)==1314){A=c[g>>2]|0;if(A>>>0>=f>>>0){q=1586;break}do{if((c[k>>2]|0)==0){q=1335}else{B=c[m>>2]|0;y=c[B+4>>2]|0;if((y|0)==0){q=1335;break}z=c[n>>2]|0;if(z>>>0>=y>>>0){q=1335;break}y=c[B+8>>2]|0;c[n>>2]=z+1|0;ao=y+z|0;break}}while(0);if((q|0)==1335){c[g>>2]=A+1|0;ao=e+A|0}do{if(a[ao]<<24>>24==97){z=c[g>>2]|0;if(z>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1615}else{y=c[m>>2]|0;B=c[y+4>>2]|0;if((B|0)==0){q=1615;break}x=c[n>>2]|0;if(x>>>0>=B>>>0){q=1615;break}B=c[y+8>>2]|0;c[n>>2]=x+1|0;ap=B+x|0;break}}while(0);if((q|0)==1615){c[g>>2]=z+1|0;ap=e+z|0}if(a[ap]<<24>>24!=108){break}w=c[g>>2]|0;if(w>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1622}else{x=c[m>>2]|0;B=c[x+4>>2]|0;if((B|0)==0){q=1622;break}y=c[n>>2]|0;if(y>>>0>=B>>>0){q=1622;break}B=c[x+8>>2]|0;c[n>>2]=y+1|0;aq=B+y|0;break}}while(0);if((q|0)==1622){c[g>>2]=w+1|0;aq=e+w|0}if(a[aq]<<24>>24!=115){break}z=c[g>>2]|0;if(z>>>0>=f>>>0){q=1586;break L1671}do{if((c[k>>2]|0)==0){q=1629}else{y=c[m>>2]|0;B=c[y+4>>2]|0;if((B|0)==0){q=1629;break}x=c[n>>2]|0;if(x>>>0>=B>>>0){q=1629;break}B=c[y+8>>2]|0;c[n>>2]=x+1|0;ar=B+x|0;break}}while(0);if((q|0)==1629){c[g>>2]=z+1|0;ar=e+z|0}if(a[ar]<<24>>24==101){u=0;q=1585;break L1671}}}while(0);A=c[g>>2]|0;if((A|0)==0){c[n>>2]=(c[n>>2]|0)-1|0}else{c[g>>2]=A-1|0}c[b+8>>2]=6;u=4;q=1585;break}}while(0);do{if((q|0)==1585){if((c[k>>2]|0)!=0){as=0;at=u;q=1589;break}if((u|0)==4){au=4;return au|0}else{c[h>>2]=e+o|0;c[i>>2]=(c[g>>2]|0)-o|0;av=u;break}}else if((q|0)==1586){if((c[k>>2]|0)!=0){as=1;at=3;q=1589;break}b=c[m>>2]|0;c[b+4>>2]=0;ar=c[b+8>>2]|0;if((ar|0)==0){as=1;at=3;q=1589;break}a[ar]=0;as=1;at=3;q=1589;break}}while(0);do{if((q|0)==1589){c[k>>2]=1;cS(c[m>>2]|0,e+o|0,(c[g>>2]|0)-o|0);c[n>>2]=0;if(as){av=at;break}c[h>>2]=c[(c[m>>2]|0)+8>>2]|0;c[i>>2]=c[(c[m>>2]|0)+4>>2]|0;c[k>>2]=0;av=at}}while(0);if((av-12|0)>>>0>=2){au=av;return au|0}if((c[i>>2]|0)>>>0<=1){bS(5246984,668,5249464,5246752)}c[h>>2]=(c[h>>2]|0)+1|0;c[i>>2]=(c[i>>2]|0)-2|0;au=av;return au|0}function cW(a){a=a|0;var b=0,d=0,e=0;b=i;d=j$(28)|0;if((d|0)!=0){c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;c[d+24>>2]=0;c[d>>2]=7;e=(c3(a,d)|0)==0&1;i=b;return e|0}d=c[a+8>>2]|0;if((d|0)==0){e=0;i=b;return e|0}aQ(d|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);e=0;i=b;return e|0}function cX(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;e=j$(28)|0;if((e|0)!=0){c[e>>2]=0;c[e+4>>2]=0;c[e+8>>2]=0;c[e+12>>2]=0;c[e+16>>2]=0;c[e+20>>2]=0;c[e+24>>2]=0;c[e>>2]=(b|0)!=0?5:6;f=(c3(a,e)|0)==0&1;i=d;return f|0}e=c[a+8>>2]|0;if((e|0)==0){f=0;i=d;return f|0}aQ(e|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);f=0;i=d;return f|0}function cY(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0.0;g=i;i=i+4|0;j=g|0;l=j$(28)|0;if((l|0)==0){m=c[b+8>>2]|0;if((m|0)==0){n=0;i=g;return n|0}aQ(m|0,c[b+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);n=0;i=g;return n|0}m=l;c[l>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;c[l+12>>2]=0;c[l+16>>2]=0;c[l+20>>2]=0;c[l+24>>2]=0;c[l>>2]=2;o=j$(f+1|0)|0;p=l+20|0;c[p>>2]=o;if((o|0)==0){j0(l);q=c[b+8>>2]|0;if((q|0)==0){n=0;i=g;return n|0}aQ(q|0,c[b+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);n=0;i=g;return n|0}j9(o,e,f);a[(c[p>>2]|0)+f|0]=0;f=l+24|0;c[f>>2]=0;c[j>>2]=0;c[bv()>>2]=0;e=c[p>>2]|0;o=j8(e)|0;q=a[e]<<24>>24==45;r=q?e+1|0:e;s=a[r]<<24>>24==43?r+1|0:r;r=e+o|0;L2101:do{if(s>>>0<r>>>0){o=0;e=0;t=s;while(1){u=214748364;if((o|0)>(u|0)|(o|0)==(u|0)&e>>>0>-858993453>>>0){v=1671;break}u=(al(e|0,o|0,10,0),c[k>>2]|0);x=c[k+4>>2]|0;y=(ak(-1|0,2147483647,u|0,x|0),c[k>>2]|0);z=c[k+4>>2]|0;A=(d[t]|0)-48|0;B=A;C=(A|0)<0?-1:0;if((z|0)<(C|0)|(z|0)==(C|0)&y>>>0<B>>>0){v=1673;break}y=t+1|0;z=kf(B,C,u,x);x=F;if(y>>>0<r>>>0){o=x;e=z;t=y}else{D=x;E=z;v=1675;break L2101}}if((v|0)==1673){c[bv()>>2]=34;G=q?-2147483648:2147483647;H=q?0:-1;break}else if((v|0)==1671){c[bv()>>2]=34;G=q?-2147483648:2147483647;H=q?0:-1;break}}else{D=0;E=0;v=1675}}while(0);if((v|0)==1675){v=(al(E|0,D|0,(q?-1:1)|0,(q?-1:0)|0),c[k>>2]|0);G=c[k+4>>2]|0;H=v}v=l+4|0;c[v>>2]=H;c[v+4>>2]=G;do{if((c[bv()>>2]|0)==0){G=c[j>>2]|0;if((G|0)==0){break}if(a[G]<<24>>24!=0){break}c[f>>2]=c[f>>2]|1}}while(0);c[j>>2]=0;c[bv()>>2]=0;I=+j7(c[p>>2]|0,j);p=l+12|0;h[k>>3]=I,c[p>>2]=c[k>>2]|0,c[p+4>>2]=c[k+4>>2]|0;do{if((c[bv()>>2]|0)==0){p=c[j>>2]|0;if((p|0)==0){break}if(a[p]<<24>>24!=0){break}c[f>>2]=c[f>>2]|2}}while(0);n=(c3(b,m)|0)==0&1;i=g;return n|0}function cZ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;g=j$(28)|0;if((g|0)==0){h=c[b+8>>2]|0;if((h|0)==0){j=0;i=f;return j|0}aQ(h|0,c[b+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);j=0;i=f;return j|0}c[g>>2]=0;c[g+4>>2]=0;c[g+8>>2]=0;c[g+12>>2]=0;c[g+16>>2]=0;c[g+20>>2]=0;c[g+24>>2]=0;c[g>>2]=1;h=j$(e+1|0)|0;k=g+4|0;c[k>>2]=h;if((h|0)!=0){j9(h,d,e);a[(c[k>>2]|0)+e|0]=0;j=(c3(b,g)|0)==0&1;i=f;return j|0}j0(g);g=c[b+8>>2]|0;if((g|0)==0){j=0;i=f;return j|0}aQ(g|0,c[b+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);j=0;i=f;return j|0}function c_(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=j$(28)|0;if((d|0)==0){e=c[a+8>>2]|0;if((e|0)==0){f=0;i=b;return f|0}aQ(e|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);f=0;i=b;return f|0}e=d;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;c[d+24>>2]=0;g=d;c[g>>2]=3;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;d=j$(12)|0;h=d;if((d|0)==0){j=c[a+8>>2]|0;if((j|0)==0){f=0;i=b;return f|0}aQ(j|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);f=0;i=b;return f|0}c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;j=a;do{if((c[j>>2]|0)!=0){if(((c[g>>2]|0)-3|0)>>>0<2){break}bS(5244576,124,5249724,5243820)}}while(0);c[d+4>>2]=e;c[d+8>>2]=c[j>>2]|0;c[j>>2]=h;f=1;i=b;return f|0}function c$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=a;e=a;f=c[e>>2]|0;do{if((f|0)==0){g=c[a+8>>2]|0;if((g|0)==0){h=0;break}aQ(g|0,c[a+12>>2]|0,5243904,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);h=0}else{c[e>>2]=c[f+8>>2]|0;g=c[f+4>>2]|0;j0(f);if((g|0)==0){h=0;break}h=(c3(d,g)|0)==0&1}}while(0);i=b;return h|0}function c0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0;b=i;d=j$(28)|0;if((d|0)==0){e=c[a+8>>2]|0;if((e|0)==0){f=0;i=b;return f|0}aQ(e|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);f=0;i=b;return f|0}e=d;c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;c[d+12>>2]=0;c[d+16>>2]=0;c[d+20>>2]=0;c[d+24>>2]=0;g=d;c[g>>2]=4;c[d+4>>2]=0;c[d+8>>2]=0;d=j$(12)|0;h=d;if((d|0)==0){j=c[a+8>>2]|0;if((j|0)==0){f=0;i=b;return f|0}aQ(j|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);f=0;i=b;return f|0}c[d>>2]=0;c[d+4>>2]=0;c[d+8>>2]=0;j=a;do{if((c[j>>2]|0)!=0){if(((c[g>>2]|0)-3|0)>>>0<2){break}bS(5244576,124,5249724,5243820)}}while(0);c[d+4>>2]=e;c[d+8>>2]=c[j>>2]|0;c[j>>2]=h;f=1;i=b;return f|0}function c1(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=i;d=a;e=a;f=c[e>>2]|0;do{if((f|0)==0){g=c[a+8>>2]|0;if((g|0)==0){h=0;break}aQ(g|0,c[a+12>>2]|0,5243904,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);h=0}else{c[e>>2]=c[f+8>>2]|0;g=c[f+4>>2]|0;j0(f);if((g|0)==0){h=0;break}h=(c3(d,g)|0)==0&1}}while(0);i=b;return h|0}function c2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((a|0)==0){return}b=c[a>>2]|0;if((b|0)==2){j0(c[a+20>>2]|0);j0(a);return}else if((b|0)==1){j0(c[a+4>>2]|0);j0(a);return}else{d=a+4|0;e=(d|0)==0;if(!((b|0)!=3|e)){f=a+12|0;g=d;h=c[g>>2]|0;i=d+4|0;L2205:do{if((c[f>>2]|0)==0){j=h}else{k=0;l=h;while(1){j0(c[l+(k<<2)>>2]|0);c[(c[g>>2]|0)+(k<<2)>>2]=0;c2(c[(c[i>>2]|0)+(k<<2)>>2]|0);c[(c[i>>2]|0)+(k<<2)>>2]=0;m=k+1|0;n=c[g>>2]|0;if(m>>>0<(c[f>>2]|0)>>>0){k=m;l=n}else{j=n;break L2205}}}}while(0);j0(j);j0(c[i>>2]|0);j0(a);return}if((b|0)!=4|e){j0(a);return}e=d+4|0;b=d;d=c[b>>2]|0;L2215:do{if((c[e>>2]|0)==0){o=d}else{i=0;j=d;while(1){c2(c[j+(i<<2)>>2]|0);c[(c[b>>2]|0)+(i<<2)>>2]=0;f=i+1|0;g=c[b>>2]|0;if(f>>>0<(c[e>>2]|0)>>>0){i=f;j=g}else{o=g;break L2215}}}}while(0);j0(o);j0(a);return}}function c3(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=i;e=(a|0)==0;if(e){bS(5244576,216,5249740,5244532)}f=(b|0)!=0;if(!f){bS(5244576,217,5249740,5244480)}g=a|0;h=c[g>>2]|0;if((h|0)==0){j=a+4|0;if((c[j>>2]|0)!=0){bS(5244576,232,5249740,5244416)}c[j>>2]=b;k=0;i=d;return k|0}j=c[h+4>>2]|0;do{if((j|0)!=0){l=j|0;m=c[l>>2]|0;if((m|0)==4){if(e){bS(5244576,191,5249760,5244532)}if((b|0)==0){bS(5244576,193,5249760,5244180)}if((c[l>>2]|0)!=4){bS(5244576,196,5249760,5244120)}l=j+4|0;n=l;o=l+4|0;l=j1(c[n>>2]|0,(c[o>>2]<<2)+4|0)|0;p=l;if((l|0)!=0){c[n>>2]=p;c[p+(c[o>>2]<<2)>>2]=b;c[o>>2]=(c[o>>2]|0)+1|0;k=0;i=d;return k|0}o=c[a+8>>2]|0;if((o|0)==0){k=12;i=d;return k|0}aQ(o|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);k=12;i=d;return k|0}else if((m|0)!=3){break}m=h|0;o=c[m>>2]|0;if((o|0)==0){do{if(f){if((c[b>>2]|0)!=1){break}p=b+4|0;c[m>>2]=c[p>>2]|0;c[p>>2]=0;j0(b);k=0;i=d;return k|0}}while(0);p=c[a+8>>2]|0;if((p|0)==0){k=22;i=d;return k|0}aQ(p|0,c[a+12>>2]|0,5244340,(w=i,i=i+4|0,c[w>>2]=c[b>>2]|0,w)|0);k=22;i=d;return k|0}c[m>>2]=0;p=c[(c[g>>2]|0)+4>>2]|0;if(e){bS(5244576,159,5249600,5244532)}n=(p|0)!=0;if(!n){bS(5244576,160,5249600,5244028)}if((b|0)==0){bS(5244576,162,5249600,5244180)}do{if(n){if((c[p>>2]|0)==3){break}else{q=1792;break}}else{q=1792}}while(0);if((q|0)==1792){bS(5244576,165,5249600,5243984)}n=p+4|0;m=n;l=p+12|0;r=j1(c[m>>2]|0,(c[l>>2]<<2)+4|0)|0;if((r|0)==0){s=c[a+8>>2]|0;if((s|0)==0){k=12;i=d;return k|0}aQ(s|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);k=12;i=d;return k|0}c[m>>2]=r;r=n+4|0;n=j1(c[r>>2]|0,(c[l>>2]<<2)+4|0)|0;if((n|0)!=0){c[r>>2]=n;c[(c[m>>2]|0)+(c[l>>2]<<2)>>2]=o;c[(c[r>>2]|0)+(c[l>>2]<<2)>>2]=b;c[l>>2]=(c[l>>2]|0)+1|0;k=0;i=d;return k|0}l=c[a+8>>2]|0;if((l|0)==0){k=12;i=d;return k|0}aQ(l|0,c[a+12>>2]|0,5246872,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);k=12;i=d;return k|0}}while(0);b=c[a+8>>2]|0;if((b|0)==0){k=22;i=d;return k|0}aQ(b|0,c[a+12>>2]|0,5244236,(w=i,i=i+4|0,c[w>>2]=c[j>>2]|0,w)|0);k=22;i=d;return k|0}function c4(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0;h=i;i=i+4|0;j=h|0;c[j>>2]=g;g=c[j>>2]|0;if((b|0)==0){i=h;return}j=b+92|0;if(a[j]<<24>>24!=0){i=h;return}c[b>>2]=d;c[b+4>>2]=e;c[b+8>>2]=f;aQ(j|0,160,5244176,g|0);a[b+251|0]=0;i=h;return}function c5(b){b=b|0;var d=0,e=0,f=0,g=0;d=b+8|0;e=c[d>>2]|0;if(e>>>0>=(c[b+4>>2]|0)>>>0){f=-1;return f|0}g=a[(c[b>>2]|0)+e|0]|0;c[d>>2]=e+1|0;f=g&255;return f|0}function c6(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;i=i+324|0;h=g|0;j=g+4|0;k=g+164|0;l=j|0;if((b|0)==0){i=g;return}c[h>>2]=f;aQ(l|0,160,e|0,c[h>>2]|0);a[j+159|0]=0;L2319:do{if((d|0)==0){m=-1;n=l;o=0;p=-1}else{j=c[d+40>>2]|0;h=c[d+24>>2]|0;e=c[d+28>>2]|0;f=c[d+36>>2]|0;do{if((j|0)!=0){if(a[j]<<24>>24==0){break}if((c[d+44>>2]|0)>>>0>=21){m=h;n=l;o=f;p=e;break L2319}q=k|0;aQ(q|0,160,5244220,(w=i,i=i+8|0,c[w>>2]=l,c[w+4>>2]=j,w)|0);a[k+159|0]=0;m=h;n=q;o=f;p=e;break L2319}}while(0);if((c[d+20>>2]|0)==-2){m=h;n=l;o=f;p=e;break}j=k|0;aQ(j|0,160,5244196,(w=i,i=i+4|0,c[w>>2]=l,w)|0);a[k+159|0]=0;m=h;n=j;o=f;p=e}}while(0);c4(b,m,p,o,(w=i,i=i+4|0,c[w>>2]=n,w)|0);i=g;return}function c7(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((b|0)==0){d=-1;return d|0}do{if((a|0)!=0){if((c[a>>2]|0)!=1|(a|0)==(b|0)){break}e=a+12|0;f=a+8|0;g=c[f>>2]|0;h=a+16|0;i=h;j=c[i>>2]|0;do{if(((c[e>>2]|0)+1|0)>>>0>g>>>0){k=g+1|0;l=g<<1;m=k>>>0>l>>>0?k:l;l=m<<2;if((l|0)==0){break}k=j$(l)|0;if((k|0)==0){break}c[f>>2]=m;c[h>>2]=k;m=j;j9(k,m,c[e>>2]<<2);if((j|0)!=0){j0(m)}n=c[i>>2]|0;o=1863;break}else{n=j;o=1863}}while(0);do{if((o|0)==1863){if((n|0)==0){break}c[n+(c[e>>2]<<2)>>2]=b;c[e>>2]=(c[e>>2]|0)+1|0;d=0;return d|0}}while(0);e=b+4|0;j=c[e>>2]|0;if((j|0)==-1){d=-1;return d|0}i=j-1|0;c[e>>2]=i;if((i|0)!=0){d=-1;return d|0}c8(b);d=-1;return d|0}}while(0);n=b+4|0;o=c[n>>2]|0;if((o|0)==-1){d=-1;return d|0}a=o-1|0;c[n>>2]=a;if((a|0)!=0){d=-1;return d|0}c8(b);d=-1;return d|0}function c8(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;if((a|0)==0){return}b=c[a>>2]|0;if((b|0)==2){d=c[a+8>>2]|0;if((d|0)!=0){j0(d)}j0(a);return}else if((b|0)==0){d=a+20|0;e=c[a+24>>2]|0;L2374:do{if((e|0)!=(d|0)){f=e;while(1){g=c[f+4>>2]|0;h=f-8+4|0;i=c[h+12>>2]|0;j=i;do{if((i|0)!=0){k=i+4|0;l=c[k>>2]|0;if((l|0)==-1){break}m=l-1|0;c[k>>2]=m;if((m|0)!=0){break}c8(j)}}while(0);if((h|0)!=0){j0(h)}if((g|0)==(d|0)){break L2374}else{f=g}}}}while(0);d=c[a+12>>2]|0;if((d|0)!=0){j0(d)}j0(a);return}else if((b|0)==3){j0(a);return}else if((b|0)==4){j0(a);return}else if((b|0)==1){b=a+12|0;d=a+16|0;e=c[d>>2]|0;L2396:do{if((c[b>>2]|0)==0){n=e}else{f=0;j=e;while(1){i=c[j+(f<<2)>>2]|0;do{if((i|0)!=0){m=i+4|0;k=c[m>>2]|0;if((k|0)==-1){break}l=k-1|0;c[m>>2]=l;if((l|0)!=0){break}c8(i)}}while(0);i=f+1|0;g=c[d>>2]|0;if(i>>>0<(c[b>>2]|0)>>>0){f=i;j=g}else{n=g;break L2396}}}}while(0);if((n|0)!=0){j0(n)}j0(a);return}else{return}}function c9(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0.0;e=i;i=i+12|0;f=e|0;g=e+4|0;j=e+8|0;l=b+44|0;c[l>>2]=0;m=b+40|0;a[c[m>>2]|0]=0;n=b+52|0;if((c[n>>2]|0)==256){o=b+56|0;p=c[o>>2]|0;if((p|0)!=0){j0(p)}c[o>>2]=0}o=b|0;p=dc(o,d)|0;while(1){if((p|0)==(-1|0)){q=1919;break}else if((p|0)==(-2|0)){q=1920;break}else if(!((p|0)==32|(p|0)==13|(p|0)==10|(p|0)==9)){q=1921;break}p=dc(o,d)|0}if((q|0)==1919){c[n>>2]=0;i=e;return}else if((q|0)==1920){c[n>>2]=-1;i=e;return}else if((q|0)==1921){r=p&255;s=b+48|0;t=c[s>>2]|0;u=c[l>>2]|0;do{if((t-u|0)>>>0>1){v=u;x=c[m>>2]|0;q=1929;break}else{if((t|0)<0|u>>>0>4294967293){break}y=t<<1;z=u+2|0;A=y>>>0>z>>>0?y:z;if((A|0)==0){break}z=j$(A)|0;if((z|0)==0){break}j9(z,c[m>>2]|0,c[l>>2]|0);y=c[m>>2]|0;if((y|0)!=0){j0(y)}c[m>>2]=z;c[s>>2]=A;v=c[l>>2]|0;x=z;q=1929;break}}while(0);if((q|0)==1929){a[x+v|0]=r;r=(c[l>>2]|0)+1|0;c[l>>2]=r;a[(c[m>>2]|0)+r|0]=0}if((p|0)==125|(p|0)==123|(p|0)==93|(p|0)==91|(p|0)==58|(p|0)==44){c[n>>2]=p;i=e;return}else if((p|0)==34){r=j;j=b+56|0;c[j>>2]=0;c[n>>2]=-1;v=dc(o,d)|0;do{if(v>>>0<4294967294){x=v&255;u=c[s>>2]|0;t=c[l>>2]|0;if((u-t|0)>>>0>1){B=t;C=c[m>>2]|0}else{if((u|0)<0|t>>>0>4294967293){D=v;break}z=u<<1;u=t+2|0;t=z>>>0>u>>>0?z:u;if((t|0)==0){D=v;break}u=j$(t)|0;if((u|0)==0){D=v;break}j9(u,c[m>>2]|0,c[l>>2]|0);z=c[m>>2]|0;if((z|0)!=0){j0(z)}c[m>>2]=u;c[s>>2]=t;B=c[l>>2]|0;C=u}a[C+B|0]=x;x=(c[l>>2]|0)+1|0;c[l>>2]=x;a[(c[m>>2]|0)+x|0]=0;D=v;break}else{D=v}}while(0);L2453:while(1){if((D|0)==(-1|0)){q=1943;break}else if((D|0)==(-2|0)){break}else if((D|0)==34){q=1998;break}if(D>>>0<32){q=1945;break}v=(D|0)==92;B=dc(o,d)|0;do{if(B>>>0<4294967294){C=B&255;x=c[s>>2]|0;u=c[l>>2]|0;if((x-u|0)>>>0>1){E=u;G=c[m>>2]|0}else{if((x|0)<0|u>>>0>4294967293){break}t=x<<1;x=u+2|0;u=t>>>0>x>>>0?t:x;if((u|0)==0){break}x=j$(u)|0;if((x|0)==0){break}j9(x,c[m>>2]|0,c[l>>2]|0);t=c[m>>2]|0;if((t|0)!=0){j0(t)}c[m>>2]=x;c[s>>2]=u;E=c[l>>2]|0;G=x}a[G+E|0]=C;C=(c[l>>2]|0)+1|0;c[l>>2]=C;a[(c[m>>2]|0)+C|0]=0}}while(0);if(!v){D=B;continue}if((B|0)==116|(B|0)==114|(B|0)==110|(B|0)==102|(B|0)==98|(B|0)==92|(B|0)==47|(B|0)==34){C=dc(o,d)|0;if(C>>>0>=4294967294){D=C;continue}x=C&255;u=c[s>>2]|0;t=c[l>>2]|0;if((u-t|0)>>>0>1){H=t;I=c[m>>2]|0}else{if((u|0)<0|t>>>0>4294967293){D=C;continue}z=u<<1;u=t+2|0;t=z>>>0>u>>>0?z:u;if((t|0)==0){D=C;continue}u=j$(t)|0;if((u|0)==0){D=C;continue}j9(u,c[m>>2]|0,c[l>>2]|0);z=c[m>>2]|0;if((z|0)!=0){j0(z)}c[m>>2]=u;c[s>>2]=t;H=c[l>>2]|0;I=u}a[I+H|0]=x;x=(c[l>>2]|0)+1|0;c[l>>2]=x;a[(c[m>>2]|0)+x|0]=0;D=C;continue}else if((B|0)!=117){q=1997;break}C=dc(o,d)|0;do{if(C>>>0<4294967294){x=C&255;u=c[s>>2]|0;t=c[l>>2]|0;if((u-t|0)>>>0>1){J=t;K=c[m>>2]|0}else{if((u|0)<0|t>>>0>4294967293){L=0;M=C;break}z=u<<1;u=t+2|0;t=z>>>0>u>>>0?z:u;if((t|0)==0){L=0;M=C;break}u=j$(t)|0;if((u|0)==0){L=0;M=C;break}j9(u,c[m>>2]|0,c[l>>2]|0);z=c[m>>2]|0;if((z|0)!=0){j0(z)}c[m>>2]=u;c[s>>2]=t;J=c[l>>2]|0;K=u}a[K+J|0]=x;x=(c[l>>2]|0)+1|0;c[l>>2]=x;a[(c[m>>2]|0)+x|0]=0;L=0;M=C;break}else{L=0;M=C}}while(0);while(1){if(!((M-48|0)>>>0<10|(M|0)>64|(M|0)<71|(M|0)>96|(M|0)<103)){q=1975;break L2453}C=dc(o,d)|0;do{if(C>>>0<4294967294){B=C&255;v=c[s>>2]|0;x=c[l>>2]|0;if((v-x|0)>>>0>1){N=x;O=c[m>>2]|0}else{if((v|0)<0|x>>>0>4294967293){break}u=v<<1;v=x+2|0;x=u>>>0>v>>>0?u:v;if((x|0)==0){break}v=j$(x)|0;if((v|0)==0){break}j9(v,c[m>>2]|0,c[l>>2]|0);u=c[m>>2]|0;if((u|0)!=0){j0(u)}c[m>>2]=v;c[s>>2]=x;N=c[l>>2]|0;O=v}a[O+N|0]=B;B=(c[l>>2]|0)+1|0;c[l>>2]=B;a[(c[m>>2]|0)+B|0]=0}}while(0);B=L+1|0;if((B|0)<4){L=B;M=C}else{D=C;continue L2453}}}L2513:do{if((q|0)==1943){c6(d,b,5244800,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0)}else if((q|0)==1975){c6(d,b,5244620,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0)}else if((q|0)==1945){db(o,D);M=c[l>>2]|0;if((M|0)==0){P=0}else{L=M-1|0;c[l>>2]=L;M=(c[b+40>>2]|0)+L|0;L=a[M]|0;a[M]=0;P=L<<24>>24}if((P|0)!=(D|0)){bS(5245504,256,5249620,5245476)}if((D|0)==10){c6(d,b,5244724,(w=i,i=i+4|0,c[w>>2]=10,w)|0);break}else{c6(d,b,5244656,(w=i,i=i+4|0,c[w>>2]=D,w)|0);break}}else if((q|0)==1997){c6(d,b,5244620,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0)}else if((q|0)==1998){L=(c[l>>2]|0)+1|0;if((L|0)==0){c[j>>2]=0;i=e;return}M=j$(L)|0;c[j>>2]=M;if((M|0)==0){i=e;return}L=(c[b+40>>2]|0)+1|0;N=a[L]|0;L2535:do{if(N<<24>>24==34){Q=M}else{O=r+1|0;J=r+2|0;K=r+3|0;H=0;I=L;E=M;G=N;while(1){B=I;v=E;x=G;while(1){R=B+1|0;if(x<<24>>24==92){u=a[R]|0;if(u<<24>>24==117){break}t=u<<24>>24;if((t|0)==34|(t|0)==92|(t|0)==47){a[v]=u}else if((t|0)==98){a[v]=8}else if((t|0)==102){a[v]=12}else if((t|0)==110){a[v]=10}else if((t|0)==114){a[v]=13}else if((t|0)==116){a[v]=9}else{bS(5245504,432,5249640,5244396)}S=B+2|0}else{a[v]=x;S=R}t=v+1|0;u=a[S]|0;if(u<<24>>24==34){Q=t;break L2535}else{B=S;v=t;x=u}}T=dd(R)|0;x=B+6|0;if((T-55296|0)>>>0<1024){if(a[x]<<24>>24!=92){q=2012;break}u=B+7|0;if(a[u]<<24>>24!=117){q=2012;break}U=dd(u)|0;if((U-56320|0)>>>0>=1024){q=2011;break}V=((T<<10)-56613888|0)+U|0;W=B+12|0}else{if((T-56320|0)>>>0<1024){q=2014;break}if((T|0)==0){q=2016;break}else{V=T;W=x}}do{if((V|0)<0){q=2026}else{if((V|0)<128){a[r]=V&255;X=1;break}if((V|0)<2048){a[r]=(V>>>6&31|192)&255;a[O]=(V&63|128)&255;X=2;break}if((V|0)<65536){a[r]=(V>>>12&15|224)&255;a[O]=(V>>>6&63|128)&255;a[J]=(V&63|128)&255;X=3;break}if((V|0)>=1114112){q=2026;break}a[r]=(V>>>18&7|240)&255;a[O]=(V>>>12&63|128)&255;a[J]=(V>>>6&63|128)&255;a[K]=(V&63|128)&255;X=4;break}}while(0);if((q|0)==2026){q=0;bS(5245504,418,5249640,5244396);X=H}j9(v,r,X);B=v+X|0;x=a[W]|0;if(x<<24>>24==34){Q=B;break L2535}else{H=X;I=W;E=B;G=x}}if((q|0)==2011){c6(d,b,5244544,(w=i,i=i+8|0,c[w>>2]=T,c[w+4>>2]=U,w)|0);break L2513}else if((q|0)==2016){c6(d,b,5244456,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);break L2513}else if((q|0)==2012){c6(d,b,5244504,(w=i,i=i+4|0,c[w>>2]=T,w)|0);break L2513}else if((q|0)==2014){c6(d,b,5244504,(w=i,i=i+4|0,c[w>>2]=T,w)|0);break L2513}}}while(0);a[Q]=0;c[n>>2]=256;i=e;return}}while(0);Q=c[j>>2]|0;if((Q|0)==0){i=e;return}j0(Q);i=e;return}else{Q=(p|0)==45;if(!((p-48|0)>>>0<10|Q)){if(!((p-65|0)>>>0<26|(p-97|0)>>>0<26)){j=b+16|0;T=a[(c[j>>2]|0)+(b+8)|0]|0;L2596:do{if(T<<24>>24!=0){U=b+40|0;W=b+36|0;X=T;while(1){r=c[s>>2]|0;V=c[l>>2]|0;do{if((r-V|0)>>>0>1){Y=V;Z=c[U>>2]|0;q=2254;break}else{if((r|0)<0|V>>>0>4294967293){break}R=r<<1;S=V+2|0;D=R>>>0>S>>>0?R:S;if((D|0)==0){break}S=j$(D)|0;if((S|0)==0){break}j9(S,c[U>>2]|0,c[l>>2]|0);R=c[U>>2]|0;if((R|0)!=0){j0(R)}c[U>>2]=S;c[s>>2]=D;Y=c[l>>2]|0;Z=S;q=2254;break}}while(0);if((q|0)==2254){q=0;a[Z+Y|0]=X;V=(c[l>>2]|0)+1|0;c[l>>2]=V;a[(c[U>>2]|0)+V|0]=0}V=(c[j>>2]|0)+1|0;c[j>>2]=V;c[W>>2]=(c[W>>2]|0)+1|0;r=a[V+(b+8)|0]|0;if(r<<24>>24==0){break L2596}else{X=r}}}}while(0);c[n>>2]=-1;i=e;return}j=dc(o,d)|0;do{if(j>>>0<4294967294){Y=j&255;Z=c[s>>2]|0;T=c[l>>2]|0;if((Z-T|0)>>>0>1){_=T;$=c[m>>2]|0}else{if((Z|0)<0|T>>>0>4294967293){break}X=Z<<1;Z=T+2|0;T=X>>>0>Z>>>0?X:Z;if((T|0)==0){break}Z=j$(T)|0;if((Z|0)==0){break}j9(Z,c[m>>2]|0,c[l>>2]|0);X=c[m>>2]|0;if((X|0)!=0){j0(X)}c[m>>2]=Z;c[s>>2]=T;_=c[l>>2]|0;$=Z}a[$+_|0]=Y;Y=(c[l>>2]|0)+1|0;c[l>>2]=Y;a[(c[m>>2]|0)+Y|0]=0}}while(0);L2628:do{if((j-65|0)>>>0<26|(j-97|0)>>>0<26){while(1){_=dc(o,d)|0;do{if(_>>>0<4294967294){$=_&255;Y=c[s>>2]|0;Z=c[l>>2]|0;if((Y-Z|0)>>>0>1){aa=Z;ab=c[m>>2]|0}else{if((Y|0)<0|Z>>>0>4294967293){break}T=Y<<1;Y=Z+2|0;Z=T>>>0>Y>>>0?T:Y;if((Z|0)==0){break}Y=j$(Z)|0;if((Y|0)==0){break}j9(Y,c[m>>2]|0,c[l>>2]|0);T=c[m>>2]|0;if((T|0)!=0){j0(T)}c[m>>2]=Y;c[s>>2]=Z;aa=c[l>>2]|0;ab=Y}a[ab+aa|0]=$;$=(c[l>>2]|0)+1|0;c[l>>2]=$;a[(c[m>>2]|0)+$|0]=0}}while(0);if(!((_-65|0)>>>0<26|(_-97|0)>>>0<26)){ac=_;break L2628}}}else{ac=j}}while(0);do{if(ac>>>0<4294967294){db(o,ac);j=c[l>>2]|0;if((j|0)==0){ad=0}else{aa=j-1|0;c[l>>2]=aa;j=(c[b+40>>2]|0)+aa|0;aa=a[j]|0;a[j]=0;ad=aa<<24>>24}if((ad|0)==(ac|0)){break}bS(5245504,256,5249620,5245476)}}while(0);ac=c[m>>2]|0;if((aN(ac|0,5247308)|0)==0){c[n>>2]=259;i=e;return}if((aN(ac|0,5246176)|0)==0){c[n>>2]=260;i=e;return}if((aN(ac|0,5247228)|0)==0){c[n>>2]=261;i=e;return}else{c[n>>2]=-1;i=e;return}}c[n>>2]=-1;do{if(Q){ac=dc(o,d)|0;if(ac>>>0>=4294967294){ae=ac;q=2070;break}ad=ac&255;aa=c[s>>2]|0;j=c[l>>2]|0;if((aa-j|0)>>>0>1){af=j;ag=c[m>>2]|0}else{if((aa|0)<0|j>>>0>4294967293){ah=ac;q=2054;break}ab=aa<<1;aa=j+2|0;j=ab>>>0>aa>>>0?ab:aa;if((j|0)==0){ah=ac;q=2054;break}aa=j$(j)|0;if((aa|0)==0){ah=ac;q=2054;break}j9(aa,c[m>>2]|0,c[l>>2]|0);ab=c[m>>2]|0;if((ab|0)!=0){j0(ab)}c[m>>2]=aa;c[s>>2]=j;af=c[l>>2]|0;ag=aa}a[ag+af|0]=ad;ad=(c[l>>2]|0)+1|0;c[l>>2]=ad;a[(c[m>>2]|0)+ad|0]=0;ah=ac;q=2054;break}else{ah=p;q=2054}}while(0);do{if((q|0)==2054){if((ah|0)!=48){ae=ah;q=2070;break}p=dc(o,d)|0;do{if(p>>>0<4294967294){af=p&255;ag=c[s>>2]|0;Q=c[l>>2]|0;if((ag-Q|0)>>>0>1){ai=Q;aj=c[m>>2]|0}else{if((ag|0)<0|Q>>>0>4294967293){break}ac=ag<<1;ag=Q+2|0;Q=ac>>>0>ag>>>0?ac:ag;if((Q|0)==0){break}ag=j$(Q)|0;if((ag|0)==0){break}j9(ag,c[m>>2]|0,c[l>>2]|0);ac=c[m>>2]|0;if((ac|0)!=0){j0(ac)}c[m>>2]=ag;c[s>>2]=Q;ai=c[l>>2]|0;aj=ag}a[aj+ai|0]=af;af=(c[l>>2]|0)+1|0;c[l>>2]=af;a[(c[m>>2]|0)+af|0]=0}}while(0);if((p-48|0)>>>0>=10){ak=p;break}db(o,p);af=c[l>>2]|0;if((af|0)==0){al=0}else{ag=af-1|0;c[l>>2]=ag;af=(c[b+40>>2]|0)+ag|0;ag=a[af]|0;a[af]=0;al=ag<<24>>24}if((al|0)==(p|0)){i=e;return}bS(5245504,256,5249620,5245476);i=e;return}}while(0);L2703:do{if((q|0)==2070){if((ae-48|0)>>>0>=10){if(ae>>>0>=4294967294){i=e;return}db(o,ae);al=c[l>>2]|0;if((al|0)==0){am=0}else{ai=al-1|0;c[l>>2]=ai;al=(c[b+40>>2]|0)+ai|0;ai=a[al]|0;a[al]=0;am=ai<<24>>24}if((am|0)==(ae|0)){i=e;return}bS(5245504,256,5249620,5245476);i=e;return}ai=dc(o,d)|0;do{if(ai>>>0<4294967294){al=ai&255;aj=c[s>>2]|0;ah=c[l>>2]|0;if((aj-ah|0)>>>0>1){an=ah;ao=c[m>>2]|0}else{if((aj|0)<0|ah>>>0>4294967293){break}ag=aj<<1;aj=ah+2|0;ah=ag>>>0>aj>>>0?ag:aj;if((ah|0)==0){break}aj=j$(ah)|0;if((aj|0)==0){break}j9(aj,c[m>>2]|0,c[l>>2]|0);ag=c[m>>2]|0;if((ag|0)!=0){j0(ag)}c[m>>2]=aj;c[s>>2]=ah;an=c[l>>2]|0;ao=aj}a[ao+an|0]=al;al=(c[l>>2]|0)+1|0;c[l>>2]=al;a[(c[m>>2]|0)+al|0]=0}}while(0);if((ai-48|0)>>>0>=10){ak=ai;break}p=b+40|0;while(1){al=dc(o,d)|0;do{if(al>>>0<4294967294){aj=al&255;ah=c[s>>2]|0;ag=c[l>>2]|0;if((ah-ag|0)>>>0>1){ap=ag;aq=c[p>>2]|0}else{if((ah|0)<0|ag>>>0>4294967293){break}af=ah<<1;ah=ag+2|0;ag=af>>>0>ah>>>0?af:ah;if((ag|0)==0){break}ah=j$(ag)|0;if((ah|0)==0){break}j9(ah,c[p>>2]|0,c[l>>2]|0);af=c[p>>2]|0;if((af|0)!=0){j0(af)}c[p>>2]=ah;c[s>>2]=ag;ap=c[l>>2]|0;aq=ah}a[aq+ap|0]=aj;aj=(c[l>>2]|0)+1|0;c[l>>2]=aj;a[(c[p>>2]|0)+aj|0]=0}}while(0);if((al-48|0)>>>0>=10){ak=al;break L2703}}}}while(0);if((ak|0)==46){q=2112}else if((ak|0)==69|(ak|0)==101){ar=ak}else{do{if(ak>>>0<4294967294){db(o,ak);ap=c[l>>2]|0;if((ap|0)==0){as=0}else{aq=ap-1|0;c[l>>2]=aq;ap=(c[b+40>>2]|0)+aq|0;aq=a[ap]|0;a[ap]=0;as=aq<<24>>24}if((as|0)==(ak|0)){break}bS(5245504,256,5249620,5245476)}}while(0);ak=c[b+40>>2]|0;c[bv()>>2]=0;as=bI(ak|0,g|0,10)|0;aq=F;if((c[bv()>>2]|0)!=34){if((c[g>>2]|0)!=(ak+(c[l>>2]|0)|0)){bS(5245504,504,5249656,5244944)}c[n>>2]=257;ak=b+56|0;c[ak>>2]=as;c[ak+4>>2]=aq;i=e;return}ak=0;if((aq|0)<(ak|0)|(aq|0)==(ak|0)&as>>>0<0>>>0){c6(d,b,5245092,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);i=e;return}else{c6(d,b,5245024,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);i=e;return}}L2769:do{if((q|0)==2112){as=dc(o,d)|0;if((as-48|0)>>>0>=10){db(o,as);i=e;return}ak=as&255;as=c[s>>2]|0;aq=c[l>>2]|0;do{if((as-aq|0)>>>0>1){at=aq;au=c[m>>2]|0;q=2122;break}else{if((as|0)<0|aq>>>0>4294967293){break}g=as<<1;ap=aq+2|0;an=g>>>0>ap>>>0?g:ap;if((an|0)==0){break}ap=j$(an)|0;if((ap|0)==0){break}j9(ap,c[m>>2]|0,c[l>>2]|0);g=c[m>>2]|0;if((g|0)!=0){j0(g)}c[m>>2]=ap;c[s>>2]=an;at=c[l>>2]|0;au=ap;q=2122;break}}while(0);if((q|0)==2122){a[au+at|0]=ak;aq=(c[l>>2]|0)+1|0;c[l>>2]=aq;a[(c[m>>2]|0)+aq|0]=0}aq=dc(o,d)|0;do{if(aq>>>0<4294967294){as=aq&255;ap=c[s>>2]|0;an=c[l>>2]|0;if((ap-an|0)>>>0>1){av=an;aw=c[m>>2]|0}else{if((ap|0)<0|an>>>0>4294967293){break}g=ap<<1;ap=an+2|0;an=g>>>0>ap>>>0?g:ap;if((an|0)==0){break}ap=j$(an)|0;if((ap|0)==0){break}j9(ap,c[m>>2]|0,c[l>>2]|0);g=c[m>>2]|0;if((g|0)!=0){j0(g)}c[m>>2]=ap;c[s>>2]=an;av=c[l>>2]|0;aw=ap}a[aw+av|0]=as;as=(c[l>>2]|0)+1|0;c[l>>2]=as;a[(c[m>>2]|0)+as|0]=0}}while(0);if((aq-48|0)>>>0>=10){ar=aq;break}while(1){ak=dc(o,d)|0;do{if(ak>>>0<4294967294){as=ak&255;ap=c[s>>2]|0;an=c[l>>2]|0;if((ap-an|0)>>>0>1){ax=an;ay=c[m>>2]|0}else{if((ap|0)<0|an>>>0>4294967293){break}g=ap<<1;ap=an+2|0;an=g>>>0>ap>>>0?g:ap;if((an|0)==0){break}ap=j$(an)|0;if((ap|0)==0){break}j9(ap,c[m>>2]|0,c[l>>2]|0);g=c[m>>2]|0;if((g|0)!=0){j0(g)}c[m>>2]=ap;c[s>>2]=an;ax=c[l>>2]|0;ay=ap}a[ay+ax|0]=as;as=(c[l>>2]|0)+1|0;c[l>>2]=as;a[(c[m>>2]|0)+as|0]=0}}while(0);if((ak-48|0)>>>0>=10){ar=ak;break L2769}}}}while(0);L2816:do{if((ar|0)==101|(ar|0)==69){ax=dc(o,d)|0;do{if(ax>>>0<4294967294){ay=ax&255;av=c[s>>2]|0;aw=c[l>>2]|0;if((av-aw|0)>>>0>1){az=aw;aA=c[m>>2]|0}else{if((av|0)<0|aw>>>0>4294967293){break}at=av<<1;av=aw+2|0;aw=at>>>0>av>>>0?at:av;if((aw|0)==0){break}av=j$(aw)|0;if((av|0)==0){break}j9(av,c[m>>2]|0,c[l>>2]|0);at=c[m>>2]|0;if((at|0)!=0){j0(at)}c[m>>2]=av;c[s>>2]=aw;az=c[l>>2]|0;aA=av}a[aA+az|0]=ay;ay=(c[l>>2]|0)+1|0;c[l>>2]=ay;a[(c[m>>2]|0)+ay|0]=0}}while(0);do{if((ax|0)==45|(ax|0)==43){ay=dc(o,d)|0;if(ay>>>0>=4294967294){aB=ay;break}av=ay&255;aw=c[s>>2]|0;at=c[l>>2]|0;if((aw-at|0)>>>0>1){aC=at;aD=c[m>>2]|0}else{if((aw|0)<0|at>>>0>4294967293){aB=ay;break}au=aw<<1;aw=at+2|0;at=au>>>0>aw>>>0?au:aw;if((at|0)==0){aB=ay;break}aw=j$(at)|0;if((aw|0)==0){aB=ay;break}j9(aw,c[m>>2]|0,c[l>>2]|0);au=c[m>>2]|0;if((au|0)!=0){j0(au)}c[m>>2]=aw;c[s>>2]=at;aC=c[l>>2]|0;aD=aw}a[aD+aC|0]=av;av=(c[l>>2]|0)+1|0;c[l>>2]=av;a[(c[m>>2]|0)+av|0]=0;aB=ay}else{aB=ax}}while(0);if((aB-48|0)>>>0>=10){if(aB>>>0>=4294967294){i=e;return}db(o,aB);ax=c[l>>2]|0;if((ax|0)==0){aE=0}else{ay=ax-1|0;c[l>>2]=ay;ax=(c[b+40>>2]|0)+ay|0;ay=a[ax]|0;a[ax]=0;aE=ay<<24>>24}if((aE|0)==(aB|0)){i=e;return}bS(5245504,256,5249620,5245476);i=e;return}ay=dc(o,d)|0;do{if(ay>>>0<4294967294){ax=ay&255;av=c[s>>2]|0;aw=c[l>>2]|0;if((av-aw|0)>>>0>1){aF=aw;aG=c[m>>2]|0}else{if((av|0)<0|aw>>>0>4294967293){break}at=av<<1;av=aw+2|0;aw=at>>>0>av>>>0?at:av;if((aw|0)==0){break}av=j$(aw)|0;if((av|0)==0){break}j9(av,c[m>>2]|0,c[l>>2]|0);at=c[m>>2]|0;if((at|0)!=0){j0(at)}c[m>>2]=av;c[s>>2]=aw;aF=c[l>>2]|0;aG=av}a[aG+aF|0]=ax;ax=(c[l>>2]|0)+1|0;c[l>>2]=ax;a[(c[m>>2]|0)+ax|0]=0}}while(0);if((ay-48|0)>>>0>=10){aH=ay;break}ax=b+40|0;while(1){av=dc(o,d)|0;do{if(av>>>0<4294967294){aw=av&255;at=c[s>>2]|0;au=c[l>>2]|0;if((at-au|0)>>>0>1){aI=au;aJ=c[ax>>2]|0}else{if((at|0)<0|au>>>0>4294967293){break}q=at<<1;at=au+2|0;au=q>>>0>at>>>0?q:at;if((au|0)==0){break}at=j$(au)|0;if((at|0)==0){break}j9(at,c[ax>>2]|0,c[l>>2]|0);q=c[ax>>2]|0;if((q|0)!=0){j0(q)}c[ax>>2]=at;c[s>>2]=au;aI=c[l>>2]|0;aJ=at}a[aJ+aI|0]=aw;aw=(c[l>>2]|0)+1|0;c[l>>2]=aw;a[(c[ax>>2]|0)+aw|0]=0}}while(0);if((av-48|0)>>>0>=10){aH=av;break L2816}}}else{aH=ar}}while(0);do{if(aH>>>0<4294967294){db(o,aH);ar=c[l>>2]|0;if((ar|0)==0){aK=0}else{aI=ar-1|0;c[l>>2]=aI;ar=(c[b+40>>2]|0)+aI|0;aI=a[ar]|0;a[ar]=0;aK=aI<<24>>24}if((aK|0)==(aH|0)){break}bS(5245504,256,5249620,5245476)}}while(0);aH=a[c[bu()>>2]|0]|0;do{if(aH<<24>>24!=46){aK=aW(c[m>>2]|0,46)|0;if((aK|0)==0){break}a[aK]=aH}}while(0);c[bv()>>2]=0;aL=+j7(c[m>>2]|0,f);if((c[f>>2]|0)!=((c[m>>2]|0)+(c[l>>2]|0)|0)){bS(5247984,65,5249672,5247868)}if((c[bv()>>2]|0)==34&aL!=0.0){c6(d,b,5244880,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);i=e;return}else{c[n>>2]=258;n=b+56|0;h[k>>3]=aL,c[n>>2]=c[k>>2]|0,c[n+4>>2]=c[k+4>>2]|0;i=e;return}}}}function da(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0.0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0;e=i;f=b+52|0;g=c[f>>2]|0;if((g|0)==256){j=c[b+56>>2]|0;if((j|0)==0){l=0;i=e;return l|0}m=j$(12)|0;if((m|0)==0){l=0;i=e;return l|0}n=m;c[m>>2]=2;c[m+4>>2]=1;o=(j8(j)|0)+1|0;do{if((o|0)==0){c[m+8>>2]=0}else{p=j$(o)|0;if((p|0)==0){c[m+8>>2]=0;break}kd(p,j);c[m+8>>2]=p;l=n;i=e;return l|0}}while(0);j0(m);l=0;i=e;return l|0}else if((g|0)==258){m=b+56|0;q=(c[k>>2]=c[m>>2]|0,c[k+4>>2]=c[m+4>>2]|0,+h[k>>3]);if((bG(+q)|0)==0){l=0;i=e;return l|0}if((bG(+q)|0)==1){l=0;i=e;return l|0}m=j$(16)|0;if((m|0)==0){l=0;i=e;return l|0}n=m;c[m>>2]=4;c[m+4>>2]=1;j=m+8|0;h[k>>3]=q,c[j>>2]=c[k>>2]|0,c[j+4>>2]=c[k+4>>2]|0;l=n;i=e;return l|0}else if((g|0)==(-1|0)){c6(d,b,5245984,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);l=0;i=e;return l|0}else if((g|0)==257){n=b+56|0;j=c[n>>2]|0;m=c[n+4>>2]|0;n=j$(16)|0;if((n|0)==0){l=0;i=e;return l|0}c[n>>2]=3;c[n+4>>2]=1;o=n+8|0;c[o>>2]=j;c[o+4>>2]=m;l=n;i=e;return l|0}else if((g|0)==261){l=5243196;i=e;return l|0}else if((g|0)==91){n=j$(24)|0;if((n|0)==0){l=0;i=e;return l|0}c[n>>2]=1;m=n+4|0;c[m>>2]=1;c[n+12>>2]=0;c[n+8>>2]=8;o=j$(32)|0;c[n+16>>2]=o;if((o|0)==0){j0(n);l=0;i=e;return l|0}o=n;c[n+20>>2]=0;c9(b,d);n=c[f>>2]|0;if((n|0)==93){l=o;i=e;return l|0}else if((n|0)==0){r=2385}else{r=2375}L2955:do{if((r|0)==2375){while(1){r=0;n=da(b,d)|0;if((n|0)==0){break L2955}j=n+4|0;p=c[j>>2]|0;if((p|0)==-1){s=c7(o,n)|0}else{c[j>>2]=p+1|0;s=c7(o,n)|0}p=(s|0)==0;t=c[j>>2]|0;do{if((t|0)==-1){r=2382}else{u=t-1|0;c[j>>2]=u;if((u|0)!=0){r=2382;break}c8(n);if(p){break}else{break L2955}}}while(0);if((r|0)==2382){r=0;if(!p){break L2955}}c9(b,d);n=c[f>>2]|0;if((n|0)==93){l=o;break}else if((n|0)!=44){r=2385;break L2955}c9(b,d);if((c[f>>2]|0)==0){r=2385;break L2955}else{r=2375}}i=e;return l|0}}while(0);if((r|0)==2385){c6(d,b,5245856,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0)}s=c[m>>2]|0;if((s|0)==-1){l=0;i=e;return l|0}n=s-1|0;c[m>>2]=n;if((n|0)!=0){l=0;i=e;return l|0}c8(o);l=0;i=e;return l|0}else if((g|0)==259){l=5243188;i=e;return l|0}else if((g|0)==260){l=5243204;i=e;return l|0}else if((g|0)==123){g=j$(36)|0;if((g|0)==0){l=0;i=e;return l|0}o=g;n=g;c[n>>2]=0;m=g+4|0;c[m>>2]=1;s=g+8|0;c[s>>2]=0;j=g+16|0;c[j>>2]=0;t=j$(40)|0;u=g+12|0;c[u>>2]=t;if((t|0)==0){j0(g);l=0;i=e;return l|0}v=g+20|0;x=v;y=g+24|0;c[y>>2]=x;z=v;c[z>>2]=x;c[t+4>>2]=x;c[c[u>>2]>>2]=x;t=1;while(1){c[(c[u>>2]|0)+(t<<3)+4>>2]=x;c[(c[u>>2]|0)+(t<<3)>>2]=x;v=t+1|0;if(v>>>0<(c[5242976+(c[j>>2]<<2)>>2]|0)>>>0){t=v}else{break}}t=g+28|0;c[t>>2]=0;c[g+32>>2]=0;c9(b,d);g=c[f>>2]|0;if((g|0)==125){l=o;i=e;return l|0}else if((g|0)==256){r=2308}else{r=2309}L2999:do{if((r|0)==2308){g=b+56|0;L3001:while(1){A=c[g>>2]|0;c[g>>2]=0;if((A|0)==0){l=0;r=2404;break}c9(b,d);if((c[f>>2]|0)!=58){r=2312;break}c9(b,d);B=da(b,d)|0;if((B|0)==0){r=2314;break}C=B+4|0;v=c[C>>2]|0;if((v|0)==-1){D=-1}else{E=v+1|0;c[C>>2]=E;D=E}if((c[n>>2]|0)!=0|(o|0)==(B|0)){r=2318;break}E=c[t>>2]|0;c[t>>2]=E+1|0;v=c[j>>2]|0;L3010:do{if((c[s>>2]|0)>>>0>=(c[5242976+(v<<2)>>2]|0)>>>0){F=c[u>>2]|0;if((F|0)==0){G=v}else{j0(F);G=c[j>>2]|0}F=G+1|0;c[j>>2]=F;H=c[5242976+(F<<2)>>2]|0;F=H<<3;if((F|0)==0){r=2325;break L3001}I=j$(F)|0;c[u>>2]=I;if((I|0)==0){r=2356;break L3001}c[I+4>>2]=x;c[c[u>>2]>>2]=x;I=1;while(1){c[(c[u>>2]|0)+(I<<3)+4>>2]=x;c[(c[u>>2]|0)+(I<<3)>>2]=x;F=I+1|0;if(F>>>0<(c[5242976+(c[j>>2]<<2)>>2]|0)>>>0){I=F}else{break}}I=c[y>>2]|0;c[y>>2]=x;c[z>>2]=x;if((I|0)==(x|0)){break}else{J=I}while(1){I=c[J+4>>2]|0;F=J-8+4|0;K=((c[F>>2]|0)>>>0)%(H>>>0);L=c[u>>2]|0;M=F+4|0;N=M;O=L+(K<<3)|0;P=c[O>>2]|0;do{if((P|0)==(x|0)){Q=L+(K<<3)+4|0;if((x|0)!=(c[Q>>2]|0)){r=2333;break}c[F+8>>2]=x;c[M>>2]=c[z>>2]|0;c[(c[z>>2]|0)+4>>2]=N;c[z>>2]=N;c[Q>>2]=N;break}else{r=2333}}while(0);if((r|0)==2333){r=0;c[F+8>>2]=P;K=P|0;c[M>>2]=c[K>>2]|0;c[(c[K>>2]|0)+4>>2]=N;c[K>>2]=N}c[O>>2]=N;if((I|0)==(x|0)){break L3010}else{J=I}}}}while(0);v=a[A]|0;L3029:do{if(v<<24>>24==0){R=5381}else{p=5381;H=A;K=v;while(1){L=(p*33&-1)+(K<<24>>24)|0;Q=H+1|0;S=a[Q]|0;if(S<<24>>24==0){R=L;break L3029}else{p=L;H=Q;K=S}}}}while(0);v=(R>>>0)%((c[5242976+(c[j>>2]<<2)>>2]|0)>>>0);K=c[u>>2]|0;H=K+(v<<3)|0;p=c[H>>2]|0;S=K+(v<<3)+4|0;do{if((p|0)==(x|0)){if((x|0)==(c[S>>2]|0)){r=2349;break}else{T=p;r=2339;break}}else{T=p;r=2339}}while(0);L3035:do{if((r|0)==2339){while(1){r=0;U=T-8+4|0;if((c[U>>2]|0)==(R|0)){if((aN(U+20|0,A|0)|0)==0){break}}if((T|0)==(c[S>>2]|0)){r=2349;break L3035}T=c[T+4>>2]|0}if((U|0)==0){r=2349;break}p=U+12|0;v=c[p>>2]|0;K=v;do{if((v|0)!=0){Q=v+4|0;L=c[Q>>2]|0;if((L|0)==-1){break}V=L-1|0;c[Q>>2]=V;if((V|0)!=0){break}c8(K)}}while(0);c[p>>2]=B;break}}while(0);if((r|0)==2349){r=0;K=(j8(A)|0)+21|0;if((K|0)==0){r=2356;break}v=j$(K)|0;if((v|0)==0){r=2356;break}c[v>>2]=R;c[v+16>>2]=E;kd(v+20|0,A);c[v+12>>2]=B;K=v+4|0;V=K;Q=v+8|0;c[Q>>2]=V;v=K;c[v>>2]=V;K=c[H>>2]|0;do{if((K|0)==(x|0)){if((x|0)!=(c[S>>2]|0)){r=2354;break}c[Q>>2]=x;c[v>>2]=c[z>>2]|0;c[(c[z>>2]|0)+4>>2]=V;c[z>>2]=V;c[S>>2]=V;break}else{r=2354}}while(0);if((r|0)==2354){r=0;c[Q>>2]=K;S=K|0;c[v>>2]=c[S>>2]|0;c[(c[S>>2]|0)+4>>2]=V;c[S>>2]=V}c[H>>2]=V;c[s>>2]=(c[s>>2]|0)+1|0}S=c[C>>2]|0;do{if((S|0)!=-1){E=S-1|0;c[C>>2]=E;if((E|0)!=0){break}c8(B)}}while(0);j0(A);c9(b,d);S=c[f>>2]|0;if((S|0)==125){l=o;r=2402;break}else if((S|0)!=44){r=2367;break}c9(b,d);if((c[f>>2]|0)!=256){r=2309;break L2999}}do{if((r|0)==2314){j0(A);break L2999}else if((r|0)==2402){i=e;return l|0}else if((r|0)==2367){c6(d,b,5245628,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);break L2999}else if((r|0)==2318){if((D|0)==-1){break}g=D-1|0;c[C>>2]=g;if((g|0)!=0){break}c8(B);break}else if((r|0)==2312){j0(A);c6(d,b,5245676,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);break L2999}else if((r|0)==2404){i=e;return l|0}else if((r|0)==2325){c[u>>2]=0;r=2356;break}}while(0);do{if((r|0)==2356){g=c[C>>2]|0;if((g|0)==-1){break}S=g-1|0;c[C>>2]=S;if((S|0)!=0){break}c8(B)}}while(0);j0(A);S=c[C>>2]|0;if((S|0)==-1){break}g=S-1|0;c[C>>2]=g;if((g|0)!=0){break}c8(B);break}}while(0);if((r|0)==2309){c6(d,b,5245768,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0)}r=c[m>>2]|0;if((r|0)==-1){l=0;i=e;return l|0}B=r-1|0;c[m>>2]=B;if((B|0)!=0){l=0;i=e;return l|0}c8(o);l=0;i=e;return l|0}else{c6(d,b,5245920,(w=i,i=i+1|0,i=i+3>>2<<2,c[w>>2]=0,w)|0);l=0;i=e;return l|0}return 0}function db(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;if(d>>>0>4294967293){return}e=b+36|0;c[e>>2]=(c[e>>2]|0)-1|0;do{if((d|0)==10){e=b+24|0;c[e>>2]=(c[e>>2]|0)-1|0;c[b+28>>2]=c[b+32>>2]|0}else{e=d&255;if(e<<24>>24<=-1){if((e&255)<192|(e+64&255)<2){break}if((e+32&255)>15&(e+62&255)>29&(e+16&255)>4){break}}e=b+28|0;c[e>>2]=(c[e>>2]|0)-1|0}}while(0);e=b+16|0;f=c[e>>2]|0;if((f|0)==0){bS(5245504,221,5249572,5245388);g=c[e>>2]|0}else{g=f}f=g-1|0;c[e>>2]=f;if((a[f+(b+8)|0]<<24>>24|0)==(d|0)){return}bS(5245504,223,5249572,5245292);return}function dc(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0;e=i;f=b+20|0;g=c[f>>2]|0;if((g|0)!=0){h=g;i=e;return h|0}g=b+16|0;j=c[g>>2]|0;L3115:do{if(a[j+(b+8)|0]<<24>>24==0){k=b|0;l=b+4|0;m=b2[c[k>>2]&1023](c[l>>2]|0)|0;if((m|0)==-1){c[f>>2]=-1;h=-1;i=e;return h|0}n=m&255;o=b+8|0;a[o]=n;c[g>>2]=0;if((m-128|0)>>>0>=128){a[b+9|0]=0;p=0;break}L3124:do{if(n<<24>>24>-1){bS(5245504,172,5249588,5245204)}else{if((n&255)<192|(n+64&255)<2){break}do{if((n+62&255)<30){q=2}else{if((n+32&255)<16){q=3;break}r=(n+16&255)<5;if(r){q=r?4:0}else{break L3124}}}while(0);r=1;while(1){a[r+(b+8)|0]=b2[c[k>>2]&1023](c[l>>2]|0)&255;s=r+1|0;if((s|0)<(q|0)){r=s}else{break}}r=a[o]|0;if((q|0)==2){t=r&31;u=2;v=1}else if((q|0)==3){t=r&15;u=3;v=0}else if((q|0)==4){t=r&7;u=4;v=0}else{break}r=1;s=t;while(1){x=a[r+(b+8)|0]|0;if(x<<24>>24>-1|(x&255)>191){break L3124}y=x&63|s<<6;x=r+1|0;if((x|0)<(u|0)){r=x;s=y}else{break}}if((y|0)>1114111|(y-55296|0)>>>0<2048|v&(y|0)<128){break}if((u|0)==3&(y|0)<2048){break}if((u|0)==4&(y|0)<65536){break}a[u+(b+8)|0]=0;p=c[g>>2]|0;break L3115}}while(0);c[f>>2]=-2;c6(d,b,5245156,(w=i,i=i+4|0,c[w>>2]=m,w)|0);h=-2;i=e;return h|0}else{p=j}}while(0);c[g>>2]=p+1|0;g=a[p+(b+8)|0]|0;p=g<<24>>24;j=b+36|0;c[j>>2]=(c[j>>2]|0)+1|0;if(g<<24>>24==10){j=b+24|0;c[j>>2]=(c[j>>2]|0)+1|0;j=b+28|0;c[b+32>>2]=c[j>>2]|0;c[j>>2]=0;h=p;i=e;return h|0}do{if(g<<24>>24<=-1){if((g&255)<192|(g+64&255)<2){h=p;i=e;return h|0}if((g+32&255)>15&(g+62&255)>29&(g+16&255)>4){h=p}else{break}i=e;return h|0}}while(0);g=b+28|0;c[g>>2]=(c[g>>2]|0)+1|0;h=p;i=e;return h|0}function dd(b){b=b|0;var c=0,d=0,e=0,f=0,g=0,h=0;if(a[b]<<24>>24!=117){bS(5245504,276,5249700,5244324)}c=a[b+1|0]|0;d=c<<24>>24;do{if((c-48&255)<10){e=d-48|0}else{if((c-97&255)<26){e=d-87|0;break}if((c-65&255)<26){e=d-55|0;break}else{bS(5245504,288,5249700,5244396);e=0;break}}}while(0);d=a[b+2|0]|0;c=e<<4;e=d<<24>>24;do{if((d-48&255)<10){f=(c-48|0)+e|0}else{if((d-97&255)<26){f=(c-87|0)+e|0;break}if((d-65&255)<26){f=(c-55|0)+e|0;break}else{bS(5245504,288,5249700,5244396);f=c;break}}}while(0);c=a[b+3|0]|0;e=f<<4;f=c<<24>>24;do{if((c-48&255)<10){g=(e-48|0)+f|0}else{if((c-97&255)<26){g=(e-87|0)+f|0;break}if((c-65&255)<26){g=(e-55|0)+f|0;break}else{bS(5245504,288,5249700,5244396);g=e;break}}}while(0);e=a[b+4|0]|0;b=g<<4;g=e<<24>>24;if((e-48&255)<10){h=(b-48|0)+g|0;return h|0}if((e-97&255)<26){h=(b-87|0)+g|0;return h|0}if((e-65&255)<26){h=(b-55|0)+g|0;return h|0}else{bS(5245504,288,5249700,5244396);h=b;return h|0}return 0}function de(a){a=a|0;var b=0;c[a>>2]=5259068;b=c[a+4>>2]|0;a=b+4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)|0)!=0){return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function df(a){a=a|0;var b=0;c[a>>2]=5259068;b=c[a+4>>2]|0;a=b+4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)|0)!=0){return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function dg(a){a=a|0;var b=0;c[a>>2]=5259e3;b=c[a+4>>2]|0;a=b+4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)|0)!=0){return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function dh(a){a=a|0;var b=0;c[a>>2]=5259e3;b=c[a+4>>2]|0;a=b+4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)|0)!=0){return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function di(a){a=a|0;eS(5265032);eS(5265116);eT(5264676);eT(5264760);return}function dj(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5259e3;b=c[a+4>>2]|0;d=b+4|0;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)!=0){e=a;j0(e);return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;j0(e);return}function dk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+12|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=cd[c[(c[a>>2]|0)+20>>2]&1023](a,g,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((az(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=2544;break}if((l|0)==2){m=-1;n=2545;break}else if((l|0)!=1){n=2541;break}}if((n|0)==2541){m=((aw(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==2544){i=b;return m|0}else if((n|0)==2545){i=b;return m|0}return 0}function dl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=(d|0)==-1;if(!k){l=g+4|0;m=b+24|0;n=b+20|0;c[n>>2]=g;o=b+28|0;c[o>>2]=l;c[g>>2]=d;c[m>>2]=l;L3247:do{if((a[b+48|0]&1)<<24>>24==0){p=f|0;c[h>>2]=p;q=b+36|0;r=b+40|0;s=f+8|0;t=f;u=b+32|0;v=g;w=l;while(1){x=c[q>>2]|0;y=b8[c[(c[x>>2]|0)+12>>2]&1023](x,r,v,w,j,p,s,h)|0;z=c[n>>2]|0;if((c[j>>2]|0)==(z|0)){A=-1;B=2561;break}if((y|0)==3){B=2552;break}if(y>>>0>=2){A=-1;B=2560;break}x=(c[h>>2]|0)-t|0;if((az(p|0,1,x|0,c[u>>2]|0)|0)!=(x|0)){A=-1;B=2565;break}if((y|0)!=1){break L3247}y=c[j>>2]|0;x=c[m>>2]|0;c[n>>2]=y;c[o>>2]=x;C=y+(x-y>>2<<2)|0;c[m>>2]=C;v=y;w=C}if((B|0)==2561){i=e;return A|0}else if((B|0)==2560){i=e;return A|0}else if((B|0)==2552){if((az(z|0,1,1,c[u>>2]|0)|0)==1){break}else{A=-1}i=e;return A|0}else if((B|0)==2565){i=e;return A|0}}else{if((az(g|0,4,1,c[b+32>>2]|0)|0)==1){break}else{A=-1}i=e;return A|0}}while(0);c[m>>2]=0;c[n>>2]=0;c[o>>2]=0}A=k?0:d;i=e;return A|0}function dm(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5259e3;b=c[a+4>>2]|0;d=b+4|0;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)!=0){e=a;j0(e);return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;j0(e);return}function dn(a){a=a|0;return du(a,0)|0}function dp(a){a=a|0;return du(a,1)|0}function dq(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;i=i+12|0;f=e|0;g=b|0;c[g>>2]=5259e3;h=b+4|0;j=c[h1()>>2]|0;c[h>>2]=j;k=j+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;k=b+8|0;c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;c[k+16>>2]=0;c[k+20>>2]=0;c[g>>2]=5259336;c[b+32>>2]=d;d=b+36|0;g=c[h>>2]|0;h=g+4|0;D=c[h>>2]|0,c[h>>2]=D+1,D;if((c[1316160]|0)!=-1){c[f>>2]=5264640;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264640,f)}f=(c[1316161]|0)-1|0;k=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-k>>2>>>0>f>>>0){j=c[k+(f<<2)>>2]|0;if((j|0)==0){break}if(((D=c[h>>2]|0,c[h>>2]=D+ -1,D)|0)!=0){l=j;c[d>>2]=l;m=b+40|0;n=m;o=0;p=0;q=n|0;c[q>>2]=o;r=n+4|0;c[r>>2]=p;s=b+48|0;t=j;u=c[t>>2]|0;v=u+28|0;w=c[v>>2]|0;x=b2[w&1023](l)|0;y=x&1;a[s]=y;i=e;return}b$[c[(c[g>>2]|0)+8>>2]&1023](g|0);l=j;c[d>>2]=l;m=b+40|0;n=m;o=0;p=0;q=n|0;c[q>>2]=o;r=n+4|0;c[r>>2]=p;s=b+48|0;t=j;u=c[t>>2]|0;v=u+28|0;w=c[v>>2]|0;x=b2[w&1023](l)|0;y=x&1;a[s]=y;i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function dr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;b2[c[(c[b>>2]|0)+24>>2]&1023](b);g=c[d>>2]|0;if((c[1316160]|0)!=-1){c[f>>2]=5264640;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264640,f)}f=(c[1316161]|0)-1|0;d=c[g+20>>2]|0;if((c[g+24>>2]|0)-d>>2>>>0<=f>>>0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}else{h=g;c[b+36>>2]=h;a[b+48|0]=b2[c[(c[g>>2]|0)+28>>2]&1023](h)&1;i=e;return}}function ds(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;g=c[d>>2]|0;if((c[1316160]|0)!=-1){c[f>>2]=5264640;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264640,f)}f=(c[1316161]|0)-1|0;d=c[g+20>>2]|0;if((c[g+24>>2]|0)-d>>2>>>0<=f>>>0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}h=g;j=b+36|0;c[j>>2]=h;f=b+48|0;c[f>>2]=b2[c[(c[g>>2]|0)+24>>2]&1023](h)|0;h=c[j>>2]|0;a[b+52|0]=b2[c[(c[h>>2]|0)+28>>2]&1023](h)&1;if((c[f>>2]|0)>>>0>8){hw(5243752)}else{i=e;return}}function dt(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;if((d|0)==-1){j=-1;i=e;return j|0}c[h>>2]=d;k=c[b+36>>2]|0;l=f|0;m=b8[c[(c[k>>2]|0)+12>>2]&1023](k,b+40|0,h,h+4|0,e+16|0,l,f+8|0,g)|0;if((m|0)==3){a[l]=d&255;c[g>>2]=f+1|0}else if((m|0)==2|(m|0)==1){j=-1;i=e;return j|0}m=b+32|0;while(1){b=c[g>>2]|0;if(b>>>0<=l>>>0){j=d;n=2618;break}f=b-1|0;c[g>>2]=f;if((bz(a[f]<<24>>24|0,c[m>>2]|0)|0)==-1){j=-1;n=2619;break}}if((n|0)==2619){i=e;return j|0}else if((n|0)==2618){i=e;return j|0}return 0}function du(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=c[b+48>>2]|0;l=(k|0)>1?k:1;L3326:do{if((l|0)>0){k=b+32|0;m=0;while(1){n=aR(c[k>>2]|0)|0;if((n&255|0)==255){o=-1;break}a[f+m|0]=n&255;n=m+1|0;if((n|0)<(l|0)){m=n}else{break L3326}}i=e;return o|0}}while(0);L3333:do{if((a[b+52|0]&1)<<24>>24==0){m=b+40|0;k=m;n=b+36|0;p=f|0;q=g+4|0;r=b+32|0;s=l;while(1){t=c[k>>2]|0;u=c[k+4>>2]|0;v=c[n>>2]|0;w=f+s|0;x=b8[c[(c[v>>2]|0)+16>>2]&1023](v,m,p,w,h,g,q,j)|0;if((x|0)==2){o=-1;y=2641;break}else if((x|0)==3){y=2630;break}else if((x|0)!=1){z=s;break L3333}c[k>>2]=t;c[k+4>>2]=u;if((s|0)==8){o=-1;y=2638;break}u=aR(c[r>>2]|0)|0;if((u&255|0)==255){o=-1;y=2640;break}a[w]=u&255;s=s+1|0}if((y|0)==2638){i=e;return o|0}else if((y|0)==2641){i=e;return o|0}else if((y|0)==2640){i=e;return o|0}else if((y|0)==2630){c[g>>2]=a[p]<<24>>24;z=s;break}}else{c[g>>2]=a[f|0]<<24>>24;z=l}}while(0);L3347:do{if(!d){l=b+32|0;y=z;while(1){if((y|0)<=0){break L3347}j=y-1|0;if((bz(a[f+j|0]<<24>>24|0,c[l>>2]|0)|0)==-1){o=-1;break}else{y=j}}i=e;return o|0}}while(0);o=c[g>>2]|0;i=e;return o|0}function dv(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5259068;b=c[a+4>>2]|0;d=b+4|0;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)!=0){e=a;j0(e);return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;j0(e);return}function dw(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;b=i;i=i+12|0;d=b|0;e=b+8|0;f=a+36|0;g=a+40|0;h=d|0;j=d+8|0;k=d;d=a+32|0;while(1){a=c[f>>2]|0;l=cd[c[(c[a>>2]|0)+20>>2]&1023](a,g,h,j,e)|0;a=(c[e>>2]|0)-k|0;if((az(h|0,1,a|0,c[d>>2]|0)|0)!=(a|0)){m=-1;n=2656;break}if((l|0)==2){m=-1;n=2655;break}else if((l|0)!=1){n=2652;break}}if((n|0)==2652){m=((aw(c[d>>2]|0)|0)!=0)<<31>>31;i=b;return m|0}else if((n|0)==2655){i=b;return m|0}else if((n|0)==2656){i=b;return m|0}return 0}function dx(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;j=e+16|0;k=(d|0)==-1;if(!k){l=g+1|0;m=b+24|0;n=b+20|0;c[n>>2]=g;o=b+28|0;c[o>>2]=l;a[g]=d&255;c[m>>2]=l;L3372:do{if((a[b+48|0]&1)<<24>>24==0){p=f|0;c[h>>2]=p;q=b+36|0;r=b+40|0;s=f+8|0;t=f;u=b+32|0;v=g;w=l;while(1){x=c[q>>2]|0;y=b8[c[(c[x>>2]|0)+12>>2]&1023](x,r,v,w,j,p,s,h)|0;z=c[n>>2]|0;if((c[j>>2]|0)==(z|0)){A=-1;B=2675;break}if((y|0)==3){B=2663;break}if(y>>>0>=2){A=-1;B=2672;break}x=(c[h>>2]|0)-t|0;if((az(p|0,1,x|0,c[u>>2]|0)|0)!=(x|0)){A=-1;B=2671;break}if((y|0)!=1){break L3372}y=c[j>>2]|0;x=c[m>>2]|0;c[n>>2]=y;c[o>>2]=x;C=y+(x-y|0)|0;c[m>>2]=C;v=y;w=C}if((B|0)==2675){i=e;return A|0}else if((B|0)==2663){if((az(z|0,1,1,c[u>>2]|0)|0)==1){break}else{A=-1}i=e;return A|0}else if((B|0)==2672){i=e;return A|0}else if((B|0)==2671){i=e;return A|0}}else{if((az(g|0,1,1,c[b+32>>2]|0)|0)==1){break}else{A=-1}i=e;return A|0}}while(0);c[m>>2]=0;c[n>>2]=0;c[o>>2]=0}A=k?0:d;i=e;return A|0}function dy(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5259068;b=c[a+4>>2]|0;d=b+4|0;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)!=0){e=a;j0(e);return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;j0(e);return}function dz(a){a=a|0;return dC(a,0)|0}function dA(a){a=a|0;return dC(a,1)|0}function dB(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;e=i;i=i+20|0;f=e|0;g=e+8|0;h=e+12|0;if((d|0)==-1){j=-1;i=e;return j|0}k=d&255;a[h]=k;l=c[b+36>>2]|0;m=f|0;n=b8[c[(c[l>>2]|0)+12>>2]&1023](l,b+40|0,h,h+1|0,e+16|0,m,f+8|0,g)|0;if((n|0)==3){a[m]=k;c[g>>2]=f+1|0}else if((n|0)==2|(n|0)==1){j=-1;i=e;return j|0}n=b+32|0;while(1){b=c[g>>2]|0;if(b>>>0<=m>>>0){j=d;o=2691;break}f=b-1|0;c[g>>2]=f;if((bz(a[f]<<24>>24|0,c[n>>2]|0)|0)==-1){j=-1;o=2693;break}}if((o|0)==2691){i=e;return j|0}else if((o|0)==2693){i=e;return j|0}return 0}function dC(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+20|0;g=f|0;h=f+8|0;j=f+12|0;k=f+16|0;l=c[b+48>>2]|0;m=(l|0)>1?l:1;L3414:do{if((m|0)>0){l=b+32|0;n=0;while(1){o=aR(c[l>>2]|0)|0;if((o&255|0)==255){p=-1;break}a[g+n|0]=o&255;o=n+1|0;if((o|0)<(m|0)){n=o}else{break L3414}}i=f;return p|0}}while(0);L3421:do{if((a[b+52|0]&1)<<24>>24==0){n=b+40|0;l=n;o=b+36|0;q=g|0;r=h+1|0;s=b+32|0;t=m;while(1){u=c[l>>2]|0;v=c[l+4>>2]|0;w=c[o>>2]|0;x=g+t|0;y=b8[c[(c[w>>2]|0)+16>>2]&1023](w,n,q,x,j,h,r,k)|0;if((y|0)==3){z=2705;break}else if((y|0)==2){p=-1;z=2718;break}else if((y|0)!=1){A=t;break L3421}c[l>>2]=u;c[l+4>>2]=v;if((t|0)==8){p=-1;z=2716;break}v=aR(c[s>>2]|0)|0;if((v&255|0)==255){p=-1;z=2713;break}a[x]=v&255;t=t+1|0}if((z|0)==2716){i=f;return p|0}else if((z|0)==2713){i=f;return p|0}else if((z|0)==2705){a[h]=a[q]|0;A=t;break}else if((z|0)==2718){i=f;return p|0}}else{a[h]=a[g|0]|0;A=m}}while(0);L3435:do{if(!e){m=b+32|0;z=A;while(1){if((z|0)<=0){break L3435}k=z-1|0;if((bz(a[g+k|0]<<24>>24|0,c[m>>2]|0)|0)==-1){p=-1;break}else{z=k}}i=f;return p|0}}while(0);p=d[h]|0;i=f;return p|0}function dD(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;e=i;i=i+12|0;f=e|0;g=b|0;c[g>>2]=5259068;h=b+4|0;j=c[h1()>>2]|0;c[h>>2]=j;k=j+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;k=b+8|0;c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;c[k+12>>2]=0;c[k+16>>2]=0;c[k+20>>2]=0;c[g>>2]=5259404;c[b+32>>2]=d;d=b+36|0;g=c[h>>2]|0;h=g+4|0;D=c[h>>2]|0,c[h>>2]=D+1,D;if((c[1316162]|0)!=-1){c[f>>2]=5264648;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264648,f)}f=(c[1316163]|0)-1|0;k=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-k>>2>>>0>f>>>0){j=c[k+(f<<2)>>2]|0;if((j|0)==0){break}if(((D=c[h>>2]|0,c[h>>2]=D+ -1,D)|0)!=0){l=j;c[d>>2]=l;m=b+40|0;n=m;o=0;p=0;q=n|0;c[q>>2]=o;r=n+4|0;c[r>>2]=p;s=b+48|0;t=j;u=c[t>>2]|0;v=u+28|0;w=c[v>>2]|0;x=b2[w&1023](l)|0;y=x&1;a[s]=y;i=e;return}b$[c[(c[g>>2]|0)+8>>2]&1023](g|0);l=j;c[d>>2]=l;m=b+40|0;n=m;o=0;p=0;q=n|0;c[q>>2]=o;r=n+4|0;c[r>>2]=p;s=b+48|0;t=j;u=c[t>>2]|0;v=u+28|0;w=c[v>>2]|0;x=b2[w&1023](l)|0;y=x&1;a[s]=y;i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function dE(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;b2[c[(c[b>>2]|0)+24>>2]&1023](b);g=c[d>>2]|0;if((c[1316162]|0)!=-1){c[f>>2]=5264648;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264648,f)}f=(c[1316163]|0)-1|0;d=c[g+20>>2]|0;if((c[g+24>>2]|0)-d>>2>>>0<=f>>>0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}else{h=g;c[b+36>>2]=h;a[b+48|0]=b2[c[(c[g>>2]|0)+28>>2]&1023](h)&1;i=e;return}}function dF(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0;e=i;i=i+12|0;f=e|0;g=c[d>>2]|0;if((c[1316162]|0)!=-1){c[f>>2]=5264648;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264648,f)}f=(c[1316163]|0)-1|0;d=c[g+20>>2]|0;if((c[g+24>>2]|0)-d>>2>>>0<=f>>>0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}g=c[d+(f<<2)>>2]|0;if((g|0)==0){h=bO(4)|0;j=h;c[j>>2]=5257492;bg(h|0,5262728,378)}h=g;j=b+36|0;c[j>>2]=h;f=b+48|0;c[f>>2]=b2[c[(c[g>>2]|0)+24>>2]&1023](h)|0;h=c[j>>2]|0;a[b+52|0]=b2[c[(c[h>>2]|0)+28>>2]&1023](h)&1;if((c[f>>2]|0)>>>0>8){hw(5243752)}else{i=e;return}}function dG(){var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,n=0,o=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0;b=i;i=i+120|0;d=b|0;e=b+12|0;f=b+24|0;g=b+36|0;h=b+48|0;j=b+60|0;k=b+72|0;l=b+84|0;n=b+96|0;o=b+108|0;s=c[m>>2]|0;c[1316108]=5259068;t=c[h1()>>2]|0;c[1316109]=t;u=t+4|0;D=c[u>>2]|0,c[u>>2]=D+1,D;c[1316110]=0;c[5264444>>2]=0;c[5264448>>2]=0;c[5264452>>2]=0;c[5264456>>2]=0;c[5264460>>2]=0;c[1316108]=5259780;c[1316116]=s;s=5264472;c[s>>2]=0;c[s+4>>2]=0;s=c[1316109]|0;u=s+4|0;D=c[u>>2]|0,c[u>>2]=D+1,D;if((c[1316162]|0)!=-1){c[e>>2]=5264648;c[e+4>>2]=28;c[e+8>>2]=0;dY(5264648,e)}e=(c[1316163]|0)-1|0;t=c[s+20>>2]|0;do{if((c[s+24>>2]|0)-t>>2>>>0>e>>>0){v=c[t+(e<<2)>>2]|0;if((v|0)==0){break}w=v;c[1316117]=w;c[1316120]=b2[c[(c[v>>2]|0)+24>>2]&1023](w)|0;w=c[1316117]|0;a[5264484]=b2[c[(c[w>>2]|0)+28>>2]&1023](w)&1;if((c[1316120]|0)>>>0>8){w=bO(8)|0;c[w>>2]=5257516;v=w+4|0;do{if((v|0)!=0){while(1){x=j$(50)|0;if((x|0)!=0){y=2775;break}z=(D=c[1316362]|0,c[1316362]=D+0,D);if((z|0)==0){break}b7[z&1023]()}if((y|0)==2775){c[x+4>>2]=37;c[x>>2]=37;z=x+12|0;c[v>>2]=z;c[x+8>>2]=0;j9(z,5243752,38);break}z=bO(4)|0;c[z>>2]=5257468;bg(z|0,5262716,348)}}while(0);bg(w|0,5262740,44)}if(((D=c[u>>2]|0,c[u>>2]=D+ -1,D)|0)==0){b$[c[(c[s>>2]|0)+8>>2]&1023](s|0)}aT(30,5264432,r|0);dD(5264328,c[q>>2]|0);aT(420,5264328,r|0);dD(5264380,c[p>>2]|0);aT(420,5264380,r|0);v=c[m>>2]|0;c[1316068]=5259e3;z=c[h1()>>2]|0;c[1316069]=z;A=z+4|0;D=c[A>>2]|0,c[A>>2]=D+1,D;c[1316070]=0;c[5264284>>2]=0;c[5264288>>2]=0;c[5264292>>2]=0;c[5264296>>2]=0;c[5264300>>2]=0;c[1316068]=5259712;c[1316076]=v;v=5264312;c[v>>2]=0;c[v+4>>2]=0;v=c[1316069]|0;A=v+4|0;D=c[A>>2]|0,c[A>>2]=D+1,D;if((c[1316160]|0)!=-1){c[d>>2]=5264640;c[d+4>>2]=28;c[d+8>>2]=0;dY(5264640,d)}z=(c[1316161]|0)-1|0;B=c[v+20>>2]|0;do{if((c[v+24>>2]|0)-B>>2>>>0>z>>>0){C=c[B+(z<<2)>>2]|0;if((C|0)==0){break}E=C;c[1316077]=E;c[1316080]=b2[c[(c[C>>2]|0)+24>>2]&1023](E)|0;E=c[1316077]|0;a[5264324]=b2[c[(c[E>>2]|0)+28>>2]&1023](E)&1;if((c[1316080]|0)>>>0>8){E=bO(8)|0;c[E>>2]=5257516;C=E+4|0;do{if((C|0)!=0){while(1){F=j$(50)|0;if((F|0)!=0){y=2812;break}G=(D=c[1316362]|0,c[1316362]=D+0,D);if((G|0)==0){break}b7[G&1023]()}if((y|0)==2812){c[F+4>>2]=37;c[F>>2]=37;G=F+12|0;c[C>>2]=G;c[F+8>>2]=0;j9(G,5243752,38);break}G=bO(4)|0;c[G>>2]=5257468;bg(G|0,5262716,348)}}while(0);bg(E|0,5262740,44)}if(((D=c[A>>2]|0,c[A>>2]=D+ -1,D)|0)==0){b$[c[(c[v>>2]|0)+8>>2]&1023](v|0)}aT(246,5264272,r|0);dq(5264168,c[q>>2]|0);aT(734,5264168,r|0);dq(5264220,c[p>>2]|0);aT(734,5264220,r|0);c[1316321]=5259272;c[1316323]=5259292;c[1316322]=0;c[1316329]=5264432;c[1316327]=0;c[1316328]=0;c[1316324]=4098;c[1316326]=0;c[1316325]=6;kb(5265324,0,40);C=c[h1()>>2]|0;c[1316330]=C;G=C+4|0;D=c[G>>2]|0,c[G>>2]=D+1,D;c[1316341]=0;G=c[1316330]|0;C=G+4|0;D=c[C>>2]|0,c[C>>2]=D+1,D;if((c[1316234]|0)!=-1){c[o>>2]=5264936;c[o+4>>2]=28;c[o+8>>2]=0;dY(5264936,o)}H=(c[1316235]|0)-1|0;I=c[G+20>>2]|0;do{if((c[G+24>>2]|0)-I>>2>>>0>H>>>0){J=c[I+(H<<2)>>2]|0;if((J|0)==0){break}K=cc[c[(c[J>>2]|0)+28>>2]&1023](J,32)|0;if(((D=c[C>>2]|0,c[C>>2]=D+ -1,D)|0)==0){b$[c[(c[G>>2]|0)+8>>2]&1023](G)}a[5265368]=K;aT(300,5265284,r|0);c[1316258]=5259184;c[1316259]=5259204;c[1316265]=5264328;c[1316263]=0;c[1316264]=0;c[1316260]=4098;c[1316262]=0;c[1316261]=6;kb(5265068,0,40);K=c[h1()>>2]|0;c[1316266]=K;J=K+4|0;D=c[J>>2]|0,c[J>>2]=D+1,D;c[1316277]=0;J=c[1316266]|0;K=J+4|0;D=c[K>>2]|0,c[K>>2]=D+1,D;if((c[1316234]|0)!=-1){c[n>>2]=5264936;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264936,n)}L=(c[1316235]|0)-1|0;M=c[J+20>>2]|0;do{if((c[J+24>>2]|0)-M>>2>>>0>L>>>0){N=c[M+(L<<2)>>2]|0;if((N|0)==0){break}O=cc[c[(c[N>>2]|0)+28>>2]&1023](N,32)|0;if(((D=c[K>>2]|0,c[K>>2]=D+ -1,D)|0)==0){b$[c[(c[J>>2]|0)+8>>2]&1023](J)}a[5265112]=O;aT(652,5265032,r|0);c[1316300]=5259184;c[1316301]=5259204;c[1316307]=5264380;c[1316305]=0;c[1316306]=0;c[1316302]=4098;c[1316304]=0;c[1316303]=6;kb(5265236,0,40);O=c[h1()>>2]|0;c[1316308]=O;N=O+4|0;D=c[N>>2]|0,c[N>>2]=D+1,D;c[1316319]=0;N=c[1316308]|0;O=N+4|0;D=c[O>>2]|0,c[O>>2]=D+1,D;if((c[1316234]|0)!=-1){c[l>>2]=5264936;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264936,l)}P=(c[1316235]|0)-1|0;Q=c[N+20>>2]|0;do{if((c[N+24>>2]|0)-Q>>2>>>0>P>>>0){R=c[Q+(P<<2)>>2]|0;if((R|0)==0){break}S=cc[c[(c[R>>2]|0)+28>>2]&1023](R,32)|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)==0){b$[c[(c[N>>2]|0)+8>>2]&1023](N)}a[5265280]=S;aT(652,5265200,r|0);c[1316279]=5259184;c[1316280]=5259204;c[1316286]=5264380;c[1316284]=0;c[1316285]=0;c[1316281]=4098;c[1316283]=0;c[1316282]=6;kb(5265152,0,40);S=c[h1()>>2]|0;c[1316287]=S;R=S+4|0;D=c[R>>2]|0,c[R>>2]=D+1,D;c[1316298]=0;R=c[1316287]|0;S=R+4|0;D=c[S>>2]|0,c[S>>2]=D+1,D;if((c[1316234]|0)!=-1){c[k>>2]=5264936;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264936,k)}T=(c[1316235]|0)-1|0;U=c[R+20>>2]|0;do{if((c[R+24>>2]|0)-U>>2>>>0>T>>>0){V=c[U+(T<<2)>>2]|0;if((V|0)==0){break}W=cc[c[(c[V>>2]|0)+28>>2]&1023](V,32)|0;if(((D=c[S>>2]|0,c[S>>2]=D+ -1,D)|0)==0){b$[c[(c[R>>2]|0)+8>>2]&1023](R)}a[5265196]=W;aT(652,5265116,r|0);c[1316236]=5259228;c[1316238]=5259248;c[1316237]=0;c[1316244]=5264272;c[1316242]=0;c[1316243]=0;c[1316239]=4098;c[1316241]=0;c[1316240]=6;kb(5264984,0,40);W=c[h1()>>2]|0;c[1316245]=W;V=W+4|0;D=c[V>>2]|0,c[V>>2]=D+1,D;c[1316256]=0;V=c[1316245]|0;W=V+4|0;D=c[W>>2]|0,c[W>>2]=D+1,D;if((c[1316232]|0)!=-1){c[j>>2]=5264928;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264928,j)}X=(c[1316233]|0)-1|0;Y=c[V+20>>2]|0;do{if((c[V+24>>2]|0)-Y>>2>>>0>X>>>0){Z=c[Y+(X<<2)>>2]|0;if((Z|0)==0){break}_=cc[c[(c[Z>>2]|0)+44>>2]&1023](Z,32)|0;if(((D=c[W>>2]|0,c[W>>2]=D+ -1,D)|0)==0){b$[c[(c[V>>2]|0)+8>>2]&1023](V)}c[1316257]=_;aT(244,5264944,r|0);c[1316169]=5259140;c[1316170]=5259160;c[1316176]=5264168;c[1316174]=0;c[1316175]=0;c[1316171]=4098;c[1316173]=0;c[1316172]=6;kb(5264712,0,40);_=c[h1()>>2]|0;c[1316177]=_;Z=_+4|0;D=c[Z>>2]|0,c[Z>>2]=D+1,D;c[1316188]=0;Z=c[1316177]|0;_=Z+4|0;D=c[_>>2]|0,c[_>>2]=D+1,D;if((c[1316232]|0)!=-1){c[h>>2]=5264928;c[h+4>>2]=28;c[h+8>>2]=0;dY(5264928,h)}$=(c[1316233]|0)-1|0;aa=c[Z+20>>2]|0;do{if((c[Z+24>>2]|0)-aa>>2>>>0>$>>>0){ab=c[aa+($<<2)>>2]|0;if((ab|0)==0){break}ac=cc[c[(c[ab>>2]|0)+44>>2]&1023](ab,32)|0;if(((D=c[_>>2]|0,c[_>>2]=D+ -1,D)|0)==0){b$[c[(c[Z>>2]|0)+8>>2]&1023](Z)}c[1316189]=ac;aT(104,5264676,r|0);c[1316211]=5259140;c[1316212]=5259160;c[1316218]=5264220;c[1316216]=0;c[1316217]=0;c[1316213]=4098;c[1316215]=0;c[1316214]=6;kb(5264880,0,40);ac=c[h1()>>2]|0;c[1316219]=ac;ab=ac+4|0;D=c[ab>>2]|0,c[ab>>2]=D+1,D;c[1316230]=0;ab=c[1316219]|0;ac=ab+4|0;D=c[ac>>2]|0,c[ac>>2]=D+1,D;if((c[1316232]|0)!=-1){c[g>>2]=5264928;c[g+4>>2]=28;c[g+8>>2]=0;dY(5264928,g)}ad=(c[1316233]|0)-1|0;ae=c[ab+20>>2]|0;do{if((c[ab+24>>2]|0)-ae>>2>>>0>ad>>>0){af=c[ae+(ad<<2)>>2]|0;if((af|0)==0){break}ag=cc[c[(c[af>>2]|0)+44>>2]&1023](af,32)|0;if(((D=c[ac>>2]|0,c[ac>>2]=D+ -1,D)|0)==0){b$[c[(c[ab>>2]|0)+8>>2]&1023](ab)}c[1316231]=ag;aT(104,5264844,r|0);c[1316190]=5259140;c[1316191]=5259160;c[1316197]=5264220;c[1316195]=0;c[1316196]=0;c[1316192]=4098;c[1316194]=0;c[1316193]=6;kb(5264796,0,40);ag=c[h1()>>2]|0;c[1316198]=ag;af=ag+4|0;D=c[af>>2]|0,c[af>>2]=D+1,D;c[1316209]=0;af=c[1316198]|0;ag=af+4|0;D=c[ag>>2]|0,c[ag>>2]=D+1,D;if((c[1316232]|0)!=-1){c[f>>2]=5264928;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264928,f)}ah=(c[1316233]|0)-1|0;ai=c[af+20>>2]|0;do{if((c[af+24>>2]|0)-ai>>2>>>0>ah>>>0){aj=c[ai+(ah<<2)>>2]|0;if((aj|0)==0){break}ak=cc[c[(c[aj>>2]|0)+44>>2]&1023](aj,32)|0;if(((D=c[ag>>2]|0,c[ag>>2]=D+ -1,D)|0)!=0){c[1316210]=ak;al=aT(104,5264760,r|0)|0;am=c[1316321]|0;an=am-12|0;ao=an;ap=c[ao>>2]|0;aq=ap+72|0;ar=aq+5265284|0;as=ar;c[as>>2]=5265032;at=c[1316300]|0;au=at-12|0;av=au;aw=c[av>>2]|0;ax=aw+4|0;ay=ax+5265200|0;az=ay;aA=c[az>>2]|0;aB=aA|8192;c[az>>2]=aB;aC=c[1316300]|0;aD=aC-12|0;aE=aD;aF=c[aE>>2]|0;aG=aF+72|0;aH=aG+5265200|0;aI=aH;c[aI>>2]=5265032;aJ=c[1316236]|0;aK=aJ-12|0;aL=aK;aM=c[aL>>2]|0;aN=aM+72|0;aO=aN+5264944|0;aP=aO;c[aP>>2]=5264676;aQ=c[1316211]|0;aR=aQ-12|0;aS=aR;aU=c[aS>>2]|0;aV=aU+4|0;aW=aV+5264844|0;aX=aW;aY=c[aX>>2]|0;aZ=aY|8192;c[aX>>2]=aZ;a_=c[1316211]|0;a$=a_-12|0;a0=a$;a1=c[a0>>2]|0;a2=a1+72|0;a3=a2+5264844|0;a4=a3;c[a4>>2]=5264676;a5=aT(268,5265372,r|0)|0;i=b;return}b$[c[(c[af>>2]|0)+8>>2]&1023](af);c[1316210]=ak;al=aT(104,5264760,r|0)|0;am=c[1316321]|0;an=am-12|0;ao=an;ap=c[ao>>2]|0;aq=ap+72|0;ar=aq+5265284|0;as=ar;c[as>>2]=5265032;at=c[1316300]|0;au=at-12|0;av=au;aw=c[av>>2]|0;ax=aw+4|0;ay=ax+5265200|0;az=ay;aA=c[az>>2]|0;aB=aA|8192;c[az>>2]=aB;aC=c[1316300]|0;aD=aC-12|0;aE=aD;aF=c[aE>>2]|0;aG=aF+72|0;aH=aG+5265200|0;aI=aH;c[aI>>2]=5265032;aJ=c[1316236]|0;aK=aJ-12|0;aL=aK;aM=c[aL>>2]|0;aN=aM+72|0;aO=aN+5264944|0;aP=aO;c[aP>>2]=5264676;aQ=c[1316211]|0;aR=aQ-12|0;aS=aR;aU=c[aS>>2]|0;aV=aU+4|0;aW=aV+5264844|0;aX=aW;aY=c[aX>>2]|0;aZ=aY|8192;c[aX>>2]=aZ;a_=c[1316211]|0;a$=a_-12|0;a0=a$;a1=c[a0>>2]|0;a2=a1+72|0;a3=a2+5264844|0;a4=a3;c[a4>>2]=5264676;a5=aT(268,5265372,r|0)|0;i=b;return}}while(0);af=bO(4)|0;c[af>>2]=5257492;bg(af|0,5262728,378)}}while(0);ab=bO(4)|0;c[ab>>2]=5257492;bg(ab|0,5262728,378)}}while(0);Z=bO(4)|0;c[Z>>2]=5257492;bg(Z|0,5262728,378)}}while(0);V=bO(4)|0;c[V>>2]=5257492;bg(V|0,5262728,378)}}while(0);R=bO(4)|0;c[R>>2]=5257492;bg(R|0,5262728,378)}}while(0);N=bO(4)|0;c[N>>2]=5257492;bg(N|0,5262728,378)}}while(0);J=bO(4)|0;c[J>>2]=5257492;bg(J|0,5262728,378)}}while(0);G=bO(4)|0;c[G>>2]=5257492;bg(G|0,5262728,378)}}while(0);v=bO(4)|0;c[v>>2]=5257492;bg(v|0,5262728,378)}}while(0);b=bO(4)|0;c[b>>2]=5257492;bg(b|0,5262728,378)}function dH(a){a=a|0;return c[a+4>>2]|0}function dI(a){a=a|0;return c[a+4>>2]|0}function dJ(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function dK(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[b+4>>2]|0)!=(a|0)){e=0;return e|0}e=(c[b>>2]|0)==(d|0);return e|0}function dL(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5257564;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){j0(e)}if((a|0)!=0){break}return}}while(0);j0(a);return}function dM(a){a=a|0;var b=0;c[a>>2]=5257564;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}j0(a);return}function dN(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5257516;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){j0(e)}if((a|0)!=0){break}return}}while(0);j0(a);return}function dO(a){a=a|0;var b=0;c[a>>2]=5257516;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}j0(a);return}function dP(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5257564;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){j0(e)}if((a|0)!=0){break}return}}while(0);j0(a);return}function dQ(a){a=a|0;var b=0;c[a>>2]=5257564;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}j0(a);return}function dR(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+8|0;f=e|0;bZ[c[(c[a>>2]|0)+12>>2]&1023](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){g=0;i=e;return g|0}g=(c[f>>2]|0)==(c[d>>2]|0);i=e;return g|0}function dS(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5257516;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){j0(e)}if((a|0)!=0){break}return}}while(0);j0(a);return}function dT(a){a=a|0;var b=0;c[a>>2]=5257516;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}j0(a);return}function dU(b){b=b|0;var d=0;if((a[b]&1)<<24>>24==0){return}d=c[b+8>>2]|0;if((d|0)==0){return}j0(d);return}function dV(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((b|0)==(d|0)){return}e=a[d]|0;if((e&1)<<24>>24==0){f=d+1|0}else{f=c[d+8>>2]|0}g=e&255;if((g&1|0)==0){h=g>>>1}else{h=c[d+4>>2]|0}d=b;g=b;e=a[g]|0;if((e&1)<<24>>24==0){i=10;j=e}else{e=c[b>>2]|0;i=(e&-2)-1|0;j=e&255}if(i>>>0<h>>>0){e=j&255;if((e&1|0)==0){k=e>>>1}else{k=c[b+4>>2]|0}d_(b,i,h-i|0,k,0,k,h,f);return}if((j&1)<<24>>24==0){l=d+1|0}else{l=c[b+8>>2]|0}ke(l,f,h);a[l+h|0]=0;if((a[g]&1)<<24>>24==0){a[g]=h<<1&255;return}else{c[b+4>>2]=h;return}}function dW(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=j8(d)|0;f=b;g=b;h=a[g]|0;if((h&1)<<24>>24==0){i=10;j=h}else{h=c[b>>2]|0;i=(h&-2)-1|0;j=h&255}if(i>>>0<e>>>0){h=j&255;if((h&1|0)==0){k=h>>>1}else{k=c[b+4>>2]|0}d_(b,i,e-i|0,k,0,k,e,d);return}if((j&1)<<24>>24==0){l=f+1|0}else{l=c[b+8>>2]|0}ke(l,d,e);a[l+e|0]=0;if((a[g]&1)<<24>>24==0){a[g]=e<<1&255;return}else{c[b+4>>2]=e;return}}function dX(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;g=a[f]|0;if((g&1)<<24>>24==0){h=10;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}g=i&255;if((g&1|0)==0){j=g>>>1}else{j=c[b+4>>2]|0}if((h-j|0)>>>0<e>>>0){d_(b,h,(e-h|0)+j|0,j,j,0,e,d);return}if((e|0)==0){return}if((i&1)<<24>>24==0){k=b+1|0}else{k=c[b+8>>2]|0}j9(k+j|0,d,e);d=j+e|0;if((a[f]&1)<<24>>24==0){a[f]=d<<1&255}else{c[b+4>>2]=d}a[k+d|0]=0;return}function dY(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d;L3805:do{if((c[a>>2]|0)==1){while(1){aL(5264492,5264488);if((c[a>>2]|0)!=1){break L3805}}}}while(0);if((c[a>>2]|0)!=0){e;return}c[a>>2]=1;f;f=b+4|0;e=(c[b>>2]|0)+(c[f+4>>2]|0)|0;b=c[f>>2]|0;if((b&1|0)==0){g=b}else{g=c[(c[e>>2]|0)+(b-1|0)>>2]|0}b$[g&1023](e);h;c[a>>2]=-1;i;bq(5264492);return}function dZ(){var a=0,b=0,d=0,e=0,f=0,g=0;a=bO(8)|0;c[a>>2]=5257564;b=a+4|0;d=b;if((b|0)==0){e=a;c[e>>2]=5257540;bg(a|0,5262752,70)}while(1){f=j$(25)|0;if((f|0)!=0){g=3139;break}b=(D=c[1316362]|0,c[1316362]=D+0,D);if((b|0)==0){g=3133;break}b7[b&1023]()}if((g|0)==3133){b=bO(4)|0;c[b>>2]=5257468;bg(b|0,5262716,348)}else if((g|0)==3139){c[f+4>>2]=12;c[f>>2]=12;g=f+12|0;c[d>>2]=g;c[f+8>>2]=0;j9(g,5244400,13);e=a;c[e>>2]=5257540;bg(a|0,5262752,70)}}function d_(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((-3-d|0)>>>0<e>>>0){dZ()}if((a[b]&1)<<24>>24==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483631){l=e+d|0;m=d<<1;n=l>>>0<m>>>0?m:l;if(n>>>0<11){o=11;break}o=n+16&-16}else{o=-2}}while(0);e=(o|0)==0?1:o;while(1){p=j$(e)|0;if((p|0)!=0){break}n=(D=c[1316362]|0,c[1316362]=D+0,D);if((n|0)==0){q=3161;break}b7[n&1023]()}if((q|0)==3161){q=bO(4)|0;c[q>>2]=5257468;bg(q|0,5262716,348)}if((g|0)!=0){j9(p,k,g)}if((i|0)!=0){j9(p+g|0,j,i)}j=f-h|0;if((j|0)!=(g|0)){j9(p+(i+g|0)|0,k+(h+g|0)|0,j-g|0)}if((d|0)==10|(k|0)==0){r=b+8|0;c[r>>2]=p;s=o|1;t=b|0;c[t>>2]=s;u=j+i|0;v=b+4|0;c[v>>2]=u;w=p+u|0;a[w]=0;return}j0(k);r=b+8|0;c[r>>2]=p;s=o|1;t=b|0;c[t>>2]=s;u=j+i|0;v=b+4|0;c[v>>2]=u;w=p+u|0;a[w]=0;return}function d$(b){b=b|0;var d=0;if((a[b]&1)<<24>>24==0){return}d=c[b+8>>2]|0;if((d|0)==0){return}j0(d);return}function d0(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((-3-d|0)>>>0<e>>>0){dZ()}if((a[b]&1)<<24>>24==0){h=b+1|0}else{h=c[b+8>>2]|0}do{if(d>>>0<2147483631){i=e+d|0;j=d<<1;k=i>>>0<j>>>0?j:i;if(k>>>0<11){l=11;break}l=k+16&-16}else{l=-2}}while(0);e=(l|0)==0?1:l;while(1){m=j$(e)|0;if((m|0)!=0){break}k=(D=c[1316362]|0,c[1316362]=D+0,D);if((k|0)==0){n=3198;break}b7[k&1023]()}if((n|0)==3198){n=bO(4)|0;c[n>>2]=5257468;bg(n|0,5262716,348)}if((g|0)!=0){j9(m,h,g)}if((f|0)!=(g|0)){j9(m+g|0,h+g|0,f-g|0)}if((d|0)==10|(h|0)==0){o=b+8|0;c[o>>2]=m;p=l|1;q=b|0;c[q>>2]=p;return}j0(h);o=b+8|0;c[o>>2]=m;p=l|1;q=b|0;c[q>>2]=p;return}function d1(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;if((1073741821-d|0)>>>0<e>>>0){dZ()}if((a[b]&1)<<24>>24==0){h=b+4|0}else{h=c[b+8>>2]|0}do{if(d>>>0<536870895){i=e+d|0;j=d<<1;k=i>>>0<j>>>0?j:i;if(k>>>0<2){l=2;break}l=k+4&-4}else{l=1073741822}}while(0);e=l<<2;k=(e|0)==0?1:e;while(1){m=j$(k)|0;if((m|0)!=0){break}e=(D=c[1316362]|0,c[1316362]=D+0,D);if((e|0)==0){n=3226;break}b7[e&1023]()}if((n|0)==3226){n=bO(4)|0;c[n>>2]=5257468;bg(n|0,5262716,348)}n=m;if((g|0)!=0){bJ(n|0,h|0,g|0)}if((f|0)!=(g|0)){m=f-g|0;f=n+(g<<2)|0;k=h+(g<<2)|0;bJ(f|0,k|0,m|0)}if((d|0)==1|(h|0)==0){o=b+8|0;c[o>>2]=n;p=l|1;q=b|0;c[q>>2]=p;return}j0(h);o=b+8|0;c[o>>2]=n;p=l|1;q=b|0;c[q>>2]=p;return}function d2(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b;g=a[f]|0;if((g&1)<<24>>24==0){h=1;i=g}else{g=c[b>>2]|0;h=(g&-2)-1|0;i=g&255}if(h>>>0>=e>>>0){if((i&1)<<24>>24==0){j=b+4|0}else{j=c[b+8>>2]|0}bf(j|0,d|0,e|0);c[j+(e<<2)>>2]=0;if((a[f]&1)<<24>>24==0){a[f]=e<<1&255;return}else{c[b+4>>2]=e;return}}if((1073741821-h|0)>>>0<(e-h|0)>>>0){dZ()}if((i&1)<<24>>24==0){k=b+4|0}else{k=c[b+8>>2]|0}do{if(h>>>0<536870895){i=h<<1;f=i>>>0>e>>>0?i:e;if(f>>>0<2){l=2;break}l=f+4&-4}else{l=1073741822}}while(0);f=l<<2;i=(f|0)==0?1:f;while(1){m=j$(i)|0;if((m|0)!=0){break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){n=3263;break}b7[f&1023]()}if((n|0)==3263){n=bO(4)|0;c[n>>2]=5257468;bg(n|0,5262716,348)}n=m;if((e|0)!=0){bJ(n|0,d|0,e|0)}if(!((h|0)==1|(k|0)==0)){j0(k)}c[b+8>>2]=n;c[b>>2]=l|1;c[b+4>>2]=e;c[n+(e<<2)>>2]=0;return}function d3(){b7[(D=c[1316361]|0,c[1316361]=D+0,D)&1023]();bE();return}function d4(a,b){a=a|0;b=b|0;return}function d5(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function d6(a){a=a|0;return 0}function d7(a){a=a|0;return 0}function d8(a){a=a|0;return-1|0}function d9(a,b){a=a|0;b=b|0;return-1|0}function ea(a,b){a=a|0;b=b|0;return-1|0}function eb(a,b){a=a|0;b=b|0;return}function ec(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function ed(a){a=a|0;return 0}function ee(a){a=a|0;return 0}function ef(a){a=a|0;return-1|0}function eg(a,b){a=a|0;b=b|0;return-1|0}function eh(a,b){a=a|0;b=b|0;return-1|0}function ei(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function ej(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2]|0;c[d+4>>2]=c[b+4>>2]|0;c[d+8>>2]=c[b+8>>2]|0;c[d+12>>2]=c[b+12>>2]|0;b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function ek(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function el(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;e=i;b=d;d=i;i=i+16|0;c[d>>2]=c[b>>2]|0;c[d+4>>2]=c[b+4>>2]|0;c[d+8>>2]=c[b+8>>2]|0;c[d+12>>2]=c[b+12>>2]|0;b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function em(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;c[a>>2]=5258108;b=c[a+40>>2]|0;L3999:do{if((b|0)!=0){d=a+32|0;e=a+36|0;f=b;while(1){g=f-1|0;bZ[c[(c[d>>2]|0)+(g<<2)>>2]&1023](0,a,c[(c[e>>2]|0)+(g<<2)>>2]|0);if((g|0)==0){break L3999}else{f=g}}}}while(0);b=c[a+28>>2]|0;f=b+4|0;if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[b>>2]|0)+8>>2]&1023](b)}j0(c[a+32>>2]|0);j0(c[a+36>>2]|0);j0(c[a+48>>2]|0);j0(c[a+60>>2]|0);return}function en(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5259068;b=c[a+4>>2]|0;d=b+4|0;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)!=0){e=a;j0(e);return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;j0(e);return}function eo(a){a=a|0;var b=0;c[a>>2]=5259068;b=c[a+4>>2]|0;a=b+4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)|0)!=0){return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function ep(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+12|0;i=b+16|0;j=d;d=0;while(1){k=c[h>>2]|0;if(k>>>0<(c[i>>2]|0)>>>0){c[h>>2]=k+1|0;l=a[k]|0}else{k=b2[c[(c[f>>2]|0)+40>>2]&1023](b)|0;if((k|0)==-1){g=d;m=3328;break}l=k&255}a[j]=l;k=d+1|0;if((k|0)<(e|0)){j=j+1|0;d=k}else{g=k;m=3327;break}}if((m|0)==3328){return g|0}else if((m|0)==3327){return g|0}return 0}function eq(a){a=a|0;var b=0,e=0;if((b2[c[(c[a>>2]|0)+36>>2]&1023](a)|0)==-1){b=-1;return b|0}e=a+12|0;a=c[e>>2]|0;c[e>>2]=a+1|0;b=d[a]|0;return b|0}function er(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=b;if((e|0)<=0){g=0;return g|0}h=b+24|0;i=b+28|0;j=0;k=d;while(1){d=c[h>>2]|0;if(d>>>0<(c[i>>2]|0)>>>0){l=a[k]|0;c[h>>2]=d+1|0;a[d]=l}else{if((cc[c[(c[f>>2]|0)+52>>2]&1023](b,a[k]<<24>>24)|0)==-1){g=j;m=3343;break}}l=j+1|0;if((l|0)<(e|0)){j=l;k=k+1|0}else{g=l;m=3341;break}}if((m|0)==3341){return g|0}else if((m|0)==3343){return g|0}return 0}function es(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5259e3;b=c[a+4>>2]|0;d=b+4|0;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)!=0){e=a;j0(e);return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);e=a;j0(e);return}function et(a){a=a|0;var b=0;c[a>>2]=5259e3;b=c[a+4>>2]|0;a=b+4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)|0)!=0){return}b$[c[(c[b>>2]|0)+8>>2]&1023](b|0);return}function eu(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+12|0;h=a+16|0;i=b;b=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+4|0;k=c[j>>2]|0}else{j=b2[c[(c[e>>2]|0)+40>>2]&1023](a)|0;if((j|0)==-1){f=b;l=3362;break}else{k=j}}c[i>>2]=k;j=b+1|0;if((j|0)<(d|0)){i=i+4|0;b=j}else{f=j;l=3361;break}}if((l|0)==3362){return f|0}else if((l|0)==3361){return f|0}return 0}function ev(a){a=a|0;var b=0,d=0;if((b2[c[(c[a>>2]|0)+36>>2]&1023](a)|0)==-1){b=-1;return b|0}d=a+12|0;a=c[d>>2]|0;c[d>>2]=a+4|0;b=c[a>>2]|0;return b|0}function ew(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a;if((d|0)<=0){f=0;return f|0}g=a+24|0;h=a+28|0;i=0;j=b;while(1){b=c[g>>2]|0;if(b>>>0<(c[h>>2]|0)>>>0){k=c[j>>2]|0;c[g>>2]=b+4|0;c[b>>2]=k}else{if((cc[c[(c[e>>2]|0)+52>>2]&1023](a,c[j>>2]|0)|0)==-1){f=i;l=3377;break}}k=i+1|0;if((k|0)<(d|0)){i=k;j=j+4|0}else{f=k;l=3378;break}}if((l|0)==3378){return f|0}else if((l|0)==3377){return f|0}return 0}function ex(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+36|0;g=f|0;h=f+12|0;j=f+24|0;k=(c[b+24>>2]|0)==0;if(k){c[b+16>>2]=e|1}else{c[b+16>>2]=e}if(((k&1|e)&c[b+20>>2]|0)==0){i=f;return}f=bO(16)|0;do{if(a[5265524]<<24>>24==0){if((a7(5265524)|0)==0){break}c[1312890]=5258856}}while(0);b=h;e=j;while(1){l=j$(16)|0;if((l|0)!=0){break}k=(D=c[1316362]|0,c[1316362]=D+0,D);if((k|0)==0){m=3395;break}b7[k&1023]()}if((m|0)==3395){k=bO(4)|0;c[k>>2]=5257468;bg(k|0,5262716,348)}k=j+8|0;c[k>>2]=l;c[j>>2]=17;n=j+4|0;c[n>>2]=15;j9(l,5247764,15);a[l+15|0]=0;l=g;o=d[e]|0;if((((o&1|0)==0?o>>>1:c[n>>2]|0)|0)!=0){dX(j,5248568,2)}bZ[c[(c[1312890]|0)+24>>2]&1023](g,5251560,1);o=a[l]|0;if((o&1)<<24>>24==0){p=g+1|0}else{p=c[g+8>>2]|0}q=o&255;if((q&1|0)==0){r=q>>>1}else{r=c[g+4>>2]|0}dX(j,p,r);do{if((a[l]&1)<<24>>24!=0){r=c[g+8>>2]|0;if((r|0)==0){break}j0(r)}}while(0);if((a[e]&1)<<24>>24==0){c[b>>2]=c[e>>2]|0;c[b+4>>2]=c[e+4>>2]|0;c[b+8>>2]=c[e+8>>2]|0}else{g=c[k>>2]|0;l=c[n>>2]|0;if((l|0)==-1){dZ()}do{if(l>>>0<11){a[b]=l<<1&255;s=h+1|0}else{n=l+16&-16;r=(n|0)==0?1:n;while(1){t=j$(r)|0;if((t|0)!=0){m=3431;break}p=(D=c[1316362]|0,c[1316362]=D+0,D);if((p|0)==0){break}b7[p&1023]()}if((m|0)==3431){c[h+8>>2]=t;c[h>>2]=n|1;c[h+4>>2]=l;s=t;break}r=bO(4)|0;c[r>>2]=5257468;bg(r|0,5262716,348)}}while(0);j9(s,g,l);a[s+l|0]=0}l=f;c[l>>2]=5257516;s=f+4|0;g=s;do{if((s|0)!=0){if((a[b]&1)<<24>>24==0){u=h+1|0}else{u=c[h+8>>2]|0}t=j8(u)|0;r=t+13|0;p=(r|0)==0?1:r;while(1){v=j$(p)|0;if((v|0)!=0){m=3448;break}r=(D=c[1316362]|0,c[1316362]=D+0,D);if((r|0)==0){break}b7[r&1023]()}if((m|0)==3448){c[v+4>>2]=t;c[v>>2]=t;p=v+12|0;c[g>>2]=p;c[v+8>>2]=0;kd(p,u);break}p=bO(4)|0;c[p>>2]=5257468;bg(p|0,5262716,348)}}while(0);do{if((a[b]&1)<<24>>24!=0){u=c[h+8>>2]|0;if((u|0)==0){break}j0(u)}}while(0);do{if((a[e]&1)<<24>>24!=0){h=c[k>>2]|0;if((h|0)==0){break}j0(h)}}while(0);c[l>>2]=5259312;k=f+8|0;e=kg(5251560,0,32);h=F;c[k>>2]=e&0|1;c[k+4>>2]=h&-1|0;c[l>>2]=5258128;bg(f|0,5263272,434)}function ey(a){a=a|0;return 5247952}function ez(a){a=a|0;return}function eA(a){a=a|0;em(a+8|0);if((a|0)==0){return}j0(a);return}function eB(a){a=a|0;em(a+8|0);return}function eC(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;em(b+(d+8|0)|0);if((a|0)==0){return}j0(a);return}function eD(a){a=a|0;em(a+((c[(c[a>>2]|0)-12>>2]|0)+8|0)|0);return}function eE(a){a=a|0;em(a+8|0);if((a|0)==0){return}j0(a);return}function eF(a){a=a|0;em(a+8|0);return}function eG(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;em(b+(d+8|0)|0);if((a|0)==0){return}j0(a);return}function eH(a){a=a|0;em(a+((c[(c[a>>2]|0)-12>>2]|0)+8|0)|0);return}function eI(a){a=a|0;em(a+4|0);if((a|0)==0){return}j0(a);return}function eJ(a){a=a|0;em(a+4|0);return}function eK(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;em(b+(d+4|0)|0);if((a|0)==0){return}j0(a);return}function eL(a){a=a|0;em(a+((c[(c[a>>2]|0)-12>>2]|0)+4|0)|0);return}function eM(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24|0)>>2]|0)==0){return}if((c[e+(d+16|0)>>2]|0)!=0){return}if((c[e+(d+4|0)>>2]&8192|0)==0){return}if(bb()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24|0)>>2]|0;if((b2[c[(c[e>>2]|0)+24>>2]&1023](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;ex(d+b|0,c[d+(b+16|0)>>2]|1);return}function eN(a){a=a|0;em(a+4|0);if((a|0)==0){return}j0(a);return}function eO(a){a=a|0;em(a+4|0);return}function eP(a){a=a|0;var b=0,d=0;b=a;d=c[(c[a>>2]|0)-12>>2]|0;a=b+d|0;em(b+(d+4|0)|0);if((a|0)==0){return}j0(a);return}function eQ(a){a=a|0;em(a+((c[(c[a>>2]|0)-12>>2]|0)+4|0)|0);return}function eR(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;a=c[b>>2]|0;d=c[(c[a>>2]|0)-12>>2]|0;e=a;if((c[e+(d+24|0)>>2]|0)==0){return}if((c[e+(d+16|0)>>2]|0)!=0){return}if((c[e+(d+4|0)>>2]&8192|0)==0){return}if(bb()|0){return}d=c[b>>2]|0;e=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24|0)>>2]|0;if((b2[c[(c[e>>2]|0)+24>>2]&1023](e)|0)!=-1){return}e=c[b>>2]|0;b=c[(c[e>>2]|0)-12>>2]|0;d=e;ex(d+b|0,c[d+(b+16|0)>>2]|1);return}function eS(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24|0)>>2]|0)==0){i=d;return}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16|0)>>2]|0)==0){b=c[h+(g+72|0)>>2]|0;if((b|0)==0){k=g}else{eS(b);k=c[(c[f>>2]|0)-12>>2]|0}a[j]=1;b=c[h+(k+24|0)>>2]|0;if((b2[c[(c[b>>2]|0)+24>>2]&1023](b)|0)!=-1){break}b=c[(c[f>>2]|0)-12>>2]|0;ex(h+b|0,c[h+(b+16|0)>>2]|1)}}while(0);eM(e);i=d;return}function eT(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;e=d|0;f=b;g=c[(c[f>>2]|0)-12>>2]|0;h=b;if((c[h+(g+24|0)>>2]|0)==0){i=d;return}j=e|0;a[j]=0;c[e+4>>2]=b;do{if((c[h+(g+16|0)>>2]|0)==0){b=c[h+(g+72|0)>>2]|0;if((b|0)==0){k=g}else{eT(b);k=c[(c[f>>2]|0)-12>>2]|0}a[j]=1;b=c[h+(k+24|0)>>2]|0;if((b2[c[(c[b>>2]|0)+24>>2]&1023](b)|0)!=-1){break}b=c[(c[f>>2]|0)-12>>2]|0;ex(h+b|0,c[h+(b+16|0)>>2]|1)}}while(0);eR(e);i=d;return}function eU(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;if((e|0)==1){while(1){f=j$(48)|0;if((f|0)!=0){g=3655;break}d=(D=c[1316362]|0,c[1316362]=D+0,D);if((d|0)==0){g=3652;break}b7[d&1023]()}if((g|0)==3652){d=bO(4)|0;c[d>>2]=5257468;bg(d|0,5262716,348)}else if((g|0)==3655){c[b+8>>2]=f;c[b>>2]=49;c[b+4>>2]=35;j9(f,5248652,35);a[f+35|0]=0;return}}f=bw(e|0)|0;e=j8(f)|0;if((e|0)==-1){dZ()}do{if(e>>>0<11){a[b]=e<<1&255;h=b+1|0}else{d=e+16&-16;i=(d|0)==0?1:d;while(1){j=j$(i)|0;if((j|0)!=0){g=3643;break}k=(D=c[1316362]|0,c[1316362]=D+0,D);if((k|0)==0){break}b7[k&1023]()}if((g|0)==3643){c[b+8>>2]=j;c[b>>2]=d|1;c[b+4>>2]=e;h=j;break}i=bO(4)|0;c[i>>2]=5257468;bg(i|0,5262716,348)}}while(0);j9(h,f,e);a[h+e|0]=0;return}function eV(a){a=a|0;return}function eW(a){a=a|0;return}function eX(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L4323:do{if((e|0)==(f|0)){g=c}else{b=c;h=e;while(1){if((b|0)==(d|0)){i=-1;j=3668;break}k=a[b]|0;l=a[h]|0;if(k<<24>>24<l<<24>>24){i=-1;j=3669;break}if(l<<24>>24<k<<24>>24){i=1;j=3670;break}k=b+1|0;l=h+1|0;if((l|0)==(f|0)){g=k;break L4323}else{b=k;h=l}}if((j|0)==3670){return i|0}else if((j|0)==3669){return i|0}else if((j|0)==3668){return i|0}}}while(0);i=(g|0)!=(d|0)&1;return i|0}function eY(b,c,d){b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;if((c|0)==(d|0)){e=0;return e|0}else{f=c;g=0}while(1){c=(a[f]<<24>>24)+(g<<4)|0;b=c&-268435456;h=(b>>>24|b)^c;c=f+1|0;if((c|0)==(d|0)){e=h;break}else{f=c;g=h}}return e|0}function eZ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;L4342:do{if((e|0)==(f|0)){g=b}else{a=b;h=e;while(1){if((a|0)==(d|0)){i=-1;j=3687;break}k=c[a>>2]|0;l=c[h>>2]|0;if((k|0)<(l|0)){i=-1;j=3685;break}if((l|0)<(k|0)){i=1;j=3684;break}k=a+4|0;l=h+4|0;if((l|0)==(f|0)){g=k;break L4342}else{a=k;h=l}}if((j|0)==3687){return i|0}else if((j|0)==3684){return i|0}else if((j|0)==3685){return i|0}}}while(0);i=(g|0)!=(d|0)&1;return i|0}function e_(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=5257516;b=a+4|0;d=(c[b>>2]|0)-4|0;do{if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)-1|0)<0){e=(c[b>>2]|0)-12|0;if((e|0)!=0){j0(e)}if((a|0)!=0){break}return}}while(0);j0(a);return}function e$(a){a=a|0;var b=0;c[a>>2]=5257516;b=a+4|0;a=(c[b>>2]|0)-4|0;if(((D=c[a>>2]|0,c[a>>2]=D+ -1,D)-1|0)>=0){return}a=(c[b>>2]|0)-12|0;if((a|0)==0){return}j0(a);return}function e0(a){a=a|0;em(a);if((a|0)==0){return}j0(a);return}function e1(a){a=a|0;em(a);return}function e2(a){a=a|0;if((a|0)==0){return}j0(a);return}function e3(a){a=a|0;if((a|0)==0){return}j0(a);return}function e4(a){a=a|0;if((a|0)==0){return}j0(a);return}function e5(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;d=e;g=f-d|0;if((g|0)==-1){dZ()}do{if(g>>>0<11){a[b]=g<<1&255;h=b+1|0}else{i=g+16&-16;j=(i|0)==0?1:i;while(1){k=j$(j)|0;if((k|0)!=0){l=3743;break}m=(D=c[1316362]|0,c[1316362]=D+0,D);if((m|0)==0){break}b7[m&1023]()}if((l|0)==3743){c[b+8>>2]=k;c[b>>2]=i|1;c[b+4>>2]=g;h=k;break}j=bO(4)|0;c[j>>2]=5257468;bg(j|0,5262716,348)}}while(0);if((e|0)==(f|0)){n=h;a[n]=0;return}k=f+(-d|0)|0;d=h;g=e;while(1){a[d]=a[g]|0;e=g+1|0;if((e|0)==(f|0)){break}else{d=d+1|0;g=e}}n=h+k|0;a[n]=0;return}function e6(a){a=a|0;return}function e7(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0;if((b|0)==(d|0)){e=0;return e|0}else{f=b;g=0}while(1){b=(c[f>>2]|0)+(g<<4)|0;a=b&-268435456;h=(a>>>24|a)^b;b=f+4|0;if((b|0)==(d|0)){e=h;break}else{f=b;g=h}}return e|0}function e8(a){a=a|0;if((a|0)==0){return}j0(a);return}function e9(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741822){dZ()}do{if(h>>>0<2){a[b]=g>>>1&255;i=b+4|0}else{j=h+4&-4;k=j<<2;l=(k|0)==0?1:k;while(1){m=j$(l)|0;if((m|0)!=0){n=27;break}k=(D=c[1316362]|0,c[1316362]=D+0,D);if((k|0)==0){break}b7[k&1023]()}if((n|0)==27){l=m;c[b+8>>2]=l;c[b>>2]=j|1;c[b+4>>2]=h;i=l;break}l=bO(4)|0;c[l>>2]=5257468;bg(l|0,5262716,348)}}while(0);if((e|0)==(f|0)){o=i;c[o>>2]=0;return}h=((f-4|0)+(-d|0)|0)>>>2;d=i;b=e;while(1){c[d>>2]=c[b>>2]|0;e=b+4|0;if((e|0)==(f|0)){break}else{d=d+4|0;b=e}}o=i+(h+1<<2)|0;c[o>>2]=0;return}function fa(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+64|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=k|0;m=k+12|0;n=k+24|0;o=k+28|0;p=k+32|0;q=k+36|0;r=k+40|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;s=c[(c[d>>2]|0)+16>>2]|0;t=e|0;c[p>>2]=c[t>>2]|0;c[q>>2]=c[f>>2]|0;b5[s&1023](o,d,p,q,g,h,n);q=c[o>>2]|0;c[t>>2]=q;t=c[n>>2]|0;if((t|0)==0){a[j]=0}else if((t|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}q=g+28|0;g=c[q>>2]|0;t=g+4|0;D=c[t>>2]|0,c[t>>2]=D+1,D;if((c[1316234]|0)!=-1){c[m>>2]=5264936;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264936,m)}m=(c[1316235]|0)-1|0;n=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-n>>2>>>0>m>>>0){o=c[n+(m<<2)>>2]|0;if((o|0)==0){break}p=o;if(((D=c[t>>2]|0,c[t>>2]=D+ -1,D)|0)==0){b$[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[q>>2]|0;d=o+4|0;D=c[d>>2]|0,c[d>>2]=D+1,D;if((c[1316142]|0)!=-1){c[l>>2]=5264568;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264568,l)}s=(c[1316143]|0)-1|0;u=c[o+20>>2]|0;do{if((c[o+24>>2]|0)-u>>2>>>0>s>>>0){v=c[u+(s<<2)>>2]|0;if((v|0)==0){break}w=v;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)==0){b$[c[(c[o>>2]|0)+8>>2]&1023](o)}x=r|0;y=v;b0[c[(c[y>>2]|0)+24>>2]&1023](x,w);v=r+12|0;b0[c[(c[y>>2]|0)+28>>2]&1023](v,w);a[j]=(fb(e,c[f>>2]|0,x,r+24|0,p,h,1)|0)==(x|0)&1;c[b>>2]=c[e>>2]|0;do{if((a[v]&1)<<24>>24!=0){x=c[r+20>>2]|0;if((x|0)==0){break}j0(x)}}while(0);if((a[r]&1)<<24>>24==0){i=k;return}v=c[r+8>>2]|0;if((v|0)==0){i=k;return}j0(v);i=k;return}}while(0);p=bO(4)|0;c[p>>2]=5257492;bg(p|0,5262728,378)}}while(0);k=bO(4)|0;c[k>>2]=5257492;bg(k|0,5262728,378)}function fb(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;l=i;i=i+100|0;m=(g-f|0)/12&-1;n=l|0;do{if(m>>>0>100){o=j$(m)|0;if((o|0)!=0){p=o;q=o;break}o=bO(4)|0;c[o>>2]=5257468;bg(o|0,5262716,348)}else{p=n;q=0}}while(0);n=(f|0)==(g|0);L87:do{if(n){r=m;s=0}else{o=m;t=0;u=p;v=f;while(1){w=d[v]|0;if((w&1|0)==0){x=w>>>1}else{x=c[v+4>>2]|0}if((x|0)==0){a[u]=2;y=t+1|0;z=o-1|0}else{a[u]=1;y=t;z=o}w=v+12|0;if((w|0)==(g|0)){r=z;s=y;break L87}else{o=z;t=y;u=u+1|0;v=w}}}}while(0);y=b|0;b=c[y>>2]|0;z=(e|0)==0;L99:do{if((b|0)==0^z){e=h;x=r;m=s;v=0;u=b;while(1){if((x|0)==0){A=u;break L99}t=c[u+12>>2]|0;if((t|0)==(c[u+16>>2]|0)){B=b2[c[(c[u>>2]|0)+36>>2]&1023](u)|0}else{B=d[t]|0}t=B&255;if(k){C=t}else{C=cc[c[(c[e>>2]|0)+12>>2]&1023](h,t)|0}t=v+1|0;L111:do{if(n){D=m;E=x;F=t}else{o=x;w=m;G=p;H=0;I=f;while(1){do{if(a[G]<<24>>24==1){J=I;if((a[J]&1)<<24>>24==0){K=I+1|0}else{K=c[I+8>>2]|0}L=a[K+v|0]|0;if(k){M=L}else{M=cc[c[(c[e>>2]|0)+12>>2]&1023](h,L)|0}if(C<<24>>24!=M<<24>>24){a[G]=0;N=H;O=w;P=o-1|0;break}L=d[J]|0;if((L&1|0)==0){Q=L>>>1}else{Q=c[I+4>>2]|0}if((Q|0)!=(t|0)){N=1;O=w;P=o;break}a[G]=2;N=1;O=w+1|0;P=o-1|0}else{N=H;O=w;P=o}}while(0);L=I+12|0;if((L|0)==(g|0)){break}o=P;w=O;G=G+1|0;H=N;I=L}if((N&1)<<24>>24==0){D=O;E=P;F=t;break}I=c[y>>2]|0;H=I+12|0;G=c[H>>2]|0;w=I+16|0;o=c[w>>2]|0;do{if((G|0)==(o|0)){if((b2[c[(c[I>>2]|0)+40>>2]&1023](I)|0)==-1){R=138;break}S=c[H>>2]|0;T=c[w>>2]|0;R=135;break}else{L=G+1|0;c[H>>2]=L;S=L;T=o;R=135;break}}while(0);do{if((R|0)==135){R=0;if((S|0)!=(T|0)){break}if((b2[c[(c[I>>2]|0)+36>>2]&1023](I)|0)==-1){R=138;break}else{break}}}while(0);if((R|0)==138){R=0;c[y>>2]=0}if((O+P|0)>>>0<2){D=O;E=P;F=t;break}else{U=O;V=p;W=f}while(1){do{if(a[V]<<24>>24==2){I=d[W]|0;if((I&1|0)==0){X=I>>>1}else{X=c[W+4>>2]|0}if((X|0)==(t|0)){Y=U;break}a[V]=0;Y=U-1|0}else{Y=U}}while(0);I=W+12|0;if((I|0)==(g|0)){D=Y;E=P;F=t;break L111}else{U=Y;V=V+1|0;W=I}}}}while(0);t=c[y>>2]|0;if((t|0)==0^z){x=E;m=D;v=F;u=t}else{A=t;break L99}}}else{A=b}}while(0);if(!((A|0)==0^z)){c[j>>2]=c[j>>2]|2}L162:do{if(n){R=154}else{z=f;A=p;while(1){if(a[A]<<24>>24==2){Z=z;break L162}b=z+12|0;if((b|0)==(g|0)){R=154;break L162}z=b;A=A+1|0}}}while(0);if((R|0)==154){c[j>>2]=c[j>>2]|4;Z=g}if((q|0)==0){i=l;return Z|0}j0(q);i=l;return Z|0}function fc(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=a[m+24|0]<<24>>24==b<<24>>24;if(!p){if(a[m+25|0]<<24>>24!=b<<24>>24){break}}c[g>>2]=f+1|0;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);do{if(b<<24>>24==i<<24>>24){p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)==0){break}p=c[l>>2]|0;if((p-k|0)>=160){q=0;return q|0}s=c[h>>2]|0;c[l>>2]=p+4|0;c[p>>2]=s;c[h>>2]=0;q=0;return q|0}}while(0);l=m+26|0;k=m;while(1){if((k|0)==(l|0)){t=l;break}if(a[k]<<24>>24==b<<24>>24){t=k;break}else{k=k+1|0}}k=t-m|0;if((k|0)>23){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((k|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((k|0)<22){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if(a[n-1|0]<<24>>24!=48){q=-1;return q|0}c[h>>2]=0;m=a[k+5265376|0]|0;t=c[g>>2]|0;c[g>>2]=t+1|0;a[t]=m;q=0;return q|0}}while(0);if((n-f|0)<39){f=a[k+5265376|0]|0;c[g>>2]=n+1|0;a[n]=f}c[h>>2]=(c[h>>2]|0)+1|0;q=0;return q|0}function fd(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;g=b;h=b;i=a[h]|0;j=i&255;if((j&1|0)==0){k=j>>>1}else{k=c[b+4>>2]|0}if((k|0)==0){return}do{if((d|0)==(e|0)){l=i}else{k=e-4|0;if(k>>>0>d>>>0){m=d;n=k}else{l=i;break}while(1){k=c[m>>2]|0;c[m>>2]=c[n>>2]|0;c[n>>2]=k;k=m+4|0;j=n-4|0;if(k>>>0<j>>>0){m=k;n=j}else{break}}l=a[h]|0}}while(0);if((l&1)<<24>>24==0){o=g+1|0}else{o=c[b+8>>2]|0}g=l&255;if((g&1|0)==0){p=g>>>1}else{p=c[b+4>>2]|0}b=e-4|0;e=a[o]|0;g=e<<24>>24;l=e<<24>>24<1|e<<24>>24==127;L243:do{if(b>>>0>d>>>0){e=o+p|0;h=o;n=d;m=g;i=l;while(1){if(!i){if((m|0)!=(c[n>>2]|0)){break}}j=(e-h|0)>1?h+1|0:h;k=n+4|0;q=a[j]|0;r=q<<24>>24;s=q<<24>>24<1|q<<24>>24==127;if(k>>>0<b>>>0){h=j;n=k;m=r;i=s}else{t=r;u=s;break L243}}c[f>>2]=4;return}else{t=g;u=l}}while(0);if(u){return}u=c[b>>2]|0;if(!(t>>>0<u>>>0|(u|0)==0)){return}c[f>>2]=4;return}function fe(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;i=i+256|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+28|0;n=e+32|0;o=e+44|0;p=e+84|0;q=e+88|0;r=e+248|0;s=e+252|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}t=l|0;fg(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L266:do{if((f|0)==0^v){g=a[m]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=d[B]|0}if((fc(C&255,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L266}B=c[x>>2]|0;E=c[y>>2]|0;if((B|0)==(E|0)){if((b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0)==-1){break}F=c[x>>2]|0;G=c[y>>2]|0}else{H=B+1|0;c[x>>2]=H;F=H;G=E}if((F|0)==(G|0)){if((b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0)==-1){break}}if(!A){D=w;break L266}}c[l>>2]=0;if(v){D=0;break L266}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){I=l>>>1}else{I=c[n+4>>2]|0}do{if((I|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}G=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=G}}while(0);c[k>>2]=ff(h,c[p>>2]|0,j,u)|0;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function ff(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}k=c[bv()>>2]|0;c[bv()>>2]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);l=bI(b|0,h|0,f|0,c[1312889]|0)|0;f=F;b=c[bv()>>2]|0;if((b|0)==0){c[bv()>>2]=k}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=-1;h=0;if((b|0)==34|((f|0)<(d|0)|(f|0)==(d|0)&l>>>0<-2147483648>>>0)|((f|0)>(h|0)|(f|0)==(h|0)&l>>>0>2147483647>>>0)){c[e>>2]=4;e=0;j=(f|0)>(e|0)|(f|0)==(e|0)&l>>>0>0>>>0?2147483647:-2147483648;i=g;return j|0}else{j=l;i=g;return j|0}return 0}function fg(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;g=i;i=i+24|0;h=g|0;j=g+12|0;k=d+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;if((c[1316234]|0)!=-1){c[j>>2]=5264936;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264936,j)}j=(c[1316235]|0)-1|0;l=d+24|0;m=d+20|0;n=c[m>>2]|0;do{if((c[l>>2]|0)-n>>2>>>0>j>>>0){o=c[n+(j<<2)>>2]|0;if((o|0)==0){break}b9[c[(c[o>>2]|0)+32>>2]&1023](o,5265376,5265402,e);if((c[1316142]|0)!=-1){c[h>>2]=5264568;c[h+4>>2]=28;c[h+8>>2]=0;dY(5264568,h)}o=(c[1316143]|0)-1|0;p=c[m>>2]|0;do{if((c[l>>2]|0)-p>>2>>>0>o>>>0){q=c[p+(o<<2)>>2]|0;if((q|0)==0){break}r=q;a[f]=b2[c[(c[q>>2]|0)+16>>2]&1023](r)|0;b0[c[(c[q>>2]|0)+20>>2]&1023](b,r);if(((D=c[k>>2]|0,c[k>>2]=D+ -1,D)|0)!=0){i=g;return}b$[c[(c[d>>2]|0)+8>>2]&1023](d);i=g;return}}while(0);o=bO(4)|0;c[o>>2]=5257492;bg(o|0,5262728,378)}}while(0);g=bO(4)|0;c[g>>2]=5257492;bg(g|0,5262728,378)}function fh(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0;e=i;i=i+256|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+28|0;n=e+32|0;o=e+44|0;p=e+84|0;q=e+88|0;r=e+248|0;s=e+252|0;t=c[h+4>>2]&74;if((t|0)==64){u=8}else if((t|0)==0){u=0}else if((t|0)==8){u=16}else{u=10}t=l|0;fg(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L360:do{if((f|0)==0^v){g=a[m]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=d[B]|0}if((fc(C&255,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L360}B=c[x>>2]|0;E=c[y>>2]|0;if((B|0)==(E|0)){if((b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0)==-1){break}G=c[x>>2]|0;H=c[y>>2]|0}else{I=B+1|0;c[x>>2]=I;G=I;H=E}if((G|0)==(H|0)){if((b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0)==-1){break}}if(!A){D=w;break L360}}c[l>>2]=0;if(v){D=0;break L360}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){J=l>>>1}else{J=c[n+4>>2]|0}do{if((J|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}H=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=H}}while(0);s=fi(h,c[p>>2]|0,j,u)|0;c[k>>2]=s;c[k+4>>2]=F;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fi(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(F=j,k)|0}l=c[bv()>>2]|0;c[bv()>>2]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);m=bI(b|0,h|0,f|0,c[1312889]|0)|0;f=F;b=c[bv()>>2]|0;if((b|0)==0){c[bv()>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;i=g;return(F=j,k)|0}if((b|0)!=34){j=f;k=m;i=g;return(F=j,k)|0}c[e>>2]=4;e=0;b=(f|0)>(e|0)|(f|0)==(e|0)&m>>>0>0>>>0;j=b?2147483647:-2147483648;k=b?-1:0;i=g;return(F=j,k)|0}function fj(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;f=i;i=i+256|0;m=g;g=i;i=i+4|0;c[g>>2]=c[m>>2]|0;m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2]|0;m=f|0;n=f+28|0;o=f+32|0;p=f+44|0;q=f+84|0;r=f+88|0;s=f+248|0;t=f+252|0;u=c[j+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=m|0;fg(o,c[j+28>>2]|0,u,n);j=p|0;kb(j|0,0,40);c[q>>2]=j;p=r|0;c[s>>2]=p;c[t>>2]=0;m=g|0;g=c[m>>2]|0;w=(c[h>>2]|0)==0;L429:do{if((g|0)==0^w){h=a[n]|0;x=g;while(1){y=x+12|0;z=x+16|0;A=x;B=(x|0)==0^w;while(1){C=c[y>>2]|0;if((C|0)==(c[z>>2]|0)){D=b2[c[(c[A>>2]|0)+36>>2]&1023](x)|0}else{D=d[C]|0}if((fc(D&255,v,j,q,t,h,o,p,s,u)|0)!=0){E=x;break L429}C=c[y>>2]|0;F=c[z>>2]|0;if((C|0)==(F|0)){if((b2[c[(c[A>>2]|0)+40>>2]&1023](x)|0)==-1){break}G=c[y>>2]|0;H=c[z>>2]|0}else{I=C+1|0;c[y>>2]=I;G=I;H=F}if((G|0)==(H|0)){if((b2[c[(c[A>>2]|0)+36>>2]&1023](x)|0)==-1){break}}if(!B){E=x;break L429}}c[m>>2]=0;if(w){E=0;break L429}else{x=0}}}else{E=g}}while(0);g=o;m=d[g]|0;if((m&1|0)==0){J=m>>>1}else{J=c[o+4>>2]|0}do{if((J|0)!=0){m=c[s>>2]|0;if((m-r|0)>=160){break}H=c[t>>2]|0;c[s>>2]=m+4|0;c[m>>2]=H}}while(0);b[l>>1]=fk(j,c[q>>2]|0,k,v)|0;fd(o,p,c[s>>2]|0,k);if(!((E|0)==0^w)){c[k>>2]=c[k>>2]|2}c[e>>2]=E;if((a[g]&1)<<24>>24==0){i=f;return}g=c[o+8>>2]|0;if((g|0)==0){i=f;return}j0(g);i=f;return}function fk(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if(a[b]<<24>>24==45){c[e>>2]=4;j=0;i=g;return j|0}k=c[bv()>>2]|0;c[bv()>>2]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);l=av(b|0,h|0,f|0,c[1312889]|0)|0;f=F;b=c[bv()>>2]|0;if((b|0)==0){c[bv()>>2]=k}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&l>>>0>65535>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=l&65535;i=g;return j|0}return 0}function fl(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;i=i+256|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+28|0;n=e+32|0;o=e+44|0;p=e+84|0;q=e+88|0;r=e+248|0;s=e+252|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}t=l|0;fg(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L503:do{if((f|0)==0^v){g=a[m]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=d[B]|0}if((fc(C&255,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L503}B=c[x>>2]|0;E=c[y>>2]|0;if((B|0)==(E|0)){if((b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0)==-1){break}F=c[x>>2]|0;G=c[y>>2]|0}else{H=B+1|0;c[x>>2]=H;F=H;G=E}if((F|0)==(G|0)){if((b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0)==-1){break}}if(!A){D=w;break L503}}c[l>>2]=0;if(v){D=0;break L503}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){I=l>>>1}else{I=c[n+4>>2]|0}do{if((I|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}G=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=G}}while(0);c[k>>2]=fm(h,c[p>>2]|0,j,u)|0;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if(a[b]<<24>>24==45){c[e>>2]=4;j=0;i=g;return j|0}k=c[bv()>>2]|0;c[bv()>>2]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);l=av(b|0,h|0,f|0,c[1312889]|0)|0;f=F;b=c[bv()>>2]|0;if((b|0)==0){c[bv()>>2]=k}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&l>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=l;i=g;return j|0}return 0}function fn(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;e=i;i=i+256|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+28|0;n=e+32|0;o=e+44|0;p=e+84|0;q=e+88|0;r=e+248|0;s=e+252|0;t=c[h+4>>2]&74;if((t|0)==0){u=0}else if((t|0)==8){u=16}else if((t|0)==64){u=8}else{u=10}t=l|0;fg(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L577:do{if((f|0)==0^v){g=a[m]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=d[B]|0}if((fc(C&255,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L577}B=c[x>>2]|0;E=c[y>>2]|0;if((B|0)==(E|0)){if((b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0)==-1){break}F=c[x>>2]|0;G=c[y>>2]|0}else{H=B+1|0;c[x>>2]=H;F=H;G=E}if((F|0)==(G|0)){if((b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0)==-1){break}}if(!A){D=w;break L577}}c[l>>2]=0;if(v){D=0;break L577}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){I=l>>>1}else{I=c[n+4>>2]|0}do{if((I|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}G=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=G}}while(0);c[k>>2]=fo(h,c[p>>2]|0,j,u)|0;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fo(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+4|0;h=g|0;if((b|0)==(d|0)){c[e>>2]=4;j=0;i=g;return j|0}if(a[b]<<24>>24==45){c[e>>2]=4;j=0;i=g;return j|0}k=c[bv()>>2]|0;c[bv()>>2]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);l=av(b|0,h|0,f|0,c[1312889]|0)|0;f=F;b=c[bv()>>2]|0;if((b|0)==0){c[bv()>>2]=k}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;i=g;return j|0}d=0;if((b|0)==34|(f>>>0>d>>>0|f>>>0==d>>>0&l>>>0>-1>>>0)){c[e>>2]=4;j=-1;i=g;return j|0}else{j=l;i=g;return j|0}return 0}function fp(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0,I=0,J=0;e=i;i=i+256|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+28|0;n=e+32|0;o=e+44|0;p=e+84|0;q=e+88|0;r=e+248|0;s=e+252|0;t=c[h+4>>2]&74;if((t|0)==0){u=0}else if((t|0)==64){u=8}else if((t|0)==8){u=16}else{u=10}t=l|0;fg(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L651:do{if((f|0)==0^v){g=a[m]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=d[B]|0}if((fc(C&255,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L651}B=c[x>>2]|0;E=c[y>>2]|0;if((B|0)==(E|0)){if((b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0)==-1){break}G=c[x>>2]|0;H=c[y>>2]|0}else{I=B+1|0;c[x>>2]=I;G=I;H=E}if((G|0)==(H|0)){if((b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0)==-1){break}}if(!A){D=w;break L651}}c[l>>2]=0;if(v){D=0;break L651}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){J=l>>>1}else{J=c[n+4>>2]|0}do{if((J|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}H=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=H}}while(0);s=fq(h,c[p>>2]|0,j,u)|0;c[k>>2]=s;c[k+4>>2]=F;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fq(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+4|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;j=0;k=0}else{if(a[b]<<24>>24==45){c[e>>2]=4;j=0;k=0;break}l=c[bv()>>2]|0;c[bv()>>2]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);m=av(b|0,h|0,f|0,c[1312889]|0)|0;n=F;o=c[bv()>>2]|0;if((o|0)==0){c[bv()>>2]=l}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;j=0;k=0;break}if((o|0)!=34){j=n;k=m;break}c[e>>2]=4;j=-1;k=-1}}while(0);i=g;return(F=j,k)|0}function fr(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0.0;e=i;i=i+276|0;m=f;f=i;i=i+4|0;c[f>>2]=c[m>>2]|0;m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2]|0;m=e|0;n=e+36|0;o=e+40|0;p=e+44|0;q=e+96|0;r=e+100|0;s=e+260|0;t=e+264|0;u=e+268|0;v=e+272|0;w=e+4|0;fv(p,c[j+28>>2]|0,w,n,o);j=e+56|0;kb(j|0,0,40);c[q>>2]=j;x=r|0;c[s>>2]=x;c[t>>2]=0;a[u]=1;a[v]=69;y=f|0;f=c[y>>2]|0;z=h|0;h=(c[z>>2]|0)==0;L714:do{if((f|0)==0^h){A=a[n]|0;B=a[o]|0;C=f;while(1){D=C+12|0;E=C+16|0;F=C;G=(C|0)==0^h;while(1){H=c[D>>2]|0;if((H|0)==(c[E>>2]|0)){I=b2[c[(c[F>>2]|0)+36>>2]&1023](C)|0}else{I=d[H]|0}if((fs(I&255,u,v,j,q,A,B,p,x,s,t,w)|0)!=0){break L714}H=c[D>>2]|0;J=c[E>>2]|0;if((H|0)==(J|0)){if((b2[c[(c[F>>2]|0)+40>>2]&1023](C)|0)==-1){break}K=c[D>>2]|0;L=c[E>>2]|0}else{M=H+1|0;c[D>>2]=M;K=M;L=J}if((K|0)==(L|0)){if((b2[c[(c[F>>2]|0)+36>>2]&1023](C)|0)==-1){break}}if(!G){break L714}}c[y>>2]=0;if(h){break L714}else{C=0}}}}while(0);h=p;L=d[h]|0;if((L&1|0)==0){N=L>>>1}else{N=c[p+4>>2]|0}do{if((N|0)!=0){if((a[u]&1)<<24>>24==0){break}L=c[s>>2]|0;if((L-r|0)>=160){break}K=c[t>>2]|0;c[s>>2]=L+4|0;c[L>>2]=K}}while(0);t=c[q>>2]|0;do{if((j|0)==(t|0)){c[k>>2]=4;O=0.0}else{do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);P=+j7(j,m);if((c[m>>2]|0)==(t|0)){O=P;break}else{c[k>>2]=4;O=0.0;break}}}while(0);g[l>>2]=O;fd(p,x,c[s>>2]|0,k);s=c[y>>2]|0;if(!((s|0)==0^(c[z>>2]|0)==0)){c[k>>2]=c[k>>2]|2}c[b>>2]=s;if((a[h]&1)<<24>>24==0){i=e;return}h=c[p+8>>2]|0;if((h|0)==0){i=e;return}j0(h);i=e;return}function fs(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if(b<<24>>24==i<<24>>24){if((a[e]&1)<<24>>24==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1|0;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4|0;c[q>>2]=i;p=0;return p|0}do{if(b<<24>>24==j<<24>>24){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)<<24>>24==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4|0;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+32|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if(a[j]<<24>>24==b<<24>>24){s=j;break}else{j=j+1|0}}j=s-o|0;if((j|0)>31){p=-1;return p|0}o=a[j+5265376|0]|0;s=c[h>>2]|0;if((s-g|0)<39){c[h>>2]=s+1|0;a[s]=o}if((j-22|0)>>>0<2){a[f]=80;p=0;return p|0}do{if((o&223|0)==(a[f]<<24>>24|0)){a[e]=0;s=d[k]|0;if((s&1|0)==0){t=s>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}s=c[m>>2]|0;if((s-l|0)>=160){break}h=c[n>>2]|0;c[m>>2]=s+4|0;c[s>>2]=h}}while(0);if((j|0)>21){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1|0;p=0;return p|0}function ft(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0.0,Q=0.0;e=i;i=i+276|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2]|0;n=e|0;o=e+36|0;p=e+40|0;q=e+44|0;r=e+96|0;s=e+100|0;t=e+260|0;u=e+264|0;v=e+268|0;w=e+272|0;x=e+4|0;fv(q,c[j+28>>2]|0,x,o,p);j=e+56|0;kb(j|0,0,40);c[r>>2]=j;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;z=f|0;f=c[z>>2]|0;A=g|0;g=(c[A>>2]|0)==0;L829:do{if((f|0)==0^g){B=a[o]|0;C=a[p]|0;D=f;while(1){E=D+12|0;F=D+16|0;G=D;H=(D|0)==0^g;while(1){I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){J=b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0}else{J=d[I]|0}if((fs(J&255,v,w,j,r,B,C,q,y,t,u,x)|0)!=0){break L829}I=c[E>>2]|0;K=c[F>>2]|0;if((I|0)==(K|0)){if((b2[c[(c[G>>2]|0)+40>>2]&1023](D)|0)==-1){break}L=c[E>>2]|0;M=c[F>>2]|0}else{N=I+1|0;c[E>>2]=N;L=N;M=K}if((L|0)==(M|0)){if((b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0)==-1){break}}if(!H){break L829}}c[z>>2]=0;if(g){break L829}else{D=0}}}}while(0);g=q;M=d[g]|0;if((M&1|0)==0){O=M>>>1}else{O=c[q+4>>2]|0}do{if((O|0)!=0){if((a[v]&1)<<24>>24==0){break}M=c[t>>2]|0;if((M-s|0)>=160){break}L=c[u>>2]|0;c[t>>2]=M+4|0;c[M>>2]=L}}while(0);u=c[r>>2]|0;do{if((j|0)==(u|0)){c[l>>2]=4;P=0.0}else{do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);Q=+j7(j,n);if((c[n>>2]|0)==(u|0)){P=Q;break}c[l>>2]=4;P=0.0}}while(0);h[k>>3]=P,c[m>>2]=c[k>>2]|0,c[m+4>>2]=c[k+4>>2]|0;fd(q,y,c[t>>2]|0,l);t=c[z>>2]|0;if(!((t|0)==0^(c[A>>2]|0)==0)){c[l>>2]=c[l>>2]|2}c[b>>2]=t;if((a[g]&1)<<24>>24==0){i=e;return}g=c[q+8>>2]|0;if((g|0)==0){i=e;return}j0(g);i=e;return}function fu(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0.0,Q=0.0;e=i;i=i+276|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2]|0;n=e|0;o=e+36|0;p=e+40|0;q=e+44|0;r=e+96|0;s=e+100|0;t=e+260|0;u=e+264|0;v=e+268|0;w=e+272|0;x=e+4|0;fv(q,c[j+28>>2]|0,x,o,p);j=e+56|0;kb(j|0,0,40);c[r>>2]=j;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;z=f|0;f=c[z>>2]|0;A=g|0;g=(c[A>>2]|0)==0;L882:do{if((f|0)==0^g){B=a[o]|0;C=a[p]|0;D=f;while(1){E=D+12|0;F=D+16|0;G=D;H=(D|0)==0^g;while(1){I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){J=b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0}else{J=d[I]|0}if((fs(J&255,v,w,j,r,B,C,q,y,t,u,x)|0)!=0){break L882}I=c[E>>2]|0;K=c[F>>2]|0;if((I|0)==(K|0)){if((b2[c[(c[G>>2]|0)+40>>2]&1023](D)|0)==-1){break}L=c[E>>2]|0;M=c[F>>2]|0}else{N=I+1|0;c[E>>2]=N;L=N;M=K}if((L|0)==(M|0)){if((b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0)==-1){break}}if(!H){break L882}}c[z>>2]=0;if(g){break L882}else{D=0}}}}while(0);g=q;M=d[g]|0;if((M&1|0)==0){O=M>>>1}else{O=c[q+4>>2]|0}do{if((O|0)!=0){if((a[v]&1)<<24>>24==0){break}M=c[t>>2]|0;if((M-s|0)>=160){break}L=c[u>>2]|0;c[t>>2]=M+4|0;c[M>>2]=L}}while(0);u=c[r>>2]|0;do{if((j|0)==(u|0)){c[l>>2]=4;P=1.1125369292536007e-308}else{do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);Q=+j7(j,n);if((c[n>>2]|0)==(u|0)){P=Q;break}else{c[l>>2]=4;P=1.1125369292536007e-308;break}}}while(0);h[k>>3]=P,c[m>>2]=c[k>>2]|0,c[m+4>>2]=c[k+4>>2]|0;fd(q,y,c[t>>2]|0,l);t=c[z>>2]|0;if(!((t|0)==0^(c[A>>2]|0)==0)){c[l>>2]=c[l>>2]|2}c[b>>2]=t;if((a[g]&1)<<24>>24==0){i=e;return}g=c[q+8>>2]|0;if((g|0)==0){i=e;return}j0(g);i=e;return}function fv(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=i;i=i+24|0;j=h|0;k=h+12|0;l=d+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;if((c[1316234]|0)!=-1){c[k>>2]=5264936;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264936,k)}k=(c[1316235]|0)-1|0;m=d+24|0;n=d+20|0;o=c[n>>2]|0;do{if((c[m>>2]|0)-o>>2>>>0>k>>>0){p=c[o+(k<<2)>>2]|0;if((p|0)==0){break}b9[c[(c[p>>2]|0)+32>>2]&1023](p,5265376,5265408,e);if((c[1316142]|0)!=-1){c[j>>2]=5264568;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264568,j)}p=(c[1316143]|0)-1|0;q=c[n>>2]|0;do{if((c[m>>2]|0)-q>>2>>>0>p>>>0){r=c[q+(p<<2)>>2]|0;if((r|0)==0){break}s=r;t=r;a[f]=b2[c[(c[t>>2]|0)+12>>2]&1023](s)|0;a[g]=b2[c[(c[t>>2]|0)+16>>2]&1023](s)|0;b0[c[(c[r>>2]|0)+20>>2]&1023](b,s);if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){i=h;return}b$[c[(c[d>>2]|0)+8>>2]&1023](d);i=h;return}}while(0);p=bO(4)|0;c[p>>2]=5257492;bg(p|0,5262728,378)}}while(0);h=bO(4)|0;c[h>>2]=5257492;bg(h|0,5262728,378)}function fw(a){a=a|0;return}function fx(a){a=a|0;if((a|0)==0){return}j0(a);return}function fy(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;e=i;i=i+52|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+12|0;n=e+40|0;o=n;p=i;i=i+40|0;q=i;i=i+4|0;r=i;i=i+160|0;s=i;i=i+4|0;t=i;i=i+4|0;c[o>>2]=0;c[o+4>>2]=0;c[o+8>>2]=0;u=c[h+28>>2]|0;h=u+4|0;D=c[h>>2]|0,c[h>>2]=D+1,D;if((c[1316234]|0)!=-1){c[l>>2]=5264936;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264936,l)}l=(c[1316235]|0)-1|0;v=c[u+20>>2]|0;do{if((c[u+24>>2]|0)-v>>2>>>0>l>>>0){x=c[v+(l<<2)>>2]|0;if((x|0)==0){break}y=m|0;b9[c[(c[x>>2]|0)+32>>2]&1023](x,5265376,5265402,y);if(((D=c[h>>2]|0,c[h>>2]=D+ -1,D)|0)==0){b$[c[(c[u>>2]|0)+8>>2]&1023](u)}x=p|0;kb(x|0,0,40);c[q>>2]=x;z=r|0;c[s>>2]=z;c[t>>2]=0;A=f|0;B=c[A>>2]|0;C=g|0;E=(c[C>>2]|0)==0;L978:do{if((B|0)==0^E){F=B;while(1){G=F+12|0;H=F+16|0;I=F;J=(F|0)==0^E;while(1){K=c[G>>2]|0;if((K|0)==(c[H>>2]|0)){L=b2[c[(c[I>>2]|0)+36>>2]&1023](F)|0}else{L=d[K]|0}if((fc(L&255,16,x,q,t,0,n,z,s,y)|0)!=0){break L978}K=c[G>>2]|0;M=c[H>>2]|0;if((K|0)==(M|0)){if((b2[c[(c[I>>2]|0)+40>>2]&1023](F)|0)==-1){break}N=c[G>>2]|0;O=c[H>>2]|0}else{P=K+1|0;c[G>>2]=P;N=P;O=M}if((N|0)==(O|0)){if((b2[c[(c[I>>2]|0)+36>>2]&1023](F)|0)==-1){break}}if(!J){break L978}}c[A>>2]=0;if(E){break L978}else{F=0}}}}while(0);a[p+39|0]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);if((fz(x,c[1312889]|0,(w=i,i=i+4|0,c[w>>2]=k,w)|0)|0)!=1){c[j>>2]=4}E=c[A>>2]|0;if(!((E|0)==0^(c[C>>2]|0)==0)){c[j>>2]=c[j>>2]|2}c[b>>2]=E;if((a[o]&1)<<24>>24==0){i=e;return}E=c[n+8>>2]|0;if((E|0)==0){i=e;return}j0(E);i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function fz(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+4|0;f=e|0;c[f>>2]=d;d=bA(b|0)|0;b=bB(a|0,5247700,c[f>>2]|0)|0;if((d|0)==0){i=e;return b|0}bA(d|0);i=e;return b|0}function fA(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+64|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=k|0;m=k+12|0;n=k+24|0;o=k+28|0;p=k+32|0;q=k+36|0;r=k+40|0;if((c[g+4>>2]&1|0)==0){c[n>>2]=-1;s=c[(c[d>>2]|0)+16>>2]|0;t=e|0;c[p>>2]=c[t>>2]|0;c[q>>2]=c[f>>2]|0;b5[s&1023](o,d,p,q,g,h,n);q=c[o>>2]|0;c[t>>2]=q;t=c[n>>2]|0;if((t|0)==1){a[j]=1}else if((t|0)==0){a[j]=0}else{a[j]=1;c[h>>2]=4}c[b>>2]=q;i=k;return}q=g+28|0;g=c[q>>2]|0;t=g+4|0;D=c[t>>2]|0,c[t>>2]=D+1,D;if((c[1316232]|0)!=-1){c[m>>2]=5264928;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264928,m)}m=(c[1316233]|0)-1|0;n=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-n>>2>>>0>m>>>0){o=c[n+(m<<2)>>2]|0;if((o|0)==0){break}p=o;if(((D=c[t>>2]|0,c[t>>2]=D+ -1,D)|0)==0){b$[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[q>>2]|0;d=o+4|0;D=c[d>>2]|0,c[d>>2]=D+1,D;if((c[1316140]|0)!=-1){c[l>>2]=5264560;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264560,l)}s=(c[1316141]|0)-1|0;u=c[o+20>>2]|0;do{if((c[o+24>>2]|0)-u>>2>>>0>s>>>0){v=c[u+(s<<2)>>2]|0;if((v|0)==0){break}w=v;if(((D=c[d>>2]|0,c[d>>2]=D+ -1,D)|0)==0){b$[c[(c[o>>2]|0)+8>>2]&1023](o)}x=r|0;y=v;b0[c[(c[y>>2]|0)+24>>2]&1023](x,w);v=r+12|0;b0[c[(c[y>>2]|0)+28>>2]&1023](v,w);a[j]=(fD(e,c[f>>2]|0,x,r+24|0,p,h,1)|0)==(x|0)&1;c[b>>2]=c[e>>2]|0;do{if((a[v]&1)<<24>>24!=0){x=c[r+20>>2]|0;if((x|0)==0){break}j0(x)}}while(0);if((a[r]&1)<<24>>24==0){i=k;return}v=c[r+8>>2]|0;if((v|0)==0){i=k;return}j0(v);i=k;return}}while(0);p=bO(4)|0;c[p>>2]=5257492;bg(p|0,5262728,378)}}while(0);k=bO(4)|0;c[k>>2]=5257492;bg(k|0,5262728,378)}function fB(b,e,f,g,h,i,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0;n=c[g>>2]|0;o=(n|0)==(f|0);do{if(o){p=(c[m+96>>2]|0)==(b|0);if(!p){if((c[m+100>>2]|0)!=(b|0)){break}}c[g>>2]=f+1|0;a[f]=p?43:45;c[h>>2]=0;q=0;return q|0}}while(0);do{if((b|0)==(i|0)){p=d[j]|0;if((p&1|0)==0){r=p>>>1}else{r=c[j+4>>2]|0}if((r|0)==0){break}p=c[l>>2]|0;if((p-k|0)>=160){q=0;return q|0}s=c[h>>2]|0;c[l>>2]=p+4|0;c[p>>2]=s;c[h>>2]=0;q=0;return q|0}}while(0);l=m+104|0;k=m;while(1){if((k|0)==(l|0)){t=l;break}if((c[k>>2]|0)==(b|0)){t=k;break}else{k=k+4|0}}k=t-m|0;m=k>>2;if((k|0)>92){q=-1;return q|0}do{if((e|0)==8|(e|0)==10){if((m|0)<(e|0)){break}else{q=-1}return q|0}else if((e|0)==16){if((k|0)<88){break}if(o){q=-1;return q|0}if((n-f|0)>=3){q=-1;return q|0}if(a[n-1|0]<<24>>24!=48){q=-1;return q|0}c[h>>2]=0;t=a[m+5265376|0]|0;b=c[g>>2]|0;c[g>>2]=b+1|0;a[b]=t;q=0;return q|0}}while(0);if((n-f|0)<39){f=a[m+5265376|0]|0;c[g>>2]=n+1|0;a[n]=f}c[h>>2]=(c[h>>2]|0)+1|0;q=0;return q|0}function fC(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+332|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+160|0;q=e+164|0;r=e+324|0;s=e+328|0;t=c[h+4>>2]&74;if((t|0)==0){u=0}else if((t|0)==8){u=16}else if((t|0)==64){u=8}else{u=10}t=l|0;fE(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L1125:do{if((f|0)==0^v){g=c[m>>2]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=c[B>>2]|0}if((fB(C,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L1125}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){E=b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0}else{c[x>>2]=B+4|0;E=c[B>>2]|0}if((E|0)==-1){break}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){F=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{F=c[B>>2]|0}if((F|0)==-1){break}if(!A){D=w;break L1125}}c[l>>2]=0;if(v){D=0;break L1125}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){G=l>>>1}else{G=c[n+4>>2]|0}do{if((G|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}F=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=F}}while(0);c[k>>2]=ff(h,c[p>>2]|0,j,u)|0;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fD(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;l=i;i=i+100|0;m=(g-f|0)/12&-1;n=l|0;do{if(m>>>0>100){o=j$(m)|0;if((o|0)!=0){p=o;q=o;break}o=bO(4)|0;c[o>>2]=5257468;bg(o|0,5262716,348)}else{p=n;q=0}}while(0);n=(f|0)==(g|0);L1173:do{if(n){r=m;s=0}else{o=m;t=0;u=p;v=f;while(1){w=d[v]|0;if((w&1|0)==0){x=w>>>1}else{x=c[v+4>>2]|0}if((x|0)==0){a[u]=2;y=t+1|0;z=o-1|0}else{a[u]=1;y=t;z=o}w=v+12|0;if((w|0)==(g|0)){r=z;s=y;break L1173}else{o=z;t=y;u=u+1|0;v=w}}}}while(0);y=b|0;b=c[y>>2]|0;z=(e|0)==0;L1185:do{if((b|0)==0^z){e=h;x=r;m=s;v=0;u=b;while(1){if((x|0)==0){A=u;break L1185}t=c[u+12>>2]|0;if((t|0)==(c[u+16>>2]|0)){B=b2[c[(c[u>>2]|0)+36>>2]&1023](u)|0}else{B=c[t>>2]|0}if(k){C=B}else{C=cc[c[(c[e>>2]|0)+28>>2]&1023](h,B)|0}t=v+1|0;L1197:do{if(n){D=m;E=x;F=t}else{o=x;w=m;G=p;H=0;I=f;while(1){do{if(a[G]<<24>>24==1){J=I;if((a[J]&1)<<24>>24==0){K=I+4|0}else{K=c[I+8>>2]|0}L=c[K+(v<<2)>>2]|0;if(k){M=L}else{M=cc[c[(c[e>>2]|0)+28>>2]&1023](h,L)|0}if((C|0)!=(M|0)){a[G]=0;N=H;O=w;P=o-1|0;break}L=d[J]|0;if((L&1|0)==0){Q=L>>>1}else{Q=c[I+4>>2]|0}if((Q|0)!=(t|0)){N=1;O=w;P=o;break}a[G]=2;N=1;O=w+1|0;P=o-1|0}else{N=H;O=w;P=o}}while(0);L=I+12|0;if((L|0)==(g|0)){break}o=P;w=O;G=G+1|0;H=N;I=L}if((N&1)<<24>>24==0){D=O;E=P;F=t;break}I=c[y>>2]|0;H=I+12|0;G=c[H>>2]|0;w=I+16|0;if((G|0)==(c[w>>2]|0)){R=b2[c[(c[I>>2]|0)+40>>2]&1023](I)|0}else{c[H>>2]=G+4|0;R=c[G>>2]|0}do{if((R|0)==-1){S=1083}else{G=c[H>>2]|0;if((G|0)==(c[w>>2]|0)){T=b2[c[(c[I>>2]|0)+36>>2]&1023](I)|0}else{T=c[G>>2]|0}if((T|0)==-1){S=1083;break}else{break}}}while(0);if((S|0)==1083){S=0;c[y>>2]=0}if((O+P|0)>>>0<2){D=O;E=P;F=t;break}else{U=O;V=p;W=f}while(1){do{if(a[V]<<24>>24==2){I=d[W]|0;if((I&1|0)==0){X=I>>>1}else{X=c[W+4>>2]|0}if((X|0)==(t|0)){Y=U;break}a[V]=0;Y=U-1|0}else{Y=U}}while(0);I=W+12|0;if((I|0)==(g|0)){D=Y;E=P;F=t;break L1197}else{U=Y;V=V+1|0;W=I}}}}while(0);t=c[y>>2]|0;if((t|0)==0^z){x=E;m=D;v=F;u=t}else{A=t;break L1185}}}else{A=b}}while(0);if(!((A|0)==0^z)){c[j>>2]=c[j>>2]|2}L1249:do{if(n){S=1099}else{z=f;A=p;while(1){if(a[A]<<24>>24==2){Z=z;break L1249}b=z+12|0;if((b|0)==(g|0)){S=1099;break L1249}z=b;A=A+1|0}}}while(0);if((S|0)==1099){c[j>>2]=c[j>>2]|4;Z=g}if((q|0)==0){i=l;return Z|0}j0(q);i=l;return Z|0}function fE(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+24|0;g=f|0;h=f+12|0;j=b+4|0;D=c[j>>2]|0,c[j>>2]=D+1,D;if((c[1316232]|0)!=-1){c[h>>2]=5264928;c[h+4>>2]=28;c[h+8>>2]=0;dY(5264928,h)}h=(c[1316233]|0)-1|0;k=b+24|0;l=b+20|0;m=c[l>>2]|0;do{if((c[k>>2]|0)-m>>2>>>0>h>>>0){n=c[m+(h<<2)>>2]|0;if((n|0)==0){break}b9[c[(c[n>>2]|0)+48>>2]&1023](n,5265376,5265402,d);if((c[1316140]|0)!=-1){c[g>>2]=5264560;c[g+4>>2]=28;c[g+8>>2]=0;dY(5264560,g)}n=(c[1316141]|0)-1|0;o=c[l>>2]|0;do{if((c[k>>2]|0)-o>>2>>>0>n>>>0){p=c[o+(n<<2)>>2]|0;if((p|0)==0){break}q=p;c[e>>2]=b2[c[(c[p>>2]|0)+16>>2]&1023](q)|0;b0[c[(c[p>>2]|0)+20>>2]&1023](a,q);if(((D=c[j>>2]|0,c[j>>2]=D+ -1,D)|0)!=0){i=f;return}b$[c[(c[b>>2]|0)+8>>2]&1023](b);i=f;return}}while(0);n=bO(4)|0;c[n>>2]=5257492;bg(n|0,5262728,378)}}while(0);f=bO(4)|0;c[f>>2]=5257492;bg(f|0,5262728,378)}function fF(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0;e=i;i=i+332|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+160|0;q=e+164|0;r=e+324|0;s=e+328|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}t=l|0;fE(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L1291:do{if((f|0)==0^v){g=c[m>>2]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=c[B>>2]|0}if((fB(C,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L1291}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){E=b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0}else{c[x>>2]=B+4|0;E=c[B>>2]|0}if((E|0)==-1){break}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){G=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{G=c[B>>2]|0}if((G|0)==-1){break}if(!A){D=w;break L1291}}c[l>>2]=0;if(v){D=0;break L1291}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){H=l>>>1}else{H=c[n+4>>2]|0}do{if((H|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}G=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=G}}while(0);s=fi(h,c[p>>2]|0,j,u)|0;c[k>>2]=s;c[k+4>>2]=F;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fG(e,f,g,h,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;f=i;i=i+332|0;m=g;g=i;i=i+4|0;c[g>>2]=c[m>>2]|0;m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2]|0;m=f|0;n=f+104|0;o=f+108|0;p=f+120|0;q=f+160|0;r=f+164|0;s=f+324|0;t=f+328|0;u=c[j+4>>2]&74;if((u|0)==8){v=16}else if((u|0)==64){v=8}else if((u|0)==0){v=0}else{v=10}u=m|0;fE(o,c[j+28>>2]|0,u,n);j=p|0;kb(j|0,0,40);c[q>>2]=j;p=r|0;c[s>>2]=p;c[t>>2]=0;m=g|0;g=c[m>>2]|0;w=(c[h>>2]|0)==0;L1339:do{if((g|0)==0^w){h=c[n>>2]|0;x=g;while(1){y=x+12|0;z=x+16|0;A=x;B=(x|0)==0^w;while(1){C=c[y>>2]|0;if((C|0)==(c[z>>2]|0)){D=b2[c[(c[A>>2]|0)+36>>2]&1023](x)|0}else{D=c[C>>2]|0}if((fB(D,v,j,q,t,h,o,p,s,u)|0)!=0){E=x;break L1339}C=c[y>>2]|0;if((C|0)==(c[z>>2]|0)){F=b2[c[(c[A>>2]|0)+40>>2]&1023](x)|0}else{c[y>>2]=C+4|0;F=c[C>>2]|0}if((F|0)==-1){break}C=c[y>>2]|0;if((C|0)==(c[z>>2]|0)){G=b2[c[(c[A>>2]|0)+36>>2]&1023](x)|0}else{G=c[C>>2]|0}if((G|0)==-1){break}if(!B){E=x;break L1339}}c[m>>2]=0;if(w){E=0;break L1339}else{x=0}}}else{E=g}}while(0);g=o;m=d[g]|0;if((m&1|0)==0){H=m>>>1}else{H=c[o+4>>2]|0}do{if((H|0)!=0){m=c[s>>2]|0;if((m-r|0)>=160){break}G=c[t>>2]|0;c[s>>2]=m+4|0;c[m>>2]=G}}while(0);b[l>>1]=fk(j,c[q>>2]|0,k,v)|0;fd(o,p,c[s>>2]|0,k);if(!((E|0)==0^w)){c[k>>2]=c[k>>2]|2}c[e>>2]=E;if((a[g]&1)<<24>>24==0){i=f;return}g=c[o+8>>2]|0;if((g|0)==0){i=f;return}j0(g);i=f;return}function fH(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+332|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+160|0;q=e+164|0;r=e+324|0;s=e+328|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==0){u=0}else if((t|0)==64){u=8}else{u=10}t=l|0;fE(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L1387:do{if((f|0)==0^v){g=c[m>>2]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=c[B>>2]|0}if((fB(C,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L1387}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){E=b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0}else{c[x>>2]=B+4|0;E=c[B>>2]|0}if((E|0)==-1){break}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){F=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{F=c[B>>2]|0}if((F|0)==-1){break}if(!A){D=w;break L1387}}c[l>>2]=0;if(v){D=0;break L1387}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){G=l>>>1}else{G=c[n+4>>2]|0}do{if((G|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}F=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=F}}while(0);c[k>>2]=fm(h,c[p>>2]|0,j,u)|0;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fI(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;e=i;i=i+332|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+160|0;q=e+164|0;r=e+324|0;s=e+328|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==64){u=8}else if((t|0)==0){u=0}else{u=10}t=l|0;fE(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L1435:do{if((f|0)==0^v){g=c[m>>2]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=c[B>>2]|0}if((fB(C,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L1435}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){E=b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0}else{c[x>>2]=B+4|0;E=c[B>>2]|0}if((E|0)==-1){break}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){F=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{F=c[B>>2]|0}if((F|0)==-1){break}if(!A){D=w;break L1435}}c[l>>2]=0;if(v){D=0;break L1435}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){G=l>>>1}else{G=c[n+4>>2]|0}do{if((G|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}F=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=F}}while(0);c[k>>2]=fo(h,c[p>>2]|0,j,u)|0;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fJ(b,e,f,g,h,i,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0;if((b|0)==(i|0)){if((a[e]&1)<<24>>24==0){p=-1;return p|0}a[e]=0;i=c[h>>2]|0;c[h>>2]=i+1|0;a[i]=46;i=d[k]|0;if((i&1|0)==0){q=i>>>1}else{q=c[k+4>>2]|0}if((q|0)==0){p=0;return p|0}q=c[m>>2]|0;if((q-l|0)>=160){p=0;return p|0}i=c[n>>2]|0;c[m>>2]=q+4|0;c[q>>2]=i;p=0;return p|0}do{if((b|0)==(j|0)){i=d[k]|0;if((i&1|0)==0){r=i>>>1}else{r=c[k+4>>2]|0}if((r|0)==0){break}if((a[e]&1)<<24>>24==0){p=-1;return p|0}i=c[m>>2]|0;if((i-l|0)>=160){p=0;return p|0}q=c[n>>2]|0;c[m>>2]=i+4|0;c[i>>2]=q;c[n>>2]=0;p=0;return p|0}}while(0);r=o+128|0;j=o;while(1){if((j|0)==(r|0)){s=r;break}if((c[j>>2]|0)==(b|0)){s=j;break}else{j=j+4|0}}j=s-o|0;o=j>>2;if((j|0)>124){p=-1;return p|0}s=a[o+5265376|0]|0;b=c[h>>2]|0;if((b-g|0)<39){c[h>>2]=b+1|0;a[b]=s}do{if((o-22|0)>>>0<2){a[f]=80}else{if((s&223|0)!=(a[f]<<24>>24|0)){break}a[e]=0;b=d[k]|0;if((b&1|0)==0){t=b>>>1}else{t=c[k+4>>2]|0}if((t|0)==0){break}b=c[m>>2]|0;if((b-l|0)>=160){break}h=c[n>>2]|0;c[m>>2]=b+4|0;c[b>>2]=h}}while(0);if((j|0)>84){p=0;return p|0}c[n>>2]=(c[n>>2]|0)+1|0;p=0;return p|0}function fK(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,G=0,H=0;e=i;i=i+332|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=g;g=i;i=i+4|0;c[g>>2]=c[l>>2]|0;l=e|0;m=e+104|0;n=e+108|0;o=e+120|0;p=e+160|0;q=e+164|0;r=e+324|0;s=e+328|0;t=c[h+4>>2]&74;if((t|0)==8){u=16}else if((t|0)==64){u=8}else if((t|0)==0){u=0}else{u=10}t=l|0;fE(n,c[h+28>>2]|0,t,m);h=o|0;kb(h|0,0,40);c[p>>2]=h;o=q|0;c[r>>2]=o;c[s>>2]=0;l=f|0;f=c[l>>2]|0;v=(c[g>>2]|0)==0;L1541:do{if((f|0)==0^v){g=c[m>>2]|0;w=f;while(1){x=w+12|0;y=w+16|0;z=w;A=(w|0)==0^v;while(1){B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){C=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{C=c[B>>2]|0}if((fB(C,u,h,p,s,g,n,o,r,t)|0)!=0){D=w;break L1541}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){E=b2[c[(c[z>>2]|0)+40>>2]&1023](w)|0}else{c[x>>2]=B+4|0;E=c[B>>2]|0}if((E|0)==-1){break}B=c[x>>2]|0;if((B|0)==(c[y>>2]|0)){G=b2[c[(c[z>>2]|0)+36>>2]&1023](w)|0}else{G=c[B>>2]|0}if((G|0)==-1){break}if(!A){D=w;break L1541}}c[l>>2]=0;if(v){D=0;break L1541}else{w=0}}}else{D=f}}while(0);f=n;l=d[f]|0;if((l&1|0)==0){H=l>>>1}else{H=c[n+4>>2]|0}do{if((H|0)!=0){l=c[r>>2]|0;if((l-q|0)>=160){break}G=c[s>>2]|0;c[r>>2]=l+4|0;c[l>>2]=G}}while(0);s=fq(h,c[p>>2]|0,j,u)|0;c[k>>2]=s;c[k+4>>2]=F;fd(n,o,c[r>>2]|0,j);if(!((D|0)==0^v)){c[j>>2]=c[j>>2]|2}c[b>>2]=D;if((a[f]&1)<<24>>24==0){i=e;return}f=c[n+8>>2]|0;if((f|0)==0){i=e;return}j0(f);i=e;return}function fL(b,e,f,h,j,k,l){b=b|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0.0,N=0.0;e=i;i=i+372|0;m=f;f=i;i=i+4|0;c[f>>2]=c[m>>2]|0;m=h;h=i;i=i+4|0;c[h>>2]=c[m>>2]|0;m=e|0;n=e+132|0;o=e+136|0;p=e+140|0;q=e+192|0;r=e+196|0;s=e+356|0;t=e+360|0;u=e+364|0;v=e+368|0;w=e+4|0;fM(p,c[j+28>>2]|0,w,n,o);j=e+152|0;kb(j|0,0,40);c[q>>2]=j;x=r|0;c[s>>2]=x;c[t>>2]=0;a[u]=1;a[v]=69;y=f|0;f=c[y>>2]|0;z=h|0;h=(c[z>>2]|0)==0;L1584:do{if((f|0)==0^h){A=c[n>>2]|0;B=c[o>>2]|0;C=f;while(1){D=C+12|0;E=C+16|0;F=C;G=(C|0)==0^h;while(1){H=c[D>>2]|0;if((H|0)==(c[E>>2]|0)){I=b2[c[(c[F>>2]|0)+36>>2]&1023](C)|0}else{I=c[H>>2]|0}if((fJ(I,u,v,j,q,A,B,p,x,s,t,w)|0)!=0){break L1584}H=c[D>>2]|0;if((H|0)==(c[E>>2]|0)){J=b2[c[(c[F>>2]|0)+40>>2]&1023](C)|0}else{c[D>>2]=H+4|0;J=c[H>>2]|0}if((J|0)==-1){break}H=c[D>>2]|0;if((H|0)==(c[E>>2]|0)){K=b2[c[(c[F>>2]|0)+36>>2]&1023](C)|0}else{K=c[H>>2]|0}if((K|0)==-1){break}if(!G){break L1584}}c[y>>2]=0;if(h){break L1584}else{C=0}}}}while(0);h=p;K=d[h]|0;if((K&1|0)==0){L=K>>>1}else{L=c[p+4>>2]|0}do{if((L|0)!=0){if((a[u]&1)<<24>>24==0){break}K=c[s>>2]|0;if((K-r|0)>=160){break}J=c[t>>2]|0;c[s>>2]=K+4|0;c[K>>2]=J}}while(0);t=c[q>>2]|0;do{if((j|0)==(t|0)){c[k>>2]=4;M=0.0}else{do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);N=+j7(j,m);if((c[m>>2]|0)==(t|0)){M=N;break}else{c[k>>2]=4;M=0.0;break}}}while(0);g[l>>2]=M;fd(p,x,c[s>>2]|0,k);s=c[y>>2]|0;if(!((s|0)==0^(c[z>>2]|0)==0)){c[k>>2]=c[k>>2]|2}c[b>>2]=s;if((a[h]&1)<<24>>24==0){i=e;return}h=c[p+8>>2]|0;if((h|0)==0){i=e;return}j0(h);i=e;return}function fM(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=i;i=i+24|0;h=g|0;j=g+12|0;k=b+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;if((c[1316232]|0)!=-1){c[j>>2]=5264928;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264928,j)}j=(c[1316233]|0)-1|0;l=b+24|0;m=b+20|0;n=c[m>>2]|0;do{if((c[l>>2]|0)-n>>2>>>0>j>>>0){o=c[n+(j<<2)>>2]|0;if((o|0)==0){break}b9[c[(c[o>>2]|0)+48>>2]&1023](o,5265376,5265408,d);if((c[1316140]|0)!=-1){c[h>>2]=5264560;c[h+4>>2]=28;c[h+8>>2]=0;dY(5264560,h)}o=(c[1316141]|0)-1|0;p=c[m>>2]|0;do{if((c[l>>2]|0)-p>>2>>>0>o>>>0){q=c[p+(o<<2)>>2]|0;if((q|0)==0){break}r=q;s=q;c[e>>2]=b2[c[(c[s>>2]|0)+12>>2]&1023](r)|0;c[f>>2]=b2[c[(c[s>>2]|0)+16>>2]&1023](r)|0;b0[c[(c[q>>2]|0)+20>>2]&1023](a,r);if(((D=c[k>>2]|0,c[k>>2]=D+ -1,D)|0)!=0){i=g;return}b$[c[(c[b>>2]|0)+8>>2]&1023](b);i=g;return}}while(0);o=bO(4)|0;c[o>>2]=5257492;bg(o|0,5262728,378)}}while(0);g=bO(4)|0;c[g>>2]=5257492;bg(g|0,5262728,378)}function fN(a){a=a|0;return}function fO(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0.0;e=i;i=i+372|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2]|0;n=e|0;o=e+132|0;p=e+136|0;q=e+140|0;r=e+192|0;s=e+196|0;t=e+356|0;u=e+360|0;v=e+364|0;w=e+368|0;x=e+4|0;fM(q,c[j+28>>2]|0,x,o,p);j=e+152|0;kb(j|0,0,40);c[r>>2]=j;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;z=f|0;f=c[z>>2]|0;A=g|0;g=(c[A>>2]|0)==0;L1665:do{if((f|0)==0^g){B=c[o>>2]|0;C=c[p>>2]|0;D=f;while(1){E=D+12|0;F=D+16|0;G=D;H=(D|0)==0^g;while(1){I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){J=b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0}else{J=c[I>>2]|0}if((fJ(J,v,w,j,r,B,C,q,y,t,u,x)|0)!=0){break L1665}I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){K=b2[c[(c[G>>2]|0)+40>>2]&1023](D)|0}else{c[E>>2]=I+4|0;K=c[I>>2]|0}if((K|0)==-1){break}I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){L=b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0}else{L=c[I>>2]|0}if((L|0)==-1){break}if(!H){break L1665}}c[z>>2]=0;if(g){break L1665}else{D=0}}}}while(0);g=q;L=d[g]|0;if((L&1|0)==0){M=L>>>1}else{M=c[q+4>>2]|0}do{if((M|0)!=0){if((a[v]&1)<<24>>24==0){break}L=c[t>>2]|0;if((L-s|0)>=160){break}K=c[u>>2]|0;c[t>>2]=L+4|0;c[L>>2]=K}}while(0);u=c[r>>2]|0;do{if((j|0)==(u|0)){c[l>>2]=4;N=0.0}else{do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);O=+j7(j,n);if((c[n>>2]|0)==(u|0)){N=O;break}c[l>>2]=4;N=0.0}}while(0);h[k>>3]=N,c[m>>2]=c[k>>2]|0,c[m+4>>2]=c[k+4>>2]|0;fd(q,y,c[t>>2]|0,l);t=c[z>>2]|0;if(!((t|0)==0^(c[A>>2]|0)==0)){c[l>>2]=c[l>>2]|2}c[b>>2]=t;if((a[g]&1)<<24>>24==0){i=e;return}g=c[q+8>>2]|0;if((g|0)==0){i=e;return}j0(g);i=e;return}function fP(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0.0,O=0.0;e=i;i=i+372|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2]|0;n=e|0;o=e+132|0;p=e+136|0;q=e+140|0;r=e+192|0;s=e+196|0;t=e+356|0;u=e+360|0;v=e+364|0;w=e+368|0;x=e+4|0;fM(q,c[j+28>>2]|0,x,o,p);j=e+152|0;kb(j|0,0,40);c[r>>2]=j;y=s|0;c[t>>2]=y;c[u>>2]=0;a[v]=1;a[w]=69;z=f|0;f=c[z>>2]|0;A=g|0;g=(c[A>>2]|0)==0;L1718:do{if((f|0)==0^g){B=c[o>>2]|0;C=c[p>>2]|0;D=f;while(1){E=D+12|0;F=D+16|0;G=D;H=(D|0)==0^g;while(1){I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){J=b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0}else{J=c[I>>2]|0}if((fJ(J,v,w,j,r,B,C,q,y,t,u,x)|0)!=0){break L1718}I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){K=b2[c[(c[G>>2]|0)+40>>2]&1023](D)|0}else{c[E>>2]=I+4|0;K=c[I>>2]|0}if((K|0)==-1){break}I=c[E>>2]|0;if((I|0)==(c[F>>2]|0)){L=b2[c[(c[G>>2]|0)+36>>2]&1023](D)|0}else{L=c[I>>2]|0}if((L|0)==-1){break}if(!H){break L1718}}c[z>>2]=0;if(g){break L1718}else{D=0}}}}while(0);g=q;L=d[g]|0;if((L&1|0)==0){M=L>>>1}else{M=c[q+4>>2]|0}do{if((M|0)!=0){if((a[v]&1)<<24>>24==0){break}L=c[t>>2]|0;if((L-s|0)>=160){break}K=c[u>>2]|0;c[t>>2]=L+4|0;c[L>>2]=K}}while(0);u=c[r>>2]|0;do{if((j|0)==(u|0)){c[l>>2]=4;N=1.1125369292536007e-308}else{do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);O=+j7(j,n);if((c[n>>2]|0)==(u|0)){N=O;break}else{c[l>>2]=4;N=1.1125369292536007e-308;break}}}while(0);h[k>>3]=N,c[m>>2]=c[k>>2]|0,c[m+4>>2]=c[k+4>>2]|0;fd(q,y,c[t>>2]|0,l);t=c[z>>2]|0;if(!((t|0)==0^(c[A>>2]|0)==0)){c[l>>2]=c[l>>2]|2}c[b>>2]=t;if((a[g]&1)<<24>>24==0){i=e;return}g=c[q+8>>2]|0;if((g|0)==0){i=e;return}j0(g);i=e;return}function fQ(a){a=a|0;if((a|0)==0){return}j0(a);return}
function fR(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=i;i=i+128|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=f;f=i;i=i+4|0;c[f>>2]=c[k>>2]|0;k=d|0;l=d+12|0;m=d+116|0;n=m;o=i;i=i+40|0;p=i;i=i+4|0;q=i;i=i+160|0;r=i;i=i+4|0;s=i;i=i+4|0;c[n>>2]=0;c[n+4>>2]=0;c[n+8>>2]=0;t=c[g+28>>2]|0;g=t+4|0;D=c[g>>2]|0,c[g>>2]=D+1,D;if((c[1316232]|0)!=-1){c[k>>2]=5264928;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264928,k)}k=(c[1316233]|0)-1|0;u=c[t+20>>2]|0;do{if((c[t+24>>2]|0)-u>>2>>>0>k>>>0){v=c[u+(k<<2)>>2]|0;if((v|0)==0){break}x=l|0;b9[c[(c[v>>2]|0)+48>>2]&1023](v,5265376,5265402,x);if(((D=c[g>>2]|0,c[g>>2]=D+ -1,D)|0)==0){b$[c[(c[t>>2]|0)+8>>2]&1023](t)}v=o|0;kb(v|0,0,40);c[p>>2]=v;y=q|0;c[r>>2]=y;c[s>>2]=0;z=e|0;A=c[z>>2]|0;B=f|0;C=(c[B>>2]|0)==0;L1788:do{if((A|0)==0^C){E=A;while(1){F=E+12|0;G=E+16|0;H=E;I=(E|0)==0^C;while(1){J=c[F>>2]|0;if((J|0)==(c[G>>2]|0)){K=b2[c[(c[H>>2]|0)+36>>2]&1023](E)|0}else{K=c[J>>2]|0}if((fB(K,16,v,p,s,0,m,y,r,x)|0)!=0){break L1788}J=c[F>>2]|0;if((J|0)==(c[G>>2]|0)){L=b2[c[(c[H>>2]|0)+40>>2]&1023](E)|0}else{c[F>>2]=J+4|0;L=c[J>>2]|0}if((L|0)==-1){break}J=c[F>>2]|0;if((J|0)==(c[G>>2]|0)){M=b2[c[(c[H>>2]|0)+36>>2]&1023](E)|0}else{M=c[J>>2]|0}if((M|0)==-1){break}if(!I){break L1788}}c[z>>2]=0;if(C){break L1788}else{E=0}}}}while(0);a[o+39|0]=0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);if((fz(v,c[1312889]|0,(w=i,i=i+4|0,c[w>>2]=j,w)|0)|0)!=1){c[h>>2]=4}C=c[z>>2]|0;if(!((C|0)==0^(c[B>>2]|0)==0)){c[h>>2]=c[h>>2]|2}c[b>>2]=C;if((a[n]&1)<<24>>24==0){i=d;return}C=c[m+8>>2]|0;if((C|0)==0){i=d;return}j0(C);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function fS(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+56|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=d|0;k=d+8|0;l=d+20|0;m=d+44|0;n=d+48|0;o=d+52|0;p=j|0;a[p]=a[5252268]|0;a[p+1|0]=a[5252269|0]|0;a[p+2|0]=a[5252270|0]|0;a[p+3|0]=a[5252271|0]|0;a[p+4|0]=a[5252272|0]|0;a[p+5|0]=a[5252273|0]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=100}}while(0);t=k|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);s=fU(t,c[1312889]|0,p,(w=i,i=i+4|0,c[w>>2]=h,w)|0)|0;h=k+s|0;p=c[r>>2]&176;do{if((p|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((s|0)>1&r<<24>>24==48)){x=1633;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=1633;break}v=k+2|0;break}else if((p|0)==32){v=h}else{x=1633}}while(0);if((x|0)==1633){v=t}x=l|0;l=o|0;p=c[f+28>>2]|0;c[l>>2]=p;k=p+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;fV(t,v,h,x,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}b$[c[(c[o>>2]|0)+8>>2]&1023](o|0);y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}function fT(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;j=i;i=i+28|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=j|0;l=j+12|0;m=j+16|0;if((c[f+4>>2]&1|0)==0){n=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2]|0;cb[n&1023](b,d,l,f,g,h&1);i=j;return}g=c[f+28>>2]|0;f=g+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316142]|0)!=-1){c[k>>2]=5264568;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264568,k)}k=(c[1316143]|0)-1|0;l=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-l>>2>>>0>k>>>0){d=c[l+(k<<2)>>2]|0;if((d|0)==0){break}n=d;if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[d>>2]|0;if(h){b0[c[o+24>>2]&1023](m,n)}else{b0[c[o+28>>2]&1023](m,n)}n=m;o=m;d=a[o]|0;if((d&1)<<24>>24==0){p=n+1|0;q=p;r=p;s=m+8|0}else{p=m+8|0;q=c[p>>2]|0;r=n+1|0;s=p}p=e|0;n=m+4|0;t=q;u=d;while(1){v=(u&1)<<24>>24==0;if(v){w=r}else{w=c[s>>2]|0}d=u&255;if((t|0)==(w+((d&1|0)==0?d>>>1:c[n>>2]|0)|0)){break}d=a[t]|0;x=c[p>>2]|0;do{if((x|0)!=0){y=x+24|0;z=c[y>>2]|0;if((z|0)!=(c[x+28>>2]|0)){c[y>>2]=z+1|0;a[z]=d;break}if((cc[c[(c[x>>2]|0)+52>>2]&1023](x,d&255)|0)!=-1){break}c[p>>2]=0}}while(0);t=t+1|0;u=a[o]|0}c[b>>2]=c[p>>2]|0;if(v){i=j;return}o=c[s>>2]|0;if((o|0)==0){i=j;return}j0(o);i=j;return}}while(0);j=bO(4)|0;c[j>>2]=5257492;bg(j|0,5262728,378)}function fU(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+4|0;g=f|0;c[g>>2]=e;e=bA(b|0)|0;b=a0(a|0,d|0,c[g>>2]|0)|0;if((e|0)==0){i=f;return b|0}bA(e|0);i=f;return b|0}function fV(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[1316234]|0)!=-1){c[n>>2]=5264936;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264936,n)}n=(c[1316235]|0)-1|0;q=c[k+20>>2]|0;if((c[k+24>>2]|0)-q>>2>>>0<=n>>>0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}r=k;s=c[p>>2]|0;if((c[1316142]|0)!=-1){c[m>>2]=5264568;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264568,m)}m=(c[1316143]|0)-1|0;p=c[s+20>>2]|0;if((c[s+24>>2]|0)-p>>2>>>0<=m>>>0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}t=s;b0[c[(c[s>>2]|0)+20>>2]&1023](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}L1940:do{if((v|0)==0){p=c[(c[k>>2]|0)+32>>2]|0;b9[p&1023](r,b,f,g);c[j>>2]=g+(f-b|0)|0}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=cc[c[(c[k>>2]|0)+28>>2]&1023](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+1|0;a[p]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if(a[w]<<24>>24!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=cc[c[(c[p>>2]|0)+28>>2]&1023](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+1|0;a[y]=q;q=cc[c[(c[p>>2]|0)+28>>2]&1023](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+1|0;a[n]=q;x=w+2|0}else{x=w}}while(0);L1955:do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}while(1){q=a[z]|0;a[z]=a[A]|0;a[A]=q;q=z+1|0;n=A-1|0;if(q>>>0<n>>>0){z=q;A=n}else{break L1955}}}}while(0);n=b2[c[(c[s>>2]|0)+16>>2]&1023](t)|0;L1961:do{if(x>>>0<f>>>0){q=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=a[((a[m]&1)<<24>>24==0?q:c[B>>2]|0)+D|0]|0;if(F<<24>>24!=0&(C|0)==(F<<24>>24|0)){F=c[j>>2]|0;c[j>>2]=F+1|0;a[F]=n;F=d[m]|0;G=(D>>>0<(((F&1|0)==0?F>>>1:c[y>>2]|0)-1|0)>>>0&1)+D|0;H=0}else{G=D;H=C}F=cc[c[(c[p>>2]|0)+28>>2]&1023](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+1|0;a[I]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break L1961}}}}while(0);n=g+(x-b|0)|0;E=c[j>>2]|0;if((n|0)==(E|0)){break}D=E-1|0;if(n>>>0<D>>>0){J=n;K=D}else{break}while(1){D=a[J]|0;a[J]=a[K]|0;a[K]=D;D=J+1|0;n=K-1|0;if(D>>>0<n>>>0){J=D;K=n}else{break L1940}}}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0}else{L=g+(e-b|0)|0}c[h>>2]=L;if((a[m]&1)<<24>>24==0){i=l;return}m=c[o+8>>2]|0;if((m|0)==0){i=l;return}j0(m);i=l;return}function fW(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;j=g-e|0;k=h+12|0;h=c[k>>2]|0;l=(h|0)>(j|0)?h-j|0:0;L1986:do{if(e>>>0<f>>>0){j=e;h=d;m=d;while(1){n=a[j]|0;do{if((h|0)==0){o=0;p=m}else{q=h+24|0;r=c[q>>2]|0;if((r|0)==(c[h+28>>2]|0)){s=(cc[c[(c[h>>2]|0)+52>>2]&1023](h,n&255)|0)==-1;o=s?0:h;p=s?0:m;break}else{c[q>>2]=r+1|0;a[r]=n;o=h;p=m;break}}}while(0);n=j+1|0;if((n|0)==(f|0)){t=f;u=p;break L1986}else{j=n;h=o;m=p}}}else{t=e;u=d}}while(0);L1996:do{if((l|0)==0){v=u}else{d=i&255;e=l;p=u;o=u;while(1){do{if((p|0)==0){w=0;x=o}else{f=p+24|0;m=c[f>>2]|0;if((m|0)==(c[p+28>>2]|0)){h=(cc[c[(c[p>>2]|0)+52>>2]&1023](p,d)|0)==-1;w=h?0:p;x=h?0:o;break}else{c[f>>2]=m+1|0;a[m]=i;w=p;x=o;break}}}while(0);m=e-1|0;if((m|0)==0){v=x;break L1996}else{e=m;p=w;o=x}}}}while(0);if(t>>>0<g>>>0){y=t;z=v;A=v}else{B=v;c[k>>2]=0;C=b|0;c[C>>2]=B;return}while(1){v=a[y]|0;do{if((z|0)==0){D=0;E=A}else{t=z+24|0;x=c[t>>2]|0;if((x|0)==(c[z+28>>2]|0)){w=(cc[c[(c[z>>2]|0)+52>>2]&1023](z,v&255)|0)==-1;D=w?0:z;E=w?0:A;break}else{c[t>>2]=x+1|0;a[x]=v;D=z;E=A;break}}}while(0);v=y+1|0;if((v|0)==(g|0)){B=E;break}else{y=v;z=D;A=E}}c[k>>2]=0;C=b|0;c[C>>2]=B;return}function fX(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+88|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=d|0;l=d+8|0;m=d+32|0;n=d+76|0;o=d+80|0;p=d+84|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=100}}while(0);t=l|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);u=fU(t,c[1312889]|0,q,(w=i,i=i+8|0,c[w>>2]=h,c[w+4>>2]=j,w)|0)|0;j=l+u|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((u|0)>1&r<<24>>24==48)){x=1791;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=1791;break}v=l+2|0;break}else if((h|0)==32){v=j}else{x=1791}}while(0);if((x|0)==1791){v=t}x=m|0;m=p|0;h=c[f+28>>2]|0;c[m>>2]=h;l=h+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;fV(t,v,j,x,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((D=c[m>>2]|0,c[m>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}b$[c[(c[p>>2]|0)+8>>2]&1023](p|0);y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}function fY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+56|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=d|0;k=d+8|0;l=d+20|0;m=d+44|0;n=d+48|0;o=d+52|0;p=j|0;a[p]=a[5252268]|0;a[p+1|0]=a[5252269|0]|0;a[p+2|0]=a[5252270|0]|0;a[p+3|0]=a[5252271|0]|0;a[p+4|0]=a[5252272|0]|0;a[p+5|0]=a[5252273|0]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=117}}while(0);t=k|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);u=fU(t,c[1312889]|0,p,(w=i,i=i+4|0,c[w>>2]=h,w)|0)|0;h=k+u|0;p=c[r>>2]&176;do{if((p|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((u|0)>1&r<<24>>24==48)){x=1822;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=1822;break}v=k+2|0;break}else if((p|0)==32){v=h}else{x=1822}}while(0);if((x|0)==1822){v=t}x=l|0;l=o|0;p=c[f+28>>2]|0;c[l>>2]=p;k=p+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;fV(t,v,h,x,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}b$[c[(c[o>>2]|0)+8>>2]&1023](o|0);y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}function fZ(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+88|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=d|0;l=d+8|0;m=d+32|0;n=d+76|0;o=d+80|0;p=d+84|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=117}}while(0);t=l|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);s=fU(t,c[1312889]|0,q,(w=i,i=i+8|0,c[w>>2]=h,c[w+4>>2]=j,w)|0)|0;j=l+s|0;h=c[r>>2]&176;do{if((h|0)==32){v=j}else if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((s|0)>1&r<<24>>24==48)){x=1853;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=1853;break}v=l+2|0;break}else{x=1853}}while(0);if((x|0)==1853){v=t}x=m|0;m=p|0;l=c[f+28>>2]|0;c[m>>2]=l;s=l+4|0;D=c[s>>2]|0,c[s>>2]=D+1,D;fV(t,v,j,x,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((D=c[m>>2]|0,c[m>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}b$[c[(c[p>>2]|0)+8>>2]&1023](p|0);y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;fW(b,z,x,A,B,f,g);i=d;return}function f_(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+120|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+104|0;q=d+108|0;r=d+112|0;s=d+116|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){x=l}else{a[l]=43;x=t+2|0}if((v&1024|0)==0){y=x}else{a[x]=35;y=x+1|0}x=v&260;l=v>>>14;do{if((x|0)==260){if((l&1|0)==0){a[y]=97;z=0;break}else{a[y]=65;z=0;break}}else{a[y]=46;v=y+2|0;a[y+1|0]=42;if((x|0)==4){if((l&1|0)==0){a[v]=102;z=1;break}else{a[v]=70;z=1;break}}else if((x|0)==256){if((l&1|0)==0){a[v]=101;z=1;break}else{a[v]=69;z=1;break}}else{if((l&1|0)==0){a[v]=103;z=1;break}else{a[v]=71;z=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);m=c[1312889]|0;if(z){A=f$(l,m,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{A=f$(l,m,t,(w=i,i=i+8|0,h[k>>3]=j,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0}do{if((A|0)>29){m=a[5265516]<<24>>24==0;if(z){do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}m=c[n>>2]|0;if((m|0)!=0){C=B;E=m;F=m;break}m=bO(4)|0;c[m>>2]=5257468;bg(m|0,5262716,348)}else{C=A;E=0;F=c[n>>2]|0}}while(0);A=F+C|0;B=c[u>>2]&176;do{if((B|0)==16){u=a[F]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){G=F+1|0;break}if(!((C|0)>1&u<<24>>24==48)){H=1915;break}u=a[F+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){H=1915;break}G=F+2|0;break}else if((B|0)==32){G=A}else{H=1915}}while(0);if((H|0)==1915){G=F}do{if((F|0)==(l|0)){I=o|0;J=0;K=l}else{H=j$(C<<1)|0;if((H|0)!=0){I=H;J=H;K=c[n>>2]|0;break}H=bO(4)|0;c[H>>2]=5257468;bg(H|0,5262716,348)}}while(0);n=r|0;C=c[f+28>>2]|0;c[n>>2]=C;l=C+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;f1(K,G,A,I,p,q,r);r=c[n>>2]|0;n=r+4|0;if(((D=c[n>>2]|0,c[n>>2]=D+ -1,D)|0)==0){b$[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;fW(s,c[r>>2]|0,I,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){j0(J)}if((E|0)==0){i=d;return}j0(E);i=d;return}function f$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+4|0;g=f|0;c[g>>2]=e;e=bA(b|0)|0;b=aQ(a|0,30,d|0,c[g>>2]|0)|0;if((e|0)==0){i=f;return b|0}bA(e|0);i=f;return b|0}function f0(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+4|0;g=f|0;c[g>>2]=e;e=bA(b|0)|0;b=a4(a|0,d|0,c[g>>2]|0)|0;if((e|0)==0){i=f;return b|0}bA(e|0);i=f;return b|0}function f1(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[1316234]|0)!=-1){c[n>>2]=5264936;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264936,n)}n=(c[1316235]|0)-1|0;q=c[k+20>>2]|0;if((c[k+24>>2]|0)-q>>2>>>0<=n>>>0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}r=k;s=c[p>>2]|0;if((c[1316142]|0)!=-1){c[m>>2]=5264568;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264568,m)}m=(c[1316143]|0)-1|0;p=c[s+20>>2]|0;if((c[s+24>>2]|0)-p>>2>>>0<=m>>>0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}t=s;b0[c[(c[s>>2]|0)+20>>2]&1023](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=cc[c[(c[k>>2]|0)+28>>2]&1023](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+1|0;a[u]=m;v=b+1|0}else{v=b}m=f;L2242:do{if((m-v|0)>1){if(a[v]<<24>>24!=48){w=v;x=1992;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=1992;break}p=k;n=cc[c[(c[p>>2]|0)+28>>2]&1023](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+1|0;a[q]=n;n=v+2|0;q=cc[c[(c[p>>2]|0)+28>>2]&1023](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+1|0;a[u]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L2242}u=a[q]|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);if((aZ(u<<24>>24|0,c[1312889]|0)|0)==0){y=q;z=n;break L2242}else{q=q+1|0}}}else{w=v;x=1992}}while(0);L2257:do{if((x|0)==1992){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L2257}q=a[w]|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);if((bH(q<<24>>24|0,c[1312889]|0)|0)==0){y=w;z=v;break L2257}else{w=w+1|0;x=1992}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}L2272:do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+32>>2]|0;b9[u&1023](r,z,y,v);c[j>>2]=(c[j>>2]|0)+(y-z|0)|0}else{L2276:do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}while(1){v=a[B]|0;a[B]=a[C]|0;a[C]=v;v=B+1|0;u=C-1|0;if(v>>>0<u>>>0){B=v;C=u}else{break L2276}}}}while(0);q=b2[c[(c[s>>2]|0)+16>>2]&1023](t)|0;L2282:do{if(z>>>0<y>>>0){u=x+1|0;v=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=a[((a[w]&1)<<24>>24==0?u:c[n>>2]|0)+E|0]|0;if(G<<24>>24>0&(D|0)==(G<<24>>24|0)){G=c[j>>2]|0;c[j>>2]=G+1|0;a[G]=q;G=d[w]|0;H=(E>>>0<(((G&1|0)==0?G>>>1:c[v>>2]|0)-1|0)>>>0&1)+E|0;I=0}else{H=E;I=D}G=cc[c[(c[p>>2]|0)+28>>2]&1023](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+1|0;a[J]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break L2282}}}}while(0);q=g+(z-b|0)|0;F=c[j>>2]|0;if((q|0)==(F|0)){break}E=F-1|0;if(q>>>0<E>>>0){K=q;L=E}else{break}while(1){E=a[K]|0;a[K]=a[L]|0;a[L]=E;E=K+1|0;q=L-1|0;if(E>>>0<q>>>0){K=E;L=q}else{break L2272}}}}while(0);L2295:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=cc[c[(c[L>>2]|0)+28>>2]&1023](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+1|0;a[z]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L2295}}L=b2[c[(c[s>>2]|0)+12>>2]&1023](t)|0;H=c[j>>2]|0;c[j>>2]=H+1|0;a[H]=L;M=K+1|0}else{M=y}}while(0);b9[c[(c[k>>2]|0)+32>>2]&1023](r,M,f,c[j>>2]|0);r=(c[j>>2]|0)+(m-M|0)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r}else{N=g+(e-b|0)|0}c[h>>2]=N;if((a[w]&1)<<24>>24==0){i=l;return}w=c[o+8>>2]|0;if((w|0)==0){i=l;return}j0(w);i=l;return}function f2(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+120|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+104|0;q=d+108|0;r=d+112|0;s=d+116|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){x=l}else{a[l]=43;x=t+2|0}if((v&1024|0)==0){y=x}else{a[x]=35;y=x+1|0}x=v&260;l=v>>>14;do{if((x|0)==260){a[y]=76;v=y+1|0;if((l&1|0)==0){a[v]=97;z=0;break}else{a[v]=65;z=0;break}}else{a[y]=46;a[y+1|0]=42;a[y+2|0]=76;v=y+3|0;if((x|0)==256){if((l&1|0)==0){a[v]=101;z=1;break}else{a[v]=69;z=1;break}}else if((x|0)==4){if((l&1|0)==0){a[v]=102;z=1;break}else{a[v]=70;z=1;break}}else{if((l&1|0)==0){a[v]=103;z=1;break}else{a[v]=71;z=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);m=c[1312889]|0;if(z){A=f$(l,m,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{A=f$(l,m,t,(w=i,i=i+8|0,h[k>>3]=j,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0}do{if((A|0)>29){m=a[5265516]<<24>>24==0;if(z){do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+8|0,h[k>>3]=j,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0}m=c[n>>2]|0;if((m|0)!=0){C=B;E=m;F=m;break}m=bO(4)|0;c[m>>2]=5257468;bg(m|0,5262716,348)}else{C=A;E=0;F=c[n>>2]|0}}while(0);A=F+C|0;B=c[u>>2]&176;do{if((B|0)==32){G=A}else if((B|0)==16){u=a[F]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){G=F+1|0;break}if(!((C|0)>1&u<<24>>24==48)){H=2093;break}u=a[F+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){H=2093;break}G=F+2|0;break}else{H=2093}}while(0);if((H|0)==2093){G=F}do{if((F|0)==(l|0)){I=o|0;J=0;K=l}else{H=j$(C<<1)|0;if((H|0)!=0){I=H;J=H;K=c[n>>2]|0;break}H=bO(4)|0;c[H>>2]=5257468;bg(H|0,5262716,348)}}while(0);n=r|0;C=c[f+28>>2]|0;c[n>>2]=C;l=C+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;f1(K,G,A,I,p,q,r);r=c[n>>2]|0;n=r+4|0;if(((D=c[n>>2]|0,c[n>>2]=D+ -1,D)|0)==0){b$[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;fW(s,c[r>>2]|0,I,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){j0(J)}if((E|0)==0){i=d;return}j0(E);i=d;return}function f3(a){a=a|0;return}function f4(a){a=a|0;if((a|0)==0){return}j0(a);return}function f5(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+116|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=d|0;k=d+8|0;l=d+20|0;m=d+104|0;n=d+108|0;o=d+112|0;p=j|0;a[p]=a[5252268]|0;a[p+1|0]=a[5252269|0]|0;a[p+2|0]=a[5252270|0]|0;a[p+3|0]=a[5252271|0]|0;a[p+4|0]=a[5252272|0]|0;a[p+5|0]=a[5252273|0]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=100}}while(0);t=k|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);s=fU(t,c[1312889]|0,p,(w=i,i=i+4|0,c[w>>2]=h,w)|0)|0;h=k+s|0;p=c[r>>2]&176;do{if((p|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((s|0)>1&r<<24>>24==48)){x=2145;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=2145;break}v=k+2|0;break}else if((p|0)==32){v=h}else{x=2145}}while(0);if((x|0)==2145){v=t}x=l|0;l=o|0;p=c[f+28>>2]|0;c[l>>2]=p;k=p+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;gb(t,v,h,x,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}b$[c[(c[o>>2]|0)+8>>2]&1023](o|0);y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}function f6(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0;d=i;i=i+80|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=d|0;k=d+20|0;l=d+40|0;m=d+12|0;a[m]=a[5252276]|0;a[m+1|0]=a[5252277|0]|0;a[m+2|0]=a[5252278|0]|0;a[m+3|0]=a[5252279|0]|0;a[m+4|0]=a[5252280|0]|0;a[m+5|0]=a[5252281|0]|0;n=k|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);o=fU(n,c[1312889]|0,m,(w=i,i=i+4|0,c[w>>2]=h,w)|0)|0;h=k+o|0;m=c[f+4>>2]&176;do{if((m|0)==32){p=h}else if((m|0)==16){q=a[n]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=k+1|0;break}if(!((o|0)>1&q<<24>>24==48)){r=2166;break}q=a[k+1|0]|0;if(!((q<<24>>24|0)==120|(q<<24>>24|0)==88)){r=2166;break}p=k+2|0;break}else{r=2166}}while(0);if((r|0)==2166){p=n}r=c[f+28>>2]|0;m=r+4|0;D=c[m>>2]|0,c[m>>2]=D+1,D;if((c[1316234]|0)!=-1){c[j>>2]=5264936;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264936,j)}j=(c[1316235]|0)-1|0;q=c[r+20>>2]|0;do{if((c[r+24>>2]|0)-q>>2>>>0>j>>>0){s=c[q+(j<<2)>>2]|0;if((s|0)==0){break}if(((D=c[m>>2]|0,c[m>>2]=D+ -1,D)|0)==0){b$[c[(c[r>>2]|0)+8>>2]&1023](r)}t=l|0;b9[c[(c[s>>2]|0)+32>>2]&1023](s,n,h,t);s=l+o|0;if((p|0)==(h|0)){u=s;v=e|0;x=c[v>>2]|0;fW(b,x,t,u,s,f,g);i=d;return}u=l+(p-k|0)|0;v=e|0;x=c[v>>2]|0;fW(b,x,t,u,s,f,g);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function f7(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;j=i;i=i+28|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=j|0;l=j+12|0;m=j+16|0;if((c[f+4>>2]&1|0)==0){n=c[(c[d>>2]|0)+24>>2]|0;c[l>>2]=c[e>>2]|0;cb[n&1023](b,d,l,f,g,h&1);i=j;return}g=c[f+28>>2]|0;f=g+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316140]|0)!=-1){c[k>>2]=5264560;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264560,k)}k=(c[1316141]|0)-1|0;l=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-l>>2>>>0>k>>>0){d=c[l+(k<<2)>>2]|0;if((d|0)==0){break}n=d;if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[g>>2]|0)+8>>2]&1023](g)}o=c[d>>2]|0;if(h){b0[c[o+24>>2]&1023](m,n)}else{b0[c[o+28>>2]&1023](m,n)}n=m;o=a[n]|0;if((o&1)<<24>>24==0){d=m+4|0;p=d;q=d;r=m+8|0}else{d=m+8|0;p=c[d>>2]|0;q=m+4|0;r=d}d=e|0;s=p;t=o;while(1){u=(t&1)<<24>>24==0;if(u){v=q}else{v=c[r>>2]|0}o=t&255;if((o&1|0)==0){w=o>>>1}else{w=c[q>>2]|0}if((s|0)==(v+(w<<2)|0)){break}o=c[s>>2]|0;x=c[d>>2]|0;do{if((x|0)!=0){y=x+24|0;z=c[y>>2]|0;if((z|0)==(c[x+28>>2]|0)){A=cc[c[(c[x>>2]|0)+52>>2]&1023](x,o)|0}else{c[y>>2]=z+4|0;c[z>>2]=o;A=o}if((A|0)!=-1){break}c[d>>2]=0}}while(0);s=s+4|0;t=a[n]|0}c[b>>2]=c[d>>2]|0;if(u){i=j;return}n=c[r>>2]|0;if((n|0)==0){i=j;return}j0(n);i=j;return}}while(0);j=bO(4)|0;c[j>>2]=5257492;bg(j|0,5262728,378)}function f8(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;i=f-d>>2;j=g+12|0;g=c[j>>2]|0;k=(g|0)>(i|0)?g-i|0:0;L2523:do{if(d>>>0<e>>>0){i=d;g=b;l=b;while(1){m=c[i>>2]|0;if((g|0)==0){n=0;o=l}else{p=g+24|0;q=c[p>>2]|0;if((q|0)==(c[g+28>>2]|0)){r=cc[c[(c[g>>2]|0)+52>>2]&1023](g,m)|0}else{c[p>>2]=q+4|0;c[q>>2]=m;r=m}m=(r|0)==-1;n=m?0:g;o=m?0:l}m=i+4|0;if(m>>>0<e>>>0){i=m;g=n;l=o}else{s=m;t=o;break L2523}}}else{s=d;t=b}}while(0);L2534:do{if((k|0)==0){u=t}else{b=k;d=t;o=t;while(1){if((d|0)==0){v=0;w=o}else{n=d+24|0;e=c[n>>2]|0;if((e|0)==(c[d+28>>2]|0)){x=cc[c[(c[d>>2]|0)+52>>2]&1023](d,h)|0}else{c[n>>2]=e+4|0;c[e>>2]=h;x=h}e=(x|0)==-1;v=e?0:d;w=e?0:o}e=b-1|0;if((e|0)==0){u=w;break L2534}else{b=e;d=v;o=w}}}}while(0);if(s>>>0<f>>>0){y=s;z=u;A=u}else{B=u;c[j>>2]=0;C=a|0;c[C>>2]=B;return}while(1){u=c[y>>2]|0;if((z|0)==0){D=0;E=A}else{s=z+24|0;w=c[s>>2]|0;if((w|0)==(c[z+28>>2]|0)){F=cc[c[(c[z>>2]|0)+52>>2]&1023](z,u)|0}else{c[s>>2]=w+4|0;c[w>>2]=u;F=u}u=(F|0)==-1;D=u?0:z;E=u?0:A}u=y+4|0;if(u>>>0<f>>>0){y=u;z=D;A=E}else{B=E;break}}c[j>>2]=0;C=a|0;c[C>>2]=B;return}function f9(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+208|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=d|0;l=d+8|0;m=d+32|0;n=d+196|0;o=d+200|0;p=d+204|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=100}}while(0);t=l|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);u=fU(t,c[1312889]|0,q,(w=i,i=i+8|0,c[w>>2]=h,c[w+4>>2]=j,w)|0)|0;j=l+u|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((u|0)>1&r<<24>>24==48)){x=2272;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=2272;break}v=l+2|0;break}else if((h|0)==32){v=j}else{x=2272}}while(0);if((x|0)==2272){v=t}x=m|0;m=p|0;h=c[f+28>>2]|0;c[m>>2]=h;l=h+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;gb(t,v,j,x,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((D=c[m>>2]|0,c[m>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}b$[c[(c[p>>2]|0)+8>>2]&1023](p|0);y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}function ga(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+116|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=d|0;k=d+8|0;l=d+20|0;m=d+104|0;n=d+108|0;o=d+112|0;p=j|0;a[p]=a[5252268]|0;a[p+1|0]=a[5252269|0]|0;a[p+2|0]=a[5252270|0]|0;a[p+3|0]=a[5252271|0]|0;a[p+4|0]=a[5252272|0]|0;a[p+5|0]=a[5252273|0]|0;q=j+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=q}else{a[q]=43;t=j+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}a[u]=108;t=u+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=117}}while(0);t=k|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);s=fU(t,c[1312889]|0,p,(w=i,i=i+4|0,c[w>>2]=h,w)|0)|0;h=k+s|0;p=c[r>>2]&176;do{if((p|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=k+1|0;break}if(!((s|0)>1&r<<24>>24==48)){x=2303;break}r=a[k+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=2303;break}v=k+2|0;break}else if((p|0)==32){v=h}else{x=2303}}while(0);if((x|0)==2303){v=t}x=l|0;l=o|0;p=c[f+28>>2]|0;c[l>>2]=p;k=p+4|0;D=c[k>>2]|0,c[k>>2]=D+1,D;gb(t,v,h,x,m,n,o);o=c[l>>2]|0;l=o+4|0;if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}b$[c[(c[o>>2]|0)+8>>2]&1023](o|0);y=e|0;z=c[y>>2]|0;A=c[m>>2]|0;B=c[n>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}function gb(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[1316232]|0)!=-1){c[n>>2]=5264928;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264928,n)}n=(c[1316233]|0)-1|0;q=c[k+20>>2]|0;if((c[k+24>>2]|0)-q>>2>>>0<=n>>>0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}r=k;s=c[p>>2]|0;if((c[1316140]|0)!=-1){c[m>>2]=5264560;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264560,m)}m=(c[1316141]|0)-1|0;p=c[s+20>>2]|0;if((c[s+24>>2]|0)-p>>2>>>0<=m>>>0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}t=s;b0[c[(c[s>>2]|0)+20>>2]&1023](o,t);u=o;m=o;p=d[m]|0;if((p&1|0)==0){v=p>>>1}else{v=c[o+4>>2]|0}L2650:do{if((v|0)==0){p=c[(c[k>>2]|0)+48>>2]|0;b9[p&1023](r,b,f,g);c[j>>2]=g+(f-b<<2)|0}else{c[j>>2]=g;p=a[b]|0;if((p<<24>>24|0)==45|(p<<24>>24|0)==43){n=cc[c[(c[k>>2]|0)+44>>2]&1023](r,p)|0;p=c[j>>2]|0;c[j>>2]=p+4|0;c[p>>2]=n;w=b+1|0}else{w=b}do{if((f-w|0)>1){if(a[w]<<24>>24!=48){x=w;break}n=w+1|0;p=a[n]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){x=w;break}p=k;q=cc[c[(c[p>>2]|0)+44>>2]&1023](r,48)|0;y=c[j>>2]|0;c[j>>2]=y+4|0;c[y>>2]=q;q=cc[c[(c[p>>2]|0)+44>>2]&1023](r,a[n]|0)|0;n=c[j>>2]|0;c[j>>2]=n+4|0;c[n>>2]=q;x=w+2|0}else{x=w}}while(0);L2663:do{if((x|0)!=(f|0)){q=f-1|0;if(x>>>0<q>>>0){z=x;A=q}else{break}while(1){q=a[z]|0;a[z]=a[A]|0;a[A]=q;q=z+1|0;n=A-1|0;if(q>>>0<n>>>0){z=q;A=n}else{break L2663}}}}while(0);n=b2[c[(c[s>>2]|0)+16>>2]&1023](t)|0;L2669:do{if(x>>>0<f>>>0){q=u+1|0;p=k;y=o+4|0;B=o+8|0;C=0;D=0;E=x;while(1){F=a[((a[m]&1)<<24>>24==0?q:c[B>>2]|0)+D|0]|0;if(F<<24>>24!=0&(C|0)==(F<<24>>24|0)){F=c[j>>2]|0;c[j>>2]=F+4|0;c[F>>2]=n;F=d[m]|0;G=(D>>>0<(((F&1|0)==0?F>>>1:c[y>>2]|0)-1|0)>>>0&1)+D|0;H=0}else{G=D;H=C}F=cc[c[(c[p>>2]|0)+44>>2]&1023](r,a[E]|0)|0;I=c[j>>2]|0;c[j>>2]=I+4|0;c[I>>2]=F;F=E+1|0;if(F>>>0<f>>>0){C=H+1|0;D=G;E=F}else{break L2669}}}}while(0);n=g+(x-b<<2)|0;E=c[j>>2]|0;if((n|0)==(E|0)){break}D=E-4|0;if(n>>>0<D>>>0){J=n;K=D}else{break}while(1){D=c[J>>2]|0;c[J>>2]=c[K>>2]|0;c[K>>2]=D;D=J+4|0;n=K-4|0;if(D>>>0<n>>>0){J=D;K=n}else{break L2650}}}}while(0);if((e|0)==(f|0)){L=c[j>>2]|0}else{L=g+(e-b<<2)|0}c[h>>2]=L;if((a[m]&1)<<24>>24==0){i=l;return}m=c[o+8>>2]|0;if((m|0)==0){i=l;return}j0(m);i=l;return}function gc(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+216|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=d|0;l=d+8|0;m=d+32|0;n=d+204|0;o=d+208|0;p=d+212|0;c[k>>2]=37;c[k+4>>2]=0;q=k;k=q+1|0;r=f+4|0;s=c[r>>2]|0;if((s&2048|0)==0){t=k}else{a[k]=43;t=q+2|0}if((s&512|0)==0){u=t}else{a[t]=35;u=t+1|0}t=u+2|0;a[u]=108;a[u+1|0]=108;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=117}}while(0);t=l|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);u=fU(t,c[1312889]|0,q,(w=i,i=i+8|0,c[w>>2]=h,c[w+4>>2]=j,w)|0)|0;j=l+u|0;h=c[r>>2]&176;do{if((h|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){v=l+1|0;break}if(!((u|0)>1&r<<24>>24==48)){x=2392;break}r=a[l+1|0]|0;if(!((r<<24>>24|0)==120|(r<<24>>24|0)==88)){x=2392;break}v=l+2|0;break}else if((h|0)==32){v=j}else{x=2392}}while(0);if((x|0)==2392){v=t}x=m|0;m=p|0;h=c[f+28>>2]|0;c[m>>2]=h;l=h+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;gb(t,v,j,x,n,o,p);p=c[m>>2]|0;m=p+4|0;if(((D=c[m>>2]|0,c[m>>2]=D+ -1,D)|0)!=0){y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}b$[c[(c[p>>2]|0)+8>>2]&1023](p|0);y=e|0;z=c[y>>2]|0;A=c[n>>2]|0;B=c[o>>2]|0;f8(b,z,x,A,B,f,g);i=d;return}function gd(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+288|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+272|0;q=d+276|0;r=d+280|0;s=d+284|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){x=l}else{a[l]=43;x=t+2|0}if((v&1024|0)==0){y=x}else{a[x]=35;y=x+1|0}x=v&260;l=v>>>14;do{if((x|0)==260){if((l&1|0)==0){a[y]=97;z=0;break}else{a[y]=65;z=0;break}}else{a[y]=46;v=y+2|0;a[y+1|0]=42;if((x|0)==256){if((l&1|0)==0){a[v]=101;z=1;break}else{a[v]=69;z=1;break}}else if((x|0)==4){if((l&1|0)==0){a[v]=102;z=1;break}else{a[v]=70;z=1;break}}else{if((l&1|0)==0){a[v]=103;z=1;break}else{a[v]=71;z=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);m=c[1312889]|0;if(z){A=f$(l,m,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{A=f$(l,m,t,(w=i,i=i+8|0,h[k>>3]=j,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0}do{if((A|0)>29){m=a[5265516]<<24>>24==0;if(z){do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}m=c[n>>2]|0;if((m|0)!=0){C=B;E=m;F=m;break}m=bO(4)|0;c[m>>2]=5257468;bg(m|0,5262716,348)}else{C=A;E=0;F=c[n>>2]|0}}while(0);A=F+C|0;B=c[u>>2]&176;do{if((B|0)==32){G=A}else if((B|0)==16){u=a[F]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){G=F+1|0;break}if(!((C|0)>1&u<<24>>24==48)){H=2454;break}u=a[F+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){H=2454;break}G=F+2|0;break}else{H=2454}}while(0);if((H|0)==2454){G=F}do{if((F|0)==(l|0)){I=o|0;J=0;K=l}else{H=j$(C<<3)|0;B=H;if((H|0)!=0){I=B;J=B;K=c[n>>2]|0;break}B=bO(4)|0;c[B>>2]=5257468;bg(B|0,5262716,348)}}while(0);n=r|0;C=c[f+28>>2]|0;c[n>>2]=C;l=C+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;ge(K,G,A,I,p,q,r);r=c[n>>2]|0;n=r+4|0;if(((D=c[n>>2]|0,c[n>>2]=D+ -1,D)|0)==0){b$[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;f8(s,c[r>>2]|0,I,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){j0(J)}if((E|0)==0){i=d;return}j0(E);i=d;return}function ge(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;l=i;i=i+36|0;m=l|0;n=l+12|0;o=l+24|0;p=k|0;k=c[p>>2]|0;if((c[1316232]|0)!=-1){c[n>>2]=5264928;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264928,n)}n=(c[1316233]|0)-1|0;q=c[k+20>>2]|0;if((c[k+24>>2]|0)-q>>2>>>0<=n>>>0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}k=c[q+(n<<2)>>2]|0;if((k|0)==0){r=bO(4)|0;s=r;c[s>>2]=5257492;bg(r|0,5262728,378)}r=k;s=c[p>>2]|0;if((c[1316140]|0)!=-1){c[m>>2]=5264560;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264560,m)}m=(c[1316141]|0)-1|0;p=c[s+20>>2]|0;if((c[s+24>>2]|0)-p>>2>>>0<=m>>>0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}s=c[p+(m<<2)>>2]|0;if((s|0)==0){t=bO(4)|0;u=t;c[u>>2]=5257492;bg(t|0,5262728,378)}t=s;b0[c[(c[s>>2]|0)+20>>2]&1023](o,t);c[j>>2]=g;u=a[b]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){m=cc[c[(c[k>>2]|0)+44>>2]&1023](r,u)|0;u=c[j>>2]|0;c[j>>2]=u+4|0;c[u>>2]=m;v=b+1|0}else{v=b}m=f;L2838:do{if((m-v|0)>1){if(a[v]<<24>>24!=48){w=v;x=2514;break}u=v+1|0;p=a[u]|0;if(!((p<<24>>24|0)==120|(p<<24>>24|0)==88)){w=v;x=2514;break}p=k;n=cc[c[(c[p>>2]|0)+44>>2]&1023](r,48)|0;q=c[j>>2]|0;c[j>>2]=q+4|0;c[q>>2]=n;n=v+2|0;q=cc[c[(c[p>>2]|0)+44>>2]&1023](r,a[u]|0)|0;u=c[j>>2]|0;c[j>>2]=u+4|0;c[u>>2]=q;q=n;while(1){if(q>>>0>=f>>>0){y=q;z=n;break L2838}u=a[q]|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);if((aZ(u<<24>>24|0,c[1312889]|0)|0)==0){y=q;z=n;break L2838}else{q=q+1|0}}}else{w=v;x=2514}}while(0);L2853:do{if((x|0)==2514){while(1){x=0;if(w>>>0>=f>>>0){y=w;z=v;break L2853}q=a[w]|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);if((bH(q<<24>>24|0,c[1312889]|0)|0)==0){y=w;z=v;break L2853}else{w=w+1|0;x=2514}}}}while(0);x=o;w=o;v=d[w]|0;if((v&1|0)==0){A=v>>>1}else{A=c[o+4>>2]|0}L2868:do{if((A|0)==0){v=c[j>>2]|0;u=c[(c[k>>2]|0)+48>>2]|0;b9[u&1023](r,z,y,v);c[j>>2]=(c[j>>2]|0)+(y-z<<2)|0}else{L2872:do{if((z|0)!=(y|0)){v=y-1|0;if(z>>>0<v>>>0){B=z;C=v}else{break}while(1){v=a[B]|0;a[B]=a[C]|0;a[C]=v;v=B+1|0;u=C-1|0;if(v>>>0<u>>>0){B=v;C=u}else{break L2872}}}}while(0);q=b2[c[(c[s>>2]|0)+16>>2]&1023](t)|0;L2878:do{if(z>>>0<y>>>0){u=x+1|0;v=o+4|0;n=o+8|0;p=k;D=0;E=0;F=z;while(1){G=a[((a[w]&1)<<24>>24==0?u:c[n>>2]|0)+E|0]|0;if(G<<24>>24>0&(D|0)==(G<<24>>24|0)){G=c[j>>2]|0;c[j>>2]=G+4|0;c[G>>2]=q;G=d[w]|0;H=(E>>>0<(((G&1|0)==0?G>>>1:c[v>>2]|0)-1|0)>>>0&1)+E|0;I=0}else{H=E;I=D}G=cc[c[(c[p>>2]|0)+44>>2]&1023](r,a[F]|0)|0;J=c[j>>2]|0;c[j>>2]=J+4|0;c[J>>2]=G;G=F+1|0;if(G>>>0<y>>>0){D=I+1|0;E=H;F=G}else{break L2878}}}}while(0);q=g+(z-b<<2)|0;F=c[j>>2]|0;if((q|0)==(F|0)){break}E=F-4|0;if(q>>>0<E>>>0){K=q;L=E}else{break}while(1){E=c[K>>2]|0;c[K>>2]=c[L>>2]|0;c[L>>2]=E;E=K+4|0;q=L-4|0;if(E>>>0<q>>>0){K=E;L=q}else{break L2868}}}}while(0);L2891:do{if(y>>>0<f>>>0){L=k;K=y;while(1){z=a[K]|0;if(z<<24>>24==46){break}H=cc[c[(c[L>>2]|0)+44>>2]&1023](r,z)|0;z=c[j>>2]|0;c[j>>2]=z+4|0;c[z>>2]=H;H=K+1|0;if(H>>>0<f>>>0){K=H}else{M=H;break L2891}}L=b2[c[(c[s>>2]|0)+12>>2]&1023](t)|0;H=c[j>>2]|0;c[j>>2]=H+4|0;c[H>>2]=L;M=K+1|0}else{M=y}}while(0);b9[c[(c[k>>2]|0)+48>>2]&1023](r,M,f,c[j>>2]|0);r=(c[j>>2]|0)+(m-M<<2)|0;c[j>>2]=r;if((e|0)==(f|0)){N=r}else{N=g+(e-b<<2)|0}c[h>>2]=N;if((a[w]&1)<<24>>24==0){i=l;return}w=c[o+8>>2]|0;if((w|0)==0){i=l;return}j0(w);i=l;return}function gf(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;d=i;i=i+288|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=d|0;m=d+8|0;n=d+40|0;o=d+44|0;p=d+272|0;q=d+276|0;r=d+280|0;s=d+284|0;c[l>>2]=37;c[l+4>>2]=0;t=l;l=t+1|0;u=f+4|0;v=c[u>>2]|0;if((v&2048|0)==0){x=l}else{a[l]=43;x=t+2|0}if((v&1024|0)==0){y=x}else{a[x]=35;y=x+1|0}x=v&260;l=v>>>14;do{if((x|0)==260){a[y]=76;v=y+1|0;if((l&1|0)==0){a[v]=97;z=0;break}else{a[v]=65;z=0;break}}else{a[y]=46;a[y+1|0]=42;a[y+2|0]=76;v=y+3|0;if((x|0)==4){if((l&1|0)==0){a[v]=102;z=1;break}else{a[v]=70;z=1;break}}else if((x|0)==256){if((l&1|0)==0){a[v]=101;z=1;break}else{a[v]=69;z=1;break}}else{if((l&1|0)==0){a[v]=103;z=1;break}else{a[v]=71;z=1;break}}}}while(0);l=m|0;c[n>>2]=l;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);m=c[1312889]|0;if(z){A=f$(l,m,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{A=f$(l,m,t,(w=i,i=i+8|0,h[k>>3]=j,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0}do{if((A|0)>29){m=a[5265516]<<24>>24==0;if(z){do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+12|0,c[w>>2]=c[f+8>>2]|0,h[k>>3]=j,c[w+4>>2]=c[k>>2]|0,c[w+8>>2]=c[k+4>>2]|0,w)|0)|0}else{do{if(m){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);B=f0(n,c[1312889]|0,t,(w=i,i=i+8|0,h[k>>3]=j,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0}m=c[n>>2]|0;if((m|0)!=0){C=B;E=m;F=m;break}m=bO(4)|0;c[m>>2]=5257468;bg(m|0,5262716,348)}else{C=A;E=0;F=c[n>>2]|0}}while(0);A=F+C|0;B=c[u>>2]&176;do{if((B|0)==32){G=A}else if((B|0)==16){u=a[F]|0;if((u<<24>>24|0)==45|(u<<24>>24|0)==43){G=F+1|0;break}if(!((C|0)>1&u<<24>>24==48)){H=2615;break}u=a[F+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){H=2615;break}G=F+2|0;break}else{H=2615}}while(0);if((H|0)==2615){G=F}do{if((F|0)==(l|0)){I=o|0;J=0;K=l}else{H=j$(C<<3)|0;B=H;if((H|0)!=0){I=B;J=B;K=c[n>>2]|0;break}B=bO(4)|0;c[B>>2]=5257468;bg(B|0,5262716,348)}}while(0);n=r|0;C=c[f+28>>2]|0;c[n>>2]=C;l=C+4|0;D=c[l>>2]|0,c[l>>2]=D+1,D;ge(K,G,A,I,p,q,r);r=c[n>>2]|0;n=r+4|0;if(((D=c[n>>2]|0,c[n>>2]=D+ -1,D)|0)==0){b$[c[(c[r>>2]|0)+8>>2]&1023](r|0)}r=e|0;f8(s,c[r>>2]|0,I,c[p>>2]|0,c[q>>2]|0,f,g);g=c[s>>2]|0;c[r>>2]=g;c[b>>2]=g;if((J|0)!=0){j0(J)}if((E|0)==0){i=d;return}j0(E);i=d;return}function gg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0;d=i;i=i+188|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=d|0;k=d+20|0;l=d+40|0;m=d+12|0;a[m]=a[5252276]|0;a[m+1|0]=a[5252277|0]|0;a[m+2|0]=a[5252278|0]|0;a[m+3|0]=a[5252279|0]|0;a[m+4|0]=a[5252280|0]|0;a[m+5|0]=a[5252281|0]|0;n=k|0;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);o=fU(n,c[1312889]|0,m,(w=i,i=i+4|0,c[w>>2]=h,w)|0)|0;h=k+o|0;m=c[f+4>>2]&176;do{if((m|0)==32){p=h}else if((m|0)==16){q=a[n]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=k+1|0;break}if(!((o|0)>1&q<<24>>24==48)){r=2651;break}q=a[k+1|0]|0;if(!((q<<24>>24|0)==120|(q<<24>>24|0)==88)){r=2651;break}p=k+2|0;break}else{r=2651}}while(0);if((r|0)==2651){p=n}r=c[f+28>>2]|0;m=r+4|0;D=c[m>>2]|0,c[m>>2]=D+1,D;if((c[1316232]|0)!=-1){c[j>>2]=5264928;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264928,j)}j=(c[1316233]|0)-1|0;q=c[r+20>>2]|0;do{if((c[r+24>>2]|0)-q>>2>>>0>j>>>0){s=c[q+(j<<2)>>2]|0;if((s|0)==0){break}if(((D=c[m>>2]|0,c[m>>2]=D+ -1,D)|0)==0){b$[c[(c[r>>2]|0)+8>>2]&1023](r)}t=l|0;b9[c[(c[s>>2]|0)+48>>2]&1023](s,n,h,t);s=l+(o<<2)|0;if((p|0)==(h|0)){u=s;v=e|0;x=c[v>>2]|0;f8(b,x,t,u,s,f,g);i=d;return}u=l+(p-k<<2)|0;v=e|0;x=c[v>>2]|0;f8(b,x,t,u,s,f,g);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function gh(a){a=a|0;return}function gi(a){a=a|0;return 2}function gj(a){a=a|0;if((a|0)==0){return}j0(a);return}function gk(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2]|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;gl(a,b,c[d>>2]|0,c[e>>2]|0,f,g,h,5252260,5252268);i=j;return}function gl(e,f,g,h,j,k,l,m,n){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0;o=i;i=i+24|0;p=o|0;q=o+12|0;r=o+16|0;s=o+20|0;t=c[j+28>>2]|0;u=t+4|0;D=c[u>>2]|0,c[u>>2]=D+1,D;if((c[1316234]|0)!=-1){c[p>>2]=5264936;c[p+4>>2]=28;c[p+8>>2]=0;dY(5264936,p)}p=(c[1316235]|0)-1|0;v=c[t+20>>2]|0;do{if((c[t+24>>2]|0)-v>>2>>>0>p>>>0){w=c[v+(p<<2)>>2]|0;if((w|0)==0){break}x=w;if(((D=c[u>>2]|0,c[u>>2]=D+ -1,D)|0)==0){b$[c[(c[t>>2]|0)+8>>2]&1023](t)}c[k>>2]=0;L3045:do{if((m|0)==(n|0)){y=g}else{z=w;A=w+8|0;B=w;C=f;E=r|0;F=s|0;G=q|0;H=(h|0)==0;I=m;J=0;K=g;L3047:while(1){L=(K|0)==0^H;M=K+12|0;N=K+16|0;O=K;P=J;while(1){if((P|0)!=0){y=K;break L3045}if(!L){Q=2689;break L3047}if(bY[c[(c[z>>2]|0)+36>>2]&1023](x,a[I]|0,0)<<24>>24==37){Q=2693;break}R=a[I]|0;if(R<<24>>24>-1){S=c[A>>2]|0;if((b[S+(R<<24>>24<<1)>>1]&8192)<<16>>16!=0){T=I;Q=2704;break}}R=c[M>>2]|0;if((R|0)==(c[N>>2]|0)){U=b2[c[(c[O>>2]|0)+36>>2]&1023](K)|0}else{U=d[R]|0}R=cc[c[(c[B>>2]|0)+12>>2]&1023](x,U&255)|0;if(R<<24>>24==cc[c[(c[B>>2]|0)+12>>2]&1023](x,a[I]|0)<<24>>24){Q=2726;break}c[k>>2]=4;P=4}L3062:do{if((Q|0)==2693){Q=0;P=I+1|0;if((P|0)==(n|0)){Q=2694;break L3047}L=bY[c[(c[z>>2]|0)+36>>2]&1023](x,a[P]|0,0)|0;if((L<<24>>24|0)==69|(L<<24>>24|0)==48){R=I+2|0;if((R|0)==(n|0)){Q=2697;break L3047}V=L;W=bY[c[(c[z>>2]|0)+36>>2]&1023](x,a[R]|0,0)|0;X=R}else{V=0;W=L;X=P}P=c[(c[C>>2]|0)+36>>2]|0;c[E>>2]=K;c[F>>2]=h;b1[P&1023](q,f,r,s,j,k,l,W,V);Y=X+1|0;Z=c[G>>2]|0}else if((Q|0)==2704){while(1){Q=0;P=T+1|0;if((P|0)==(n|0)){_=n;break}L=a[P]|0;if(L<<24>>24<=-1){_=P;break}if((b[S+(L<<24>>24<<1)>>1]&8192)<<16>>16==0){_=P;break}else{T=P;Q=2704}}P=K;while(1){L=P+12|0;R=P+16|0;$=P;aa=(P|0)==0^H;while(1){ab=c[L>>2]|0;if((ab|0)==(c[R>>2]|0)){ac=b2[c[(c[$>>2]|0)+36>>2]&1023](P)|0}else{ac=d[ab]|0}ab=ac<<24>>24;if(ab>>>0>=128){Y=_;Z=P;break L3062}if((b[(c[A>>2]|0)+(ab<<1)>>1]&8192)<<16>>16==0){Y=_;Z=P;break L3062}ab=c[L>>2]|0;ad=c[R>>2]|0;if((ab|0)==(ad|0)){if((b2[c[(c[$>>2]|0)+40>>2]&1023](P)|0)==-1){break}ae=c[L>>2]|0;af=c[R>>2]|0}else{ag=ab+1|0;c[L>>2]=ag;ae=ag;af=ad}if((ae|0)==(af|0)){if((b2[c[(c[$>>2]|0)+36>>2]&1023](P)|0)==-1){break}}if(!aa){Y=_;Z=P;break L3062}}if(H){Y=_;Z=0;break L3062}else{P=0}}}else if((Q|0)==2726){Q=0;P=c[M>>2]|0;aa=c[N>>2]|0;do{if((P|0)==(aa|0)){if((b2[c[(c[O>>2]|0)+40>>2]&1023](K)|0)==-1){Q=2732;break}ah=c[M>>2]|0;ai=c[N>>2]|0;Q=2730;break}else{$=P+1|0;c[M>>2]=$;ah=$;ai=aa;Q=2730;break}}while(0);do{if((Q|0)==2730){Q=0;if((ah|0)!=(ai|0)){aj=K;break}if((b2[c[(c[O>>2]|0)+36>>2]&1023](K)|0)==-1){Q=2732;break}else{aj=K;break}}}while(0);if((Q|0)==2732){Q=0;aj=0}Y=I+1|0;Z=aj}}while(0);if((Y|0)==(n|0)){y=Z;break L3045}I=Y;J=c[k>>2]|0;K=Z}if((Q|0)==2694){c[k>>2]=4;y=K;break}else if((Q|0)==2697){c[k>>2]=4;y=K;break}else if((Q|0)==2689){c[k>>2]=4;y=K;break}}}while(0);if((y|0)==0^(h|0)==0){ak=e|0;c[ak>>2]=y;i=o;return}c[k>>2]=c[k>>2]|2;ak=e|0;c[ak>>2]=y;i=o;return}}while(0);o=bO(4)|0;c[o>>2]=5257492;bg(o|0,5262728,378)}function gm(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+12|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=k|0;m=c[g+28>>2]|0;n=m+4|0;D=c[n>>2]|0,c[n>>2]=D+1,D;if((c[1316234]|0)!=-1){c[l>>2]=5264936;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264936,l)}l=(c[1316235]|0)-1|0;o=c[m+20>>2]|0;do{if((c[m+24>>2]|0)-o>>2>>>0>l>>>0){if((c[o+(l<<2)>>2]|0)==0){break}if(((D=c[n>>2]|0,c[n>>2]=D+ -1,D)|0)==0){b$[c[(c[m>>2]|0)+8>>2]&1023](m)}p=d+8|0;q=b2[c[(c[p>>2]|0)+20>>2]&1023](p)|0;p=c[e>>2]|0;r=c[f>>2]|0;s=a[q]|0;if((s&1)<<24>>24==0){t=q+1|0}else{t=c[q+8>>2]|0}u=s&255;if((u&1|0)==0){s=u>>>1;u=t+s|0;gl(b,d,p,r,g,h,j,t,u);i=k;return}else{s=c[q+4>>2]|0;u=t+s|0;gl(b,d,p,r,g,h,j,t,u);i=k;return}}}while(0);k=bO(4)|0;c[k>>2]=5257492;bg(k|0,5262728,378)}function gn(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2]|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=j|0;l=c[f+28>>2]|0;f=l+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316234]|0)!=-1){c[k>>2]=5264936;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264936,k)}k=(c[1316235]|0)-1|0;m=c[l+20>>2]|0;do{if((c[l+24>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b2[c[c[p>>2]>>2]&1023](p)|0;p=(fb(d,o,q,q+168|0,n,g,0)|0)-q|0;if((p|0)>=168){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+24>>2]=((p|0)/12&-1|0)%7;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bO(4)|0;c[j>>2]=5257492;bg(j|0,5262728,378)}function go(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2]|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=j|0;l=c[f+28>>2]|0;f=l+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316234]|0)!=-1){c[k>>2]=5264936;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264936,k)}k=(c[1316235]|0)-1|0;m=c[l+20>>2]|0;do{if((c[l+24>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b2[c[(c[p>>2]|0)+4>>2]&1023](p)|0;p=(fb(d,o,q,q+288|0,n,g,0)|0)-q|0;if((p|0)>=288){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+16>>2]=((p|0)/12&-1|0)%12;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bO(4)|0;c[j>>2]=5257492;bg(j|0,5262728,378)}function gp(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+12|0;j=d;d=i;i=i+4|0;c[d>>2]=c[j>>2]|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=b|0;k=c[f+28>>2]|0;f=k+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316234]|0)!=-1){c[j>>2]=5264936;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264936,j)}j=(c[1316235]|0)-1|0;l=c[k+20>>2]|0;do{if((c[k+24>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[k>>2]|0)+8>>2]&1023](k)}n=gt(d,c[e>>2]|0,g,m,4)|0;if((c[g>>2]&4|0)!=0){o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}if((n|0)<69){r=n+2e3|0}else{r=(n-69|0)>>>0<31?n+1900|0:n}c[h+20>>2]=r-1900|0;o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}}while(0);b=bO(4)|0;c[b>>2]=5257492;bg(b|0,5262728,378)}function gq(e,f,g,h,j,k,l,m,n){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0;n=i;i=i+48|0;o=g;g=i;i=i+4|0;c[g>>2]=c[o>>2]|0;o=h;h=i;i=i+4|0;c[h>>2]=c[o>>2]|0;o=n|0;p=n+12|0;q=n+16|0;r=n+20|0;s=n+24|0;t=n+28|0;u=n+32|0;v=n+36|0;w=n+40|0;x=n+44|0;c[k>>2]=0;y=c[j+28>>2]|0;z=y+4|0;D=c[z>>2]|0,c[z>>2]=D+1,D;if((c[1316234]|0)!=-1){c[o>>2]=5264936;c[o+4>>2]=28;c[o+8>>2]=0;dY(5264936,o)}o=(c[1316235]|0)-1|0;A=c[y+20>>2]|0;do{if((c[y+24>>2]|0)-A>>2>>>0>o>>>0){B=c[A+(o<<2)>>2]|0;if((B|0)==0){break}C=B;if(((D=c[z>>2]|0,c[z>>2]=D+ -1,D)|0)==0){b$[c[(c[y>>2]|0)+8>>2]&1023](y)}E=m<<24>>24;L3200:do{if((E|0)==98|(E|0)==66|(E|0)==104){F=c[h>>2]|0;G=f+8|0;H=b2[c[(c[G>>2]|0)+4>>2]&1023](G)|0;G=(fb(g,F,H,H+288|0,C,k,0)|0)-H|0;if((G|0)>=288){break}c[l+16>>2]=((G|0)/12&-1|0)%12}else if((E|0)==114){G=g|0;gl(s,f,c[G>>2]|0,c[h>>2]|0,j,k,l,5252232,5252243);c[G>>2]=c[s>>2]|0}else if((E|0)==77){G=gt(g,c[h>>2]|0,k,C,2)|0;H=c[k>>2]|0;if((H&4|0)==0&(G|0)<60){c[l+4>>2]=G;break}else{c[k>>2]=H|4;break}}else if((E|0)==70){H=g|0;gl(r,f,c[H>>2]|0,c[h>>2]|0,j,k,l,5252244,5252252);c[H>>2]=c[r>>2]|0}else if((E|0)==68){H=g|0;gl(q,f,c[H>>2]|0,c[h>>2]|0,j,k,l,5252252,5252260);c[H>>2]=c[q>>2]|0}else if((E|0)==72){H=gt(g,c[h>>2]|0,k,C,2)|0;G=c[k>>2]|0;if((G&4|0)==0&(H|0)<24){c[l+8>>2]=H;break}else{c[k>>2]=G|4;break}}else if((E|0)==97|(E|0)==65){G=c[h>>2]|0;H=f+8|0;F=b2[c[c[H>>2]>>2]&1023](H)|0;H=(fb(g,G,F,F+168|0,C,k,0)|0)-F|0;if((H|0)>=168){break}c[l+24>>2]=((H|0)/12&-1|0)%7}else if((E|0)==84){H=g|0;gl(u,f,c[H>>2]|0,c[h>>2]|0,j,k,l,5252216,5252224);c[H>>2]=c[u>>2]|0}else if((E|0)==119){H=gt(g,c[h>>2]|0,k,C,1)|0;F=c[k>>2]|0;if((F&4|0)==0&(H|0)<7){c[l+24>>2]=H;break}else{c[k>>2]=F|4;break}}else if((E|0)==73){F=l+8|0;H=gt(g,c[h>>2]|0,k,C,2)|0;G=c[k>>2]|0;do{if((G&4|0)==0){if((H-1|0)>>>0>=12){break}c[F>>2]=H;break L3200}}while(0);c[k>>2]=G|4}else if((E|0)==100|(E|0)==101){H=l+12|0;F=gt(g,c[h>>2]|0,k,C,2)|0;I=c[k>>2]|0;do{if((I&4|0)==0){if((F-1|0)>>>0>=31){break}c[H>>2]=F;break L3200}}while(0);c[k>>2]=I|4}else if((E|0)==109){F=(gt(g,c[h>>2]|0,k,C,2)|0)-1|0;H=c[k>>2]|0;if((H&4|0)==0&(F|0)<12){c[l+16>>2]=F;break}else{c[k>>2]=H|4;break}}else if((E|0)==82){H=g|0;gl(t,f,c[H>>2]|0,c[h>>2]|0,j,k,l,5252224,5252229);c[H>>2]=c[t>>2]|0}else if((E|0)==106){H=gt(g,c[h>>2]|0,k,C,3)|0;F=c[k>>2]|0;if((F&4|0)==0&(H|0)<366){c[l+28>>2]=H;break}else{c[k>>2]=F|4;break}}else if((E|0)==112){F=l+8|0;H=c[h>>2]|0;G=f+8|0;J=b2[c[(c[G>>2]|0)+8>>2]&1023](G)|0;G=d[J]|0;if((G&1|0)==0){K=G>>>1}else{K=c[J+4>>2]|0}G=d[J+12|0]|0;if((G&1|0)==0){L=G>>>1}else{L=c[J+16>>2]|0}if((K|0)==(-L|0)){c[k>>2]=c[k>>2]|4;break}G=fb(g,H,J,J+24|0,C,k,0)|0;H=G-J|0;do{if((G|0)==(J|0)){if((c[F>>2]|0)!=12){break}c[F>>2]=0;break L3200}}while(0);if((H|0)!=12){break}J=c[F>>2]|0;if((J|0)>=12){break}c[F>>2]=J+12|0}else if((E|0)==83){J=gt(g,c[h>>2]|0,k,C,2)|0;G=c[k>>2]|0;if((G&4|0)==0&(J|0)<61){c[l>>2]=J;break}else{c[k>>2]=G|4;break}}else if((E|0)==89){G=gt(g,c[h>>2]|0,k,C,4)|0;if((c[k>>2]&4|0)!=0){break}c[l+20>>2]=G-1900|0}else if((E|0)==37){G=g|0;J=c[G>>2]|0;I=(c[h>>2]|0)==0;if(!((J|0)==0^I)){c[k>>2]=c[k>>2]|6;break}M=c[J+12>>2]|0;if((M|0)==(c[J+16>>2]|0)){N=b2[c[(c[J>>2]|0)+36>>2]&1023](J)|0}else{N=d[M]|0}if(bY[c[(c[B>>2]|0)+36>>2]&1023](C,N&255,0)<<24>>24!=37){c[k>>2]=c[k>>2]|4;break}M=c[G>>2]|0;J=M+12|0;O=c[J>>2]|0;P=M+16|0;Q=c[P>>2]|0;do{if((O|0)==(Q|0)){if((b2[c[(c[M>>2]|0)+40>>2]&1023](M)|0)==-1){R=2924;break}S=c[J>>2]|0;T=c[P>>2]|0;R=2922;break}else{U=O+1|0;c[J>>2]=U;S=U;T=Q;R=2922;break}}while(0);do{if((R|0)==2922){if((S|0)!=(T|0)){break}if((b2[c[(c[M>>2]|0)+36>>2]&1023](M)|0)==-1){R=2924;break}else{break}}}while(0);if((R|0)==2924){c[G>>2]=0}if((c[G>>2]|0)==0^I){break}c[k>>2]=c[k>>2]|2}else if((E|0)==121){M=gt(g,c[h>>2]|0,k,C,4)|0;if((c[k>>2]&4|0)!=0){break}if((M|0)<69){V=M+2e3|0}else{V=(M-69|0)>>>0<31?M+1900|0:M}c[l+20>>2]=V-1900|0}else if((E|0)==99){M=f+8|0;Q=b2[c[(c[M>>2]|0)+12>>2]&1023](M)|0;M=g|0;J=a[Q]|0;if((J&1)<<24>>24==0){W=Q+1|0}else{W=c[Q+8>>2]|0}O=J&255;if((O&1|0)==0){X=O>>>1}else{X=c[Q+4>>2]|0}gl(p,f,c[M>>2]|0,c[h>>2]|0,j,k,l,W,W+X|0);c[M>>2]=c[p>>2]|0}else if((E|0)==120){M=c[(c[f>>2]|0)+20>>2]|0;c[v>>2]=c[g>>2]|0;c[w>>2]=c[h>>2]|0;b5[M&1023](e,f,v,w,j,k,l);i=n;return}else if((E|0)==88){M=f+8|0;Q=b2[c[(c[M>>2]|0)+24>>2]&1023](M)|0;M=g|0;O=a[Q]|0;if((O&1)<<24>>24==0){Y=Q+1|0}else{Y=c[Q+8>>2]|0}J=O&255;if((J&1|0)==0){Z=J>>>1}else{Z=c[Q+4>>2]|0}gl(x,f,c[M>>2]|0,c[h>>2]|0,j,k,l,Y,Y+Z|0);c[M>>2]=c[x>>2]|0}else if((E|0)==110|(E|0)==116){M=B+8|0;Q=g|0;J=c[Q>>2]|0;O=(c[h>>2]|0)==0;L3313:do{if((J|0)==0^O){P=J;while(1){F=c[P+12>>2]|0;if((F|0)==(c[P+16>>2]|0)){_=b2[c[(c[P>>2]|0)+36>>2]&1023](P)|0}else{_=d[F]|0}F=_<<24>>24;if(F>>>0>=128){break}if((b[(c[M>>2]|0)+(F<<1)>>1]&8192)<<16>>16==0){break}F=c[Q>>2]|0;H=F+12|0;U=c[H>>2]|0;$=F+16|0;aa=c[$>>2]|0;do{if((U|0)==(aa|0)){if((b2[c[(c[F>>2]|0)+40>>2]&1023](F)|0)==-1){R=2868;break}ab=c[H>>2]|0;ac=c[$>>2]|0;R=2866;break}else{ad=U+1|0;c[H>>2]=ad;ab=ad;ac=aa;R=2866;break}}while(0);do{if((R|0)==2866){R=0;if((ab|0)!=(ac|0)){break}if((b2[c[(c[F>>2]|0)+36>>2]&1023](F)|0)==-1){R=2868;break}else{break}}}while(0);if((R|0)==2868){R=0;c[Q>>2]=0}F=c[Q>>2]|0;if((F|0)==0^O){P=F}else{ae=F;break L3313}}ae=c[Q>>2]|0}else{ae=J}}while(0);if((ae|0)==0^O){break}c[k>>2]=c[k>>2]|2}else{c[k>>2]=c[k>>2]|4}}while(0);c[e>>2]=c[g>>2]|0;i=n;return}}while(0);n=bO(4)|0;c[n>>2]=5257492;bg(n|0,5262728,378)}function gr(a){a=a|0;return}function gs(a){a=a|0;return 2}function gt(a,e,f,g,h){a=a|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0;i=a|0;a=c[i>>2]|0;j=(e|0)==0;if(!((a|0)==0^j)){c[f>>2]=c[f>>2]|6;k=0;return k|0}e=c[a+12>>2]|0;if((e|0)==(c[a+16>>2]|0)){l=b2[c[(c[a>>2]|0)+36>>2]&1023](a)|0}else{l=d[e]|0}e=l&255;a=l<<24>>24;do{if(a>>>0<128){l=g+8|0;if((b[(c[l>>2]|0)+(a<<1)>>1]&2048)<<16>>16==0){break}m=g;n=bY[c[(c[m>>2]|0)+36>>2]&1023](g,e,0)<<24>>24;o=c[i>>2]|0;p=o+12|0;q=c[p>>2]|0;r=o+16|0;s=c[r>>2]|0;do{if((q|0)==(s|0)){if((b2[c[(c[o>>2]|0)+40>>2]&1023](o)|0)==-1){t=2949;break}u=c[p>>2]|0;v=c[r>>2]|0;t=2947;break}else{w=q+1|0;c[p>>2]=w;u=w;v=s;t=2947;break}}while(0);do{if((t|0)==2947){if((u|0)!=(v|0)){break}if((b2[c[(c[o>>2]|0)+36>>2]&1023](o)|0)==-1){t=2949;break}else{break}}}while(0);if((t|0)==2949){c[i>>2]=0}o=n-48|0;s=h-1|0;p=c[i>>2]|0;q=(p|0)==0^j;L3364:do{if(q&(s|0)>0){r=o;w=s;x=p;while(1){y=c[x+12>>2]|0;if((y|0)==(c[x+16>>2]|0)){z=b2[c[(c[x>>2]|0)+36>>2]&1023](x)|0}else{z=d[y]|0}y=z<<24>>24;if(y>>>0>=128){k=r;t=2972;break}if((b[(c[l>>2]|0)+(y<<1)>>1]&2048)<<16>>16==0){k=r;t=2969;break}y=(bY[c[(c[m>>2]|0)+36>>2]&1023](g,z&255,0)<<24>>24)+(r*10&-1)|0;A=c[i>>2]|0;B=A+12|0;C=c[B>>2]|0;D=A+16|0;E=c[D>>2]|0;do{if((C|0)==(E|0)){if((b2[c[(c[A>>2]|0)+40>>2]&1023](A)|0)==-1){t=2962;break}F=c[B>>2]|0;G=c[D>>2]|0;t=2960;break}else{H=C+1|0;c[B>>2]=H;F=H;G=E;t=2960;break}}while(0);do{if((t|0)==2960){t=0;if((F|0)!=(G|0)){break}if((b2[c[(c[A>>2]|0)+36>>2]&1023](A)|0)==-1){t=2962;break}else{break}}}while(0);if((t|0)==2962){t=0;c[i>>2]=0}A=y-48|0;E=w-1|0;B=c[i>>2]|0;C=(B|0)==0^j;if(C&(E|0)>0){r=A;w=E;x=B}else{I=A;J=C;break L3364}}if((t|0)==2969){return k|0}else if((t|0)==2972){return k|0}}else{I=o;J=q}}while(0);if(J){k=I;return k|0}c[f>>2]=c[f>>2]|2;k=I;return k|0}}while(0);c[f>>2]=c[f>>2]|4;k=0;return k|0}function gu(a){a=a|0;if((a|0)==0){return}j0(a);return}function gv(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0;j=i;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2]|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;gw(a,b,c[d>>2]|0,c[e>>2]|0,f,g,h,5252184,5252216);i=j;return}function gw(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0;l=i;i=i+24|0;m=l|0;n=l+12|0;o=l+16|0;p=l+20|0;q=c[f+28>>2]|0;r=q+4|0;D=c[r>>2]|0,c[r>>2]=D+1,D;if((c[1316232]|0)!=-1){c[m>>2]=5264928;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264928,m)}m=(c[1316233]|0)-1|0;s=c[q+20>>2]|0;do{if((c[q+24>>2]|0)-s>>2>>>0>m>>>0){t=c[s+(m<<2)>>2]|0;if((t|0)==0){break}u=t;if(((D=c[r>>2]|0,c[r>>2]=D+ -1,D)|0)==0){b$[c[(c[q>>2]|0)+8>>2]&1023](q)}c[g>>2]=0;L3409:do{if((j|0)==(k|0)){v=d}else{w=t;x=t;y=t;z=b;A=o|0;B=p|0;C=n|0;E=(e|0)==0;F=j;G=0;H=d;L3411:while(1){I=(H|0)==0^E;J=H+12|0;K=H+16|0;L=H;M=G;while(1){if((M|0)!=0){v=H;break L3409}if(!I){N=2992;break L3411}if(bY[c[(c[w>>2]|0)+52>>2]&1023](u,c[F>>2]|0,0)<<24>>24==37){N=2996;break}if(bY[c[(c[x>>2]|0)+12>>2]&1023](u,8192,c[F>>2]|0)|0){O=F;N=3006;break}P=c[J>>2]|0;if((P|0)==(c[K>>2]|0)){Q=b2[c[(c[L>>2]|0)+36>>2]&1023](H)|0}else{Q=c[P>>2]|0}P=cc[c[(c[y>>2]|0)+28>>2]&1023](u,Q)|0;if((P|0)==(cc[c[(c[y>>2]|0)+28>>2]&1023](u,c[F>>2]|0)|0)){N=3028;break}c[g>>2]=4;M=4}L3424:do{if((N|0)==3006){while(1){N=0;M=O+4|0;if((M|0)==(k|0)){R=k;break}if(bY[c[(c[x>>2]|0)+12>>2]&1023](u,8192,c[M>>2]|0)|0){O=M;N=3006}else{R=M;break}}M=H;while(1){I=M+12|0;P=M+16|0;S=M;T=(M|0)==0^E;while(1){U=c[I>>2]|0;if((U|0)==(c[P>>2]|0)){V=b2[c[(c[S>>2]|0)+36>>2]&1023](M)|0}else{V=c[U>>2]|0}if(!(bY[c[(c[x>>2]|0)+12>>2]&1023](u,8192,V)|0)){W=R;X=M;break L3424}U=c[I>>2]|0;if((U|0)==(c[P>>2]|0)){Y=b2[c[(c[S>>2]|0)+40>>2]&1023](M)|0}else{c[I>>2]=U+4|0;Y=c[U>>2]|0}if((Y|0)==-1){break}U=c[I>>2]|0;if((U|0)==(c[P>>2]|0)){Z=b2[c[(c[S>>2]|0)+36>>2]&1023](M)|0}else{Z=c[U>>2]|0}if((Z|0)==-1){break}if(!T){W=R;X=M;break L3424}}if(E){W=R;X=0;break L3424}else{M=0}}}else if((N|0)==2996){N=0;M=F+4|0;if((M|0)==(k|0)){N=2997;break L3411}T=bY[c[(c[w>>2]|0)+52>>2]&1023](u,c[M>>2]|0,0)|0;if((T<<24>>24|0)==69|(T<<24>>24|0)==48){S=F+8|0;if((S|0)==(k|0)){N=3e3;break L3411}_=T;$=bY[c[(c[w>>2]|0)+52>>2]&1023](u,c[S>>2]|0,0)|0;aa=S}else{_=0;$=T;aa=M}M=c[(c[z>>2]|0)+36>>2]|0;c[A>>2]=H;c[B>>2]=e;b1[M&1023](n,b,o,p,f,g,h,$,_);W=aa+4|0;X=c[C>>2]|0}else if((N|0)==3028){N=0;M=c[J>>2]|0;if((M|0)==(c[K>>2]|0)){ab=b2[c[(c[L>>2]|0)+40>>2]&1023](H)|0}else{c[J>>2]=M+4|0;ab=c[M>>2]|0}do{if((ab|0)==-1){N=3036}else{M=c[J>>2]|0;if((M|0)==(c[K>>2]|0)){ac=b2[c[(c[L>>2]|0)+36>>2]&1023](H)|0}else{ac=c[M>>2]|0}if((ac|0)==-1){N=3036;break}else{ad=H;break}}}while(0);if((N|0)==3036){N=0;ad=0}W=F+4|0;X=ad}}while(0);if((W|0)==(k|0)){v=X;break L3409}F=W;G=c[g>>2]|0;H=X}if((N|0)==2992){c[g>>2]=4;v=H;break}else if((N|0)==3e3){c[g>>2]=4;v=H;break}else if((N|0)==2997){c[g>>2]=4;v=H;break}}}while(0);if((v|0)==0^(e|0)==0){ae=a|0;c[ae>>2]=v;i=l;return}c[g>>2]=c[g>>2]|2;ae=a|0;c[ae>>2]=v;i=l;return}}while(0);l=bO(4)|0;c[l>>2]=5257492;bg(l|0,5262728,378)}function gx(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+12|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=k|0;m=c[g+28>>2]|0;n=m+4|0;D=c[n>>2]|0,c[n>>2]=D+1,D;if((c[1316232]|0)!=-1){c[l>>2]=5264928;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264928,l)}l=(c[1316233]|0)-1|0;o=c[m+20>>2]|0;do{if((c[m+24>>2]|0)-o>>2>>>0>l>>>0){if((c[o+(l<<2)>>2]|0)==0){break}if(((D=c[n>>2]|0,c[n>>2]=D+ -1,D)|0)==0){b$[c[(c[m>>2]|0)+8>>2]&1023](m)}p=d+8|0;q=b2[c[(c[p>>2]|0)+20>>2]&1023](p)|0;p=c[e>>2]|0;r=c[f>>2]|0;s=a[q]|0;if((s&1)<<24>>24==0){t=q+4|0}else{t=c[q+8>>2]|0}u=s&255;if((u&1|0)==0){s=u>>>1;u=t+(s<<2)|0;gw(b,d,p,r,g,h,j,t,u);i=k;return}else{s=c[q+4>>2]|0;u=t+(s<<2)|0;gw(b,d,p,r,g,h,j,t,u);i=k;return}}}while(0);k=bO(4)|0;c[k>>2]=5257492;bg(k|0,5262728,378)}function gy(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2]|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=j|0;l=c[f+28>>2]|0;f=l+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316232]|0)!=-1){c[k>>2]=5264928;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264928,k)}k=(c[1316233]|0)-1|0;m=c[l+20>>2]|0;do{if((c[l+24>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b2[c[c[p>>2]>>2]&1023](p)|0;p=(fD(d,o,q,q+168|0,n,g,0)|0)-q|0;if((p|0)>=168){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+24>>2]=((p|0)/12&-1|0)%7;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bO(4)|0;c[j>>2]=5257492;bg(j|0,5262728,378)}function gz(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+12|0;k=d;d=i;i=i+4|0;c[d>>2]=c[k>>2]|0;k=e;e=i;i=i+4|0;c[e>>2]=c[k>>2]|0;k=j|0;l=c[f+28>>2]|0;f=l+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316232]|0)!=-1){c[k>>2]=5264928;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264928,k)}k=(c[1316233]|0)-1|0;m=c[l+20>>2]|0;do{if((c[l+24>>2]|0)-m>>2>>>0>k>>>0){n=c[m+(k<<2)>>2]|0;if((n|0)==0){break}if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[l>>2]|0)+8>>2]&1023](l)}o=c[e>>2]|0;p=b+8|0;q=b2[c[(c[p>>2]|0)+4>>2]&1023](p)|0;p=(fD(d,o,q,q+288|0,n,g,0)|0)-q|0;if((p|0)>=288){r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}c[h+16>>2]=((p|0)/12&-1|0)%12;r=d|0;s=c[r>>2]|0;t=a|0;c[t>>2]=s;i=j;return}}while(0);j=bO(4)|0;c[j>>2]=5257492;bg(j|0,5262728,378)}function gA(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+12|0;j=d;d=i;i=i+4|0;c[d>>2]=c[j>>2]|0;j=e;e=i;i=i+4|0;c[e>>2]=c[j>>2]|0;j=b|0;k=c[f+28>>2]|0;f=k+4|0;D=c[f>>2]|0,c[f>>2]=D+1,D;if((c[1316232]|0)!=-1){c[j>>2]=5264928;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264928,j)}j=(c[1316233]|0)-1|0;l=c[k+20>>2]|0;do{if((c[k+24>>2]|0)-l>>2>>>0>j>>>0){m=c[l+(j<<2)>>2]|0;if((m|0)==0){break}if(((D=c[f>>2]|0,c[f>>2]=D+ -1,D)|0)==0){b$[c[(c[k>>2]|0)+8>>2]&1023](k)}n=g1(d,c[e>>2]|0,g,m,4)|0;if((c[g>>2]&4|0)!=0){o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}if((n|0)<69){r=n+2e3|0}else{r=(n-69|0)>>>0<31?n+1900|0:n}c[h+20>>2]=r-1900|0;o=d|0;p=c[o>>2]|0;q=a|0;c[q>>2]=p;i=b;return}}while(0);b=bO(4)|0;c[b>>2]=5257492;bg(b|0,5262728,378)}function gB(b,e,f,g,h,j,k,l,m){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0;m=i;i=i+48|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=g;g=i;i=i+4|0;c[g>>2]=c[n>>2]|0;n=m|0;o=m+12|0;p=m+16|0;q=m+20|0;r=m+24|0;s=m+28|0;t=m+32|0;u=m+36|0;v=m+40|0;w=m+44|0;c[j>>2]=0;x=c[h+28>>2]|0;y=x+4|0;D=c[y>>2]|0,c[y>>2]=D+1,D;if((c[1316232]|0)!=-1){c[n>>2]=5264928;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264928,n)}n=(c[1316233]|0)-1|0;z=c[x+20>>2]|0;do{if((c[x+24>>2]|0)-z>>2>>>0>n>>>0){A=c[z+(n<<2)>>2]|0;if((A|0)==0){break}B=A;if(((D=c[y>>2]|0,c[y>>2]=D+ -1,D)|0)==0){b$[c[(c[x>>2]|0)+8>>2]&1023](x)}C=l<<24>>24;L10:do{if((C|0)==97|(C|0)==65){E=c[g>>2]|0;F=e+8|0;G=b2[c[c[F>>2]>>2]&1023](F)|0;F=(fD(f,E,G,G+168|0,B,j,0)|0)-G|0;if((F|0)>=168){break}c[k+24>>2]=((F|0)/12&-1|0)%7}else if((C|0)==98|(C|0)==66|(C|0)==104){F=c[g>>2]|0;G=e+8|0;E=b2[c[(c[G>>2]|0)+4>>2]&1023](G)|0;G=(fD(f,F,E,E+288|0,B,j,0)|0)-E|0;if((G|0)>=288){break}c[k+16>>2]=((G|0)/12&-1|0)%12}else if((C|0)==99){G=e+8|0;E=b2[c[(c[G>>2]|0)+12>>2]&1023](G)|0;G=f|0;F=a[E]|0;if((F&1)<<24>>24==0){H=E+4|0}else{H=c[E+8>>2]|0}I=F&255;if((I&1|0)==0){J=I>>>1}else{J=c[E+4>>2]|0}gw(o,e,c[G>>2]|0,c[g>>2]|0,h,j,k,H,H+(J<<2)|0);c[G>>2]=c[o>>2]|0}else if((C|0)==100|(C|0)==101){G=k+12|0;E=g1(f,c[g>>2]|0,j,B,2)|0;I=c[j>>2]|0;do{if((I&4|0)==0){if((E-1|0)>>>0>=31){break}c[G>>2]=E;break L10}}while(0);c[j>>2]=I|4}else if((C|0)==68){E=f|0;gw(p,e,c[E>>2]|0,c[g>>2]|0,h,j,k,5252152,5252184);c[E>>2]=c[p>>2]|0}else if((C|0)==70){E=f|0;gw(q,e,c[E>>2]|0,c[g>>2]|0,h,j,k,5252120,5252152);c[E>>2]=c[q>>2]|0}else if((C|0)==72){E=g1(f,c[g>>2]|0,j,B,2)|0;G=c[j>>2]|0;if((G&4|0)==0&(E|0)<24){c[k+8>>2]=E;break}else{c[j>>2]=G|4;break}}else if((C|0)==73){G=k+8|0;E=g1(f,c[g>>2]|0,j,B,2)|0;F=c[j>>2]|0;do{if((F&4|0)==0){if((E-1|0)>>>0>=12){break}c[G>>2]=E;break L10}}while(0);c[j>>2]=F|4}else if((C|0)==106){E=g1(f,c[g>>2]|0,j,B,3)|0;G=c[j>>2]|0;if((G&4|0)==0&(E|0)<366){c[k+28>>2]=E;break}else{c[j>>2]=G|4;break}}else if((C|0)==109){G=(g1(f,c[g>>2]|0,j,B,2)|0)-1|0;E=c[j>>2]|0;if((E&4|0)==0&(G|0)<12){c[k+16>>2]=G;break}else{c[j>>2]=E|4;break}}else if((C|0)==77){E=g1(f,c[g>>2]|0,j,B,2)|0;G=c[j>>2]|0;if((G&4|0)==0&(E|0)<60){c[k+4>>2]=E;break}else{c[j>>2]=G|4;break}}else if((C|0)==110|(C|0)==116){G=f|0;E=c[G>>2]|0;I=(c[g>>2]|0)==0;L53:do{if((E|0)==0^I){K=A;L=E;L55:while(1){M=c[L+12>>2]|0;if((M|0)==(c[L+16>>2]|0)){N=b2[c[(c[L>>2]|0)+36>>2]&1023](L)|0}else{N=c[M>>2]|0}M=bY[c[(c[K>>2]|0)+12>>2]&1023](B,8192,N)|0;O=c[G>>2]|0;if(!M){P=O;Q=61;break L53}M=O+12|0;R=c[M>>2]|0;S=O+16|0;if((R|0)==(c[S>>2]|0)){T=b2[c[(c[O>>2]|0)+40>>2]&1023](O)|0}else{c[M>>2]=R+4|0;T=c[R>>2]|0}do{if((T|0)!=-1){R=c[M>>2]|0;if((R|0)==(c[S>>2]|0)){U=b2[c[(c[O>>2]|0)+36>>2]&1023](O)|0}else{U=c[R>>2]|0}if((U|0)==-1){break}R=c[G>>2]|0;if((R|0)==0^I){L=R;continue L55}else{P=R;Q=61;break L53}}}while(0);c[G>>2]=0;if(I){break L53}else{L=0}}}else{P=E;Q=61}}while(0);if((Q|0)==61){if((P|0)==0^I){break}}c[j>>2]=c[j>>2]|2}else if((C|0)==112){E=k+8|0;G=c[g>>2]|0;F=e+8|0;L=b2[c[(c[F>>2]|0)+8>>2]&1023](F)|0;F=d[L]|0;if((F&1|0)==0){V=F>>>1}else{V=c[L+4>>2]|0}F=d[L+12|0]|0;if((F&1|0)==0){W=F>>>1}else{W=c[L+16>>2]|0}if((V|0)==(-W|0)){c[j>>2]=c[j>>2]|4;break}F=fD(f,G,L,L+24|0,B,j,0)|0;G=F-L|0;do{if((F|0)==(L|0)){if((c[E>>2]|0)!=12){break}c[E>>2]=0;break L10}}while(0);if((G|0)!=12){break}L=c[E>>2]|0;if((L|0)>=12){break}c[E>>2]=L+12|0}else if((C|0)==114){L=f|0;gw(r,e,c[L>>2]|0,c[g>>2]|0,h,j,k,5252076,5252120);c[L>>2]=c[r>>2]|0}else if((C|0)==82){L=f|0;gw(s,e,c[L>>2]|0,c[g>>2]|0,h,j,k,5252056,5252076);c[L>>2]=c[s>>2]|0}else if((C|0)==83){L=g1(f,c[g>>2]|0,j,B,2)|0;F=c[j>>2]|0;if((F&4|0)==0&(L|0)<61){c[k>>2]=L;break}else{c[j>>2]=F|4;break}}else if((C|0)==84){F=f|0;gw(t,e,c[F>>2]|0,c[g>>2]|0,h,j,k,5252024,5252056);c[F>>2]=c[t>>2]|0}else if((C|0)==119){F=g1(f,c[g>>2]|0,j,B,1)|0;L=c[j>>2]|0;if((L&4|0)==0&(F|0)<7){c[k+24>>2]=F;break}else{c[j>>2]=L|4;break}}else if((C|0)==120){L=c[(c[e>>2]|0)+20>>2]|0;c[u>>2]=c[f>>2]|0;c[v>>2]=c[g>>2]|0;b5[L&1023](b,e,u,v,h,j,k);i=m;return}else if((C|0)==88){L=e+8|0;F=b2[c[(c[L>>2]|0)+24>>2]&1023](L)|0;L=f|0;I=a[F]|0;if((I&1)<<24>>24==0){X=F+4|0}else{X=c[F+8>>2]|0}K=I&255;if((K&1|0)==0){Y=K>>>1}else{Y=c[F+4>>2]|0}gw(w,e,c[L>>2]|0,c[g>>2]|0,h,j,k,X,X+(Y<<2)|0);c[L>>2]=c[w>>2]|0}else if((C|0)==121){L=g1(f,c[g>>2]|0,j,B,4)|0;if((c[j>>2]&4|0)!=0){break}if((L|0)<69){Z=L+2e3|0}else{Z=(L-69|0)>>>0<31?L+1900|0:L}c[k+20>>2]=Z-1900|0}else if((C|0)==89){L=g1(f,c[g>>2]|0,j,B,4)|0;if((c[j>>2]&4|0)!=0){break}c[k+20>>2]=L-1900|0}else if((C|0)==37){L=f|0;F=c[L>>2]|0;K=(c[g>>2]|0)==0;if(!((F|0)==0^K)){c[j>>2]=c[j>>2]|6;break}I=c[F+12>>2]|0;if((I|0)==(c[F+16>>2]|0)){_=b2[c[(c[F>>2]|0)+36>>2]&1023](F)|0}else{_=c[I>>2]|0}if(bY[c[(c[A>>2]|0)+52>>2]&1023](B,_,0)<<24>>24!=37){c[j>>2]=c[j>>2]|4;break}I=c[L>>2]|0;F=I+12|0;O=c[F>>2]|0;S=I+16|0;if((O|0)==(c[S>>2]|0)){$=b2[c[(c[I>>2]|0)+40>>2]&1023](I)|0}else{c[F>>2]=O+4|0;$=c[O>>2]|0}do{if(($|0)==-1){Q=116}else{O=c[F>>2]|0;if((O|0)==(c[S>>2]|0)){aa=b2[c[(c[I>>2]|0)+36>>2]&1023](I)|0}else{aa=c[O>>2]|0}if((aa|0)==-1){Q=116;break}if((c[L>>2]|0)==0^K){break L10}else{break}}}while(0);if((Q|0)==116){c[L>>2]=0;if(!K){break}}c[j>>2]=c[j>>2]|2}else{c[j>>2]=c[j>>2]|4}}while(0);c[b>>2]=c[f>>2]|0;i=m;return}}while(0);m=bO(4)|0;c[m>>2]=5257492;bg(m|0,5262728,378)}function gC(a){a=a|0;return}function gD(a){a=a|0;return 127}function gE(a){a=a|0;return 127}function gF(a){a=a|0;return 0}function gG(a){a=a|0;return}function gH(a){a=a|0;return 127}function gI(a){a=a|0;return 127}function gJ(a){a=a|0;return 0}function gK(a){a=a|0;return}function gL(a){a=a|0;return 2147483647}function gM(a){a=a|0;return 2147483647}function gN(a){a=a|0;return 0}function gO(a){a=a|0;return}function gP(a){a=a|0;return 2147483647}function gQ(a){a=a|0;return 2147483647}function gR(a){a=a|0;return 0}function gS(a){a=a|0;return}function gT(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function gU(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function gV(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function gW(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function gX(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function gY(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function gZ(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function g_(b,c){b=b|0;c=c|0;c=b;x=67109634;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;return}function g$(b,c){b=b|0;c=c|0;c=b;a[b]=2;a[c+1|0]=45;a[c+2|0]=0;return}function g0(b,c){b=b|0;c=c|0;c=b;a[b]=2;a[c+1|0]=45;a[c+2|0]=0;return}function g1(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;g=a|0;a=c[g>>2]|0;h=(b|0)==0;if(!((a|0)==0^h)){c[d>>2]=c[d>>2]|6;i=0;return i|0}b=c[a+12>>2]|0;if((b|0)==(c[a+16>>2]|0)){j=b2[c[(c[a>>2]|0)+36>>2]&1023](a)|0}else{j=c[b>>2]|0}b=e;if(!(bY[c[(c[b>>2]|0)+12>>2]&1023](e,2048,j)|0)){c[d>>2]=c[d>>2]|4;i=0;return i|0}a=e;k=bY[c[(c[a>>2]|0)+52>>2]&1023](e,j,0)<<24>>24;j=c[g>>2]|0;l=j+12|0;m=c[l>>2]|0;n=j+16|0;if((m|0)==(c[n>>2]|0)){o=b2[c[(c[j>>2]|0)+40>>2]&1023](j)|0}else{c[l>>2]=m+4|0;o=c[m>>2]|0}do{if((o|0)==-1){p=168}else{m=c[l>>2]|0;if((m|0)==(c[n>>2]|0)){q=b2[c[(c[j>>2]|0)+36>>2]&1023](j)|0}else{q=c[m>>2]|0}if((q|0)==-1){p=168;break}r=c[g>>2]|0;break}}while(0);if((p|0)==168){c[g>>2]=0;r=0}q=k-48|0;k=f-1|0;f=(r|0)==0^h;L209:do{if(f&(k|0)>0){j=q;n=k;l=r;while(1){o=c[l+12>>2]|0;if((o|0)==(c[l+16>>2]|0)){s=b2[c[(c[l>>2]|0)+36>>2]&1023](l)|0}else{s=c[o>>2]|0}if(!(bY[c[(c[b>>2]|0)+12>>2]&1023](e,2048,s)|0)){i=j;break}o=(bY[c[(c[a>>2]|0)+52>>2]&1023](e,s,0)<<24>>24)+(j*10&-1)|0;m=c[g>>2]|0;t=m+12|0;u=c[t>>2]|0;v=m+16|0;if((u|0)==(c[v>>2]|0)){w=b2[c[(c[m>>2]|0)+40>>2]&1023](m)|0}else{c[t>>2]=u+4|0;w=c[u>>2]|0}do{if((w|0)==-1){p=183}else{u=c[t>>2]|0;if((u|0)==(c[v>>2]|0)){x=b2[c[(c[m>>2]|0)+36>>2]&1023](m)|0}else{x=c[u>>2]|0}if((x|0)==-1){p=183;break}y=c[g>>2]|0;break}}while(0);if((p|0)==183){p=0;c[g>>2]=0;y=0}m=o-48|0;v=n-1|0;t=(y|0)==0^h;if(t&(v|0)>0){j=m;n=v;l=y}else{z=m;A=t;break L209}}return i|0}else{z=q;A=f}}while(0);if(A){i=z;return i|0}c[d>>2]=c[d>>2]|2;i=z;return i|0}function g2(a){a=a|0;var b=0,d=0;b=a;d=c[a+8>>2]|0;do{if((d|0)!=0){a2(d|0);if((a|0)!=0){break}return}}while(0);j0(b);return}function g3(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a2(b|0);return}function g4(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=i;i=i+104|0;f=e;e=i;i=i+4|0;c[e>>2]=c[f>>2]|0;f=g|0;l=g+4|0;m=l|0;n=f|0;a[n]=37;o=f+1|0;a[o]=j;p=f+2|0;a[p]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[o]=k;a[p]=j}j=be(m|0,100,n|0,h|0,c[d+8>>2]|0)|0;d=l+j|0;l=c[e>>2]|0;if((j|0)==0){q=l;r=b|0;c[r>>2]=q;i=g;return}else{s=l;t=m}while(1){m=a[t]|0;if((s|0)==0){u=0}else{l=s+24|0;j=c[l>>2]|0;if((j|0)==(c[s+28>>2]|0)){v=cc[c[(c[s>>2]|0)+52>>2]&1023](s,m&255)|0}else{c[l>>2]=j+1|0;a[j]=m;v=m&255}u=(v|0)==-1?0:s}m=t+1|0;if((m|0)==(d|0)){q=u;break}else{s=u;t=m}}r=b|0;c[r>>2]=q;i=g;return}function g5(a){a=a|0;var b=0,d=0;b=a;d=c[a+8>>2]|0;do{if((d|0)!=0){a2(d|0);if((a|0)!=0){break}return}}while(0);j0(b);return}function g6(a){a=a|0;var b=0;b=c[a+8>>2]|0;if((b|0)==0){return}a2(b|0);return}function g7(a){a=a|0;if((a|0)==0){return}j0(a);return}function g8(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function g9(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function ha(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hb(a){a=a|0;if((a|0)==0){return}j0(a);return}function hc(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hd(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function he(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hf(a){a=a|0;if((a|0)==0){return}j0(a);return}function hg(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hh(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hi(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hj(b,d){b=b|0;d=d|0;a[b]=2;d=b+4|0;aF(d|0,45,1);c[d+4>>2]=0;return}function hk(a){a=a|0;if((a|0)==0){return}j0(a);return}function hl(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hm(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function hn(a,b){a=a|0;b=b|0;b=a;c[b>>2]=0;c[b+4>>2]=0;c[b+8>>2]=0;return}function ho(b,d){b=b|0;d=d|0;a[b]=2;d=b+4|0;aF(d|0,45,1);c[d+4>>2]=0;return}function hp(a){a=a|0;if((a|0)==0){return}j0(a);return}function hq(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;g=i;i=i+516|0;f=e;e=i;i=i+4|0;c[e>>2]=c[f>>2]|0;f=g|0;l=g+104|0;m=g+112|0;n=g+116|0;o=n|0;p=g+4|0;q=f|0;a[q]=37;r=f+1|0;a[r]=j;s=f+2|0;a[s]=k;a[f+3|0]=0;if(k<<24>>24!=0){a[r]=k;a[s]=j}j=d+8|0;be(p|0,100,q|0,h|0,c[j>>2]|0);h=l;c[h>>2]=0;c[h+4>>2]=0;c[m>>2]=p;p=bA(c[j>>2]|0)|0;j=br(o|0,m|0,100,l|0)|0;if((p|0)!=0){bA(p|0)}if((j|0)==-1){hw(5245268)}p=n+(j<<2)|0;n=c[e>>2]|0;if((j|0)==0){t=n;u=b|0;c[u>>2]=t;i=g;return}else{v=n;w=o}while(1){o=c[w>>2]|0;if((v|0)==0){x=0}else{n=v+24|0;j=c[n>>2]|0;if((j|0)==(c[v+28>>2]|0)){y=cc[c[(c[v>>2]|0)+52>>2]&1023](v,o)|0}else{c[n>>2]=j+4|0;c[j>>2]=o;y=o}x=(y|0)==-1?0:v}o=w+4|0;if((o|0)==(p|0)){t=x;break}else{v=x;w=o}}u=b|0;c[u>>2]=t;i=g;return}function hr(a){a=a|0;return}function hs(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+240|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=d|0;m=d+12|0;n=d+112|0;o=d+120|0;p=d+124|0;q=d+128|0;r=d+140|0;s=n|0;c[s>>2]=m|0;t=n+4|0;c[t>>2]=450;u=c[h+28>>2]|0;v=u;x=u+4|0;D=c[x>>2]|0,c[x>>2]=D+1,D;if((c[1316234]|0)!=-1){c[l>>2]=5264936;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264936,l)}l=(c[1316235]|0)-1|0;x=c[u+20>>2]|0;do{if((c[u+24>>2]|0)-x>>2>>>0>l>>>0){y=c[x+(l<<2)>>2]|0;if((y|0)==0){break}z=y;a[p]=0;A=f|0;do{if(ht(e,c[A>>2]|0,g,v,c[h+4>>2]|0,j,p,z,n,o,m+100|0)|0){B=q|0;C=c[(c[y>>2]|0)+32>>2]|0;b9[C&1023](z,5252012,5252022,B);C=r|0;E=c[o>>2]|0;F=c[s>>2]|0;G=E-F|0;do{if(G>>>0>98){H=j$(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}H=bO(4)|0;c[H>>2]=5257468;bg(H|0,5262716,348)}else{I=C;J=0}}while(0);if((a[p]&1)<<24>>24==0){K=I}else{a[I]=45;K=I+1|0}L359:do{if(F>>>0<E>>>0){G=q+10|0;H=q;L=K;M=F;while(1){N=B;while(1){if((N|0)==(G|0)){O=G;break}if(a[N]<<24>>24==a[M]<<24>>24){O=N;break}else{N=N+1|0}}a[L]=a[5252012+(O-H|0)|0]|0;N=M+1|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break L359}}}else{Q=K}}while(0);a[Q]=0;if((bB(C|0,5247488,(w=i,i=i+4|0,c[w>>2]=k,w)|0)|0)==1){if((J|0)==0){break}j0(J);break}B=bO(8)|0;c[B>>2]=5257516;F=B+4|0;E=F;do{if((F|0)!=0){while(1){R=j$(28)|0;if((R|0)!=0){S=338;break}M=(D=c[1316362]|0,c[1316362]=D+0,D);if((M|0)==0){break}b7[M&1023]()}if((S|0)==338){c[R+4>>2]=15;c[R>>2]=15;M=R+12|0;c[E>>2]=M;c[R+8>>2]=0;j9(M,5247460,16);break}M=bO(4)|0;c[M>>2]=5257468;bg(M|0,5262716,348)}}while(0);bg(B|0,5262740,44)}}while(0);z=c[e>>2]|0;if(!((z|0)==0^(c[A>>2]|0)==0)){c[j>>2]=c[j>>2]|2}c[b>>2]=z;z=u+4|0;if(((D=c[z>>2]|0,c[z>>2]=D+ -1,D)|0)==0){b$[c[(c[u>>2]|0)+8>>2]&1023](u)}z=c[s>>2]|0;c[s>>2]=0;if((z|0)==0){i=d;return}b$[c[t>>2]&1023](z);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function ht(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bY=0,bZ=0,b_=0,b1=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0,ci=0,cj=0;q=i;i=i+632|0;r=q|0;s=q+100|0;t=q+112|0;u=q+124|0;v=q+128|0;w=q+140|0;x=q+152|0;y=q+164|0;z=q+176|0;A=q+180|0;B=q+192|0;C=q+204|0;D=q+216|0;E=q+228|0;F=q+628|0;G=F;H=i;i=i+12|0;I=H;J=i;i=i+12|0;K=i;i=i+12|0;L=i;i=i+12|0;M=i;i=i+4|0;N=E|0;c[I>>2]=0;c[I+4>>2]=0;c[I+8>>2]=0;O=J;P=K;Q=L;c[O>>2]=0;c[O+4>>2]=0;c[O+8>>2]=0;c[P>>2]=0;c[P+4>>2]=0;c[P+8>>2]=0;c[Q>>2]=0;c[Q+4>>2]=0;c[Q+8>>2]=0;R=v;S=w;T=x;U=y;V=A;W=B;X=C;Y=D;L397:do{if(g){Z=u;if((c[1316357]|0)!=-1){c[t>>2]=5265428;c[t+4>>2]=28;c[t+8>>2]=0;dY(5265428,t)}_=(c[1316358]|0)-1|0;$=c[h+20>>2]|0;do{if((c[h+24>>2]|0)-$>>2>>>0>_>>>0){aa=c[$+(_<<2)>>2]|0;if((aa|0)==0){break}ab=aa;b0[c[(c[aa>>2]|0)+44>>2]&1023](Z,ab);c[F>>2]=c[u>>2]|0;ac=aa;b0[c[(c[ac>>2]|0)+32>>2]&1023](v,ab);dV(L,v);do{if((a[R]&1)<<24>>24!=0){ad=c[v+8>>2]|0;if((ad|0)==0){break}j0(ad)}}while(0);b0[c[(c[ac>>2]|0)+28>>2]&1023](w,ab);dV(K,w);do{if((a[S]&1)<<24>>24!=0){ad=c[w+8>>2]|0;if((ad|0)==0){break}j0(ad)}}while(0);ad=aa;ae=b2[c[(c[ad>>2]|0)+12>>2]&1023](ab)|0;af=b2[c[(c[ad>>2]|0)+16>>2]&1023](ab)|0;b0[c[(c[ac>>2]|0)+20>>2]&1023](x,ab);dV(H,x);do{if((a[T]&1)<<24>>24!=0){ad=c[x+8>>2]|0;if((ad|0)==0){break}j0(ad)}}while(0);b0[c[(c[ac>>2]|0)+24>>2]&1023](y,ab);dV(J,y);do{if((a[U]&1)<<24>>24!=0){ad=c[y+8>>2]|0;if((ad|0)==0){break}j0(ad)}}while(0);ag=b2[c[(c[aa>>2]|0)+36>>2]&1023](ab)|0;ah=af;ai=ae;break L397}}while(0);Z=bO(4)|0;c[Z>>2]=5257492;bg(Z|0,5262728,378)}else{Z=z;if((c[1316359]|0)!=-1){c[s>>2]=5265436;c[s+4>>2]=28;c[s+8>>2]=0;dY(5265436,s)}_=(c[1316360]|0)-1|0;$=c[h+20>>2]|0;do{if((c[h+24>>2]|0)-$>>2>>>0>_>>>0){ac=c[$+(_<<2)>>2]|0;if((ac|0)==0){break}ad=ac;b0[c[(c[ac>>2]|0)+44>>2]&1023](Z,ad);c[F>>2]=c[z>>2]|0;aj=ac;b0[c[(c[aj>>2]|0)+32>>2]&1023](A,ad);dV(L,A);do{if((a[V]&1)<<24>>24!=0){ak=c[A+8>>2]|0;if((ak|0)==0){break}j0(ak)}}while(0);b0[c[(c[aj>>2]|0)+28>>2]&1023](B,ad);dV(K,B);do{if((a[W]&1)<<24>>24!=0){ae=c[B+8>>2]|0;if((ae|0)==0){break}j0(ae)}}while(0);ae=ac;af=b2[c[(c[ae>>2]|0)+12>>2]&1023](ad)|0;ab=b2[c[(c[ae>>2]|0)+16>>2]&1023](ad)|0;b0[c[(c[aj>>2]|0)+20>>2]&1023](C,ad);dV(H,C);do{if((a[X]&1)<<24>>24!=0){ae=c[C+8>>2]|0;if((ae|0)==0){break}j0(ae)}}while(0);b0[c[(c[aj>>2]|0)+24>>2]&1023](D,ad);dV(J,D);do{if((a[Y]&1)<<24>>24!=0){ae=c[D+8>>2]|0;if((ae|0)==0){break}j0(ae)}}while(0);ag=b2[c[(c[ac>>2]|0)+36>>2]&1023](ad)|0;ah=ab;ai=af;break L397}}while(0);Z=bO(4)|0;c[Z>>2]=5257492;bg(Z|0,5262728,378)}}while(0);D=n|0;c[o>>2]=c[D>>2]|0;Y=e|0;e=m+8|0;m=L+1|0;C=L+4|0;X=L+8|0;B=K+1|0;W=K+4|0;A=K+8|0;V=(j&512|0)!=0;j=J+12|0;z=G+3|0;F=ai<<24>>24;ai=n+4|0;n=ah<<24>>24;ah=H+4|0;h=V^1;s=(f|0)==0;f=r|0;r=p;p=450;y=N;U=N;N=E+400|0;E=0;x=0;T=ag;L471:while(1){ag=c[Y>>2]|0;if(!((ag|0)==0^s)){al=p;am=y;an=U;ao=E;ap=707;break}w=a[G+x|0]<<24>>24;L474:do{if((w|0)==4){S=r;v=p;R=y;u=U;t=N;g=0;Z=ag;while(1){_=c[Z+12>>2]|0;if((_|0)==(c[Z+16>>2]|0)){aq=b2[c[(c[Z>>2]|0)+36>>2]&1023](Z)|0}else{aq=d[_]|0}_=aq&255;$=aq<<24>>24;do{if($>>>0<128){if((b[(c[e>>2]|0)+($<<1)>>1]&2048)<<16>>16==0){ap=628;break}aj=c[o>>2]|0;if((aj|0)==(S|0)){ae=(c[ai>>2]|0)!=450;aa=c[D>>2]|0;ak=S-aa|0;ar=ak>>>0<2147483647?ak<<1:-1;as=j1(ae?aa:0,ar)|0;if((as|0)==0){ap=618;break L471}do{if(ae){c[D>>2]=as;at=as}else{aa=c[D>>2]|0;c[D>>2]=as;if((aa|0)==0){at=as;break}b$[c[ai>>2]&1023](aa);at=c[D>>2]|0}}while(0);c[ai>>2]=232;as=at+ak|0;c[o>>2]=as;au=(c[D>>2]|0)+ar|0;av=as}else{au=S;av=aj}c[o>>2]=av+1|0;a[av]=_;aw=g+1|0;ax=t;ay=u;az=R;aA=v;aB=au;break}else{ap=628}}while(0);if((ap|0)==628){ap=0;_=d[I]|0;if(!((g|0)!=0&(((_&1|0)==0?_>>>1:c[ah>>2]|0)|0)!=0&($|0)==(n|0))){aC=S;aD=v;aE=R;aF=u;aG=t;aH=g;break}if((u|0)==(t|0)){_=t-R|0;as=_>>>0<2147483647?_<<1:-1;if((v|0)==450){aI=0}else{aI=R}ae=j1(aI,as)|0;aa=ae;if((ae|0)==0){ap=633;break L471}aJ=aa+(as>>>2<<2)|0;aK=aa+(_>>2<<2)|0;aL=aa;aM=232}else{aJ=t;aK=u;aL=R;aM=v}c[aK>>2]=g;aw=0;ax=aJ;ay=aK+4|0;az=aL;aA=aM;aB=S}aa=c[Y>>2]|0;_=aa+12|0;as=c[_>>2]|0;ae=aa+16|0;aN=c[ae>>2]|0;do{if((as|0)==(aN|0)){if((b2[c[(c[aa>>2]|0)+40>>2]&1023](aa)|0)==-1){ap=646;break}aO=c[_>>2]|0;aP=c[ae>>2]|0;ap=642;break}else{aQ=as+1|0;c[_>>2]=aQ;aO=aQ;aP=aN;ap=642;break}}while(0);do{if((ap|0)==642){ap=0;if((aO|0)!=(aP|0)){break}if((b2[c[(c[aa>>2]|0)+36>>2]&1023](aa)|0)==-1){ap=646;break}else{break}}}while(0);if((ap|0)==646){ap=0;c[Y>>2]=0}aa=c[Y>>2]|0;if((aa|0)==0^s){S=aB;v=aA;R=az;u=ay;t=ax;g=aw;Z=aa}else{aC=aB;aD=aA;aE=az;aF=ay;aG=ax;aH=aw;break}}if((aE|0)==(aF|0)|(aH|0)==0){aR=aG;aS=aF;aT=aE;aU=aD}else{if((aF|0)==(aG|0)){Z=aG-aE|0;g=Z>>>0<2147483647?Z<<1:-1;if((aD|0)==450){aV=0}else{aV=aE}t=j1(aV,g)|0;u=t;if((t|0)==0){ap=652;break L471}aW=u+(g>>>2<<2)|0;aX=u+(Z>>2<<2)|0;aY=u;aZ=232}else{aW=aG;aX=aF;aY=aE;aZ=aD}c[aX>>2]=aH;aR=aW;aS=aX+4|0;aT=aY;aU=aZ}L528:do{if((T|0)>0){u=c[Y>>2]|0;if(!((u|0)==0^s)){ap=662;break L471}Z=c[u+12>>2]|0;if((Z|0)==(c[u+16>>2]|0)){a_=b2[c[(c[u>>2]|0)+36>>2]&1023](u)|0}else{a_=d[Z]|0}if((a_<<24>>24|0)!=(F|0)){ap=662;break L471}Z=c[Y>>2]|0;u=Z+12|0;g=c[u>>2]|0;t=Z+16|0;R=c[t>>2]|0;do{if((g|0)==(R|0)){if((b2[c[(c[Z>>2]|0)+40>>2]&1023](Z)|0)==-1){ap=671;break}a$=c[u>>2]|0;a0=c[t>>2]|0;ap=668;break}else{v=g+1|0;c[u>>2]=v;a$=v;a0=R;ap=668;break}}while(0);do{if((ap|0)==668){ap=0;if((a$|0)!=(a0|0)){a1=aC;a2=T;break}if((b2[c[(c[Z>>2]|0)+36>>2]&1023](Z)|0)==-1){ap=671;break}else{a1=aC;a2=T;break}}}while(0);do{if((ap|0)==671){ap=0;c[Y>>2]=0;a1=aC;a2=T;break}}while(0);while(1){Z=c[Y>>2]|0;if(!((Z|0)==0^s)){ap=678;break L471}R=c[Z+12>>2]|0;if((R|0)==(c[Z+16>>2]|0)){a3=b2[c[(c[Z>>2]|0)+36>>2]&1023](Z)|0}else{a3=d[R]|0}R=a3<<24>>24;if(R>>>0>=128){ap=678;break L471}if((b[(c[e>>2]|0)+(R<<1)>>1]&2048)<<16>>16==0){ap=678;break L471}R=c[o>>2]|0;if((R|0)==(a1|0)){Z=(c[ai>>2]|0)!=450;u=c[D>>2]|0;g=a1-u|0;t=g>>>0<2147483647?g<<1:-1;v=j1(Z?u:0,t)|0;if((v|0)==0){ap=681;break L471}do{if(Z){c[D>>2]=v;a4=v}else{u=c[D>>2]|0;c[D>>2]=v;if((u|0)==0){a4=v;break}b$[c[ai>>2]&1023](u);a4=c[D>>2]|0}}while(0);c[ai>>2]=232;v=a4+g|0;c[o>>2]=v;a5=(c[D>>2]|0)+t|0;a6=v}else{a5=a1;a6=R}v=c[Y>>2]|0;Z=c[v+12>>2]|0;if((Z|0)==(c[v+16>>2]|0)){aj=b2[c[(c[v>>2]|0)+36>>2]&1023](v)|0;a7=aj;a8=c[o>>2]|0}else{a7=d[Z]|0;a8=a6}c[o>>2]=a8+1|0;a[a8]=a7&255;Z=a2-1|0;aj=c[Y>>2]|0;v=aj+12|0;ar=c[v>>2]|0;ak=aj+16|0;u=c[ak>>2]|0;do{if((ar|0)==(u|0)){if((b2[c[(c[aj>>2]|0)+40>>2]&1023](aj)|0)==-1){ap=703;break}a9=c[v>>2]|0;ba=c[ak>>2]|0;ap=699;break}else{S=ar+1|0;c[v>>2]=S;a9=S;ba=u;ap=699;break}}while(0);do{if((ap|0)==699){ap=0;if((a9|0)!=(ba|0)){break}if((b2[c[(c[aj>>2]|0)+36>>2]&1023](aj)|0)==-1){ap=703;break}else{break}}}while(0);if((ap|0)==703){ap=0;c[Y>>2]=0}if((Z|0)>0){a1=a5;a2=Z}else{bb=a5;bc=Z;break L528}}}else{bb=aC;bc=T}}while(0);if((c[o>>2]|0)==(c[D>>2]|0)){ap=705;break L471}else{bd=E;be=aR;bf=aS;bh=aT;bi=aU;bj=bb;bk=bc;break}}else if((w|0)==1){if((x|0)==3){al=p;am=y;an=U;ao=E;ap=707;break L471}aj=c[ag+12>>2]|0;if((aj|0)==(c[ag+16>>2]|0)){bl=b2[c[(c[ag>>2]|0)+36>>2]&1023](ag)|0}else{bl=d[aj]|0}aj=bl<<24>>24;if(aj>>>0>=128){ap=474;break L471}if((b[(c[e>>2]|0)+(aj<<1)>>1]&8192)<<16>>16==0){ap=474;break L471}aj=c[Y>>2]|0;u=aj+12|0;v=c[u>>2]|0;ar=aj+16|0;ak=c[ar>>2]|0;do{if((v|0)==(ak|0)){if((b2[c[(c[aj>>2]|0)+40>>2]&1023](aj)|0)==-1){break}bm=c[u>>2]|0;bn=c[ar>>2]|0;ap=470;break}else{R=v+1|0;c[u>>2]=R;bm=R;bn=ak;ap=470;break}}while(0);if((ap|0)==470){ap=0;if((bm|0)!=(bn|0)){ap=475;break}if((b2[c[(c[aj>>2]|0)+36>>2]&1023](aj)|0)!=-1){ap=475;break}}c[Y>>2]=0;ap=475;break}else if((w|0)==0){ap=475}else if((w|0)==3){ak=a[P]|0;u=ak&255;v=(u&1|0)==0?u>>>1:c[W>>2]|0;u=a[Q]|0;ar=u&255;R=(ar&1|0)==0?ar>>>1:c[C>>2]|0;if((v|0)==(-R|0)){bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}ar=(v|0)==0;v=c[ag+12>>2]|0;t=c[ag+16>>2]|0;g=(v|0)==(t|0);if(!(ar|(R|0)==0)){if(g){R=b2[c[(c[ag>>2]|0)+36>>2]&1023](ag)|0;S=c[Y>>2]|0;bo=R;bp=a[P]|0;bq=S;br=c[S+12>>2]|0;bs=c[S+16>>2]|0}else{bo=d[v]|0;bp=ak;bq=ag;br=v;bs=t}t=bq+12|0;S=bq+16|0;R=(br|0)==(bs|0);if((bo<<24>>24|0)==(a[(bp&1)<<24>>24==0?B:c[A>>2]|0]<<24>>24|0)){do{if(R){if((b2[c[(c[bq>>2]|0)+40>>2]&1023](bq)|0)==-1){ap=539;break}bt=c[t>>2]|0;bu=c[S>>2]|0;ap=536;break}else{af=br+1|0;c[t>>2]=af;bt=af;bu=bs;ap=536;break}}while(0);do{if((ap|0)==536){ap=0;if((bt|0)!=(bu|0)){break}if((b2[c[(c[bq>>2]|0)+36>>2]&1023](bq)|0)==-1){ap=539;break}else{break}}}while(0);if((ap|0)==539){ap=0;c[Y>>2]=0}t=d[P]|0;bd=((t&1|0)==0?t>>>1:c[W>>2]|0)>>>0>1?K:E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}if(R){bv=b2[c[(c[bq>>2]|0)+36>>2]&1023](bq)|0}else{bv=d[br]|0}if((bv<<24>>24|0)!=(a[(a[Q]&1)<<24>>24==0?m:c[X>>2]|0]<<24>>24|0)){ap=555;break L471}t=c[Y>>2]|0;S=t+12|0;aj=c[S>>2]|0;af=t+16|0;ab=c[af>>2]|0;do{if((aj|0)==(ab|0)){if((b2[c[(c[t>>2]|0)+40>>2]&1023](t)|0)==-1){ap=553;break}bw=c[S>>2]|0;bx=c[af>>2]|0;ap=550;break}else{ad=aj+1|0;c[S>>2]=ad;bw=ad;bx=ab;ap=550;break}}while(0);do{if((ap|0)==550){ap=0;if((bw|0)!=(bx|0)){break}if((b2[c[(c[t>>2]|0)+36>>2]&1023](t)|0)==-1){ap=553;break}else{break}}}while(0);if((ap|0)==553){ap=0;c[Y>>2]=0}a[l]=1;t=d[Q]|0;bd=((t&1|0)==0?t>>>1:c[C>>2]|0)>>>0>1?L:E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}if(ar){if(g){t=b2[c[(c[ag>>2]|0)+36>>2]&1023](ag)|0;by=t;bz=a[Q]|0}else{by=d[v]|0;bz=u}if((by<<24>>24|0)!=(a[(bz&1)<<24>>24==0?m:c[X>>2]|0]<<24>>24|0)){bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}t=c[Y>>2]|0;ab=t+12|0;S=c[ab>>2]|0;aj=t+16|0;af=c[aj>>2]|0;do{if((S|0)==(af|0)){if((b2[c[(c[t>>2]|0)+40>>2]&1023](t)|0)==-1){ap=524;break}bA=c[ab>>2]|0;bB=c[aj>>2]|0;ap=521;break}else{R=S+1|0;c[ab>>2]=R;bA=R;bB=af;ap=521;break}}while(0);do{if((ap|0)==521){ap=0;if((bA|0)!=(bB|0)){break}if((b2[c[(c[t>>2]|0)+36>>2]&1023](t)|0)==-1){ap=524;break}else{break}}}while(0);if((ap|0)==524){ap=0;c[Y>>2]=0}a[l]=1;t=d[Q]|0;bd=((t&1|0)==0?t>>>1:c[C>>2]|0)>>>0>1?L:E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}if(g){t=b2[c[(c[ag>>2]|0)+36>>2]&1023](ag)|0;bC=t;bD=a[P]|0}else{bC=d[v]|0;bD=ak}if((bC<<24>>24|0)!=(a[(bD&1)<<24>>24==0?B:c[A>>2]|0]<<24>>24|0)){a[l]=1;bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}t=c[Y>>2]|0;af=t+12|0;ab=c[af>>2]|0;S=t+16|0;aj=c[S>>2]|0;do{if((ab|0)==(aj|0)){if((b2[c[(c[t>>2]|0)+40>>2]&1023](t)|0)==-1){ap=508;break}bE=c[af>>2]|0;bF=c[S>>2]|0;ap=505;break}else{u=ab+1|0;c[af>>2]=u;bE=u;bF=aj;ap=505;break}}while(0);do{if((ap|0)==505){ap=0;if((bE|0)!=(bF|0)){break}if((b2[c[(c[t>>2]|0)+36>>2]&1023](t)|0)==-1){ap=508;break}else{break}}}while(0);if((ap|0)==508){ap=0;c[Y>>2]=0}t=d[P]|0;bd=((t&1|0)==0?t>>>1:c[W>>2]|0)>>>0>1?K:E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}else if((w|0)==2){do{if((E|0)!=0|x>>>0<2){bG=1;bH=0;bI=f;bJ=J}else{if((x|0)==2){bK=a[z]<<24>>24!=0}else{bK=0}if(V|bK){bG=1;bH=0;bI=f;bJ=J;break}else{bd=0;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break L474}}}while(0);while(1){t=d[bJ]|0;if((t&1|0)==0){bL=t>>>1}else{bL=c[bJ+4>>2]|0}if((bL|0)==0){a[bI]=2;bM=bH+1|0;bN=bG-1|0}else{a[bI]=1;bM=bH;bN=bG}if((bJ|0)==(J|0)){break}else{bG=bN;bH=bM;bI=bI+1|0;bJ=bJ+12|0}}t=c[Y>>2]|0;L702:do{if((t|0)==0^s){aj=bN;af=bM;ab=0;S=t;while(1){if((aj|0)==0){bP=J;bQ=f;break L702}ak=c[S+12>>2]|0;if((ak|0)==(c[S+16>>2]|0)){bR=b2[c[(c[S>>2]|0)+36>>2]&1023](S)|0}else{bR=d[ak]|0}ak=bR&255;v=ab+1|0;g=aj;u=af;ar=f;R=0;ad=J;while(1){do{if(a[ar]<<24>>24==1){ac=a[ad]|0;if((ac&1)<<24>>24==0){bS=ad+1|0}else{bS=c[ad+8>>2]|0}if(ak<<24>>24!=a[bS+ab|0]<<24>>24){a[ar]=0;bT=R;bU=u;bV=g-1|0;break}aa=ac&255;if((aa&1|0)==0){bW=aa>>>1}else{bW=c[ad+4>>2]|0}if((bW|0)!=(v|0)){bT=1;bU=u;bV=g;break}a[ar]=2;bT=1;bU=u+1|0;bV=g-1|0}else{bT=R;bU=u;bV=g}}while(0);if((ad|0)==(J|0)){break}g=bV;u=bU;ar=ar+1|0;R=bT;ad=ad+12|0}L729:do{if((bT&1)<<24>>24==0){bX=bU}else{ad=c[Y>>2]|0;R=ad+12|0;ar=c[R>>2]|0;u=ad+16|0;g=c[u>>2]|0;do{if((ar|0)==(g|0)){if((b2[c[(c[ad>>2]|0)+40>>2]&1023](ad)|0)==-1){ap=595;break}bY=c[R>>2]|0;bZ=c[u>>2]|0;ap=592;break}else{ak=ar+1|0;c[R>>2]=ak;bY=ak;bZ=g;ap=592;break}}while(0);do{if((ap|0)==592){ap=0;if((bY|0)!=(bZ|0)){break}if((b2[c[(c[ad>>2]|0)+36>>2]&1023](ad)|0)==-1){ap=595;break}else{break}}}while(0);if((ap|0)==595){ap=0;c[Y>>2]=0}if((bU+bV|0)>>>0<2){bX=bU;break}else{b_=bU;b1=f;b3=J}while(1){do{if(a[b1]<<24>>24==2){ad=d[b3]|0;if((ad&1|0)==0){b4=ad>>>1}else{b4=c[b3+4>>2]|0}if((b4|0)==(v|0)){b5=b_;break}a[b1]=0;b5=b_-1|0}else{b5=b_}}while(0);if((b3|0)==(J|0)){bX=b5;break L729}else{b_=b5;b1=b1+1|0;b3=b3+12|0}}}}while(0);ad=c[Y>>2]|0;if((ad|0)==0^s){aj=bV;af=bX;ab=v;S=ad}else{bP=J;bQ=f;break L702}}}else{bP=J;bQ=f}}while(0);while(1){if(a[bQ]<<24>>24==2){b6=bP;break}if((bP|0)==(J|0)){b6=j;break}bP=bP+12|0;bQ=bQ+1|0}if((b6|0)==(J|0)|h){bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}else{ap=610;break L471}}else{bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T}}while(0);L759:do{if((ap|0)==475){ap=0;if((x|0)==3){al=p;am=y;an=U;ao=E;ap=707;break L471}w=c[Y>>2]|0;if((w|0)==0^s){b7=w}else{bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break}while(1){w=c[b7+12>>2]|0;if((w|0)==(c[b7+16>>2]|0)){b8=b2[c[(c[b7>>2]|0)+36>>2]&1023](b7)|0}else{b8=d[w]|0}w=b8<<24>>24;if(w>>>0>=128){bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break L759}if((b[(c[e>>2]|0)+(w<<1)>>1]&8192)<<16>>16==0){bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break L759}w=c[Y>>2]|0;ag=w+12|0;t=c[ag>>2]|0;S=w+16|0;ab=c[S>>2]|0;do{if((t|0)==(ab|0)){if((b2[c[(c[w>>2]|0)+40>>2]&1023](w)|0)==-1){ap=491;break}b9=c[ag>>2]|0;ca=c[S>>2]|0;ap=487;break}else{af=t+1|0;c[ag>>2]=af;b9=af;ca=ab;ap=487;break}}while(0);do{if((ap|0)==487){ap=0;if((b9|0)!=(ca|0)){break}if((b2[c[(c[w>>2]|0)+36>>2]&1023](w)|0)==-1){ap=491;break}else{break}}}while(0);if((ap|0)==491){ap=0;c[Y>>2]=0}w=c[Y>>2]|0;if((w|0)==0^s){b7=w}else{bd=E;be=N;bf=U;bh=y;bi=p;bj=r;bk=T;break L759}}}}while(0);w=x+1|0;if(w>>>0<4){r=bj;p=bi;y=bh;U=bf;N=be;E=bd;x=w;T=bk}else{al=bi;am=bh;an=bf;ao=bd;ap=707;break}}L783:do{if((ap|0)==610){c[k>>2]=c[k>>2]|4;cb=0;cc=y;cd=p}else if((ap|0)==618){j6()}else if((ap|0)==474){c[k>>2]=c[k>>2]|4;cb=0;cc=y;cd=p}else if((ap|0)==555){c[k>>2]=c[k>>2]|4;cb=0;cc=y;cd=p}else if((ap|0)==633){j6()}else if((ap|0)==652){j6()}else if((ap|0)==662){c[k>>2]=c[k>>2]|4;cb=0;cc=aT;cd=aU}else if((ap|0)==678){c[k>>2]=c[k>>2]|4;cb=0;cc=aT;cd=aU}else if((ap|0)==681){j6()}else if((ap|0)==705){c[k>>2]=c[k>>2]|4;cb=0;cc=aT;cd=aU}else if((ap|0)==707){L799:do{if((ao|0)!=0){bd=ao;bf=ao+1|0;bh=ao+8|0;bi=ao+4|0;bk=1;while(1){T=a[bd]|0;x=T&255;if((x&1|0)==0){ce=x>>>1}else{ce=c[bi>>2]|0}if(bk>>>0>=ce>>>0){break L799}x=c[Y>>2]|0;if(!((x|0)==0^s)){break}E=c[x+12>>2]|0;if((E|0)==(c[x+16>>2]|0)){be=b2[c[(c[x>>2]|0)+36>>2]&1023](x)|0;cf=be;cg=a[bd]|0}else{cf=d[E]|0;cg=T}if((cg&1)<<24>>24==0){ch=bf}else{ch=c[bh>>2]|0}if((cf<<24>>24|0)!=(a[ch+bk|0]<<24>>24|0)){break}T=bk+1|0;E=c[Y>>2]|0;be=E+12|0;x=c[be>>2]|0;N=E+16|0;U=c[N>>2]|0;do{if((x|0)==(U|0)){if((b2[c[(c[E>>2]|0)+40>>2]&1023](E)|0)==-1){break}ci=c[be>>2]|0;cj=c[N>>2]|0;ap=727;break}else{bj=x+1|0;c[be>>2]=bj;ci=bj;cj=U;ap=727;break}}while(0);if((ap|0)==727){ap=0;if((ci|0)!=(cj|0)){bk=T;continue}if((b2[c[(c[E>>2]|0)+36>>2]&1023](E)|0)!=-1){bk=T;continue}}c[Y>>2]=0;bk=T}c[k>>2]=c[k>>2]|4;cb=0;cc=am;cd=al;break L783}}while(0);if((am|0)==(an|0)){cb=1;cc=an;cd=al;break}c[M>>2]=0;fd(H,am,an,M);if((c[M>>2]|0)==0){cb=1;cc=am;cd=al;break}c[k>>2]=c[k>>2]|4;cb=0;cc=am;cd=al}}while(0);do{if((a[Q]&1)<<24>>24!=0){al=c[X>>2]|0;if((al|0)==0){break}j0(al)}}while(0);do{if((a[P]&1)<<24>>24!=0){X=c[A>>2]|0;if((X|0)==0){break}j0(X)}}while(0);do{if((a[O]&1)<<24>>24!=0){A=c[J+8>>2]|0;if((A|0)==0){break}j0(A)}}while(0);do{if((a[I]&1)<<24>>24!=0){J=c[H+8>>2]|0;if((J|0)==0){break}j0(J)}}while(0);if((cc|0)==0){i=q;return cb|0}b$[cd&1023](cc);i=q;return cb|0}function hu(a){a=a|0;return}function hv(a){a=a|0;if((a|0)==0){return}j0(a);return}function hw(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=bO(8)|0;c[b>>2]=5257516;d=b+4|0;e=d;if((d|0)==0){bg(b|0,5262740,44)}d=j8(a)|0;f=d+13|0;g=(f|0)==0?1:f;while(1){h=j$(g)|0;if((h|0)!=0){i=787;break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){i=781;break}b7[f&1023]()}if((i|0)==781){g=bO(4)|0;c[g>>2]=5257468;bg(g|0,5262716,348)}else if((i|0)==787){c[h+4>>2]=d;c[h>>2]=d;d=h+12|0;c[e>>2]=d;c[h+8>>2]=0;kd(d,a);bg(b|0,5262740,44)}}function hx(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;d=i;i=i+128|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=d|0;m=d+12|0;n=d+112|0;o=d+120|0;p=d+124|0;q=n|0;c[q>>2]=m|0;r=n+4|0;c[r>>2]=450;s=c[h+28>>2]|0;t=s;u=s+4|0;D=c[u>>2]|0,c[u>>2]=D+1,D;if((c[1316234]|0)!=-1){c[l>>2]=5264936;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264936,l)}l=(c[1316235]|0)-1|0;u=c[s+20>>2]|0;do{if((c[s+24>>2]|0)-u>>2>>>0>l>>>0){v=c[u+(l<<2)>>2]|0;if((v|0)==0){break}w=v;a[p]=0;x=c[f>>2]|0;do{if(ht(e,x,g,t,c[h+4>>2]|0,j,p,w,n,o,m+100|0)|0){y=k;if((a[y]&1)<<24>>24==0){a[k+1|0]=0;a[y]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}z=v;do{if((a[p]&1)<<24>>24!=0){A=cc[c[(c[z>>2]|0)+28>>2]&1023](w,45)|0;B=a[y]|0;if((B&1)<<24>>24==0){C=10;E=B}else{B=c[k>>2]|0;C=(B&-2)-1|0;E=B&255}B=E&255;if((B&1|0)==0){F=B>>>1}else{F=c[k+4>>2]|0}if((F|0)==(C|0)){d0(k,C,1,C,C);G=a[y]|0}else{G=E}if((G&1)<<24>>24==0){H=k+1|0}else{H=c[k+8>>2]|0}a[H+F|0]=A;A=F+1|0;a[H+A|0]=0;if((a[y]&1)<<24>>24==0){a[y]=A<<1&255;break}else{c[k+4>>2]=A;break}}}while(0);A=cc[c[(c[z>>2]|0)+28>>2]&1023](w,48)|0;B=c[o>>2]|0;I=B-1|0;J=c[q>>2]|0;while(1){if(J>>>0>=I>>>0){break}if(a[J]<<24>>24==A<<24>>24){J=J+1|0}else{break}}A=J;I=a[y]|0;z=I&255;if((z&1|0)==0){K=z>>>1}else{K=c[k+4>>2]|0}if((I&1)<<24>>24==0){L=10;M=I}else{I=c[k>>2]|0;L=(I&-2)-1|0;M=I&255}I=B-A|0;if((B|0)==(J|0)){break}if((L-K|0)>>>0<I>>>0){d0(k,L,(K+I|0)-L|0,K,K);N=a[y]|0}else{N=M}if((N&1)<<24>>24==0){O=k+1|0}else{O=c[k+8>>2]|0}z=B+(K-A|0)|0;A=J;P=O+K|0;while(1){a[P]=a[A]|0;Q=A+1|0;if((Q|0)==(B|0)){break}A=Q;P=P+1|0}a[O+z|0]=0;P=K+I|0;if((a[y]&1)<<24>>24==0){a[y]=P<<1&255;break}else{c[k+4>>2]=P;break}}}while(0);w=c[e>>2]|0;if(!((w|0)==0^(x|0)==0)){c[j>>2]=c[j>>2]|2}c[b>>2]=w;w=s+4|0;if(((D=c[w>>2]|0,c[w>>2]=D+ -1,D)|0)==0){b$[c[(c[s>>2]|0)+8>>2]&1023](s)}w=c[q>>2]|0;c[q>>2]=0;if((w|0)==0){i=d;return}b$[c[r>>2]&1023](w);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function hy(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+568|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=d|0;m=d+12|0;n=d+412|0;o=d+420|0;p=d+424|0;q=d+428|0;r=d+468|0;s=n|0;c[s>>2]=m|0;t=n+4|0;c[t>>2]=450;u=c[h+28>>2]|0;v=u;x=u+4|0;D=c[x>>2]|0,c[x>>2]=D+1,D;if((c[1316232]|0)!=-1){c[l>>2]=5264928;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264928,l)}l=(c[1316233]|0)-1|0;x=c[u+20>>2]|0;do{if((c[u+24>>2]|0)-x>>2>>>0>l>>>0){y=c[x+(l<<2)>>2]|0;if((y|0)==0){break}z=y;a[p]=0;A=f|0;do{if(hz(e,c[A>>2]|0,g,v,c[h+4>>2]|0,j,p,z,n,o,m+400|0)|0){B=q|0;C=c[(c[y>>2]|0)+48>>2]|0;b9[C&1023](z,5252e3,5252010,B);C=r|0;E=c[o>>2]|0;F=c[s>>2]|0;G=E-F>>2;do{if(G>>>0>98){H=j$(G+2|0)|0;if((H|0)!=0){I=H;J=H;break}H=bO(4)|0;c[H>>2]=5257468;bg(H|0,5262716,348)}else{I=C;J=0}}while(0);if((a[p]&1)<<24>>24==0){K=I}else{a[I]=45;K=I+1|0}L968:do{if(F>>>0<E>>>0){G=q+160|0;H=q;L=K;M=F;while(1){N=B;while(1){if((N|0)==(G|0)){O=G;break}if((c[N>>2]|0)==(c[M>>2]|0)){O=N;break}else{N=N+4|0}}a[L]=a[5252e3+(O-H>>2)|0]|0;N=M+4|0;P=L+1|0;if(N>>>0<(c[o>>2]|0)>>>0){L=P;M=N}else{Q=P;break L968}}}else{Q=K}}while(0);a[Q]=0;if((bB(C|0,5247488,(w=i,i=i+4|0,c[w>>2]=k,w)|0)|0)==1){if((J|0)==0){break}j0(J);break}B=bO(8)|0;c[B>>2]=5257516;F=B+4|0;E=F;do{if((F|0)!=0){while(1){R=j$(28)|0;if((R|0)!=0){S=899;break}M=(D=c[1316362]|0,c[1316362]=D+0,D);if((M|0)==0){break}b7[M&1023]()}if((S|0)==899){c[R+4>>2]=15;c[R>>2]=15;M=R+12|0;c[E>>2]=M;c[R+8>>2]=0;j9(M,5247460,16);break}M=bO(4)|0;c[M>>2]=5257468;bg(M|0,5262716,348)}}while(0);bg(B|0,5262740,44)}}while(0);z=c[e>>2]|0;if(!((z|0)==0^(c[A>>2]|0)==0)){c[j>>2]=c[j>>2]|2}c[b>>2]=z;z=u+4|0;if(((D=c[z>>2]|0,c[z>>2]=D+ -1,D)|0)==0){b$[c[(c[u>>2]|0)+8>>2]&1023](u)}z=c[s>>2]|0;c[s>>2]=0;if((z|0)==0){i=d;return}b$[c[t>>2]&1023](z);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function hz(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0,aM=0,aN=0,aO=0,aP=0,aQ=0,aR=0,aS=0,aT=0,aU=0,aV=0,aW=0,aX=0,aY=0,aZ=0,a_=0,a$=0,a0=0,a1=0,a2=0,a3=0,a4=0,a5=0,a6=0,a7=0,a8=0,a9=0,ba=0,bb=0,bc=0,bd=0,be=0,bf=0,bh=0,bi=0,bj=0,bk=0,bl=0,bm=0,bn=0,bo=0,bp=0,bq=0,br=0,bs=0,bt=0,bu=0,bv=0,bw=0,bx=0,by=0,bz=0,bA=0,bB=0,bC=0,bD=0,bE=0,bF=0,bG=0,bH=0,bI=0,bJ=0,bK=0,bL=0,bM=0,bN=0,bP=0,bQ=0,bR=0,bS=0,bT=0,bU=0,bV=0,bW=0,bX=0,bZ=0,b_=0,b1=0,b3=0,b4=0,b5=0,b6=0,b7=0,b8=0,b9=0,ca=0,cb=0,cc=0,cd=0,ce=0,cf=0,cg=0,ch=0;p=i;i=i+636|0;q=p|0;r=p+100|0;s=p+112|0;t=p+124|0;u=p+128|0;v=p+140|0;w=p+152|0;x=p+164|0;y=p+176|0;z=p+180|0;A=p+192|0;B=p+204|0;C=p+216|0;D=p+228|0;E=p+232|0;F=p+632|0;G=F;H=i;i=i+12|0;I=H;J=i;i=i+12|0;K=i;i=i+12|0;L=i;i=i+12|0;M=i;i=i+4|0;c[D>>2]=o;o=E|0;c[I>>2]=0;c[I+4>>2]=0;c[I+8>>2]=0;N=J;O=K;P=L;c[N>>2]=0;c[N+4>>2]=0;c[N+8>>2]=0;c[O>>2]=0;c[O+4>>2]=0;c[O+8>>2]=0;c[P>>2]=0;c[P+4>>2]=0;c[P+8>>2]=0;Q=u;R=v;S=w;T=x;U=z;V=A;W=B;X=C;L1006:do{if(f){Y=t;if((c[1316353]|0)!=-1){c[s>>2]=5265412;c[s+4>>2]=28;c[s+8>>2]=0;dY(5265412,s)}Z=(c[1316354]|0)-1|0;_=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-_>>2>>>0>Z>>>0){$=c[_+(Z<<2)>>2]|0;if(($|0)==0){break}aa=$;b0[c[(c[$>>2]|0)+44>>2]&1023](Y,aa);c[F>>2]=c[t>>2]|0;ab=$;b0[c[(c[ab>>2]|0)+32>>2]&1023](u,aa);ac=a[Q]|0;if((ac&1)<<24>>24==0){ad=u+4|0}else{ad=c[u+8>>2]|0}ae=ac&255;if((ae&1|0)==0){af=ae>>>1}else{af=c[u+4>>2]|0}d2(L,ad,af);do{if((a[Q]&1)<<24>>24!=0){ae=c[u+8>>2]|0;if((ae|0)==0){break}j0(ae)}}while(0);b0[c[(c[ab>>2]|0)+28>>2]&1023](v,aa);ae=a[R]|0;if((ae&1)<<24>>24==0){ag=v+4|0}else{ag=c[v+8>>2]|0}ac=ae&255;if((ac&1|0)==0){ah=ac>>>1}else{ah=c[v+4>>2]|0}d2(K,ag,ah);do{if((a[R]&1)<<24>>24!=0){ac=c[v+8>>2]|0;if((ac|0)==0){break}j0(ac)}}while(0);ac=$;ae=b2[c[(c[ac>>2]|0)+12>>2]&1023](aa)|0;ai=b2[c[(c[ac>>2]|0)+16>>2]&1023](aa)|0;b0[c[(c[$>>2]|0)+20>>2]&1023](w,aa);dV(H,w);do{if((a[S]&1)<<24>>24!=0){aj=c[w+8>>2]|0;if((aj|0)==0){break}j0(aj)}}while(0);b0[c[(c[ab>>2]|0)+24>>2]&1023](x,aa);$=a[T]|0;if(($&1)<<24>>24==0){ak=x+4|0}else{ak=c[x+8>>2]|0}aj=$&255;if((aj&1|0)==0){al=aj>>>1}else{al=c[x+4>>2]|0}d2(J,ak,al);do{if((a[T]&1)<<24>>24!=0){aj=c[x+8>>2]|0;if((aj|0)==0){break}j0(aj)}}while(0);am=b2[c[(c[ac>>2]|0)+36>>2]&1023](aa)|0;an=ai;ao=ae;break L1006}}while(0);Y=bO(4)|0;c[Y>>2]=5257492;bg(Y|0,5262728,378)}else{Y=y;if((c[1316355]|0)!=-1){c[r>>2]=5265420;c[r+4>>2]=28;c[r+8>>2]=0;dY(5265420,r)}Z=(c[1316356]|0)-1|0;_=c[g+20>>2]|0;do{if((c[g+24>>2]|0)-_>>2>>>0>Z>>>0){ab=c[_+(Z<<2)>>2]|0;if((ab|0)==0){break}aj=ab;b0[c[(c[ab>>2]|0)+44>>2]&1023](Y,aj);c[F>>2]=c[y>>2]|0;$=ab;b0[c[(c[$>>2]|0)+32>>2]&1023](z,aj);ap=a[U]|0;if((ap&1)<<24>>24==0){aq=z+4|0}else{aq=c[z+8>>2]|0}ar=ap&255;if((ar&1|0)==0){as=ar>>>1}else{as=c[z+4>>2]|0}d2(L,aq,as);do{if((a[U]&1)<<24>>24!=0){ar=c[z+8>>2]|0;if((ar|0)==0){break}j0(ar)}}while(0);b0[c[(c[$>>2]|0)+28>>2]&1023](A,aj);ae=a[V]|0;if((ae&1)<<24>>24==0){at=A+4|0}else{at=c[A+8>>2]|0}ai=ae&255;if((ai&1|0)==0){au=ai>>>1}else{au=c[A+4>>2]|0}d2(K,at,au);do{if((a[V]&1)<<24>>24!=0){ai=c[A+8>>2]|0;if((ai|0)==0){break}j0(ai)}}while(0);ai=ab;ae=b2[c[(c[ai>>2]|0)+12>>2]&1023](aj)|0;aa=b2[c[(c[ai>>2]|0)+16>>2]&1023](aj)|0;b0[c[(c[ab>>2]|0)+20>>2]&1023](B,aj);dV(H,B);do{if((a[W]&1)<<24>>24!=0){ac=c[B+8>>2]|0;if((ac|0)==0){break}j0(ac)}}while(0);b0[c[(c[$>>2]|0)+24>>2]&1023](C,aj);ab=a[X]|0;if((ab&1)<<24>>24==0){av=C+4|0}else{av=c[C+8>>2]|0}ac=ab&255;if((ac&1|0)==0){aw=ac>>>1}else{aw=c[C+4>>2]|0}d2(J,av,aw);do{if((a[X]&1)<<24>>24!=0){ac=c[C+8>>2]|0;if((ac|0)==0){break}j0(ac)}}while(0);am=b2[c[(c[ai>>2]|0)+36>>2]&1023](aj)|0;an=aa;ao=ae;break L1006}}while(0);Y=bO(4)|0;c[Y>>2]=5257492;bg(Y|0,5262728,378)}}while(0);C=m|0;c[n>>2]=c[C>>2]|0;X=b|0;b=l;aw=L+4|0;av=L+8|0;B=K+4|0;W=K+8|0;A=(h&512|0)!=0;h=J+12|0;V=G+3|0;au=H+4|0;at=(e|0)==0;e=q|0;q=A^1;z=450;U=o;as=o;o=E+400|0;E=0;aq=0;y=am;L1128:while(1){am=c[X>>2]|0;if(!((am|0)==0^at)){ax=z;ay=U;az=as;aA=E;aB=1286;break}F=a[G+aq|0]<<24>>24;L1131:do{if((F|0)==1){if((aq|0)==3){ax=z;ay=U;az=as;aA=E;aB=1286;break L1128}g=c[am+12>>2]|0;if((g|0)==(c[am+16>>2]|0)){aC=b2[c[(c[am>>2]|0)+36>>2]&1023](am)|0}else{aC=c[g>>2]|0}if(!(bY[c[(c[b>>2]|0)+12>>2]&1023](l,8192,aC)|0)){aB=1071;break L1128}g=c[X>>2]|0;r=g+12|0;x=c[r>>2]|0;T=g+16|0;if((x|0)==(c[T>>2]|0)){aD=b2[c[(c[g>>2]|0)+40>>2]&1023](g)|0}else{c[r>>2]=x+4|0;aD=c[x>>2]|0}if((aD|0)!=-1){x=c[r>>2]|0;if((x|0)==(c[T>>2]|0)){aE=b2[c[(c[g>>2]|0)+36>>2]&1023](g)|0}else{aE=c[x>>2]|0}if((aE|0)!=-1){aB=1072;break}}c[X>>2]=0;aB=1072;break}else if((F|0)==2){do{if((E|0)!=0|aq>>>0<2){aF=1;aG=0;aH=e;aI=J}else{if((aq|0)==2){aJ=a[V]<<24>>24!=0}else{aJ=0}if(A|aJ){aF=1;aG=0;aH=e;aI=J;break}else{aK=0;aL=o;aM=as;aN=U;aO=z;aP=y;break L1131}}}while(0);while(1){ae=d[aI]|0;if((ae&1|0)==0){aQ=ae>>>1}else{aQ=c[aI+4>>2]|0}if((aQ|0)==0){a[aH]=2;aR=aG+1|0;aS=aF-1|0}else{a[aH]=1;aR=aG;aS=aF}if((aI|0)==(J|0)){break}else{aF=aS;aG=aR;aH=aH+1|0;aI=aI+12|0}}ae=c[X>>2]|0;L1168:do{if((ae|0)==0^at){aa=aS;aj=aR;ai=0;x=ae;while(1){if((aa|0)==0){aT=J;aU=e;break L1168}g=c[x+12>>2]|0;if((g|0)==(c[x+16>>2]|0)){aV=b2[c[(c[x>>2]|0)+36>>2]&1023](x)|0}else{aV=c[g>>2]|0}g=ai+1|0;T=aa;r=aj;al=e;ak=0;w=J;while(1){do{if(a[al]<<24>>24==1){S=a[w]|0;if((S&1)<<24>>24==0){aW=w+4|0}else{aW=c[w+8>>2]|0}if((aV|0)!=(c[aW+(ai<<2)>>2]|0)){a[al]=0;aX=ak;aY=r;aZ=T-1|0;break}v=S&255;if((v&1|0)==0){a_=v>>>1}else{a_=c[w+4>>2]|0}if((a_|0)!=(g|0)){aX=1;aY=r;aZ=T;break}a[al]=2;aX=1;aY=r+1|0;aZ=T-1|0}else{aX=ak;aY=r;aZ=T}}while(0);if((w|0)==(J|0)){break}T=aZ;r=aY;al=al+1|0;ak=aX;w=w+12|0}L1195:do{if((aX&1)<<24>>24==0){a$=aY}else{w=c[X>>2]|0;ak=w+12|0;al=c[ak>>2]|0;r=w+16|0;if((al|0)==(c[r>>2]|0)){a0=b2[c[(c[w>>2]|0)+40>>2]&1023](w)|0}else{c[ak>>2]=al+4|0;a0=c[al>>2]|0}do{if((a0|0)==-1){aB=1192}else{al=c[ak>>2]|0;if((al|0)==(c[r>>2]|0)){a1=b2[c[(c[w>>2]|0)+36>>2]&1023](w)|0}else{a1=c[al>>2]|0}if((a1|0)==-1){aB=1192;break}else{break}}}while(0);if((aB|0)==1192){aB=0;c[X>>2]=0}if((aY+aZ|0)>>>0<2){a$=aY;break}else{a2=aY;a3=e;a4=J}while(1){do{if(a[a3]<<24>>24==2){w=d[a4]|0;if((w&1|0)==0){a5=w>>>1}else{a5=c[a4+4>>2]|0}if((a5|0)==(g|0)){a6=a2;break}a[a3]=0;a6=a2-1|0}else{a6=a2}}while(0);if((a4|0)==(J|0)){a$=a6;break L1195}else{a2=a6;a3=a3+1|0;a4=a4+12|0}}}}while(0);w=c[X>>2]|0;if((w|0)==0^at){aa=aZ;aj=a$;ai=g;x=w}else{aT=J;aU=e;break L1168}}}else{aT=J;aU=e}}while(0);while(1){if(a[aU]<<24>>24==2){a7=aT;break}if((aT|0)==(J|0)){a7=h;break}aT=aT+12|0;aU=aU+1|0}if((a7|0)==(J|0)|q){aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break}else{aB=1207;break L1128}}else if((F|0)==4){ae=z;x=U;ai=as;aj=o;aa=0;w=am;L1226:while(1){r=c[w+12>>2]|0;if((r|0)==(c[w+16>>2]|0)){a8=b2[c[(c[w>>2]|0)+36>>2]&1023](w)|0}else{a8=c[r>>2]|0}if(bY[c[(c[b>>2]|0)+12>>2]&1023](l,2048,a8)|0){r=c[n>>2]|0;if((r|0)==(c[D>>2]|0)){hD(m,n,D);a9=c[n>>2]|0}else{a9=r}c[n>>2]=a9+4|0;c[a9>>2]=a8;ba=aa+1|0;bb=aj;bc=ai;bd=x;be=ae}else{r=d[I]|0;if(!((((((r&1|0)==0?r>>>1:c[au>>2]|0)|0)==0|(aa|0)==0)^1)&(a8|0)==(an|0))){bf=ae;bh=x;bi=ai;bj=aj;bk=aa;break}if((ai|0)==(aj|0)){r=aj-x|0;ak=r>>>0<2147483647?r<<1:-1;if((ae|0)==450){bl=0}else{bl=x}al=j1(bl,ak)|0;T=al;if((al|0)==0){aB=1222;break L1128}bm=T+(ak>>>2<<2)|0;bn=T+(r>>2<<2)|0;bo=T;bp=232}else{bm=aj;bn=ai;bo=x;bp=ae}c[bn>>2]=aa;ba=0;bb=bm;bc=bn+4|0;bd=bo;be=bp}T=c[X>>2]|0;r=T+12|0;ak=c[r>>2]|0;al=T+16|0;if((ak|0)==(c[al>>2]|0)){bq=b2[c[(c[T>>2]|0)+40>>2]&1023](T)|0}else{c[r>>2]=ak+4|0;bq=c[ak>>2]|0}do{if((bq|0)!=-1){ak=c[r>>2]|0;if((ak|0)==(c[al>>2]|0)){br=b2[c[(c[T>>2]|0)+36>>2]&1023](T)|0}else{br=c[ak>>2]|0}if((br|0)==-1){break}ak=c[X>>2]|0;if((ak|0)==0^at){ae=be;x=bd;ai=bc;aj=bb;aa=ba;w=ak;continue L1226}else{bf=be;bh=bd;bi=bc;bj=bb;bk=ba;break L1226}}}while(0);c[X>>2]=0;if(at){bf=be;bh=bd;bi=bc;bj=bb;bk=ba;break}else{ae=be;x=bd;ai=bc;aj=bb;aa=ba;w=0}}if((bh|0)==(bi|0)|(bk|0)==0){bs=bj;bt=bi;bu=bh;bv=bf}else{if((bi|0)==(bj|0)){w=bj-bh|0;aa=w>>>0<2147483647?w<<1:-1;if((bf|0)==450){bw=0}else{bw=bh}aj=j1(bw,aa)|0;ai=aj;if((aj|0)==0){aB=1241;break L1128}bx=ai+(aa>>>2<<2)|0;by=ai+(w>>2<<2)|0;bz=ai;bA=232}else{bx=bj;by=bi;bz=bh;bA=bf}c[by>>2]=bk;bs=bx;bt=by+4|0;bu=bz;bv=bA}L1272:do{if((y|0)>0){ai=c[X>>2]|0;if(!((ai|0)==0^at)){aB=1251;break L1128}w=c[ai+12>>2]|0;if((w|0)==(c[ai+16>>2]|0)){bB=b2[c[(c[ai>>2]|0)+36>>2]&1023](ai)|0}else{bB=c[w>>2]|0}if((bB|0)!=(ao|0)){aB=1251;break L1128}w=c[X>>2]|0;ai=w+12|0;aa=c[ai>>2]|0;aj=w+16|0;if((aa|0)==(c[aj>>2]|0)){bC=b2[c[(c[w>>2]|0)+40>>2]&1023](w)|0}else{c[ai>>2]=aa+4|0;bC=c[aa>>2]|0}do{if((bC|0)==-1){aB=1260}else{aa=c[ai>>2]|0;if((aa|0)==(c[aj>>2]|0)){bD=b2[c[(c[w>>2]|0)+36>>2]&1023](w)|0}else{bD=c[aa>>2]|0}if((bD|0)==-1){aB=1260;break}else{bE=y;break}}}while(0);do{if((aB|0)==1260){aB=0;c[X>>2]=0;bE=y;break}}while(0);while(1){w=c[X>>2]|0;if(!((w|0)==0^at)){aB=1267;break L1128}aj=c[w+12>>2]|0;if((aj|0)==(c[w+16>>2]|0)){bF=b2[c[(c[w>>2]|0)+36>>2]&1023](w)|0}else{bF=c[aj>>2]|0}if(!(bY[c[(c[b>>2]|0)+12>>2]&1023](l,2048,bF)|0)){aB=1267;break L1128}if((c[n>>2]|0)==(c[D>>2]|0)){hD(m,n,D)}aj=c[X>>2]|0;w=c[aj+12>>2]|0;if((w|0)==(c[aj+16>>2]|0)){bG=b2[c[(c[aj>>2]|0)+36>>2]&1023](aj)|0}else{bG=c[w>>2]|0}w=c[n>>2]|0;c[n>>2]=w+4|0;c[w>>2]=bG;w=bE-1|0;aj=c[X>>2]|0;ai=aj+12|0;aa=c[ai>>2]|0;x=aj+16|0;if((aa|0)==(c[x>>2]|0)){bH=b2[c[(c[aj>>2]|0)+40>>2]&1023](aj)|0}else{c[ai>>2]=aa+4|0;bH=c[aa>>2]|0}do{if((bH|0)==-1){aB=1282}else{aa=c[ai>>2]|0;if((aa|0)==(c[x>>2]|0)){bI=b2[c[(c[aj>>2]|0)+36>>2]&1023](aj)|0}else{bI=c[aa>>2]|0}if((bI|0)==-1){aB=1282;break}else{break}}}while(0);if((aB|0)==1282){aB=0;c[X>>2]=0}if((w|0)>0){bE=w}else{bJ=w;break L1272}}}else{bJ=y}}while(0);if((c[n>>2]|0)==(c[C>>2]|0)){aB=1284;break L1128}else{aK=E;aL=bs;aM=bt;aN=bu;aO=bv;aP=bJ;break}}else if((F|0)==0){aB=1072}else if((F|0)==3){aj=a[O]|0;x=aj&255;ai=(x&1|0)==0?x>>>1:c[B>>2]|0;x=a[P]|0;g=x&255;aa=(g&1|0)==0?g>>>1:c[aw>>2]|0;if((ai|0)==(-aa|0)){aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break}if((ai|0)==0){ai=c[am+12>>2]|0;if((ai|0)==(c[am+16>>2]|0)){g=b2[c[(c[am>>2]|0)+36>>2]&1023](am)|0;bK=g;bL=a[P]|0}else{bK=c[ai>>2]|0;bL=x}if((bK|0)!=(c[((bL&1)<<24>>24==0?aw:c[av>>2]|0)>>2]|0)){aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break}x=c[X>>2]|0;ai=x+12|0;g=c[ai>>2]|0;ae=x+16|0;if((g|0)==(c[ae>>2]|0)){bM=b2[c[(c[x>>2]|0)+40>>2]&1023](x)|0}else{c[ai>>2]=g+4|0;bM=c[g>>2]|0}do{if((bM|0)==-1){aB=1121}else{g=c[ai>>2]|0;if((g|0)==(c[ae>>2]|0)){bN=b2[c[(c[x>>2]|0)+36>>2]&1023](x)|0}else{bN=c[g>>2]|0}if((bN|0)==-1){aB=1121;break}else{break}}}while(0);if((aB|0)==1121){aB=0;c[X>>2]=0}a[k]=1;x=d[P]|0;aK=((x&1|0)==0?x>>>1:c[aw>>2]|0)>>>0>1?L:E;aL=o;aM=as;aN=U;aO=z;aP=y;break}x=c[am+12>>2]|0;ae=c[am+16>>2]|0;ai=(x|0)==(ae|0);if((aa|0)==0){if(ai){g=b2[c[(c[am>>2]|0)+36>>2]&1023](am)|0;bP=g;bQ=a[O]|0}else{bP=c[x>>2]|0;bQ=aj}if((bP|0)!=(c[((bQ&1)<<24>>24==0?B:c[W>>2]|0)>>2]|0)){a[k]=1;aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break}g=c[X>>2]|0;T=g+12|0;al=c[T>>2]|0;r=g+16|0;if((al|0)==(c[r>>2]|0)){bR=b2[c[(c[g>>2]|0)+40>>2]&1023](g)|0}else{c[T>>2]=al+4|0;bR=c[al>>2]|0}do{if((bR|0)==-1){aB=1105}else{al=c[T>>2]|0;if((al|0)==(c[r>>2]|0)){bS=b2[c[(c[g>>2]|0)+36>>2]&1023](g)|0}else{bS=c[al>>2]|0}if((bS|0)==-1){aB=1105;break}else{break}}}while(0);if((aB|0)==1105){aB=0;c[X>>2]=0}g=d[O]|0;aK=((g&1|0)==0?g>>>1:c[B>>2]|0)>>>0>1?K:E;aL=o;aM=as;aN=U;aO=z;aP=y;break}if(ai){g=b2[c[(c[am>>2]|0)+36>>2]&1023](am)|0;r=c[X>>2]|0;bT=g;bU=a[O]|0;bV=r;bW=c[r+12>>2]|0;bX=c[r+16>>2]|0}else{bT=c[x>>2]|0;bU=aj;bV=am;bW=x;bX=ae}r=bV+12|0;g=bV+16|0;T=(bW|0)==(bX|0);if((bT|0)==(c[((bU&1)<<24>>24==0?B:c[W>>2]|0)>>2]|0)){if(T){bZ=b2[c[(c[bV>>2]|0)+40>>2]&1023](bV)|0}else{c[r>>2]=bW+4|0;bZ=c[bW>>2]|0}do{if((bZ|0)==-1){aB=1136}else{aa=c[r>>2]|0;if((aa|0)==(c[g>>2]|0)){b_=b2[c[(c[bV>>2]|0)+36>>2]&1023](bV)|0}else{b_=c[aa>>2]|0}if((b_|0)==-1){aB=1136;break}else{break}}}while(0);if((aB|0)==1136){aB=0;c[X>>2]=0}g=d[O]|0;aK=((g&1|0)==0?g>>>1:c[B>>2]|0)>>>0>1?K:E;aL=o;aM=as;aN=U;aO=z;aP=y;break}if(T){b1=b2[c[(c[bV>>2]|0)+36>>2]&1023](bV)|0}else{b1=c[bW>>2]|0}if((b1|0)!=(c[((a[P]&1)<<24>>24==0?aw:c[av>>2]|0)>>2]|0)){aB=1152;break L1128}g=c[X>>2]|0;r=g+12|0;ae=c[r>>2]|0;x=g+16|0;if((ae|0)==(c[x>>2]|0)){b3=b2[c[(c[g>>2]|0)+40>>2]&1023](g)|0}else{c[r>>2]=ae+4|0;b3=c[ae>>2]|0}do{if((b3|0)==-1){aB=1150}else{ae=c[r>>2]|0;if((ae|0)==(c[x>>2]|0)){b4=b2[c[(c[g>>2]|0)+36>>2]&1023](g)|0}else{b4=c[ae>>2]|0}if((b4|0)==-1){aB=1150;break}else{break}}}while(0);if((aB|0)==1150){aB=0;c[X>>2]=0}a[k]=1;g=d[P]|0;aK=((g&1|0)==0?g>>>1:c[aw>>2]|0)>>>0>1?L:E;aL=o;aM=as;aN=U;aO=z;aP=y;break}else{aK=E;aL=o;aM=as;aN=U;aO=z;aP=y}}while(0);L1409:do{if((aB|0)==1072){aB=0;if((aq|0)==3){ax=z;ay=U;az=as;aA=E;aB=1286;break L1128}am=c[X>>2]|0;if((am|0)==0^at){b5=am}else{aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break}L1412:while(1){am=c[b5+12>>2]|0;if((am|0)==(c[b5+16>>2]|0)){b6=b2[c[(c[b5>>2]|0)+36>>2]&1023](b5)|0}else{b6=c[am>>2]|0}if(!(bY[c[(c[b>>2]|0)+12>>2]&1023](l,8192,b6)|0)){aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break L1409}am=c[X>>2]|0;F=am+12|0;g=c[F>>2]|0;x=am+16|0;if((g|0)==(c[x>>2]|0)){b7=b2[c[(c[am>>2]|0)+40>>2]&1023](am)|0}else{c[F>>2]=g+4|0;b7=c[g>>2]|0}do{if((b7|0)!=-1){g=c[F>>2]|0;if((g|0)==(c[x>>2]|0)){b8=b2[c[(c[am>>2]|0)+36>>2]&1023](am)|0}else{b8=c[g>>2]|0}if((b8|0)==-1){break}g=c[X>>2]|0;if((g|0)==0^at){b5=g;continue L1412}else{aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break L1409}}}while(0);c[X>>2]=0;if(at){aK=E;aL=o;aM=as;aN=U;aO=z;aP=y;break L1409}else{b5=0}}}}while(0);am=aq+1|0;if(am>>>0<4){z=aO;U=aN;as=aM;o=aL;E=aK;aq=am;y=aP}else{ax=aO;ay=aN;az=aM;aA=aK;aB=1286;break}}L1433:do{if((aB|0)==1284){c[j>>2]=c[j>>2]|4;b9=0;ca=bu;cb=bv}else if((aB|0)==1286){L1436:do{if((aA|0)!=0){aK=aA;aM=aA+4|0;aN=aA+8|0;aO=1;while(1){aP=a[aK]|0;y=aP&255;if((y&1|0)==0){cc=y>>>1}else{cc=c[aM>>2]|0}if(aO>>>0>=cc>>>0){break L1436}y=c[X>>2]|0;if(!((y|0)==0^at)){break}aq=c[y+12>>2]|0;if((aq|0)==(c[y+16>>2]|0)){E=b2[c[(c[y>>2]|0)+36>>2]&1023](y)|0;cd=E;ce=a[aK]|0}else{cd=c[aq>>2]|0;ce=aP}if((ce&1)<<24>>24==0){cf=aM}else{cf=c[aN>>2]|0}if((cd|0)!=(c[cf+(aO<<2)>>2]|0)){break}aP=aO+1|0;aq=c[X>>2]|0;E=aq+12|0;y=c[E>>2]|0;aL=aq+16|0;if((y|0)==(c[aL>>2]|0)){cg=b2[c[(c[aq>>2]|0)+40>>2]&1023](aq)|0}else{c[E>>2]=y+4|0;cg=c[y>>2]|0}if((cg|0)!=-1){y=c[E>>2]|0;if((y|0)==(c[aL>>2]|0)){ch=b2[c[(c[aq>>2]|0)+36>>2]&1023](aq)|0}else{ch=c[y>>2]|0}if((ch|0)!=-1){aO=aP;continue}}c[X>>2]=0;aO=aP}c[j>>2]=c[j>>2]|4;b9=0;ca=ay;cb=ax;break L1433}}while(0);if((ay|0)==(az|0)){b9=1;ca=az;cb=ax;break}c[M>>2]=0;fd(H,ay,az,M);if((c[M>>2]|0)==0){b9=1;ca=ay;cb=ax;break}c[j>>2]=c[j>>2]|4;b9=0;ca=ay;cb=ax}else if((aB|0)==1152){c[j>>2]=c[j>>2]|4;b9=0;ca=U;cb=z}else if((aB|0)==1207){c[j>>2]=c[j>>2]|4;b9=0;ca=U;cb=z}else if((aB|0)==1222){j6()}else if((aB|0)==1241){j6()}else if((aB|0)==1251){c[j>>2]=c[j>>2]|4;b9=0;ca=bu;cb=bv}else if((aB|0)==1267){c[j>>2]=c[j>>2]|4;b9=0;ca=bu;cb=bv}else if((aB|0)==1071){c[j>>2]=c[j>>2]|4;b9=0;ca=U;cb=z}}while(0);do{if((a[P]&1)<<24>>24!=0){z=c[av>>2]|0;if((z|0)==0){break}j0(z)}}while(0);do{if((a[O]&1)<<24>>24!=0){av=c[W>>2]|0;if((av|0)==0){break}j0(av)}}while(0);do{if((a[N]&1)<<24>>24!=0){W=c[J+8>>2]|0;if((W|0)==0){break}j0(W)}}while(0);do{if((a[I]&1)<<24>>24!=0){J=c[H+8>>2]|0;if((J|0)==0){break}j0(J)}}while(0);if((ca|0)==0){i=p;return b9|0}b$[cb&1023](ca);i=p;return b9|0}function hA(a){a=a|0;return}function hB(a){a=a|0;if((a|0)==0){return}j0(a);return}function hC(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0;d=i;i=i+428|0;l=e;e=i;i=i+4|0;c[e>>2]=c[l>>2]|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=d|0;m=d+12|0;n=d+412|0;o=d+420|0;p=d+424|0;q=n|0;c[q>>2]=m|0;r=n+4|0;c[r>>2]=450;s=c[h+28>>2]|0;t=s;u=s+4|0;D=c[u>>2]|0,c[u>>2]=D+1,D;if((c[1316232]|0)!=-1){c[l>>2]=5264928;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264928,l)}l=(c[1316233]|0)-1|0;u=c[s+20>>2]|0;do{if((c[s+24>>2]|0)-u>>2>>>0>l>>>0){v=c[u+(l<<2)>>2]|0;if((v|0)==0){break}w=v;a[p]=0;x=c[f>>2]|0;do{if(hz(e,x,g,t,c[h+4>>2]|0,j,p,w,n,o,m+400|0)|0){y=k;if((a[y]&1)<<24>>24==0){c[k+4>>2]=0;a[y]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}z=v;do{if((a[p]&1)<<24>>24!=0){A=cc[c[(c[z>>2]|0)+44>>2]&1023](w,45)|0;B=a[y]|0;if((B&1)<<24>>24==0){C=1;E=B}else{B=c[k>>2]|0;C=(B&-2)-1|0;E=B&255}B=E&255;if((B&1|0)==0){F=B>>>1}else{F=c[k+4>>2]|0}if((F|0)==(C|0)){d1(k,C,1,C,C);G=a[y]|0}else{G=E}if((G&1)<<24>>24==0){H=k+4|0}else{H=c[k+8>>2]|0}c[H+(F<<2)>>2]=A;A=F+1|0;c[H+(A<<2)>>2]=0;if((a[y]&1)<<24>>24==0){a[y]=A<<1&255;break}else{c[k+4>>2]=A;break}}}while(0);A=cc[c[(c[z>>2]|0)+44>>2]&1023](w,48)|0;B=c[o>>2]|0;I=B-4|0;J=c[q>>2]|0;while(1){if(J>>>0>=I>>>0){break}if((c[J>>2]|0)==(A|0)){J=J+4|0}else{break}}A=J;z=a[y]|0;K=z&255;if((K&1|0)==0){L=K>>>1}else{L=c[k+4>>2]|0}if((z&1)<<24>>24==0){M=1;N=z}else{z=c[k>>2]|0;M=(z&-2)-1|0;N=z&255}z=B-A>>2;if((z|0)==0){break}if((M-L|0)>>>0<z>>>0){d1(k,M,(L+z|0)-M|0,L,L);O=a[y]|0}else{O=N}if((O&1)<<24>>24==0){P=k+4|0}else{P=c[k+8>>2]|0}K=P+(L<<2)|0;if((J|0)==(B|0)){Q=K}else{R=(L+((I+(-A|0)|0)>>>2)|0)+1|0;A=J;S=K;while(1){c[S>>2]=c[A>>2]|0;K=A+4|0;if((K|0)==(B|0)){break}A=K;S=S+4|0}Q=P+(R<<2)|0}c[Q>>2]=0;S=L+z|0;if((a[y]&1)<<24>>24==0){a[y]=S<<1&255;break}else{c[k+4>>2]=S;break}}}while(0);w=c[e>>2]|0;if(!((w|0)==0^(x|0)==0)){c[j>>2]=c[j>>2]|2}c[b>>2]=w;w=s+4|0;if(((D=c[w>>2]|0,c[w>>2]=D+ -1,D)|0)==0){b$[c[(c[s>>2]|0)+8>>2]&1023](s)}w=c[q>>2]|0;c[q>>2]=0;if((w|0)==0){i=d;return}b$[c[r>>2]&1023](w);i=d;return}}while(0);d=bO(4)|0;c[d>>2]=5257492;bg(d|0,5262728,378)}function hD(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;e=a+4|0;f=(c[e>>2]|0)!=450;g=a|0;a=c[g>>2]|0;h=a;i=(c[d>>2]|0)-h|0;j=i>>>0<2147483647?i<<1:-1;i=(c[b>>2]|0)-h>>2;if(f){k=a}else{k=0}a=j1(k,j)|0;k=a;if((a|0)==0){j6()}do{if(f){c[g>>2]=k;l=k}else{a=c[g>>2]|0;c[g>>2]=k;if((a|0)==0){l=k;break}b$[c[e>>2]&1023](a);l=c[g>>2]|0}}while(0);c[e>>2]=232;c[b>>2]=l+(i<<2)|0;c[d>>2]=(c[g>>2]|0)+(j>>>2<<2)|0;return}function hE(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=+m;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0;e=i;i=i+240|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=e|0;o=e+112|0;p=e+216|0;q=e+220|0;r=e+224|0;s=e+228|0;t=s;u=i;i=i+12|0;v=u;x=i;i=i+12|0;y=x;z=i;i=i+4|0;A=i;i=i+100|0;B=i;i=i+4|0;C=i;i=i+4|0;E=e+12|0;c[o>>2]=E;F=e+116|0;G=aQ(E|0,100,5247384,(w=i,i=i+8|0,h[k>>3]=m,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0;do{if(G>>>0>99){do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);E=f0(o,c[1312889]|0,5247384,(w=i,i=i+8|0,h[k>>3]=m,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0;H=c[o>>2]|0;if((H|0)==0){I=bO(4)|0;c[I>>2]=5257468;bg(I|0,5262716,348)}I=j$(E)|0;if((I|0)!=0){J=I;K=E;L=H;M=I;break}I=bO(4)|0;c[I>>2]=5257468;bg(I|0,5262716,348)}else{J=F;K=G;L=0;M=0}}while(0);G=c[j+28>>2]|0;F=G;I=G+4|0;D=c[I>>2]|0,c[I>>2]=D+1,D;if((c[1316234]|0)!=-1){c[n>>2]=5264936;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264936,n)}n=(c[1316235]|0)-1|0;I=c[G+20>>2]|0;do{if((c[G+24>>2]|0)-I>>2>>>0>n>>>0){H=c[I+(n<<2)>>2]|0;if((H|0)==0){break}E=H;N=c[o>>2]|0;b9[c[(c[H>>2]|0)+32>>2]&1023](E,N,N+K|0,J);if((K|0)==0){O=0}else{O=a[c[o>>2]|0]<<24>>24==45}c[t>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;c[v>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[y>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;hF(g,O,F,p,q,r,s,u,x,z);N=A|0;H=c[z>>2]|0;if((K|0)>(H|0)){P=d[y]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[x+4>>2]|0}P=d[v]|0;if((P&1|0)==0){R=P>>>1}else{R=c[u+4>>2]|0}S=((K-H<<1|1)+Q|0)+R|0}else{P=d[y]|0;if((P&1|0)==0){T=P>>>1}else{T=c[x+4>>2]|0}P=d[v]|0;if((P&1|0)==0){U=P>>>1}else{U=c[u+4>>2]|0}S=(T+2|0)+U|0}P=S+H|0;do{if(P>>>0>100){V=j$(P)|0;if((V|0)!=0){W=V;X=V;break}V=bO(4)|0;c[V>>2]=5257468;bg(V|0,5262716,348)}else{W=N;X=0}}while(0);hG(W,B,C,c[j+4>>2]|0,J,J+K|0,E,O,p,a[q]|0,a[r]|0,s,u,x,H);fW(b,c[f>>2]|0,W,c[B>>2]|0,c[C>>2]|0,j,l);if((X|0)!=0){j0(X)}do{if((a[y]&1)<<24>>24!=0){N=c[x+8>>2]|0;if((N|0)==0){break}j0(N)}}while(0);do{if((a[v]&1)<<24>>24!=0){H=c[u+8>>2]|0;if((H|0)==0){break}j0(H)}}while(0);do{if((a[t]&1)<<24>>24!=0){H=c[s+8>>2]|0;if((H|0)==0){break}j0(H)}}while(0);H=G+4|0;if(((D=c[H>>2]|0,c[H>>2]=D+ -1,D)|0)==0){b$[c[(c[G>>2]|0)+8>>2]&1023](G)}if((M|0)!=0){j0(M)}if((L|0)==0){i=e;return}j0(L);i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function hF(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;n=i;i=i+28|0;o=n|0;p=n+12|0;q=n+24|0;r=q;s=i;i=i+12|0;t=i;i=i+4|0;u=t;v=i;i=i+12|0;w=i;i=i+12|0;y=i;i=i+12|0;z=i;i=i+4|0;A=z;B=i;i=i+12|0;C=i;i=i+4|0;D=C;E=i;i=i+12|0;F=i;i=i+12|0;G=i;i=i+12|0;if(b){if((c[1316357]|0)!=-1){c[p>>2]=5265428;c[p+4>>2]=28;c[p+8>>2]=0;dY(5265428,p)}p=(c[1316358]|0)-1|0;b=c[e+20>>2]|0;if((c[e+24>>2]|0)-b>>2>>>0<=p>>>0){H=bO(4)|0;I=H;c[I>>2]=5257492;bg(H|0,5262728,378)}J=c[b+(p<<2)>>2]|0;if((J|0)==0){H=bO(4)|0;I=H;c[I>>2]=5257492;bg(H|0,5262728,378)}H=J;I=c[J>>2]|0;do{if(d){b0[c[I+44>>2]&1023](r,H);p=f;x=c[q>>2]|0;a[p]=x&255;x=x>>8;a[p+1|0]=x&255;x=x>>8;a[p+2|0]=x&255;x=x>>8;a[p+3|0]=x&255;b0[c[(c[J>>2]|0)+32>>2]&1023](s,H);dV(l,s);if((a[s]&1)<<24>>24==0){break}p=c[s+8>>2]|0;if((p|0)==0){break}j0(p)}else{b0[c[I+40>>2]&1023](u,H);p=f;x=c[t>>2]|0;a[p]=x&255;x=x>>8;a[p+1|0]=x&255;x=x>>8;a[p+2|0]=x&255;x=x>>8;a[p+3|0]=x&255;b0[c[(c[J>>2]|0)+28>>2]&1023](v,H);dV(l,v);if((a[v]&1)<<24>>24==0){break}p=c[v+8>>2]|0;if((p|0)==0){break}j0(p)}}while(0);v=J;a[g]=b2[c[(c[v>>2]|0)+12>>2]&1023](H)|0;a[h]=b2[c[(c[v>>2]|0)+16>>2]&1023](H)|0;v=J;b0[c[(c[v>>2]|0)+20>>2]&1023](w,H);dV(j,w);do{if((a[w]&1)<<24>>24!=0){t=c[w+8>>2]|0;if((t|0)==0){break}j0(t)}}while(0);b0[c[(c[v>>2]|0)+24>>2]&1023](y,H);dV(k,y);do{if((a[y]&1)<<24>>24!=0){v=c[y+8>>2]|0;if((v|0)==0){break}j0(v)}}while(0);y=b2[c[(c[J>>2]|0)+36>>2]&1023](H)|0;c[m>>2]=y;i=n;return}else{if((c[1316359]|0)!=-1){c[o>>2]=5265436;c[o+4>>2]=28;c[o+8>>2]=0;dY(5265436,o)}o=(c[1316360]|0)-1|0;H=c[e+20>>2]|0;if((c[e+24>>2]|0)-H>>2>>>0<=o>>>0){K=bO(4)|0;L=K;c[L>>2]=5257492;bg(K|0,5262728,378)}e=c[H+(o<<2)>>2]|0;if((e|0)==0){K=bO(4)|0;L=K;c[L>>2]=5257492;bg(K|0,5262728,378)}K=e;L=c[e>>2]|0;do{if(d){b0[c[L+44>>2]&1023](A,K);o=f;x=c[z>>2]|0;a[o]=x&255;x=x>>8;a[o+1|0]=x&255;x=x>>8;a[o+2|0]=x&255;x=x>>8;a[o+3|0]=x&255;b0[c[(c[e>>2]|0)+32>>2]&1023](B,K);dV(l,B);if((a[B]&1)<<24>>24==0){break}o=c[B+8>>2]|0;if((o|0)==0){break}j0(o)}else{b0[c[L+40>>2]&1023](D,K);o=f;x=c[C>>2]|0;a[o]=x&255;x=x>>8;a[o+1|0]=x&255;x=x>>8;a[o+2|0]=x&255;x=x>>8;a[o+3|0]=x&255;b0[c[(c[e>>2]|0)+28>>2]&1023](E,K);dV(l,E);if((a[E]&1)<<24>>24==0){break}o=c[E+8>>2]|0;if((o|0)==0){break}j0(o)}}while(0);E=e;a[g]=b2[c[(c[E>>2]|0)+12>>2]&1023](K)|0;a[h]=b2[c[(c[E>>2]|0)+16>>2]&1023](K)|0;E=e;b0[c[(c[E>>2]|0)+20>>2]&1023](F,K);dV(j,F);do{if((a[F]&1)<<24>>24!=0){j=c[F+8>>2]|0;if((j|0)==0){break}j0(j)}}while(0);b0[c[(c[E>>2]|0)+24>>2]&1023](G,K);dV(k,G);do{if((a[G]&1)<<24>>24!=0){k=c[G+8>>2]|0;if((k|0)==0){break}j0(k)}}while(0);y=b2[c[(c[e>>2]|0)+36>>2]&1023](K)|0;c[m>>2]=y;i=n;return}}function hG(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0;c[f>>2]=d;s=j;t=q;u=q+1|0;v=q+8|0;w=q+4|0;q=p;x=(g&512|0)==0;y=p+1|0;z=p+4|0;A=p+8|0;p=j+8|0;B=(r|0)>0;C=o;D=o+1|0;E=o+8|0;F=o+4|0;o=-r|0;G=h;h=0;while(1){H=a[l+h|0]<<24>>24;L1747:do{if((H|0)==2){I=a[q]|0;J=I&255;K=(J&1|0)==0;if(K){L=J>>>1}else{L=c[z>>2]|0}if((L|0)==0|x){M=G;break}if((I&1)<<24>>24==0){N=y}else{N=c[A>>2]|0}if(K){O=J>>>1}else{O=c[z>>2]|0}J=N+O|0;K=c[f>>2]|0;L1761:do{if((N|0)==(J|0)){P=K}else{I=N;Q=K;while(1){a[Q]=a[I]|0;R=I+1|0;S=Q+1|0;if((R|0)==(J|0)){P=S;break L1761}else{I=R;Q=S}}}}while(0);c[f>>2]=P;M=G}else if((H|0)==4){J=c[f>>2]|0;K=k?G+1|0:G;Q=K;while(1){if(Q>>>0>=i>>>0){break}I=a[Q]|0;if(I<<24>>24<=-1){break}if((b[(c[p>>2]|0)+(I<<24>>24<<1)>>1]&2048)<<16>>16==0){break}else{Q=Q+1|0}}I=Q;if(B){do{if(Q>>>0>K>>>0){S=K+(-I|0)|0;R=S>>>0<o>>>0?o:S;S=R+r|0;T=Q;U=r;V=J;while(1){W=T-1|0;X=a[W]|0;c[f>>2]=V+1|0;a[V]=X;X=U-1|0;Y=(X|0)>0;if(!(W>>>0>K>>>0&Y)){break}T=W;U=X;V=c[f>>2]|0}V=Q+R|0;if(Y){Z=S;_=V;$=1627;break}else{aa=0;ab=S;ac=V;break}}else{Z=r;_=Q;$=1627}}while(0);if(($|0)==1627){$=0;aa=cc[c[(c[s>>2]|0)+28>>2]&1023](j,48)|0;ab=Z;ac=_}I=c[f>>2]|0;c[f>>2]=I+1|0;L1782:do{if((ab|0)>0){V=ab;U=I;while(1){a[U]=aa;T=V-1|0;X=c[f>>2]|0;c[f>>2]=X+1|0;if((T|0)>0){V=T;U=X}else{ad=X;break L1782}}}else{ad=I}}while(0);a[ad]=m;ae=ac}else{ae=Q}L1787:do{if((ae|0)==(K|0)){I=cc[c[(c[s>>2]|0)+28>>2]&1023](j,48)|0;U=c[f>>2]|0;c[f>>2]=U+1|0;a[U]=I}else{I=a[C]|0;U=I&255;if((U&1|0)==0){af=U>>>1}else{af=c[F>>2]|0}do{if((af|0)==0){ag=ae;ah=0;ai=0;aj=-1}else{if((I&1)<<24>>24==0){ak=D}else{ak=c[E>>2]|0}ag=ae;ah=0;ai=0;aj=a[ak]<<24>>24;break}}while(0);while(1){do{if((ah|0)==(aj|0)){I=c[f>>2]|0;c[f>>2]=I+1|0;a[I]=n;I=ai+1|0;U=a[C]|0;V=U&255;if((V&1|0)==0){al=V>>>1}else{al=c[F>>2]|0}if(I>>>0>=al>>>0){am=aj;an=I;ao=0;break}V=(U&1)<<24>>24==0;if(V){ap=D}else{ap=c[E>>2]|0}if(a[ap+I|0]<<24>>24==127){am=-1;an=I;ao=0;break}if(V){aq=D}else{aq=c[E>>2]|0}am=a[aq+I|0]<<24>>24;an=I;ao=0}else{am=aj;an=ai;ao=ah}}while(0);I=ag-1|0;V=a[I]|0;U=c[f>>2]|0;c[f>>2]=U+1|0;a[U]=V;if((I|0)==(K|0)){break L1787}else{ag=I;ah=ao+1|0;ai=an;aj=am}}}}while(0);Q=c[f>>2]|0;if((J|0)==(Q|0)){M=K;break}I=Q-1|0;if(J>>>0<I>>>0){ar=J;as=I}else{M=K;break}while(1){I=a[ar]|0;a[ar]=a[as]|0;a[as]=I;I=ar+1|0;Q=as-1|0;if(I>>>0<Q>>>0){ar=I;as=Q}else{M=K;break L1747}}}else if((H|0)==0){c[e>>2]=c[f>>2]|0;M=G}else if((H|0)==3){K=a[t]|0;J=K&255;if((J&1|0)==0){at=J>>>1}else{at=c[w>>2]|0}if((at|0)==0){M=G;break}if((K&1)<<24>>24==0){au=u}else{au=c[v>>2]|0}K=a[au]|0;J=c[f>>2]|0;c[f>>2]=J+1|0;a[J]=K;M=G}else if((H|0)==1){c[e>>2]=c[f>>2]|0;K=cc[c[(c[s>>2]|0)+28>>2]&1023](j,32)|0;J=c[f>>2]|0;c[f>>2]=J+1|0;a[J]=K;M=G}else{M=G}}while(0);H=h+1|0;if((H|0)==4){break}else{G=M;h=H}}h=a[t]|0;t=h&255;M=(t&1|0)==0;if(M){av=t>>>1}else{av=c[w>>2]|0}if(av>>>0>1){if((h&1)<<24>>24==0){aw=u}else{aw=c[v>>2]|0}if(M){ax=t>>>1}else{ax=c[w>>2]|0}w=aw+ax|0;ax=c[f>>2]|0;t=aw+1|0;L1846:do{if((t|0)==(w|0)){ay=ax}else{aw=ax;M=t;while(1){a[aw]=a[M]|0;v=aw+1|0;u=M+1|0;if((u|0)==(w|0)){ay=v;break L1846}else{aw=v;M=u}}}}while(0);c[f>>2]=ay}ay=g&176;if((ay|0)==32){c[e>>2]=c[f>>2]|0;return}else if((ay|0)==16){return}else{c[e>>2]=d;return}}function hH(a){a=a|0;return}function hI(a){a=a|0;if((a|0)==0){return}j0(a);return}function hJ(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+36|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=e|0;m=e+12|0;n=e+16|0;o=e+20|0;p=e+24|0;q=p;r=i;i=i+12|0;s=r;t=i;i=i+12|0;u=t;v=i;i=i+4|0;w=i;i=i+100|0;x=i;i=i+4|0;y=i;i=i+4|0;z=c[h+28>>2]|0;A=z;B=z+4|0;D=c[B>>2]|0,c[B>>2]=D+1,D;if((c[1316234]|0)!=-1){c[l>>2]=5264936;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264936,l)}l=(c[1316235]|0)-1|0;B=c[z+20>>2]|0;do{if((c[z+24>>2]|0)-B>>2>>>0>l>>>0){C=c[B+(l<<2)>>2]|0;if((C|0)==0){break}E=C;F=k;G=k;H=a[G]|0;I=H&255;if((I&1|0)==0){J=I>>>1}else{J=c[k+4>>2]|0}if((J|0)==0){K=0}else{if((H&1)<<24>>24==0){L=F+1|0}else{L=c[k+8>>2]|0}H=a[L]|0;K=H<<24>>24==cc[c[(c[C>>2]|0)+28>>2]&1023](E,45)<<24>>24}c[q>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[s>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;c[u>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;hF(g,K,A,m,n,o,p,r,t,v);C=w|0;H=a[G]|0;I=H&255;M=(I&1|0)==0;if(M){N=I>>>1}else{N=c[k+4>>2]|0}O=c[v>>2]|0;if(N>>>0>O>>>0){if(M){P=I>>>1}else{P=c[k+4>>2]|0}I=d[u]|0;if((I&1|0)==0){Q=I>>>1}else{Q=c[t+4>>2]|0}I=d[s]|0;if((I&1|0)==0){R=I>>>1}else{R=c[r+4>>2]|0}S=((P-O<<1|1)+Q|0)+R|0}else{I=d[u]|0;if((I&1|0)==0){T=I>>>1}else{T=c[t+4>>2]|0}I=d[s]|0;if((I&1|0)==0){U=I>>>1}else{U=c[r+4>>2]|0}S=(T+2|0)+U|0}I=S+O|0;do{if(I>>>0>100){M=j$(I)|0;if((M|0)!=0){V=M;W=M;X=a[G]|0;break}M=bO(4)|0;c[M>>2]=5257468;bg(M|0,5262716,348)}else{V=C;W=0;X=H}}while(0);if((X&1)<<24>>24==0){Y=F+1|0}else{Y=c[k+8>>2]|0}H=X&255;if((H&1|0)==0){Z=H>>>1}else{Z=c[k+4>>2]|0}hG(V,x,y,c[h+4>>2]|0,Y,Y+Z|0,E,K,m,a[n]|0,a[o]|0,p,r,t,O);fW(b,c[f>>2]|0,V,c[x>>2]|0,c[y>>2]|0,h,j);if((W|0)!=0){j0(W)}do{if((a[u]&1)<<24>>24!=0){H=c[t+8>>2]|0;if((H|0)==0){break}j0(H)}}while(0);do{if((a[s]&1)<<24>>24!=0){O=c[r+8>>2]|0;if((O|0)==0){break}j0(O)}}while(0);do{if((a[q]&1)<<24>>24!=0){O=c[p+8>>2]|0;if((O|0)==0){break}j0(O)}}while(0);O=z+4|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)!=0){i=e;return}b$[c[(c[z>>2]|0)+8>>2]&1023](z);i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function hK(b,e,f,g,j,l,m){b=b|0;e=e|0;f=f|0;g=g|0;j=j|0;l=l|0;m=+m;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;e=i;i=i+540|0;n=f;f=i;i=i+4|0;c[f>>2]=c[n>>2]|0;n=e|0;o=e+112|0;p=e+516|0;q=e+520|0;r=e+524|0;s=e+528|0;t=s;u=i;i=i+12|0;v=u;x=i;i=i+12|0;y=x;z=i;i=i+4|0;A=i;i=i+400|0;B=i;i=i+4|0;C=i;i=i+4|0;E=e+12|0;c[o>>2]=E;F=e+116|0;G=aQ(E|0,100,5247384,(w=i,i=i+8|0,h[k>>3]=m,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0;do{if(G>>>0>99){do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);E=f0(o,c[1312889]|0,5247384,(w=i,i=i+8|0,h[k>>3]=m,c[w>>2]=c[k>>2]|0,c[w+4>>2]=c[k+4>>2]|0,w)|0)|0;H=c[o>>2]|0;if((H|0)==0){I=bO(4)|0;c[I>>2]=5257468;bg(I|0,5262716,348)}I=j$(E<<2)|0;J=I;if((I|0)!=0){K=J;L=E;M=H;N=J;break}J=bO(4)|0;c[J>>2]=5257468;bg(J|0,5262716,348)}else{K=F;L=G;M=0;N=0}}while(0);G=c[j+28>>2]|0;F=G;J=G+4|0;D=c[J>>2]|0,c[J>>2]=D+1,D;if((c[1316232]|0)!=-1){c[n>>2]=5264928;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264928,n)}n=(c[1316233]|0)-1|0;J=c[G+20>>2]|0;do{if((c[G+24>>2]|0)-J>>2>>>0>n>>>0){H=c[J+(n<<2)>>2]|0;if((H|0)==0){break}E=H;I=c[o>>2]|0;b9[c[(c[H>>2]|0)+48>>2]&1023](E,I,I+L|0,K);if((L|0)==0){O=0}else{O=a[c[o>>2]|0]<<24>>24==45}c[t>>2]=0;c[t+4>>2]=0;c[t+8>>2]=0;c[v>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;c[y>>2]=0;c[y+4>>2]=0;c[y+8>>2]=0;hL(g,O,F,p,q,r,s,u,x,z);I=A|0;H=c[z>>2]|0;if((L|0)>(H|0)){P=d[y]|0;if((P&1|0)==0){Q=P>>>1}else{Q=c[x+4>>2]|0}P=d[v]|0;if((P&1|0)==0){R=P>>>1}else{R=c[u+4>>2]|0}S=((L-H<<1|1)+Q|0)+R|0}else{P=d[y]|0;if((P&1|0)==0){T=P>>>1}else{T=c[x+4>>2]|0}P=d[v]|0;if((P&1|0)==0){U=P>>>1}else{U=c[u+4>>2]|0}S=(T+2|0)+U|0}P=S+H|0;do{if(P>>>0>100){V=j$(P<<2)|0;W=V;if((V|0)!=0){X=W;Y=W;break}W=bO(4)|0;c[W>>2]=5257468;bg(W|0,5262716,348)}else{X=I;Y=0}}while(0);hM(X,B,C,c[j+4>>2]|0,K,K+(L<<2)|0,E,O,p,c[q>>2]|0,c[r>>2]|0,s,u,x,H);f8(b,c[f>>2]|0,X,c[B>>2]|0,c[C>>2]|0,j,l);if((Y|0)!=0){j0(Y)}do{if((a[y]&1)<<24>>24!=0){I=c[x+8>>2]|0;if((I|0)==0){break}j0(I)}}while(0);do{if((a[v]&1)<<24>>24!=0){H=c[u+8>>2]|0;if((H|0)==0){break}j0(H)}}while(0);do{if((a[t]&1)<<24>>24!=0){H=c[s+8>>2]|0;if((H|0)==0){break}j0(H)}}while(0);H=G+4|0;if(((D=c[H>>2]|0,c[H>>2]=D+ -1,D)|0)==0){b$[c[(c[G>>2]|0)+8>>2]&1023](G)}if((N|0)!=0){j0(N)}if((M|0)==0){i=e;return}j0(M);i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function hL(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0;n=i;i=i+28|0;o=n|0;p=n+12|0;q=n+24|0;r=q;s=i;i=i+12|0;t=i;i=i+4|0;u=t;v=i;i=i+12|0;w=i;i=i+12|0;y=i;i=i+12|0;z=i;i=i+4|0;A=z;B=i;i=i+12|0;C=i;i=i+4|0;D=C;E=i;i=i+12|0;F=i;i=i+12|0;G=i;i=i+12|0;if(b){if((c[1316353]|0)!=-1){c[p>>2]=5265412;c[p+4>>2]=28;c[p+8>>2]=0;dY(5265412,p)}p=(c[1316354]|0)-1|0;b=c[e+20>>2]|0;if((c[e+24>>2]|0)-b>>2>>>0<=p>>>0){H=bO(4)|0;I=H;c[I>>2]=5257492;bg(H|0,5262728,378)}J=c[b+(p<<2)>>2]|0;if((J|0)==0){H=bO(4)|0;I=H;c[I>>2]=5257492;bg(H|0,5262728,378)}H=J;I=c[J>>2]|0;do{if(d){b0[c[I+44>>2]&1023](r,H);p=f;x=c[q>>2]|0;a[p]=x&255;x=x>>8;a[p+1|0]=x&255;x=x>>8;a[p+2|0]=x&255;x=x>>8;a[p+3|0]=x&255;b0[c[(c[J>>2]|0)+32>>2]&1023](s,H);p=s;b=a[p]|0;if((b&1)<<24>>24==0){K=s+4|0}else{K=c[s+8>>2]|0}L=b&255;if((L&1|0)==0){M=L>>>1}else{M=c[s+4>>2]|0}d2(l,K,M);if((a[p]&1)<<24>>24==0){break}p=c[s+8>>2]|0;if((p|0)==0){break}j0(p)}else{b0[c[I+40>>2]&1023](u,H);p=f;x=c[t>>2]|0;a[p]=x&255;x=x>>8;a[p+1|0]=x&255;x=x>>8;a[p+2|0]=x&255;x=x>>8;a[p+3|0]=x&255;b0[c[(c[J>>2]|0)+28>>2]&1023](v,H);p=v;L=a[p]|0;if((L&1)<<24>>24==0){N=v+4|0}else{N=c[v+8>>2]|0}b=L&255;if((b&1|0)==0){O=b>>>1}else{O=c[v+4>>2]|0}d2(l,N,O);if((a[p]&1)<<24>>24==0){break}p=c[v+8>>2]|0;if((p|0)==0){break}j0(p)}}while(0);v=J;c[g>>2]=b2[c[(c[v>>2]|0)+12>>2]&1023](H)|0;c[h>>2]=b2[c[(c[v>>2]|0)+16>>2]&1023](H)|0;b0[c[(c[J>>2]|0)+20>>2]&1023](w,H);dV(j,w);do{if((a[w]&1)<<24>>24!=0){O=c[w+8>>2]|0;if((O|0)==0){break}j0(O)}}while(0);b0[c[(c[J>>2]|0)+24>>2]&1023](y,H);J=y;w=a[J]|0;if((w&1)<<24>>24==0){P=y+4|0}else{P=c[y+8>>2]|0}O=w&255;if((O&1|0)==0){Q=O>>>1}else{Q=c[y+4>>2]|0}d2(k,P,Q);do{if((a[J]&1)<<24>>24!=0){Q=c[y+8>>2]|0;if((Q|0)==0){break}j0(Q)}}while(0);y=b2[c[(c[v>>2]|0)+36>>2]&1023](H)|0;c[m>>2]=y;i=n;return}else{if((c[1316355]|0)!=-1){c[o>>2]=5265420;c[o+4>>2]=28;c[o+8>>2]=0;dY(5265420,o)}o=(c[1316356]|0)-1|0;H=c[e+20>>2]|0;if((c[e+24>>2]|0)-H>>2>>>0<=o>>>0){R=bO(4)|0;S=R;c[S>>2]=5257492;bg(R|0,5262728,378)}e=c[H+(o<<2)>>2]|0;if((e|0)==0){R=bO(4)|0;S=R;c[S>>2]=5257492;bg(R|0,5262728,378)}R=e;S=c[e>>2]|0;do{if(d){b0[c[S+44>>2]&1023](A,R);o=f;x=c[z>>2]|0;a[o]=x&255;x=x>>8;a[o+1|0]=x&255;x=x>>8;a[o+2|0]=x&255;x=x>>8;a[o+3|0]=x&255;b0[c[(c[e>>2]|0)+32>>2]&1023](B,R);o=B;H=a[o]|0;if((H&1)<<24>>24==0){T=B+4|0}else{T=c[B+8>>2]|0}v=H&255;if((v&1|0)==0){U=v>>>1}else{U=c[B+4>>2]|0}d2(l,T,U);if((a[o]&1)<<24>>24==0){break}o=c[B+8>>2]|0;if((o|0)==0){break}j0(o)}else{b0[c[S+40>>2]&1023](D,R);o=f;x=c[C>>2]|0;a[o]=x&255;x=x>>8;a[o+1|0]=x&255;x=x>>8;a[o+2|0]=x&255;x=x>>8;a[o+3|0]=x&255;b0[c[(c[e>>2]|0)+28>>2]&1023](E,R);o=E;v=a[o]|0;if((v&1)<<24>>24==0){V=E+4|0}else{V=c[E+8>>2]|0}H=v&255;if((H&1|0)==0){W=H>>>1}else{W=c[E+4>>2]|0}d2(l,V,W);if((a[o]&1)<<24>>24==0){break}o=c[E+8>>2]|0;if((o|0)==0){break}j0(o)}}while(0);E=e;c[g>>2]=b2[c[(c[E>>2]|0)+12>>2]&1023](R)|0;c[h>>2]=b2[c[(c[E>>2]|0)+16>>2]&1023](R)|0;b0[c[(c[e>>2]|0)+20>>2]&1023](F,R);dV(j,F);do{if((a[F]&1)<<24>>24!=0){j=c[F+8>>2]|0;if((j|0)==0){break}j0(j)}}while(0);b0[c[(c[e>>2]|0)+24>>2]&1023](G,R);e=G;F=a[e]|0;if((F&1)<<24>>24==0){X=G+4|0}else{X=c[G+8>>2]|0}j=F&255;if((j&1|0)==0){Y=j>>>1}else{Y=c[G+4>>2]|0}d2(k,X,Y);do{if((a[e]&1)<<24>>24!=0){Y=c[G+8>>2]|0;if((Y|0)==0){break}j0(Y)}}while(0);y=b2[c[(c[E>>2]|0)+36>>2]&1023](R)|0;c[m>>2]=y;i=n;return}}function hM(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0;c[e>>2]=b;r=i;s=p;t=p+4|0;u=p+8|0;p=o;v=(f&512|0)==0;w=o+4|0;x=o+8|0;o=i;y=(q|0)>0;z=n;A=n+1|0;B=n+8|0;C=n+4|0;n=g;g=0;while(1){D=a[k+g|0]<<24>>24;L2145:do{if((D|0)==1){c[d>>2]=c[e>>2]|0;E=cc[c[(c[r>>2]|0)+44>>2]&1023](i,32)|0;F=c[e>>2]|0;c[e>>2]=F+4|0;c[F>>2]=E;G=n}else if((D|0)==0){c[d>>2]=c[e>>2]|0;G=n}else if((D|0)==3){E=a[s]|0;F=E&255;if((F&1|0)==0){H=F>>>1}else{H=c[t>>2]|0}if((H|0)==0){G=n;break}if((E&1)<<24>>24==0){I=t}else{I=c[u>>2]|0}E=c[I>>2]|0;F=c[e>>2]|0;c[e>>2]=F+4|0;c[F>>2]=E;G=n}else if((D|0)==2){E=a[p]|0;F=E&255;J=(F&1|0)==0;if(J){K=F>>>1}else{K=c[w>>2]|0}if((K|0)==0|v){G=n;break}if((E&1)<<24>>24==0){L=w}else{L=c[x>>2]|0}if(J){M=F>>>1}else{M=c[w>>2]|0}F=L+(M<<2)|0;J=c[e>>2]|0;if((L|0)==(F|0)){N=J}else{E=((L+(M-1<<2)|0)+(-L|0)|0)>>>2;O=L;P=J;while(1){c[P>>2]=c[O>>2]|0;Q=O+4|0;if((Q|0)==(F|0)){break}O=Q;P=P+4|0}N=J+(E+1<<2)|0}c[e>>2]=N;G=n}else if((D|0)==4){P=c[e>>2]|0;O=j?n+4|0:n;F=O;while(1){if(F>>>0>=h>>>0){break}if(bY[c[(c[o>>2]|0)+12>>2]&1023](i,2048,c[F>>2]|0)|0){F=F+4|0}else{break}}if(y){do{if(F>>>0>O>>>0){E=F;J=q;while(1){R=E-4|0;Q=c[R>>2]|0;S=c[e>>2]|0;c[e>>2]=S+4|0;c[S>>2]=Q;T=J-1|0;U=(T|0)>0;if(R>>>0>O>>>0&U){E=R;J=T}else{break}}if(U){V=T;W=R;X=1999;break}J=c[e>>2]|0;c[e>>2]=J+4|0;Y=J;Z=R;break}else{V=q;W=F;X=1999}}while(0);L2189:do{if((X|0)==1999){X=0;J=cc[c[(c[r>>2]|0)+44>>2]&1023](i,48)|0;E=c[e>>2]|0;c[e>>2]=E+4|0;if((V|0)>0){_=V;$=E}else{Y=E;Z=W;break}while(1){c[$>>2]=J;E=_-1|0;Q=c[e>>2]|0;c[e>>2]=Q+4|0;if((E|0)>0){_=E;$=Q}else{Y=Q;Z=W;break L2189}}}}while(0);c[Y>>2]=l;aa=Z}else{aa=F}L2195:do{if((aa|0)==(O|0)){J=cc[c[(c[r>>2]|0)+44>>2]&1023](i,48)|0;Q=c[e>>2]|0;c[e>>2]=Q+4|0;c[Q>>2]=J}else{J=a[z]|0;Q=J&255;if((Q&1|0)==0){ab=Q>>>1}else{ab=c[C>>2]|0}do{if((ab|0)==0){ac=aa;ad=0;ae=0;af=-1}else{if((J&1)<<24>>24==0){ag=A}else{ag=c[B>>2]|0}ac=aa;ad=0;ae=0;af=a[ag]<<24>>24;break}}while(0);while(1){do{if((ad|0)==(af|0)){J=c[e>>2]|0;c[e>>2]=J+4|0;c[J>>2]=m;J=ae+1|0;Q=a[z]|0;E=Q&255;if((E&1|0)==0){ah=E>>>1}else{ah=c[C>>2]|0}if(J>>>0>=ah>>>0){ai=af;aj=J;ak=0;break}E=(Q&1)<<24>>24==0;if(E){al=A}else{al=c[B>>2]|0}if(a[al+J|0]<<24>>24==127){ai=-1;aj=J;ak=0;break}if(E){am=A}else{am=c[B>>2]|0}ai=a[am+J|0]<<24>>24;aj=J;ak=0}else{ai=af;aj=ae;ak=ad}}while(0);J=ac-4|0;E=c[J>>2]|0;Q=c[e>>2]|0;c[e>>2]=Q+4|0;c[Q>>2]=E;if((J|0)==(O|0)){break L2195}else{ac=J;ad=ak+1|0;ae=aj;af=ai}}}}while(0);F=c[e>>2]|0;if((P|0)==(F|0)){G=O;break}J=F-4|0;if(P>>>0<J>>>0){an=P;ao=J}else{G=O;break}while(1){J=c[an>>2]|0;c[an>>2]=c[ao>>2]|0;c[ao>>2]=J;J=an+4|0;F=ao-4|0;if(J>>>0<F>>>0){an=J;ao=F}else{G=O;break L2145}}}else{G=n}}while(0);D=g+1|0;if((D|0)==4){break}else{n=G;g=D}}g=a[s]|0;s=g&255;G=(s&1|0)==0;if(G){ap=s>>>1}else{ap=c[t>>2]|0}if(ap>>>0>1){if((g&1)<<24>>24==0){aq=t}else{aq=c[u>>2]|0}if(G){ar=s>>>1}else{ar=c[t>>2]|0}t=aq+(ar<<2)|0;s=c[e>>2]|0;G=aq+4|0;if((G|0)==(t|0)){as=s}else{u=(((aq+(ar-2<<2)|0)+(-aq|0)|0)>>>2)+1|0;aq=s;ar=G;while(1){c[aq>>2]=c[ar>>2]|0;G=ar+4|0;if((G|0)==(t|0)){break}else{aq=aq+4|0;ar=G}}as=s+(u<<2)|0}c[e>>2]=as}as=f&176;if((as|0)==16){return}else if((as|0)==32){c[d>>2]=c[e>>2]|0;return}else{c[d>>2]=b;return}}function hN(a){a=a|0;return}function hO(a){a=a|0;return}function hP(a){a=a|0;if((a|0)==0){return}j0(a);return}function hQ(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)<<24>>24==0){f=d+1|0}else{f=c[d+8>>2]|0}d=a3(f|0,200)|0;return d>>>(((d|0)!=-1&1)>>>0)|0}function hR(a,b){a=a|0;b=b|0;bP(((b|0)==-1?-1:b<<1)|0);return}function hS(a){a=a|0;if((a|0)==0){return}j0(a);return}function hT(b,e,f,g,h,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0;e=i;i=i+36|0;l=f;f=i;i=i+4|0;c[f>>2]=c[l>>2]|0;l=e|0;m=e+12|0;n=e+16|0;o=e+20|0;p=e+24|0;q=p;r=i;i=i+12|0;s=r;t=i;i=i+12|0;u=t;v=i;i=i+4|0;w=i;i=i+400|0;x=i;i=i+4|0;y=i;i=i+4|0;z=c[h+28>>2]|0;A=z;B=z+4|0;D=c[B>>2]|0,c[B>>2]=D+1,D;if((c[1316232]|0)!=-1){c[l>>2]=5264928;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264928,l)}l=(c[1316233]|0)-1|0;B=c[z+20>>2]|0;do{if((c[z+24>>2]|0)-B>>2>>>0>l>>>0){C=c[B+(l<<2)>>2]|0;if((C|0)==0){break}E=C;F=k;G=a[F]|0;H=G&255;if((H&1|0)==0){I=H>>>1}else{I=c[k+4>>2]|0}if((I|0)==0){J=0}else{if((G&1)<<24>>24==0){K=k+4|0}else{K=c[k+8>>2]|0}G=c[K>>2]|0;J=(G|0)==(cc[c[(c[C>>2]|0)+44>>2]&1023](E,45)|0)}c[q>>2]=0;c[q+4>>2]=0;c[q+8>>2]=0;c[s>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;c[u>>2]=0;c[u+4>>2]=0;c[u+8>>2]=0;hL(g,J,A,m,n,o,p,r,t,v);C=w|0;G=a[F]|0;H=G&255;L=(H&1|0)==0;if(L){M=H>>>1}else{M=c[k+4>>2]|0}N=c[v>>2]|0;if(M>>>0>N>>>0){if(L){O=H>>>1}else{O=c[k+4>>2]|0}H=d[u]|0;if((H&1|0)==0){P=H>>>1}else{P=c[t+4>>2]|0}H=d[s]|0;if((H&1|0)==0){Q=H>>>1}else{Q=c[r+4>>2]|0}R=((O-N<<1|1)+P|0)+Q|0}else{H=d[u]|0;if((H&1|0)==0){S=H>>>1}else{S=c[t+4>>2]|0}H=d[s]|0;if((H&1|0)==0){T=H>>>1}else{T=c[r+4>>2]|0}R=(S+2|0)+T|0}H=R+N|0;do{if(H>>>0>100){L=j$(H<<2)|0;U=L;if((L|0)!=0){V=U;W=U;X=a[F]|0;break}U=bO(4)|0;c[U>>2]=5257468;bg(U|0,5262716,348)}else{V=C;W=0;X=G}}while(0);if((X&1)<<24>>24==0){Y=k+4|0}else{Y=c[k+8>>2]|0}G=X&255;if((G&1|0)==0){Z=G>>>1}else{Z=c[k+4>>2]|0}hM(V,x,y,c[h+4>>2]|0,Y,Y+(Z<<2)|0,E,J,m,c[n>>2]|0,c[o>>2]|0,p,r,t,N);f8(b,c[f>>2]|0,V,c[x>>2]|0,c[y>>2]|0,h,j);if((W|0)!=0){j0(W)}do{if((a[u]&1)<<24>>24!=0){G=c[t+8>>2]|0;if((G|0)==0){break}j0(G)}}while(0);do{if((a[s]&1)<<24>>24!=0){N=c[r+8>>2]|0;if((N|0)==0){break}j0(N)}}while(0);do{if((a[q]&1)<<24>>24!=0){N=c[p+8>>2]|0;if((N|0)==0){break}j0(N)}}while(0);N=z+4|0;if(((D=c[N>>2]|0,c[N>>2]=D+ -1,D)|0)!=0){i=e;return}b$[c[(c[z>>2]|0)+8>>2]&1023](z);i=e;return}}while(0);e=bO(4)|0;c[e>>2]=5257492;bg(e|0,5262728,378)}function hU(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;d=i;i=i+12|0;j=d|0;k=j;c[k>>2]=0;c[k+4>>2]=0;c[k+8>>2]=0;l=b;m=a[h]|0;if((m&1)<<24>>24==0){n=h+1|0}else{n=c[h+8>>2]|0}o=m&255;if((o&1|0)==0){p=o>>>1}else{p=c[h+4>>2]|0}h=n+p|0;do{if(n>>>0<h>>>0){p=j+1|0;o=j+8|0;m=j|0;q=j+4|0;r=n;s=0;L2371:while(1){t=a[r]|0;if((s&1)<<24>>24==0){u=10;v=s}else{w=c[m>>2]|0;u=(w&-2)-1|0;v=w&255}w=v&255;x=(w&1|0)==0?w>>>1:c[q>>2]|0;if((x|0)==(u|0)){if((u|0)==-3){y=2161;break}w=(v&1)<<24>>24==0?p:c[o>>2]|0;do{if(u>>>0<2147483631){z=u+1|0;A=u<<1;B=z>>>0<A>>>0?A:z;if(B>>>0<11){C=11;break}C=B+16&-16}else{C=-2}}while(0);B=(C|0)==0?1:C;while(1){E=j$(B)|0;if((E|0)!=0){break}z=(D=c[1316362]|0,c[1316362]=D+0,D);if((z|0)==0){y=2175;break L2371}b7[z&1023]()}j9(E,w,u);if(!((u|0)==10|(w|0)==0)){j0(w)}c[o>>2]=E;B=C|1;c[m>>2]=B;F=B&255;G=E}else{F=v;G=c[o>>2]|0}B=(F&1)<<24>>24==0?p:G;a[B+x|0]=t;z=x+1|0;a[B+z|0]=0;B=a[k]|0;if((B&1)<<24>>24==0){A=z<<1&255;a[k]=A;H=A}else{c[q>>2]=z;H=B}B=r+1|0;if(B>>>0<h>>>0){r=B;s=H}else{y=2184;break}}if((y|0)==2161){dZ()}else if((y|0)==2175){s=bO(4)|0;c[s>>2]=5257468;bg(s|0,5262716,348)}else if((y|0)==2184){I=(H&1)<<24>>24==0?p:c[o>>2]|0;J=(e|0)==-1?-1:e<<1;break}}else{I=j+1|0;J=(e|0)==-1?-1:e<<1}}while(0);e=bL(J|0,f|0,g|0,I|0)|0;c[l>>2]=0;c[l+4>>2]=0;c[l+8>>2]=0;I=j8(e)|0;g=e+I|0;L2406:do{if((I|0)>0){f=b+1|0;J=b+4|0;H=b+8|0;y=b|0;h=e;G=0;while(1){F=a[h]|0;if((G&1)<<24>>24==0){K=10;L=G}else{v=c[y>>2]|0;K=(v&-2)-1|0;L=v&255}v=L&255;if((v&1|0)==0){M=v>>>1}else{M=c[J>>2]|0}if((M|0)==(K|0)){d0(b,K,1,K,K);N=a[l]|0}else{N=L}if((N&1)<<24>>24==0){O=f}else{O=c[H>>2]|0}a[O+M|0]=F;F=M+1|0;a[O+F|0]=0;v=a[l]|0;if((v&1)<<24>>24==0){E=F<<1&255;a[l]=E;P=E}else{c[J>>2]=F;P=v}v=h+1|0;if(v>>>0<g>>>0){h=v;G=P}else{break L2406}}}}while(0);if((a[k]&1)<<24>>24==0){i=d;return}k=c[j+8>>2]|0;if((k|0)==0){i=d;return}j0(k);i=d;return}function hV(a){a=a|0;return}function hW(a){a=a|0;return}function hX(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((a[d]&1)<<24>>24==0){f=d+1|0}else{f=c[d+8>>2]|0}d=a3(f|0,200)|0;return d>>>(((d|0)!=-1&1)>>>0)|0}function hY(a,b){a=a|0;b=b|0;bP(((b|0)==-1?-1:b<<1)|0);return}function hZ(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0;d=i;i=i+204|0;j=d|0;k=d+8|0;l=d+40|0;m=d+44|0;n=d+48|0;o=d+56|0;p=d+184|0;q=d+188|0;r=d+192|0;s=r;t=i;i=i+8|0;u=i;i=i+8|0;c[s>>2]=0;c[s+4>>2]=0;c[s+8>>2]=0;v=b;w=t|0;c[t+4>>2]=0;c[t>>2]=5258948;x=a[h]|0;if((x&1)<<24>>24==0){y=h+4|0}else{y=c[h+8>>2]|0}z=x&255;if((z&1|0)==0){A=z>>>1}else{A=c[h+4>>2]|0}h=y+(A<<2)|0;do{if(y>>>0<h>>>0){A=t;z=k|0;x=k+32|0;B=r+1|0;C=r+8|0;E=r|0;F=r+4|0;G=y;H=5258948;L2456:while(1){c[m>>2]=G;I=(b8[c[H+12>>2]&1023](w,j,G,h,m,z,x,l)|0)==2;J=c[m>>2]|0;if(I|(J|0)==(G|0)){K=2239;break}if(z>>>0<(c[l>>2]|0)>>>0){I=z;L=a[s]|0;while(1){M=a[I]|0;if((L&1)<<24>>24==0){N=10;O=L}else{P=c[E>>2]|0;N=(P&-2)-1|0;O=P&255}P=O&255;Q=(P&1|0)==0?P>>>1:c[F>>2]|0;if((Q|0)==(N|0)){if((N|0)==-3){K=2264;break L2456}P=(O&1)<<24>>24==0?B:c[C>>2]|0;do{if(N>>>0<2147483631){R=N+1|0;S=N<<1;T=R>>>0<S>>>0?S:R;if(T>>>0<11){U=11;break}U=T+16&-16}else{U=-2}}while(0);T=(U|0)==0?1:U;while(1){V=j$(T)|0;if((V|0)!=0){break}R=(D=c[1316362]|0,c[1316362]=D+0,D);if((R|0)==0){K=2278;break L2456}b7[R&1023]()}j9(V,P,N);if(!((N|0)==10|(P|0)==0)){j0(P)}c[C>>2]=V;T=U|1;c[E>>2]=T;W=T&255;X=V}else{W=O;X=c[C>>2]|0}T=(W&1)<<24>>24==0?B:X;a[T+Q|0]=M;R=Q+1|0;a[T+R|0]=0;T=a[s]|0;if((T&1)<<24>>24==0){S=R<<1&255;a[s]=S;Y=S}else{c[F>>2]=R;Y=T}T=I+1|0;if(T>>>0<(c[l>>2]|0)>>>0){I=T;L=Y}else{break}}Z=c[m>>2]|0}else{Z=J}if(Z>>>0>=h>>>0){K=2290;break}G=Z;H=c[A>>2]|0}if((K|0)==2278){A=bO(4)|0;c[A>>2]=5257468;bg(A|0,5262716,348)}else if((K|0)==2264){dZ()}else if((K|0)==2239){A=bO(8)|0;c[A>>2]=5257516;H=A+4|0;G=H;do{if((H|0)!=0){while(1){_=j$(33)|0;if((_|0)!=0){K=2254;break}F=(D=c[1316362]|0,c[1316362]=D+0,D);if((F|0)==0){break}b7[F&1023]()}if((K|0)==2254){c[_+4>>2]=20;c[_>>2]=20;J=_+12|0;c[G>>2]=J;c[_+8>>2]=0;j9(J,5245268,21);break}J=bO(4)|0;c[J>>2]=5257468;bg(J|0,5262716,348)}}while(0);bg(A|0,5262740,44)}else if((K|0)==2290){$=(a[s]&1)<<24>>24==0?B:c[C>>2]|0;aa=(e|0)==-1?-1:e<<1;break}}else{$=r+1|0;aa=(e|0)==-1?-1:e<<1}}while(0);e=bL(aa|0,f|0,g|0,$|0)|0;c[v>>2]=0;c[v+4>>2]=0;c[v+8>>2]=0;$=u|0;c[u+4>>2]=0;c[u>>2]=5258896;g=j8(e)|0;f=e+g|0;L2511:do{if((g|0)>=1){aa=u;_=f;Z=o|0;h=o+128|0;m=b+4|0;Y=b+8|0;l=b|0;X=e;W=0;O=5258896;while(1){c[q>>2]=X;V=(b8[c[O+16>>2]&1023]($,n,X,(_-X|0)>32?X+32|0:f,q,Z,h,p)|0)==2;U=c[q>>2]|0;if(V|(U|0)==(X|0)){break}if(Z>>>0<(c[p>>2]|0)>>>0){V=Z;N=W;while(1){j=c[V>>2]|0;if((N&1)<<24>>24==0){ab=1;ac=N}else{w=c[l>>2]|0;ab=(w&-2)-1|0;ac=w&255}w=ac&255;if((w&1|0)==0){ad=w>>>1}else{ad=c[m>>2]|0}if((ad|0)==(ab|0)){d1(b,ab,1,ab,ab);ae=a[v]|0}else{ae=ac}if((ae&1)<<24>>24==0){af=m}else{af=c[Y>>2]|0}c[af+(ad<<2)>>2]=j;j=ad+1|0;c[af+(j<<2)>>2]=0;w=a[v]|0;if((w&1)<<24>>24==0){y=j<<1&255;a[v]=y;ag=y}else{c[m>>2]=j;ag=w}w=V+4|0;if(w>>>0<(c[p>>2]|0)>>>0){V=w;N=ag}else{break}}ah=c[q>>2]|0;ai=ag}else{ah=U;ai=W}if(ah>>>0>=f>>>0){break L2511}X=ah;W=ai;O=c[aa>>2]|0}aa=bO(8)|0;c[aa>>2]=5257516;O=aa+4|0;W=O;do{if((O|0)!=0){while(1){aj=j$(33)|0;if((aj|0)!=0){K=2317;break}X=(D=c[1316362]|0,c[1316362]=D+0,D);if((X|0)==0){break}b7[X&1023]()}if((K|0)==2317){c[aj+4>>2]=20;c[aj>>2]=20;U=aj+12|0;c[W>>2]=U;c[aj+8>>2]=0;j9(U,5245268,21);break}U=bO(4)|0;c[U>>2]=5257468;bg(U|0,5262716,348)}}while(0);bg(aa|0,5262740,44)}}while(0);if((a[s]&1)<<24>>24==0){i=d;return}s=c[r+8>>2]|0;if((s|0)==0){i=d;return}j0(s);i=d;return}function h_(){var b=0,d=0,e=0,f=0,g=0,h=0;b=bO(8)|0;c[b>>2]=5257564;d=b+4|0;e=d;if((d|0)==0){f=b;c[f>>2]=5257540;bg(b|0,5262752,70)}while(1){g=j$(19)|0;if((g|0)!=0){h=2371;break}d=(D=c[1316362]|0,c[1316362]=D+0,D);if((d|0)==0){h=2365;break}b7[d&1023]()}if((h|0)==2365){d=bO(4)|0;c[d>>2]=5257468;bg(d|0,5262716,348)}else if((h|0)==2371){c[g+4>>2]=6;c[g>>2]=6;h=g+12|0;c[e>>2]=h;c[g+8>>2]=0;a[h]=a[5247220]|0;a[h+1|0]=a[5247221|0]|0;a[h+2|0]=a[5247222|0]|0;a[h+3|0]=a[5247223|0]|0;a[h+4|0]=a[5247224|0]|0;a[h+5|0]=a[5247225|0]|0;a[h+6|0]=a[5247226|0]|0;f=b;c[f>>2]=5257540;bg(b|0,5262752,70)}}function h$(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;c[b>>2]=5258704;d=b+24|0;e=c[d>>2]|0;f=b+20|0;g=c[f>>2]|0;L2574:do{if((e|0)==(g|0)){h=e}else{i=0;j=g;while(1){k=c[j+(i<<2)>>2]|0;do{if((k|0)!=0){l=k+4|0;if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[k>>2]|0)+8>>2]&1023](k|0)}}while(0);k=i+1|0;l=c[f>>2]|0;if(k>>>0<(c[d>>2]|0)-l>>2>>>0){i=k;j=l}else{h=l;break L2574}}}}while(0);do{if((h|0)!=0){c[d>>2]=h;if((h|0)==(b+32|0)){a[b+144|0]=0;break}else{j0(h);break}}}while(0);do{if((a[b+8|0]&1)<<24>>24!=0){h=c[b+16>>2]|0;if((h|0)==0){break}j0(h)}}while(0);if((b|0)==0){return}j0(b);return}function h0(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;c[b>>2]=5258704;d=b+24|0;e=c[d>>2]|0;f=b+20|0;g=c[f>>2]|0;L2597:do{if((e|0)==(g|0)){h=e}else{i=0;j=g;while(1){k=c[j+(i<<2)>>2]|0;do{if((k|0)!=0){l=k+4|0;if(((D=c[l>>2]|0,c[l>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[k>>2]|0)+8>>2]&1023](k|0)}}while(0);k=i+1|0;l=c[f>>2]|0;if(k>>>0<(c[d>>2]|0)-l>>2>>>0){i=k;j=l}else{h=l;break L2597}}}}while(0);do{if((h|0)!=0){c[d>>2]=h;if((h|0)==(b+32|0)){a[b+144|0]=0;break}else{j0(h);break}}}while(0);if((a[b+8|0]&1)<<24>>24==0){return}h=c[b+16>>2]|0;if((h|0)==0){return}j0(h);return}function h1(){var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0;b=i;i=i+336|0;d=b|0;e=b+12|0;f=b+24|0;g=b+36|0;h=b+48|0;j=b+60|0;k=b+72|0;l=b+84|0;m=b+96|0;n=b+108|0;o=b+120|0;p=b+132|0;q=b+144|0;r=b+156|0;s=b+168|0;t=b+180|0;u=b+192|0;v=b+204|0;w=b+216|0;x=b+228|0;y=b+240|0;z=b+252|0;A=b+264|0;B=b+276|0;C=b+288|0;E=b+300|0;F=b+312|0;G=b+324|0;if(a[5265500]<<24>>24!=0){H=c[1312886]|0;i=b;return H|0}if((a7(5265500)|0)==0){H=c[1312886]|0;i=b;return H|0}do{if(a[5265508]<<24>>24==0){if((a7(5265508)|0)==0){break}c[1312950]=0;c[1312949]=5258704;a[5251804]=2;a[5251805]=67;a[5251806]=0;a[5251940]=1;c[1312955]=5251828;c[1312954]=5251828;c[1312956]=5251940;I=28;J=5251828;while(1){if((J|0)==0){K=0}else{c[J>>2]=0;K=c[1312955]|0}L=K+4|0;c[1312955]=L;M=I-1|0;if((M|0)==0){break}else{I=M;J=L}}c[1312955]=c[1312954]|0;c[1312939]=0;c[1312938]=5258436;if((c[1316158]|0)!=-1){c[G>>2]=5264632;c[G+4>>2]=28;c[G+8>>2]=0;dY(5264632,G)}J=c[1316159]|0;I=J-1|0;D=c[1312939]|0,c[1312939]=D+1,D;L=c[1312954]|0;M=(c[1312955]|0)-L>>2;do{if(M>>>0>I>>>0){N=L}else{if(M>>>0<J>>>0){jz(J-M|0);N=c[1312954]|0;break}else{if(M>>>0<=J>>>0){N=L;break}c[1312955]=L+(J<<2)|0;N=L;break}}}while(0);L=c[N+(I<<2)>>2]|0;do{if((L|0)!=0){J=L+4|0;if(((D=c[J>>2]|0,c[J>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[L>>2]|0)+8>>2]&1023](L|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251752;c[1312937]=0;c[1312936]=5258400;if((c[1316156]|0)!=-1){c[F>>2]=5264624;c[F+4>>2]=28;c[F+8>>2]=0;dY(5264624,F)}L=c[1316157]|0;J=L-1|0;D=c[1312937]|0,c[1312937]=D+1,D;M=c[1312954]|0;O=(c[1312955]|0)-M>>2;do{if(O>>>0>J>>>0){P=M}else{if(O>>>0<L>>>0){jz(L-O|0);P=c[1312954]|0;break}else{if(O>>>0<=L>>>0){P=M;break}c[1312955]=M+(L<<2)|0;P=M;break}}}while(0);M=c[P+(J<<2)>>2]|0;do{if((M|0)!=0){L=M+4|0;if(((D=c[L>>2]|0,c[L>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[M>>2]|0)+8>>2]&1023](M|0)}}while(0);c[(c[1312954]|0)+(J<<2)>>2]=5251744;c[1312989]=0;c[1312988]=5258800;c[1312990]=0;a[5251964]=0;c[1312990]=c[a1()>>2]|0;if((c[1316234]|0)!=-1){c[E>>2]=5264936;c[E+4>>2]=28;c[E+8>>2]=0;dY(5264936,E)}M=c[1316235]|0;L=M-1|0;D=c[1312989]|0,c[1312989]=D+1,D;O=c[1312954]|0;I=(c[1312955]|0)-O>>2;do{if(I>>>0>L>>>0){Q=O}else{if(I>>>0<M>>>0){jz(M-I|0);Q=c[1312954]|0;break}else{if(I>>>0<=M>>>0){Q=O;break}c[1312955]=O+(M<<2)|0;Q=O;break}}}while(0);O=c[Q+(L<<2)>>2]|0;do{if((O|0)!=0){M=O+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[O>>2]|0)+8>>2]&1023](O|0)}}while(0);c[(c[1312954]|0)+(L<<2)>>2]=5251952;c[1312987]=0;c[1312986]=5258728;if((c[1316232]|0)!=-1){c[C>>2]=5264928;c[C+4>>2]=28;c[C+8>>2]=0;dY(5264928,C)}O=c[1316233]|0;M=O-1|0;D=c[1312987]|0,c[1312987]=D+1,D;I=c[1312954]|0;J=(c[1312955]|0)-I>>2;do{if(J>>>0>M>>>0){R=I}else{if(J>>>0<O>>>0){jz(O-J|0);R=c[1312954]|0;break}else{if(J>>>0<=O>>>0){R=I;break}c[1312955]=I+(O<<2)|0;R=I;break}}}while(0);I=c[R+(M<<2)>>2]|0;do{if((I|0)!=0){O=I+4|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[I>>2]|0)+8>>2]&1023](I|0)}}while(0);c[(c[1312954]|0)+(M<<2)>>2]=5251944;c[1312944]=0;c[1312943]=5258524;if((c[1316162]|0)!=-1){c[B>>2]=5264648;c[B+4>>2]=28;c[B+8>>2]=0;dY(5264648,B)}I=c[1316163]|0;O=I-1|0;D=c[1312944]|0,c[1312944]=D+1,D;J=c[1312954]|0;L=(c[1312955]|0)-J>>2;do{if(L>>>0>O>>>0){S=J}else{if(L>>>0<I>>>0){jz(I-L|0);S=c[1312954]|0;break}else{if(L>>>0<=I>>>0){S=J;break}c[1312955]=J+(I<<2)|0;S=J;break}}}while(0);J=c[S+(O<<2)>>2]|0;do{if((J|0)!=0){I=J+4|0;if(((D=c[I>>2]|0,c[I>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[J>>2]|0)+8>>2]&1023](J|0)}}while(0);c[(c[1312954]|0)+(O<<2)>>2]=5251772;c[1312941]=0;c[1312940]=5258472;c[1312942]=0;if((c[1316160]|0)!=-1){c[A>>2]=5264640;c[A+4>>2]=28;c[A+8>>2]=0;dY(5264640,A)}J=c[1316161]|0;I=J-1|0;D=c[1312941]|0,c[1312941]=D+1,D;L=c[1312954]|0;M=(c[1312955]|0)-L>>2;do{if(M>>>0>I>>>0){T=L}else{if(M>>>0<J>>>0){jz(J-M|0);T=c[1312954]|0;break}else{if(M>>>0<=J>>>0){T=L;break}c[1312955]=L+(J<<2)|0;T=L;break}}}while(0);L=c[T+(I<<2)>>2]|0;do{if((L|0)!=0){J=L+4|0;if(((D=c[J>>2]|0,c[J>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[L>>2]|0)+8>>2]&1023](L|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251760;c[1312946]=0;c[1312945]=5258576;if((c[1316164]|0)!=-1){c[z>>2]=5264656;c[z+4>>2]=28;c[z+8>>2]=0;dY(5264656,z)}L=c[1316165]|0;J=L-1|0;D=c[1312946]|0,c[1312946]=D+1,D;M=c[1312954]|0;O=(c[1312955]|0)-M>>2;do{if(O>>>0>J>>>0){U=M}else{if(O>>>0<L>>>0){jz(L-O|0);U=c[1312954]|0;break}else{if(O>>>0<=L>>>0){U=M;break}c[1312955]=M+(L<<2)|0;U=M;break}}}while(0);M=c[U+(J<<2)>>2]|0;do{if((M|0)!=0){L=M+4|0;if(((D=c[L>>2]|0,c[L>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[M>>2]|0)+8>>2]&1023](M|0)}}while(0);c[(c[1312954]|0)+(J<<2)>>2]=5251780;c[1312948]=0;c[1312947]=5258628;if((c[1316166]|0)!=-1){c[y>>2]=5264664;c[y+4>>2]=28;c[y+8>>2]=0;dY(5264664,y)}M=c[1316167]|0;L=M-1|0;D=c[1312948]|0,c[1312948]=D+1,D;O=c[1312954]|0;I=(c[1312955]|0)-O>>2;do{if(I>>>0>L>>>0){V=O}else{if(I>>>0<M>>>0){jz(M-I|0);V=c[1312954]|0;break}else{if(I>>>0<=M>>>0){V=O;break}c[1312955]=O+(M<<2)|0;V=O;break}}}while(0);O=c[V+(L<<2)>>2]|0;do{if((O|0)!=0){M=O+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[O>>2]|0)+8>>2]&1023](O|0)}}while(0);c[(c[1312954]|0)+(L<<2)>>2]=5251788;c[1312919]=0;c[1312918]=5257992;a[5251680]=46;a[5251681]=44;c[1312921]=0;c[5251688>>2]=0;c[5251692>>2]=0;if((c[1316142]|0)!=-1){c[x>>2]=5264568;c[x+4>>2]=28;c[x+8>>2]=0;dY(5264568,x)}O=c[1316143]|0;M=O-1|0;D=c[1312919]|0,c[1312919]=D+1,D;I=c[1312954]|0;J=(c[1312955]|0)-I>>2;do{if(J>>>0>M>>>0){W=I}else{if(J>>>0<O>>>0){jz(O-J|0);W=c[1312954]|0;break}else{if(J>>>0<=O>>>0){W=I;break}c[1312955]=I+(O<<2)|0;W=I;break}}}while(0);I=c[W+(M<<2)>>2]|0;do{if((I|0)!=0){O=I+4|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[I>>2]|0)+8>>2]&1023](I|0)}}while(0);c[(c[1312954]|0)+(M<<2)>>2]=5251672;c[1312912]=0;c[1312911]=5257948;c[1312913]=46;c[1312914]=44;c[1312915]=0;c[5251664>>2]=0;c[5251668>>2]=0;if((c[1316140]|0)!=-1){c[w>>2]=5264560;c[w+4>>2]=28;c[w+8>>2]=0;dY(5264560,w)}I=c[1316141]|0;O=I-1|0;D=c[1312912]|0,c[1312912]=D+1,D;J=c[1312954]|0;L=(c[1312955]|0)-J>>2;do{if(L>>>0>O>>>0){X=J}else{if(L>>>0<I>>>0){jz(I-L|0);X=c[1312954]|0;break}else{if(L>>>0<=I>>>0){X=J;break}c[1312955]=J+(I<<2)|0;X=J;break}}}while(0);J=c[X+(O<<2)>>2]|0;do{if((J|0)!=0){I=J+4|0;if(((D=c[I>>2]|0,c[I>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[J>>2]|0)+8>>2]&1023](J|0)}}while(0);c[(c[1312954]|0)+(O<<2)>>2]=5251644;c[1312935]=0;c[1312934]=5258332;if((c[1316154]|0)!=-1){c[v>>2]=5264616;c[v+4>>2]=28;c[v+8>>2]=0;dY(5264616,v)}J=c[1316155]|0;I=J-1|0;D=c[1312935]|0,c[1312935]=D+1,D;L=c[1312954]|0;M=(c[1312955]|0)-L>>2;do{if(M>>>0>I>>>0){Y=L}else{if(M>>>0<J>>>0){jz(J-M|0);Y=c[1312954]|0;break}else{if(M>>>0<=J>>>0){Y=L;break}c[1312955]=L+(J<<2)|0;Y=L;break}}}while(0);L=c[Y+(I<<2)>>2]|0;do{if((L|0)!=0){J=L+4|0;if(((D=c[J>>2]|0,c[J>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[L>>2]|0)+8>>2]&1023](L|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251736;c[1312933]=0;c[1312932]=5258264;if((c[1316152]|0)!=-1){c[u>>2]=5264608;c[u+4>>2]=28;c[u+8>>2]=0;dY(5264608,u)}L=c[1316153]|0;J=L-1|0;D=c[1312933]|0,c[1312933]=D+1,D;M=c[1312954]|0;O=(c[1312955]|0)-M>>2;do{if(O>>>0>J>>>0){Z=M}else{if(O>>>0<L>>>0){jz(L-O|0);Z=c[1312954]|0;break}else{if(O>>>0<=L>>>0){Z=M;break}c[1312955]=M+(L<<2)|0;Z=M;break}}}while(0);M=c[Z+(J<<2)>>2]|0;do{if((M|0)!=0){L=M+4|0;if(((D=c[L>>2]|0,c[L>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[M>>2]|0)+8>>2]&1023](M|0)}}while(0);c[(c[1312954]|0)+(J<<2)>>2]=5251728;c[1312931]=0;c[1312930]=5258208;if((c[1316150]|0)!=-1){c[t>>2]=5264600;c[t+4>>2]=28;c[t+8>>2]=0;dY(5264600,t)}M=c[1316151]|0;L=M-1|0;D=c[1312931]|0,c[1312931]=D+1,D;O=c[1312954]|0;I=(c[1312955]|0)-O>>2;do{if(I>>>0>L>>>0){_=O}else{if(I>>>0<M>>>0){jz(M-I|0);_=c[1312954]|0;break}else{if(I>>>0<=M>>>0){_=O;break}c[1312955]=O+(M<<2)|0;_=O;break}}}while(0);O=c[_+(L<<2)>>2]|0;do{if((O|0)!=0){M=O+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[O>>2]|0)+8>>2]&1023](O|0)}}while(0);c[(c[1312954]|0)+(L<<2)>>2]=5251720;c[1312929]=0;c[1312928]=5258152;if((c[1316148]|0)!=-1){c[s>>2]=5264592;c[s+4>>2]=28;c[s+8>>2]=0;dY(5264592,s)}O=c[1316149]|0;M=O-1|0;D=c[1312929]|0,c[1312929]=D+1,D;I=c[1312954]|0;J=(c[1312955]|0)-I>>2;do{if(J>>>0>M>>>0){$=I}else{if(J>>>0<O>>>0){jz(O-J|0);$=c[1312954]|0;break}else{if(J>>>0<=O>>>0){$=I;break}c[1312955]=I+(O<<2)|0;$=I;break}}}while(0);I=c[$+(M<<2)>>2]|0;do{if((I|0)!=0){O=I+4|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[I>>2]|0)+8>>2]&1023](I|0)}}while(0);c[(c[1312954]|0)+(M<<2)>>2]=5251712;c[1312999]=0;c[1312998]=5259652;if((c[1316359]|0)!=-1){c[r>>2]=5265436;c[r+4>>2]=28;c[r+8>>2]=0;dY(5265436,r)}I=c[1316360]|0;O=I-1|0;D=c[1312999]|0,c[1312999]=D+1,D;J=c[1312954]|0;L=(c[1312955]|0)-J>>2;do{if(L>>>0>O>>>0){aa=J}else{if(L>>>0<I>>>0){jz(I-L|0);aa=c[1312954]|0;break}else{if(L>>>0<=I>>>0){aa=J;break}c[1312955]=J+(I<<2)|0;aa=J;break}}}while(0);J=c[aa+(O<<2)>>2]|0;do{if((J|0)!=0){I=J+4|0;if(((D=c[I>>2]|0,c[I>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[J>>2]|0)+8>>2]&1023](J|0)}}while(0);c[(c[1312954]|0)+(O<<2)>>2]=5251992;c[1312997]=0;c[1312996]=5259592;if((c[1316357]|0)!=-1){c[q>>2]=5265428;c[q+4>>2]=28;c[q+8>>2]=0;dY(5265428,q)}J=c[1316358]|0;I=J-1|0;D=c[1312997]|0,c[1312997]=D+1,D;L=c[1312954]|0;M=(c[1312955]|0)-L>>2;do{if(M>>>0>I>>>0){ab=L}else{if(M>>>0<J>>>0){jz(J-M|0);ab=c[1312954]|0;break}else{if(M>>>0<=J>>>0){ab=L;break}c[1312955]=L+(J<<2)|0;ab=L;break}}}while(0);L=c[ab+(I<<2)>>2]|0;do{if((L|0)!=0){J=L+4|0;if(((D=c[J>>2]|0,c[J>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[L>>2]|0)+8>>2]&1023](L|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251984;c[1312995]=0;c[1312994]=5259532;if((c[1316355]|0)!=-1){c[p>>2]=5265420;c[p+4>>2]=28;c[p+8>>2]=0;dY(5265420,p)}L=c[1316356]|0;J=L-1|0;D=c[1312995]|0,c[1312995]=D+1,D;M=c[1312954]|0;O=(c[1312955]|0)-M>>2;do{if(O>>>0>J>>>0){ac=M}else{if(O>>>0<L>>>0){jz(L-O|0);ac=c[1312954]|0;break}else{if(O>>>0<=L>>>0){ac=M;break}c[1312955]=M+(L<<2)|0;ac=M;break}}}while(0);M=c[ac+(J<<2)>>2]|0;do{if((M|0)!=0){L=M+4|0;if(((D=c[L>>2]|0,c[L>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[M>>2]|0)+8>>2]&1023](M|0)}}while(0);c[(c[1312954]|0)+(J<<2)>>2]=5251976;c[1312993]=0;c[1312992]=5259472;if((c[1316353]|0)!=-1){c[o>>2]=5265412;c[o+4>>2]=28;c[o+8>>2]=0;dY(5265412,o)}M=c[1316354]|0;L=M-1|0;D=c[1312993]|0,c[1312993]=D+1,D;O=c[1312954]|0;I=(c[1312955]|0)-O>>2;do{if(I>>>0>L>>>0){ad=O}else{if(I>>>0<M>>>0){jz(M-I|0);ad=c[1312954]|0;break}else{if(I>>>0<=M>>>0){ad=O;break}c[1312955]=O+(M<<2)|0;ad=O;break}}}while(0);O=c[ad+(L<<2)>>2]|0;do{if((O|0)!=0){M=O+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[O>>2]|0)+8>>2]&1023](O|0)}}while(0);c[(c[1312954]|0)+(L<<2)>>2]=5251968;c[1312898]=0;c[1312897]=5257684;if((c[1316130]|0)!=-1){c[n>>2]=5264520;c[n+4>>2]=28;c[n+8>>2]=0;dY(5264520,n)}O=c[1316131]|0;M=O-1|0;D=c[1312898]|0,c[1312898]=D+1,D;I=c[1312954]|0;J=(c[1312955]|0)-I>>2;do{if(J>>>0>M>>>0){ae=I}else{if(J>>>0<O>>>0){jz(O-J|0);ae=c[1312954]|0;break}else{if(J>>>0<=O>>>0){ae=I;break}c[1312955]=I+(O<<2)|0;ae=I;break}}}while(0);I=c[ae+(M<<2)>>2]|0;do{if((I|0)!=0){O=I+4|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[I>>2]|0)+8>>2]&1023](I|0)}}while(0);c[(c[1312954]|0)+(M<<2)>>2]=5251588;c[1312896]=0;c[1312895]=5257652;if((c[1316128]|0)!=-1){c[m>>2]=5264512;c[m+4>>2]=28;c[m+8>>2]=0;dY(5264512,m)}I=c[1316129]|0;O=I-1|0;D=c[1312896]|0,c[1312896]=D+1,D;J=c[1312954]|0;L=(c[1312955]|0)-J>>2;do{if(L>>>0>O>>>0){af=J}else{if(L>>>0<I>>>0){jz(I-L|0);af=c[1312954]|0;break}else{if(L>>>0<=I>>>0){af=J;break}c[1312955]=J+(I<<2)|0;af=J;break}}}while(0);J=c[af+(O<<2)>>2]|0;do{if((J|0)!=0){I=J+4|0;if(((D=c[I>>2]|0,c[I>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[J>>2]|0)+8>>2]&1023](J|0)}}while(0);c[(c[1312954]|0)+(O<<2)>>2]=5251580;c[1312894]=0;c[1312893]=5257620;if((c[1316126]|0)!=-1){c[l>>2]=5264504;c[l+4>>2]=28;c[l+8>>2]=0;dY(5264504,l)}J=c[1316127]|0;I=J-1|0;D=c[1312894]|0,c[1312894]=D+1,D;L=c[1312954]|0;M=(c[1312955]|0)-L>>2;do{if(M>>>0>I>>>0){ag=L}else{if(M>>>0<J>>>0){jz(J-M|0);ag=c[1312954]|0;break}else{if(M>>>0<=J>>>0){ag=L;break}c[1312955]=L+(J<<2)|0;ag=L;break}}}while(0);L=c[ag+(I<<2)>>2]|0;do{if((L|0)!=0){J=L+4|0;if(((D=c[J>>2]|0,c[J>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[L>>2]|0)+8>>2]&1023](L|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251572;c[1312892]=0;c[1312891]=5257588;if((c[1316124]|0)!=-1){c[k>>2]=5264496;c[k+4>>2]=28;c[k+8>>2]=0;dY(5264496,k)}L=c[1316125]|0;J=L-1|0;D=c[1312892]|0,c[1312892]=D+1,D;M=c[1312954]|0;O=(c[1312955]|0)-M>>2;do{if(O>>>0>J>>>0){ah=M}else{if(O>>>0<L>>>0){jz(L-O|0);ah=c[1312954]|0;break}else{if(O>>>0<=L>>>0){ah=M;break}c[1312955]=M+(L<<2)|0;ah=M;break}}}while(0);M=c[ah+(J<<2)>>2]|0;do{if((M|0)!=0){L=M+4|0;if(((D=c[L>>2]|0,c[L>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[M>>2]|0)+8>>2]&1023](M|0)}}while(0);c[(c[1312954]|0)+(J<<2)>>2]=5251564;c[1312909]=0;c[1312908]=5257860;c[1312910]=5257908;if((c[1316138]|0)!=-1){c[j>>2]=5264552;c[j+4>>2]=28;c[j+8>>2]=0;dY(5264552,j)}M=c[1316139]|0;L=M-1|0;D=c[1312909]|0,c[1312909]=D+1,D;O=c[1312954]|0;I=(c[1312955]|0)-O>>2;do{if(I>>>0>L>>>0){ai=O}else{if(I>>>0<M>>>0){jz(M-I|0);ai=c[1312954]|0;break}else{if(I>>>0<=M>>>0){ai=O;break}c[1312955]=O+(M<<2)|0;ai=O;break}}}while(0);O=c[ai+(L<<2)>>2]|0;do{if((O|0)!=0){M=O+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[O>>2]|0)+8>>2]&1023](O|0)}}while(0);c[(c[1312954]|0)+(L<<2)>>2]=5251632;c[1312906]=0;c[1312905]=5257772;c[1312907]=5257820;if((c[1316136]|0)!=-1){c[h>>2]=5264544;c[h+4>>2]=28;c[h+8>>2]=0;dY(5264544,h)}O=c[1316137]|0;M=O-1|0;D=c[1312906]|0,c[1312906]=D+1,D;I=c[1312954]|0;J=(c[1312955]|0)-I>>2;do{if(J>>>0>M>>>0){aj=I}else{if(J>>>0<O>>>0){jz(O-J|0);aj=c[1312954]|0;break}else{if(J>>>0<=O>>>0){aj=I;break}c[1312955]=I+(O<<2)|0;aj=I;break}}}while(0);I=c[aj+(M<<2)>>2]|0;do{if((I|0)!=0){O=I+4|0;if(((D=c[O>>2]|0,c[O>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[I>>2]|0)+8>>2]&1023](I|0)}}while(0);c[(c[1312954]|0)+(M<<2)>>2]=5251620;c[1312903]=0;c[1312902]=5258680;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);c[1312904]=c[1312889]|0;c[1312902]=5257744;if((c[1316134]|0)!=-1){c[g>>2]=5264536;c[g+4>>2]=28;c[g+8>>2]=0;dY(5264536,g)}M=c[1316135]|0;I=M-1|0;D=c[1312903]|0,c[1312903]=D+1,D;O=c[1312954]|0;J=(c[1312955]|0)-O>>2;do{if(J>>>0>I>>>0){ak=O}else{if(J>>>0<M>>>0){jz(M-J|0);ak=c[1312954]|0;break}else{if(J>>>0<=M>>>0){ak=O;break}c[1312955]=O+(M<<2)|0;ak=O;break}}}while(0);O=c[ak+(I<<2)>>2]|0;do{if((O|0)!=0){M=O+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[O>>2]|0)+8>>2]&1023](O|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251608;c[1312900]=0;c[1312899]=5258680;do{if(a[5265516]<<24>>24==0){if((a7(5265516)|0)==0){break}c[1312889]=aJ(1,5247832,0)|0}}while(0);c[1312901]=c[1312889]|0;c[1312899]=5257716;if((c[1316132]|0)!=-1){c[f>>2]=5264528;c[f+4>>2]=28;c[f+8>>2]=0;dY(5264528,f)}I=c[1316133]|0;O=I-1|0;D=c[1312900]|0,c[1312900]=D+1,D;M=c[1312954]|0;J=(c[1312955]|0)-M>>2;do{if(J>>>0>O>>>0){al=M}else{if(J>>>0<I>>>0){jz(I-J|0);al=c[1312954]|0;break}else{if(J>>>0<=I>>>0){al=M;break}c[1312955]=M+(I<<2)|0;al=M;break}}}while(0);M=c[al+(O<<2)>>2]|0;do{if((M|0)!=0){I=M+4|0;if(((D=c[I>>2]|0,c[I>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[M>>2]|0)+8>>2]&1023](M|0)}}while(0);c[(c[1312954]|0)+(O<<2)>>2]=5251596;c[1312927]=0;c[1312926]=5258072;if((c[1316146]|0)!=-1){c[e>>2]=5264584;c[e+4>>2]=28;c[e+8>>2]=0;dY(5264584,e)}M=c[1316147]|0;I=M-1|0;D=c[1312927]|0,c[1312927]=D+1,D;J=c[1312954]|0;L=(c[1312955]|0)-J>>2;do{if(L>>>0>I>>>0){am=J}else{if(L>>>0<M>>>0){jz(M-L|0);am=c[1312954]|0;break}else{if(L>>>0<=M>>>0){am=J;break}c[1312955]=J+(M<<2)|0;am=J;break}}}while(0);J=c[am+(I<<2)>>2]|0;do{if((J|0)!=0){M=J+4|0;if(((D=c[M>>2]|0,c[M>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[J>>2]|0)+8>>2]&1023](J|0)}}while(0);c[(c[1312954]|0)+(I<<2)>>2]=5251704;c[1312925]=0;c[1312924]=5258036;if((c[1316144]|0)!=-1){c[d>>2]=5264576;c[d+4>>2]=28;c[d+8>>2]=0;dY(5264576,d)}J=c[1316145]|0;M=J-1|0;D=c[1312925]|0,c[1312925]=D+1,D;L=c[1312954]|0;O=(c[1312955]|0)-L>>2;do{if(O>>>0>M>>>0){an=L}else{if(O>>>0<J>>>0){jz(J-O|0);an=c[1312954]|0;break}else{if(O>>>0<=J>>>0){an=L;break}c[1312955]=L+(J<<2)|0;an=L;break}}}while(0);L=c[an+(M<<2)>>2]|0;do{if((L|0)!=0){J=L+4|0;if(((D=c[J>>2]|0,c[J>>2]=D+ -1,D)|0)!=0){break}b$[c[(c[L>>2]|0)+8>>2]&1023](L|0)}}while(0);c[(c[1312954]|0)+(M<<2)>>2]=5251696;c[1312887]=5251796}}while(0);an=c[1312887]|0;c[1312888]=an;d=an+4|0;D=c[d>>2]|0,c[d>>2]=D+1,D;c[1312886]=5251552;H=c[1312886]|0;i=b;return H|0}function h2(a){a=a|0;return}function h3(a){a=a|0;return}function h4(a,b){a=a|0;b=b|0;return b|0}function h5(a){a=a|0;return}function h6(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function h7(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function h8(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function h9(a){a=a|0;return 1}function ia(a){a=a|0;return 1}function ib(a){a=a|0;return 1}function ic(a,b){a=a|0;b=b|0;return b<<24>>24|0}function id(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128?b&255:c)|0}function ie(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24>-1?b:c)|0}function ig(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;b=d-c|0;return(b>>>0<e>>>0?b:e)|0}function ih(a){a=a|0;c[a+4>>2]=(D=c[1316168]|0,c[1316168]=D+1,D)+1|0;return}function ii(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){c[i>>2]=a[h]<<24>>24;f=h+1|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+4|0}}return g|0}function ij(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0;if((d|0)==(e|0)){h=d;return h|0}b=(((e-4|0)+(-d|0)|0)>>>2)+1|0;i=d;j=g;while(1){g=c[i>>2]|0;a[j]=g>>>0<128?g&255:f;g=i+4|0;if((g|0)==(e|0)){break}else{i=g;j=j+1|0}}h=d+(b<<2)|0;return h|0}function ik(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((c|0)==(d|0)){f=c;return f|0}else{g=c;h=e}while(1){a[h]=a[g]|0;e=g+1|0;if((e|0)==(d|0)){f=d;break}else{g=e;h=h+1|0}}return f|0}function il(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((c|0)==(d|0)){g=c;return g|0}else{h=c;i=f}while(1){f=a[h]|0;a[i]=f<<24>>24>-1?f:e;f=h+1|0;if((f|0)==(d|0)){g=d;break}else{h=f;i=i+1|0}}return g|0}function im(a){a=a|0;if((a|0)==0){return}j0(a);return}function io(a){a=a|0;if((a|0)==0){return}j0(a);return}function ip(b){b=b|0;var d=0;c[b>>2]=5258800;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]&1)<<24>>24!=0){j0(d)}if((b|0)!=0){break}return}}while(0);j0(b);return}function iq(b){b=b|0;var d=0;c[b>>2]=5258800;d=c[b+8>>2]|0;if((d|0)==0){return}if((a[b+12|0]&1)<<24>>24==0){return}j0(d);return}function ir(a){a=a|0;if((a|0)==0){return}j0(a);return}function is(a){a=a|0;var b=0;c[a>>2]=5258472;b=c[a+8>>2]|0;do{if((b|0)!=0){a2(b|0);if((a|0)!=0){break}return}}while(0);j0(a);return}function it(a){a=a|0;var b=0;c[a>>2]=5258472;b=c[a+8>>2]|0;if((b|0)==0){return}a2(b|0);return}function iu(a){a=a|0;if((a|0)==0){return}b$[c[(c[a>>2]|0)+4>>2]&1023](a);return}function iv(a,d,e){a=a|0;d=d|0;e=e|0;var f=0;if(e>>>0>=128){f=0;return f|0}f=(b[(c[a1()>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return f|0}function iw(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;if((d|0)==(e|0)){g=d;return g|0}else{h=d;i=f}while(1){f=c[h>>2]|0;if(f>>>0<128){j=b[(c[a1()>>2]|0)+(f<<1)>>1]|0}else{j=0}b[i>>1]=j;f=h+4|0;if((f|0)==(e|0)){g=e;break}else{h=f;i=i+2|0}}return g|0}function ix(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;if((e|0)==(f|0)){g=e;return g|0}else{h=e}while(1){e=c[h>>2]|0;if(e>>>0<128){if((b[(c[a1()>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0){g=h;i=511;break}}e=h+4|0;if((e|0)==(f|0)){g=f;i=512;break}else{h=e}}if((i|0)==512){return g|0}else if((i|0)==511){return g|0}return 0}function iy(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a=e;while(1){if((a|0)==(f|0)){g=f;h=522;break}e=c[a>>2]|0;if(e>>>0>=128){g=a;h=523;break}if((b[(c[a1()>>2]|0)+(e<<1)>>1]&d)<<16>>16==0){g=a;h=521;break}else{a=a+4|0}}if((h|0)==522){return g|0}else if((h|0)==523){return g|0}else if((h|0)==521){return g|0}return 0}function iz(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128){d=b;return d|0}d=c[(c[bQ()>>2]|0)+(b<<2)>>2]|0;return d|0}function iA(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128){g=c[(c[bQ()>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function iB(a,b){a=a|0;b=b|0;var d=0;if(b>>>0>=128){d=b;return d|0}d=c[(c[bR()>>2]|0)+(b<<2)>>2]|0;return d|0}function iC(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;if((b|0)==(d|0)){e=b;return e|0}else{f=b}while(1){b=c[f>>2]|0;if(b>>>0<128){g=c[(c[bR()>>2]|0)+(b<<2)>>2]|0}else{g=b}c[f>>2]=g;b=f+4|0;if((b|0)==(d|0)){e=d;break}else{f=b}}return e|0}function iD(a,b){a=a|0;b=b|0;var d=0,e=0;a=b<<24>>24;if(b<<24>>24<=-1){d=a;e=d&255;return e|0}d=c[(c[bQ()>>2]|0)+(a<<2)>>2]|0;e=d&255;return e|0}function iE(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;b=d<<24>>24;if(d<<24>>24>-1){h=c[(c[bQ()>>2]|0)+(b<<2)>>2]|0}else{h=b}a[g]=h&255;b=g+1|0;if((b|0)==(e|0)){f=e;break}else{g=b}}return f|0}function iF(a,b){a=a|0;b=b|0;var d=0,e=0;a=b<<24>>24;if(b<<24>>24<=-1){d=a;e=d&255;return e|0}d=c[(c[bR()>>2]|0)+(a<<2)>>2]|0;e=d&255;return e|0}function iG(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;if((d|0)==(e|0)){f=d;return f|0}else{g=d}while(1){d=a[g]|0;b=d<<24>>24;if(d<<24>>24>-1){h=c[(c[bR()>>2]|0)+(b<<2)>>2]|0}else{h=b}a[g]=h&255;b=g+1|0;if((b|0)==(e|0)){f=e;break}else{g=b}}return f|0}function iH(a){a=a|0;return 0}function iI(a){a=a|0;return}function iJ(a){a=a|0;if((a|0)==0){return}j0(a);return}function iK(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;l=i;i=i+12|0;m=l|0;n=l+8|0;o=e;while(1){if((o|0)==(f|0)){p=f;break}if((c[o>>2]|0)==0){p=o;break}else{o=o+4|0}}c[k>>2]=h;c[g>>2]=e;L653:do{if((e|0)==(f|0)|(h|0)==(j|0)){q=e}else{o=d;r=m;s=j;t=b+8|0;u=n|0;v=h;w=e;x=p;while(1){y=c[o+4>>2]|0;c[r>>2]=c[o>>2]|0;c[r+4>>2]=y;y=bA(c[t>>2]|0)|0;z=ax(v|0,g|0,x-w>>2|0,s-v|0,d|0)|0;if((y|0)!=0){bA(y|0)}if((z|0)==(-1|0)){A=609;break}else if((z|0)==0){B=1;A=645;break}y=(c[k>>2]|0)+z|0;c[k>>2]=y;if((y|0)==(j|0)){A=642;break}if((x|0)==(f|0)){C=f;D=y;E=c[g>>2]|0}else{y=bA(c[t>>2]|0)|0;z=bW(u|0,0,d|0)|0;if((y|0)!=0){bA(y|0)}if((z|0)==-1){B=2;A=647;break}y=c[k>>2]|0;if(z>>>0>(s-y|0)>>>0){B=1;A=648;break}L672:do{if((z|0)!=0){F=z;G=u;H=y;while(1){I=a[G]|0;c[k>>2]=H+1|0;a[H]=I;I=F-1|0;if((I|0)==0){break L672}F=I;G=G+1|0;H=c[k>>2]|0}}}while(0);y=(c[g>>2]|0)+4|0;c[g>>2]=y;z=y;while(1){if((z|0)==(f|0)){J=f;break}if((c[z>>2]|0)==0){J=z;break}else{z=z+4|0}}C=J;D=c[k>>2]|0;E=y}if((E|0)==(f|0)|(D|0)==(j|0)){q=E;break L653}else{v=D;w=E;x=C}}if((A|0)==609){c[k>>2]=v;L684:do{if((w|0)==(c[g>>2]|0)){K=w}else{x=w;u=v;while(1){s=c[x>>2]|0;r=bA(c[t>>2]|0)|0;o=bW(u|0,s|0,m|0)|0;if((r|0)!=0){bA(r|0)}if((o|0)==-1){K=x;break L684}r=(c[k>>2]|0)+o|0;c[k>>2]=r;o=x+4|0;if((o|0)==(c[g>>2]|0)){K=o;break L684}else{x=o;u=r}}}}while(0);c[g>>2]=K;B=2;i=l;return B|0}else if((A|0)==642){q=c[g>>2]|0;break}else if((A|0)==645){i=l;return B|0}else if((A|0)==647){i=l;return B|0}else if((A|0)==648){i=l;return B|0}}}while(0);B=(q|0)!=(f|0)&1;i=l;return B|0}function iL(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0;l=i;i=i+8|0;m=l|0;n=e;while(1){if((n|0)==(f|0)){o=f;break}if(a[n]<<24>>24==0){o=n;break}else{n=n+1|0}}c[k>>2]=h;c[g>>2]=e;L705:do{if((e|0)==(f|0)|(h|0)==(j|0)){p=e}else{n=d;q=m;r=j;s=b+8|0;t=h;u=e;v=o;while(1){w=c[n+4>>2]|0;c[q>>2]=c[n>>2]|0;c[q+4>>2]=w;x=v;w=bA(c[s>>2]|0)|0;y=bX(t|0,g|0,x-u|0,r-t>>2|0,d|0)|0;if((w|0)!=0){bA(w|0)}if((y|0)==(-1|0)){z=664;break}else if((y|0)==0){A=2;z=703;break}w=(c[k>>2]|0)+(y<<2)|0;c[k>>2]=w;if((w|0)==(j|0)){z=696;break}y=c[g>>2]|0;if((v|0)==(f|0)){B=f;C=w;D=y}else{E=bA(c[s>>2]|0)|0;F=bo(w|0,y|0,1,d|0)|0;if((E|0)!=0){bA(E|0)}if((F|0)!=0){A=2;z=701;break}c[k>>2]=(c[k>>2]|0)+4|0;F=(c[g>>2]|0)+1|0;c[g>>2]=F;E=F;while(1){if((E|0)==(f|0)){G=f;break}if(a[E]<<24>>24==0){G=E;break}else{E=E+1|0}}B=G;C=c[k>>2]|0;D=F}if((D|0)==(f|0)|(C|0)==(j|0)){p=D;break L705}else{t=C;u=D;v=B}}if((z|0)==664){c[k>>2]=t;L729:do{if((u|0)==(c[g>>2]|0)){H=u}else{v=t;r=u;while(1){q=bA(c[s>>2]|0)|0;n=bo(v|0,r|0,x-r|0,m|0)|0;if((q|0)!=0){bA(q|0)}if((n|0)==(-2|0)){z=676;break}else if((n|0)==(-1|0)){z=675;break}else if((n|0)==0){I=r+1|0}else{I=r+n|0}n=(c[k>>2]|0)+4|0;c[k>>2]=n;if((I|0)==(c[g>>2]|0)){H=I;break L729}else{v=n;r=I}}if((z|0)==676){c[g>>2]=r;A=1;i=l;return A|0}else if((z|0)==675){c[g>>2]=r;A=2;i=l;return A|0}}}while(0);c[g>>2]=H;A=(H|0)!=(f|0)&1;i=l;return A|0}else if((z|0)==696){p=c[g>>2]|0;break}else if((z|0)==701){i=l;return A|0}else if((z|0)==703){i=l;return A|0}}}while(0);A=(p|0)!=(f|0)&1;i=l;return A|0}function iM(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0;h=i;i=i+4|0;c[g>>2]=e;e=h|0;j=bA(c[b+8>>2]|0)|0;b=bW(e|0,0,d|0)|0;if((j|0)!=0){bA(j|0)}L757:do{if((b|0)==(-1|0)|(b|0)==0){k=2}else{j=b-1|0;d=c[g>>2]|0;if(j>>>0>(f-d|0)>>>0){k=1;break}if((j|0)==0){k=0;break}else{l=j;m=e;n=d}while(1){d=a[m]|0;c[g>>2]=n+1|0;a[n]=d;d=l-1|0;if((d|0)==0){k=0;break L757}l=d;m=m+1|0;n=c[g>>2]|0}}}while(0);i=h;return k|0}function iN(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a+8|0;a=bA(c[b>>2]|0)|0;d=aP(0,0,1)|0;if((a|0)!=0){bA(a|0)}if((d|0)!=0){e=-1;return e|0}d=c[b>>2]|0;if((d|0)==0){e=1;return e|0}e=bA(d|0)|0;d=a8()|0;if((e|0)==0){f=(d|0)==1;g=f&1;return g|0}bA(e|0);f=(d|0)==1;g=f&1;return g|0}function iO(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;if((f|0)==0|(d|0)==(e|0)){g=0;return g|0}h=e;i=a+8|0;a=d;d=0;j=0;while(1){k=bA(c[i>>2]|0)|0;l=at(a|0,h-a|0,b|0)|0;if((k|0)!=0){bA(k|0)}if((l|0)==0){m=1;n=a+1|0}else if((l|0)==(-1|0)|(l|0)==(-2|0)){g=d;o=761;break}else{m=l;n=a+l|0}l=m+d|0;k=j+1|0;if(k>>>0>=f>>>0|(n|0)==(e|0)){g=l;o=762;break}else{a=n;d=l;j=k}}if((o|0)==762){return g|0}else if((o|0)==761){return g|0}return 0}function iP(a){a=a|0;var b=0,d=0,e=0;b=c[a+8>>2]|0;do{if((b|0)==0){d=1}else{a=bA(b|0)|0;e=a8()|0;if((a|0)==0){d=e;break}bA(a|0);d=e}}while(0);return d|0}function iQ(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function iR(a){a=a|0;return 0}function iS(a){a=a|0;return 0}function iT(a){a=a|0;return 4}function iU(a){a=a|0;return}function iV(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=h;L812:do{if(g>>>0<h>>>0){d=k;m=j;n=g;while(1){o=b[n>>1]|0;p=o&65535;do{if((o&65535)<128){if((d-m|0)<1){q=1;r=m;s=n;break L812}a[m]=o&255;t=m+1|0;u=n}else{if((o&65535)<2048){if((d-m|0)<2){q=1;r=m;s=n;break L812}a[m]=(p>>>6|192)&255;a[m+1|0]=(p&63|128)&255;t=m+2|0;u=n;break}if((o&65535)<55296){if((d-m|0)<3){q=1;r=m;s=n;break L812}a[m]=(p>>>12|224)&255;a[m+1|0]=(p>>>6&63|128)&255;a[m+2|0]=(p&63|128)&255;t=m+3|0;u=n;break}if((o&65535)>=56320){if((o&65535)<57344){q=2;r=m;s=n;break L812}if((d-m|0)<3){q=1;r=m;s=n;break L812}a[m]=(p>>>12|224)&255;a[m+1|0]=(p>>>6&63|128)&255;a[m+2|0]=(p&63|128)&255;t=m+3|0;u=n;break}if((f-n|0)<4){q=1;r=m;s=n;break L812}v=n+2|0;w=e[v>>1]|0;if((w&64512|0)!=56320){q=2;r=m;s=n;break L812}if((d-m|0)<4){q=1;r=m;s=n;break L812}x=p&960;if(((x<<10)+65536|0)>>>0>1114111){q=2;r=m;s=n;break L812}y=(x>>>6)+1|0;a[m]=(y>>>2|240)&255;a[m+1|0]=(p>>>2&15|y<<4&48|128)&255;a[m+2|0]=(p<<4&48|w>>>6&15|128)&255;a[m+3|0]=(w&63|128)&255;t=m+4|0;u=v}}while(0);p=u+2|0;if(p>>>0<h>>>0){m=t;n=p}else{q=0;r=t;s=p;break L812}}}else{q=0;r=j;s=g}}while(0);c[i>>2]=g+(s-g>>1<<1)|0;c[l>>2]=j+(r-j|0)|0;return q|0}function iW(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;L840:do{if(g>>>0<h>>>0){f=h;e=k;m=j;n=g;while(1){if(m>>>0>=k>>>0){o=m;p=n;q=832;break L840}r=a[n]|0;s=r&255;do{if(r<<24>>24>-1){b[m>>1]=r&255;t=m;u=n+1|0}else{if((r&255)<194){v=2;w=m;x=n;break L840}if((r&255)<224){if((f-n|0)<2){v=1;w=m;x=n;break L840}y=d[n+1|0]|0;if((y&192|0)!=128){v=2;w=m;x=n;break L840}b[m>>1]=(y&63|s<<6&1984)&65535;t=m;u=n+2|0;break}if((r&255)<240){if((f-n|0)<3){v=1;w=m;x=n;break L840}y=a[n+1|0]|0;z=a[n+2|0]|0;if((s|0)==224){if((y&-32)<<24>>24!=-96){v=2;w=m;x=n;break L840}}else if((s|0)==237){if((y&-32)<<24>>24!=-128){v=2;w=m;x=n;break L840}}else{if((y&-64)<<24>>24!=-128){v=2;w=m;x=n;break L840}}A=z&255;if((A&192|0)!=128){v=2;w=m;x=n;break L840}b[m>>1]=((y&255)<<6&4032|s<<12|A&63)&65535;t=m;u=n+3|0;break}if((r&255)>=245){v=2;w=m;x=n;break L840}if((f-n|0)<4){v=1;w=m;x=n;break L840}A=a[n+1|0]|0;y=a[n+2|0]|0;z=a[n+3|0]|0;if((s|0)==240){if((A+112&255)>=48){v=2;w=m;x=n;break L840}}else if((s|0)==244){if((A&-16)<<24>>24!=-128){v=2;w=m;x=n;break L840}}else{if((A&-64)<<24>>24!=-128){v=2;w=m;x=n;break L840}}B=y&255;if((B&192|0)!=128){v=2;w=m;x=n;break L840}y=z&255;if((y&192|0)!=128){v=2;w=m;x=n;break L840}if((e-m|0)<4){v=1;w=m;x=n;break L840}z=s&7;C=A&255;if((C<<12&196608|z<<18)>>>0>1114111){v=2;w=m;x=n;break L840}b[m>>1]=(C<<2&60|B>>>4&3|((C>>>4&3|z<<2)<<6)+16320|55296)&65535;z=m+2|0;b[z>>1]=(y&63|B<<6&960|56320)&65535;t=z;u=n+4|0}}while(0);s=t+2|0;if(u>>>0<h>>>0){m=s;n=u}else{o=s;p=u;q=832;break L840}}}else{o=j;p=g;q=832}}while(0);if((q|0)==832){v=p>>>0<h>>>0&1;w=o;x=p}c[i>>2]=g+(x-g|0)|0;c[l>>2]=j+(w-j>>1<<1)|0;return v|0}function iX(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;L880:do{if(e>>>0<f>>>0&(g|0)!=0){c=f;b=0;h=e;L882:while(1){i=a[h]|0;j=i&255;do{if(i<<24>>24>-1){k=h+1|0;l=b}else{if((i&255)<194){m=h;break L880}if((i&255)<224){if((c-h|0)<2){m=h;break L880}if((a[h+1|0]&-64)<<24>>24!=-128){m=h;break L880}k=h+2|0;l=b;break}if((i&255)<240){n=h;if((c-n|0)<3){m=h;break L880}o=a[h+2|0]|0;p=d[h+1|0]|0;if((j|0)==224){if((p&224|0)!=160){q=847;break L882}}else if((j|0)==237){if((p&224|0)!=128){q=849;break L882}}else{if((p&192|0)!=128){q=851;break L882}}if((o&-64)<<24>>24!=-128){m=h;break L880}k=h+3|0;l=b;break}if((i&255)>=245){m=h;break L880}r=h;if((c-r|0)<4){m=h;break L880}if((g-b|0)>>>0<2){m=h;break L880}o=a[h+1|0]|0;p=a[h+2|0]|0;s=a[h+3|0]|0;if((j|0)==240){if((o+112&255)>=48){q=859;break L882}}else if((j|0)==244){if((o&-16)<<24>>24!=-128){q=861;break L882}}else{if((o&-64)<<24>>24!=-128){q=863;break L882}}if((p&-64)<<24>>24!=-128){m=h;break L880}if((s&-64)<<24>>24!=-128){m=h;break L880}if(((o&255)<<12&196608|j<<18&1835008)>>>0>1114111){m=h;break L880}k=h+4|0;l=b+1|0}}while(0);j=l+1|0;if(k>>>0<f>>>0&j>>>0<g>>>0){b=j;h=k}else{m=k;break L880}}if((q|0)==849){t=n-e|0;return t|0}else if((q|0)==863){t=r-e|0;return t|0}else if((q|0)==859){t=r-e|0;return t|0}else if((q|0)==851){t=n-e|0;return t|0}else if((q|0)==861){t=r-e|0;return t|0}else if((q|0)==847){t=n-e|0;return t|0}}else{m=e}}while(0);t=m-e|0;return t|0}function iY(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;L931:do{if(e>>>0<f>>>0){d=i;b=h;k=e;while(1){l=c[k>>2]|0;if((l&-2048|0)==55296|l>>>0>1114111){m=2;n=b;o=k;break L931}do{if(l>>>0<128){if((d-b|0)<1){m=1;n=b;o=k;break L931}a[b]=l&255;p=b+1|0}else{if(l>>>0<2048){if((d-b|0)<2){m=1;n=b;o=k;break L931}a[b]=(l>>>6|192)&255;a[b+1|0]=(l&63|128)&255;p=b+2|0;break}q=d-b|0;if(l>>>0<65536){if((q|0)<3){m=1;n=b;o=k;break L931}a[b]=(l>>>12|224)&255;a[b+1|0]=(l>>>6&63|128)&255;a[b+2|0]=(l&63|128)&255;p=b+3|0;break}else{if((q|0)<4){m=1;n=b;o=k;break L931}a[b]=(l>>>18|240)&255;a[b+1|0]=(l>>>12&63|128)&255;a[b+2|0]=(l>>>6&63|128)&255;a[b+3|0]=(l&63|128)&255;p=b+4|0;break}}}while(0);l=k+4|0;if(l>>>0<f>>>0){b=p;k=l}else{m=0;n=p;o=l;break L931}}}else{m=0;n=h;o=e}}while(0);c[g>>2]=e+(o-e>>2<<2)|0;c[j>>2]=h+(n-h|0)|0;return m|0}function iZ(a){a=a|0;if((a|0)==0){return}j0(a);return}function i_(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function i$(a){a=a|0;return 0}function i0(a){a=a|0;return 0}function i1(a){a=a|0;return 4}function i2(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;L961:do{if(f>>>0<g>>>0){e=g;b=i;l=f;while(1){if(b>>>0>=j>>>0){m=b;n=l;o=932;break L961}p=a[l]|0;q=p&255;do{if(p<<24>>24>-1){c[b>>2]=q;r=l+1|0}else{if((p&255)<194){s=2;t=b;u=l;break L961}if((p&255)<224){if((e-l|0)<2){s=1;t=b;u=l;break L961}v=d[l+1|0]|0;if((v&192|0)!=128){s=2;t=b;u=l;break L961}c[b>>2]=v&63|q<<6&1984;r=l+2|0;break}if((p&255)<240){if((e-l|0)<3){s=1;t=b;u=l;break L961}v=a[l+1|0]|0;w=a[l+2|0]|0;if((q|0)==237){if((v&-32)<<24>>24!=-128){s=2;t=b;u=l;break L961}}else if((q|0)==224){if((v&-32)<<24>>24!=-96){s=2;t=b;u=l;break L961}}else{if((v&-64)<<24>>24!=-128){s=2;t=b;u=l;break L961}}x=w&255;if((x&192|0)!=128){s=2;t=b;u=l;break L961}c[b>>2]=(v&255)<<6&4032|q<<12&61440|x&63;r=l+3|0;break}if((p&255)>=245){s=2;t=b;u=l;break L961}if((e-l|0)<4){s=1;t=b;u=l;break L961}x=a[l+1|0]|0;v=a[l+2|0]|0;w=a[l+3|0]|0;if((q|0)==240){if((x+112&255)>=48){s=2;t=b;u=l;break L961}}else if((q|0)==244){if((x&-16)<<24>>24!=-128){s=2;t=b;u=l;break L961}}else{if((x&-64)<<24>>24!=-128){s=2;t=b;u=l;break L961}}y=v&255;if((y&192|0)!=128){s=2;t=b;u=l;break L961}v=w&255;if((v&192|0)!=128){s=2;t=b;u=l;break L961}w=(x&255)<<12&258048|q<<18&1835008|y<<6&4032|v&63;if(w>>>0>1114111){s=2;t=b;u=l;break L961}c[b>>2]=w;r=l+4|0}}while(0);q=b+4|0;if(r>>>0<g>>>0){b=q;l=r}else{m=q;n=r;o=932;break L961}}}else{m=i;n=f;o=932}}while(0);if((o|0)==932){s=n>>>0<g>>>0&1;t=m;u=n}c[h>>2]=f+(u-f|0)|0;c[k>>2]=i+(t-i>>2<<2)|0;return s|0}function i3(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;L1000:do{if(d>>>0<e>>>0&(f|0)!=0){c=e;b=1;g=d;L1002:while(1){h=a[g]|0;i=h&255;do{if(h<<24>>24>-1){j=g+1|0}else{if((h&255)<194){k=g;break L1000}if((h&255)<224){if((c-g|0)<2){k=g;break L1000}if((a[g+1|0]&-64)<<24>>24!=-128){k=g;break L1000}j=g+2|0;break}if((h&255)<240){l=g;if((c-l|0)<3){k=g;break L1000}m=a[g+1|0]|0;n=a[g+2|0]|0;if((i|0)==224){if((m&-32)<<24>>24!=-96){o=947;break L1002}}else if((i|0)==237){if((m&-32)<<24>>24!=-128){o=949;break L1002}}else{if((m&-64)<<24>>24!=-128){o=951;break L1002}}if((n&-64)<<24>>24!=-128){k=g;break L1000}j=g+3|0;break}if((h&255)>=245){k=g;break L1000}p=g;if((c-p|0)<4){k=g;break L1000}n=a[g+1|0]|0;m=a[g+2|0]|0;q=a[g+3|0]|0;if((i|0)==240){if((n+112&255)>=48){o=958;break L1002}}else if((i|0)==244){if((n&-16)<<24>>24!=-128){o=960;break L1002}}else{if((n&-64)<<24>>24!=-128){o=962;break L1002}}if((m&-64)<<24>>24!=-128){k=g;break L1000}if((q&-64)<<24>>24!=-128){k=g;break L1000}if(((n&255)<<12&196608|i<<18&1835008)>>>0>1114111){k=g;break L1000}j=g+4|0}}while(0);if(!(j>>>0<e>>>0&b>>>0<f>>>0)){k=j;break L1000}b=b+1|0;g=j}if((o|0)==947){r=l-d|0;return r|0}else if((o|0)==960){r=p-d|0;return r|0}else if((o|0)==962){r=p-d|0;return r|0}else if((o|0)==951){r=l-d|0;return r|0}else if((o|0)==958){r=p-d|0;return r|0}else if((o|0)==949){r=l-d|0;return r|0}}else{k=d}}while(0);r=k-d|0;return r|0}function i4(b){b=b|0;return a[b+8|0]|0}function i5(a){a=a|0;return c[a+8>>2]|0}function i6(b){b=b|0;return a[b+9|0]|0}function i7(a){a=a|0;return c[a+12>>2]|0}function i8(b,c){b=b|0;c=c|0;c=b;a[b]=8;b=c+1|0;x=1702195828;a[b]=x&255;x=x>>8;a[b+1|0]=x&255;x=x>>8;a[b+2|0]=x&255;x=x>>8;a[b+3|0]=x&255;a[c+5|0]=0;return}function i9(a){a=a|0;if((a|0)==0){return}j0(a);return}function ja(a){a=a|0;if((a|0)==0){return}j0(a);return}function jb(b){b=b|0;var d=0;c[b>>2]=5257992;do{if((a[b+12|0]&1)<<24>>24!=0){d=c[b+20>>2]|0;if((d|0)!=0){j0(d)}if((b|0)!=0){break}return}}while(0);j0(b);return}function jc(b){b=b|0;var d=0;c[b>>2]=5257992;if((a[b+12|0]&1)<<24>>24==0){return}d=c[b+20>>2]|0;if((d|0)==0){return}j0(d);return}function jd(b){b=b|0;var d=0;c[b>>2]=5257948;do{if((a[b+16|0]&1)<<24>>24!=0){d=c[b+24>>2]|0;if((d|0)!=0){j0(d)}if((b|0)!=0){break}return}}while(0);j0(b);return}function je(b){b=b|0;var d=0;c[b>>2]=5257948;if((a[b+16|0]&1)<<24>>24==0){return}d=c[b+24>>2]|0;if((d|0)==0){return}j0(d);return}function jf(b,c){b=b|0;c=c|0;c=b;a[b]=10;b=c+1|0;a[b]=a[5246176]|0;a[b+1|0]=a[5246177|0]|0;a[b+2|0]=a[5246178|0]|0;a[b+3|0]=a[5246179|0]|0;a[b+4|0]=a[5246180|0]|0;a[c+6|0]=0;return}function jg(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=d+12|0;if((a[e]&1)<<24>>24==0){f=b;c[f>>2]=c[e>>2]|0;c[f+4>>2]=c[e+4>>2]|0;c[f+8>>2]=c[e+8>>2]|0;return}e=c[d+20>>2]|0;f=c[d+16>>2]|0;if((f|0)==-1){dZ()}do{if(f>>>0<11){a[b]=f<<1&255;g=b+1|0}else{d=f+16&-16;h=(d|0)==0?1:d;while(1){i=j$(h)|0;if((i|0)!=0){j=1041;break}k=(D=c[1316362]|0,c[1316362]=D+0,D);if((k|0)==0){break}b7[k&1023]()}if((j|0)==1041){c[b+8>>2]=i;c[b>>2]=d|1;c[b+4>>2]=f;g=i;break}h=bO(4)|0;c[h>>2]=5257468;bg(h|0,5262716,348)}}while(0);j9(g,e,f);a[g+f|0]=0;return}function jh(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=d+16|0;if((a[e]&1)<<24>>24==0){f=b;c[f>>2]=c[e>>2]|0;c[f+4>>2]=c[e+4>>2]|0;c[f+8>>2]=c[e+8>>2]|0;return}e=c[d+24>>2]|0;f=c[d+20>>2]|0;if((f|0)==-1){dZ()}do{if(f>>>0<11){a[b]=f<<1&255;g=b+1|0}else{d=f+16&-16;h=(d|0)==0?1:d;while(1){i=j$(h)|0;if((i|0)!=0){j=1063;break}k=(D=c[1316362]|0,c[1316362]=D+0,D);if((k|0)==0){break}b7[k&1023]()}if((j|0)==1063){c[b+8>>2]=i;c[b>>2]=d|1;c[b+4>>2]=f;g=i;break}h=bO(4)|0;c[h>>2]=5257468;bg(h|0,5262716,348)}}while(0);j9(g,e,f);a[g+f|0]=0;return}function ji(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=bm(5246264)|0;if(d>>>0>1073741822){dZ()}if(d>>>0<2){a[b]=d<<1&255;e=b+4|0;f=bJ(e|0,5246264,d|0)|0;g=e+(d<<2)|0;c[g>>2]=0;return}h=d+4&-4;i=h<<2;j=(i|0)==0?1:i;while(1){k=j$(j)|0;if((k|0)!=0){l=1083;break}i=(D=c[1316362]|0,c[1316362]=D+0,D);if((i|0)==0){l=1080;break}b7[i&1023]()}if((l|0)==1083){j=k;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=d;e=j;f=bJ(e|0,5246264,d|0)|0;g=e+(d<<2)|0;c[g>>2]=0;return}else if((l|0)==1080){l=bO(4)|0;c[l>>2]=5257468;bg(l|0,5262716,348)}}function jj(b){b=b|0;var d=0;if(a[5265596]<<24>>24!=0){d=c[1313087]|0;return d|0}if((a7(5265596)|0)==0){d=c[1313087]|0;return d|0}do{if(a[5265484]<<24>>24==0){if((a7(5265484)|0)==0){break}kb(5251088,0,168);aT(320,0,r|0)}}while(0);dW(5251088,5248096);dW(5251100,5248072);dW(5251112,5248036);dW(5251124,5248024);dW(5251136,5247972);dW(5251148,5247964);dW(5251160,5247940);dW(5251172,5247936);dW(5251184,5247932);dW(5251196,5247928);dW(5251208,5247924);dW(5251220,5247920);dW(5251232,5247916);dW(5251244,5247912);c[1313087]=5251088;d=c[1313087]|0;return d|0}function jk(b){b=b|0;var d=0;if(a[5265540]<<24>>24!=0){d=c[1313072]|0;return d|0}if((a7(5265540)|0)==0){d=c[1313072]|0;return d|0}do{if(a[5265460]<<24>>24==0){if((a7(5265460)|0)==0){break}kb(5250344,0,168);aT(530,0,r|0)}}while(0);d2(5250344,5248468,bm(5248468)|0);d2(5250356,5248440,bm(5248440)|0);d2(5250368,5248408,bm(5248408)|0);d2(5250380,5248368,bm(5248368)|0);d2(5250392,5248332,bm(5248332)|0);d2(5250404,5248304,bm(5248304)|0);d2(5250416,5248268,bm(5248268)|0);d2(5250428,5248232,bm(5248232)|0);d2(5250440,5248216,bm(5248216)|0);d2(5250452,5248200,bm(5248200)|0);d2(5250464,5248184,bm(5248184)|0);d2(5250476,5248168,bm(5248168)|0);d2(5250488,5248152,bm(5248152)|0);d2(5250500,5248136,bm(5248136)|0);c[1313072]=5250344;d=c[1313072]|0;return d|0}function jl(b){b=b|0;var d=0;if(a[5265588]<<24>>24!=0){d=c[1313086]|0;return d|0}if((a7(5265588)|0)==0){d=c[1313086]|0;return d|0}do{if(a[5265476]<<24>>24==0){if((a7(5265476)|0)==0){break}kb(5250800,0,288);aT(414,0,r|0)}}while(0);dW(5250800,5248764);dW(5250812,5248724);dW(5250824,5248716);dW(5250836,5248708);dW(5250848,5248704);dW(5250860,5248696);dW(5250872,5248688);dW(5250884,5248644);dW(5250896,5248632);dW(5250908,5248624);dW(5250920,5248612);dW(5250932,5248572);dW(5250944,5248564);dW(5250956,5248560);dW(5250968,5248556);dW(5250980,5248552);dW(5250992,5248704);dW(5251004,5248548);dW(5251016,5248544);dW(5251028,5248540);dW(5251040,5248536);dW(5251052,5248532);dW(5251064,5248500);dW(5251076,5248496);c[1313086]=5250800;d=c[1313086]|0;return d|0}function jm(b){b=b|0;var d=0;if(a[5265532]<<24>>24!=0){d=c[1313071]|0;return d|0}if((a7(5265532)|0)==0){d=c[1313071]|0;return d|0}do{if(a[5265452]<<24>>24==0){if((a7(5265452)|0)==0){break}kb(5250056,0,288);aT(454,0,r|0)}}while(0);d2(5250056,5244144,bm(5244144)|0);d2(5250068,5244084,bm(5244084)|0);d2(5250080,5244040,bm(5244040)|0);d2(5250092,5244004,bm(5244004)|0);d2(5250104,5248884,bm(5248884)|0);d2(5250116,5243964,bm(5243964)|0);d2(5250128,5243884,bm(5243884)|0);d2(5250140,5243792,bm(5243792)|0);d2(5250152,5243700,bm(5243700)|0);d2(5250164,5243668,bm(5243668)|0);d2(5250176,5243632,bm(5243632)|0);d2(5250188,5243596,bm(5243596)|0);d2(5250200,5243524,bm(5243524)|0);d2(5250212,5243504,bm(5243504)|0);d2(5250224,5243484,bm(5243484)|0);d2(5250236,5243468,bm(5243468)|0);d2(5250248,5248884,bm(5248884)|0);d2(5250260,5248868,bm(5248868)|0);d2(5250272,5248852,bm(5248852)|0);d2(5250284,5248836,bm(5248836)|0);d2(5250296,5248820,bm(5248820)|0);d2(5250308,5248804,bm(5248804)|0);d2(5250320,5248788,bm(5248788)|0);d2(5250332,5248772,bm(5248772)|0);c[1313071]=5250056;d=c[1313071]|0;return d|0}function jn(b){b=b|0;var d=0;if(a[5265604]<<24>>24!=0){d=c[1313088]|0;return d|0}if((a7(5265604)|0)==0){d=c[1313088]|0;return d|0}do{if(a[5265492]<<24>>24==0){if((a7(5265492)|0)==0){break}kb(5251256,0,288);aT(456,0,r|0)}}while(0);dW(5251256,5244320);dW(5251268,5244216);c[1313088]=5251256;d=c[1313088]|0;return d|0}function jo(b){b=b|0;var d=0;if(a[5265548]<<24>>24!=0){d=c[1313073]|0;return d|0}if((a7(5265548)|0)==0){d=c[1313073]|0;return d|0}do{if(a[5265468]<<24>>24==0){if((a7(5265468)|0)==0){break}kb(5250512,0,288);aT(724,0,r|0)}}while(0);d2(5250512,5244492,bm(5244492)|0);d2(5250524,5244444,bm(5244444)|0);c[1313073]=5250512;d=c[1313073]|0;return d|0}function jp(b){b=b|0;var c=0;if(a[5265612]<<24>>24!=0){return 5252356}if((a7(5265612)|0)==0){return 5252356}a[5252356]=16;b=5252357;c=b|0;x=623865125;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;c=b+4|0;x=2032480100;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;a[5252365]=0;aT(762,5252356,r|0);return 5252356}function jq(b){b=b|0;var c=0;if(a[5265636]<<24>>24!=0){return 5252392}if((a7(5265636)|0)==0){return 5252392}a[5252392]=16;b=5252393;c=b|0;x=624576549;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;c=b+4|0;x=1394948685;a[c]=x&255;x=x>>8;a[c+1|0]=x&255;x=x>>8;a[c+2|0]=x&255;x=x>>8;a[c+3|0]=x&255;a[5252401]=0;aT(762,5252392,r|0);return 5252392}function jr(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=bm(5246064)|0;if(d>>>0>1073741822){dZ()}if(d>>>0<2){a[b]=d<<1&255;e=b+4|0;f=bJ(e|0,5246064,d|0)|0;g=e+(d<<2)|0;c[g>>2]=0;return}h=d+4&-4;i=h<<2;j=(i|0)==0?1:i;while(1){k=j$(j)|0;if((k|0)!=0){l=1302;break}i=(D=c[1316362]|0,c[1316362]=D+0,D);if((i|0)==0){l=1299;break}b7[i&1023]()}if((l|0)==1302){j=k;c[b+8>>2]=j;c[b>>2]=h|1;c[b+4>>2]=d;e=j;f=bJ(e|0,5246064,d|0)|0;g=e+(d<<2)|0;c[g>>2]=0;return}else if((l|0)==1299){l=bO(4)|0;c[l>>2]=5257468;bg(l|0,5262716,348)}}function js(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;if(a[5265556]<<24>>24!=0){return 5252296}if((a7(5265556)|0)==0){return 5252296}b=bm(5245820)|0;if(b>>>0>1073741822){dZ()}do{if(b>>>0<2){a[5252296]=b<<1&255;d=5252300}else{e=b+4&-4;f=e<<2;g=(f|0)==0?1:f;while(1){h=j$(g)|0;if((h|0)!=0){i=1325;break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){break}b7[f&1023]()}if((i|0)==1325){g=h;c[1313076]=g;c[1313074]=e|1;c[1313075]=b;d=g;break}g=bO(4)|0;c[g>>2]=5257468;bg(g|0,5262716,348)}}while(0);bJ(d|0,5245820,b|0);c[d+(b<<2)>>2]=0;aT(524,5252296,r|0);return 5252296}function jt(b){b=b|0;var d=0,e=0;b=5250800;while(1){d=b-12|0;do{if((a[d]&1)<<24>>24!=0){e=c[b-12+8>>2]|0;if((e|0)==0){break}j0(e)}}while(0);if((d|0)==5250512){break}else{b=d}}return}function ju(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;if(a[5265580]<<24>>24!=0){return 5252332}if((a7(5265580)|0)==0){return 5252332}b=bm(5245700)|0;if(b>>>0>1073741822){dZ()}do{if(b>>>0<2){a[5252332]=b<<1&255;d=5252336}else{e=b+4&-4;f=e<<2;g=(f|0)==0?1:f;while(1){h=j$(g)|0;if((h|0)!=0){i=1359;break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){break}b7[f&1023]()}if((i|0)==1359){g=h;c[1313085]=g;c[1313083]=e|1;c[1313084]=b;d=g;break}g=bO(4)|0;c[g>>2]=5257468;bg(g|0,5262716,348)}}while(0);bJ(d|0,5245700,b|0);c[d+(b<<2)>>2]=0;aT(524,5252332,r|0);return 5252332}function jv(b){b=b|0;var d=0,e=0;if(a[5265628]<<24>>24!=0){return 5252380}if((a7(5265628)|0)==0){return 5252380}while(1){d=j$(32)|0;if((d|0)!=0){e=1380;break}b=(D=c[1316362]|0,c[1316362]=D+0,D);if((b|0)==0){e=1378;break}b7[b&1023]()}if((e|0)==1380){c[1313097]=d;c[1313095]=33;c[1313096]=20;j9(d,5245652,20);a[d+20|0]=0;aT(762,5252380,r|0);return 5252380}else if((e|0)==1378){e=bO(4)|0;c[e>>2]=5257468;bg(e|0,5262716,348)}return 0}function jw(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;if(a[5265572]<<24>>24!=0){return 5252320}if((a7(5265572)|0)==0){return 5252320}b=bm(5245544)|0;if(b>>>0>1073741822){dZ()}do{if(b>>>0<2){a[5252320]=b<<1&255;d=5252324}else{e=b+4&-4;f=e<<2;g=(f|0)==0?1:f;while(1){h=j$(g)|0;if((h|0)!=0){i=1406;break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){break}b7[f&1023]()}if((i|0)==1406){g=h;c[1313082]=g;c[1313080]=e|1;c[1313081]=b;d=g;break}g=bO(4)|0;c[g>>2]=5257468;bg(g|0,5262716,348)}}while(0);bJ(d|0,5245544,b|0);c[d+(b<<2)>>2]=0;aT(524,5252320,r|0);return 5252320}function jx(b){b=b|0;var d=0,e=0;if(a[5265620]<<24>>24!=0){return 5252368}if((a7(5265620)|0)==0){return 5252368}while(1){d=j$(16)|0;if((d|0)!=0){e=1427;break}b=(D=c[1316362]|0,c[1316362]=D+0,D);if((b|0)==0){e=1425;break}b7[b&1023]()}if((e|0)==1427){c[1313094]=d;c[1313092]=17;c[1313093]=11;j9(d,5245492,11);a[d+11|0]=0;aT(762,5252368,r|0);return 5252368}else if((e|0)==1425){e=bO(4)|0;c[e>>2]=5257468;bg(e|0,5262716,348)}return 0}function jy(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;if(a[5265564]<<24>>24!=0){return 5252308}if((a7(5265564)|0)==0){return 5252308}b=bm(5245428)|0;if(b>>>0>1073741822){dZ()}do{if(b>>>0<2){a[5252308]=b<<1&255;d=5252312}else{e=b+4&-4;f=e<<2;g=(f|0)==0?1:f;while(1){h=j$(g)|0;if((h|0)!=0){i=1453;break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){break}b7[f&1023]()}if((i|0)==1453){g=h;c[1313079]=g;c[1313077]=e|1;c[1313078]=b;d=g;break}g=bO(4)|0;c[g>>2]=5257468;bg(g|0,5262716,348)}}while(0);bJ(d|0,5245428,b|0);c[d+(b<<2)>>2]=0;aT(524,5252308,r|0);return 5252308}function jz(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0;d=c[1312955]|0;e=c[1312956]|0;f=d;if(e-f>>2>>>0>=b>>>0){g=b;h=d;while(1){if((h|0)==0){i=0}else{c[h>>2]=0;i=c[1312955]|0}d=i+4|0;c[1312955]=d;j=g-1|0;if((j|0)==0){break}else{g=j;h=d}}return}h=c[1312954]|0;g=f-h>>2;f=g+b|0;if(f>>>0>1073741823){h_()}i=e-h|0;do{if(i>>2>>>0>536870910){k=0;l=5251828;m=1073741823;n=1473;break}else{h=i>>1;e=h>>>0<f>>>0?f:h;k=0;l=5251828;if((e|0)==0){o=0;p=0;break}if(!((a[5251940]&1)<<24>>24==0&e>>>0<29)){m=e;n=1473;break}a[5251940]=1;o=5251828;p=e;break}}while(0);do{if((n|0)==1473){f=m<<2;i=(f|0)==0?1:f;while(1){q=j$(i)|0;if((q|0)!=0){n=1484;break}f=(D=c[1316362]|0,c[1316362]=D+0,D);if((f|0)==0){break}b7[f&1023]()}if((n|0)==1484){o=q;p=m;break}i=bO(4)|0;c[i>>2]=5257468;bg(i|0,5262716,348)}}while(0);m=o+(g<<2)|0;k=o+(p<<2)|0;p=b;b=m;while(1){if((b|0)==0){r=0}else{c[b>>2]=0;r=b}s=r+4|0;g=p-1|0;if((g|0)==0){break}else{p=g;b=s}}b=c[1312955]|0;p=c[1312954]|0;L1560:do{if(p>>>0<b>>>0){r=b;g=o;q=m;n=s;L1561:while(1){i=r-4|0;do{if((q|0)==(g|0)){f=k;e=f;if(n>>>0<f>>>0){f=n;h=((e-f>>2)+1|0)/2&-1;d=f-q|0;f=n+(h-(d>>2)<<2)|0;ke(f,q,d);t=q;u=f;v=n+(h<<2)|0;break}h=e-q>>1;e=(h|0)==0?1:h;h=(e+3|0)>>>2;f=l;d=f+112|0;if((a[d]&1)<<24>>24==0&e>>>0<29){a[d]=1;w=f}else{j=e<<2;x=(j|0)==0?1:j;while(1){y=j$(x)|0;if((y|0)!=0){break}j=(D=c[1316362]|0,c[1316362]=D+0,D);if((j|0)==0){break L1561}b7[j&1023]()}w=y}x=w+(h<<2)|0;j=w+(e<<2)|0;L1577:do{if((q|0)==(n|0)){z=x}else{A=q;B=x;while(1){if((B|0)==0){C=0}else{c[B>>2]=c[A>>2]|0;C=B}E=C+4|0;F=A+4|0;if((F|0)==(n|0)){z=E;break L1577}else{A=F;B=E}}}}while(0);k=j;if((q|0)==0){t=w;u=x;v=z;break}if((q|0)==(f|0)){a[d]=0;t=w;u=x;v=z;break}else{j0(q);t=w;u=x;v=z;break}}else{t=g;u=q;v=n}}while(0);e=u-4|0;if((e|0)!=0){c[e>>2]=c[i>>2]|0}h=c[1312954]|0;if(h>>>0<i>>>0){r=i;g=t;q=e;n=v}else{G=h;H=v;I=e;break L1560}}n=bO(4)|0;c[n>>2]=5257468;bg(n|0,5262716,348)}else{G=p;H=s;I=m}}while(0);c[1312954]=I;c[1312955]=H;H=c[1312956]|0;c[1312956]=k;k=H;if((G|0)==0){return}H=l;if((G|0)==(H|0)){a[H+112|0]=0;return}else{j0(G);return}}function jA(a){a=a|0;return}function jB(a){a=a|0;return}function jC(a){a=a|0;return}function jD(a){a=a|0;return}function jE(a){a=a|0;return}function jF(){if(a[5265764]<<24>>24==0){c[1316441]=1;c[1316442]=0}if(a[5265756]<<24>>24==0){c[1316439]=1;c[1316440]=0}if(a[5265748]<<24>>24==0){c[1316437]=1;c[1316438]=0}if(a[5265740]<<24>>24==0){c[1316435]=1;c[1316436]=0}if(a[5265732]<<24>>24==0){c[1316433]=1;c[1316434]=0}if(a[5265724]<<24>>24==0){c[1316431]=1;c[1316432]=0}if(a[5265700]<<24>>24==0){c[1316425]=1;c[1316426]=0}if(a[5265692]<<24>>24==0){c[1316423]=1;c[1316424]=0}if(a[5265684]<<24>>24==0){c[1316421]=1;c[1316422]=0}if(a[5265676]<<24>>24==0){c[1316419]=1;c[1316420]=0}if(a[5265796]<<24>>24==0){c[1316449]=1;c[1316450]=0}if(a[5265788]<<24>>24==0){c[1316447]=1;c[1316448]=0}if(a[5265780]<<24>>24==0){c[1316445]=1;c[1316446]=0}if(a[5265772]<<24>>24==0){c[1316443]=1;c[1316444]=0}if(a[5265668]<<24>>24==0){c[1316417]=1;c[1316418]=0}if(a[5265660]<<24>>24==0){c[1316415]=1;c[1316416]=0}if(a[5265652]<<24>>24==0){c[1316413]=1;c[1316414]=0}if(a[5265644]<<24>>24==0){c[1316411]=1;c[1316412]=0}if(a[5265716]<<24>>24==0){c[1316429]=1;c[1316430]=0}if(a[5265708]<<24>>24!=0){return}c[1316427]=1;c[1316428]=0;return}function jG(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function jH(b){b=b|0;var d=0,e=0;b=5251544;while(1){d=b-12|0;do{if((a[d]&1)<<24>>24!=0){e=c[b-12+8>>2]|0;if((e|0)==0){break}j0(e)}}while(0);if((d|0)==5251256){break}else{b=d}}return}function jI(b){b=b|0;var d=0,e=0;b=5250344;while(1){d=b-12|0;do{if((a[d]&1)<<24>>24!=0){e=c[b-12+8>>2]|0;if((e|0)==0){break}j0(e)}}while(0);if((d|0)==5250056){break}else{b=d}}return}function jJ(b){b=b|0;var d=0,e=0;b=5251088;while(1){d=b-12|0;do{if((a[d]&1)<<24>>24!=0){e=c[b-12+8>>2]|0;if((e|0)==0){break}j0(e)}}while(0);if((d|0)==5250800){break}else{b=d}}return}function jK(b){b=b|0;do{if((a[5250500]&1)<<24>>24!=0){b=c[1312627]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250488]&1)<<24>>24!=0){b=c[1312624]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250476]&1)<<24>>24!=0){b=c[1312621]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250464]&1)<<24>>24!=0){b=c[1312618]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250452]&1)<<24>>24!=0){b=c[1312615]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250440]&1)<<24>>24!=0){b=c[1312612]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250428]&1)<<24>>24!=0){b=c[1312609]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250416]&1)<<24>>24!=0){b=c[1312606]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250404]&1)<<24>>24!=0){b=c[1312603]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250392]&1)<<24>>24!=0){b=c[1312600]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250380]&1)<<24>>24!=0){b=c[1312597]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250368]&1)<<24>>24!=0){b=c[1312594]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5250356]&1)<<24>>24!=0){b=c[1312591]|0;if((b|0)==0){break}j0(b)}}while(0);if((a[5250344]&1)<<24>>24==0){return}b=c[1312588]|0;if((b|0)==0){return}j0(b);return}function jL(b){b=b|0;do{if((a[5251244]&1)<<24>>24!=0){b=c[1312813]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251232]&1)<<24>>24!=0){b=c[1312810]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251220]&1)<<24>>24!=0){b=c[1312807]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251208]&1)<<24>>24!=0){b=c[1312804]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251196]&1)<<24>>24!=0){b=c[1312801]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251184]&1)<<24>>24!=0){b=c[1312798]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251172]&1)<<24>>24!=0){b=c[1312795]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251160]&1)<<24>>24!=0){b=c[1312792]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251148]&1)<<24>>24!=0){b=c[1312789]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251136]&1)<<24>>24!=0){b=c[1312786]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251124]&1)<<24>>24!=0){b=c[1312783]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251112]&1)<<24>>24!=0){b=c[1312780]|0;if((b|0)==0){break}j0(b)}}while(0);do{if((a[5251100]&1)<<24>>24!=0){b=c[1312777]|0;if((b|0)==0){break}j0(b)}}while(0);if((a[5251088]&1)<<24>>24==0){return}b=c[1312774]|0;if((b|0)==0){return}j0(b);return}function jM(a){a=a|0;if((a|0)==0){return}j0(a);return}function jN(a){a=a|0;if((a|0)==0){return}j0(a);return}function jO(a){a=a|0;if((a|0)==0){return}j0(a);return}function jP(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;e=i;i=i+112|0;f=e|0;g=e+56|0;if((a|0)==(b|0)){h=1;i=e;return h|0}if((b|0)==0){h=0;i=e;return h|0}j=b;k=c[b>>2]|0;b=j+(c[k-8>>2]|0)|0;l=c[k-4>>2]|0;k=l;c[f>>2]=5264144;c[f+4>>2]=j;c[f+8>>2]=5264156;c[f+12>>2]=-1;j=f+16|0;m=f+20|0;n=f+24|0;o=f+28|0;p=f+32|0;q=f+40|0;kb(j|0,0,39);do{if((l|0)==5264144){c[f+48>>2]=1;cb[c[(c[1316036]|0)+20>>2]&1023](k,f,b,b,1,0);r=(c[n>>2]|0)==1?b:0}else{b_[c[(c[l>>2]|0)+24>>2]&1023](k,f,b,1,0);s=c[f+36>>2]|0;if((s|0)==0){if((c[q>>2]|0)!=1){r=0;break}if((c[o>>2]|0)!=1){r=0;break}r=(c[p>>2]|0)==1?c[m>>2]|0:0;break}else if((s|0)!=1){r=0;break}if((c[n>>2]|0)!=1){if((c[q>>2]|0)!=0){r=0;break}if((c[o>>2]|0)!=1){r=0;break}if((c[p>>2]|0)!=1){r=0;break}}r=c[j>>2]|0}}while(0);j=r;if((r|0)==0){h=0;i=e;return h|0}kb(g|0,0,56);c[g>>2]=j;c[g+8>>2]=a;c[g+12>>2]=-1;c[g+48>>2]=1;ce[c[(c[r>>2]|0)+28>>2]&1023](j,g,c[d>>2]|0,1);if((c[g+24>>2]|0)!=1){h=0;i=e;return h|0}c[d>>2]=c[g+16>>2]|0;h=1;i=e;return h|0}function jQ(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}g=d+28|0;if((c[g>>2]|0)==1){return}c[g>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;b=d+40|0;c[b>>2]=(c[b>>2]|0)+1|0;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function jR(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;ce[c[(c[g>>2]|0)+28>>2]&1023](g,d,e,f);return}g=d+16|0;b=c[g>>2]|0;if((b|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function jS(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;if((b|0)==(c[d+8>>2]|0)){g=d+16|0;h=c[g>>2]|0;if((h|0)==0){c[g>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((h|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1|0;c[d+24>>2]=2;a[d+54|0]=1;return}h=d+24|0;if((c[h>>2]|0)!=2){return}c[h>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)==0){k=j}else{k=c[(c[e>>2]|0)+j>>2]|0}j=c[b+16>>2]|0;ce[c[(c[j>>2]|0)+28>>2]&1023](j,d,e+k|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}h=d+54|0;i=e;k=b+24|0;while(1){b=c[k+4>>2]|0;j=b>>8;if((b&1|0)==0){l=j}else{l=c[(c[i>>2]|0)+j>>2]|0}j=c[k>>2]|0;ce[c[(c[j>>2]|0)+28>>2]&1023](j,d,e+l|0,(b&2|0)!=0?f:2);if((a[h]&1)<<24>>24!=0){m=1792;break}b=k+8|0;if(b>>>0<g>>>0){k=b}else{m=1797;break}}if((m|0)==1792){return}else if((m|0)==1797){return}}
function jT(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=c[b+12>>2]|0;k=b+16+(j<<3)|0;L1967:do{if((j|0)>0){l=d+52|0;m=d+53|0;n=d+54|0;o=b+8|0;p=d+24|0;q=e;r=0;s=b+16|0;t=0;L1969:while(1){a[l]=0;a[m]=0;u=c[s+4>>2]|0;v=u>>8;if((u&1|0)==0){w=v}else{w=c[(c[q>>2]|0)+v>>2]|0}v=c[s>>2]|0;cb[c[(c[v>>2]|0)+20>>2]&1023](v,d,e,e+w|0,2-(u>>>1&1)|0,g);if((a[n]&1)<<24>>24!=0){x=t;y=r;break}do{if((a[m]&1)<<24>>24==0){z=t;A=r}else{if((a[l]&1)<<24>>24==0){if((c[o>>2]&1|0)==0){x=1;y=r;break L1969}else{z=1;A=r;break}}if((c[p>>2]|0)==1){break L1967}if((c[o>>2]&2|0)==0){break L1967}else{z=1;A=1}}}while(0);u=s+8|0;if(u>>>0<k>>>0){r=A;s=u;t=z}else{x=z;y=A;break}}if((y&1)<<24>>24==0){B=x;C=1821;break}else{D=x;C=1824;break}}else{B=0;C=1821}}while(0);do{if((C|0)==1821){c[h>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1|0;if((c[d+36>>2]|0)!=1){D=B;C=1824;break}if((c[d+24>>2]|0)!=2){D=B;C=1824;break}a[d+54|0]=1;D=B;C=1824;break}}while(0);do{if((C|0)==1824){if((D&1)<<24>>24!=0){break}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}D=c[b+12>>2]|0;B=b+16+(D<<3)|0;x=c[b+20>>2]|0;y=x>>8;if((x&1|0)==0){E=y}else{E=c[(c[e>>2]|0)+y>>2]|0}y=c[b+16>>2]|0;b_[c[(c[y>>2]|0)+24>>2]&1023](y,d,e+E|0,(x&2|0)!=0?f:2,g);x=b+24|0;if((D|0)<=1){return}D=c[b+8>>2]|0;do{if((D&2|0)==0){b=d+36|0;if((c[b>>2]|0)==1){break}if((D&1|0)==0){E=d+54|0;y=e;A=x;while(1){if((a[E]&1)<<24>>24!=0){C=1853;break}if((c[b>>2]|0)==1){C=1854;break}z=c[A+4>>2]|0;w=z>>8;if((z&1|0)==0){F=w}else{F=c[(c[y>>2]|0)+w>>2]|0}w=c[A>>2]|0;b_[c[(c[w>>2]|0)+24>>2]&1023](w,d,e+F|0,(z&2|0)!=0?f:2,g);z=A+8|0;if(z>>>0<B>>>0){A=z}else{C=1856;break}}if((C|0)==1853){return}else if((C|0)==1854){return}else if((C|0)==1856){return}}A=d+24|0;y=d+54|0;E=e;i=x;while(1){if((a[y]&1)<<24>>24!=0){C=1860;break}if((c[b>>2]|0)==1){if((c[A>>2]|0)==1){C=1861;break}}z=c[i+4>>2]|0;w=z>>8;if((z&1|0)==0){G=w}else{G=c[(c[E>>2]|0)+w>>2]|0}w=c[i>>2]|0;b_[c[(c[w>>2]|0)+24>>2]&1023](w,d,e+G|0,(z&2|0)!=0?f:2,g);z=i+8|0;if(z>>>0<B>>>0){i=z}else{C=1852;break}}if((C|0)==1852){return}else if((C|0)==1860){return}else if((C|0)==1861){return}}}while(0);G=d+54|0;F=e;D=x;while(1){if((a[G]&1)<<24>>24!=0){C=1857;break}x=c[D+4>>2]|0;i=x>>8;if((x&1|0)==0){H=i}else{H=c[(c[F>>2]|0)+i>>2]|0}i=c[D>>2]|0;b_[c[(c[i>>2]|0)+24>>2]&1023](i,d,e+H|0,(x&2|0)!=0?f:2,g);x=D+8|0;if(x>>>0<B>>>0){D=x}else{C=1855;break}}if((C|0)==1855){return}else if((C|0)==1857){return}}function jU(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;h=b|0;if((h|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}i=d+28|0;if((c[i>>2]|0)==1){return}c[i>>2]=f;return}if((h|0)!=(c[d>>2]|0)){h=c[b+8>>2]|0;b_[c[(c[h>>2]|0)+24>>2]&1023](h,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){h=d+20|0;if((c[h>>2]|0)==(e|0)){break}c[d+32>>2]=f;i=d+44|0;if((c[i>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;l=c[b+8>>2]|0;cb[c[(c[l>>2]|0)+20>>2]&1023](l,d,e,e,1,g);do{if((a[k]&1)<<24>>24==0){m=0;n=1881}else{if((a[j]&1)<<24>>24==0){m=1;n=1881;break}else{break}}}while(0);L2068:do{if((n|0)==1881){c[h>>2]=e;j=d+40|0;c[j>>2]=(c[j>>2]|0)+1|0;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){n=1884;break}a[d+54|0]=1;if(m){break L2068}else{break}}else{n=1884}}while(0);if((n|0)==1884){if(m){break}}c[i>>2]=4;return}}while(0);c[i>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function jV(a){a=a|0;return}function jW(a){a=a|0;return 5247612}function jX(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g;i=g}else{i=b}if(!((c[d+48>>2]|0)==1&(i|0)==1)){return}a[d+54|0]=1;return}function jY(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((b|0)!=(c[d+8>>2]|0)){i=d+52|0;j=a[i]&1;k=d+53|0;l=a[k]&1;m=c[b+12>>2]|0;n=b+16+(m<<3)|0;a[i]=0;a[k]=0;o=c[b+20>>2]|0;p=o>>8;if((o&1|0)==0){q=p}else{q=c[(c[f>>2]|0)+p>>2]|0}p=c[b+16>>2]|0;cb[c[(c[p>>2]|0)+20>>2]&1023](p,d,e,f+q|0,(o&2|0)!=0?g:2,h);L2117:do{if((m|0)>1){o=d+24|0;q=b+8|0;p=d+54|0;r=f;s=b+24|0;while(1){if((a[p]&1)<<24>>24!=0){break L2117}do{if((a[i]&1)<<24>>24==0){if((a[k]&1)<<24>>24==0){break}if((c[q>>2]&1|0)==0){break L2117}}else{if((c[o>>2]|0)==1){break L2117}if((c[q>>2]&2|0)==0){break L2117}}}while(0);a[i]=0;a[k]=0;t=c[s+4>>2]|0;u=t>>8;if((t&1|0)==0){v=u}else{v=c[(c[r>>2]|0)+u>>2]|0}u=c[s>>2]|0;cb[c[(c[u>>2]|0)+20>>2]&1023](u,d,e,f+v|0,(t&2|0)!=0?g:2,h);t=s+8|0;if(t>>>0<n>>>0){s=t}else{break L2117}}}}while(0);a[i]=j;a[k]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;l=c[f>>2]|0;if((l|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((l|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;a[d+54|0]=1;return}e=d+24|0;l=c[e>>2]|0;if((l|0)==2){c[e>>2]=g;w=g}else{w=l}if(!((c[d+48>>2]|0)==1&(w|0)==1)){return}a[d+54|0]=1;return}function jZ(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0;if((b|0)!=(c[d+8>>2]|0)){i=c[b+8>>2]|0;cb[c[(c[i>>2]|0)+20>>2]&1023](i,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;h=c[f>>2]|0;if((h|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((h|0)!=(e|0)){e=d+36|0;c[e>>2]=(c[e>>2]|0)+1|0;a[d+54|0]=1;return}e=d+24|0;h=c[e>>2]|0;if((h|0)==2){c[e>>2]=g;j=g}else{j=h}if(!((c[d+48>>2]|0)==1&(j|0)==1)){return}a[d+54|0]=1;return}function j_(a){a=a|0;if((a|0)==0){return}j0(a);return}function j$(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,aw=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[1312236]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=5248984+(h<<2)|0;j=5248984+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[1312236]=e&(1<<g^-1)}else{if(l>>>0<(c[1312240]|0)>>>0){bE();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{bE();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[1312238]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=5248984+(p<<2)|0;m=5248984+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[1312236]=e&(1<<r^-1)}else{if(l>>>0<(c[1312240]|0)>>>0){bE();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{bE();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[1312238]|0;if((l|0)!=0){q=c[1312241]|0;d=l>>>3;l=d<<1;f=5248984+(l<<2)|0;k=c[1312236]|0;h=1<<d;do{if((k&h|0)==0){c[1312236]=k|h;s=f;t=5248984+(l+2<<2)|0}else{d=5248984+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[1312240]|0)>>>0){s=g;t=d;break}bE();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[1312238]=m;c[1312241]=e;n=i;return n|0}l=c[1312237]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[5249248+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[1312240]|0;if(r>>>0<i>>>0){bE();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){bE();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;L2365:do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;do{if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break L2365}else{w=l;x=k;break}}else{w=g;x=q}}while(0);while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){bE();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){bE();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){bE();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{bE();return 0}}}while(0);L2387:do{if((e|0)!=0){f=d+28|0;i=5249248+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[1312237]=c[1312237]&(1<<c[f>>2]^-1);break L2387}else{if(e>>>0<(c[1312240]|0)>>>0){bE();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L2387}}}while(0);if(v>>>0<(c[1312240]|0)>>>0){bE();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4|0)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b|0)>>2]=p;f=c[1312238]|0;if((f|0)!=0){e=c[1312241]|0;i=f>>>3;f=i<<1;q=5248984+(f<<2)|0;k=c[1312236]|0;g=1<<i;do{if((k&g|0)==0){c[1312236]=k|g;y=q;z=5248984+(f+2<<2)|0}else{i=5248984+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[1312240]|0)>>>0){y=l;z=i;break}bE();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[1312238]=p;c[1312241]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[1312237]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=(14-(h|f|l)|0)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[5249248+(A<<2)>>2]|0;L2195:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L2195}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break L2195}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[5249248+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}L2210:do{if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break L2210}else{p=r;m=i;q=e}}}}while(0);if((K|0)==0){o=g;break}if(J>>>0>=((c[1312238]|0)-g|0)>>>0){o=g;break}k=K;q=c[1312240]|0;if(k>>>0<q>>>0){bE();return 0}m=k+g|0;p=m;if(k>>>0>=m>>>0){bE();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;L2223:do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;do{if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break L2223}else{M=B;N=j;break}}else{M=d;N=r}}while(0);while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<q>>>0){bE();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<q>>>0){bE();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){bE();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{bE();return 0}}}while(0);L2245:do{if((e|0)!=0){i=K+28|0;q=5249248+(c[i>>2]<<2)|0;do{if((K|0)==(c[q>>2]|0)){c[q>>2]=L;if((L|0)!=0){break}c[1312237]=c[1312237]&(1<<c[i>>2]^-1);break L2245}else{if(e>>>0<(c[1312240]|0)>>>0){bE();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L2245}}}while(0);if(L>>>0<(c[1312240]|0)>>>0){bE();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=k+(e+4|0)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[k+(g|4)>>2]=J|1;c[k+(J+g|0)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;q=5248984+(e<<2)|0;r=c[1312236]|0;j=1<<i;do{if((r&j|0)==0){c[1312236]=r|j;O=q;P=5248984+(e+2<<2)|0}else{i=5248984+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[1312240]|0)>>>0){O=d;P=i;break}bE();return 0}}while(0);c[P>>2]=p;c[O+12>>2]=p;c[k+(g+8|0)>>2]=O;c[k+(g+12|0)>>2]=q;break}e=m;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=(14-(d|r|i)|0)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=5249248+(Q<<2)|0;c[k+(g+28|0)>>2]=Q;c[k+(g+20|0)>>2]=0;c[k+(g+16|0)>>2]=0;q=c[1312237]|0;l=1<<Q;if((q&l|0)==0){c[1312237]=q|l;c[j>>2]=e;c[k+(g+24|0)>>2]=j;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;q=c[j>>2]|0;while(1){if((c[q+4>>2]&-8|0)==(J|0)){break}S=q+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=2127;break}else{l=l<<1;q=j}}if((T|0)==2127){if(S>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[S>>2]=e;c[k+(g+24|0)>>2]=q;c[k+(g+12|0)>>2]=e;c[k+(g+8|0)>>2]=e;break}}l=q+8|0;j=c[l>>2]|0;i=c[1312240]|0;if(q>>>0<i>>>0){bE();return 0}if(j>>>0<i>>>0){bE();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[k+(g+8|0)>>2]=j;c[k+(g+12|0)>>2]=q;c[k+(g+24|0)>>2]=0;break}}}while(0);k=K+8|0;if((k|0)==0){o=g;break}else{n=k}return n|0}}while(0);K=c[1312238]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[1312241]|0;if(S>>>0>15){R=J;c[1312241]=R+o|0;c[1312238]=S;c[R+(o+4|0)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[1312238]=0;c[1312241]=0;c[J+4>>2]=K|3;S=J+(K+4|0)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[1312239]|0;if(o>>>0<J>>>0){S=J-o|0;c[1312239]=S;J=c[1312242]|0;K=J;c[1312242]=K+o|0;c[K+(o+4|0)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[1310791]|0)==0){J=bC(8)|0;if((J-1&J|0)==0){c[1310793]=J;c[1310792]=J;c[1310794]=-1;c[1310795]=2097152;c[1310796]=0;c[1312347]=0;c[1310791]=bV(0)&-16^1431655768;break}else{bE();return 0}}}while(0);J=o+48|0;S=c[1310793]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[1312346]|0;do{if((O|0)!=0){P=c[1312344]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L2454:do{if((c[1312347]&4|0)==0){O=c[1312242]|0;L2456:do{if((O|0)==0){T=2157}else{L=O;P=5249392;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=2157;break L2456}else{P=M}}if((P|0)==0){T=2157;break}L=R-(c[1312239]|0)&Q;if(L>>>0>=2147483647){W=0;break}q=bt(L|0)|0;e=(q|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?q:-1;Y=e?L:0;Z=q;_=L;T=2166;break}}while(0);do{if((T|0)==2157){O=bt(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[1310792]|0;q=L-1|0;if((q&g|0)==0){$=S}else{$=(S-g|0)+(q+g&-L)|0}L=c[1312344]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}q=c[1312346]|0;if((q|0)!=0){if(g>>>0<=L>>>0|g>>>0>q>>>0){W=0;break}}q=bt($|0)|0;g=(q|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=q;_=$;T=2166;break}}while(0);L2476:do{if((T|0)==2166){q=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=2177;break L2454}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[1310793]|0;O=(K-_|0)+g&-g;if(O>>>0>=2147483647){ac=_;break}if((bt(O|0)|0)==-1){bt(q|0);W=Y;break L2476}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=2177;break L2454}}}while(0);c[1312347]=c[1312347]|4;ad=W;T=2174;break}else{ad=0;T=2174}}while(0);do{if((T|0)==2174){if(S>>>0>=2147483647){break}W=bt(S|0)|0;Z=bt(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)==-1){break}else{aa=Z?ac:ad;ab=Y;T=2177;break}}}while(0);do{if((T|0)==2177){ad=(c[1312344]|0)+aa|0;c[1312344]=ad;if(ad>>>0>(c[1312345]|0)>>>0){c[1312345]=ad}ad=c[1312242]|0;L2496:do{if((ad|0)==0){S=c[1312240]|0;if((S|0)==0|ab>>>0<S>>>0){c[1312240]=ab}c[1312348]=ab;c[1312349]=aa;c[1312351]=0;c[1312245]=c[1310791]|0;c[1312244]=-1;S=0;while(1){Y=S<<1;ac=5248984+(Y<<2)|0;c[5248984+(Y+3<<2)>>2]=ac;c[5248984+(Y+2<<2)>>2]=ac;ac=S+1|0;if((ac|0)==32){break}else{S=ac}}S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=(aa-40|0)-ae|0;c[1312242]=ab+ae|0;c[1312239]=S;c[ab+(ae+4|0)>>2]=S|1;c[ab+(aa-36|0)>>2]=40;c[1312243]=c[1310795]|0}else{S=5249392;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=2189;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==2189){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa|0;ac=c[1312242]|0;Y=(c[1312239]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[1312242]=Z+ai|0;c[1312239]=W;c[Z+(ai+4|0)>>2]=W|1;c[Z+(Y+4|0)>>2]=40;c[1312243]=c[1310795]|0;break L2496}}while(0);if(ab>>>0<(c[1312240]|0)>>>0){c[1312240]=ab}S=ab+aa|0;Y=5249392;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=2199;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==2199){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa|0;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8|0)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa|0)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=(S-(ab+ak|0)|0)-o|0;c[ab+(ak+4|0)>>2]=o|3;do{if((Z|0)==(c[1312242]|0)){J=(c[1312239]|0)+K|0;c[1312239]=J;c[1312242]=_;c[ab+(W+4|0)>>2]=J|1}else{if((Z|0)==(c[1312241]|0)){J=(c[1312238]|0)+K|0;c[1312238]=J;c[1312241]=_;c[ab+(W+4|0)>>2]=J|1;c[ab+(J+W|0)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al|0)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L2541:do{if(X>>>0<256){U=c[ab+((al|8)+aa|0)>>2]|0;Q=c[ab+((aa+12|0)+al|0)>>2]|0;R=5248984+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[1312240]|0)>>>0){bE();return 0}if((c[U+12>>2]|0)==(Z|0)){break}bE();return 0}}while(0);if((Q|0)==(U|0)){c[1312236]=c[1312236]&(1<<V^-1);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[1312240]|0)>>>0){bE();return 0}q=Q+8|0;if((c[q>>2]|0)==(Z|0)){am=q;break}bE();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;q=c[ab+((al|24)+aa|0)>>2]|0;P=c[ab+((aa+12|0)+al|0)>>2]|0;L2562:do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O|0)|0;L=c[g>>2]|0;do{if((L|0)==0){e=ab+(O+aa|0)|0;M=c[e>>2]|0;if((M|0)==0){an=0;break L2562}else{ao=M;ap=e;break}}else{ao=L;ap=g}}while(0);while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa|0)>>2]|0;if(g>>>0<(c[1312240]|0)>>>0){bE();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){bE();return 0}O=P+8|0;if((c[O>>2]|0)==(R|0)){c[L>>2]=P;c[O>>2]=g;an=P;break}else{bE();return 0}}}while(0);if((q|0)==0){break}P=ab+((aa+28|0)+al|0)|0;U=5249248+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[1312237]=c[1312237]&(1<<c[P>>2]^-1);break L2541}else{if(q>>>0<(c[1312240]|0)>>>0){bE();return 0}Q=q+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[q+20>>2]=an}if((an|0)==0){break L2541}}}while(0);if(an>>>0<(c[1312240]|0)>>>0){bE();return 0}c[an+24>>2]=q;R=al|16;P=c[ab+(R+aa|0)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R|0)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa|0)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4|0)>>2]=ar|1;c[ab+(ar+W|0)>>2]=ar;J=ar>>>3;if(ar>>>0<256){V=J<<1;X=5248984+(V<<2)|0;P=c[1312236]|0;q=1<<J;do{if((P&q|0)==0){c[1312236]=P|q;as=X;at=5248984+(V+2<<2)|0}else{J=5248984+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[1312240]|0)>>>0){as=U;at=J;break}bE();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8|0)>>2]=as;c[ab+(W+12|0)>>2]=X;break}V=ac;q=ar>>>8;do{if((q|0)==0){au=0}else{if(ar>>>0>16777215){au=31;break}P=(q+1048320|0)>>>16&8;$=q<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=(14-(J|P|$)|0)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5249248+(au<<2)|0;c[ab+(W+28|0)>>2]=au;c[ab+(W+20|0)>>2]=0;c[ab+(W+16|0)>>2]=0;X=c[1312237]|0;Q=1<<au;if((X&Q|0)==0){c[1312237]=X|Q;c[q>>2]=V;c[ab+(W+24|0)>>2]=q;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[q>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}aw=X+16+(Q>>>31<<2)|0;q=c[aw>>2]|0;if((q|0)==0){T=2272;break}else{Q=Q<<1;X=q}}if((T|0)==2272){if(aw>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[aw>>2]=V;c[ab+(W+24|0)>>2]=X;c[ab+(W+12|0)>>2]=V;c[ab+(W+8|0)>>2]=V;break}}Q=X+8|0;q=c[Q>>2]|0;$=c[1312240]|0;if(X>>>0<$>>>0){bE();return 0}if(q>>>0<$>>>0){bE();return 0}else{c[q+12>>2]=V;c[Q>>2]=V;c[ab+(W+8|0)>>2]=q;c[ab+(W+12|0)>>2]=X;c[ab+(W+24|0)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=5249392;while(1){ax=c[W>>2]|0;if(ax>>>0<=Y>>>0){ay=c[W+4>>2]|0;az=ax+ay|0;if(az>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ax+(ay-39|0)|0;if((W&7|0)==0){aA=0}else{aA=-W&7}W=ax+((ay-47|0)+aA|0)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aB=0}else{aB=-_&7}_=(aa-40|0)-aB|0;c[1312242]=ab+aB|0;c[1312239]=_;c[ab+(aB+4|0)>>2]=_|1;c[ab+(aa-36|0)>>2]=40;c[1312243]=c[1310795]|0;c[ac+4>>2]=27;c[W>>2]=c[1312348]|0;c[W+4>>2]=c[5249396>>2]|0;c[W+8>>2]=c[5249400>>2]|0;c[W+12>>2]=c[5249404>>2]|0;c[1312348]=ab;c[1312349]=aa;c[1312351]=0;c[1312350]=W;W=ac+28|0;c[W>>2]=7;L2660:do{if((ac+32|0)>>>0<az>>>0){_=W;while(1){K=_+4|0;c[K>>2]=7;if((_+8|0)>>>0<az>>>0){_=K}else{break L2660}}}}while(0);if((ac|0)==(Y|0)){break}W=ac-ad|0;_=Y+(W+4|0)|0;c[_>>2]=c[_>>2]&-2;c[ad+4>>2]=W|1;c[Y+W>>2]=W;_=W>>>3;if(W>>>0<256){K=_<<1;Z=5248984+(K<<2)|0;S=c[1312236]|0;q=1<<_;do{if((S&q|0)==0){c[1312236]=S|q;aC=Z;aD=5248984+(K+2<<2)|0}else{_=5248984+(K+2<<2)|0;Q=c[_>>2]|0;if(Q>>>0>=(c[1312240]|0)>>>0){aC=Q;aD=_;break}bE();return 0}}while(0);c[aD>>2]=ad;c[aC+12>>2]=ad;c[ad+8>>2]=aC;c[ad+12>>2]=Z;break}K=ad;q=W>>>8;do{if((q|0)==0){aE=0}else{if(W>>>0>16777215){aE=31;break}S=(q+1048320|0)>>>16&8;Y=q<<S;ac=(Y+520192|0)>>>16&4;_=Y<<ac;Y=(_+245760|0)>>>16&2;Q=(14-(ac|S|Y)|0)+(_<<Y>>>15)|0;aE=W>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);q=5249248+(aE<<2)|0;c[ad+28>>2]=aE;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[1312237]|0;Q=1<<aE;if((Z&Q|0)==0){c[1312237]=Z|Q;c[q>>2]=K;c[ad+24>>2]=q;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aE|0)==31){aF=0}else{aF=25-(aE>>>1)|0}Q=W<<aF;Z=c[q>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(W|0)){break}aG=Z+16+(Q>>>31<<2)|0;q=c[aG>>2]|0;if((q|0)==0){T=2307;break}else{Q=Q<<1;Z=q}}if((T|0)==2307){if(aG>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[aG>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;W=c[Q>>2]|0;q=c[1312240]|0;if(Z>>>0<q>>>0){bE();return 0}if(W>>>0<q>>>0){bE();return 0}else{c[W+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=W;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[1312239]|0;if(ad>>>0<=o>>>0){break}W=ad-o|0;c[1312239]=W;ad=c[1312242]|0;Q=ad;c[1312242]=Q+o|0;c[Q+(o+4|0)>>2]=W|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[bv()>>2]=12;n=0;return n|0}function j0(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[1312240]|0;if(b>>>0<e>>>0){bE()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){bE()}h=f&-8;i=a+(h-8|0)|0;j=i;L2713:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){bE()}if((n|0)==(c[1312241]|0)){p=a+(h-4|0)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[1312238]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4|0)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8|0)>>2]|0;s=c[a+(l+12|0)>>2]|0;t=5248984+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){bE()}if((c[k+12>>2]|0)==(n|0)){break}bE()}}while(0);if((s|0)==(k|0)){c[1312236]=c[1312236]&(1<<p^-1);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){bE()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}bE()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24|0)>>2]|0;v=c[a+(l+12|0)>>2]|0;L2747:do{if((v|0)==(t|0)){w=a+(l+20|0)|0;x=c[w>>2]|0;do{if((x|0)==0){y=a+(l+16|0)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break L2747}else{B=z;C=y;break}}else{B=x;C=w}}while(0);while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){bE()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8|0)>>2]|0;if(w>>>0<e>>>0){bE()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){bE()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{bE()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28|0)|0;m=5249248+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[1312237]=c[1312237]&(1<<c[v>>2]^-1);q=n;r=o;break L2713}else{if(p>>>0<(c[1312240]|0)>>>0){bE()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L2713}}}while(0);if(A>>>0<(c[1312240]|0)>>>0){bE()}c[A+24>>2]=p;t=c[a+(l+16|0)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1312240]|0)>>>0){bE()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20|0)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[1312240]|0)>>>0){bE()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){bE()}A=a+(h-4|0)|0;e=c[A>>2]|0;if((e&1|0)==0){bE()}do{if((e&2|0)==0){if((j|0)==(c[1312242]|0)){B=(c[1312239]|0)+r|0;c[1312239]=B;c[1312242]=q;c[q+4>>2]=B|1;if((q|0)==(c[1312241]|0)){c[1312241]=0;c[1312238]=0}if(B>>>0<=(c[1312243]|0)>>>0){return}do{if((c[1310791]|0)==0){B=bC(8)|0;if((B-1&B|0)==0){c[1310793]=B;c[1310792]=B;c[1310794]=-1;c[1310795]=2097152;c[1310796]=0;c[1312347]=0;c[1310791]=bV(0)&-16^1431655768;break}else{bE()}}}while(0);o=c[1312242]|0;if((o|0)==0){return}n=c[1312239]|0;do{if(n>>>0>40){l=c[1310793]|0;B=ab(((((n-41|0)+l|0)>>>0)/(l>>>0)>>>0)-1|0,l);C=o;u=5249392;while(1){g=c[u>>2]|0;if(g>>>0<=C>>>0){if((g+(c[u+4>>2]|0)|0)>>>0>C>>>0){D=u;break}}g=c[u+8>>2]|0;if((g|0)==0){D=0;break}else{u=g}}if((c[D+12>>2]&8|0)!=0){break}u=bt(0)|0;C=D+4|0;if((u|0)!=((c[D>>2]|0)+(c[C>>2]|0)|0)){break}g=bt(-(B>>>0>2147483646?-2147483648-l|0:B)|0)|0;b=bt(0)|0;if(!((g|0)!=-1&b>>>0<u>>>0)){break}g=u-b|0;if((u|0)==(b|0)){break}c[C>>2]=(c[C>>2]|0)-g|0;c[1312344]=(c[1312344]|0)-g|0;C=c[1312242]|0;b=(c[1312239]|0)-g|0;g=C;u=C+8|0;if((u&7|0)==0){E=0}else{E=-u&7}u=b-E|0;c[1312242]=g+E|0;c[1312239]=u;c[g+(E+4|0)>>2]=u|1;c[g+(b+4|0)>>2]=40;c[1312243]=c[1310795]|0;return}}while(0);if((c[1312239]|0)>>>0<=(c[1312243]|0)>>>0){return}c[1312243]=-1;return}if((j|0)==(c[1312241]|0)){o=(c[1312238]|0)+r|0;c[1312238]=o;c[1312241]=q;c[q+4>>2]=o|1;c[d+o>>2]=o;return}o=(e&-8)+r|0;n=e>>>3;L2847:do{if(e>>>0<256){b=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;u=5248984+(n<<1<<2)|0;do{if((b|0)!=(u|0)){if(b>>>0<(c[1312240]|0)>>>0){bE()}if((c[b+12>>2]|0)==(j|0)){break}bE()}}while(0);if((g|0)==(b|0)){c[1312236]=c[1312236]&(1<<n^-1);break}do{if((g|0)==(u|0)){F=g+8|0}else{if(g>>>0<(c[1312240]|0)>>>0){bE()}B=g+8|0;if((c[B>>2]|0)==(j|0)){F=B;break}bE()}}while(0);c[b+12>>2]=g;c[F>>2]=b}else{u=i;B=c[a+(h+16|0)>>2]|0;l=c[a+(h|4)>>2]|0;L2849:do{if((l|0)==(u|0)){C=a+(h+12|0)|0;f=c[C>>2]|0;do{if((f|0)==0){t=a+(h+8|0)|0;p=c[t>>2]|0;if((p|0)==0){G=0;break L2849}else{H=p;I=t;break}}else{H=f;I=C}}while(0);while(1){C=H+20|0;f=c[C>>2]|0;if((f|0)!=0){H=f;I=C;continue}C=H+16|0;f=c[C>>2]|0;if((f|0)==0){break}else{H=f;I=C}}if(I>>>0<(c[1312240]|0)>>>0){bE()}else{c[I>>2]=0;G=H;break}}else{C=c[a+h>>2]|0;if(C>>>0<(c[1312240]|0)>>>0){bE()}f=C+12|0;if((c[f>>2]|0)!=(u|0)){bE()}t=l+8|0;if((c[t>>2]|0)==(u|0)){c[f>>2]=l;c[t>>2]=C;G=l;break}else{bE()}}}while(0);if((B|0)==0){break}l=a+(h+20|0)|0;b=5249248+(c[l>>2]<<2)|0;do{if((u|0)==(c[b>>2]|0)){c[b>>2]=G;if((G|0)!=0){break}c[1312237]=c[1312237]&(1<<c[l>>2]^-1);break L2847}else{if(B>>>0<(c[1312240]|0)>>>0){bE()}g=B+16|0;if((c[g>>2]|0)==(u|0)){c[g>>2]=G}else{c[B+20>>2]=G}if((G|0)==0){break L2847}}}while(0);if(G>>>0<(c[1312240]|0)>>>0){bE()}c[G+24>>2]=B;u=c[a+(h+8|0)>>2]|0;do{if((u|0)!=0){if(u>>>0<(c[1312240]|0)>>>0){bE()}else{c[G+16>>2]=u;c[u+24>>2]=G;break}}}while(0);u=c[a+(h+12|0)>>2]|0;if((u|0)==0){break}if(u>>>0<(c[1312240]|0)>>>0){bE()}else{c[G+20>>2]=u;c[u+24>>2]=G;break}}}while(0);c[q+4>>2]=o|1;c[d+o>>2]=o;if((q|0)!=(c[1312241]|0)){J=o;break}c[1312238]=o;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;J=r}}while(0);r=J>>>3;if(J>>>0<256){d=r<<1;e=5248984+(d<<2)|0;A=c[1312236]|0;G=1<<r;do{if((A&G|0)==0){c[1312236]=A|G;K=e;L=5248984+(d+2<<2)|0}else{r=5248984+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[1312240]|0)>>>0){K=h;L=r;break}bE()}}while(0);c[L>>2]=q;c[K+12>>2]=q;c[q+8>>2]=K;c[q+12>>2]=e;return}e=q;K=J>>>8;do{if((K|0)==0){M=0}else{if(J>>>0>16777215){M=31;break}L=(K+1048320|0)>>>16&8;d=K<<L;G=(d+520192|0)>>>16&4;A=d<<G;d=(A+245760|0)>>>16&2;r=(14-(G|L|d)|0)+(A<<d>>>15)|0;M=J>>>((r+7|0)>>>0)&1|r<<1}}while(0);K=5249248+(M<<2)|0;c[q+28>>2]=M;c[q+20>>2]=0;c[q+16>>2]=0;r=c[1312237]|0;d=1<<M;do{if((r&d|0)==0){c[1312237]=r|d;c[K>>2]=e;c[q+24>>2]=K;c[q+12>>2]=q;c[q+8>>2]=q}else{if((M|0)==31){N=0}else{N=25-(M>>>1)|0}A=J<<N;L=c[K>>2]|0;while(1){if((c[L+4>>2]&-8|0)==(J|0)){break}O=L+16+(A>>>31<<2)|0;G=c[O>>2]|0;if((G|0)==0){P=2504;break}else{A=A<<1;L=G}}if((P|0)==2504){if(O>>>0<(c[1312240]|0)>>>0){bE()}else{c[O>>2]=e;c[q+24>>2]=L;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=L+8|0;o=c[A>>2]|0;G=c[1312240]|0;if(L>>>0<G>>>0){bE()}if(o>>>0<G>>>0){bE()}else{c[o+12>>2]=e;c[A>>2]=e;c[q+8>>2]=o;c[q+12>>2]=L;c[q+24>>2]=0;break}}}while(0);q=(c[1312244]|0)-1|0;c[1312244]=q;if((q|0)==0){Q=5249400}else{return}while(1){q=c[Q>>2]|0;if((q|0)==0){break}else{Q=q+8|0}}c[1312244]=-1;return}function j1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;if((a|0)==0){d=j$(b)|0;return d|0}if(b>>>0>4294967231){c[bv()>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=a-8|0;g=a-4|0;h=c[g>>2]|0;i=h&-8;j=i-8|0;k=a+j|0;l=k;m=c[1312240]|0;if(f>>>0<m>>>0){bE();return 0}n=h&3;if(!((n|0)!=1&(j|0)>-8)){bE();return 0}j=i|4;o=a+(j-8|0)|0;p=c[o>>2]|0;if((p&1|0)==0){bE();return 0}L2983:do{if((n|0)==0){if(e>>>0<256|i>>>0<(e|4)>>>0){break}if((i-e|0)>>>0>c[1310793]<<1>>>0|(f|0)==0){break}else{d=a}return d|0}else{do{if(i>>>0<e>>>0){if((l|0)==(c[1312242]|0)){q=(c[1312239]|0)+i|0;if(q>>>0<=e>>>0){break L2983}r=q-e|0;c[g>>2]=h&1|e|2;c[a+((e|4)-8|0)>>2]=r|1;c[1312242]=a+(e-8|0)|0;c[1312239]=r;break}if((l|0)==(c[1312241]|0)){r=(c[1312238]|0)+i|0;if(r>>>0<e>>>0){break L2983}q=r-e|0;if(q>>>0>15){c[g>>2]=h&1|e|2;c[a+((e|4)-8|0)>>2]=q|1;c[a+(r-8|0)>>2]=q;s=a+(r-4|0)|0;c[s>>2]=c[s>>2]&-2;t=a+(e-8|0)|0;u=q}else{c[g>>2]=h&1|r|2;q=a+(r-4|0)|0;c[q>>2]=c[q>>2]|1;t=0;u=0}c[1312238]=u;c[1312241]=t;break}if((p&2|0)!=0){break L2983}q=(p&-8)+i|0;if(q>>>0<e>>>0){break L2983}r=q-e|0;s=p>>>3;L3001:do{if(p>>>0<256){v=c[a+i>>2]|0;w=c[a+j>>2]|0;x=5248984+(s<<1<<2)|0;do{if((v|0)!=(x|0)){if(v>>>0<m>>>0){bE();return 0}if((c[v+12>>2]|0)==(l|0)){break}bE();return 0}}while(0);if((w|0)==(v|0)){c[1312236]=c[1312236]&(1<<s^-1);break}do{if((w|0)==(x|0)){y=w+8|0}else{if(w>>>0<m>>>0){bE();return 0}z=w+8|0;if((c[z>>2]|0)==(l|0)){y=z;break}bE();return 0}}while(0);c[v+12>>2]=w;c[y>>2]=v}else{x=k;z=c[a+(i+16|0)>>2]|0;A=c[a+j>>2]|0;L3022:do{if((A|0)==(x|0)){B=a+(i+12|0)|0;C=c[B>>2]|0;do{if((C|0)==0){D=a+(i+8|0)|0;E=c[D>>2]|0;if((E|0)==0){F=0;break L3022}else{G=E;H=D;break}}else{G=C;H=B}}while(0);while(1){B=G+20|0;C=c[B>>2]|0;if((C|0)!=0){G=C;H=B;continue}B=G+16|0;C=c[B>>2]|0;if((C|0)==0){break}else{G=C;H=B}}if(H>>>0<m>>>0){bE();return 0}else{c[H>>2]=0;F=G;break}}else{B=c[a+i>>2]|0;if(B>>>0<m>>>0){bE();return 0}C=B+12|0;if((c[C>>2]|0)!=(x|0)){bE();return 0}D=A+8|0;if((c[D>>2]|0)==(x|0)){c[C>>2]=A;c[D>>2]=B;F=A;break}else{bE();return 0}}}while(0);if((z|0)==0){break}A=a+(i+20|0)|0;v=5249248+(c[A>>2]<<2)|0;do{if((x|0)==(c[v>>2]|0)){c[v>>2]=F;if((F|0)!=0){break}c[1312237]=c[1312237]&(1<<c[A>>2]^-1);break L3001}else{if(z>>>0<(c[1312240]|0)>>>0){bE();return 0}w=z+16|0;if((c[w>>2]|0)==(x|0)){c[w>>2]=F}else{c[z+20>>2]=F}if((F|0)==0){break L3001}}}while(0);if(F>>>0<(c[1312240]|0)>>>0){bE();return 0}c[F+24>>2]=z;x=c[a+(i+8|0)>>2]|0;do{if((x|0)!=0){if(x>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[F+16>>2]=x;c[x+24>>2]=F;break}}}while(0);x=c[a+(i+12|0)>>2]|0;if((x|0)==0){break}if(x>>>0<(c[1312240]|0)>>>0){bE();return 0}else{c[F+20>>2]=x;c[x+24>>2]=F;break}}}while(0);if(r>>>0>=16){c[g>>2]=c[g>>2]&1|e|2;c[a+((e|4)-8|0)>>2]=r|3;s=a+((q|4)-8|0)|0;c[s>>2]=c[s>>2]|1;j5(a+(e-8|0)|0,r);break}c[g>>2]=q|c[g>>2]&1|2;s=a+((q|4)-8|0)|0;c[s>>2]=c[s>>2]|1;d=a;return d|0}else{s=i-e|0;if(s>>>0<=15){break}c[g>>2]=h&1|e|2;c[a+((e|4)-8|0)>>2]=s|3;c[o>>2]=c[o>>2]|1;j5(a+(e-8|0)|0,s);d=a;return d|0}}while(0);if((f|0)==0){break}else{d=a}return d|0}}while(0);f=j$(b)|0;if((f|0)==0){d=0;return d|0}e=c[g>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;j9(f,a,g>>>0<b>>>0?g:b);j0(a);d=f;return d|0}function j2(a){a=a|0;return}function j3(a){a=a|0;return 5247344}function j4(a){a=a|0;if((a|0)==0){return}j0(a);return}function j5(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L3096:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[1312240]|0;if(i>>>0<l>>>0){bE()}if((j|0)==(c[1312241]|0)){m=d+(b+4|0)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[1312238]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h|0)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h|0)>>2]|0;q=c[d+(12-h|0)>>2]|0;r=5248984+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){bE()}if((c[p+12>>2]|0)==(j|0)){break}bE()}}while(0);if((q|0)==(p|0)){c[1312236]=c[1312236]&(1<<m^-1);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){bE()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}bE()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h|0)>>2]|0;t=c[d+(12-h|0)>>2]|0;L3130:do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4|0)|0;w=c[v>>2]|0;do{if((w|0)==0){x=d+u|0;y=c[x>>2]|0;if((y|0)==0){z=0;break L3130}else{A=y;B=x;break}}else{A=w;B=v}}while(0);while(1){v=A+20|0;w=c[v>>2]|0;if((w|0)!=0){A=w;B=v;continue}v=A+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{A=w;B=v}}if(B>>>0<l>>>0){bE()}else{c[B>>2]=0;z=A;break}}else{v=c[d+(8-h|0)>>2]|0;if(v>>>0<l>>>0){bE()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){bE()}u=t+8|0;if((c[u>>2]|0)==(r|0)){c[w>>2]=t;c[u>>2]=v;z=t;break}else{bE()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h|0)|0;l=5249248+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=z;if((z|0)!=0){break}c[1312237]=c[1312237]&(1<<c[t>>2]^-1);n=j;o=k;break L3096}else{if(m>>>0<(c[1312240]|0)>>>0){bE()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=z}else{c[m+20>>2]=z}if((z|0)==0){n=j;o=k;break L3096}}}while(0);if(z>>>0<(c[1312240]|0)>>>0){bE()}c[z+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[1312240]|0)>>>0){bE()}else{c[z+16>>2]=t;c[t+24>>2]=z;break}}}while(0);t=c[d+(r+4|0)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[1312240]|0)>>>0){bE()}else{c[z+20>>2]=t;c[t+24>>2]=z;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[1312240]|0;if(e>>>0<a>>>0){bE()}z=d+(b+4|0)|0;A=c[z>>2]|0;do{if((A&2|0)==0){if((f|0)==(c[1312242]|0)){B=(c[1312239]|0)+o|0;c[1312239]=B;c[1312242]=n;c[n+4>>2]=B|1;if((n|0)!=(c[1312241]|0)){return}c[1312241]=0;c[1312238]=0;return}if((f|0)==(c[1312241]|0)){B=(c[1312238]|0)+o|0;c[1312238]=B;c[1312241]=n;c[n+4>>2]=B|1;c[n+B>>2]=B;return}B=(A&-8)+o|0;s=A>>>3;L3195:do{if(A>>>0<256){g=c[d+(b+8|0)>>2]|0;t=c[d+(b+12|0)>>2]|0;h=5248984+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){bE()}if((c[g+12>>2]|0)==(f|0)){break}bE()}}while(0);if((t|0)==(g|0)){c[1312236]=c[1312236]&(1<<s^-1);break}do{if((t|0)==(h|0)){C=t+8|0}else{if(t>>>0<a>>>0){bE()}m=t+8|0;if((c[m>>2]|0)==(f|0)){C=m;break}bE()}}while(0);c[g+12>>2]=t;c[C>>2]=g}else{h=e;m=c[d+(b+24|0)>>2]|0;l=c[d+(b+12|0)>>2]|0;L3197:do{if((l|0)==(h|0)){i=d+(b+20|0)|0;p=c[i>>2]|0;do{if((p|0)==0){q=d+(b+16|0)|0;v=c[q>>2]|0;if((v|0)==0){D=0;break L3197}else{E=v;F=q;break}}else{E=p;F=i}}while(0);while(1){i=E+20|0;p=c[i>>2]|0;if((p|0)!=0){E=p;F=i;continue}i=E+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{E=p;F=i}}if(F>>>0<a>>>0){bE()}else{c[F>>2]=0;D=E;break}}else{i=c[d+(b+8|0)>>2]|0;if(i>>>0<a>>>0){bE()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){bE()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;D=l;break}else{bE()}}}while(0);if((m|0)==0){break}l=d+(b+28|0)|0;g=5249248+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=D;if((D|0)!=0){break}c[1312237]=c[1312237]&(1<<c[l>>2]^-1);break L3195}else{if(m>>>0<(c[1312240]|0)>>>0){bE()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=D}else{c[m+20>>2]=D}if((D|0)==0){break L3195}}}while(0);if(D>>>0<(c[1312240]|0)>>>0){bE()}c[D+24>>2]=m;h=c[d+(b+16|0)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[1312240]|0)>>>0){bE()}else{c[D+16>>2]=h;c[h+24>>2]=D;break}}}while(0);h=c[d+(b+20|0)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[1312240]|0)>>>0){bE()}else{c[D+20>>2]=h;c[h+24>>2]=D;break}}}while(0);c[n+4>>2]=B|1;c[n+B>>2]=B;if((n|0)!=(c[1312241]|0)){G=B;break}c[1312238]=B;return}else{c[z>>2]=A&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;G=o}}while(0);o=G>>>3;if(G>>>0<256){A=o<<1;z=5248984+(A<<2)|0;D=c[1312236]|0;b=1<<o;do{if((D&b|0)==0){c[1312236]=D|b;H=z;I=5248984+(A+2<<2)|0}else{o=5248984+(A+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[1312240]|0)>>>0){H=d;I=o;break}bE()}}while(0);c[I>>2]=n;c[H+12>>2]=n;c[n+8>>2]=H;c[n+12>>2]=z;return}z=n;H=G>>>8;do{if((H|0)==0){J=0}else{if(G>>>0>16777215){J=31;break}I=(H+1048320|0)>>>16&8;A=H<<I;b=(A+520192|0)>>>16&4;D=A<<b;A=(D+245760|0)>>>16&2;o=(14-(b|I|A)|0)+(D<<A>>>15)|0;J=G>>>((o+7|0)>>>0)&1|o<<1}}while(0);H=5249248+(J<<2)|0;c[n+28>>2]=J;c[n+20>>2]=0;c[n+16>>2]=0;o=c[1312237]|0;A=1<<J;if((o&A|0)==0){c[1312237]=o|A;c[H>>2]=z;c[n+24>>2]=H;c[n+12>>2]=n;c[n+8>>2]=n;return}if((J|0)==31){K=0}else{K=25-(J>>>1)|0}J=G<<K;K=c[H>>2]|0;while(1){if((c[K+4>>2]&-8|0)==(G|0)){break}L=K+16+(J>>>31<<2)|0;H=c[L>>2]|0;if((H|0)==0){M=2780;break}else{J=J<<1;K=H}}if((M|0)==2780){if(L>>>0<(c[1312240]|0)>>>0){bE()}c[L>>2]=z;c[n+24>>2]=K;c[n+12>>2]=n;c[n+8>>2]=n;return}L=K+8|0;M=c[L>>2]|0;J=c[1312240]|0;if(K>>>0<J>>>0){bE()}if(M>>>0<J>>>0){bE()}c[M+12>>2]=z;c[L>>2]=z;c[n+8>>2]=M;c[n+12>>2]=K;c[n+24>>2]=0;return}function j6(){var a=0;a=bO(4)|0;c[a>>2]=5257468;bg(a|0,5262716,348)}function j7(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,i=0,j=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,w=0.0,x=0,y=0,z=0,A=0.0,B=0.0,C=0,D=0,E=0,F=0.0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0.0,P=0,Q=0,R=0.0,S=0.0,T=0.0;e=b;while(1){f=e+1|0;if((aE(a[e]<<24>>24|0)|0)==0){break}else{e=f}}g=a[e]|0;if((g<<24>>24|0)==43){i=f;j=0}else if((g<<24>>24|0)==45){i=f;j=1}else{i=e;j=0}e=-1;f=0;g=i;while(1){l=a[g]|0;if(((l<<24>>24)-48|0)>>>0<10){m=e}else{if(l<<24>>24!=46|(e|0)>-1){break}else{m=f}}e=m;f=f+1|0;g=g+1|0}m=g+(-f|0)|0;i=(e|0)<0;n=((i^1)<<31>>31)+f|0;o=(n|0)>18;p=(o?-18:-n|0)+(i?f:e)|0;e=o?18:n;do{if((e|0)==0){q=b;r=0.0}else{do{if((e|0)>9){n=m;o=e;f=0;while(1){i=a[n]|0;s=n+1|0;if(i<<24>>24==46){t=a[s]|0;u=n+2|0}else{t=i;u=s}v=((f*10&-1)-48|0)+(t<<24>>24)|0;s=o-1|0;if((s|0)>9){n=u;o=s;f=v}else{break}}w=+(v|0)*1.0e9;x=9;y=u;z=2829;break}else{if((e|0)>0){w=0.0;x=e;y=m;z=2829;break}else{A=0.0;B=0.0;break}}}while(0);if((z|0)==2829){f=y;o=x;n=0;while(1){s=a[f]|0;i=f+1|0;if(s<<24>>24==46){C=a[i]|0;D=f+2|0}else{C=s;D=i}E=((n*10&-1)-48|0)+(C<<24>>24)|0;i=o-1|0;if((i|0)>0){f=D;o=i;n=E}else{break}}A=+(E|0);B=w}F=B+A;L3340:do{if((l<<24>>24|0)==69|(l<<24>>24|0)==101){n=g+1|0;o=a[n]|0;if((o<<24>>24|0)==43){G=g+2|0;H=0}else if((o<<24>>24|0)==45){G=g+2|0;H=1}else{G=n;H=0}n=a[G]|0;if(((n<<24>>24)-48|0)>>>0<10){I=G;J=0;K=n}else{L=0;M=G;N=H;break}while(1){n=((J*10&-1)-48|0)+(K<<24>>24)|0;o=I+1|0;f=a[o]|0;if(((f<<24>>24)-48|0)>>>0<10){I=o;J=n;K=f}else{L=n;M=o;N=H;break L3340}}}else{L=0;M=g;N=0}}while(0);o=p+((N|0)==0?L:-L|0)|0;n=(o|0)<0?-o|0:o;do{if((n|0)>511){c[bv()>>2]=34;O=1.0;P=5243092;Q=511;z=2846;break}else{if((n|0)==0){R=1.0;break}else{O=1.0;P=5243092;Q=n;z=2846;break}}}while(0);L3352:do{if((z|0)==2846){while(1){z=0;if((Q&1|0)==0){S=O}else{S=O*(c[k>>2]=c[P>>2]|0,c[k+4>>2]=c[P+4>>2]|0,+h[k>>3])}n=Q>>1;if((n|0)==0){R=S;break L3352}else{O=S;P=P+8|0;Q=n;z=2846}}}}while(0);if((o|0)>-1){q=M;r=F*R;break}else{q=M;r=F/R;break}}}while(0);if((d|0)!=0){c[d>>2]=q}if((j|0)==0){T=r;return+T}T=-0.0-r;return+T}function j8(b){b=b|0;var c=0;c=b;while(a[c]|0!=0){c=c+1|0}return c-b|0}function j9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2]|0;b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function ka(a,b,c){a=a|0;b=b|0;c=c|0;var e=0,f=0,g=0;while((e|0)<(c|0)){f=d[a+e|0]|0;g=d[b+e|0]|0;if((f|0)!=(g|0))return((f|0)>(g|0)?1:-1)|0;e=e+1|0}return 0}function kb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function kc(b,c){b=b|0;c=c|0;var d=0;b=b+j8(b)|0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while((a[c+(d-1)|0]|0)!=0);return b|0}function kd(b,c){b=b|0;c=c|0;var d=0;do{a[b+d|0]=a[c+d|0];d=d+1|0}while(a[c+(d-1)|0]|0!=0);return b|0}function ke(b,c,d){b=b|0;c=c|0;d=d|0;if((c|0)<(b|0)&(b|0)<(c+d|0)){c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}}else{j9(b,c,d)}}function kf(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;c=b+d>>>0;if(e>>>0<a>>>0){c=c+1>>>0}return(F=c,e|0)|0}function kg(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}F=a<<c-32;return 0}function kh(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=0;return b>>>c-32|0}function ki(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){F=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}F=(b|0)<0?-1:0;return b>>c-32|0}function kj(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return bY[a&1023](b|0,c|0,d|0)|0}function kk(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;bZ[a&1023](b|0,c|0,d|0)}function kl(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;b_[a&1023](b|0,c|0,d|0,e|0,f|0)}function km(a,b){a=a|0;b=b|0;b$[a&1023](b|0)}function kn(a,b,c){a=a|0;b=b|0;c=c|0;b0[a&1023](b|0,c|0)}function ko(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;b1[a&1023](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function kp(a,b){a=a|0;b=b|0;return b2[a&1023](b|0)|0}function kq(a,b,c){a=a|0;b=b|0;c=+c;return b3[a&1](b|0,+c)|0}function kr(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;b4[a&1023](b|0,c|0,d|0,e|0,f|0,+g)}function ks(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;b5[a&1023](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function kt(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;b6[a&1023](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function ku(a){a=a|0;b7[a&1023]()}function kv(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return b8[a&1023](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function kw(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return b9[a&1023](b|0,c|0,d|0,e|0)|0}function kx(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;ca[a&1023](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function ky(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;cb[a&1023](b|0,c|0,d|0,e|0,f|0,g|0)}function kz(a,b,c){a=a|0;b=b|0;c=c|0;return cc[a&1023](b|0,c|0)|0}function kA(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return cd[a&1023](b|0,c|0,d|0,e|0,f|0)|0}function kB(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ce[a&1023](b|0,c|0,d|0,e|0)}function kC(a,b,c){a=a|0;b=b|0;c=c|0;ac(0);return 0}function kD(a,b,c){a=a|0;b=b|0;c=c|0;ac(1)}function kE(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ac(2)}function kF(a){a=a|0;ac(3)}function kG(a,b){a=a|0;b=b|0;ac(4)}function kH(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ac(5)}function kI(a){a=a|0;ac(6);return 0}function kJ(a,b){a=a|0;b=+b;ac(7);return 0}function kK(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ac(8)}function kL(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ac(9)}function kM(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ac(10)}function kN(){ac(11)}function kO(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ac(12);return 0}function kP(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ac(13);return 0}function kQ(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ac(14)}function kR(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ac(15)}function kS(a,b){a=a|0;b=b|0;ac(16);return 0}function kT(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ac(17);return 0}function kU(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ac(18)}
// EMSCRIPTEN_END_FUNCS
var bY=[kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,eY,kC,kC,kC,kC,kC,kC,kC,iE,kC,kC,kC,kC,kC,iC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,jP,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,id,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,e7,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,dR,kC,er,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,ep,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,iv,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,ec,kC,kC,kC,hX,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,ie,kC,cZ,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,iA,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,dK,kC,kC,kC,kC,kC,kC,kC,cR,kC,kC,kC,kC,kC,kC,kC,kC,kC,eu,kC,kC,kC,kC,kC,iG,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,cY,kC,kC,kC,hQ,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,d5,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,ew,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC,kC];var bZ=[kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,cB,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,dJ,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,eU,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,cE,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD,kD];var b_=[kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,jU,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,jQ,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,jT,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE,kE];var b$=[kF,kF,hS,kF,e8,kF,kF,kF,dM,kF,kF,kF,kF,kF,f3,kF,kF,kF,kF,kF,dP,kF,eo,kF,kF,kF,kF,kF,ih,kF,de,kF,kF,kF,kF,kF,kF,kF,kF,kF,g5,kF,dL,kF,dO,kF,kF,kF,kF,kF,fx,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eV,kF,kF,kF,kF,kF,dQ,kF,im,kF,kF,kF,kF,kF,kF,kF,ip,kF,kF,kF,kF,kF,gr,kF,fw,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eO,kF,kF,kF,kF,kF,kF,kF,hN,kF,kF,kF,kF,kF,iu,kF,kF,kF,kF,kF,jc,kF,kF,kF,kF,kF,kF,kF,h2,kF,kF,kF,eC,kF,iI,kF,e6,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,hf,kF,it,kF,kF,kF,kF,kF,kF,kF,kF,kF,ir,kF,kF,kF,jA,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,jb,kF,kF,kF,ez,kF,kF,kF,iU,kF,dm,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eW,kF,kF,kF,kF,kF,kF,kF,iq,kF,gC,kF,kF,kF,kF,kF,kF,kF,io,kF,kF,kF,j0,kF,jM,kF,hI,kF,ja,kF,kF,kF,kF,kF,eF,kF,dg,kF,kF,kF,kF,kF,kF,kF,kF,kF,e4,kF,kF,kF,kF,kF,kF,kF,fQ,kF,kF,kF,di,kF,fN,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,gK,kF,kF,kF,eB,kF,kF,kF,eL,kF,jE,kF,jD,kF,g2,kF,gu,kF,kF,kF,kF,kF,kF,kF,jL,kF,kF,kF,e0,kF,hb,kF,j4,kF,en,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,j2,kF,eP,kF,et,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,is,kF,kF,kF,iJ,kF,kF,kF,h0,kF,jV,kF,kF,kF,e1,kF,eD,kF,kF,kF,e_,kF,hp,kF,kF,kF,hk,kF,eQ,kF,kF,kF,kF,kF,kF,kF,kF,kF,i9,kF,kF,kF,jB,kF,kF,kF,jJ,kF,kF,kF,iZ,kF,df,kF,kF,kF,h$,kF,kF,kF,kF,kF,kF,kF,kF,kF,e$,kF,kF,kF,g3,kF,hu,kF,j_,kF,kF,kF,kF,kF,hW,kF,hr,kF,hH,kF,jI,kF,jH,kF,g7,kF,f4,kF,je,kF,kF,kF,kF,kF,e3,kF,kF,kF,kF,kF,dv,kF,jC,kF,eH,kF,dS,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,hB,kF,kF,kF,hv,kF,kF,kF,kF,kF,jd,kF,kF,kF,kF,kF,kF,kF,kF,kF,d$,kF,kF,kF,kF,kF,jK,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,jO,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eK,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eA,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eN,kF,kF,kF,kF,kF,kF,kF,kF,kF,hP,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,eJ,kF,dy,kF,kF,kF,kF,kF,e2,kF,gO,kF,kF,kF,kF,kF,kF,kF,gj,kF,gG,kF,dj,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,hA,kF,kF,kF,kF,kF,h5,kF,eG,kF,es,kF,kF,kF,eI,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,jt,kF,kF,kF,gh,kF,jN,kF,hO,kF,dh,kF,kF,kF,dT,kF,kF,kF,kF,kF,g6,kF,kF,kF,h3,kF,kF,kF,kF,kF,kF,kF,kF,kF,gS,kF,kF,kF,dU,kF,dN,kF,eE,kF,hV,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF,kF];var b0=[kG,kG,kG,kG,kG,kG,jf,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,dr,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hn,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,jh,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,gY,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,jg,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,cQ,kG,kG,kG,hR,kG,kG,kG,kG,kG,kG,kG,kG,kG,eb,kG,g$,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,gZ,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hj,kG,kG,kG,kG,kG,kG,kG,ha,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,g8,kG,kG,kG,kG,kG,ho,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,gW,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,dE,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,ds,kG,kG,kG,kG,kG,kG,kG,kG,kG,g_,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,ji,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hd,kG,kG,kG,kG,kG,kG,kG,kG,kG,hl,kG,kG,kG,hc,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,jr,kG,kG,kG,gX,kG,g0,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,i8,kG,gV,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,d4,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,dF,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hY,kG,kG,kG,hg,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,gU,kG,kG,kG,kG,kG,kG,kG,gT,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,g9,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hh,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hi,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,hm,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,he,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG,kG];var b1=[kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,gB,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,gq,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH,kH];var b2=[kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,jy,kI,gM,kI,kI,kI,kI,kI,c5,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,d8,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,jm,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,eq,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,jw,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,gH,kI,iN,kI,dz,kI,kI,kI,kI,kI,kI,kI,iT,kI,kI,kI,gi,kI,kI,kI,jk,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,dA,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,ev,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,ef,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,js,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,jo,kI,kI,kI,kI,kI,kI,kI,c0,kI,kI,kI,kI,kI,kI,kI,kI,kI,i$,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,jW,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,dI,kI,kI,kI,kI,kI,kI,kI,kI,kI,i7,kI,kI,kI,kI,kI,kI,kI,i4,kI,kI,kI,kI,kI,jp,kI,kI,kI,kI,kI,iS,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,i5,kI,kI,kI,d6,kI,kI,kI,kI,kI,kI,kI,gR,kI,kI,kI,kI,kI,jq,kI,kI,kI,dk,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,gI,kI,kI,kI,kI,kI,kI,kI,kI,kI,iH,kI,jx,kI,kI,kI,kI,kI,kI,kI,kI,kI,i1,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,gP,kI,kI,kI,jj,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,dn,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,c$,kI,kI,kI,i0,kI,kI,kI,iP,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,ey,kI,gF,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,dp,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,i6,kI,cW,kI,kI,kI,d7,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,ed,kI,dw,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,c1,kI,gJ,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,ib,kI,kI,kI,ia,kI,kI,kI,j3,kI,kI,kI,ee,kI,gD,kI,kI,kI,kI,kI,kI,kI,jl,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,h9,kI,gE,kI,kI,kI,kI,kI,dH,kI,kI,kI,kI,kI,kI,kI,kI,kI,gL,kI,kI,kI,kI,kI,gN,kI,kI,kI,kI,kI,kI,kI,jn,kI,kI,kI,kI,kI,gQ,kI,kI,kI,kI,kI,kI,kI,gs,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,jv,kI,kI,kI,kI,kI,kI,kI,kI,kI,ju,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,c_,kI,iR,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI,kI];var b3=[kJ,kJ];var b4=[kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,gf,kK,gd,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,f2,kK,f_,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK,kK];var b5=[kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gp,kL,kL,kL,kL,kL,kL,kL,gv,kL,kL,kL,kL,kL,kL,kL,gy,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,hT,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gc,kL,f9,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,hJ,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gk,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,go,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gz,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,fR,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gn,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,fH,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gx,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,fZ,kL,fX,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,fK,kL,fF,kL,kL,kL,fG,kL,fy,kL,fI,kL,fC,kL,fA,kL,fP,kL,fO,kL,fL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,gA,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,fl,kL,kL,kL,kL,kL,gm,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,fp,kL,fh,kL,fj,kL,fn,kL,fe,kL,kL,kL,fu,kL,ft,kL,fr,kL,fa,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL,kL];var b6=[kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,hq,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,g4,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,hs,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,hy,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,hx,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,hC,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM,kM];var b7=[kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN,kN];var b8=[kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,h6,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,iL,kO,iW,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,h7,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,iY,kO,kO,kO,i2,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,iK,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,iV,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO,kO];var b9=[kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,iw,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,ix,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,ik,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,ii,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,iy,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP,kP];var ca=[kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,hK,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,hE,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ,kQ];var cb=[kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,jY,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,ga,kR,f5,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,jZ,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,gg,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,hU,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,ek,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,f6,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,fT,kR,fY,kR,fS,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,f7,kR,kR,kR,kR,kR,jX,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,ei,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,hZ,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR,kR];var cc=[kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,iD,kS,kS,kS,kS,kS,kS,kS,dB,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,ic,kS,kS,kS,kS,kS,kS,kS,eg,kS,cP,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,h4,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,ea,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,dt,kS,kS,kS,kS,kS,dx,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,iz,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,cX,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,iF,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,eh,kS,kS,kS,kS,kS,iB,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,d9,kS,kS,kS,dl,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS,kS];var cd=[kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,iQ,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,iO,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,i3,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,h8,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,ij,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,iX,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,eZ,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,il,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,ig,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,iM,kT,eX,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,i_,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT,kT];var ce=[kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,jR,kU,kU,kU,kU,kU,jS,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,ej,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,jG,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,el,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,e9,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,e5,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU,kU];return{_memcmp:ka,_strlen:j8,_strcat:kc,_free:j0,_main:cC,_realloc:j1,_memmove:ke,__GLOBAL__I_a291:jF,_memset:kb,_malloc:j$,_memcpy:j9,_strcpy:kd,__GLOBAL__I_a242:dG,stackAlloc:cf,stackSave:cg,stackRestore:ch,setThrew:ci,setTempRet0:cj,setTempRet1:ck,setTempRet2:cl,setTempRet3:cm,setTempRet4:cn,setTempRet5:co,setTempRet6:cp,setTempRet7:cq,setTempRet8:cr,setTempRet9:cs,dynCall_iiii:kj,dynCall_viii:kk,dynCall_viiiii:kl,dynCall_vi:km,dynCall_vii:kn,dynCall_viiiiiiiii:ko,dynCall_ii:kp,dynCall_iif:kq,dynCall_viiiiif:kr,dynCall_viiiiiii:ks,dynCall_viiiiiiii:kt,dynCall_v:ku,dynCall_iiiiiiiii:kv,dynCall_iiiii:kw,dynCall_viiiiiif:kx,dynCall_viiiiii:ky,dynCall_iii:kz,dynCall_iiiiii:kA,dynCall_viiii:kB}})
// EMSCRIPTEN_END_ASM
({ Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array }, { abort: abort, assert: assert, asmPrintInt: asmPrintInt, asmPrintFloat: asmPrintFloat, copyTempDouble: copyTempDouble, copyTempFloat: copyTempFloat, min: Math_min, i64Math_add: i64Math_add, i64Math_subtract: i64Math_subtract, i64Math_multiply: i64Math_multiply, i64Math_divide: i64Math_divide, i64Math_modulo: i64Math_modulo, _llvm_lifetime_end: _llvm_lifetime_end, _lseek: _lseek, __scanString: __scanString, _fclose: _fclose, _pthread_mutex_lock: _pthread_mutex_lock, _mbrlen: _mbrlen, ___cxa_end_catch: ___cxa_end_catch, _strtoull: _strtoull, _fflush: _fflush, _wcsnrtombs: _wcsnrtombs, _fputc: _fputc, _fwrite: _fwrite, _strncmp: _strncmp, _llvm_eh_exception: _llvm_eh_exception, _fputs: _fputs, _llvm_umul_with_overflow_i32: _llvm_umul_with_overflow_i32, _isspace: _isspace, _wmemset: _wmemset, _read: _read, _fsync: _fsync, ___cxa_guard_abort: ___cxa_guard_abort, _newlocale: _newlocale, ___gxx_personality_v0: ___gxx_personality_v0, _pthread_cond_wait: _pthread_cond_wait, ___cxa_rethrow: ___cxa_rethrow, _strcmp: _strcmp, _llvm_va_end: _llvm_va_end, _mbtowc: _mbtowc, _snprintf: _snprintf, _fgetc: _fgetc, __isFloat: __isFloat, _atexit: _atexit, ___cxa_free_exception: ___cxa_free_exception, _close: _close, _strchr: _strchr, _clock: _clock, ___setErrNo: ___setErrNo, _isxdigit: _isxdigit, _ftell: _ftell, _exit: _exit, _sprintf: _sprintf, ___ctype_b_loc: ___ctype_b_loc, _freelocale: _freelocale, __Z7catopenPKci: __Z7catopenPKci, _asprintf: _asprintf, ___cxa_is_number_type: ___cxa_is_number_type, ___cxa_does_inherit: ___cxa_does_inherit, ___cxa_guard_acquire: ___cxa_guard_acquire, ___locale_mb_cur_max: ___locale_mb_cur_max, ___cxa_begin_catch: ___cxa_begin_catch, __parseInt64: __parseInt64, __ZSt18uncaught_exceptionv: __ZSt18uncaught_exceptionv, ___cxa_call_unexpected: ___cxa_call_unexpected, __exit: __exit, _strftime: _strftime, _wmemmove: _wmemmove, ___cxa_throw: ___cxa_throw, _printf: _printf, _pread: _pread, _fopen: _fopen, _open: _open, _puts: _puts, _wcslen: _wcslen, ___cxa_find_matching_catch: ___cxa_find_matching_catch, _mbrtowc: _mbrtowc, __formatString: __formatString, _pthread_cond_broadcast: _pthread_cond_broadcast, _mbsrtowcs: _mbsrtowcs, _pthread_mutex_unlock: _pthread_mutex_unlock, _sbrk: _sbrk, _localeconv: _localeconv, ___errno_location: ___errno_location, _strerror: _strerror, _llvm_lifetime_start: _llvm_lifetime_start, ___cxa_guard_release: ___cxa_guard_release, _ungetc: _ungetc, _uselocale: _uselocale, _sscanf: _sscanf, _sysconf: _sysconf, _fread: _fread, _abort: _abort, _fprintf: _fprintf, ___fpclassifyf: ___fpclassifyf, _isdigit: _isdigit, _strtoll: _strtoll, _wmemcpy: _wmemcpy, __reallyNegative: __reallyNegative, __Z7catgetsP8_nl_catdiiPKc: __Z7catgetsP8_nl_catdiiPKc, _fseek: _fseek, _write: _write, ___cxa_allocate_exception: ___cxa_allocate_exception, __Z8catcloseP8_nl_catd: __Z8catcloseP8_nl_catd, ___ctype_toupper_loc: ___ctype_toupper_loc, ___ctype_tolower_loc: ___ctype_tolower_loc, ___assert_func: ___assert_func, _pwrite: _pwrite, _strerror_r: _strerror_r, _time: _time, _wcrtomb: _wcrtomb, _mbsnrtowcs: _mbsnrtowcs, STACKTOP: STACKTOP, STACK_MAX: STACK_MAX, tempDoublePtr: tempDoublePtr, ABORT: ABORT, NaN: NaN, Infinity: Infinity, _stdin: _stdin, __ZTVN10__cxxabiv117__class_type_infoE: __ZTVN10__cxxabiv117__class_type_infoE, __ZTVN10__cxxabiv120__si_class_type_infoE: __ZTVN10__cxxabiv120__si_class_type_infoE, _stderr: _stderr, _stdout: _stdout, ___dso_handle: ___dso_handle }, buffer);
var _memcmp = Module["_memcmp"] = asm._memcmp;
var _strlen = Module["_strlen"] = asm._strlen;
var _strcat = Module["_strcat"] = asm._strcat;
var _free = Module["_free"] = asm._free;
var _main = Module["_main"] = asm._main;
var _realloc = Module["_realloc"] = asm._realloc;
var _memmove = Module["_memmove"] = asm._memmove;
var __GLOBAL__I_a291 = Module["__GLOBAL__I_a291"] = asm.__GLOBAL__I_a291;
var _memset = Module["_memset"] = asm._memset;
var _malloc = Module["_malloc"] = asm._malloc;
var _memcpy = Module["_memcpy"] = asm._memcpy;
var _strcpy = Module["_strcpy"] = asm._strcpy;
var __GLOBAL__I_a242 = Module["__GLOBAL__I_a242"] = asm.__GLOBAL__I_a242;
var dynCall_iiii = Module["dynCall_iiii"] = asm.dynCall_iiii;
var dynCall_viii = Module["dynCall_viii"] = asm.dynCall_viii;
var dynCall_viiiii = Module["dynCall_viiiii"] = asm.dynCall_viiiii;
var dynCall_vi = Module["dynCall_vi"] = asm.dynCall_vi;
var dynCall_vii = Module["dynCall_vii"] = asm.dynCall_vii;
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm.dynCall_viiiiiiiii;
var dynCall_ii = Module["dynCall_ii"] = asm.dynCall_ii;
var dynCall_iif = Module["dynCall_iif"] = asm.dynCall_iif;
var dynCall_viiiiif = Module["dynCall_viiiiif"] = asm.dynCall_viiiiif;
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm.dynCall_viiiiiii;
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm.dynCall_viiiiiiii;
var dynCall_v = Module["dynCall_v"] = asm.dynCall_v;
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm.dynCall_iiiiiiiii;
var dynCall_iiiii = Module["dynCall_iiiii"] = asm.dynCall_iiiii;
var dynCall_viiiiiif = Module["dynCall_viiiiiif"] = asm.dynCall_viiiiiif;
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm.dynCall_viiiiii;
var dynCall_iii = Module["dynCall_iii"] = asm.dynCall_iii;
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm.dynCall_iiiiii;
var dynCall_viiii = Module["dynCall_viiii"] = asm.dynCall_viiii;
Runtime.stackAlloc = function(size) { return asm.stackAlloc(size) };
Runtime.stackSave = function() { return asm.stackSave() };
Runtime.stackRestore = function(top) { asm.stackRestore(top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    subtract: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.subtract(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    multiply: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.multiply(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    divide: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.div(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, z, null);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    modulo: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.modulo(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, null, z);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  ret = Module['_main'](argc, argv, 0);
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
(function() {
function assert(check, msg) {
  if (!check) throw msg + new Error().stack;
}
Module['FS_createPath']('/', 'testdata', true, true);
    function DataRequest() {}
    DataRequest.prototype = {
      requests: {},
      open: function(mode, name) {
        this.requests[name] = this;
      },
      send: function() {}
    };
    var filePreload0 = new DataRequest();
    filePreload0.open('GET', 'testdata/apache_builds.json', true);
    filePreload0.responseType = 'arraybuffer';
    filePreload0.onload = function() {
      var arrayBuffer = filePreload0.response;
      assert(arrayBuffer, 'Loading file testdata/apache_builds.json failed.');
      var byteArray = !arrayBuffer.subarray ? new Uint8Array(arrayBuffer) : arrayBuffer;
      Module['FS_createPreloadedFile']('/testdata', 'apache_builds.json', byteArray, true, true, function() {
        Module['removeRunDependency']('fp testdata/apache_builds.json');
      });
    };
    Module['addRunDependency']('fp testdata/apache_builds.json');
    filePreload0.send(null);
    var filePreload1 = new DataRequest();
    filePreload1.open('GET', 'testdata/github_events.json', true);
    filePreload1.responseType = 'arraybuffer';
    filePreload1.onload = function() {
      var arrayBuffer = filePreload1.response;
      assert(arrayBuffer, 'Loading file testdata/github_events.json failed.');
      var byteArray = !arrayBuffer.subarray ? new Uint8Array(arrayBuffer) : arrayBuffer;
      Module['FS_createPreloadedFile']('/testdata', 'github_events.json', byteArray, true, true, function() {
        Module['removeRunDependency']('fp testdata/github_events.json');
      });
    };
    Module['addRunDependency']('fp testdata/github_events.json');
    filePreload1.send(null);
    var filePreload2 = new DataRequest();
    filePreload2.open('GET', 'testdata/instruments.json', true);
    filePreload2.responseType = 'arraybuffer';
    filePreload2.onload = function() {
      var arrayBuffer = filePreload2.response;
      assert(arrayBuffer, 'Loading file testdata/instruments.json failed.');
      var byteArray = !arrayBuffer.subarray ? new Uint8Array(arrayBuffer) : arrayBuffer;
      Module['FS_createPreloadedFile']('/testdata', 'instruments.json', byteArray, true, true, function() {
        Module['removeRunDependency']('fp testdata/instruments.json');
      });
    };
    Module['addRunDependency']('fp testdata/instruments.json');
    filePreload2.send(null);
    var filePreload3 = new DataRequest();
    filePreload3.open('GET', 'testdata/mesh.json', true);
    filePreload3.responseType = 'arraybuffer';
    filePreload3.onload = function() {
      var arrayBuffer = filePreload3.response;
      assert(arrayBuffer, 'Loading file testdata/mesh.json failed.');
      var byteArray = !arrayBuffer.subarray ? new Uint8Array(arrayBuffer) : arrayBuffer;
      Module['FS_createPreloadedFile']('/testdata', 'mesh.json', byteArray, true, true, function() {
        Module['removeRunDependency']('fp testdata/mesh.json');
      });
    };
    Module['addRunDependency']('fp testdata/mesh.json');
    filePreload3.send(null);
    var filePreload4 = new DataRequest();
    filePreload4.open('GET', 'testdata/update-center.json', true);
    filePreload4.responseType = 'arraybuffer';
    filePreload4.onload = function() {
      var arrayBuffer = filePreload4.response;
      assert(arrayBuffer, 'Loading file testdata/update-center.json failed.');
      var byteArray = !arrayBuffer.subarray ? new Uint8Array(arrayBuffer) : arrayBuffer;
      Module['FS_createPreloadedFile']('/testdata', 'update-center.json', byteArray, true, true, function() {
        Module['removeRunDependency']('fp testdata/update-center.json');
      });
    };
    Module['addRunDependency']('fp testdata/update-center.json');
    filePreload4.send(null);
    if (!Module.expectedDataFileDownloads) {
      Module.expectedDataFileDownloads = 0;
      Module.finishedDataFileDownloads = 0;
    }
    Module.expectedDataFileDownloads++;
    var dataFile = new XMLHttpRequest();
    dataFile.onprogress = function(event) {
      var url = 'perf.data';
      if (event.loaded && event.total) {
        if (!dataFile.addedTotal) {
          dataFile.addedTotal = true;
          if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
          Module.dataFileDownloads[url] = {
            loaded: event.loaded,
            total: event.total
          };
        } else {
          Module.dataFileDownloads[url].loaded = event.loaded;
        }
        var total = 0;
        var loaded = 0;
        var num = 0;
        for (var download in Module.dataFileDownloads) {
          var data = Module.dataFileDownloads[download];
          total += data.total;
          loaded += data.loaded;
          num++;
        }
        total = Math.ceil(total * Module.expectedDataFileDownloads/num);
        Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
      } else if (!Module.dataFileDownloads) {
        Module['setStatus']('Downloading data...');
      }
    }
    dataFile.open('GET', 'perf.data', true);
    dataFile.responseType = 'arraybuffer';
    dataFile.onload = function() {
      Module.finishedDataFileDownloads++;
      var arrayBuffer = dataFile.response;
      assert(arrayBuffer, 'Loading data file failed.');
      var byteArray = new Uint8Array(arrayBuffer);
      var curr;
        curr = DataRequest.prototype.requests['testdata/apache_builds.json'];
        curr.response = byteArray.subarray(0,127275);
        curr.onload();
        curr = DataRequest.prototype.requests['testdata/github_events.json'];
        curr.response = byteArray.subarray(127275,192407);
        curr.onload();
        curr = DataRequest.prototype.requests['testdata/instruments.json'];
        curr.response = byteArray.subarray(192407,412753);
        curr.onload();
        curr = DataRequest.prototype.requests['testdata/mesh.json'];
        curr.response = byteArray.subarray(412753,1136350);
        curr.onload();
        curr = DataRequest.prototype.requests['testdata/update-center.json'];
        curr.response = byteArray.subarray(1136350,1669528);
        curr.onload();
                Module['removeRunDependency']('datafile_perf.data');
    };
    Module['addRunDependency']('datafile_perf.data');
    dataFile.send(null);
    if (Module['setStatus']) Module['setStatus']('Downloading...');
})();
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
initRuntime();
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
if (shouldRunNow) {
  var ret = run();
}
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
