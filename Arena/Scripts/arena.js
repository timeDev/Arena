define([], function () {
    'use strict';
    var
        assetDir = "asset/",
        modelDir = assetDir + "model/",
        propDir = assetDir + "prop/",
        textureDir = assetDir + "texture/";
    return {
        /// <field name="version" type="String">The game version string.</field>
        version: '0.1.1',
        /// <field name="debug" type="Boolean">If true, enables debugging.</field>
        debug: true,
        /// <field name="assetDir" type="String">The asset directory path.</field>
        assetDir: assetDir,
        /// <field name="modelDir" type="String">The model directory path.</field>
        modelDir: modelDir,
        /// <field name="propDir" type="String">The prop directory path.</field>
        propDir: propDir,
        /// <field name="textureDir" type="String">The texture directory path.</field>
        textureDir: textureDir
    };
});