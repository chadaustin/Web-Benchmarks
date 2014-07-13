#include <stdio.h>
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <emscripten/emscripten.h>

using namespace emscripten;

struct vec3f {
    float data[3];
};

struct mat44f {
    float data[4*4];
};

class Interface {
public:
    virtual void call_val(const val& v) = 0;
    virtual void call_int(int i) = 0;
    virtual void call_vec(const vec3f& v) = 0;
    virtual void call_mat(const mat44f& m) = 0;
};

class InterfaceWrapper : public wrapper<Interface> {
public:
    EMSCRIPTEN_WRAPPER(InterfaceWrapper);

    virtual void call_val(const val& v) override {
        return call<void>("call_val", v);
    }

    virtual void call_int(int i) override {
        return call<void>("call_int", i);
    }

    virtual void call_vec(const vec3f& v) override {
        return call<void>("call_vec", typed_memory_view(3, v.data));
    }

    virtual void call_mat(const mat44f& m) override {
        return call<void>("call_mat", typed_memory_view(16, m.data));
    }
};

EMSCRIPTEN_BINDINGS(interface) {
    class_<Interface>("Interface")
        .smart_ptr<std::shared_ptr<Interface>>("InterfacePtr")
        .allow_subclass<InterfaceWrapper, std::shared_ptr<InterfaceWrapper>>("InterfaceWrapper", "InterfaceWrapperPtr")
        .function("call_val", &Interface::call_val, pure_virtual())
        .function("call_int", &Interface::call_int, pure_virtual())
        .function("call_vec", &Interface::call_vec, pure_virtual())
        .function("call_mat", &Interface::call_mat, pure_virtual())
        ;
}

typedef std::pair<int, double> result;

template<typename Function>
result loop_call(double runMS, Interface* p, Function fn) {
    const int batchSize = 10000;
    const double start = emscripten_get_now();
    const double until = start + runMS;
    double end = start;
    int count = 0;
    while (end < until) {
        for (int i = 0; i < batchSize; ++i) {
            fn(p, i);
        }
        count += batchSize;

        end = emscripten_get_now();
    }
    return result(count, end - start);
}

template<typename Caller>
void bench(const char* name, Interface* raw, Caller caller) {
    double WARM_TIME = 1000; // ms
    double BENCH_TIME = 5000; // ms

    printf("warming...\n");
    loop_call(WARM_TIME, raw, caller);

    printf("%s\n", name);

    auto result = loop_call(BENCH_TIME, raw, caller);
    printf("%f calls per second\n", result.first / (result.second / 1000.0));
}

void yield(std::function<void()> f) {
    auto p = new std::function<void()>(f);
    emscripten_async_call([](void* p) {
        auto q = reinterpret_cast<std::function<void()>*>(p);
        (*q)();
        delete q;
    }, p, 500);
}

int main() {
    printf("Starting...\n");

    auto tv = val::global("someGlobalVariable");
    auto p = val::global("getInterfaceImplementation")().as<std::shared_ptr<Interface>>();
    Interface* raw = p.get();

    bench("val", raw, [tv](Interface* p, int) {
        p->call_val(tv);
    });
    yield([=] {
        bench("int", raw, [](Interface* p, int i) {
            p->call_int(i);
        });
        yield([=] {
            bench("vec", raw, [](Interface* p, int) {
                p->call_vec(vec3f());
            });
            yield([=] {
                bench("mat", raw, [](Interface* p, int) {
                    p->call_mat(mat44f());
                });
                printf("done\n");
            });
        });
    });
}
