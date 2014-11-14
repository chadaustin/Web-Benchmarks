#include <emscripten/bind.h>

using namespace emscripten;

float addf(float x, float y) {
    return x + y;
}

int addi(int x, int y) {
    return x + y;
}

EMSCRIPTEN_BINDINGS(call_overhead) {
    function("_addf", &addf);
    function("_addi", &addi);
}
