"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
let extract = require('third-gen-asn1-extractor');
let parser = require('third-gen-asn1-parser');
let formatter = require('third-gen-message-formatter-ran2');
let jsdiff = require('diff');
let diffJson = require('diff-json');
let colors = require('colors');
let pug = require('pug');
let tokenRemoved = '<span style="color: #f00; font-family: monospace;">-';
let tokenAdded = '<span style="color: #008000; font-family: monospace;">+';
let tokenNoChange = '<span style="color: #808080; font-family: monospace;">&nbsp;'; // TODO
let tokenPartialChange = '<span style="color: #FF8C00; font-family: monospace;">?'; // TODO
function diff(jsonOld, jsonNew) {
    // TODO
}
function diffAll(filenameOld, filenameNew) {
    let textOld = fs_1.readFileSync(path_1.resolve(process.cwd(), filenameOld.dir, filenameOld.base), 'utf8');
    let asn1Old = removeInventory(parser.parse(extract(textOld)));
    let textNew = fs_1.readFileSync(path_1.resolve(process.cwd(), filenameNew.dir, filenameNew.base), 'utf8');
    let asn1New = removeInventory(parser.parse(extract(textNew)));
    let listRemoved = [];
    let listAdded = [];
    let listUntouched = [];
    let listModified = [];
    let moduleNames = [];
    for (let moduleName in asn1Old) {
        if (moduleNames.indexOf(moduleName) == -1) {
            moduleNames.push(moduleName);
        }
    }
    for (let moduleName in asn1New) {
        if (moduleNames.indexOf(moduleName) == -1) {
            moduleNames.push(moduleName);
        }
    }
    moduleNames.sort();
    for (let moduleName of moduleNames) {
        let definitions = [];
        for (let definition in asn1Old[moduleName]) {
            if (definitions.indexOf(definition) == -1) {
                definitions.push(definition);
            }
        }
        for (let definition in asn1New[moduleName]) {
            if (definitions.indexOf(definition) == -1) {
                definitions.push(definition);
            }
        }
        definitions.sort();
        for (let definition of definitions) {
            if (definition == 'import') {
                continue;
            }
            if (!asn1Old[moduleName] && asn1New[moduleName]) {
                listAdded.push({ moduleName: moduleName, name: definition });
                continue;
            }
            if (asn1Old[moduleName] && !asn1New[moduleName]) {
                listRemoved.push({ moduleName: moduleName, name: definition });
                continue;
            }
            if (asn1Old[moduleName] && asn1New[moduleName]) {
                if (!asn1Old[moduleName][definition] && asn1New[moduleName][definition]) {
                    listAdded.push({ moduleName: moduleName, name: definition });
                    continue;
                }
                if (asn1Old[moduleName][definition] && !asn1New[moduleName][definition]) {
                    listRemoved.push({ moduleName: moduleName, name: definition });
                    continue;
                }
                let diffJsonResult = diffJson.diff(asn1Old[moduleName][definition], asn1New[moduleName][definition]);
                if (isJsonEmpty(diffJsonResult)) {
                    listUntouched.push({ moduleName: moduleName, name: definition });
                }
                else {
                    let patch = jsdiff.createTwoFilesPatch(`${definition} (old)`, `${definition} (new)`, formatter.format(definition, asn1Old, true, 'txt'), formatter.format(definition, asn1New, true, 'txt'));
                    listModified.push({
                        moduleName: moduleName,
                        name: definition,
                        patch: patch
                    });
                }
                continue;
            }
        }
    }
    return { listAdded: listAdded, listRemoved: listRemoved,
        listUntouched: listUntouched, listModified: listModified };
}
exports.diffAll = diffAll;
function isJsonEmpty(json) {
    return Object.keys(json).length == 0;
}
function removeInventory(asn1Json) {
    for (let moduleName in asn1Json) {
        for (let definition in asn1Json[moduleName]) {
            delete asn1Json[moduleName][definition]['inventory'];
        }
    }
    return asn1Json;
}
if (require.main == module) {
    if (process.argv.length >= 4) {
        let filenameOld = path_1.parse(process.argv[2]);
        let filenameNew = path_1.parse(process.argv[3]);
        let messageIEname = '__all';
        if (process.argv.length >= 5) {
            messageIEname = process.argv[4];
        }
        if (messageIEname == '__all') {
            let diffResult = diffAll(filenameOld, filenameNew);
            let unifiedDiff = {};
            for (let item of diffResult.listModified) {
                unifiedDiff[item.name] = item.patch.replace(/\\/g, '\\\\')
                    .replace(/\n/g, '\\n');
            }
            for (let item of ['old.temp.txt', 'new.temp.txt', 'uniDiffResult']) {
                if (fs_1.existsSync(item)) {
                    fs_1.unlinkSync(item);
                }
            }
            let filenameBase = `${filenameOld.base}-${filenameNew.base}`;
            let filenameOut = `${filenameBase}-untoucheRemovedAdded.html`;
            fs_1.writeFileSync(path_1.resolve(process.cwd(), filenameOut), pug.renderFile('views/untouchedRemovedAdded.pug', {
                oldSpec: filenameOld.name,
                newSpec: filenameNew.name,
                listAdded: diffResult.listAdded,
                listRemoved: diffResult.listRemoved,
                listUntouched: diffResult.listUntouched
            }));
            filenameOut = `${filenameBase}-modified.html`;
            fs_1.writeFileSync(path_1.resolve(process.cwd(), filenameOut), pug.renderFile('views/modified.pug', {
                oldSpec: filenameOld.name,
                newSpec: filenameNew.name,
                listModified: diffResult.listModified,
                unifiedDiff: unifiedDiff,
            }));
        }
        else {
            // TODO
            // let diffResult = diff(asn1Old, asn1New);
            // let filenameOut = `${filenameOld.base}-${filenameNew.base}.htm`;
            // writeFileSync(resolve(process.cwd(), filenameOut), diffResult);
        }
        // console.log(JSON.stringify(ans1Old, null, 2));
        // console.log(JSON.stringify(asn1New, null, 2));
    }
    else {
        console.log('Usage: node diff <spec_old> <spec_new>');
        console.log('ex   : node diff 38331-f10 38331-f21');
    }
}
