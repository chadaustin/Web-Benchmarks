#include <stddef.h>
#include <stdio.h>
#include <time.h>
#include <vector>

#include <rapidjson/document.h>

extern "C" {
#include <yajl/yajl_tree.h>
}

#include "sajson.h"

// vjson
#include "json.h"

#include "pjson.h"

// wee conflicts
namespace jansson {
    #include <jansson.h>
}

struct jsonstats {
    jsonstats()
        : null_count(0)
        , false_count(0)
        , true_count(0)
        , number_count(0)
        , object_count(0)
        , array_count(0)
        , string_count(0)
        , total_string_length(0)
        , total_array_length(0)
        , total_object_length(0)
        , total_number_value(0)
    {}

    size_t null_count;
    size_t false_count;
    size_t true_count;
    size_t number_count;
    size_t object_count;
    size_t array_count;
    size_t string_count;

    size_t total_string_length;
    size_t total_array_length;
    size_t total_object_length;
    double total_number_value;

    void print() const {
        printf("    # null=%zu, false=%zu, true=%zu, numbers=%zu, strings=%zu, arrays=%zu, objects=%zu\n",
               null_count, false_count, true_count,
               number_count, string_count,
               array_count, object_count);
        printf("    # total_string_length=%zu, total_array_length=%zu, total_object_length=%zu, total_number_value=%f\n",
               total_string_length,
               total_array_length,
               total_object_length,
               total_number_value);
    }

    bool operator==(const jsonstats& rhs) const {
        return null_count == rhs.null_count &&
            false_count == rhs.false_count &&
            true_count == rhs.true_count &&
            number_count == rhs.number_count &&
            object_count == rhs.object_count &&
            array_count == rhs.array_count &&
            string_count == rhs.string_count &&
            total_string_length == rhs.total_string_length &&
            total_array_length == rhs.total_array_length &&
            total_object_length == rhs.total_object_length &&
            fabs(total_number_value - rhs.total_number_value) <= 0.01;
    }

    bool operator!=(const jsonstats& rhs) const {
        return !(*this == rhs);
    }
};

struct TestFile {
    const char* name;
    size_t length;
    const unsigned char* data;
};

class ZeroTerminatedCopy {
public:
    ZeroTerminatedCopy(const TestFile& file) {
        data = new char[1 + file.length];
        memcpy(data, file.data, file.length);
        data[file.length] = 0;
    }

    ZeroTerminatedCopy(size_t length, const void* original_data) {
        data = new char[1 + length];
        memcpy(data, original_data, length);
        data[length] = 0;
    }

    ~ZeroTerminatedCopy() {
        delete[] data;
    }

    char* get() const {
        return data;
    }

private:
    char* data;
};

class Copy {
public:
    Copy(const TestFile& file) {
        data = new char[file.length];
        memcpy(data, file.data, file.length);
    }

    Copy(size_t length, const void* original_data) {
        data = new char[length];
        memcpy(data, original_data, length);
    }

    ~Copy() {
        delete[] data;
    }

    char* get() const {
        return data;
    }

private:
    char* data;
};

namespace rapidjson_test {
    void traverse(jsonstats& stats, const rapidjson::Value& v) {
        if (v.IsNull()) {
            ++stats.null_count;
        } else if (v.IsFalse()) {
            ++stats.false_count;
        } else if (v.IsTrue()) {
            ++stats.true_count;
        } else if (v.IsArray()) {
            ++stats.array_count;
            stats.total_array_length += v.Size();
            for (size_t i = 0; i < v.Size(); ++i) {
                traverse(stats, v[i]);
            }
        } else if (v.IsObject()) {
            ++stats.object_count;
            for (auto i = v.MemberBegin(); i != v.MemberEnd(); ++i) {
                ++stats.total_object_length;
                // name?
                traverse(stats, i->value);
            }
        } else if (v.IsString()) {
            ++stats.string_count;
            stats.total_string_length += v.GetStringLength();
        } else {
            ++stats.number_count;
            stats.total_number_value += v.GetDouble();
        }
    }

    void test(jsonstats& stats, const TestFile& file) {
        ZeroTerminatedCopy data(file);
        rapidjson::Document document;
        document.ParseInsitu<0>(data.get());
        if (document.HasParseError()) {
            fprintf(stderr, "rapidjson parse error: %s\n", document.GetParseError());
            abort();
        }

        traverse(stats, document);
    }
}

namespace vjson_test {
    void traverse(jsonstats& stats, json_value* node) {
        switch (node->type) {
            case JSON_NULL:
                ++stats.null_count;
                break;
            case JSON_OBJECT:
                ++stats.object_count;
                
                for (json_value* v = node->first_child; v; v = v->next_sibling) {
                    ++stats.total_object_length;
                    // name?
                    traverse(stats, v);
                }
                break;
            case JSON_ARRAY:
                ++stats.array_count;

                for (json_value* v = node->first_child; v; v = v->next_sibling) {
                    ++stats.total_array_length;
                    traverse(stats, v);
                }
                break;
            case JSON_STRING:
                ++stats.string_count;
                stats.total_string_length += strlen(node->string_value);
                break;
            case JSON_INT:
                ++stats.number_count;
                stats.total_number_value += node->int_value;
                break;
            case JSON_FLOAT:
                ++stats.number_count;
                stats.total_number_value += node->float_value;
                break;
            case JSON_BOOL:
                if (node->int_value) {
                    ++stats.true_count;
                } else {
                    ++stats.false_count;
                }
                break;
        }
    }

    void test(jsonstats& stats, const TestFile& file) {
        ZeroTerminatedCopy data(file);
        char* errorPos;
        char* errorDesc;
        int errorLine;

        block_allocator allocator(1 << 10);
        json_value* root = json_parse(data.get(), &errorPos, &errorDesc, &errorLine, &allocator);
        if (!root) {
            fprintf(stderr, "vjson parse error: %s\n", errorDesc);
            abort();
        }

        traverse(stats, root);
    }
}

namespace yajl_test {
    void traverse(jsonstats& stats, yajl_val node) {
        if (YAJL_IS_NULL(node)) {
            ++stats.null_count;
        } else if (YAJL_IS_FALSE(node)) {
            ++stats.false_count;
        } else if (YAJL_IS_TRUE(node)) {
            ++stats.true_count;
        } else if (YAJL_IS_ARRAY(node)) {
            ++stats.array_count;
            auto array = YAJL_GET_ARRAY(node);
            auto length = array->len;
            stats.total_array_length += length;
            for (size_t i = 0; i < length; ++i) {
                traverse(stats, array->values[i]);
            }
        } else if (YAJL_IS_OBJECT(node)) {
            ++stats.object_count;
            auto object = YAJL_GET_OBJECT(node);
            auto length = object->len;
            stats.total_object_length += length;
            for (auto i = 0u; i < length; ++i) {
                traverse(stats, object->values[i]);
            }
        } else if (YAJL_IS_STRING(node)) {
            ++stats.string_count;
            stats.total_string_length += strlen(YAJL_GET_STRING(node));
        } else {
            assert(YAJL_IS_NUMBER(node));
            ++stats.number_count;
            if (YAJL_IS_INTEGER(node)) {
                stats.total_number_value += YAJL_GET_INTEGER(node);
            } else if (YAJL_IS_DOUBLE(node)) {
                stats.total_number_value += YAJL_GET_DOUBLE(node);
            }
        }
    }

    void test(jsonstats& stats, const TestFile& file) {
        ZeroTerminatedCopy data(file);
        char error_buffer[1024];
        yajl_val node = yajl_tree_parse(data.get(), error_buffer, sizeof(error_buffer));
        if (!node) {
            fprintf(stderr, "yajl parse error: %s\n", error_buffer);
            abort();
        }

        traverse(stats, node);

        yajl_tree_free(node);
    }
}

namespace jansson_test {
    using namespace jansson;

    void traverse(jsonstats& stats, json_t* node) {
        switch (json_typeof(node)) {
            case jansson::JSON_NULL:
                ++stats.null_count;
                break;

            case jansson::JSON_FALSE:
                ++stats.false_count;
                break;

            case jansson::JSON_TRUE:
                ++stats.true_count;
                break;

            case jansson::JSON_ARRAY: {
                ++stats.array_count;
                auto length = json_array_size(node);
                stats.total_array_length += length;
                for (size_t i = 0; i < length; ++i) {
                    traverse(stats, json_array_get(node, i));
                }
                break;
            }

            case jansson::JSON_OBJECT: {
                ++stats.object_count;
                auto length = json_object_size(node);
                stats.total_object_length += length;
                const char* key;
                json_t* value;
                json_object_foreach(node, key, value) {
                    traverse(stats, value);
                }
                break;
            }
        
            case jansson::JSON_STRING: {
                const char* v = json_string_value(node);
                ++stats.string_count;
                stats.total_string_length += strlen(v);
                break;
            }

            case jansson::JSON_REAL:
                ++stats.number_count;
                stats.total_number_value += json_real_value(node);
                break;

            case jansson::JSON_INTEGER:
                ++stats.number_count;
                stats.total_number_value += json_integer_value(node);
                break;

            default:
                assert(false && "unknown node type");
        }
    }

    void test(jsonstats& stats, const TestFile& file) {
        json_error_t error;
        json_t* root = json_loadb(reinterpret_cast<const char*>(file.data), file.length, 0, &error);
        if (!root) {
            fprintf(stderr, "jansson failed to parse\n");
            abort();
        }

        traverse(stats, root);

        json_decref(root);
    }
}

namespace sajson_test {
    void traverse(jsonstats& stats, const sajson::value& node) {
        using namespace sajson;

        switch (node.get_type()) {
            case TYPE_NULL:
                ++stats.null_count;
                break;

            case TYPE_FALSE:
                ++stats.false_count;
                break;

            case TYPE_TRUE:
                ++stats.true_count;
                break;

            case TYPE_ARRAY: {
                ++stats.array_count;
                auto length = node.get_length();
                stats.total_array_length += length;
                for (size_t i = 0; i < length; ++i) {
                    traverse(stats, node.get_array_element(i));
                }
                break;
            }

            case TYPE_OBJECT: {
                ++stats.object_count;
                auto length = node.get_length();
                stats.total_object_length += length;
                for (auto i = 0u; i < length; ++i) {
                    traverse(stats,node.get_object_value(i));
                }
                break;
            }
        
            case TYPE_STRING:
                ++stats.string_count;
                stats.total_string_length += node.get_string_length();
                break;

            case TYPE_DOUBLE:
            case TYPE_INTEGER:
                ++stats.number_count;
                stats.total_number_value += node.get_number_value();
                break;

            default:
                assert(false && "unknown node type");
        }
    }

    void test(jsonstats& stats, const TestFile& file) {
        Copy data(file);
        const auto& document = sajson::parse(sajson::string(data.get(), file.length));
        if (!document.is_valid()) {
            fprintf(stderr, "sajson parse error (%d,%d): %s\n",
                    static_cast<int>(document.get_error_line()),
                    static_cast<int>(document.get_error_column()),
                    document.get_error_message().c_str());
            abort();
        }

        const auto& root = document.get_root();
        traverse(stats, root);
    }
}

namespace pjson_test {
    void traverse(jsonstats& stats, pjson::value_variant& v) {
	if (v.is_null()) {
	    ++stats.null_count;
	} else if (v.is_bool()) {
	    if (v.as_bool()) {
		++stats.true_count;
	    } else {
		++stats.false_count;
	    }
	} else if (v.is_array()) {
	    ++stats.array_count;
	    auto& array = v.get_array();
	    auto size = array.size();
	    stats.total_array_length += size;
	    for (pjson::uint i = 0; i < size; ++i) {
		traverse(stats, array[i]);
	    }
	} else if (v.is_object()) {
	    ++stats.object_count;
	    auto& obj = v.get_object();
	    auto size = obj.size();
	    stats.total_object_length += size;
	    for (auto i = 0u; i < size; ++i) {
		traverse(stats, obj[i].get_value());
	    }
	} else if (v.is_string()) {
	    ++stats.string_count;
	    stats.total_string_length += v.get_string().size();
	} else if (v.is_double()) {
	    ++stats.number_count;
	    stats.total_number_value += v.as_double();
	} else if (v.is_int()) {
	    ++stats.number_count;
	    stats.total_number_value += v.as_int64();
	} else {
	    assert(false && "unknown node type");
        }
    }

    void test(jsonstats& stats, const TestFile& file) {
	ZeroTerminatedCopy data(file);
	pjson::document doc;
	doc.deserialize_in_place(data.get());
	
	traverse(stats, doc);
    }
}

struct TestImplementation {
    typedef void (*TestFunction)(jsonstats&, const TestFile&);

    const char* name;
    TestFunction func;
};
TestImplementation test_implementations[] = {
    { "sajson", &sajson_test::test },
    { "rapidjson", &rapidjson_test::test },
    //{ "vjson", &vjson_test::test },
    //{ "yajl", &yajl_test::test },
    //{ "jansson", &jansson_test::test },
    { "pjson", &pjson_test::test },
};

const char* benchmark_files[] = {
    "testdata/twitter.json",
    "testdata/apache_builds.json",
    "testdata/github_events.json",
    "testdata/instruments.json",
    "testdata/mesh.json",
    "testdata/update-center.json",
};

const int CLOCKS_PER_TEST = CLOCKS_PER_SEC;

template<typename T, size_t L>
size_t array_length(T(&)[L]) {
    return L;
}

void benchmark(const char* filename) {
    FILE* fh = fopen(filename, "rb");
    if (!fh) {
        fprintf(stderr, "failed to open file: %s\n", filename);
        exit(1);
    }
    fseek(fh, 0, SEEK_END);
    size_t length = ftell(fh);

    std::vector<char> contents(length);

    fseek(fh, 0, SEEK_SET);
    if (length != fread(&contents[0], 1, length, fh)) {
        fprintf(stderr, "Failed to read file\n");
        abort();
    }
    fclose(fh);

    TestFile file = { filename, length, reinterpret_cast<unsigned char*>(&contents[0]) };

    jsonstats expected_stats;
    bool first = true;
    for (size_t i = 0; i < array_length(test_implementations); ++i) {
        auto& implementation = test_implementations[i];
        jsonstats this_stats;
        if (first) {
            implementation.func(expected_stats, file);
        } else {
            implementation.func(this_stats, file);
            if (this_stats != expected_stats) {
                printf("parse results did not match.\nexpected:\n");
                expected_stats.print();
                printf("actual:\n");
                this_stats.print();
            }
        }
            
        clock_t start = clock();
        clock_t until = start + CLOCKS_PER_TEST;
        clock_t end;
        int parses = 0;
        do {
            implementation.func(this_stats, file);
            ++parses;
        } while ((end = clock()) < until);
        double elapsed = double(end - start) / CLOCKS_PER_SEC;
        double secondsPerParse = elapsed / parses;
        printf("%s,%s,%f,%d,%f\n", implementation.name, filename, elapsed, parses, secondsPerParse);
        fflush(stdout);
    }
}

int main(int argc, const char** argv) {
    printf("Implementation,File,Elapsed,Parses,SecondPerParse\n");

    if (argc <= 1) {
        for (size_t i = 0; i < array_length(benchmark_files); ++i) {
            auto& filename = benchmark_files[i];
            benchmark(filename);
        }
        return 0;
    }

    for (int i = 1; i < argc; ++i) {
        benchmark(argv[i]);
    }
}
