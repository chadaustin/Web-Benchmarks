#!/bin/bash
set -e
EMCC_FAST_COMPILER=0 ../../emscripten/em++ --memory-init-file 0 -s ASM_JS=0 -O2 -s EXPORTED_FUNCTIONS='["_addf", "_addi"]' -o call_overhead_direct.js call_overhead_direct.cpp
EMCC_FAST_COMPILER=0 ../../emscripten/em++ --memory-init-file 0 -s ASM_JS=0 -O2 --bind -o call_overhead_embind.js call_overhead_embind.cpp
