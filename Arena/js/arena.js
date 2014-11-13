define([], function () {
    'use strict';
    var
        assetDir = "asset/",
        modelDir = assetDir + "model/",
        propDir = assetDir + "prop/",
        textureDir = assetDir + "texture/";
    return {
        version: '0.1.1',
        debug: true,
        assetDir: assetDir,
        modelDir: modelDir,
        propDir: propDir,
        textureDir: textureDir
    };
});