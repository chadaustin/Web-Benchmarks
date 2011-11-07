var d = void 0, n = true, o = null, q = false;
this.Module || (this.Module = {});
if(!Module.arguments) {
  try {
    Module.arguments = scriptArgs
  }catch(aa) {
    try {
      Module.arguments = arguments
    }catch(ba) {
      Module.arguments = []
    }
  }
}
var u = {T:function() {
  return t
}, S:function(a) {
  t = a
}, Z:function(a, b) {
  b = b || 1;
  return isNumber(a) && isNumber(b) ? Math.ceil(a / b) * b : "Math.ceil((" + a + ")/" + b + ")*" + b
}, q:function(a) {
  return a in u.B || a in u.A
}, M:function(a) {
  return pointingLevels(a) > 0
}, O:function(a) {
  return isPointerType(a) ? q : RegExp(/^\[\d+\ x\ (.*)\]/g).test(a) ? n : RegExp(/<?{ [^}]* }>?/g).test(a) ? n : !u.q(a) && a[0] == "%"
}, B:{i1:0, i8:0, i16:0, i32:0, i64:0}, A:{"float":0, "double":0}, ca:function(a, b) {
  return(a | 0 | b | 0) + (Math.round(a / 4294967296) | Math.round(b / 4294967296)) * 4294967296
}, Y:function(a, b) {
  return((a | 0) & (b | 0)) + (Math.round(a / 4294967296) & Math.round(b / 4294967296)) * 4294967296
}, ha:function(a, b) {
  return((a | 0) ^ (b | 0)) + (Math.round(a / 4294967296) ^ Math.round(b / 4294967296)) * 4294967296
}, K:function() {
  return Math.max(1, 1)
}, aa:function() {
  return 1
}, G:function(a, b) {
  var c = {};
  return b ? a.filter(function(a) {
    return c[a[b]] ? q : c[a[b]] = n
  }) : a.filter(function(a) {
    return c[a] ? q : c[a] = n
  })
}, set:function() {
  for(var a = typeof arguments[0] === "object" ? arguments[0] : arguments, b = {}, c = 0;c < a.length;c++) {
    b[a[c]] = 0
  }
  return b
}, D:function(a) {
  a.b = 0;
  a.e = 0;
  var b = [], c = -1;
  a.o = a.k.map(function(e) {
    var g, h;
    u.q(e) || u.M(e) ? h = g = 1 : u.O(e) ? (g = Types.types[e].b, h = Types.types[e].e) : (dprint("Unclear type in struct: " + e + ", in " + a.P + " :: " + dump(Types.types[a.P])), w("Assertion failed: undefined"));
    h = a.da ? 1 : Math.min(h, 1);
    a.e = Math.max(a.e, h);
    e = u.l(a.b, h);
    a.b = e + g;
    c >= 0 && b.push(e - c);
    return c = e
  });
  a.b = u.l(a.b, a.e);
  if(b.length == 0) {
    a.n = a.b
  }else {
    if(u.G(b).length == 1) {
      a.n = b[0]
    }
  }
  a.ba = a.n != 1;
  return a.o
}, J:function(a, b, c) {
  var e, g;
  if(b) {
    c = c || 0;
    e = (typeof Types === "undefined" ? u.ga : Types.types)[b];
    if(!e) {
      return o
    }
    a || (a = (typeof Types === "undefined" ? u : Types).ea[b.replace(/.*\./, "")]);
    if(!a) {
      return o
    }
    e.k.length === a.length || w("Assertion failed: " + ("Number of named fields must match the type for " + b + ". Perhaps due to inheritance, which is not supported yet?"));
    g = e.o
  }else {
    e = {k:a.map(function(a) {
      return a[0]
    })}, g = u.D(e)
  }
  var h = {X:e.b};
  b ? a.forEach(function(a, b) {
    if(typeof a === "string") {
      h[a] = g[b] + c
    }else {
      var r, z;
      for(z in a) {
        r = z
      }
      h[r] = u.J(a[r], e.k[b], g[b])
    }
  }) : a.forEach(function(a, b) {
    h[a[1]] = g[b]
  });
  return h
}, R:function(a) {
  var b = t;
  t += a;
  return b
}, U:function(a) {
  var b = x;
  x += a;
  return b
}, l:function(a, b) {
  return Math.ceil(a / (b ? b : 1)) * (b ? b : 1)
}, W:0};
function ca() {
  var a = [], b;
  for(b in this.h) {
    a.push({Q:b, H:this.h[b][0], fa:this.h[b][1], total:this.h[b][0] + this.h[b][1]})
  }
  a.sort(function(a, b) {
    return b.total - a.total
  });
  for(b = 0;b < a.length;b++) {
    var c = a[b];
    print(c.Q + " : " + c.total + " hits, %" + Math.ceil(100 * c.H / c.total) + " failures")
  }
}
var y = [];
function w(a) {
  print(a + ":\n" + Error().stack);
  throw"Assertion: " + a;
}
function A(a, b, c) {
  c[c.length - 1] === "*" && (c = "i32");
  switch(c) {
    case "i1":
      C[a] = b;
      break;
    case "i8":
      C[a] = b;
      break;
    case "i16":
      C[a] = b;
      break;
    case "i32":
      C[a] = b;
      break;
    case "i64":
      C[a] = b;
      break;
    case "float":
      D[a] = b;
      break;
    case "double":
      D[a] = b;
      break;
    default:
      w("invalid type for setValue: " + c)
  }
}
Module.setValue = A;
Module.getValue = function(a, b) {
  b[b.length - 1] === "*" && (b = "i32");
  switch(b) {
    case "i1":
      return C[a];
    case "i8":
      return C[a];
    case "i16":
      return C[a];
    case "i32":
      return C[a];
    case "i64":
      return C[a];
    case "float":
      return D[a];
    case "double":
      return D[a];
    default:
      w("invalid type for setValue: " + b)
  }
  return o
};
var E = 1, F = 2;
Module.ALLOC_NORMAL = 0;
Module.ALLOC_STACK = E;
Module.ALLOC_STATIC = F;
function G(a, b, c) {
  var e, g;
  typeof a === "number" ? (e = n, g = a) : (e = q, g = a.length);
  for(var c = [da, u.R, u.U][c === d ? F : c](Math.max(g, 1)), h = typeof b === "string" ? b : o, f = 0, m;f < g;) {
    var r = e ? 0 : a[f];
    typeof r === "function" && (r = u.$(r));
    m = h || b[f];
    m === 0 ? f++ : (A(c + f, r, m), f += 1)
  }
  return c
}
Module.allocate = G;
Module.Pointer_stringify = function(a) {
  for(var b = "", c = 0, e, g = String.fromCharCode(0);;) {
    e = String.fromCharCode(C[a + c]);
    if(e == g) {
      break
    }
    b += e;
    c += 1
  }
  return b
};
Module.Array_stringify = function(a) {
  for(var b = "", c = 0;c < a.length;c++) {
    b += String.fromCharCode(a[c])
  }
  return b
};
var H, I, C, D, t, J, x, K = q, L = Module.TOTAL_MEMORY || 52428800, ea = Module.FAST_MEMORY || 2097152, K = q;
try {
  K = !!Int32Array && !!Float64Array && !!(new Int32Array(1)).subarray
}catch(fa) {
}
if(K) {
  I = C = new Int32Array(L), D = new Float64Array(L)
}else {
  I = Array(L);
  for(var M = 0;M < ea;M++) {
    I[M] = 0
  }
  D = C = I
}
for(var ga = N("(null)"), M = 0;M < ga.length;M++) {
  C[M] = ga[M]
}
Module.HEAP = I;
Module.IHEAP = C;
Module.FHEAP = D;
J = (t = Math.ceil(10 / 4096) * 4096) + 1048576;
x = Math.ceil(J / 4096) * 4096;
function ha() {
  for(;y.length > 0;) {
    var a = y.pop(), b = a.I;
    typeof b === "number" && (b = H[b]);
    b(a.C === d ? o : a.C)
  }
  ca()
}
function ia(a, b) {
  return K ? Array.prototype.slice.call(C.subarray(a, a + b)) : C.slice(a, a + b)
}
Module.Array_copy = ia;
function ja(a) {
  for(var b = 0;C[a + b];) {
    b++
  }
  return b
}
Module.String_len = ja;
function ka(a, b) {
  var c = ja(a);
  b && c++;
  var e = ia(a, c);
  b && (e[c - 1] = 0);
  return e
}
Module.String_copy = ka;
typeof console === "object" && typeof console.log === "function" ? this.print = function(a) {
  console.log(a)
} : typeof print === "undefined" && (this.print = function() {
});
function N(a, b) {
  for(var c = [], e = 0;e < a.length;) {
    var g = a.charCodeAt(e);
    g > 255 && (g &= 255);
    c.push(g);
    e += 1
  }
  b || c.push(0);
  return c
}
Module.intArrayFromString = N;
Module.intArrayToString = function(a) {
  for(var b = [], c = 0;c < a.length;c++) {
    var e = a[c];
    e > 255 && (e &= 255);
    b.push(String.fromCharCode(e))
  }
  return b.join("")
};
function la(a, b) {
  return a >= 0 ? a : b <= 32 ? 2 * Math.abs(1 << b - 1) + a : Math.pow(2, b) + a
}
function ma(a, b) {
  if(a <= 0) {
    return a
  }
  var c = b <= 32 ? Math.abs(1 << b - 1) : Math.pow(2, b - 1);
  if(a >= c && (b <= 32 || a > c)) {
    a = -2 * c + a
  }
  return a
}
u.V = 1;
var na;
function O() {
  P === d && (P = Date.now());
  return Math.floor((Date.now() - P) * 1)
}
var P, R = 13, oa = 9, pa = 22, qa = 5, ra = 21, sa = 6;
function S(a) {
  T || (T = G([0], "i32", F));
  C[T] = a
}
var T, U = 0, V = 0, W = 0, ta = 2, X = [o], ua = n;
function va(a, b) {
  if(typeof a !== "string") {
    return o
  }
  b === d && (b = "/");
  a && a[0] == "/" && (b = "");
  for(var c = (b + "/" + a).split("/").reverse(), e = [""];c.length;) {
    var g = c.pop();
    g == "" || g == "." || (g == ".." ? e.length > 1 && e.pop() : e.push(g))
  }
  return e.length == 1 ? "/" : e.join("/")
}
function wa(a, b, c) {
  var e = {N:q, j:q, error:0, name:o, path:o, object:o, s:q, u:o, t:o}, a = va(a);
  if(a == "/") {
    e.N = n, e.j = e.s = n, e.name = "/", e.path = e.u = "/", e.object = e.t = Y
  }else {
    if(a !== o) {
      for(var c = c || 0, a = a.slice(1).split("/"), g = Y, h = [""];a.length;) {
        if(a.length == 1 && g.c) {
          e.s = n, e.u = h.length == 1 ? "/" : h.join("/"), e.t = g, e.name = a[0]
        }
        var f = a.shift();
        if(g.c) {
          if(g.w) {
            if(!g.a.hasOwnProperty(f)) {
              e.error = 2;
              break
            }
          }else {
            e.error = R;
            break
          }
        }else {
          e.error = 20;
          break
        }
        g = g.a[f];
        if(g.link && !(b && a.length == 0)) {
          if(c > 40) {
            e.error = 40;
            break
          }
          e = va(g.link, h.join("/"));
          return wa([e].concat(a).join("/"), b, c + 1)
        }
        h.push(f);
        if(a.length == 0) {
          e.j = n, e.path = h.join("/"), e.object = g
        }
      }
    }
  }
  return e
}
function xa(a, b, c, e, g) {
  a || (a = "/");
  if(typeof a === "string") {
    ya(), a = wa(a, d), a.j ? a = a.object : (S(a.error), a = o)
  }
  if(!a) {
    throw S(R), Error("Parent path must exist.");
  }
  if(!a.c) {
    throw S(20), Error("Parent must be a folder.");
  }
  if(!a.write && !ua) {
    throw S(R), Error("Parent folder must be writeable.");
  }
  if(!b || b == "." || b == "..") {
    throw S(2), Error("Name must not be empty.");
  }
  if(a.a.hasOwnProperty(b)) {
    throw S(17), Error("Can't overwrite object.");
  }
  a.a[b] = {w:e === d ? n : e, write:g === d ? q : g, timestamp:Date.now(), L:ta++};
  for(var h in c) {
    c.hasOwnProperty(h) && (a.a[b][h] = c[h])
  }
  return a.a[b]
}
function za(a, b) {
  return xa("/", a, {c:n, f:q, a:{}}, n, b)
}
function Z(a, b, c, e) {
  if(!c && !e) {
    throw Error("A device must have at least one callback defined.");
  }
  var g = {f:n, input:c, d:e};
  g.c = q;
  return xa(a, b, g, Boolean(c), Boolean(e))
}
function ya() {
  Y || (Y = {w:n, write:q, c:n, f:q, timestamp:Date.now(), L:1, a:{}})
}
function Aa() {
  var a, b, c;
  if(!Ba) {
    Ba = n;
    ya();
    a || (a = function() {
      if(!a.i || !a.i.length) {
        var b;
        typeof window != "undefined" && typeof window.prompt == "function" ? b = window.prompt("Input: ") : typeof readline == "function" && (b = readline());
        b || (b = "");
        a.i = N(b + "\n", n)
      }
      return a.i.shift()
    });
    b || (b = function(a) {
      a === o || a === "\n".charCodeAt(0) ? (b.v(b.buffer.join("")), b.buffer = []) : b.buffer.push(String.fromCharCode(a))
    });
    if(!b.v) {
      b.v = print
    }
    if(!b.buffer) {
      b.buffer = []
    }
    c || (c = b);
    za("tmp", n);
    var e = za("dev", q), g = Z(e, "stdin", a), h = Z(e, "stdout", o, b);
    c = Z(e, "stderr", o, c);
    Z(e, "tty", a, b);
    X[1] = {path:"/dev/stdin", object:g, position:0, r:n, g:q, p:q, error:q, m:q, z:[]};
    X[2] = {path:"/dev/stdout", object:h, position:0, r:q, g:n, p:q, error:q, m:q, z:[]};
    X[3] = {path:"/dev/stderr", object:c, position:0, r:q, g:n, p:q, error:q, m:q, z:[]};
    U = G([1], "void*", F);
    V = G([2], "void*", F);
    W = G([3], "void*", F);
    X[U] = X[1];
    X[V] = X[2];
    X[W] = X[3];
    G([G([0, U, V, W], "void*", F)], "void*", F);
    ua = q
  }
}
var Ba, Y;
function Ca(a, b, c) {
  var e = X[a];
  if(e) {
    if(e.g) {
      if(c < 0) {
        return S(pa), -1
      }else {
        if(e.object.f) {
          if(e.object.d) {
            for(var g = 0;g < c;g++) {
              try {
                e.object.d(C[b + g])
              }catch(h) {
                return S(qa), -1
              }
            }
            e.object.timestamp = Date.now();
            return g
          }else {
            return S(sa), -1
          }
        }else {
          g = e.position;
          a = X[a];
          if(!a || a.object.f) {
            S(oa), b = -1
          }else {
            if(a.g) {
              if(a.object.c) {
                S(ra), b = -1
              }else {
                if(c < 0 || g < 0) {
                  S(pa), b = -1
                }else {
                  for(var f = a.object.a;f.length < g;) {
                    f.push(0)
                  }
                  for(var m = 0;m < c;m++) {
                    f[g + m] = C[b + m]
                  }
                  a.object.timestamp = Date.now();
                  b = m
                }
              }
            }else {
              S(R), b = -1
            }
          }
          b != -1 && (e.position += b);
          return b
        }
      }
    }else {
      return S(R), -1
    }
  }else {
    return S(oa), -1
  }
}
function Da(a) {
  function b(b) {
    var c;
    c = b === "float" || b === "double" ? D[a + e] : C[a + e];
    e += u.K(b);
    return Number(c)
  }
  for(var c = na, e = 0, g = [], h, f;;) {
    var m = c;
    h = C[c];
    if(h === 0) {
      break
    }
    f = C[c + 1];
    if(h == "%".charCodeAt(0)) {
      var r = q, z = q, j = q, k = q;
      a:for(;;) {
        switch(f) {
          case "+".charCodeAt(0):
            r = n;
            break;
          case "-".charCodeAt(0):
            z = n;
            break;
          case "#".charCodeAt(0):
            j = n;
            break;
          case "0".charCodeAt(0):
            if(k) {
              break a
            }else {
              k = n;
              break
            }
          ;
          default:
            break a
        }
        c++;
        f = C[c + 1]
      }
      var l = 0;
      if(f == "*".charCodeAt(0)) {
        l = b("i32"), c++, f = C[c + 1]
      }else {
        for(;f >= "0".charCodeAt(0) && f <= "9".charCodeAt(0);) {
          l = l * 10 + (f - "0".charCodeAt(0)), c++, f = C[c + 1]
        }
      }
      var B = q;
      if(f == ".".charCodeAt(0)) {
        var s = 0, B = n;
        c++;
        f = C[c + 1];
        if(f == "*".charCodeAt(0)) {
          s = b("i32"), c++
        }else {
          for(;;) {
            f = C[c + 1];
            if(f < "0".charCodeAt(0) || f > "9".charCodeAt(0)) {
              break
            }
            s = s * 10 + (f - "0".charCodeAt(0));
            c++
          }
        }
        f = C[c + 1]
      }else {
        s = 6
      }
      var p;
      switch(String.fromCharCode(f)) {
        case "h":
          f = C[c + 2];
          f == "h".charCodeAt(0) ? (c++, p = 1) : p = 2;
          break;
        case "l":
          f = C[c + 2];
          f == "l".charCodeAt(0) ? (c++, p = 8) : p = 4;
          break;
        case "L":
        ;
        case "q":
        ;
        case "j":
          p = 8;
          break;
        case "z":
        ;
        case "t":
        ;
        case "I":
          p = 4;
          break;
        default:
          p = d
      }
      p !== d && c++;
      f = C[c + 1];
      if("d,i,u,o,x,X,p".split(",").indexOf(String.fromCharCode(f)) != -1) {
        m = f == "d".charCodeAt(0) || f == "i".charCodeAt(0);
        p = p || 4;
        h = b("i" + p * 8);
        p <= 4 && (h = (m ? ma : la)(h & Math.pow(256, p) - 1, p * 8));
        var v = Math.abs(h), i, m = "";
        if(f == "d".charCodeAt(0) || f == "i".charCodeAt(0)) {
          i = ma(h, 8 * p).toString(10)
        }else {
          if(f == "u".charCodeAt(0)) {
            i = la(h, 8 * p).toString(10), h = Math.abs(h)
          }else {
            if(f == "o".charCodeAt(0)) {
              i = (j ? "0" : "") + v.toString(8)
            }else {
              if(f == "x".charCodeAt(0) || f == "X".charCodeAt(0)) {
                m = j ? "0x" : "";
                if(h < 0) {
                  h = -h;
                  i = (v - 1).toString(16);
                  j = [];
                  for(v = 0;v < i.length;v++) {
                    j.push((15 - parseInt(i[v], 16)).toString(16))
                  }
                  for(i = j.join("");i.length < p * 2;) {
                    i = "f" + i
                  }
                }else {
                  i = v.toString(16)
                }
                f == "X".charCodeAt(0) && (m = m.toUpperCase(), i = i.toUpperCase())
              }else {
                f == "p".charCodeAt(0) && (v === 0 ? i = "(nil)" : (m = "0x", i = v.toString(16)))
              }
            }
          }
        }
        if(B) {
          for(;i.length < s;) {
            i = "0" + i
          }
        }
        for(r && (m = h < 0 ? "-" + m : "+" + m);m.length + i.length < l;) {
          z ? i += " " : k ? i = "0" + i : m = " " + m
        }
        i = m + i;
        i.split("").forEach(function(a) {
          g.push(a.charCodeAt(0))
        })
      }else {
        if("f,F,e,E,g,G".split(",").indexOf(String.fromCharCode(f)) != -1) {
          h = b(p === 4 ? "float" : "double");
          if(isNaN(h)) {
            i = "nan", k = q
          }else {
            if(isFinite(h)) {
              B = q;
              p = Math.min(s, 20);
              if(f == "g".charCodeAt(0) || f == "G".charCodeAt(0)) {
                B = n, s = s || 1, p = parseInt(h.toExponential(p).split("e")[1], 10), s > p && p >= -4 ? (f = (f == "g".charCodeAt(0) ? "f" : "F").charCodeAt(0), s -= p + 1) : (f = (f == "g".charCodeAt(0) ? "e" : "E").charCodeAt(0), s--), p = Math.min(s, 20)
              }
              if(f == "e".charCodeAt(0) || f == "E".charCodeAt(0)) {
                i = h.toExponential(p), /[eE][-+]\d$/.test(i) && (i = i.slice(0, -1) + "0" + i.slice(-1))
              }else {
                if(f == "f".charCodeAt(0) || f == "F".charCodeAt(0)) {
                  i = h.toFixed(p)
                }
              }
              m = i.split("e");
              if(B && !j) {
                for(;m[0].length > 1 && m[0].indexOf(".") != -1 && (m[0].slice(-1) == "0" || m[0].slice(-1) == ".");) {
                  m[0] = m[0].slice(0, -1)
                }
              }else {
                for(j && i.indexOf(".") == -1 && (m[0] += ".");s > p++;) {
                  m[0] += "0"
                }
              }
              i = m[0] + (m.length > 1 ? "e" + m[1] : "");
              f == "E".charCodeAt(0) && (i = i.toUpperCase());
              r && h >= 0 && (i = "+" + i)
            }else {
              i = (h < 0 ? "-" : "") + "inf", k = q
            }
          }
          for(;i.length < l;) {
            z ? i += " " : i = k && (i[0] == "-" || i[0] == "+") ? i[0] + "0" + i.slice(1) : (k ? "0" : " ") + i
          }
          f < "a".charCodeAt(0) && (i = i.toUpperCase());
          i.split("").forEach(function(a) {
            g.push(a.charCodeAt(0))
          })
        }else {
          if(f == "s".charCodeAt(0)) {
            (r = b("i8*")) ? (r = ka(r), B && r.length > s && (r = r.slice(0, s))) : r = N("(null)", n);
            if(!z) {
              for(;r.length < l--;) {
                g.push(" ".charCodeAt(0))
              }
            }
            g = g.concat(r);
            if(z) {
              for(;r.length < l--;) {
                g.push(" ".charCodeAt(0))
              }
            }
          }else {
            if(f == "c".charCodeAt(0)) {
              for(z && g.push(b("i8"));--l > 0;) {
                g.push(" ".charCodeAt(0))
              }
              z || g.push(b("i8"))
            }else {
              if(f == "n".charCodeAt(0)) {
                z = b("i32*"), C[z] = g.length
              }else {
                if(f == "%".charCodeAt(0)) {
                  g.push(h)
                }else {
                  for(v = m;v < c + 2;v++) {
                    g.push(C[v])
                  }
                }
              }
            }
          }
        }
      }
      c += 2
    }else {
      g.push(h), c += 1
    }
  }
  return g
}
function da(a) {
  var b = x;
  x += a;
  return b
}
function Ea() {
  var a = t;
  t += 670048;
  var b, c, e = a + 32E4, g = a + 35E4, h = a + 350048, f;
  c = 0;
  a:for(;;) {
    var m = f = a + (c << 5);
    D[m] = 0;
    D[m + 1] = 0;
    D[m + 2] = 0;
    D[m + 3] = 1;
    $(f + 16);
    c = f = c + 1;
    if(!(f < 1E4)) {
      break a
    }
  }
  c = 0;
  a:for(;;) {
    if(f = e + c * 3, C[f] = -1, D[f + 1] = 0, C[f + 2] = 0, c = f = c + 1, !(f < 1E4)) {
      break a
    }
  }
  c = 0;
  a:for(;;) {
    if(D[a + (c << 5) + 3] = 1, f = a + (c << 5) + 16, D[f] = 0, D[f + 1] = 0, D[f + 2] = 1, D[f + 3] = 0, C[e + c * 3] = 0, D[e + c * 3 + 1] = 1, C[e + c * 3 + 2] = 1, c = f = c + 1, !(f < 1E4)) {
      break a
    }
  }
  $(g);
  $(g + 16);
  $(g + 32);
  for(c = 0;c < 48;c++) {
    C[g + c] = 0, D[g + c] = 0
  }
  c = 0;
  a:for(;;) {
    if($(h + (c << 4)), c = f = c + 1, !(f < 2E4)) {
      break a
    }
  }
  c = 0;
  f = O();
  b = O() < f + 1E3 ? 9 : 11;
  a:do {
    if(b == 9) {
      for(var m = a, r = e, z = h;;) {
        b = g;
        var j = m, k = r, l = z, B = t;
        t += 48;
        var s = d, p = d, v = d, i = d, Q = d, p = 1E4, v = j, i = k, Q = l, j = B;
        $(j);
        $(j + 16);
        $(j + 32);
        j = p;
        p = j - 1;
        s = j != 0 ? 1 : 4;
        b:do {
          if(s == 1) {
            for(;;) {
              j = B;
              k = b + C[i] * 48;
              l = D[i + 1];
              D[j] = l * D[k];
              D[j + 1] = l * D[k + 1];
              D[j + 2] = l * D[k + 2];
              D[j + 3] = l * D[k + 3];
              D[j + 16] = l * D[k + 16];
              D[j + 16 + 1] = l * D[k + 16 + 1];
              D[j + 16 + 2] = l * D[k + 16 + 2];
              D[j + 16 + 3] = l * D[k + 16 + 3];
              D[j + 32] = l * D[k + 32];
              D[j + 32 + 1] = l * D[k + 32 + 1];
              D[j + 32 + 2] = l * D[k + 32 + 2];
              D[j + 32 + 3] = l * D[k + 32 + 3];
              j = i;
              i = j + 3;
              s = C[j + 2] != 0 ^ 1 ? 2 : 3;
              d:do {
                if(s == 2) {
                  for(;;) {
                    if(j = B, k = b + C[i] * 48, l = D[i + 1], D[j] += l * D[k], D[j + 1] += l * D[k + 1], D[j + 2] += l * D[k + 2], D[j + 3] += l * D[k + 3], D[j + 16] += l * D[k + 16], D[j + 16 + 1] += l * D[k + 16 + 1], D[j + 16 + 2] += l * D[k + 16 + 2], D[j + 16 + 3] += l * D[k + 16 + 3], D[j + 32] += l * D[k + 32], D[j + 32 + 1] += l * D[k + 32 + 1], D[j + 32 + 2] += l * D[k + 32 + 2], D[j + 32 + 3] += l * D[k + 32 + 3], j = i, i = j + 3, C[j + 2] != 0 ^ 1) {
                      s = 2
                    }else {
                      break d
                    }
                  }
                }
              }while(0);
              j = Q;
              k = B;
              l = v;
              D[j] = D[k] * D[l] + D[k + 1] * D[l + 1] + D[k + 2] * D[l + 2] + D[k + 3];
              D[j + 1] = D[k + 16] * D[l] + D[k + 16 + 1] * D[l + 1] + D[k + 16 + 2] * D[l + 2] + D[k + 16 + 3];
              D[j + 2] = D[k + 32] * D[l] + D[k + 32 + 1] * D[l + 1] + D[k + 32 + 2] * D[l + 2] + D[k + 32 + 3];
              j = Q + 16;
              k = B;
              l = v + 16;
              D[j] = D[k] * D[l] + D[k + 1] * D[l + 1] + D[k + 2] * D[l + 2];
              D[j + 1] = D[k + 16] * D[l] + D[k + 16 + 1] * D[l + 1] + D[k + 16 + 2] * D[l + 2];
              D[j + 2] = D[k + 32] * D[l] + D[k + 32 + 1] * D[l + 1] + D[k + 32 + 2] * D[l + 2];
              v += 32;
              Q += 32;
              j = p;
              p = j - 1;
              if(j != 0) {
                s = 1
              }else {
                break b
              }
            }
          }
        }while(0);
        t = B;
        c += 1E4;
        if(O() < f + 1E3) {
          b = 10
        }else {
          break a
        }
      }
    }
  }while(0);
  e = O() - f;
  for(f = g = 0;;) {
    if(g += D[h + (f << 4)] + D[h + (f << 4) + 1] + D[h + (f << 4) + 2] + D[h + (f << 4) + 3], f = m = f + 1, !(m < 2E4)) {
      break
    }
  }
  e = G([Math.floor(c * 1E3 / e) & 4294967295, g], ["i32", "double"], E);
  h = C[V];
  c = Da(e);
  e = u.T();
  g = G(c, "i8", E);
  c = c.length * 1;
  if(c != 0 && Ca(h, g, c) == -1 && X[h]) {
    X[h].error = n
  }
  u.S(e);
  t = a;
  return 0
}
Module._main = Ea;
function $(a) {
  D[a] = 0;
  D[a + 1] = 0;
  D[a + 2] = 0;
  D[a + 3] = 0
}
Module.F = function(a) {
  function b() {
    for(var a = 0;a < 0;a++) {
      e.push(0)
    }
  }
  var c = a.length + 1, e = [G(N("/bin/this.program"), "i8", F)];
  b();
  for(var g = 0;g < c - 1;g += 1) {
    e.push(G(N(a[g]), "i8", F)), b()
  }
  e.push(0);
  e = G(e, "i32", F);
  return Ea()
};
function Fa(a) {
  a = a || Module.arguments;
  na = G([83, 107, 105, 110, 110, 101, 100, 32, 118, 101, 114, 116, 105, 99, 101, 115, 32, 112, 101, 114, 32, 115, 101, 99, 111, 110, 100, 58, 32, 37, 100, 44, 32, 98, 108, 97, 104, 61, 37, 102, 10, 0], "i8", F);
  Aa();
  y.push({I:function() {
    X[2].object.d.buffer.length > 0 && X[2].object.d("\n".charCodeAt(0));
    X[3].object.d.buffer.length > 0 && X[3].object.d("\n".charCodeAt(0))
  }});
  S(0);
  H = [0, 0];
  Module.FUNCTION_TABLE = H;
  var b = o;
  Module._main && (b = Module.F(a), ha());
  return b
}
Module.run = Fa;
Module.noInitialRun || Fa();

