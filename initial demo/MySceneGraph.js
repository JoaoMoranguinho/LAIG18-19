var DEGREE_TO_RAD = Math.PI / 180;

// Order of the groups in the XML document.
var SCENE_INDEX = 0;
var VIEWS_INDEX = 1;
var AMBIENT_INDEX = 2;
var LIGHTS_INDEX = 3;
var TEXTURES_INDEX = 4;
var MATERIALS_INDEX = 5;
var TRANSFORMATIONS_INDEX = 6;
var PRIMITIVES_INDEX = 7;
var COMPONENTS_INDEX = 8;


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
        if (rootElement.nodeName != "yas")
            return "root tag <yas> missing";

        var nodes = rootElement.children;

        // Reads the names of the nodes to an auxiliary buffer.
        var nodeNames = [];

        for (var i = 0; i < nodes.length; i++) {
            nodeNames.push(nodes[i].nodeName);
            console.log(nodes[i].nodeName);
        }

        var error;

        // Processes each node, verifying errors.

        // <scene>
        var index;
        if ((index = nodeNames.indexOf("scene")) == -1)
            return "tag <scene> missing";
        else {
            if (index != SCENE_INDEX)
                this.onXMLMinorError("tag <scene> out of order");

            //Parse SCENE block
            if ((error = this.parseScene(nodes[index])) != null)
                return error;
        }

        // <views>
        if ((index = nodeNames.indexOf("views")) == -1)
            return "tag <views> missing";
        else {
            if (index != VIEWS_INDEX)
                this.onXMLMinorError("tag <VIEWS> out of order");

            //Parse VIEWS block
            if ((error = this.parseViews(nodes[index])) != null)
                return error;
        }

        // <ambient>
        if ((index = nodeNames.indexOf("ambient")) == -1)
            return "tag <ambient> missing";
        else {
            if (index != AMBIENT_INDEX)
                this.onXMLMinorError("tag <AMBIENT> out of order");

            //Parse AMBIENT block
            if ((error = this.parseAmbient(nodes[index])) != null)
                return error;
        }

        // <lights>
        if ((index = nodeNames.indexOf("lights")) == -1)
            return "tag <LIGHTS> missing";
        else {
            if (index != LIGHTS_INDEX)
                this.onXMLMinorError("tag <LIGHTS> out of order");

            //Parse LIGHTS block
            if ((error = this.parseLights(nodes[index])) != null)
                return error;
        }

        // <textures>
        if ((index = nodeNames.indexOf("textures")) == -1)
            return "tag <textures> missing";
        else {
            if (index != TEXTURES_INDEX)
                this.onXMLMinorError("tag <textures> out of order");

            //Parse TEXTURES block
            if ((error = this.parseTextures(nodes[index])) != null)
                return error;
        }

        // <materials>
        if ((index = nodeNames.indexOf("materials")) == -1)
            return "tag <materials> missing";
        else {
            if (index != MATERIALS_INDEX)
                this.onXMLMinorError("tag <materials> out of order");

            //Parse MATERIALS block
            if ((error = this.parseMaterials(nodes[index])) != null)
                return error;
        }

        // <transformations>
        if ((index = nodeNames.indexOf("transformations")) == -1)
            return "tag <transformations> missing";
        else {
            if (index != TRANSFORMATIONS_INDEX)
                this.onXMLMinorError("tag <transformations> out of order");

            //Parse TRANSFORMATIONS block
            if ((error = this.parseTransformations(nodes[index])) != null)
                return error;
        }

        // <primitives>
        if ((index = nodeNames.indexOf("primitives")) == -1)
            return "tag <primitives> missing";
        else {
            if (index != PRIMITIVES_INDEX)
                this.onXMLMinorError("tag <primitives> out of order");

            //Parse PRIMITIVES block
            if ((error = this.parsePrimitives(nodes[index])) != null)
                return error;
        }

        // <components>
        if ((index = nodeNames.indexOf("components")) == -1)
            return "tag <components> missing";
        else {
            if (index != COMPONENTS_INDEX)
                this.onXMLMinorError("tag <components> out of order");

            //Parse COMPONENTS block
            if ((error = this.parseComponents(nodes[index])) != null)
                return error;
        }

        // <NODES>
        //if ((index = nodeNames.indexOf("NODES")) == -1)
        //return "tag <NODES> missing";
        //else {
        //if (index != NODES_INDEX)
        //this.onXMLMinorError("tag <NODES> out of order");

        //Parse NODES block
        //if ((error = this.parseNodes(nodes[index])) != null)
        //return error;
        //}
    }

    /**
     * Parses the <scene> block.
     * @param {scene block element} sceneNode
     */
    parseScene(sceneNode) {

        this.root = this.reader.getString(sceneNode, "root");
        console.log(this.root);
        this.axis_length = this.reader.getFloat(sceneNode, 'axis_length');
        console.log(this.axis_length);

    }

    /**
     * Parses the <views> block.
     * @param {views block element} viewsNode
     */
    parseViews(viewsNode) {

        var children = viewsNode.children;
        var grandChildren = [];
        var nodeNames = [];

        for (var i = 0; i < children.length; i++) {

            var perspective_id = this.reader.getString(children[i], 'id');
            if (i == 0) {
                this.near = this.reader.getFloat(children[i], 'near');

                this.far = this.reader.getFloat(children[i], 'far');

                var angle = this.reader.getFloat(children[i], 'angle');
            }
            else {
                this.near = this.reader.getFloat(children[i], 'near');
                //console.log(this.near);
                this.far = this.reader.getFloat(children[i], 'far');
                //console.log(this.far);
                var left = this.reader.getFloat(children[i], 'left');
                // console.log(left);
                var right = this.reader.getFloat(children[i], 'right');
                // console.log(right);
                var top = this.reader.getFloat(children[i], 'top');
                //console.log(top);
                var bottom = this.reader.getFloat(children[i], 'bottom');
                // console.log(bottom);
            }

            grandChildren = children[i].children;
            if (grandChildren.length != 0) {
                nodeNames = [];
                for (var j = 0; j < grandChildren.length; j++) {
                    nodeNames.push(grandChildren[j].nodeName);
                }
                var fromIndex = nodeNames.indexOf("from");
                var toIndex = nodeNames.indexOf("to");

                var x_from = this.reader.getFloat(grandChildren[fromIndex], 'x');
                var y_from = this.reader.getFloat(grandChildren[fromIndex], 'y');
                var z_from = this.reader.getFloat(grandChildren[fromIndex], 'z');

                var x_to = this.reader.getFloat(grandChildren[toIndex], 'x');
                var y_to = this.reader.getFloat(grandChildren[toIndex], 'y');
                var z_to = this.reader.getFloat(grandChildren[toIndex], 'z');
            }
        }
    }

    /**
     * Parses the <ambient> block.
     * @param {ambient block element} ambientNode
     */
    parseAmbient(ambientNode) {
        var children = ambientNode.children;

        var nodeNames = [];

        for (var i = 0; i < children.length; i++) {
            nodeNames.push(children[i].nodeName);
        }

        var ambientIndex = nodeNames.indexOf("ambient");
        var backgroundIndex = nodeNames.indexOf("background");

        var red_amb = this.reader.getFloat(children[ambientIndex], 'r');
        var green_amb = this.reader.getFloat(children[ambientIndex], 'g');
        var blue_amb = this.reader.getFloat(children[ambientIndex], 'b');
        var a_amb = this.reader.getFloat(children[ambientIndex], 'a');

        var red_back = this.reader.getFloat(children[backgroundIndex], 'r');
        var green_back = this.reader.getFloat(children[backgroundIndex], 'g');
        var blue_back = this.reader.getFloat(children[backgroundIndex], 'b');
        var a_back = this.reader.getFloat(children[backgroundIndex], 'a');

        //console.log(red_amb + " " + green_amb + " " + blue_amb + " " + a_amb);
        // console.log(red_back + " " + green_back + " " + blue_back + " " + a_back);
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
        }

        //TODO: Parse Rotations

        //TODO: Parse Scaling

        //TODO: Parse Reference length

        this.log("Parsed initials");

        return null;
    }

    /**
     * Parses the <ILLUMINATION> block.
     * @param {illumination block element} illuminationNode
     */
    parseIllumination(illuminationNode) {
        // TODO: Parse Illumination node

        this.log("Parsed illumination");

        return null;
    }

    /**
     * Parses the <LIGHTS> node.
     * @param {lights block element} lightsNode
     */
    parseLights(lightsNode) {

        var children = lightsNode.children;

        this.omnis = [];
        this.spots = [];
        var numLights = 0;

        var grandChildren = [];
        var nodeNames = [];

        for (var k = 0; k < children.length; k++) {
            nodeNames.push(children[k].nodeName);
        }

        // Any number of lights.
        for (var i = 0; i < children.length; i++) {

            // Get id of the current light.
            var lightId = this.reader.getString(children[i], 'id');
            if (lightId == null) {
                return "no ID defined for light";
            }
            // Light enable/disable
            var enableLight = true;
            var enableIndex = this.reader.getFloat(children[i], 'enabled');
            if (enableIndex == -1) {
                this.onXMLMinorError("enable value missing for ID = " + lightId + "; assuming 'value = 1'");
            }

            if (lightId == "spot") {
                var omni_angle = this.reader.getFloat(children[i], "angle");
                var omni_exponent = this.reader.getFloat(children[i], 'exponent');
                console.log(omni_angle + " " + omni_exponent);
            }

            // Checks for repeated IDs.
            /* if (this.lights[lightId] != null)
                 return "ID must be unique for each light (conflict: ID = " + lightId + ")";*/

            if (children[i].nodeName != "omni" && children[i].nodeName != "spot") {
                this.onXMLMinorError("unknown tag <" + children[i].nodeName + ">");
                continue;
            }

            grandChildren = children[i].children;
            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            var locationIndex = nodeNames.indexOf("location");
            var ambientIndex = nodeNames.indexOf("ambient");
            var diffuseIndex = nodeNames.indexOf("diffuse");
            var specularIndex = nodeNames.indexOf("specular");

            if (children[i].nodeName == "spot") {
                var targetIndex = nodeNames.indexOf("target");

                var x_target = this.reader.getFloat(grandChildren[targetIndex], 'x');
                var y_target = this.reader.getFloat(grandChildren[targetIndex], 'y');
                var z_target = this.reader.getFloat(grandChildren[targetIndex], 'z');
                console.log(x_target + " " + y_target + " " + z_target);

                var x_location = this.reader.getFloat(grandChildren[locationIndex], 'x');
                var y_location = this.reader.getFloat(grandChildren[locationIndex], 'y');
                var z_location = this.reader.getFloat(grandChildren[locationIndex], 'z');
                console.log(x_location + " " + y_location + " " + z_location);
            }
            else {
                var x_location = this.reader.getFloat(grandChildren[locationIndex], 'x');
                var y_location = this.reader.getFloat(grandChildren[locationIndex], 'y');
                var z_location = this.reader.getFloat(grandChildren[locationIndex], 'z');
                var w_location = this.reader.getFloat(grandChildren[locationIndex], 'w');
                console.log(x_location + " " + y_location + " " + z_location + " " + w_location);
            }

            var r_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'r');
            var g_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'g');
            var b_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'b');
            var a_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'a');
            console.log(r_ambient + " " + g_ambient + " " + b_ambient + " " + a_ambient);

            var r_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'r');
            var g_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'g');
            var b_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'b');
            var a_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'a');
            console.log(r_diffuse + " " + g_diffuse + " " + b_diffuse + " " + a_diffuse);

            var r_specular = this.reader.getFloat(grandChildren[specularIndex], 'r');
            var g_specular = this.reader.getFloat(grandChildren[specularIndex], 'g');
            var b_specular = this.reader.getFloat(grandChildren[specularIndex], 'b');
            var a_specular = this.reader.getFloat(grandChildren[specularIndex], 'a');
            console.log(r_specular + " " + g_specular + " " + b_specular + " " + a_specular);

            // TODO: Store Light global information.
            //this.lights[lightId] = ...;
            //ACRESCENTAR LIGHTS
            numLights++;
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

        var children = texturesNode.children;

        for (var i = 0; i < children.length; i++) {
            var text_id = this.reader.getString(children[i], 'id');
            var path = this.reader.getString(children[i], 'file');

            console.log(text_id + " " + path);

            //FALTA GUARDAR AS TEXTURAS, HOW THO

        }
        console.log("Parsed textures");

        return null;
    }

    /**
     * Parses the <MATERIALS> node.
     * @param {materials block element} materialsNode
     */
    parseMaterials(materialsNode) {

        var children = materialsNode.children;

        var grandChildren = [];
        var nodeNames = [];


        for (var k = 0; k < children.length; k++) {
            nodeNames.push(children[k].nodeName);
        }

        for (var i = 0; i < children.length; i++) {

            var materialId = this.reader.getString(children[i], 'id');
            var material_shine = this.reader.getFloat(children[i], 'shininess');
            console.log(materialId + " " + material_shine);

            grandChildren = children[i].children;
            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            var locationIndex = nodeNames.indexOf("emission");
            var ambientIndex = nodeNames.indexOf("ambient");
            var diffuseIndex = nodeNames.indexOf("diffuse");
            var specularIndex = nodeNames.indexOf("specular");

            var r_emission = this.reader.getFloat(grandChildren[locationIndex], 'r');
            var g_emission = this.reader.getFloat(grandChildren[locationIndex], 'g');
            var b_emission = this.reader.getFloat(grandChildren[locationIndex], 'b');
            var a_emission = this.reader.getFloat(grandChildren[locationIndex], 'a');
            console.log("emission: " + r_emission + " " + g_emission + " " + b_emission + " " + a_emission);

            var r_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'r');
            var g_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'g');
            var b_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'b');
            var a_ambient = this.reader.getFloat(grandChildren[ambientIndex], 'a');
            console.log("ambient: " + r_ambient + " " + g_ambient + " " + b_ambient + " " + a_ambient);

            var r_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'r');
            var g_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'g');
            var b_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'b');
            var a_diffuse = this.reader.getFloat(grandChildren[diffuseIndex], 'a');
            console.log("diffuse: " + r_diffuse + " " + g_diffuse + " " + b_diffuse + " " + a_diffuse);

            var r_specular = this.reader.getFloat(grandChildren[specularIndex], 'r');
            var g_specular = this.reader.getFloat(grandChildren[specularIndex], 'g');
            var b_specular = this.reader.getFloat(grandChildren[specularIndex], 'b');
            var a_specular = this.reader.getFloat(grandChildren[specularIndex], 'a');
            console.log("specular: " + r_specular + " " + g_specular + " " + b_specular + " " + a_specular);
        }

        this.log("Parsed materials");
        return null;
    }

    /**
     * Parses the <TRANSFORMATIONS> node.
     * @param {transformations block element} transformationsNode
     */
    parseTransformations(transformationsNode) {

        var children = transformationsNode.children;

        var grandChildren = [];
        var nodeNames = [];


        for (var k = 0; k < children.length; k++) {
            nodeNames.push(children[k].nodeName);
        }

        for (var i = 0; i < children.length; i++) {

            var transformationId = this.reader.getString(children[i], 'id');

            console.log("transformation ID: " + transformationId);

            grandChildren = children[i].children;
            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            var translateIndex = nodeNames.indexOf("translate");
            var rotateIndex = nodeNames.indexOf("rotate");
            var scaleIndex = nodeNames.indexOf("scale");

            var x_translate = this.reader.getFloat(grandChildren[translateIndex], 'x');
            var y_translate = this.reader.getFloat(grandChildren[translateIndex], 'y');
            var z_translate = this.reader.getFloat(grandChildren[translateIndex], 'z');
            console.log("translate: " + x_translate + " " + y_translate + " " + z_translate);

            var axis_rotate = this.reader.getString(grandChildren[rotateIndex], 'axis');
            var angle_rotate = this.reader.getFloat(grandChildren[rotateIndex], 'angle');
            console.log("rotate: " + axis_rotate + " " + angle_rotate);

            var x_scale = this.reader.getFloat(grandChildren[scaleIndex], 'x');
            var y_scale = this.reader.getFloat(grandChildren[scaleIndex], 'y');
            var z_scale = this.reader.getFloat(grandChildren[scaleIndex], 'z');
            console.log("scale: " + x_scale + " " + y_scale + " " + z_scale);

        }

        this.log("Parsed transformations");
        return null;
    }

    /**
         * Parses the <PRIMITIVES> node.
         * @param {primitives block element} primitivesNode
         */
    parsePrimitives(primitivesNode) {

        var children = primitivesNode.children;

        var grandChildren = [];
        var nodeNames = [];


        for (var k = 0; k < children.length; k++) {
            nodeNames.push(children[k].nodeName);
        }

        for (var i = 0; i < children.length; i++) {

            var primitiveId = this.reader.getString(children[i], 'id');

            console.log("primitive ID: " + primitiveId);

            grandChildren = children[i].children;
            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            var rectangleIndex = nodeNames.indexOf("rectangle");
            var triangleIndex = nodeNames.indexOf("triangle");
            var cylinderIndex = nodeNames.indexOf("cylinder");
            var sphereIndex = nodeNames.indexOf("sphere");
            var torusIndex = nodeNames.indexOf("torus");

            if (rectangleIndex != -1) {
                var x1_rectangle = this.reader.getFloat(grandChildren[rectangleIndex], 'x1');
                var y1_rectangle = this.reader.getFloat(grandChildren[rectangleIndex], 'y1');
                var x2_rectangle = this.reader.getFloat(grandChildren[rectangleIndex], 'x2');
                var y2_rectangle = this.reader.getFloat(grandChildren[rectangleIndex], 'y2');
                console.log("rectangle: " + x1_rectangle + " " + y1_rectangle + " " + x2_rectangle + " " + y2_rectangle);
            }

            if (triangleIndex != -1) {
                var x1_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'x1');
                var y1_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'y1');
                var z1_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'z1');
                var x2_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'x2');
                var y2_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'y2');
                var z2_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'z2');
                var x3_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'x3');
                var y3_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'y3');
                var z3_triangle = this.reader.getFloat(grandChildren[triangleIndex], 'z3');

                console.log("triangle point1: " + x1_triangle + " " + y1_triangle + " " + z1_triangle);
                console.log("triangle point2: " + x2_triangle + " " + y2_triangle + " " + z2_triangle);
                console.log("triangle point3: " + x3_triangle + " " + y3_triangle + " " + z3_triangle);
            }

            if (cylinderIndex != -1) {
                var base_cylinder = this.reader.getFloat(grandChildren[cylinderIndex], 'base');
                var top_cylinder = this.reader.getFloat(grandChildren[cylinderIndex], 'top');
                var height_cylinder = this.reader.getFloat(grandChildren[cylinderIndex], 'height');
                var slices_cylinder = this.reader.getFloat(grandChildren[cylinderIndex], 'slices');
                var stacks_cylinder = this.reader.getFloat(grandChildren[cylinderIndex], 'stacks');
                console.log("cylinder: " + base_cylinder + " " + top_cylinder + " " + height_cylinder + " " + slices_cylinder + " " + stacks_cylinder);
            }

            if (sphereIndex != -1) {
                var radius_sphere = this.reader.getFloat(grandChildren[sphereIndex], 'radius');
                var slices_sphere = this.reader.getFloat(grandChildren[sphereIndex], 'slices');
                var stacks_sphere = this.reader.getFloat(grandChildren[sphereIndex], 'stacks');
                console.log("sphere: " + radius_sphere + " " + slices_sphere + " " + stacks_sphere);
            }

            if (torusIndex != -1) {
                var inner_torus = this.reader.getFloat(grandChildren[torusIndex], 'inner');
                var outer_torus = this.reader.getFloat(grandChildren[torusIndex], 'outer');
                var slices_torus = this.reader.getFloat(grandChildren[torusIndex], 'slices');
                var loops_torus = this.reader.getFloat(grandChildren[torusIndex], 'loops');
                console.log("torus: " + inner_torus + " " + outer_torus + " " + slices_torus + " " + loops_torus);
            }
        }

        this.log("Parsed primitives");
        return null;
    }

    /**
     * Parses the <COMPONENTS> node.
     * @param {components block element} componentsNode
     */
    parseComponents(componentsNode) {

        var children = componentsNode.children;

        var grandChildren = [];
        var nodeNames = [];


        for (var k = 0; k < children.length; k++) {
            nodeNames.push(children[k].nodeName);
        }

        for (var i = 0; i < children.length; i++) {

            var componentId = this.reader.getString(children[i], 'id');

            console.log("component ID: " + componentId);

            grandChildren = children[i].children;
            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            var transformationIndex = nodeNames.indexOf("transformation");
            var grandgrandchildren = grandChildren[transformationIndex].children;
            nodeNames = [];
            for (var j = 0; j < grandgrandchildren.length; j++) {
                nodeNames.push(grandgrandchildren[j].nodeName);
            }

            var translateIndex = nodeNames.indexOf("translate");
            var rotateIndex = nodeNames.indexOf("rotate");
            var scaleIndex = nodeNames.indexOf("scale");

            if (translateIndex != -1) {
                var x_translate = this.reader.getFloat(grandgrandchildren[translateIndex], 'x');
                var y_translate = this.reader.getFloat(grandgrandchildren[translateIndex], 'y');
                var z_translate = this.reader.getFloat(grandgrandchildren[translateIndex], 'z');
                console.log("translate: " + x_translate + " " + y_translate + " " + z_translate);
            }

            if (rotateIndex != -1) {
                var axis_rotate = this.reader.getString(grandgrandchildren[rotateIndex], 'axis');
                var angle_rotate = this.reader.getFloat(grandgrandchildren[rotateIndex], 'angle');
                console.log("rotate: " + axis_rotate + " " + angle_rotate);
            }

            if (scaleIndex != -1) {
                var x_scale = this.reader.getFloat(grandgrandchildren[scaleIndex], 'x');
                var y_scale = this.reader.getFloat(grandgrandchildren[scaleIndex], 'y');
                var z_scale = this.reader.getFloat(grandgrandchildren[scaleIndex], 'z');
                console.log("scale: " + x_scale + " " + y_scale + " " + z_scale);
            }

            nodeNames = [];
            for (var j = 0; j < grandChildren.length; j++) {
                nodeNames.push(grandChildren[j].nodeName);
            }

            var materialsIndex = nodeNames.indexOf("materials");
            var grandgrandchildren = grandChildren[materialsIndex].children;
            
            for (var j = 0; j < grandgrandchildren.length; j++) {
                var materialID = this.reader.getString(grandgrandchildren[j], 'id');
                console.log("material ID: " + materialID);
            }

            var textureIndex = nodeNames.indexOf("texture");
            var textureID = this.reader.getString(grandChildren[textureIndex], 'id');
            console.log("texure ID: " + textureID);

            var childrenIndex = nodeNames.indexOf("children");
            var grandgrandchildren = grandChildren[childrenIndex].children;
            
            for (var j = 0; j < grandgrandchildren.length; j++) {
                var primitiverefID = this.reader.getString(grandgrandchildren[j], 'id');
                console.log("primitiveref ID: " + primitiverefID);
            }

        }

        this.log("Parsed components");
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

        this.processagrafo(root, default_material, default_texture);

    }

    processagrafo(nodeName, MatIni, TextIni) {
        var material = MatIni;
        var texture = TextIni;
        if (nodeName != null) {
            var node = this.grafo[nodeName];
            if (node.material != null) // nao devia ser node.mat ?
                material = node.Material;

            if (material != null)
                this.scene.applyMaterial(material);
            // fazer o msm para a textura
        }

        this.scene.mulMatrix(node.mat);

        for (i = 0; i < node.descendents.length; i++) {
            this.scene.pushMatrix();
            this.scene.applyMaterial(material);
            this.processagrafo(node.descendents[i]);
            this.popMatrix();
        }

        if (node.geom != null) {
            node.geom.display();
        }

    }
}