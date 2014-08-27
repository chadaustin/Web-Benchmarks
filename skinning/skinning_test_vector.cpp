#include <vector>
#include <set>
#include <map>
#include <assert.h>
#include <math.h>
#include <xmmintrin.h>
#include <string.h>
#include <stdio.h>
#include <time.h>

#define CAL3D_ALIGN_HEAD(N)
#define CAL3D_ALIGN_TAIL(N) __attribute__((aligned(16)))

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

typedef float float32x4 __attribute__((__vector_size__(16)));

void calculateVerticesAndNormals_vector(
  const BoneTransform* boneTransforms,
  int vertexCount,
  const Vertex* vertices,
  const Influence* influences,
  CalVector4* output_vertex
) {

  float32x4 rowx;
  float32x4 rowy;
  float32x4 rowz;

  // calculate all submesh vertices
  while (vertexCount--) {
    float32x4 weight = {influences->weight, influences->weight, influences->weight, influences->weight};

    const BoneTransform& bt = boneTransforms[influences->boneId];

    rowx = (*((const float32x4*)(reinterpret_cast<const float*>(&bt.rowx)))) * weight;
    rowy = (*((const float32x4*)(reinterpret_cast<const float*>(&bt.rowy)))) * weight;
    rowz = (*((const float32x4*)(reinterpret_cast<const float*>(&bt.rowz)))) * weight;

    while (!influences++->lastInfluenceForThisVertex) {
      float32x4 weight = {influences->weight, influences->weight, influences->weight, influences->weight};

      const BoneTransform& bt = boneTransforms[influences->boneId];

      rowx += (*((const float32x4*)(reinterpret_cast<const float*>(&bt.rowx)))) * weight;
      rowy += (*((const float32x4*)(reinterpret_cast<const float*>(&bt.rowy)))) * weight;
      rowz += (*((const float32x4*)(reinterpret_cast<const float*>(&bt.rowz)))) * weight;
    }

    {
      // transform position
      const float32x4 position = *((const float32x4*)reinterpret_cast<const float*>(&vertices->position));

      const float32x4 mulx = position * rowx;
      const float32x4 muly = position * rowy;
      const float32x4 mulz = position * rowz;

      const float32x4 copylo = __builtin_shufflevector(mulx, muly, 0, 4, 1, 5);
      const float32x4 copyhi = __builtin_shufflevector(mulx, muly, 2, 6, 3, 7);
      const float32x4 sum1 = copylo + copyhi;

      const float32x4 lhps = __builtin_shufflevector(mulz, sum1, 0, 1, 4, 5);
      const float32x4 hlps = __builtin_shufflevector(sum1, mulz, 6, 7, 2, 3);
      const float32x4 sum2 = lhps + hlps;

      *((float32x4*)(reinterpret_cast<const float*>(output_vertex))) = __builtin_shufflevector(sum2, sum2, 2, 3, 0, 0);

      float32x4 sum3 = __builtin_shufflevector(sum2, sum2, 1, 1, 1, 1);
      sum3 = sum2 + sum3;
      output_vertex->z = sum3[0];
    }

    // transform normal
    {
      const float32x4 normal = *((const float32x4*)reinterpret_cast<const float*>(&vertices->normal));

      const float32x4 mulx = normal * rowx;
      const float32x4 muly = normal * rowy;
      const float32x4 mulz = normal * rowz;

      const float32x4 copylo = __builtin_shufflevector(mulx, muly, 0, 4, 1, 5);
      const float32x4 copyhi = __builtin_shufflevector(mulx, muly, 2, 6, 3, 7);
      const float32x4 sum1 = copylo + copyhi;

      const float32x4 lhps = __builtin_shufflevector(mulz, sum1, 0, 1, 4, 5);
      const float32x4 hlps = __builtin_shufflevector(sum1, mulz, 6, 7, 2, 3);
      const float32x4 sum2 = lhps + hlps;

      *((float32x4*)(reinterpret_cast<const float*>(&output_vertex[1]))) = __builtin_shufflevector(sum2, sum2, 2, 3, 0, 0);

      float32x4 sum3 = __builtin_shufflevector(sum2, sum2, 1, 1, 1, 1);
      sum3 = sum2 + sum3;
      output_vertex[1].z = sum3[0];
    }

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
    calculateVerticesAndNormals_vector(&bt, N, v, i, output);
    vertices_skinned += N;
  }
  clock_t elapsed = clock() - start;

  float sum = 0;
  for (unsigned i = 0; i < N * 2; ++i) {
    sum += (output[i].x + output[i].y + output[i].z + output[i].w);
  }

  printf("Skinned vertices per second: %d, blah=%f\n", (int)(vertices_skinned * CLOCKS_PER_SEC / elapsed), sum);
}
