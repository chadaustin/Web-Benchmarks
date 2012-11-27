#!/bin/bash
cd `dirname "$0"`

set -e
mkdir -p build

GCC=g++
CLANG=clang

CFLAGS="-Wall -Werror"

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
