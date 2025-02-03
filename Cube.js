class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.normalMatrix = new Matrix4();
    }

    render() {
        gl.uniform4f(u_FragColor, ...this.color);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        
        // front 
        drawTriangle3D([0,0,0, 1,1,0, 1,0,0]);
        drawTriangle3D([0,0,0, 0,1,0, 1,1,0]);
        
        // back 
        drawTriangle3D([0,0,1, 1,0,1, 1,1,1]);
        drawTriangle3D([0,0,1, 1,1,1, 0,1,1]);
        
        // top 
        drawTriangle3D([0,1,0, 1,1,0, 1,1,1]);
        drawTriangle3D([0,1,0, 1,1,1, 0,1,1]);
        
        // bottom 
        drawTriangle3D([0,0,0, 1,0,0, 1,0,1]);
        drawTriangle3D([0,0,0, 1,0,1, 0,0,1]);
        
        // left 
        drawTriangle3D([0,0,0, 0,1,1, 0,0,1]);
        drawTriangle3D([0,0,0, 0,1,0, 0,1,1]);
        
        // right 
        drawTriangle3D([1,0,0, 1,1,0, 1,1,1]);
        drawTriangle3D([1,0,0, 1,1,1, 1,0,1]);
    }
}