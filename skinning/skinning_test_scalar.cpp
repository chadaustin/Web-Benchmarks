// compiled in cygwin with:
// g++ -Wall -O2 -o skinning_test_no_simd skinning_test_no_simd.cpp

#include <vector>
#include <set>
#include <map>
#include <assert.h>
#include <math.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

#define CAL3D_ALIGN_HEAD(N)
#define CAL3D_ALIGN_TAIL(N)

struct CalBase4 {
  float x, y, z, w;

  void set(float _x, float _y, float _z, float _w) {
    x = _x;
    y = _y;
    z = _z;
    w = _w;
  }
}
CAL3D_ALIGN_TAIL(16);

struct CalVector4 : CalBase4 {
  CalVector4() {
    x = 0.0f;
    y = 0.0f;
    z = 0.0f;
    w = 0.0f;
  }

  CalVector4(float x, float y, float z, float w = 0.0f) {
    this->x = x;
    this->y = y;
    this->z = z;
    this->w = w;
  }

  void setAsVector(float x, float y, float z) {
    this->x = x;
    this->y = y;
    this->z = z;
    w = 0.0f;
  }
};

struct CalPoint4 : CalBase4 {
  CalPoint4() {
    x = 0.0f;
    y = 0.0f;
    z = 0.0f;
    w = 1.0f;
  }

  CalPoint4(float x, float y, float z, float w = 1.0f) {
    this->x = x;
    this->y = y;
    this->z = z;
    this->w = w;
  }

  void setAsPoint(float x, float y, float z) {
    x = this->x;
    y = this->y;
    z = this->z;
    w = 1.0f;
  }
};

// 3x3 transform matrix plus a translation 3-vector (stored in the w components
// of the rows.  This struct needs to be 16-byte aligned for SSE.
struct BoneTransform {
  CalVector4 rowx;
  CalVector4 rowy;
  CalVector4 rowz;
};

struct Influence
{
  Influence() {
    boneId = -1;
    weight = 0.0f;
    lastInfluenceForThisVertex = 0;
  }
  
  Influence(unsigned b, float w, bool last) {
    boneId = b;
    weight = w;
    lastInfluenceForThisVertex = last ? 1 : 0;
  }

  unsigned boneId;
  float weight;
  unsigned lastInfluenceForThisVertex;
};

CAL3D_ALIGN_HEAD(16)
struct Vertex
{
  CalPoint4 position;
  CalVector4 normal;
}
CAL3D_ALIGN_TAIL(16);

inline void ScaleMatrix(BoneTransform& result, const BoneTransform& mat, const float s) {
  result.rowx.x = s * mat.rowx.x;
  result.rowx.y = s * mat.rowx.y;
  result.rowx.z = s * mat.rowx.z;
  result.rowx.w = s * mat.rowx.w;
  result.rowy.x = s * mat.rowy.x;
  result.rowy.y = s * mat.rowy.y;
  result.rowy.z = s * mat.rowy.z;
  result.rowy.w = s * mat.rowy.w;
  result.rowz.x = s * mat.rowz.x;
  result.rowz.y = s * mat.rowz.y;
  result.rowz.z = s * mat.rowz.z;
  result.rowz.w = s * mat.rowz.w;
}
inline void AddScaledMatrix(BoneTransform& result, const BoneTransform& mat, const float s) {
  result.rowx.x += s * mat.rowx.x;
  result.rowx.y += s * mat.rowx.y;
  result.rowx.z += s * mat.rowx.z;
  result.rowx.w += s * mat.rowx.w;
  result.rowy.x += s * mat.rowy.x;
  result.rowy.y += s * mat.rowy.y;
  result.rowy.z += s * mat.rowy.z;
  result.rowy.w += s * mat.rowy.w;
  result.rowz.x += s * mat.rowz.x;
  result.rowz.y += s * mat.rowz.y;
  result.rowz.z += s * mat.rowz.z;
  result.rowz.w += s * mat.rowz.w;
}
inline void TransformPoint(CalVector4& result, const BoneTransform& m, const CalBase4& v) {
  result.x = m.rowx.x * v.x + m.rowx.y * v.y + m.rowx.z * v.z + m.rowx.w;
  result.y = m.rowy.x * v.x + m.rowy.y * v.y + m.rowy.z * v.z + m.rowy.w;
  result.z = m.rowz.x * v.x + m.rowz.y * v.y + m.rowz.z * v.z + m.rowz.w;
}
inline void TransformVector(CalVector4& result, const BoneTransform& m, const CalBase4& v) {
  result.x = m.rowx.x * v.x + m.rowx.y * v.y + m.rowx.z * v.z;
  result.y = m.rowy.x * v.x + m.rowy.y * v.y + m.rowy.z * v.z;
  result.z = m.rowz.x * v.x + m.rowz.y * v.y + m.rowz.z * v.z;
}

void calculateVerticesAndNormals_x87(
  const BoneTransform* boneTransforms,
  int vertexCount,
  const Vertex* vertices,
  const Influence* influences,
  CalVector4* output_vertex
) {

  BoneTransform total_transform;

  // calculate all submesh vertices
  while (vertexCount--) {
    ScaleMatrix(total_transform, boneTransforms[influences->boneId], influences->weight);

    while (!influences++->lastInfluenceForThisVertex) {
      AddScaledMatrix(total_transform, boneTransforms[influences->boneId], influences->weight);
    }

    TransformPoint(output_vertex[0], total_transform, vertices->position);
    TransformVector(output_vertex[1], total_transform, vertices->normal);
    ++vertices;
    output_vertex += 2;
  }
}

int main() {
  const int N = 10000;

  Vertex v[N];
  Influence i[N];
  for (int k = 0; k < N; ++k) {
    v[k].position.setAsPoint(1.0f, 2.0f, 3.0f);
    v[k].normal.setAsVector(0.0f, 0.0f, 1.0f);
    i[k].boneId = 0;
    i[k].weight = 1.0f;
    i[k].lastInfluenceForThisVertex = true;
  }

  BoneTransform bt;
  memset(&bt, 0, sizeof(bt));

  CAL3D_ALIGN_HEAD(16) CalVector4 output[N * 2] CAL3D_ALIGN_TAIL(16);

  long long vertices_skinned = 0;
  
  clock_t start = clock();
  while (clock() < start + CLOCKS_PER_SEC * 5) {
    calculateVerticesAndNormals_x87(&bt, N, v, i, output);
    vertices_skinned += N;
  }
  clock_t elapsed = clock() - start;

  float sum = 0;
  for (unsigned i = 0; i < N * 2; ++i) {
    sum += (output[i].x + output[i].y + output[i].z + output[i].w);
  }

  printf("Skinned vertices per second: %d, blah=%f\n", (int)(vertices_skinned * CLOCKS_PER_SEC / elapsed), sum);
}
