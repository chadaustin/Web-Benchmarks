// Warning: Cannot correct overflows of this many bits: 64 at line 821
// Warning: Cannot correct overflows of this many bits: 64 at line 876
"use strict";

/*
// Capture the output of this into a variable, if you want
(function(Module, args) {
  Module = Module || {};
  Module.arguments = args || [];
*/

///*
// Runs much faster, for some reason
if (!this['Module']) {
  this['Module'] = {};
}
if (!Module.arguments) {
  try {
    Module.arguments = scriptArgs;
  } catch(e) {
    try {
      Module.arguments = arguments;
    } catch(e) {
      Module.arguments = [];
    }
  }
}
//*/

  
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
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else {
      return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
    }
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return pointingLevels(type) > 0;
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (new RegExp(/^\[\d+\ x\ (.*)\]/g).test(type)) return true; // [15 x ?] blocks. Like structs
  if (new RegExp(/<?{ [^}]* }>?/g).test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return !Runtime.isNumberType(type) && type[0] == '%';
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
  getNativeFieldSize: function getNativeFieldSize(type) {
  return Math.max(Runtime.getNativeTypeSize(type), 4);
},
  getNativeTypeSize: function getNativeTypeSize(type) {
  if (4 == 1) return 1;
  var size = {
    '_i1': 1,
    '_i8': 1,
    '_i16': 2,
    '_i32': 4,
    '_i64': 8,
    "_float": 4,
    "_double": 8
  }['_'+type]; // add '_' since float&double confuse Closure compiler as keys.
  if (!size && type[type.length-1] == '*') {
    size = 4; // A pointer
  }
  return size;
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
      } else {
        dprint('Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]));
        assert(0);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, 4);
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
      if (!struct) struct = (typeof Types === 'undefined' ? Runtime : Types).structMetadata[typeName.replace(/.*\./, '')];
      if (!struct) return null;
      assert(type.fields.length === struct.length, 'Number of named fields must match the type for ' + typeName + '. Perhaps due to inheritance, which is not supported yet?');
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
  stackAlloc: function stackAlloc(size) { var ret = STACKTOP; assert(size > 0, "Trying to allocate 0"); _memset(STACKTOP, 0, size); STACKTOP += size;STACKTOP = Math.ceil((STACKTOP)/4)*4;; assert(STACKTOP < STACK_ROOT + STACK_MAX, "Ran out of stack"); return ret; },
  staticAlloc: function staticAlloc(size) { var ret = STATICTOP; assert(size > 0, "Trying to allocate 0"); STATICTOP += size;STATICTOP = Math.ceil((STATICTOP)/4)*4;; return ret; },
  alignMemory: function alignMemory(size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4);; return ret; },
  __dummy__: 0
}



var CorrectionsMonitor = {
  MAX_ALLOWED: 0, // XXX
  corrections: 0,
  sigs: {},

  note: function(type, succeed, sig) {
    if (!succeed) {
      this.corrections++;
      if (this.corrections >= this.MAX_ALLOWED) abort('\n\nToo many corrections!');
    }
  },

  print: function() {
    var items = [];
    for (var sig in this.sigs) {
      items.push({
        sig: sig,
        fails: this.sigs[sig][0],
        succeeds: this.sigs[sig][1],
        total: this.sigs[sig][0] + this.sigs[sig][1]
      });
    }
    items.sort(function(x, y) { return y.total - x.total; });
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      print(item.sig + ' : ' + item.total + ' hits, %' + (Math.ceil(100*item.fails/item.total)) + ' failures');
    }
  }
};

function cRound(x) {
  return x >= 0 ? Math.floor(x) : Math.ceil(x);
}





//========================================
// Runtime essentials
//========================================

var __globalConstructor__ = function globalConstructor() {
};

var __THREW__ = false; // Used in checking for thrown exceptions.

var __ATEXIT__ = [];

var ABORT = false;

var undef = 0;
var tempValue, tempInt, tempBigInt;

function abort(text) {
  print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.

function setValue(ptr, value, type) {
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
  switch(type) {
    case 'i1': HEAP[ptr]=value;; break;
    case 'i8': HEAP[ptr]=value;; break;
    case 'i16': HEAP[ptr]=value;; break;
    case 'i32': HEAP[ptr]=value;; break;
    case 'i64': HEAP[ptr]=value;; break;
    case 'float': HEAP[ptr]=value;; break;
    case 'double': HEAP[ptr]=value;; break;
    default: abort('invalid type for setValue: ' + type);
  }
}
Module['setValue'] = setValue;

// Parallel to setValue.

function getValue(ptr, type) {
  if (type[type.length-1] === '*') type = 'i32'; // pointers are 32-bit
  switch(type) {
    case 'i1': return HEAP[ptr];
    case 'i8': return HEAP[ptr];
    case 'i16': return HEAP[ptr];
    case 'i32': return HEAP[ptr];
    case 'i64': return HEAP[ptr];
    case 'float': return HEAP[ptr];
    case 'double': return HEAP[ptr];
    default: abort('invalid type for setValue: ' + type);
  }
  return null;
}
Module['getValue'] = getValue;

// Allocates memory for some data and initializes it properly.

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;

function allocate(slab, types, allocator) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, 1));

  var singleType = typeof types === 'string' ? types : null;

  var i = 0, type;
  while (i < size) {
    var curr = zeroinit ? 0 : slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    setValue(ret+i, curr, type);
    i += Runtime.getNativeTypeSize(type);
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr) {
  var ret = "";
  var i = 0;
  var t;
  var nullByte = String.fromCharCode(0);
  while (1) {
    t = String.fromCharCode(HEAP[ptr+i]);
    if (t == nullByte) { break; } else {}
    ret += t;
    i += 1;
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

function Array_stringify(array) {
  var ret = "";
  for (var i = 0; i < array.length; i++) {
    ret += String.fromCharCode(array[i]);
  }
  return ret;
}
Module['Array_stringify'] = Array_stringify;

// Memory management

var FUNCTION_TABLE; // XXX: In theory the indexes here can be equal to pointers to stacked or malloced memory. Such comparisons should
                    //      be false, but can turn out true. We should probably set the top bit to prevent such issues.

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return Math.ceil(x/PAGE_SIZE)*PAGE_SIZE;
}

var HEAP;

var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;

var HAS_TYPED_ARRAYS = false;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 52428800;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

// Initialize the runtime's memory
{
  // Make sure that our HEAP is implemented as a flat array.
  HEAP = new Array(TOTAL_MEMORY);
  for (var i = 0; i < FAST_MEMORY; i++) {
    HEAP[i] = 0; // XXX We do *not* use {{| makeSetValue(0, 'i', 0, 'null') |}} here, since this is done just to optimize runtime speed
  }
}

var base = intArrayFromString('(null)'); // So printing %s of NULL gives '(null)'
                                         // Also this ensures we leave 0 as an invalid address, 'NULL'
for (var i = 0; i < base.length; i++) {
  HEAP[i]=base[i];
}

Module['HEAP'] = HEAP;

STACK_ROOT = STACKTOP = alignMemoryPage(10);
var TOTAL_STACK = 1024*1024; // XXX: Changing this value can lead to bad perf on v8!
STACK_MAX = STACK_ROOT + TOTAL_STACK;

STATICTOP = alignMemoryPage(STACK_MAX);

function __shutdownRuntime__() {
  while(__ATEXIT__.length > 0) {
    var atexit = __ATEXIT__.pop();
    var func = atexit.func;
    if (typeof func === 'number') {
      func = FUNCTION_TABLE[func];
    }
    func(atexit.arg === undefined ? null : atexit.arg);
  }

  // allow browser to GC, set heaps to null?

  // Print summary of correction activity
  CorrectionsMonitor.print();
}


// Copies a list of num items on the HEAP into a
// a normal JavaScript array of numbers
function Array_copy(ptr, num) {
  // TODO: In the SAFE_HEAP case, do some reading here, for debugging purposes - currently this is an 'unnoticed read'.
  return HEAP.slice(ptr, ptr+num);
}
Module['Array_copy'] = Array_copy;

function String_len(ptr) {
  var i = 0;
  while (HEAP[ptr+i]) i++; // Note: should be |!= 0|, technically. But this helps catch bugs with undefineds
  return i;
}
Module['String_len'] = String_len;

// Copies a C-style string, terminated by a zero, from the HEAP into
// a normal JavaScript array of numbers
function String_copy(ptr, addZero) {
  var len = String_len(ptr);
  if (addZero) len++;
  var ret = Array_copy(ptr, len);
  if (addZero) ret[len-1] = 0;
  return ret;
}
Module['String_copy'] = String_copy;

// Tools

if (typeof console === 'object' && typeof console.log === 'function') {
  this['print'] = function(x) { console.log(x) }; // web console
} else if (typeof print === 'undefined') {
  this['print'] = function(){}; // harmless no-op
}

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull) {
  var ret = [];
  var t;
  var i = 0;
  while (i < stringy.length) {
    var chr = stringy.charCodeAt(i);
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + stringy[i] + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(chr);
    i = i + 1;
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
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
  // TODO: clean up previous line
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// === Body ===



Runtime.QUANTUM_SIZE = 4
var $struct_BoneTransform___SIZE = 48; // %struct.BoneTransform
  
var $struct_CalBase4___SIZE = 16; // %struct.CalBase4
  
var $struct_CalPoint4___SIZE = 16; // %struct.CalPoint4
  
var $struct_CalVector4___SIZE = 16; // %struct.CalVector4
  
var $struct_Influence___SIZE = 12; // %struct.Influence
  
var $struct_Vertex___SIZE = 32; // %struct.Vertex
  
var __str;

  
  function _memset(ptr, value, num) {
      for (var $mspi$ = 0; $mspi$ < num; $mspi$++) {
  HEAP[ptr+$mspi$]=value;
  }
    }var _llvm_memset_p0i8_i32=_memset;

  function _clock() {
      if (_clock.start === undefined) _clock.start = Date.now();
      return Math.floor((Date.now() - _clock.start) * (1000/1000));
    }

  
  
  
  
  var ERRNO_CODES={E2BIG: 7, EACCES: 13, EADDRINUSE: 98, EADDRNOTAVAIL: 99, EAFNOSUPPORT: 97, EAGAIN: 11, EALREADY: 114, EBADF: 9, EBADMSG: 74, EBUSY: 16, ECANCELED: 125, ECHILD: 10, ECONNABORTED: 103, ECONNREFUSED: 111, ECONNRESET: 104, EDEADLK: 35, EDESTADDRREQ: 89, EDOM: 33, EDQUOT: 122, EEXIST: 17, EFAULT: 14, EFBIG: 27, EHOSTUNREACH: 113, EIDRM: 43, EILSEQ: 84, EINPROGRESS: 115, EINTR: 4, EINVAL: 22, EIO: 5, EISCONN: 106, EISDIR: 21, ELOOP: 40, EMFILE: 24, EMLINK: 31, EMSGSIZE: 90, EMULTIHOP: 72, ENAMETOOLONG: 36, ENETDOWN: 100, ENETRESET: 102, ENETUNREACH: 101, ENFILE: 23, ENOBUFS: 105, ENODATA: 61, ENODEV: 19, ENOENT: 2, ENOEXEC: 8, ENOLCK: 37, ENOLINK: 67, ENOMEM: 12, ENOMSG: 42, ENOPROTOOPT: 92, ENOSPC: 28, ENOSR: 63, ENOSTR: 60, ENOSYS: 38, ENOTCONN: 107, ENOTDIR: 20, ENOTEMPTY: 39, ENOTRECOVERABLE: 131, ENOTSOCK: 88, ENOTSUP: 95, ENOTTY: 25, ENXIO: 6, EOVERFLOW: 75, EOWNERDEAD: 130, EPERM: 1, EPIPE: 32, EPROTO: 71, EPROTONOSUPPORT: 93, EPROTOTYPE: 91, ERANGE: 34, EROFS: 30, ESPIPE: 29, ESRCH: 3, ESTALE: 116, ETIME: 62, ETIMEDOUT: 110, ETXTBSY: 26, EWOULDBLOCK: 11, EXDEV: 18 };
  
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP[___setErrNo.ret]=value;
      return value;
    }
  
  var _stdin=0;
  
  var _stdout=0;
  
  var _stderr=0;
  
  var __impure_ptr=0;var FS={currentPath: "/", nextInode: 2, streams: [null], ignorePermissions: true, absolutePath: function (relative, base) {
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
      }, analyzePath: function (path, dontResolveLastLink, linksVisited) {
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
              return FS.analyzePath([link].concat(path).join('/'),
                                    dontResolveLastLink, linksVisited + 1);
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
          return ret;
        }
        return ret;
      }, findObject: function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      }, createObject: function (parent, name, properties, canRead, canWrite) {
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
      }, createFolder: function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      }, createPath: function (parent, path, canRead, canWrite) {
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
      }, createFile: function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      }, createDataFile: function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = [];
          for (var i = 0; i < data.length; i++) dataArray.push(data.charCodeAt(i));
          data = dataArray;
        }
        var properties = {isDevice: false, contents: data};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      }, createLazyFile: function (parent, name, url, canRead, canWrite) {
        var properties = {isDevice: false, url: url};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      }, createLink: function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      }, createDevice: function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      }, forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          // Browser.
          // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
          var xhr = new XMLHttpRequest();
          xhr.open('GET', obj.url, false);
  
          // Some hints to the browser that we want binary data.
          if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
          if (xhr.overrideMimeType) {
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
          }
  
          xhr.send(null);
          if (xhr.status != 200 && xhr.status != 0) success = false;
          if (xhr.response !== undefined) {
            obj.contents = new Uint8Array(xhr.response || []);
          } else {
            obj.contents = intArrayFromString(xhr.responseText || '', true);
          }
        } else if (typeof read !== 'undefined') {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(read(obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      }, ensureRoot: function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: false,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      }, init: function (input, output, error) {
        // Make sure we initialize only once.
        if (FS.init.initialized) return;
        FS.init.initialized = true;
  
        FS.ensureRoot();
  
        // Default handlers.
        if (!input) input = function() {
          if (!input.cache || !input.cache.length) {
            var result;
            if (typeof window != 'undefined' &&
                typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
            }
            if (!result) result = '';
            input.cache = intArrayFromString(result + '\n', true);
          }
          return input.cache.shift();
        };
        if (!output) output = function(val) {
          if (val === null || val === '\n'.charCodeAt(0)) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(String.fromCharCode(val));
          }
        };
        if (!output.printer) output.printer = print;
        if (!output.buffer) output.buffer = [];
        if (!error) error = output;
  
        // Create the temporary folder.
        FS.createFolder('/', 'tmp', true, true);
  
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, false);
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
          error: false,
          eof: false,
          ungotten: []
        };
        _stdin = allocate([1], 'void*', ALLOC_STATIC);
        _stdout = allocate([2], 'void*', ALLOC_STATIC);
        _stderr = allocate([3], 'void*', ALLOC_STATIC);
  
        // Newlib initialization
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        __impure_ptr = allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_STATIC);
  
        // Once initialized, permissions start having effect.
        FS.ignorePermissions = false;
      }, quit: function () {
        // Flush any partially-printed lines in stdout and stderr
        if (FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output('\n'.charCodeAt(0));
        if (FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output('\n'.charCodeAt(0));
      } };
  
  
  
  
  
  
  
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
          contents[offset + i] = HEAP[buf+i];
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
                stream.object.output(HEAP[buf+i]);
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
        return -1;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  
  function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      var getNextArg = function(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'float' || type === 'double') {
          ret = HEAP[varargs+argIndex];
        } else {
          ret = HEAP[varargs+argIndex];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return Number(ret);
      };
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP[textIndex];
        if (curr === 0) break;
        next = HEAP[textIndex+1];
        if (curr == '%'.charCodeAt(0)) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case '+'.charCodeAt(0):
                flagAlwaysSigned = true;
                break;
              case '-'.charCodeAt(0):
                flagLeftAlign = true;
                break;
              case '#'.charCodeAt(0):
                flagAlternative = true;
                break;
              case '0'.charCodeAt(0):
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
            next = HEAP[textIndex+1];
          }
  
          // Handle width.
          var width = 0;
          if (next == '*'.charCodeAt(0)) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP[textIndex+1];
          } else {
            while (next >= '0'.charCodeAt(0) && next <= '9'.charCodeAt(0)) {
              width = width * 10 + (next - '0'.charCodeAt(0));
              textIndex++;
              next = HEAP[textIndex+1];
            }
          }
  
          // Handle precision.
          var precisionSet = false;
          if (next == '.'.charCodeAt(0)) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP[textIndex+1];
            if (next == '*'.charCodeAt(0)) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP[textIndex+1];
                if (precisionChr < '0'.charCodeAt(0) ||
                    precisionChr > '9'.charCodeAt(0)) break;
                precision = precision * 10 + (precisionChr - '0'.charCodeAt(0));
                textIndex++;
              }
            }
            next = HEAP[textIndex+1];
          } else {
            var precision = 6; // Standard default.
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP[textIndex+2];
              if (nextNext == 'h'.charCodeAt(0)) {
                textIndex++;
                argSize = 1; // char
              } else {
                argSize = 2; // short
              }
              break;
            case 'l':
              var nextNext = HEAP[textIndex+2];
              if (nextNext == 'l'.charCodeAt(0)) {
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
              argSize = undefined;
          }
          if (argSize !== undefined) textIndex++;
          next = HEAP[textIndex+1];
  
          // Handle type specifier.
          if (['d', 'i', 'u', 'o', 'x', 'X', 'p'].indexOf(String.fromCharCode(next)) != -1) {
            // Integer.
            var signed = next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0);
            argSize = argSize || 4;
            var currArg = getNextArg('i' + (argSize * 8));
            // Truncate to requested size.
            if (argSize <= 4) {
              var limit = Math.pow(256, argSize) - 1;
              currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
            }
            // Format the number.
            var currAbsArg = Math.abs(currArg);
            var argText;
            var prefix = '';
            if (next == 'd'.charCodeAt(0) || next == 'i'.charCodeAt(0)) {
              argText = reSign(currArg, 8 * argSize, 1).toString(10);
            } else if (next == 'u'.charCodeAt(0)) {
              argText = unSign(currArg, 8 * argSize, 1).toString(10);
              currArg = Math.abs(currArg);
            } else if (next == 'o'.charCodeAt(0)) {
              argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
            } else if (next == 'x'.charCodeAt(0) || next == 'X'.charCodeAt(0)) {
              prefix = flagAlternative ? '0x' : '';
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
              if (next == 'X'.charCodeAt(0)) {
                prefix = prefix.toUpperCase();
                argText = argText.toUpperCase();
              }
            } else if (next == 'p'.charCodeAt(0)) {
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
          } else if (['f', 'F', 'e', 'E', 'g', 'G'].indexOf(String.fromCharCode(next)) != -1) {
            // Float.
            var currArg = getNextArg(argSize === 4 ? 'float' : 'double');
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
              if (next == 'g'.charCodeAt(0) || next == 'G'.charCodeAt(0)) {
                isGeneral = true;
                precision = precision || 1;
                var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                if (precision > exponent && exponent >= -4) {
                  next = ((next == 'g'.charCodeAt(0)) ? 'f' : 'F').charCodeAt(0);
                  precision -= exponent + 1;
                } else {
                  next = ((next == 'g'.charCodeAt(0)) ? 'e' : 'E').charCodeAt(0);
                  precision--;
                }
                effectivePrecision = Math.min(precision, 20);
              }
  
              if (next == 'e'.charCodeAt(0) || next == 'E'.charCodeAt(0)) {
                argText = currArg.toExponential(effectivePrecision);
                // Make sure the exponent has at least 2 digits.
                if (/[eE][-+]\d$/.test(argText)) {
                  argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                }
              } else if (next == 'f'.charCodeAt(0) || next == 'F'.charCodeAt(0)) {
                argText = currArg.toFixed(effectivePrecision);
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
              if (next == 'E'.charCodeAt(0)) argText = argText.toUpperCase();
  
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
            if (next < 'a'.charCodeAt(0)) argText = argText.toUpperCase();
  
            // Insert the result into the buffer.
            argText.split('').forEach(function(chr) {
              ret.push(chr.charCodeAt(0));
            });
          } else if (next == 's'.charCodeAt(0)) {
            // String.
            var arg = getNextArg('i8*');
            var copiedString;
            if (arg) {
              copiedString = String_copy(arg);
              if (precisionSet && copiedString.length > precision) {
                copiedString = copiedString.slice(0, precision);
              }
            } else {
              copiedString = intArrayFromString('(null)', true);
            }
            if (!flagLeftAlign) {
              while (copiedString.length < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
            ret = ret.concat(copiedString);
            if (flagLeftAlign) {
              while (copiedString.length < width--) {
                ret.push(' '.charCodeAt(0));
              }
            }
          } else if (next == 'c'.charCodeAt(0)) {
            // Character.
            if (flagLeftAlign) ret.push(getNextArg('i8'));
            while (--width > 0) {
              ret.push(' '.charCodeAt(0));
            }
            if (!flagLeftAlign) ret.push(getNextArg('i8'));
          } else if (next == 'n'.charCodeAt(0)) {
            // Write the length written so far to the next parameter.
            var ptr = getNextArg('i32*');
            HEAP[ptr]=ret.length;
          } else if (next == '%'.charCodeAt(0)) {
            // Literal percent sign.
            ret.push(curr);
          } else {
            // Unknown specifiers remain untouched.
            for (var i = startTextIndex; i < textIndex + 2; i++) {
              ret.push(HEAP[i]);
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
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP[_stdout];
      return _fprintf(stdout, format, varargs);
    }


  function _malloc(size) { var ret = STATICTOP; assert(size > 0, "Trying to allocate 0"); STATICTOP += size;STATICTOP = Math.ceil((STATICTOP)/4)*4;; return ret; }

  function _free(){}

  function __Z31calculateVerticesAndNormals_x87PK13BoneTransformiPK6VertexPK9InfluenceP10CalVector4($boneTransforms, $vertexCount, $vertices, $influences, $output_vertex) {
    var __stackBase__  = STACKTOP; STACKTOP += 68; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 68);
    var __label__;
    __label__ = -1; 
    while(1) switch(__label__) {
      case -1: // $0
        var $1=__stackBase__;
        var $2=__stackBase__+4;
        var $3=__stackBase__+8;
        var $4=__stackBase__+12;
        var $5=__stackBase__+16;
        var $total_transform=__stackBase__+20;
        HEAP[$1]=$boneTransforms;
        HEAP[$2]=$vertexCount;
        HEAP[$3]=$vertices;
        HEAP[$4]=$influences;
        HEAP[$5]=$output_vertex;
        __ZN13BoneTransformC1Ev($total_transform);
        __label__ = 1; break;
      case 1: // $6
        var $7=HEAP[$2];
        var $8=((($7)-1)&4294967295);
        HEAP[$2]=$8;
        var $9=((($7))|0)!=0;
        if ($9) { __label__ = 2; break; } else { __label__ = 6; break; }
      case 2: // $10
        var $11=HEAP[$4];
        var $12=(($11)&4294967295);
        var $13=HEAP[$12];
        var $14=HEAP[$1];
        var $15=(($14+$13*48)&4294967295);
        var $16=HEAP[$4];
        var $17=(($16+4)&4294967295);
        var $18=HEAP[$17];
        __Z11ScaleMatrixR13BoneTransformRKS_f($total_transform, $15, $18);
        __label__ = 3; break;
      case 3: // $19
        var $20=HEAP[$4];
        var $21=(($20+12)&4294967295);
        HEAP[$4]=$21;
        var $22=(($20+8)&4294967295);
        var $23=HEAP[$22];
        var $24=((($23))|0)!=0;
        var $25=($24) ^ 1;
        if ($25) { __label__ = 4; break; } else { __label__ = 5; break; }
      case 4: // $26
        var $27=HEAP[$4];
        var $28=(($27)&4294967295);
        var $29=HEAP[$28];
        var $30=HEAP[$1];
        var $31=(($30+$29*48)&4294967295);
        var $32=HEAP[$4];
        var $33=(($32+4)&4294967295);
        var $34=HEAP[$33];
        __Z15AddScaledMatrixR13BoneTransformRKS_f($total_transform, $31, $34);
        __label__ = 3; break;
      case 5: // $35
        var $36=HEAP[$5];
        var $37=(($36)&4294967295);
        var $38=HEAP[$3];
        var $39=(($38)&4294967295);
        var $40=$39;
        __Z14TransformPointR10CalVector4RK13BoneTransformRK8CalBase4($37, $total_transform, $40);
        var $41=HEAP[$5];
        var $42=(($41+16)&4294967295);
        var $43=HEAP[$3];
        var $44=(($43+16)&4294967295);
        var $45=$44;
        __Z15TransformVectorR10CalVector4RK13BoneTransformRK8CalBase4($42, $total_transform, $45);
        var $46=HEAP[$3];
        var $47=(($46+32)&4294967295);
        HEAP[$3]=$47;
        var $48=HEAP[$5];
        var $49=(($48+32)&4294967295);
        HEAP[$5]=$49;
        __label__ = 1; break;
      case 6: // $50
        STACKTOP = __stackBase__;
        return;
      default: assert(0, "bad label: " + __label__);
    }
  }
  

  function __ZN13BoneTransformC1Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    __ZN13BoneTransformC2Ev($2);
    STACKTOP = __stackBase__;
    return;
  }
  

  function __Z11ScaleMatrixR13BoneTransformRKS_f($result, $mat, $s) {
    var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 12);
    var __label__;
  
    var $1=__stackBase__;
    var $2=__stackBase__+4;
    var $3=__stackBase__+8;
    HEAP[$1]=$result;
    HEAP[$2]=$mat;
    HEAP[$3]=$s;
    var $4=HEAP[$3];
    var $5=HEAP[$2];
    var $6=(($5)&4294967295);
    var $7=$6;
    var $8=(($7)&4294967295);
    var $9=HEAP[$8];
    var $10=($4)*($9);
    var $11=HEAP[$1];
    var $12=(($11)&4294967295);
    var $13=$12;
    var $14=(($13)&4294967295);
    HEAP[$14]=$10;
    var $15=HEAP[$3];
    var $16=HEAP[$2];
    var $17=(($16)&4294967295);
    var $18=$17;
    var $19=(($18+4)&4294967295);
    var $20=HEAP[$19];
    var $21=($15)*($20);
    var $22=HEAP[$1];
    var $23=(($22)&4294967295);
    var $24=$23;
    var $25=(($24+4)&4294967295);
    HEAP[$25]=$21;
    var $26=HEAP[$3];
    var $27=HEAP[$2];
    var $28=(($27)&4294967295);
    var $29=$28;
    var $30=(($29+8)&4294967295);
    var $31=HEAP[$30];
    var $32=($26)*($31);
    var $33=HEAP[$1];
    var $34=(($33)&4294967295);
    var $35=$34;
    var $36=(($35+8)&4294967295);
    HEAP[$36]=$32;
    var $37=HEAP[$3];
    var $38=HEAP[$2];
    var $39=(($38)&4294967295);
    var $40=$39;
    var $41=(($40+12)&4294967295);
    var $42=HEAP[$41];
    var $43=($37)*($42);
    var $44=HEAP[$1];
    var $45=(($44)&4294967295);
    var $46=$45;
    var $47=(($46+12)&4294967295);
    HEAP[$47]=$43;
    var $48=HEAP[$3];
    var $49=HEAP[$2];
    var $50=(($49+16)&4294967295);
    var $51=$50;
    var $52=(($51)&4294967295);
    var $53=HEAP[$52];
    var $54=($48)*($53);
    var $55=HEAP[$1];
    var $56=(($55+16)&4294967295);
    var $57=$56;
    var $58=(($57)&4294967295);
    HEAP[$58]=$54;
    var $59=HEAP[$3];
    var $60=HEAP[$2];
    var $61=(($60+16)&4294967295);
    var $62=$61;
    var $63=(($62+4)&4294967295);
    var $64=HEAP[$63];
    var $65=($59)*($64);
    var $66=HEAP[$1];
    var $67=(($66+16)&4294967295);
    var $68=$67;
    var $69=(($68+4)&4294967295);
    HEAP[$69]=$65;
    var $70=HEAP[$3];
    var $71=HEAP[$2];
    var $72=(($71+16)&4294967295);
    var $73=$72;
    var $74=(($73+8)&4294967295);
    var $75=HEAP[$74];
    var $76=($70)*($75);
    var $77=HEAP[$1];
    var $78=(($77+16)&4294967295);
    var $79=$78;
    var $80=(($79+8)&4294967295);
    HEAP[$80]=$76;
    var $81=HEAP[$3];
    var $82=HEAP[$2];
    var $83=(($82+16)&4294967295);
    var $84=$83;
    var $85=(($84+12)&4294967295);
    var $86=HEAP[$85];
    var $87=($81)*($86);
    var $88=HEAP[$1];
    var $89=(($88+16)&4294967295);
    var $90=$89;
    var $91=(($90+12)&4294967295);
    HEAP[$91]=$87;
    var $92=HEAP[$3];
    var $93=HEAP[$2];
    var $94=(($93+32)&4294967295);
    var $95=$94;
    var $96=(($95)&4294967295);
    var $97=HEAP[$96];
    var $98=($92)*($97);
    var $99=HEAP[$1];
    var $100=(($99+32)&4294967295);
    var $101=$100;
    var $102=(($101)&4294967295);
    HEAP[$102]=$98;
    var $103=HEAP[$3];
    var $104=HEAP[$2];
    var $105=(($104+32)&4294967295);
    var $106=$105;
    var $107=(($106+4)&4294967295);
    var $108=HEAP[$107];
    var $109=($103)*($108);
    var $110=HEAP[$1];
    var $111=(($110+32)&4294967295);
    var $112=$111;
    var $113=(($112+4)&4294967295);
    HEAP[$113]=$109;
    var $114=HEAP[$3];
    var $115=HEAP[$2];
    var $116=(($115+32)&4294967295);
    var $117=$116;
    var $118=(($117+8)&4294967295);
    var $119=HEAP[$118];
    var $120=($114)*($119);
    var $121=HEAP[$1];
    var $122=(($121+32)&4294967295);
    var $123=$122;
    var $124=(($123+8)&4294967295);
    HEAP[$124]=$120;
    var $125=HEAP[$3];
    var $126=HEAP[$2];
    var $127=(($126+32)&4294967295);
    var $128=$127;
    var $129=(($128+12)&4294967295);
    var $130=HEAP[$129];
    var $131=($125)*($130);
    var $132=HEAP[$1];
    var $133=(($132+32)&4294967295);
    var $134=$133;
    var $135=(($134+12)&4294967295);
    HEAP[$135]=$131;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __Z15AddScaledMatrixR13BoneTransformRKS_f($result, $mat, $s) {
    var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 12);
    var __label__;
  
    var $1=__stackBase__;
    var $2=__stackBase__+4;
    var $3=__stackBase__+8;
    HEAP[$1]=$result;
    HEAP[$2]=$mat;
    HEAP[$3]=$s;
    var $4=HEAP[$3];
    var $5=HEAP[$2];
    var $6=(($5)&4294967295);
    var $7=$6;
    var $8=(($7)&4294967295);
    var $9=HEAP[$8];
    var $10=($4)*($9);
    var $11=HEAP[$1];
    var $12=(($11)&4294967295);
    var $13=$12;
    var $14=(($13)&4294967295);
    var $15=HEAP[$14];
    var $16=($15)+($10);
    HEAP[$14]=$16;
    var $17=HEAP[$3];
    var $18=HEAP[$2];
    var $19=(($18)&4294967295);
    var $20=$19;
    var $21=(($20+4)&4294967295);
    var $22=HEAP[$21];
    var $23=($17)*($22);
    var $24=HEAP[$1];
    var $25=(($24)&4294967295);
    var $26=$25;
    var $27=(($26+4)&4294967295);
    var $28=HEAP[$27];
    var $29=($28)+($23);
    HEAP[$27]=$29;
    var $30=HEAP[$3];
    var $31=HEAP[$2];
    var $32=(($31)&4294967295);
    var $33=$32;
    var $34=(($33+8)&4294967295);
    var $35=HEAP[$34];
    var $36=($30)*($35);
    var $37=HEAP[$1];
    var $38=(($37)&4294967295);
    var $39=$38;
    var $40=(($39+8)&4294967295);
    var $41=HEAP[$40];
    var $42=($41)+($36);
    HEAP[$40]=$42;
    var $43=HEAP[$3];
    var $44=HEAP[$2];
    var $45=(($44)&4294967295);
    var $46=$45;
    var $47=(($46+12)&4294967295);
    var $48=HEAP[$47];
    var $49=($43)*($48);
    var $50=HEAP[$1];
    var $51=(($50)&4294967295);
    var $52=$51;
    var $53=(($52+12)&4294967295);
    var $54=HEAP[$53];
    var $55=($54)+($49);
    HEAP[$53]=$55;
    var $56=HEAP[$3];
    var $57=HEAP[$2];
    var $58=(($57+16)&4294967295);
    var $59=$58;
    var $60=(($59)&4294967295);
    var $61=HEAP[$60];
    var $62=($56)*($61);
    var $63=HEAP[$1];
    var $64=(($63+16)&4294967295);
    var $65=$64;
    var $66=(($65)&4294967295);
    var $67=HEAP[$66];
    var $68=($67)+($62);
    HEAP[$66]=$68;
    var $69=HEAP[$3];
    var $70=HEAP[$2];
    var $71=(($70+16)&4294967295);
    var $72=$71;
    var $73=(($72+4)&4294967295);
    var $74=HEAP[$73];
    var $75=($69)*($74);
    var $76=HEAP[$1];
    var $77=(($76+16)&4294967295);
    var $78=$77;
    var $79=(($78+4)&4294967295);
    var $80=HEAP[$79];
    var $81=($80)+($75);
    HEAP[$79]=$81;
    var $82=HEAP[$3];
    var $83=HEAP[$2];
    var $84=(($83+16)&4294967295);
    var $85=$84;
    var $86=(($85+8)&4294967295);
    var $87=HEAP[$86];
    var $88=($82)*($87);
    var $89=HEAP[$1];
    var $90=(($89+16)&4294967295);
    var $91=$90;
    var $92=(($91+8)&4294967295);
    var $93=HEAP[$92];
    var $94=($93)+($88);
    HEAP[$92]=$94;
    var $95=HEAP[$3];
    var $96=HEAP[$2];
    var $97=(($96+16)&4294967295);
    var $98=$97;
    var $99=(($98+12)&4294967295);
    var $100=HEAP[$99];
    var $101=($95)*($100);
    var $102=HEAP[$1];
    var $103=(($102+16)&4294967295);
    var $104=$103;
    var $105=(($104+12)&4294967295);
    var $106=HEAP[$105];
    var $107=($106)+($101);
    HEAP[$105]=$107;
    var $108=HEAP[$3];
    var $109=HEAP[$2];
    var $110=(($109+32)&4294967295);
    var $111=$110;
    var $112=(($111)&4294967295);
    var $113=HEAP[$112];
    var $114=($108)*($113);
    var $115=HEAP[$1];
    var $116=(($115+32)&4294967295);
    var $117=$116;
    var $118=(($117)&4294967295);
    var $119=HEAP[$118];
    var $120=($119)+($114);
    HEAP[$118]=$120;
    var $121=HEAP[$3];
    var $122=HEAP[$2];
    var $123=(($122+32)&4294967295);
    var $124=$123;
    var $125=(($124+4)&4294967295);
    var $126=HEAP[$125];
    var $127=($121)*($126);
    var $128=HEAP[$1];
    var $129=(($128+32)&4294967295);
    var $130=$129;
    var $131=(($130+4)&4294967295);
    var $132=HEAP[$131];
    var $133=($132)+($127);
    HEAP[$131]=$133;
    var $134=HEAP[$3];
    var $135=HEAP[$2];
    var $136=(($135+32)&4294967295);
    var $137=$136;
    var $138=(($137+8)&4294967295);
    var $139=HEAP[$138];
    var $140=($134)*($139);
    var $141=HEAP[$1];
    var $142=(($141+32)&4294967295);
    var $143=$142;
    var $144=(($143+8)&4294967295);
    var $145=HEAP[$144];
    var $146=($145)+($140);
    HEAP[$144]=$146;
    var $147=HEAP[$3];
    var $148=HEAP[$2];
    var $149=(($148+32)&4294967295);
    var $150=$149;
    var $151=(($150+12)&4294967295);
    var $152=HEAP[$151];
    var $153=($147)*($152);
    var $154=HEAP[$1];
    var $155=(($154+32)&4294967295);
    var $156=$155;
    var $157=(($156+12)&4294967295);
    var $158=HEAP[$157];
    var $159=($158)+($153);
    HEAP[$157]=$159;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __Z14TransformPointR10CalVector4RK13BoneTransformRK8CalBase4($result, $m, $v) {
    var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 12);
    var __label__;
  
    var $1=__stackBase__;
    var $2=__stackBase__+4;
    var $3=__stackBase__+8;
    HEAP[$1]=$result;
    HEAP[$2]=$m;
    HEAP[$3]=$v;
    var $4=HEAP[$2];
    var $5=(($4)&4294967295);
    var $6=$5;
    var $7=(($6)&4294967295);
    var $8=HEAP[$7];
    var $9=HEAP[$3];
    var $10=(($9)&4294967295);
    var $11=HEAP[$10];
    var $12=($8)*($11);
    var $13=HEAP[$2];
    var $14=(($13)&4294967295);
    var $15=$14;
    var $16=(($15+4)&4294967295);
    var $17=HEAP[$16];
    var $18=HEAP[$3];
    var $19=(($18+4)&4294967295);
    var $20=HEAP[$19];
    var $21=($17)*($20);
    var $22=($12)+($21);
    var $23=HEAP[$2];
    var $24=(($23)&4294967295);
    var $25=$24;
    var $26=(($25+8)&4294967295);
    var $27=HEAP[$26];
    var $28=HEAP[$3];
    var $29=(($28+8)&4294967295);
    var $30=HEAP[$29];
    var $31=($27)*($30);
    var $32=($22)+($31);
    var $33=HEAP[$2];
    var $34=(($33)&4294967295);
    var $35=$34;
    var $36=(($35+12)&4294967295);
    var $37=HEAP[$36];
    var $38=($32)+($37);
    var $39=HEAP[$1];
    var $40=$39;
    var $41=(($40)&4294967295);
    HEAP[$41]=$38;
    var $42=HEAP[$2];
    var $43=(($42+16)&4294967295);
    var $44=$43;
    var $45=(($44)&4294967295);
    var $46=HEAP[$45];
    var $47=HEAP[$3];
    var $48=(($47)&4294967295);
    var $49=HEAP[$48];
    var $50=($46)*($49);
    var $51=HEAP[$2];
    var $52=(($51+16)&4294967295);
    var $53=$52;
    var $54=(($53+4)&4294967295);
    var $55=HEAP[$54];
    var $56=HEAP[$3];
    var $57=(($56+4)&4294967295);
    var $58=HEAP[$57];
    var $59=($55)*($58);
    var $60=($50)+($59);
    var $61=HEAP[$2];
    var $62=(($61+16)&4294967295);
    var $63=$62;
    var $64=(($63+8)&4294967295);
    var $65=HEAP[$64];
    var $66=HEAP[$3];
    var $67=(($66+8)&4294967295);
    var $68=HEAP[$67];
    var $69=($65)*($68);
    var $70=($60)+($69);
    var $71=HEAP[$2];
    var $72=(($71+16)&4294967295);
    var $73=$72;
    var $74=(($73+12)&4294967295);
    var $75=HEAP[$74];
    var $76=($70)+($75);
    var $77=HEAP[$1];
    var $78=$77;
    var $79=(($78+4)&4294967295);
    HEAP[$79]=$76;
    var $80=HEAP[$2];
    var $81=(($80+32)&4294967295);
    var $82=$81;
    var $83=(($82)&4294967295);
    var $84=HEAP[$83];
    var $85=HEAP[$3];
    var $86=(($85)&4294967295);
    var $87=HEAP[$86];
    var $88=($84)*($87);
    var $89=HEAP[$2];
    var $90=(($89+32)&4294967295);
    var $91=$90;
    var $92=(($91+4)&4294967295);
    var $93=HEAP[$92];
    var $94=HEAP[$3];
    var $95=(($94+4)&4294967295);
    var $96=HEAP[$95];
    var $97=($93)*($96);
    var $98=($88)+($97);
    var $99=HEAP[$2];
    var $100=(($99+32)&4294967295);
    var $101=$100;
    var $102=(($101+8)&4294967295);
    var $103=HEAP[$102];
    var $104=HEAP[$3];
    var $105=(($104+8)&4294967295);
    var $106=HEAP[$105];
    var $107=($103)*($106);
    var $108=($98)+($107);
    var $109=HEAP[$2];
    var $110=(($109+32)&4294967295);
    var $111=$110;
    var $112=(($111+12)&4294967295);
    var $113=HEAP[$112];
    var $114=($108)+($113);
    var $115=HEAP[$1];
    var $116=$115;
    var $117=(($116+8)&4294967295);
    HEAP[$117]=$114;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __Z15TransformVectorR10CalVector4RK13BoneTransformRK8CalBase4($result, $m, $v) {
    var __stackBase__  = STACKTOP; STACKTOP += 12; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 12);
    var __label__;
  
    var $1=__stackBase__;
    var $2=__stackBase__+4;
    var $3=__stackBase__+8;
    HEAP[$1]=$result;
    HEAP[$2]=$m;
    HEAP[$3]=$v;
    var $4=HEAP[$2];
    var $5=(($4)&4294967295);
    var $6=$5;
    var $7=(($6)&4294967295);
    var $8=HEAP[$7];
    var $9=HEAP[$3];
    var $10=(($9)&4294967295);
    var $11=HEAP[$10];
    var $12=($8)*($11);
    var $13=HEAP[$2];
    var $14=(($13)&4294967295);
    var $15=$14;
    var $16=(($15+4)&4294967295);
    var $17=HEAP[$16];
    var $18=HEAP[$3];
    var $19=(($18+4)&4294967295);
    var $20=HEAP[$19];
    var $21=($17)*($20);
    var $22=($12)+($21);
    var $23=HEAP[$2];
    var $24=(($23)&4294967295);
    var $25=$24;
    var $26=(($25+8)&4294967295);
    var $27=HEAP[$26];
    var $28=HEAP[$3];
    var $29=(($28+8)&4294967295);
    var $30=HEAP[$29];
    var $31=($27)*($30);
    var $32=($22)+($31);
    var $33=HEAP[$1];
    var $34=$33;
    var $35=(($34)&4294967295);
    HEAP[$35]=$32;
    var $36=HEAP[$2];
    var $37=(($36+16)&4294967295);
    var $38=$37;
    var $39=(($38)&4294967295);
    var $40=HEAP[$39];
    var $41=HEAP[$3];
    var $42=(($41)&4294967295);
    var $43=HEAP[$42];
    var $44=($40)*($43);
    var $45=HEAP[$2];
    var $46=(($45+16)&4294967295);
    var $47=$46;
    var $48=(($47+4)&4294967295);
    var $49=HEAP[$48];
    var $50=HEAP[$3];
    var $51=(($50+4)&4294967295);
    var $52=HEAP[$51];
    var $53=($49)*($52);
    var $54=($44)+($53);
    var $55=HEAP[$2];
    var $56=(($55+16)&4294967295);
    var $57=$56;
    var $58=(($57+8)&4294967295);
    var $59=HEAP[$58];
    var $60=HEAP[$3];
    var $61=(($60+8)&4294967295);
    var $62=HEAP[$61];
    var $63=($59)*($62);
    var $64=($54)+($63);
    var $65=HEAP[$1];
    var $66=$65;
    var $67=(($66+4)&4294967295);
    HEAP[$67]=$64;
    var $68=HEAP[$2];
    var $69=(($68+32)&4294967295);
    var $70=$69;
    var $71=(($70)&4294967295);
    var $72=HEAP[$71];
    var $73=HEAP[$3];
    var $74=(($73)&4294967295);
    var $75=HEAP[$74];
    var $76=($72)*($75);
    var $77=HEAP[$2];
    var $78=(($77+32)&4294967295);
    var $79=$78;
    var $80=(($79+4)&4294967295);
    var $81=HEAP[$80];
    var $82=HEAP[$3];
    var $83=(($82+4)&4294967295);
    var $84=HEAP[$83];
    var $85=($81)*($84);
    var $86=($76)+($85);
    var $87=HEAP[$2];
    var $88=(($87+32)&4294967295);
    var $89=$88;
    var $90=(($89+8)&4294967295);
    var $91=HEAP[$90];
    var $92=HEAP[$3];
    var $93=(($92+8)&4294967295);
    var $94=HEAP[$93];
    var $95=($91)*($94);
    var $96=($86)+($95);
    var $97=HEAP[$1];
    var $98=$97;
    var $99=(($98+8)&4294967295);
    HEAP[$99]=$96;
    STACKTOP = __stackBase__;
    return;
  }
  

  function _main() {
    var __stackBase__  = STACKTOP; STACKTOP += 760096; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 760096);
    var __label__;
    __label__ = -1; 
    while(1) switch(__label__) {
      case -1: // $0
        var $1=__stackBase__;
        var $N=__stackBase__+4;
        var $v=__stackBase__+8;
        var $2=__stackBase__+320008;
        var $i=__stackBase__+320012;
        var $3=__stackBase__+440012;
        var $k=__stackBase__+440016;
        var $bt=__stackBase__+440020;
        var $output=__stackBase__+440068;
        var $4=__stackBase__+760068;
        var $vertices_skinned=__stackBase__+760072;
        var $start=__stackBase__+760080;
        var $elapsed=__stackBase__+760084;
        var $sum=__stackBase__+760088;
        var $i1=__stackBase__+760092;
        HEAP[$1]=0;
        HEAP[$N]=10000;
        var $5=$v;
        HEAP[$2]=0;
        __label__ = 1; break;
      case 1: // $6
        var $7=HEAP[$2];
        var $8=((($7))>>>0) < 10000;
        if ($8) { __label__ = 2; break; } else { __label__ = 4; break; }
      case 2: // $9
        var $10=HEAP[$2];
        var $11=(($5+($10<<5))&4294967295);
        __ZN6VertexC1Ev($11);
        __label__ = 3; break;
      case 3: // $12
        var $13=HEAP[$2];
        var $14=((($13)+1)&4294967295);
        HEAP[$2]=$14;
        __label__ = 1; break;
      case 4: // $15
        var $16=$i;
        HEAP[$3]=0;
        __label__ = 5; break;
      case 5: // $17
        var $18=HEAP[$3];
        var $19=((($18))>>>0) < 10000;
        if ($19) { __label__ = 6; break; } else { __label__ = 8; break; }
      case 6: // $20
        var $21=HEAP[$3];
        var $22=(($16+$21*12)&4294967295);
        __ZN9InfluenceC1Ev($22);
        __label__ = 7; break;
      case 7: // $23
        var $24=HEAP[$3];
        var $25=((($24)+1)&4294967295);
        HEAP[$3]=$25;
        __label__ = 5; break;
      case 8: // $26
        HEAP[$k]=0;
        __label__ = 9; break;
      case 9: // $27
        var $28=HEAP[$k];
        var $29=((($28))|0) < 10000;
        if ($29) { __label__ = 10; break; } else { __label__ = 12; break; }
      case 10: // $30
        var $31=HEAP[$k];
        var $32=(($v+($31<<5))&4294967295);
        var $33=(($32)&4294967295);
        __ZN9CalPoint410setAsPointEfff($33, 1, 2, 3);
        var $34=HEAP[$k];
        var $35=(($v+($34<<5))&4294967295);
        var $36=(($35+16)&4294967295);
        __ZN10CalVector411setAsVectorEfff($36, 0, 0, 1);
        var $37=HEAP[$k];
        var $38=(($i+$37*12)&4294967295);
        var $39=(($38)&4294967295);
        HEAP[$39]=0;
        var $40=HEAP[$k];
        var $41=(($i+$40*12)&4294967295);
        var $42=(($41+4)&4294967295);
        HEAP[$42]=1;
        var $43=HEAP[$k];
        var $44=(($i+$43*12)&4294967295);
        var $45=(($44+8)&4294967295);
        HEAP[$45]=1;
        __label__ = 11; break;
      case 11: // $46
        var $47=HEAP[$k];
        var $48=((($47)+1)&4294967295);
        HEAP[$k]=$48;
        __label__ = 9; break;
      case 12: // $49
        __ZN13BoneTransformC1Ev($bt);
        var $50=$bt;
        for (var $mspi$ = 0; $mspi$ < 48; $mspi$++) {
        HEAP[$50+$mspi$]=0;
        };
        var $51=$output;
        HEAP[$4]=0;
        __label__ = 13; break;
      case 13: // $52
        var $53=HEAP[$4];
        var $54=((($53))>>>0) < 20000;
        if ($54) { __label__ = 14; break; } else { __label__ = 16; break; }
      case 14: // $55
        var $56=HEAP[$4];
        var $57=(($51+($56<<4))&4294967295);
        __ZN10CalVector4C1Ev($57);
        __label__ = 15; break;
      case 15: // $58
        var $59=HEAP[$4];
        var $60=((($59)+1)&4294967295);
        HEAP[$4]=$60;
        __label__ = 13; break;
      case 16: // $61
        HEAP[$vertices_skinned]=0;
        var $62=_clock();
        HEAP[$start]=$62;
        __label__ = 17; break;
      case 17: // $63
        var $64=_clock();
        var $65=HEAP[$start];
        var $66=((($65)+1000)&4294967295);
        var $67=((($64))>>>0) < ((($66))>>>0);
        if ($67) { __label__ = 18; break; } else { __label__ = 19; break; }
      case 18: // $68
        var $69=(($v)&4294967295);
        var $70=(($i)&4294967295);
        var $71=(($output)&4294967295);
        __Z31calculateVerticesAndNormals_x87PK13BoneTransformiPK6VertexPK9InfluenceP10CalVector4($bt, 10000, $69, $70, $71);
        var $72=HEAP[$vertices_skinned];
        var $73=($72)+10000;
        HEAP[$vertices_skinned]=$73;
        __label__ = 17; break;
      case 19: // $74
        var $75=_clock();
        var $76=HEAP[$start];
        var $77=((($75)-($76))&4294967295);
        HEAP[$elapsed]=$77;
        HEAP[$sum]=0;
        HEAP[$i1]=0;
        __label__ = 20; break;
      case 20: // $78
        var $79=HEAP[$i1];
        var $80=((($79))>>>0) < 20000;
        if ($80) { __label__ = 21; break; } else { __label__ = 23; break; }
      case 21: // $81
        var $82=HEAP[$i1];
        var $83=(($output+($82<<4))&4294967295);
        var $84=$83;
        var $85=(($84)&4294967295);
        var $86=HEAP[$85];
        var $87=HEAP[$i1];
        var $88=(($output+($87<<4))&4294967295);
        var $89=$88;
        var $90=(($89+4)&4294967295);
        var $91=HEAP[$90];
        var $92=($86)+($91);
        var $93=HEAP[$i1];
        var $94=(($output+($93<<4))&4294967295);
        var $95=$94;
        var $96=(($95+8)&4294967295);
        var $97=HEAP[$96];
        var $98=($92)+($97);
        var $99=HEAP[$i1];
        var $100=(($output+($99<<4))&4294967295);
        var $101=$100;
        var $102=(($101+12)&4294967295);
        var $103=HEAP[$102];
        var $104=($98)+($103);
        var $105=HEAP[$sum];
        var $106=($105)+($104);
        HEAP[$sum]=$106;
        __label__ = 22; break;
      case 22: // $107
        var $108=HEAP[$i1];
        var $109=((($108)+1)&4294967295);
        HEAP[$i1]=$109;
        __label__ = 20; break;
      case 23: // $110
        var $111=HEAP[$vertices_skinned];
        var $112=($111)*1000;
        var $113=HEAP[$elapsed];
        var $114=((($113))>>>0);
        var $115=cRound(reSign(($112), 64, 0)/reSign(($114), 64, 0));
        var $116=((($115)) & 4294967295);
        var $117=HEAP[$sum];
        var $118=($117);
        var $119=_printf(((__str)&4294967295), allocate([$116,0,0,0,$118,0,0,0,0,0,0,0], ["i32",0,0,0,"double",0,0,0,0,0,0,0], ALLOC_STACK));
        var $120=HEAP[$1];
        STACKTOP = __stackBase__;
        return $120;
      default: assert(0, "bad label: " + __label__);
    }
  }
  Module["_main"] = _main;

  function __ZN6VertexC1Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    __ZN6VertexC2Ev($2);
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN9InfluenceC1Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    __ZN9InfluenceC2Ev($2);
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN9CalPoint410setAsPointEfff($this, $x, $y, $z) {
    var __stackBase__  = STACKTOP; STACKTOP += 16; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 16);
    var __label__;
  
    var $1=__stackBase__;
    var $2=__stackBase__+4;
    var $3=__stackBase__+8;
    var $4=__stackBase__+12;
    HEAP[$1]=$this;
    HEAP[$2]=$x;
    HEAP[$3]=$y;
    HEAP[$4]=$z;
    var $5=HEAP[$1];
    var $6=$5;
    var $7=(($6)&4294967295);
    var $8=HEAP[$7];
    HEAP[$2]=$8;
    var $9=$5;
    var $10=(($9+4)&4294967295);
    var $11=HEAP[$10];
    HEAP[$3]=$11;
    var $12=$5;
    var $13=(($12+8)&4294967295);
    var $14=HEAP[$13];
    HEAP[$4]=$14;
    var $15=$5;
    var $16=(($15+12)&4294967295);
    HEAP[$16]=1;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN10CalVector411setAsVectorEfff($this, $x, $y, $z) {
    var __stackBase__  = STACKTOP; STACKTOP += 16; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 16);
    var __label__;
  
    var $1=__stackBase__;
    var $2=__stackBase__+4;
    var $3=__stackBase__+8;
    var $4=__stackBase__+12;
    HEAP[$1]=$this;
    HEAP[$2]=$x;
    HEAP[$3]=$y;
    HEAP[$4]=$z;
    var $5=HEAP[$1];
    var $6=HEAP[$2];
    var $7=$5;
    var $8=(($7)&4294967295);
    HEAP[$8]=$6;
    var $9=HEAP[$3];
    var $10=$5;
    var $11=(($10+4)&4294967295);
    HEAP[$11]=$9;
    var $12=HEAP[$4];
    var $13=$5;
    var $14=(($13+8)&4294967295);
    HEAP[$14]=$12;
    var $15=$5;
    var $16=(($15+12)&4294967295);
    HEAP[$16]=0;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN10CalVector4C1Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    __ZN10CalVector4C2Ev($2);
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN10CalVector4C2Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    var $3=$2;
    var $4=$2;
    var $5=(($4)&4294967295);
    HEAP[$5]=0;
    var $6=$2;
    var $7=(($6+4)&4294967295);
    HEAP[$7]=0;
    var $8=$2;
    var $9=(($8+8)&4294967295);
    HEAP[$9]=0;
    var $10=$2;
    var $11=(($10+12)&4294967295);
    HEAP[$11]=0;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN9InfluenceC2Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    var $3=(($2)&4294967295);
    HEAP[$3]=-1;
    var $4=(($2+4)&4294967295);
    HEAP[$4]=0;
    var $5=(($2+8)&4294967295);
    HEAP[$5]=0;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN6VertexC2Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    var $3=(($2)&4294967295);
    __ZN9CalPoint4C1Ev($3);
    var $4=(($2+16)&4294967295);
    __ZN10CalVector4C1Ev($4);
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN9CalPoint4C1Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    __ZN9CalPoint4C2Ev($2);
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN9CalPoint4C2Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    var $3=$2;
    var $4=$2;
    var $5=(($4)&4294967295);
    HEAP[$5]=0;
    var $6=$2;
    var $7=(($6+4)&4294967295);
    HEAP[$7]=0;
    var $8=$2;
    var $9=(($8+8)&4294967295);
    HEAP[$9]=0;
    var $10=$2;
    var $11=(($10+12)&4294967295);
    HEAP[$11]=1;
    STACKTOP = __stackBase__;
    return;
  }
  

  function __ZN13BoneTransformC2Ev($this) {
    var __stackBase__  = STACKTOP; STACKTOP += 4; assert(STACKTOP < STACK_MAX); _memset(__stackBase__, 0, 4);
    var __label__;
  
    var $1=__stackBase__;
    HEAP[$1]=$this;
    var $2=HEAP[$1];
    var $3=(($2)&4294967295);
    __ZN10CalVector4C1Ev($3);
    var $4=(($2+16)&4294967295);
    __ZN10CalVector4C1Ev($4);
    var $5=(($2+32)&4294967295);
    __ZN10CalVector4C1Ev($5);
    STACKTOP = __stackBase__;
    return;
  }
  

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

  return _main(argc, argv, 0);
}

function run(args) {
  args = args || Module['arguments'];


__str=allocate([83,107,105,110,110,101,100,32,118,101,114,116,105,99,101,115,32,112,101,114,32,115,101,99,111,110,100,58,32,37,100,44,32,98,108,97,104,61,37,102,10,0] /* Skinned vertices per */, "i8", ALLOC_STATIC);
FS.init(); __ATEXIT__.push({ func: function() { FS.quit() } });
___setErrNo(0);
FUNCTION_TABLE = [0,0]; Module["FUNCTION_TABLE"] = FUNCTION_TABLE;


  __globalConstructor__();

  var ret = null;
  if (Module['_main']) {
    ret = Module.callMain(args);
    __shutdownRuntime__();
  }
  return ret;
}
Module['run'] = run;

// {{PRE_RUN_ADDITIONS}}


if (!Module['noInitialRun']) {
  run();
}

// {{POST_RUN_ADDITIONS}}





  // {{MODULE_ADDITIONS}}

/*
  return Module;
}).call(this, {}, arguments); // Replace parameters as needed
*/


// EMSCRIPTEN_GENERATED_FUNCTIONS: ["__Z31calculateVerticesAndNormals_x87PK13BoneTransformiPK6VertexPK9InfluenceP10CalVector4","__ZN13BoneTransformC1Ev","__Z11ScaleMatrixR13BoneTransformRKS_f","__Z15AddScaledMatrixR13BoneTransformRKS_f","__Z14TransformPointR10CalVector4RK13BoneTransformRK8CalBase4","__Z15TransformVectorR10CalVector4RK13BoneTransformRK8CalBase4","_main","__ZN6VertexC1Ev","__ZN9InfluenceC1Ev","__ZN9CalPoint410setAsPointEfff","__ZN10CalVector411setAsVectorEfff","__ZN10CalVector4C1Ev","__ZN10CalVector4C2Ev","__ZN9InfluenceC2Ev","__ZN6VertexC2Ev","__ZN9CalPoint4C1Ev","__ZN9CalPoint4C2Ev","__ZN13BoneTransformC2Ev"]

