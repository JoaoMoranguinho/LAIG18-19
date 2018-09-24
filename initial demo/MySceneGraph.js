var DEGREE_TO_RAD = Math.PI / 180;

// Order of the groups in the XML document.
var INITIALS_INDEX = 0;
var ILLUMINATION_INDEX = 1;
var LIGHTS_INDEX = 2;
var TEXTURES_INDEX = 3;
var MATERIALS_INDEX = 4;
var NODES_INDEX = 5;

/**
 * MySceneGraph class, representing the scene graph.
 */
class MySceneGraph {
    /**
     * @constructor
     */
    constructor(filename, scene) {
        this.loadedOk = null;

        // Establish bidirectional references between scene and graph.
        this.scene = scene;
        scene.graph = this;

        this.nodes = [];

        this.idRoot = null;                    // The id of the root element.

        this.axisCoords = [];
        this.axisCoords['x'] = [1, 0, 0];
        this.axisCoords['y'] = [0, 1, 0];
        this.axisCoords['z'] = [0, 0, 1];

        // File reading 
        this.reader = new CGFXMLreader();

        /*
         * Read the contents of the xml file, and refer to this class for loading and error handlers.
         * After the file is read, the reader calls onXMLReady on this object.
         * If any error occurs, the reader calls onXMLError on this object, with an error message
         */

        this.reader.open('scenes/' + filename, this);
    }


    /*
     * Callback to be executed after successful reading
     */
    onXMLReady() {
        this.log("XML Loading finished.");
        var rootElement = this.reader.xmlDoc.documentElement;

        // Here should go the calls for different functions to parse the various blocks
        var error = this.parseXMLFile(rootElement);

        if (error != null) {
            this.onXMLError(error);
            return;
        }

        this.loadedOk = true;

        // As the graph loaded ok, signal the scene so that any additional initialization depending on the graph can take place
        this.scene.onGraphLoaded();
    }

    /**
     * Parses the XML file, processing each block.
     * @param {XML root element} rootElement
     */
    parseXMLFile(rootElement) {
        if (rootElement.nodeName != "SCENE")
            return "root tag <SCENE> missing";

        var nodes = rootElement.children;

        // Reads the names of the nodes to an auxiliary buffer.
        var nodeNames = [];

        for (var i = 0; i < nodes.length; i++) {
            nodeNames.push(nodes[i].nodeName);
        }

        var error;

        // Processes each node, verifying errors.

        // <INITIALS>
        var index;
        if ((index = nodeNames.indexOf("INITIALS")) == -1)
            return "tag <INITIALS> missing";
        else {
            if (index != INITIALS_INDEX)
                this.onXMLMinorError("tag <INITIALS> out of order");

            //Parse INITIAL block
            if ((error = this.parseInitials(nodes[index])) != null)
                return error;
        }

        // <ILLUMINATION>
        if ((index = nodeNames.indexOf("ILLUMINATION")) == -1)
            return "tag <ILLUMINATION> missing";
        else {
            if (index != ILLUMINATION_INDEX)
                this.onXMLMinorError("tag <ILLUMINATION> out of order");

            //Parse ILLUMINATION block
            if ((error = this.parseIllumination(nodes[index])) != null)
                return error;
        }

        // <LIGHTS>
        if ((index = nodeNames.indexOf("LIGHTS")) == -1)
            return "tag <LIGHTS> missing";
        else {
            if (index != LIGHTS_INDEX)
                this.onXMLMinorError("tag <LIGHTS> out of order");

            //Parse LIGHTS block
            if ((error = this.parseLights(nodes[index])) != null)
                return error;
        }

        // <TEXTURES>
        if ((index = nodeNames.indexOf("TEXTURES")) == -1)
            return "tag <TEXTURES> missing";
        else {
            if (index != TEXTURES_INDEX)
                this.onXMLMinorError("tag <TEXTURES> out of order");

            //Parse TEXTURES block
            if ((error = this.parseTextures(nodes[index])) != null)
                return error;
        }

        // <MATERIALS>
        if ((index = nodeNames.indexOf("MATERIALS")) == -1)
            return "tag <MATERIALS> missing";
        else {
            if (index != MATERIALS_INDEX)
                this.onXMLMinorError("tag <MATERIALS> out of order");

            //Parse MATERIALS block
            if ((error = this.parseMaterials(nodes[index])) != null)
                return error;
        }

        // <NODES>
        if ((index = nodeNames.indexOf("NODES")) == -1)
            return "tag <NODES> missing";
        else {
            if (index != NODES_INDEX)
                this.onXMLMinorError("tag <NODES> out of order");

            //Parse NODES block
            if ((error = this.parseNodes(nodes[index])) != null)
                return error;
        }
    }

    /**
     * Parses the <INITIALS> block.
     */
    parseInitials(initialsNode) {

        var children = initialsNode.children;

        var nodeNames = [];

        for (var i = 0; i < children.length; i++)
            nodeNames.push(children[i].nodeName);

        // Frustum planes
        // (default values)
        this.near = 0.1;
        this.far = 500;
        var indexFrustum = nodeNames.indexOf("frustum");
        if (indexFrustum == -1) {
            this.onXMLMinorError("frustum planes missing; assuming 'near = 0.1' and 'far = 500'");
        }
        else {
            this.near = this.reader.getFloat(children[indexFrustum], 'near');
            this.far = this.reader.getFloat(children[indexFrustum], 'far');

            if (!(this.near != null && !isNaN(this.near))) {
                this.near = 0.1;
                this.onXMLMinorError("unable to parse value for near plane; assuming 'near = 0.1'");
            }
            else if (!(this.far != null && !isNaN(this.far))) {
                this.far = 500;
                this.onXMLMinorError("unable to parse value for far plane; assuming 'far = 500'");
            }

            if (this.near >= this.far)
                return "'near' must be smaller than 'far'";
        }

        // Checks if at most one translation, three rotations, and one scaling are defined.
        if (initialsNode.getElementsByTagName('translation').length > 1)
            return "no more than one initial translation may be defined";

        if (initialsNode.getElementsByTagName('rotation').length > 3)
            return "no more than three initial rotations may be defined";

        if (initialsNode.getElementsByTagName('scale').length > 1)
            return "no more than one scaling may be defined";

        // Initial transforms.
        this.initialTranslate = [];
        this.initialScaling = [];
        this.initialRotations = [];

        // Gets indices of each element.
        var translationIndex = nodeNames.indexOf("translation");
        var thirdRotationIndex = nodeNames.indexOf("rotation");
        var secondRotationIndex = nodeNames.indexOf("rotation", thirdRotationIndex + 1);
        var firstRotationIndex = nodeNames.lastIndexOf("rotation");
        var scalingIndex = nodeNames.indexOf("scale");
        var referenceIndex = nodeNames.indexOf("reference");

        // Checks if the indices are valid and in the expected order.
        // Translation.
        this.initialTransforms = mat4.create();
        mat4.identity(this.initialTransforms);

        if (translationIndex == -1)
            this.onXMLMinorError("initial translation undefined; assuming T = (0, 0, 0)");
        else {
            var tx = this.reader.getFloat(children[translationIndex], 'x');
            var ty = this.reader.getFloat(children[translationIndex], 'y');
            var tz = this.reader.getFloat(children[translationIndex], 'z');

            if (tx == null || ty == null || tz == null) {
                tx = 0;
                ty = 0;
                tz = 0;
                this.onXMLMinorError("failed to parse coordinates of initial translation; assuming zero");
            }

            //TODO: Save translation data
            mat4.translate(this.initialTransforms, this.initialTransforms, [tx, ty, tz]);
            console.log(this.initialTransforms);
        }

        //TODO: Parse Rotations
        //Rotation
        if (firstRotationIndex == -1)
            this.onXMLMinorError("initial Z rotation undefined; assuming R = (x, 0)");
        else {
            var axis = this.reader.getString(children[firstRotationIndex], 'axis');
            var angle = this.reader.getFloat(children[firstRotationIndex], 'angle');

            if (axis == null || angle == null) {
                axis = 'x';
                angle = 0;
                this.onXMLMinorError("failed to parse coordinates of initial rotation; assuming zero");
            }

            //TODO: Save rotation data
            mat4.rotate(this.initialTransforms, this.initialTransforms, angle, [1, 0, 0]);
            console.log(this.initialTransforms);
            console.log("First Rotation " + axis + " " + angle);
        }

        if (secondRotationIndex == -1)
            this.onXMLMinorError("initial Z rotation undefined; assuming R = (y, 0)");
        else {
            var axis = this.reader.getString(children[secondRotationIndex], 'axis');
            var angle = this.reader.getFloat(children[secondRotationIndex], 'angle');

            if (axis == null || angle == null) {
                axis = 'y';
                angle = 0;
                this.onXMLMinorError("failed to parse coordinates of initial rotation; assuming zero");
            }

            //TODO: Save rotation data
            mat4.rotate(this.initialTransforms, this.initialTransforms, angle, [0, 1, 0]);
            console.log(this.initialTransforms);
            console.log("Second Rotation " + axis + " " + angle);
        }

        if (thirdRotationIndex == -1)
            this.onXMLMinorError("initial Z rotation undefined; assuming R = (z, 0)");
        else {
            var axis = this.reader.getString(children[thirdRotationIndex], 'axis');
            var angle = this.reader.getFloat(children[thirdRotationIndex], 'angle');

            if (axis == null || angle == null) {
                axis = 'z';
                angle = 0;
                this.onXMLMinorError("failed to parse coordinates of initial rotation; assuming zero");
            }

            //TODO: Save rotation data
            mat4.rotate(this.initialTransforms, this.initialTransforms, angle, [0, 0, 1]);
            console.log(this.initialTransforms);
            console.log("Third Rotation " + axis + " " + angle);
        }

        //TODO: Parse Scaling
        //Scalling
        if (scalingIndex == -1)
            this.onXMLMinorError("initial translation undefined; assuming S = (0, 0, 0)");
        else {
            var sx = this.reader.getFloat(children[scalingIndex], 'sx');
            var sy = this.reader.getFloat(children[scalingIndex], 'sy');
            var sz = this.reader.getFloat(children[scalingIndex], 'sz');

            if (sx == null || sy == null || sz == null) {
                sx = 0;
                sy = 0;
                sz = 0;
                this.onXMLMinorError("failed to parse coordinates of initial scalling; assuming zero");
            }

            //TODO: Save translation data
            mat4.scale(this.initialTransforms, this.initialTransforms, [sx, sy, sz]);
            console.log(this.initialTransforms);
            console.log("Scalling " + sx + " " + sy + " " + sz);
        }

        //TODO: Parse Reference length
        //Reference
        if (referenceIndex == -1)
            this.onXMLMinorError("initial reference undefined;");
        else {
            var length = this.reader.getFloat(children[referenceIndex], 'length');

            if (length == null) {
                length = 0;
                this.onXMLMinorError("failed to parse length of initial reference; assuming zero");
            }

            console.log("Reference " + length);
        }

        this.log("Parsed initials");

        return null;
    }

    /**
     * Parses the <ILLUMINATION> block.
     * @param {illumination block element} illuminationNode
     */
    parseIllumination(illuminationNode) {
        // TODO: Parse Illumination node
        var children = illuminationNode.children;

        var nodeNames = [];

        for (var i = 0; i < children.length; i++)
            nodeNames.push(children[i].nodeName);

        // Checks if at most one ambient and one background are defined.
        if (illuminationNode.getElementsByTagName('ambient').length > 1)
            return "no more than one initial ambient may be defined";

        if (illuminationNode.getElementsByTagName('background').length > 1)
            return "no more than three initial background may be defined";

        // Gets indices of each element.
        var ambientIndex = nodeNames.indexOf("ambient");
        var backgroundIndex = nodeNames.indexOf("background");

        //Ambient
        if (ambientIndex == -1)
            this.onXMLMinorError("initial ambient ilumination undefined;");
        else {
            var r = this.reader.getFloat(children[ambientIndex], 'r');
            var g = this.reader.getFloat(children[ambientIndex], 'g');
            var b = this.reader.getFloat(children[ambientIndex], 'b');
            var a = this.reader.getFloat(children[ambientIndex], 'a');

            if (r == null || g == null || b == null || a == null) {
                r = 0;
                g = 0;
                b = 0;
                a = 0;
                this.onXMLMinorError("failed to parse coordinates of initial ambient ilumination; assuming zero");
            }

            console.log("Ambient " + r + " " + g + " " + b + " " + a);
        }

        //Background
        if (backgroundIndex == -1)
            this.onXMLMinorError("initial background ilumination undefined;");
        else {
            var r = this.reader.getFloat(children[backgroundIndex], 'r');
            var g = this.reader.getFloat(children[backgroundIndex], 'g');
            var b = this.reader.getFloat(children[backgroundIndex], 'b');
            var a = this.reader.getFloat(children[backgroundIndex], 'a');

            if (r == null || g == null || b == null || a == null) {
                r = 0;
                g = 0;
                b = 0;
                a = 0;
                this.onXMLMinorError("failed to parse coordinates of initial background ilumination; assuming zero");
            }

            console.log("Background " + r + " " + g + " " + b + " " + a);
        }

        this.log("Parsed illumination");

        return null;
    }


    /**
     * Parses the <LIGHTS> node.
     * @param {lights block element} lightsNode
     */
    parseLights(lightsNode) {

        var children = lightsNode.children;

        this.lights = [];
        var numLights = 0;

        var grandChildren = [];
        var nodeNames = [];

        // Any number of lights.
        for (var i = 0; i < children.length; i++) {

            if (children[i].nodeName != "LIGHT") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            }

            // Get id of the current light.
            var lightId = this.reader.getString(children[i], 'id');
            if (lightId == null)
                return "no ID defined for light";

            // Checks for repeated IDs.
            if (this.lights[lightId] != null)
                return "ID must be unique for each light (conflict: ID = " + lightId + ")";

            grandChildren = children[i].children;
            // Specifications for the current light.

            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            // Gets indices of each element.
            var enableIndex = nodeNames.indexOf("enable");
            var positionIndex = nodeNames.indexOf("position");
            var ambientIndex = nodeNames.indexOf("ambient");
            var diffuseIndex = nodeNames.indexOf("diffuse");
            var specularIndex = nodeNames.indexOf("specular");

            // Light enable/disable
            var enableLight = true;
            if (enableIndex == -1) {
                this.onXMLMinorError("enable value missing for ID = " + lightId + "; assuming 'value = 1'");
            }
            else {
                var aux = this.reader.getFloat(grandChildren[enableIndex], 'value');
                if (!(aux != null && !isNaN(aux) && (aux == 0 || aux == 1)))
                    this.onXMLMinorError("unable to parse value component of the 'enable light' field for ID = " + lightId + "; assuming 'value = 1'");
                else
                    enableLight = aux == 0 ? false : true;
            }

            // Retrieves the light position.
            var positionLight = [];
            if (positionIndex != -1) {
                // x
                var x = this.reader.getFloat(grandChildren[positionIndex], 'x');
                if (!(x != null && !isNaN(x)))
                    return "unable to parse x-coordinate of the light position for ID = " + lightId;
                else
                    positionLight.push(x);

                // y
                var y = this.reader.getFloat(grandChildren[positionIndex], 'y');
                if (!(y != null && !isNaN(y)))
                    return "unable to parse y-coordinate of the light position for ID = " + lightId;
                else
                    positionLight.push(y);

                // z
                var z = this.reader.getFloat(grandChildren[positionIndex], 'z');
                if (!(z != null && !isNaN(z)))
                    return "unable to parse z-coordinate of the light position for ID = " + lightId;
                else
                    positionLight.push(z);

                // w
                var w = this.reader.getFloat(grandChildren[positionIndex], 'w');
                if (!(w != null && !isNaN(w) && w >= 0 && w <= 1))
                    return "unable to parse x-coordinate of the light position for ID = " + lightId;
                else
                    positionLight.push(w);
            }
            else
                return "light position undefined for ID = " + lightId;

            // Retrieves the ambient component.
            var ambientIllumination = [];
            if (ambientIndex != -1) {
                // R
                var r = this.reader.getFloat(grandChildren[ambientIndex], 'r');
                if (!(r != null && !isNaN(r) && r >= 0 && r <= 1))
                    return "unable to parse R component of the ambient illumination for ID = " + lightId;
                else
                    ambientIllumination.push(r);

                // G
                var g = this.reader.getFloat(grandChildren[ambientIndex], 'g');
                if (!(g != null && !isNaN(g) && g >= 0 && g <= 1))
                    return "unable to parse G component of the ambient illumination for ID = " + lightId;
                else
                    ambientIllumination.push(g);

                // B
                var b = this.reader.getFloat(grandChildren[ambientIndex], 'b');
                if (!(b != null && !isNaN(b) && b >= 0 && b <= 1))
                    return "unable to parse B component of the ambient illumination for ID = " + lightId;
                else
                    ambientIllumination.push(b);

                // A
                var a = this.reader.getFloat(grandChildren[ambientIndex], 'a');
                if (!(a != null && !isNaN(a) && a >= 0 && a <= 1))
                    return "unable to parse A component of the ambient illumination for ID = " + lightId;
                else
                    ambientIllumination.push(a);
            }
            else
                return "ambient component undefined for ID = " + lightId;

            // TODO: Retrieve the diffuse component
            // Retrieves the diffuse component.
            var diffuseIllumination = [];
            if (diffuseIndex != -1) {
                // R
                var r = this.reader.getFloat(grandChildren[diffuseIndex], 'r');
                if (!(r != null && !isNaN(r) && r >= 0 && r <= 1))
                    return "unable to parse R component of the ambient illumination for ID = " + lightId;
                else
                    diffuseIllumination.push(r);

                // G
                var g = this.reader.getFloat(grandChildren[diffuseIndex], 'g');
                if (!(g != null && !isNaN(g) && g >= 0 && g <= 1))
                    return "unable to parse G component of the ambient illumination for ID = " + lightId;
                else
                    diffuseIllumination.push(g);

                // B
                var b = this.reader.getFloat(grandChildren[diffuseIndex], 'b');
                if (!(b != null && !isNaN(b) && b >= 0 && b <= 1))
                    return "unable to parse B component of the ambient illumination for ID = " + lightId;
                else
                    diffuseIllumination.push(b);

                // A
                var a = this.reader.getFloat(grandChildren[diffuseIndex], 'a');
                if (!(a != null && !isNaN(a) && a >= 0 && a <= 1))
                    return "unable to parse A component of the ambient illumination for ID = " + lightId;
                else
                    diffuseIllumination.push(a);
            }
            else
                return "ambient component undefined for ID = " + lightId;

            // TODO: Retrieve the specular component
            // Retrieves the specular component.
            var specularIllumination = [];
            if (specularIndex != -1) {
                // R
                var r = this.reader.getFloat(grandChildren[specularIndex], 'r');
                if (!(r != null && !isNaN(r) && r >= 0 && r <= 1))
                    return "unable to parse R component of the ambient illumination for ID = " + lightId;
                else
                    specularIllumination.push(r);

                // G
                var g = this.reader.getFloat(grandChildren[specularIndex], 'g');
                if (!(g != null && !isNaN(g) && g >= 0 && g <= 1))
                    return "unable to parse G component of the ambient illumination for ID = " + lightId;
                else
                    specularIllumination.push(g);

                // B
                var b = this.reader.getFloat(grandChildren[specularIndex], 'b');
                if (!(b != null && !isNaN(b) && b >= 0 && b <= 1))
                    return "unable to parse B component of the ambient illumination for ID = " + lightId;
                else
                    specularIllumination.push(b);

                // A
                var a = this.reader.getFloat(grandChildren[specularIndex], 'a');
                if (!(a != null && !isNaN(a) && a >= 0 && a <= 1))
                    return "unable to parse A component of the ambient illumination for ID = " + lightId;
                else
                    specularIllumination.push(a);
            }
            else
                return "ambient component undefined for ID = " + lightId;

            // TODO: Store Light global information.
            //this.lights[lightId] = ...;
            numLights++;
            console.log("Light " + lightId);
            console.log("Position Light " + positionLight);
            console.log("Ambient Ilumination " + ambientIllumination);
            console.log("Diffuse Ilumination " + diffuseIllumination);
            console.log("Specular Ilumination " + specularIllumination);
        }

        if (numLights == 0)
            return "at least one light must be defined";
        else if (numLights > 8)
            this.onXMLMinorError("too many lights defined; WebGL imposes a limit of 8 lights");

        this.log("Parsed lights");

        return null;
    }

    /**
     * Parses the <TEXTURES> block. 
     * @param {textures block element} texturesNode
     */
    parseTextures(texturesNode) {
        // TODO: Parse block
        var children = texturesNode.children;

        this.textures = [];
        var numTextures = 0;

        var grandChildren = [];
        var nodeNames = [];

        // Any number of textures.
        for (var i = 0; i < children.length; i++) {

            if (children[i].nodeName != "TEXTURE") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            }

            // Get id of the current texture.
            var textureId = this.reader.getString(children[i], 'id');
            if (textureId == null)
                return "no ID defined for texture";

            // Checks for repeated IDs.
            if (this.textures[textureId] != null)
                return "ID must be unique for each texture (conflict: ID = " + textureId + ")";

            grandChildren = children[i].children;
            // Specifications for the current texture.

            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            /*
            // Checks if at most one file and one amplif_factor are defined.
            if (illuminationNode.getElementsByTagName('file').length > 1)
                return "no more than one texture file may be defined";

            if (illuminationNode.getElementsByTagName('amplif_factor').length > 1)
                return "no more than one texture amplif_factor may be defined";

            */

            // Gets indices of each element.
            var fileIndex = nodeNames.indexOf("file");
            var amplif_factorIndex = nodeNames.indexOf("amplif_factor");

            //File
            if (fileIndex == -1)
                this.onXMLMinorError("texture file undefined;");
            else {
                var path = this.reader.getString(grandChildren[fileIndex], 'path');

                if (path == null) {
                    path = "error";
                    this.onXMLMinorError("failed to parse texture file; assuming error");
                }
            }

            //Amplif_factor
            if (amplif_factorIndex == -1)
                this.onXMLMinorError("texture amplif_factor undefined;");
            else {
                var amplif_factorS = this.reader.getFloat(grandChildren[amplif_factorIndex], 's');
                var amplif_factorT = this.reader.getFloat(grandChildren[amplif_factorIndex], 't');

                if (amplif_factorS == null || amplif_factorT == null) {
                    amplif_factorS = 0;
                    amplif_factorT = 0;

                    this.onXMLMinorError("failed to parse texture amplif_factor; assuming zero");
                }
            }

            // TODO: Store Texture global information.
            //this.textures[textureId] = ...;
            numTextures++;
            console.log("Texture " + textureId);
            console.log("File Path " + path);
            console.log("Amplif Factor " + amplif_factorS + " " + amplif_factorT);
        }

        if (numTextures == 0)
            return "at least one texture must be defined";
        else if (numTextures > 8)

            this.onXMLMinorError("too many textures defined; WebGL imposes a limit of 8 textures");


        console.log("Parsed textures");

        return null;

    }

    /**
     * Parses the <MATERIALS> node.
     * @param {materials block element} materialsNode
     */
    parseMaterials(materialsNode) {
        // TODO: Parse block
        this.log("Parsed materials");
        return null;

    }

    /**
     * Parses the <NODES> block.
     * @param {nodes block element} nodesNode
     */
    parseNodes(nodesNode) {
        // TODO: Parse block
        this.log("Parsed nodes");
        return null;
    }

    /*
     * Callback to be executed on any read error, showing an error on the console.
     * @param {string} message
     */
    onXMLError(message) {
        console.error("XML Loading Error: " + message);
        this.loadedOk = false;
    }

    /**
     * Callback to be executed on any minor error, showing a warning on the console.
     * @param {string} message
     */
    onXMLMinorErro(message) {
        console.warn("Warning: " + message);
    }


    /**
     * Callback to be executed on any message.
     * @param {string} message
     */
    log(message) {
        console.log("   " + message);
    }

    /**
     * Displays the scene, processing each node, starting in the root node.
     */
    displayScene() {
        // entry point for graph rendering
        //TODO: Render loop starting at root of graph
    }
}