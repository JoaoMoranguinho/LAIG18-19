/**
 * MyTriangle
 * @param gl {WebGLRenderingContext}
 * @constructor
 */

class MyTriangle extends CGFobject
{
	constructor(scene,x1,y1,z1,x2,y2,z2,x3,y3,z3) 
	{
		
		super(scene);
		this.x1 = x1;
		this.y1 = y1;
		this.z1 = z1;
		this.x2 = x2;
		this.y2 = y2;
		this.z2 = z2;
		this.x3 = x3;
		this.y3 = y3;
		this.z3 = z3;
		


		this.initBuffers();
	};

	initBuffers() 
	{
		this.vertices = [
				this.x1, this.y1, this.z1,
				this.x2, this.y2, this.z2,
				this.x3, this.y3, this.z3
				];

		var U =[this.x2-this.x1,this.y2-this.y1,this.z2-this.z1];
		var V=[this.x3-this.x1,this.y3-this.y1,this.z3-this.z1];
		var Nx= U[1]*V[2]- U[2]*V[1];
		var Ny= U[2]*V[0]- U[0]*V[2];
		var Nz= U[0]*V[1]- U[1]*V[0];

		this.normals = [
				Nx, Ny, Nz,
				Nx, Ny, Nz,
				Nx, Ny, Nz
				
		];

		this.indices = [
				0, 2, 1
			];

		/*this.texCoords = [
				this.minS, this.maxT,
      			this.maxS, this.maxT,
      			this.minS, this.minT,
      			this.maxS, this.minT
		];*/
			
		this.primitiveType=this.scene.gl.TRIANGLES;
		this.initGLBuffers();
	};
};
