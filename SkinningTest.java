final class CalVector4
{
	float x, y, z, w;
	
	CalVector4() {}
	CalVector4(float x, float y, float z) 
	{
		this.x = x;
		this.y = y;
		this.z = z;		
		this.w = 0;
	}	
}

final class BoneTransform 
{
	float rowx_x, rowx_y, rowx_z, rowx_w;
	float rowy_x, rowy_y, rowy_z, rowy_w;
	float rowz_x, rowz_y, rowz_z, rowz_w;
}

final class Influence
{
	int boneId = -1;
	float weight = 0;
	boolean lastInfluenceForThisVertex = false;
}

final class Vertex
{
	final CalVector4 position = new CalVector4(1.0f, 2.0f, 3.0f);
	final CalVector4 normal = new CalVector4(0.0f, 0.0f, 1.0f);
}

public final class SkinningTest
{
	static void scaleMatrix(BoneTransform result, BoneTransform mat, float s)
	{
		result.rowx_x = s * mat.rowx_x;
		result.rowx_y = s * mat.rowx_y;
		result.rowx_z = s * mat.rowx_z;
		result.rowx_w = s * mat.rowx_w;
		result.rowy_x = s * mat.rowy_x;
		result.rowy_y = s * mat.rowy_y;
		result.rowy_z = s * mat.rowy_z;
		result.rowy_w = s * mat.rowy_w;
		result.rowz_x = s * mat.rowz_x;
		result.rowz_y = s * mat.rowz_y;
		result.rowz_z = s * mat.rowz_z;
		result.rowz_w = s * mat.rowz_w;
	}
	
	static void addScaledMatrix(BoneTransform result, BoneTransform mat, float s) 
	{
		result.rowx_x += s * mat.rowx_x;
		result.rowx_y += s * mat.rowx_y;
		result.rowx_z += s * mat.rowx_z;
		result.rowx_w += s * mat.rowx_w;
		result.rowy_x += s * mat.rowy_x;
		result.rowy_y += s * mat.rowy_y;
		result.rowy_z += s * mat.rowy_z;
		result.rowy_w += s * mat.rowy_w;
		result.rowz_x += s * mat.rowz_x;
		result.rowz_y += s * mat.rowz_y;
		result.rowz_z += s * mat.rowz_z;
		result.rowz_w += s * mat.rowz_w;
	}
	
	static void transformPoint(CalVector4 result, BoneTransform m, CalVector4 v) 
	{
		result.x = m.rowx_x * v.x + m.rowx_y * v.y + m.rowx_z * v.z + m.rowx_w;
		result.y = m.rowy_x * v.x + m.rowy_y * v.y + m.rowy_z * v.z + m.rowy_w;
		result.z = m.rowz_x * v.x + m.rowz_y * v.y + m.rowz_z * v.z + m.rowz_w;
	}

	static void transformVector(CalVector4 result, BoneTransform m, CalVector4 v) 
	{
		result.x = m.rowx_x * v.x + m.rowx_y * v.y + m.rowx_z * v.z;
		result.y = m.rowy_x * v.x + m.rowy_y * v.y + m.rowy_z * v.z;
		result.z = m.rowz_x * v.x + m.rowz_y * v.y + m.rowz_z * v.z;
	}

	static void calculateVerticesAndNormals(BoneTransform[] boneTransforms, Vertex[] vertices, Influence[] influences, CalVector4[] output_vertex)
	{
    int vertexCount = vertices.length;
    assert(vertices.length == influences.length);

    BoneTransform total_transform = new BoneTransform();

    int influenceId = 0, vertexId = 0, outputVertexId = 0;

    // calculate all submesh vertices
    while (vertexCount-- > 0) 
    {
			scaleMatrix(total_transform, boneTransforms[influences[influenceId].boneId], influences[influenceId].weight);

			while (!influences[influenceId].lastInfluenceForThisVertex) 
			{
	    	++influenceId;
		    addScaledMatrix(total_transform, boneTransforms[influences[influenceId].boneId], influences[influenceId].weight);
			}

			transformPoint(output_vertex[outputVertexId++], total_transform, vertices[vertexId].position);
			transformVector(output_vertex[outputVertexId++], total_transform, vertices[vertexId].normal);
			++vertexId;
    }
	}

	public static void main(String[] args) 
	{
    int N = 10000;

    Vertex[] v = new Vertex[N];
    Influence[] i = new Influence[N];
    for (int k = 0; k < N; ++k) 
    {
			Vertex vertex = v[k] = new Vertex();
					
			Influence influence = i[k] = new Influence();
			influence.boneId = 0;
			influence.weight = 1.0f;
			influence.lastInfluenceForThisVertex = true;
    }

    BoneTransform[] bt = { new BoneTransform() };

    CalVector4[] output = new CalVector4[N * 2];
    for (int k = 0; k < N * 2; ++k) 
    {
			output[k] = new CalVector4();
    }

		for(int l=0; l<100; l++)
		{
		  long vertices_skinned = 0;

		  long start = System.nanoTime();
		  long now = System.nanoTime();
		  while ((now - start) < 1e09) 
		  {
				calculateVerticesAndNormals(bt, v, i, output);
				vertices_skinned += N;
				now = System.nanoTime();
		  }
		  long elapsed = now - start;
		  
			float sum = 0;
			for (int k = 0; k < N * 2; k++) {
				sum += (output[k].x + output[k].y + output[k].z + output[k].w);
			}		  
		  System.out.println("Skinned vertices per second: " + Math.round(vertices_skinned * 1e09 / elapsed) + " blah=" + sum);
	  }
  }
}

