
// =====================================================
var gl;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;
// =====================================================

var BUNNY = null;
var MUSTANG = null;
var PORSCHE = null;
var SPHERE = null;
var PLANE = null;
var SKYBOX = null;
var SELECTED = null;
var FRESNELVALUE = 1.0;
// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================

class objmesh {

	// --------------------------------------------
	constructor(objFname) {
		this.objName = objFname;
		this.shaderName = 'obj';
		this.loaded = -1;
		this.shader = null;
		this.mesh = null;

		loadObjFile(this);
		loadShaders(this);
	}

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");

		//mirroir
		this.shader.skybox = gl.getUniformLocation(this.shader, "skybox");
		this.shader.rIRotationUniform = gl.getUniformLocation(this.shader, "uIRotationMatrix");

	}

	// --------------------------------------------
	setMatrixUniforms() {
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);
		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);

		//mirroir
		gl.uniform1i(this.shader.skybox, 0);
		gl.uniformMatrix4fv(this.shader.rIRotationUniform, false, mat4.inverse(rotMatrix));
		mat4.inverse(rotMatrix);
	}

	// --------------------------------------------
	draw() {
		if (this.shader && this.loaded == 4 && this.mesh != null) {
			this.setShadersParams();
			this.setMatrixUniforms();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
}



// =====================================================
// PLAN 3D, Support géométrique
// =====================================================

class plane {

	// --------------------------------------------
	constructor() {
		this.shaderName = 'plane';
		this.loaded = -1;
		this.shader = null;
		this.initAll();
	}

	// --------------------------------------------
	initAll() {
		var size = 1.0;
		var vertices = [
			-size, -size, 0.1,
			size, -size, 0.1,
			size, size, 0.1,
			-size, size, 0.1
		];

		var texcoords = [
			0.0, 0.0,
			0.0, 1.0,
			1.0, 1.0,
			1.0, 0.0
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 4;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 4;

		loadShaders(this);
	}


	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib, this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
	}

	// --------------------------------------------
	draw() {
		if (this.shader && this.loaded == 4) {
			this.setShadersParams();

			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vBuffer.numItems);
			gl.drawArrays(gl.LINE_LOOP, 0, this.vBuffer.numItems);
		}
	}

}



// =====================================================
// SKYBOX
// =====================================================
class skybox {

	constructor(size) {
		this.shaderName = 'skybox';
		this.loaded = -1;
		this.size = size;
		this.shader = null;
		this.vertices = [
			// positions          
			-size, size, -size,
			-size, -size, -size,
			size, -size, -size,
			size, -size, -size,
			size, size, -size,
			-size, size, -size,

			-size, -size, size,
			-size, -size, -size,
			-size, size, -size,
			-size, size, -size,
			-size, size, size,
			-size, -size, size,

			size, -size, -size,
			size, -size, size,
			size, size, size,
			size, size, size,
			size, size, -size,
			size, -size, -size,

			-size, -size, size,
			-size, size, size,
			size, size, size,
			size, size, size,
			size, -size, size,
			-size, -size, size,

			-size, size, -size,
			size, size, -size,
			size, size, size,
			size, size, size,
			-size, size, size,
			-size, size, -size,

			-size, -size, -size,
			-size, -size, size,
			size, -size, -size,
			size, -size, -size,
			-size, -size, size,
			size, -size, size
		];
		this.initAll();
	}

	// --------------------------------------------
	initAll() {

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

		let faces = [
			{ url: 'textures/right.jpg', target: gl.TEXTURE_CUBE_MAP_POSITIVE_X },
			{ url: 'textures/left.jpg', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X },
			{ url: 'textures/top.jpg', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y },
			{ url: 'textures/bottom.jpg', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y },
			{ url: 'textures/front.jpg', target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z },
			{ url: 'textures/back.jpg', target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z }
		];


		for (var i = 0; i < 6; i++) {
			var face = faces[i];
			var image = new Image();
			image.onload = function (face, image, i) {
				return function () {
					gl.texImage2D(face.target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
					gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
				};
			}(face, image, i);
			image.src = face.url;
		}




		// set buffers
		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 36;

		loadShaders(this);
	}

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, 'aPos');
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		//set uniforms
		this.shader.textureLocation = gl.getUniformLocation(this.shader, "skybox");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		gl.uniform1i(this.shader.textureLocation, 0);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);

		gl.activeTexture(gl.TEXTURE0);
	}

	// --------------------------------------------
	draw() {
		//wait for cubemap loaded
		if (this.shader) {
			this.setShadersParams();
			gl.drawArrays(gl.TRIANGLES, 0, this.vBuffer.numItems);
		}
	}
}

// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================



// =====================================================
function initGL(canvas) {
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.7, 0.7, 0.7, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK);
	} catch (e) { }
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}


// =====================================================
loadObjFile = function (OBJ3D) {
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var tmpMesh = new OBJ.Mesh(xhttp.responseText);
			OBJ.initMeshBuffers(gl, tmpMesh);
			OBJ3D.mesh = tmpMesh;
		}
	}



	xhttp.open("GET", OBJ3D.objName, true);
	xhttp.send();
}



// =====================================================
function loadShaders(Obj3D) {
	loadShaderText(Obj3D, '.vs');
	loadShaderText(Obj3D, '.fs');
}

// =====================================================
function loadShaderText(Obj3D, ext) {   // lecture asynchrone...
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			if (ext == '.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded++; }
			if (ext == '.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded++; }
			if (Obj3D.loaded == 2) {
				Obj3D.loaded++;
				compileShaders(Obj3D);
				Obj3D.loaded++;
			}
		}
	}

	Obj3D.loaded = 0;
	xhttp.open("GET", Obj3D.shaderName + ext, true);
	xhttp.send();
}

// =====================================================
function compileShaders(Obj3D) {
	Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
	gl.compileShader(Obj3D.vshader);
	if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
		console.log("Vertex Shader FAILED... " + Obj3D.shaderName + ".vs");
		console.log(gl.getShaderInfoLog(Obj3D.vshader));
	}

	Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
	gl.compileShader(Obj3D.fshader);
	if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
		console.log("Fragment Shader FAILED... " + Obj3D.shaderName + ".fs");
		console.log(gl.getShaderInfoLog(Obj3D.fshader));
	}

	Obj3D.shader = gl.createProgram();
	gl.attachShader(Obj3D.shader, Obj3D.vshader);
	gl.attachShader(Obj3D.shader, Obj3D.fshader);
	gl.linkProgram(Obj3D.shader);
	if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		console.log(gl.getShaderInfoLog(Obj3D.shader));
	}
}


// =====================================================
function webGLStart() {

	var canvas = document.getElementById("WebGL-test");

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	initGL(canvas);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(rotMatrix);
	mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
	mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

	distCENTER = vec3.create([0, -0.2, -3]);

	PLANE = new plane();
	SKYBOX = new skybox(50);
	BUNNY = new objmesh('bunny.obj');
	MUSTANG = new objmesh('mustang.obj');
	PORSCHE = new objmesh('porsche.obj');
	SPHERE = new objmesh('sphere.obj');
	SELECTED = BUNNY;

	tick();
}

function selectObject() {
	var select = document.getElementById("selectedObject");
	var value = select.options[select.selectedIndex].value;
	switch (value) {
		case "Bunny": SELECTED = BUNNY; break;
		case "Mustang": SELECTED = MUSTANG; break;
		case "Porsche": SELECTED = PORSCHE; break;
		case "Sphere": SELECTED = SPHERE; break;
	}
}


function setFresnel() {
	var fresnel = document.getElementById("fresnel");
	FRESNELVALUE = parseFloat(fresnel.value);
	document.getElementById("fresnelValue").innerHTML = "Fresnel: " + FRESNELVALUE;
}	
// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	SKYBOX.draw();
	SELECTED.draw();
}



