
precision mediump float;

varying vec4 pos3D;
varying vec3 N;

uniform mat4 uIRotationMatrix;
uniform samplerCube skybox; 

// ==============================================
void main(void)
{
	vec3 col = vec3(0.8,0.4,0.4) * dot(N,normalize(vec3(-pos3D))); // Lambert rendering, eye light source
	vec3 I = normalize(-pos3D.xyz); // ray direction
	vec3 R = reflect(I,normalize(N)); // reflection direction
	vec3 dir = mat3(uIRotationMatrix) * R;


	//gl_FragColor = vec4(col,1.0);
	gl_FragColor = textureCube(skybox, -dir.xzy);
}




