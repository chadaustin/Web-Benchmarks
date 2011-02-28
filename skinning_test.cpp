// compiled in cygwin with:
// g++ -Wall -O2 -o skinning_test skinning_test.cpp

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


void calculateVerticesAndNormals_SSE_intrinsics(
  const BoneTransform* boneTransforms,
  int vertexCount,
  const Vertex* vertices,
  const Influence* influences,
  CalVector4* output_vertex
) {

  __m128 rowx;
  __m128 rowy;
  __m128 rowz;
  __m128 weight;

  // calculate all submesh vertices
  while (vertexCount--) {
    weight = _mm_load_ss(&influences->weight);
    weight = _mm_shuffle_ps(weight, weight, _MM_SHUFFLE(0, 0, 0, 0));

    const BoneTransform& bt = boneTransforms[influences->boneId];

    rowx = _mm_mul_ps(_mm_load_ps((const float*)&bt.rowx), weight);
    rowy = _mm_mul_ps(_mm_load_ps((const float*)&bt.rowy), weight);
    rowz = _mm_mul_ps(_mm_load_ps((const float*)&bt.rowz), weight);

    while (!influences++->lastInfluenceForThisVertex) {
      weight = _mm_load_ss(&influences->weight);
      weight = _mm_shuffle_ps(weight, weight, _MM_SHUFFLE(0, 0, 0, 0));

      const BoneTransform& bt = boneTransforms[influences->boneId];

      rowx = _mm_add_ps(rowx, _mm_mul_ps(_mm_load_ps((const float*)&bt.rowx), weight));
      rowy = _mm_add_ps(rowy, _mm_mul_ps(_mm_load_ps((const float*)&bt.rowy), weight));
      rowz = _mm_add_ps(rowz, _mm_mul_ps(_mm_load_ps((const float*)&bt.rowz), weight));
    }

    {
      // transform position
      const __m128 position = _mm_load_ps((const float*)&vertices->position);
      
      const __m128 mulx = _mm_mul_ps(position, rowx);
      const __m128 muly = _mm_mul_ps(position, rowy);
      const __m128 mulz = _mm_mul_ps(position, rowz);

      const __m128 copylo = _mm_unpacklo_ps(mulx, muly);
      const __m128 copyhi = _mm_unpackhi_ps(mulx, muly);
      const __m128 sum1 = _mm_add_ps(copylo, copyhi);

      const __m128 lhps = _mm_movelh_ps(mulz, sum1);
      const __m128 hlps = _mm_movehl_ps(sum1, mulz);
      const __m128 sum2 = _mm_add_ps(lhps, hlps);

      _mm_storeh_pi((__m64*)output_vertex, sum2);

      __m128 sum3 = _mm_shuffle_ps(sum2, sum2, _MM_SHUFFLE(1, 1, 1, 1));
      sum3 = _mm_add_ss(sum2, sum3);
      _mm_store_ss(&output_vertex->z, sum3);
    }

    // transform normal
    {
      const __m128 normal = _mm_load_ps((const float*)&vertices->normal);
      
      const __m128 mulx = _mm_mul_ps(normal, rowx);
      const __m128 muly = _mm_mul_ps(normal, rowy);
      const __m128 mulz = _mm_mul_ps(normal, rowz);

      const __m128 copylo = _mm_unpacklo_ps(mulx, muly);
      const __m128 copyhi = _mm_unpackhi_ps(mulx, muly);
      const __m128 sum1 = _mm_add_ps(copylo, copyhi);

      const __m128 lhps = _mm_movelh_ps(mulz, sum1);
      const __m128 hlps = _mm_movehl_ps(sum1, mulz);
      const __m128 sum2 = _mm_add_ps(lhps, hlps);

      _mm_storeh_pi((__m64*)&output_vertex[1], sum2);

      __m128 sum3 = _mm_shuffle_ps(sum2, sum2, _MM_SHUFFLE(1, 1, 1, 1));
      sum3 = _mm_add_ss(sum2, sum3);
      _mm_store_ss(&output_vertex[1].z, sum3);
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
  while (clock() < start + CLOCKS_PER_SEC) {
    calculateVerticesAndNormals_SSE_intrinsics(&bt, N, v, i, output);
    vertices_skinned += N;
  }
  clock_t elapsed = clock() - start;

  float sum = 0;
  for (unsigned i = 0; i < N * 2; ++i) {
    sum += (output[i].x + output[i].y + output[i].z + output[i].w);
  }

  printf("Skinned vertices per second: %d, blah=%f\n", (int)(vertices_skinned * CLOCKS_PER_SEC / elapsed), sum);
}
