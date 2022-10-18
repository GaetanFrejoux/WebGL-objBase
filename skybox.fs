precision mediump float;

varying vec3 vDir;

uniform samplerCube skybox;

void main()
{    
    gl_FragColor = textureCube(skybox, vDir);
}