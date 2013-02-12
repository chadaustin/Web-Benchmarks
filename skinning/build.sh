#!/bin/bash
cd `dirname "$0"`

mkdir -p build

GCC=g++
CLANG=clang
EMCC=../emscripten/emcc

CFLAGS="-Wall -Werror"

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

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-scalar.js skinning_test_scalar.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-scalar.js skinning_test_scalar.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-scalar.js skinning_test_scalar.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-scalar.js skinning_test_scalar.cpp

$EMCC $EMFLAGS -O0 -o build/emscripten-O0-scalar.html skinning_test_scalar.cpp
$EMCC $EMFLAGS -O1 -o build/emscripten-O1-scalar.html skinning_test_scalar.cpp
$EMCC $EMFLAGS -O2 -o build/emscripten-O2-scalar.html skinning_test_scalar.cpp
$EMCC $EMFLAGS -O3 -o build/emscripten-O3-scalar.html skinning_test_scalar.cpp

