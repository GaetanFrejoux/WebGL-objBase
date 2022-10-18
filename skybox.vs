attribute vec3 aPos;
varying vec3 vDir;
uniform mat4 uPMatrix;
uniform mat4 uMVMatrix;

void main()
{
    vDir = aPos.xzy;
    gl_Position = uPMatrix * uMVMatrix * vec4(aPos, 1.0);
}  