using System;
using System.Runtime.InteropServices;
using System.Diagnostics;

[StructLayout(LayoutKind.Sequential)]
public struct CalVector4 {
    public float X, Y, Z, W;

    public CalVector4 (float x, float y, float z, float w = 0.0f) {
        X = x;
        Y = y;
        Z = z;
        W = w;
    }
}

[StructLayout(LayoutKind.Sequential)]
public struct BoneTransform {
    public CalVector4 RowX, RowY, RowZ;

    public void Scale (out BoneTransform result, float s) {
        result.RowX.X = RowX.X * s;
        result.RowX.Y = RowX.Y * s;
        result.RowX.Z = RowX.Z * s;
        result.RowX.W = RowX.W * s;

        result.RowY.X = RowY.X * s;
        result.RowY.Y = RowY.Y * s;
        result.RowY.Z = RowY.Z * s;
        result.RowY.W = RowY.W * s;

        result.RowZ.X = RowZ.X * s;
        result.RowZ.Y = RowZ.Y * s;
        result.RowZ.Z = RowZ.Z * s;
        result.RowZ.W = RowZ.W * s;
    }

    public void AddScaled (ref BoneTransform mutate, float s) {
        mutate.RowX.X += RowX.X * s;
        mutate.RowX.Y += RowX.Y * s;
        mutate.RowX.Z += RowX.Z * s;
        mutate.RowX.W += RowX.W * s;

        mutate.RowY.X += RowY.X * s;
        mutate.RowY.Y += RowY.Y * s;
        mutate.RowY.Z += RowY.Z * s;
        mutate.RowY.W += RowY.W * s;

        mutate.RowZ.X += RowZ.X * s;
        mutate.RowZ.Y += RowZ.Y * s;
        mutate.RowZ.Z += RowZ.Z * s;
        mutate.RowZ.W += RowZ.W * s;
    }

    public void TransformPoint (out CalVector4 result, ref CalVector4 point) {
        result = new CalVector4(
            (RowX.X * point.X) + (RowX.Y * point.Y) + (RowX.Z * point.Z) + RowX.W,
            (RowY.X * point.X) + (RowY.Y * point.Y) + (RowY.Z * point.Z) + RowY.W,
            (RowZ.X * point.X) + (RowZ.Y * point.Y) + (RowZ.Z * point.Z) + RowZ.W
        );
    }

    public void TransformVector (out CalVector4 result, ref CalVector4 vector) {
        result = new CalVector4(
            (RowX.X * vector.X) + (RowX.Y * vector.Y) + (RowX.Z * vector.Z),
            (RowY.X * vector.X) + (RowY.Y * vector.Y) + (RowY.Z * vector.Z),
            (RowZ.X * vector.X) + (RowZ.Y * vector.Y) + (RowZ.Z * vector.Z)
        );
    }
}

[StructLayout(LayoutKind.Sequential)]
public struct Influence {
    public int BoneId;
    public float Weight;
    public bool LastInfluenceForThisVertex;
}

[StructLayout(LayoutKind.Sequential)]
public struct Vertex {
    public CalVector4 Position, Normal;
}

public static class SkinningTest {
    public static void CalculateVerticesAndNormals (
        BoneTransform[] boneTransforms,
        int vertexCount,
        Vertex[] vertices,
        Influence[] influences,
        CalVector4[] output
    ) {
        Debug.Assert(output.Length == vertices.Length * 2);

        BoneTransform totalTransform;

        for (
            int sourceVertex = 0, sourceInfluence = 0, outputVertex = 0; 
            sourceVertex < vertices.Length; 
            sourceVertex++, sourceInfluence++, outputVertex += 2
        ) {
            var influence = influences[sourceInfluence];

            boneTransforms[influence.BoneId].Scale(
                out totalTransform, influence.Weight
            );

            while (!influence.LastInfluenceForThisVertex) {
                sourceInfluence += 1;
                influence = influences[sourceInfluence];

                boneTransforms[influence.BoneId].AddScaled(
                    ref totalTransform, influence.Weight
                );
            }

            totalTransform.TransformPoint(
                out output[outputVertex], ref vertices[sourceVertex].Position
            );
            totalTransform.TransformVector(
                out output[outputVertex + 1], ref vertices[sourceVertex].Normal
            );
        }
    }

    public static void Main () {
        const int N = 10000;
        const long SecondInTicks = 10000000;

        var vertices = new Vertex[N];
        var influences = new Influence[N];

        for (int i = 0; i < N; i++) {
            vertices[i] = new Vertex {
                Position = new CalVector4(1, 2, 3),
                Normal = new CalVector4(0, 0, 1)
            };

            influences[i] = new Influence {
                BoneId = 0,
                Weight = 1.0f,
                LastInfluenceForThisVertex = true
            };
        }

        var boneTransforms = new BoneTransform[] {
            new BoneTransform()
        };

        var output = new CalVector4[N * 2];

        for (int i = 0; i < 100; i++) {
            long verticesSkinned = 0;
            long started = DateTime.UtcNow.Ticks;

            while (DateTime.UtcNow.Ticks < (started + SecondInTicks)) {
                CalculateVerticesAndNormals(
                    boneTransforms, N, vertices, influences, output
                );

                verticesSkinned += N;
            }

            long elapsed = DateTime.UtcNow.Ticks - started;

            Console.WriteLine(
                "Skinned vertices per second: {0}",
                (verticesSkinned * SecondInTicks) / elapsed
            );
        }
    }
}