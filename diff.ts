import { readFileSync, writeFileSync } from 'fs';
import { parse, resolve } from 'path';

let extract = require('third-gen-asn1-extractor');
let parser = require('third-gen-asn1-parser');
let jsDiff = require('diff');
let colors = require('colors');

export function diff(jsonOld, jsonNew) {
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

let tokenRemoved = '<span style="color: #f00; font-family: monospace;">-';
let tokenAdded = '<span style="color: #008000; font-family: monospace;">+';
let tokenUnknown = '<span style="color: #808080; font-family: monospace;">?'; // TODO

export function diffAll(jsonOld, jsonNew) {
    let diffResult = '';
    let moduleNames = [];
    for (let moduleName in jsonOld) {
        if (moduleNames.indexOf(moduleName) == -1) {
            moduleNames.push(moduleName);
        }
    }
    for (let moduleName in jsonNew) {
        if (moduleNames.indexOf(moduleName) == -1) {
            moduleNames.push(moduleName);
        }
    }
    moduleNames.sort();
    for (let moduleName of moduleNames) {
        let definitions = [];
        for (let definition in jsonOld[moduleName]) {
            if (definitions.indexOf(definition) == -1) {
                definitions.push(definition);
            }
        }
        for (let definition in jsonNew[moduleName]) {
            if (definitions.indexOf(definition) == -1) {
                definitions.push(definition);
            }
        }
        definitions.sort();
        for (let definition of definitions) {
            if (!jsonOld[moduleName] && jsonNew[moduleName]) {
                diffResult += `${tokenAdded} ${moduleName}/${definition}</span><br>`;
                continue;
            }
            if (jsonOld[moduleName] && !jsonNew[moduleName]) {
                diffResult += `${tokenRemoved} ${moduleName}/${definition}</span><br>`;
                continue;
            }
            if (jsonOld[moduleName] && jsonNew[moduleName]) {
                if (!jsonOld[moduleName][definition] && jsonNew[moduleName][definition]) {
                    diffResult += `${tokenAdded} ${moduleName}/${definition}</span><br>`;
                    continue;
                }
                if (jsonOld[moduleName][definition] && !jsonNew[moduleName][definition]) {
                    diffResult += `${tokenRemoved} ${moduleName}/${definition}</span><br>`;
                    continue;
                }
                diffResult += `${tokenUnknown} ${moduleName}/${definition}</span><br>`;
                continue;
            }
        }
    }
    return diffResult;
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
    if (process.argv.length >=4) {
        let filenameOld = parse(process.argv[2]);
        let textOld = readFileSync(resolve(process.cwd(), filenameOld.dir,
                                                            filenameOld.base),
                                    'utf8');
        let asn1Old = removeInventory(parser.parse(extract(textOld)));
        let filenameNew = parse(process.argv[3]);
        let textNew = readFileSync(resolve(process.cwd(), filenameNew.dir,
                                                            filenameNew.base),
                                    'utf8');
        let asn1New = removeInventory(parser.parse(extract(textNew)));
        let messageIEname = '__all';
        if (process.argv.length >= 5) {
            messageIEname = process.argv[4];
        }
        if (messageIEname == '__all') {
            let diffResult = diffAll(asn1Old, asn1New);
            let filenameOut = `${filenameOld.base}-${filenameNew.base}.htm`;
            writeFileSync(resolve(process.cwd(), filenameOut), diffResult);
        } else {
            let diffResult = diff(asn1Old, asn1New);
            let filenameOut = `${filenameOld.base}-${filenameNew.base}.htm`;
            writeFileSync(resolve(process.cwd(), filenameOut), diffResult);
        }
        // console.log(JSON.stringify(ans1Old, null, 2));
        // console.log(JSON.stringify(asn1New, null, 2));
    } else {
        console.log('Usage: node diff <spec_old> <spec_new>');
        console.log('ex   : node diff 38331-f10 38331-f21');
    }
}
