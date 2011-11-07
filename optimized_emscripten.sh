#!/bin/sh
die() {
    exit 1
}
python ../emscripten/tools/emmaken.py -o skinning_test_no_simd.bc skinning_test_no_simd.cpp || die
python ../emscripten/emscripten.py -s CORRECT_SIGNS=0 -s CORRECT_OVERFLOWS=0 -s CORRECT_ROUNDINGS=0 -s OPTIMIZE=1 -s RELOOP=1 -s QUANTUM_SIZE=1 -s USE_TYPED_ARRAYS=1 -s ASSERTIONS=0 -s INIT_STACK=0 --optimize skinning_test_no_simd.bc > skinning_test_no_simd_unoptimized.js || die
java -jar ../compiler-latest/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --js skinning_test_no_simd_unoptimized.js --js_output_file skinning_test_no_simd.js --formatting PRETTY_PRINT || die
