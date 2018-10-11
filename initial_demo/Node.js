




class Node
{

    constructor(id)
    {   

    this.Id = id || null;
    this.mat = null;
    this.tex = null;

    this.geom = null;
    this.children = [];


    }
    
    push(node)
    {
        this.children.push(node);
    }

    setTexture(texture)
    {
        this.tex = texture;
    }

    setMaterial(material)
    {
        this.mat = material;
    }

    getMaterial()
    {
        return this.mat;
    }

    getchildren_length()
    {
        return this.children.length;
    }
    
}