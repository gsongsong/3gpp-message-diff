"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
var extract = require('third-gen-asn1-extractor');
var parser = require('third-gen-asn1-parser');
var jsDiff = require('diff');
var colors = require('colors');
function diff(jsonOld, jsonNew) {
    // let diffResult = jsDiff.diffJson(jsonOld, jsonNew);
    // let resultFormatted = '';
    // diffResult.forEach(element => {
    //     let color = element.added ? '008000' :
    //                                 element.removed ? 'ff0000' :
    //                                                     '808080';
    //     resultFormatted += `<span style="color:#${color};">${element.value
    //                                         .replace(/\n+/g, '<br>')
    //                                         .replace(/ /g, '&nbsp;')}</span>`;
    // });
    // return resultFormatted;
}
exports.diff = diff;
function diffAll(jsonOld, jsonNew) {
    var moduleNames = [];
    for (var moduleName in jsonOld) {
        if (moduleNames.indexOf(moduleName) == -1) {
            moduleNames.push(moduleName);
        }
    }
    for (var moduleName in jsonNew) {
        if (moduleNames.indexOf(moduleName) == -1) {
            moduleNames.push(moduleName);
        }
    }
    moduleNames.sort();
    for (var _i = 0, moduleNames_1 = moduleNames; _i < moduleNames_1.length; _i++) {
        var moduleName = moduleNames_1[_i];
        var definitions = [];
        for (var definition in jsonOld[moduleName]) {
            if (definitions.indexOf(definition) == -1) {
                definitions.push(definition);
            }
        }
        for (var definition in jsonNew[moduleName]) {
            if (definitions.indexOf(definition) == -1) {
                definitions.push(definition);
            }
        }
        definitions.sort();
        for (var _a = 0, definitions_1 = definitions; _a < definitions_1.length; _a++) {
            var definition = definitions_1[_a];
            if (!jsonOld[moduleName] && jsonNew[moduleName]) {
                console.log("+ " + moduleName + "/" + definition);
                continue;
            }
            if (jsonOld[moduleName] && !jsonNew[moduleName]) {
                console.log("- " + moduleName + "/" + definition);
                continue;
            }
            if (jsonOld[moduleName] && jsonNew[moduleName]) {
                if (!jsonOld[moduleName][definition] && jsonNew[moduleName][definition]) {
                    console.log("+ " + moduleName + "/" + definition);
                    continue;
                }
                if (jsonOld[moduleName][definition] && !jsonNew[moduleName][definition]) {
                    console.log("- " + moduleName + "/" + definition);
                    continue;
                }
                // TODO: compare two
                continue;
            }
        }
    }
}
exports.diffAll = diffAll;
function removeInventory(asn1Json) {
    for (var moduleName in asn1Json) {
        for (var definition in asn1Json[moduleName]) {
            delete asn1Json[moduleName][definition]['inventory'];
        }
    }
    return asn1Json;
}
if (require.main == module) {
    if (process.argv.length >= 4) {
        var filenameOld = path_1.parse(process.argv[2]);
        var textOld = fs_1.readFileSync(path_1.resolve(process.cwd(), filenameOld.dir, filenameOld.base), 'utf8');
        var asn1Old = removeInventory(parser.parse(extract(textOld)));
        var filenameNew = path_1.parse(process.argv[3]);
        var textNew = fs_1.readFileSync(path_1.resolve(process.cwd(), filenameNew.dir, filenameNew.base), 'utf8');
        var asn1New = removeInventory(parser.parse(extract(textNew)));
        var messageIEname = '__all';
        if (process.argv.length >= 5) {
            messageIEname = process.argv[4];
        }
        if (messageIEname == '__all') {
            var diffResult = diffAll(asn1Old, asn1New);
            var filenameOut = filenameOld.base + "-" + filenameNew.base + ".htm";
            fs_1.writeFileSync(path_1.resolve(process.cwd(), filenameOut), diffResult);
        }
        else {
            var diffResult = diff(asn1Old, asn1New);
            var filenameOut = filenameOld.base + "-" + filenameNew.base + ".htm";
            fs_1.writeFileSync(path_1.resolve(process.cwd(), filenameOut), diffResult);
        }
        // console.log(JSON.stringify(ans1Old, null, 2));
        // console.log(JSON.stringify(asn1New, null, 2));
    }
    else {
        console.log('Usage: node diff <spec_old> <spec_new>');
        console.log('ex   : node diff 38331-f10 38331-f21');
    }
}
