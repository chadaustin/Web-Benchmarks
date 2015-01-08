#!/bin/bash
cd `dirname "$0"`

mkdir -p build

GCC=g++
CLANG=${LLVM}/clang
EMCC=${EMSCRIPTEN}/emcc

CFLAGS="-Wall -Werror"
EMFLAGS="-fno-exceptions -s DISABLE_EXCEPTION_CATCHING=1 -s ASM_JS=1 --llvm-lto 1"

set -ex

$GCC $CFLAGS -O0 -o build/gcc-O0-scalar skinning_test_scalar.cpp
$GCC $CFLAGS -O1 -o build/gcc-O1-scalar skinning_test_scalar.cpp
$GCC $CFLAGS -O2 -o build/gcc-O2-scalar skinning_test_scalar.cpp
$GCC $CFLAGS -O3 -o build/gcc-O3-scalar skinning_test_scalar.cpp

$CLANG $CFLAGS -O0 -o build/clang-O0-scalar skinning_test_scalar.cpp
$CLANG $CFLAGS -O1 -o build/clang-O1-scalar skinning_test_scalar.cpp
$CLANG $CFLAGS -O2 -o build/clang-O2-scalar skinning_test_scalar.cpp
$CLANG $CFLAGS -O3 -o build/clang-O3-scalar skinning_test_scalar.cpp

$GCC $CFLAGS -O0 -o build/gcc-O0-simd skinning_test_simd.cpp
$GCC $CFLAGS -O1 -o build/gcc-O1-simd skinning_test_simd.cpp
$GCC $CFLAGS -O2 -o build/gcc-O2-simd skinning_test_simd.cpp
$GCC $CFLAGS -O3 -o build/gcc-O3-simd skinning_test_simd.cpp

$CLANG $CFLAGS -O0 -o build/clang-O0-simd skinning_test_simd.cpp
$CLANG $CFLAGS -O1 -o build/clang-O1-simd skinning_test_simd.cpp
$CLANG $CFLAGS -O2 -o build/clang-O2-simd skinning_test_simd.cpp
$CLANG $CFLAGS -O3 -o build/clang-O3-simd skinning_test_simd.cpp

$CLANG $CFLAGS -O0 -o build/clang-O0-vector skinning_test_vector.cpp
$CLANG $CFLAGS -O1 -o build/clang-O1-vector skinning_test_vector.cpp
$CLANG $CFLAGS -O2 -o build/clang-O2-vector skinning_test_vector.cpp
$CLANG $CFLAGS -O3 -o build/clang-O3-vector skinning_test_vector.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-scalar.js skinning_test_scalar.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-scalar.js skinning_test_scalar.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-scalar.js skinning_test_scalar.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-scalar.js skinning_test_scalar.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-scalar.html skinning_test_scalar.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-scalar.html skinning_test_scalar.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-scalar.html skinning_test_scalar.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-scalar.html skinning_test_scalar.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-simd.js skinning_test_simd.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-simd.js skinning_test_simd.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-simd.js skinning_test_simd.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-simd.js skinning_test_simd.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-simd.html skinning_test_simd.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-simd.html skinning_test_simd.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-simd.html skinning_test_simd.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-simd.html skinning_test_simd.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-vector.js skinning_test_vector.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-vector.js skinning_test_vector.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-vector.js skinning_test_vector.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-vector.js skinning_test_vector.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-vector.html skinning_test_vector.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-vector.html skinning_test_vector.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-vector.html skinning_test_vector.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-vector.html skinning_test_vector.cpp
