/**
 * Created by luke on 2019/1/7.
 */
const fs = require('fs');
const _ = require('underscore');
let command;

if(process.argv.length >= 2) {
  command = process.argv[2];
}
switch (command) {
  // test use
  case '0':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let lines = [];
      let errors = [];
      let errNums = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        let errNumStart;
        if ((errNumStart = line.indexOf('- error TS')) >= 0) {
          errNumStart = errNumStart + 8;
          errNums.push(line.substr(errNumStart, 6));
        }

            // get [MoreRulesDropdown] from "Property 'template' does not exist on type 'MoreRulesDropdown'."
            const [, , , className,] = line.split("'");
            if (className === '{}') continue;
            classNames.push(className);
            const pathEnd = line.indexOf('.ts');
            locations.push(line.substring(0, pathEnd + 3));
            lines.push(line);
            const startPos = line.indexOf('error TS2339:');
            const [, errorMsg] = line.substring(startPos).split("'");
            errors.push(errorMsg);
      }

      let TSErrorList = {};
      // Traverse all array elements
      for (let err of errNums) {
        if (TSErrorList[err] === undefined) {
          TSErrorList[err] = 0;
        }
        for (let errList in TSErrorList) {
          if (err === errList) {
            TSErrorList[errList]++;
          }
        }
      }
      console.log(TSErrorList);
      console.log(errNums.length);


    })();
    break;

//------ for public xxx: type ------
  case '1':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let lines = [];
      let errors = [];


      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/error TS2339: Property '\w+' does not exist on type '\w+'\./)) {
          if (lineByline[parseInt(ind) + 2] && lineByline[parseInt(ind) + 2].match(/\d+\s+this\.prototype\./)) {


            // get [MoreRulesDropdown] from "Property 'template' does not exist on type 'MoreRulesDropdown'."
            const [, , , className,] = line.split("'");
            if (className === '{}') continue;
            classNames.push(className);
            const pathEnd = line.indexOf('.ts');
            locations.push(line.substring(0, pathEnd + 3));
            lines.push(line);
            const startPos = line.indexOf('error TS2339:');
            const [, errorMsg] = line.substring(startPos).split("'");
            errors.push(errorMsg);
          }
        }
      }

      console.log(_.uniq(errors));

      const stringProp = ['tagName', 'className', 'id', 'PROPS_ATTR', 'behaviorName', 'modelType'];

      for (let ind in locations) {

        const path = locations[ind];
        const className = classNames[ind];
        const err = errors[ind];

        const propertyName = err;
        const propertyType = (_.contains(stringProp, err)) ? 'string' : 'any';
        const templateStr = `public ${propertyName}: ${propertyType};`;

        data = fs.readFileSync(path, 'utf8'); //read existing contents into data
        const classLocation = data.indexOf(`class ${className} `);
        if (classLocation < 0) continue;
        const insertLocation = data.indexOf('{', classLocation) + 1;
        //console.log(data.slice(insertLocation));

        const prefixSpace = data.slice(insertLocation + 1).match(new RegExp('\\s+'))[0].length;
        if (data.indexOf(templateStr, insertLocation) > 0 &&
          data.indexOf(templateStr, insertLocation) - insertLocation <= prefixSpace + 1 + templateStr.length) {
          console.log(path + 'is duplicate');
          continue;
        }

        const templateStrWithSpace = `\n${' '.repeat(prefixSpace)}${templateStr}`;

        data = `${data.slice(0, insertLocation)}${templateStrWithSpace}${data.slice(insertLocation)}`;
        fs.writeFileSync(path, data);
      }
    })();
    break;


  //------ for "'xxx' does not exist on type 'object'." ------

  case '2':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lines = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.indexOf('error TS2339: Property') >= 0 && line.indexOf(`does not exist on type 'object'.`) >= 0) {

          // get Wavy line starting position
          const endPos = lineByline[parseInt(ind) + 3].match(new RegExp('\\s+'))[0].length;
          const [, keyName] = line.split("'");
          const prevSpace = lineByline[parseInt(ind) + 2].lastIndexOf(' ', endPos - 2);
          const prevDollar = lineByline[parseInt(ind) + 2].lastIndexOf('${', endPos - 2);
          const startPos = prevSpace > prevDollar ? prevSpace : prevDollar + 1;
          const targetName = lineByline[parseInt(ind) + 2].substring(startPos + 1, endPos - 1);

          // get [MoreRulesDropdown] from "Property 'template' does not exist on type 'MoreRulesDropdown'."
          const [, , , className,] = line.split("'");
          if (className === '{}') continue;
          classNames.push(className);
          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          const [, lineNum] = line.split(":");
          lineNumbers.push(lineNum);
          lines.push(line);
          targetNames.push(targetName);
          keyNames.push(keyName);
        }
      }

console.log(locations);

      for (let ind in locations) {

        const path = locations[ind];
        const targetName = targetNames[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        dataLines[parseInt(lineNum) - 1] = dataLines[parseInt(lineNum) - 1].replace(`${targetName}.${keyName}`, `(<any>${targetName}).${keyName}`);
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    })();
    break;

  // -- error TS2314: Generic type 'Collection<TModel>'  --

  case '3':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];
      let genericNums = [];
      let lines = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/error TS2314: Generic type '[\W\w]+<[\W\w]+>' requires 1 type argument\(s\)\./)) {

          // lineNum will be 63, linestart will be 28
          let [, lineNum, lineStart] = line.split(":");
          lineStart = lineStart.match(/\d+/)[0];

          // keyName will be 'Collection'
          let [, keyName] = line.split("'");
          [keyName] = keyName.split('<');
          let genericNum = keyName.split(',').length;
          genericNums.push(genericNum);
          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          lineStarts.push(lineStart);
          lineNumbers.push(lineNum);
          lines.push(line);
          keyNames.push(keyName);
        }
      }


      for (let ind in locations) {
        const path = locations[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];
        const genericNum = genericNums[ind];

        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        let lineHead = dataLines[parseInt(lineNum) - 1].substring(0, lineStart - 1);
        let lineTail = dataLines[parseInt(lineNum) - 1].substring(lineStart - 1);

        let anyString = 'any';
        if (genericNum > 1) {
          let anyArray = Array(genericNum).fill('any');
          anyString = anyArray.join(', ');
        }
        if (lineTail.indexOf(`${keyName}<${anyString}>`) >= 0) continue;
        lineTail = lineTail.replace(keyName, `${keyName}<${anyString}>`);
        dataLines[parseInt(lineNum) - 1] = lineHead + lineTail;
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    }());
    break;

  // -- error TS2459: Type '{}' has no property '[\W\w]+' and no string index signature\ --

  case '4':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];


      const propertyName = 'PROPS_ATTR';
      const propertyType = 'string';
      const templateStr = `public ${propertyName}: ${propertyType};`;

      let lines = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/error TS2459: Type '{}' has no property '[\W\w]+' and no string index signature\./)) {

          // lineNum will be 63, linestart will be 28
          let [, lineNum, lineStart] = line.split(":");
          lineStart = lineStart.match(/\d+/)[0];

          // keyName will be 'Collection'
          let [, keyName] = line.split("'");
          [keyName] = keyName.split('<');

          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          lineStarts.push(lineStart);
          lineNumbers.push(lineNum);
          lines.push(line);
          keyNames.push(keyName);
        }
      }


      for (let ind in locations) {
        const path = locations[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];


        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        let lineHead = dataLines[parseInt(lineNum) - 1].substring(0, lineStart - 1);
        let lineTail = dataLines[parseInt(lineNum) - 1].substring(lineStart - 1);

        // de-duplicate
        if (lineTail.indexOf('= (<any>') >= 0) continue;
        let startPos = lineTail.indexOf('} = ');
        let stringToBeReplaced = lineTail.substring(startPos + 4, lineTail.length - 1);
        lineTail = lineTail.replace(stringToBeReplaced, `(<any>${stringToBeReplaced})`);
        dataLines[parseInt(lineNum) - 1] = lineHead + lineTail;
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    })();
    break;

  //-- error TS2424: Class '.*' defines instance member function '.*', but extended class --

  case '5':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];

      let lines = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/error TS2424: Class '.*' defines instance member function '.*', but extended class/)) {

          // lineNum will be 63, linestart will be 28
          let [, lineNum, lineStart] = line.split(":");
          lineStart = lineStart.match(/\d+/)[0];

          // keyName will be 'Collection'
          let [, keyName] = line.split("'");
          [keyName] = keyName.split('<');

          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          lineStarts.push(lineStart);
          lineNumbers.push(lineNum);
          lines.push(line);
          keyNames.push(keyName);
        }
      }


      for (let ind in locations) {
        const path = locations[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];


        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        if (dataLines[parseInt(lineNum) - 1].indexOf('{') !== dataLines[parseInt(lineNum) - 1].length - 1) {
          dataLines.splice(parseInt(lineNum) - 1, 1);
        }
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    }());
    break;




// -- Cannot find name --

  case '6':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];

      let lines = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/Cannot find name/)) {
          // keyName will be 'Collection'
          let [, keyName] = line.split("'");

          let detailLine = 2;
          while (!lineByline[parseInt(ind) + detailLine].match(new RegExp(/^\d/))) {
            detailLine++;
          }
          // find "for (key in this.views)" error (key doesn't be defined)
          if (lineByline[parseInt(ind) + detailLine].indexOf(`for (${keyName}`) < 0) continue;

          // lineNum will be 63, linestart will be 28
          let [, lineNum, lineStart] = line.split(":");
          lineStart = lineStart.match(/\d+/)[0];

          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          lineStarts.push(lineStart);
          lineNumbers.push(lineNum);
          lines.push(line);
          keyNames.push(keyName);
        }
      }


      console.log(lines);


      for (let ind in locations) {
        const path = locations[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];


        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        let lineHead = dataLines[parseInt(lineNum) - 1].substring(0, dataLines[parseInt(lineNum) - 1].indexOf(`for (${keyName}`));
        let lineTail = dataLines[parseInt(lineNum) - 1].substring(dataLines[parseInt(lineNum) - 1].indexOf(`for (${keyName}`));
        lineTail = lineTail.replace(`for (${keyName}`, `for (let ${keyName}`);
        dataLines[parseInt(lineNum) - 1] = lineHead + lineTail;
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    }());
    break;




// ---- TS2339 ------
  case '7':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];
      let lines = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.indexOf(`error TS2339:`) >= 0) {

          let detailLine = 2;
          while (!lineByline[parseInt(ind) + detailLine].match(new RegExp(/^\d/))) {
            detailLine++;
          }

          // get Wavy line starting position
          const endPos = lineByline[parseInt(ind) + detailLine + 1].match(new RegExp('\\s+'))[0].length;
          let [, lineNum, lineStart] = line.split(":");
          lineStart = lineStart.match(/\d+/)[0];
          const [, keyName] = line.split("'");
          const prevSpace = lineByline[parseInt(ind) + detailLine].lastIndexOf(' ', endPos - 2);
          const prevDollar = lineByline[parseInt(ind) + detailLine].lastIndexOf('${', endPos - 2);
          let preBracket = lineByline[parseInt(ind) + detailLine].lastIndexOf('[', endPos - 2);
          const preRBracket = lineByline[parseInt(ind) + detailLine].lastIndexOf(']', endPos - 2);

          if (preBracket < endPos && preRBracket < endPos && preBracket < preRBracket) {
            preBracket = -1;
          }

          let preParentheses = lineByline[parseInt(ind) + detailLine].lastIndexOf('(', endPos - 2);
          const preRParentheses = lineByline[parseInt(ind) + detailLine].lastIndexOf(')', endPos - 2);

          if (preParentheses < endPos && preRParentheses < endPos && preParentheses < preRParentheses) {
            preParentheses = -1;
          }

          // const a ＝ lineByline[parseInt(ind) + 2].lastIndexOf('(', endPos-2);
          const startPos = Math.max(prevSpace, prevDollar, preBracket, preParentheses);
          const targetName = lineByline[parseInt(ind) + detailLine].substring(startPos + 1, endPos - 1);
          if (targetName === 'super') continue;

          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          lineStarts.push(lineStart);
          lineNumbers.push(lineNum);
          lines.push(line);
          targetNames.push(targetName);
          keyNames.push(keyName);
        }
      }

      for (let ind in locations) {
        const path = locations[ind];
        const targetName = targetNames[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];

        if (keyName === 'formatWith' ||keyName === 'format' ) continue;

        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        let lineHead = dataLines[parseInt(lineNum) - 1].substring(0, lineStart - 1);
        let splitPos = lineHead.lastIndexOf(`${targetName}.`);
        let lineTail = dataLines[parseInt(lineNum) - 1].substring(splitPos);
        lineHead = dataLines[parseInt(lineNum) - 1].substring(0, splitPos);

        lineTail = lineTail.replace(`${targetName}.${keyName}`, `(<any>${targetName}).${keyName}`);
        dataLines[parseInt(lineNum) - 1] = lineHead + lineTail;
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    }());

    break;

  // error TS2345: Argument of type 'number' is not assignable to parameter of type 'string'.
  case '8':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];
      let lines = [];
      let targetLens = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/error TS2345: Argument of type '[\w|\s]+' is not assignable to parameter of type '[\w|\s]+'\./)) {

          let detailLine = 2;
          while (!lineByline[parseInt(ind) + detailLine].match(new RegExp(/^\d/))) {
            detailLine++;
          }

          // get Wavy line starting position
          const endPos = lineByline[parseInt(ind) + detailLine + 1].match(new RegExp('\\s+'))[0].length;
          const lastWavy = lineByline[parseInt(ind) + detailLine + 1].lastIndexOf('~');
          targetLens.push(lastWavy - endPos);

          let [, lineNum, lineStart] = line.split(":");
          lineStart = lineStart.match(/\d+/)[0];
          const [, keyName] = line.split("'");


          const pathEnd = line.indexOf('.ts');
          locations.push(line.substring(0, pathEnd + 3));
          lineStarts.push(lineStart);
          lineNumbers.push(lineNum);
          lines.push(line);
          keyNames.push(keyName);
        }
      }

      //console.log(lines);


      for (let ind in locations) {
        const path = locations[ind];
        const targetName = targetNames[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];
        const targetLen = targetLens[ind];

        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        let lineHead = dataLines[parseInt(lineNum) - 1].substring(0, lineStart - 1);
        let lineTail = dataLines[parseInt(lineNum) - 1].substring(lineStart - 1);
        const targetVar = lineTail.substring(0, targetLen+1);

        lineTail = lineTail.replace(targetVar, `(<any>${targetVar})`);
        dataLines[parseInt(lineNum) - 1] = lineHead + lineTail;
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    }());
    break;

  // error TS2322: Type 'EventsHash' is not assignable to type '() => EventsHash'.
  case '9':
    (function() {
      let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let classNames = [];
      let targetNames = [];
      let keyNames = [];
      let lineNumbers = [];
      let lineStarts = [];
      let lines = [];
      let targetLens = [];

      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.match(/error TS2322: .+ '\(\) => EventsHash'\./)) {
          let detailLine = 2;
          while (!lineByline[parseInt(ind) + detailLine].match(new RegExp(/^\d/))) {
            detailLine++;
          }
          if (lineByline[parseInt(ind) + detailLine].match(/\d+\s+this\.prototype\.events/)) {
            // get Wavy line starting position
            const endPos = lineByline[parseInt(ind) + detailLine + 1].match(new RegExp('\\s+'))[0].length;
            const lastWavy = lineByline[parseInt(ind) + detailLine + 1].lastIndexOf('~');
            targetLens.push(lastWavy - endPos);

            let [, lineNum, lineStart] = line.split(":");
            lineStart = lineStart.match(/\d+/)[0];
            const [, keyName] = line.split("'");


            const pathEnd = line.indexOf('.ts');
            locations.push(line.substring(0, pathEnd + 3));
            lineStarts.push(lineStart);
            lineNumbers.push(lineNum);
            lines.push(line);
            keyNames.push(keyName);
          }
        }
      }

      console.log(lines.length);

      for (let ind in locations) {
        const path = locations[ind];
        const targetName = targetNames[ind];
        const keyName = keyNames[ind];
        const lineNum = lineNumbers[ind];
        const lineStart = lineStarts[ind];
        const targetLen = targetLens[ind];

        data = fs.readFileSync(path, 'utf8'); //read existing contents into data

        dataLines = data.split('\n');
        const splitStart = dataLines[parseInt(lineNum) - 1].indexOf("this.prototype.events");

        let lineHead = dataLines[parseInt(lineNum) - 1].substring(0, splitStart + 24);
        let lineTail = dataLines[parseInt(lineNum) - 1].substring(splitStart + 24);

        if (lineTail.indexOf('{') >= 0) {
          if (lineTail.indexOf('}') >= 0) {
            // remove the semi-colon
            let target = lineTail.substring(0, lineTail.length-1);
            lineTail = lineTail.replace(target, `(<any>${target})`);
          }
          else {
            let i = 0;
            while (dataLines[parseInt(lineNum) - 1 + i].indexOf('}') < 0) {
              i++;
            }
            lineTail = lineTail.replace(lineTail, `(<any>${lineTail}`);
            let endLine = dataLines[parseInt(lineNum) - 1 + i];
            let target = endLine.substring(0, endLine.length - 1);
            endLine = endLine.replace(target, `${target})`);
          }
        }
        else {
          // remove the semi-colon
          let target = lineTail.substring(0, lineTail.length-1);
          lineTail = lineTail.replace(target, `(<any>${target})`);
        }

        dataLines[parseInt(lineNum) - 1] = lineHead + lineTail;
        data = dataLines.join('\n');

        fs.writeFileSync(path, data);
      }
    }());
    break;

  // === "TS2300: Duplicate identifier 'Co3'." ===
  case '10':
    (function() {
      let data = fs.readFileSync('/Users/luke/Desktop/webpack_error.txt', 'utf8');
      let lineByline = data.split('\n');

      let locations = [];
      let lines = [];
      let errors = [];


      for (let ind in lineByline) {
        const line = lineByline[ind];
        if (line.indexOf("TS2300: Duplicate identifier 'Co3'.") >= 0 ||
          line.indexOf("TS2300: Duplicate identifier 'Co3M'.") >= 0) {
          //if (lineByline[parseInt(ind) - 1] && lineByline[parseInt(ind) -1].match(/\d+\s+this\.prototype\./)) {


          const pathEnd = lineByline[parseInt(ind) - 1].indexOf('.ts');
          locations.push(lineByline[parseInt(ind) - 1].substring(15, pathEnd + 3));


          lines.push(line);

        }
      }
      console.log(locations.length);
      locations = _.uniq(locations);

      for (let ind in locations) {
        let nameSpaces = [];
        let classNames = [];
        let nsWithSpaceLen = [];
        let leadingSpaces = 0;
        let isExport = false;
        const path = locations[ind];
        console.log(path);

        data = fs.readFileSync(path, 'utf8'); //read existing contents into data
        let dataLines = data.split('\n');
        let nameSpaceLeadingSpace = -1;
        for(let i in dataLines) {
          let splitWords = dataLines[i].split(' ');
          if (_.contains(splitWords, 'namespace') && _.contains(splitWords, '{')) {
            let nsLeadingSpaces = splitWords.findIndex((word, index) => {
              return word !== '';
            });
            if (nsLeadingSpaces <= nameSpaceLeadingSpace) {
              let endLine = i-1;
              let total = ((nameSpaceLeadingSpace - nsLeadingSpaces)/2);
              for (let i = endLine; i >=0 && total >=0; i--) {
                let preSplitWords = dataLines[i].split(' ');
                let filteredResult = preSplitWords.filter((item) => {
                  return item !== '' && item !== '}';
                });
                // means this line only contains } and ' '
                if (filteredResult.length === 0) {
                  if (dataLines[i] && dataLines[i].indexOf('}') >= 0) {
                    delete dataLines[i];
                    total--;
                  }
                }
              }
            }
            nameSpaceLeadingSpace = nsLeadingSpaces;

            let namespaceInd;
            splitWords.forEach((word, index) => {
              if (word === 'namespace') {
                namespaceInd = index;
              }
            });
            nameSpaces.push(splitWords[++namespaceInd]);
            nsWithSpaceLen.push({space: nameSpaceLeadingSpace, name: splitWords[namespaceInd]})
            delete dataLines[i];
          }
          else if (_.contains(splitWords, 'class') && _.contains(splitWords, '{')) {
            let classInd;
            classInd = splitWords.findIndex((word, index) => {
              return word === 'class';
            });


            // find leading spaces
            leadingSpaces = splitWords.findIndex((word, index) => {
              return word !== '';
            });
            if (splitWords[leadingSpaces] === 'export') {
              isExport = true;
            }

            let addedLine = '';
            for (let space = 0; space <= leadingSpaces - 2; space+=2) {
              let ind = _.findLastIndex(nsWithSpaceLen, {space: space});
              if (ind < 0) continue;
              if (nsWithSpaceLen[ind].name === 'Co3' || nsWithSpaceLen[ind].name === 'Co3M') {
                addedLine += nsWithSpaceLen[ind].name;
              }
              else {
                addedLine += `['${nsWithSpaceLen[ind].name}']`;
              }
            }
            addedLine += `['${splitWords[++classInd]}'] = ${splitWords[classInd]};`;
            classNames.push(addedLine);

            splitWords.splice(0, leadingSpaces);
            dataLines[i] = splitWords.join(' ');
          }
          else if (_.contains(splitWords, 'interface') && _.contains(splitWords, '{')) {
            let interfaceInd;
            interfaceInd = splitWords.findIndex((word, index) => {
              return word === 'interface';
            });
            // find leading spaces
            leadingSpaces = splitWords.findIndex((word, index) => {
              return word !== '';
            });
            if (splitWords[leadingSpaces] === 'export') {
              isExport = true;
            }
            splitWords.splice(0, leadingSpaces);
            dataLines[i] = splitWords.join(' ');
          }
          else if (_.contains(splitWords, 'export') && _.contains(splitWords, 'function') && _.contains(splitWords, '{')) {
            let fnInd;
            fnInd = splitWords.findIndex((word, index) => {
              return word === 'function';
            });
            // find leading spaces
            leadingSpaces = splitWords.findIndex((word, index) => {
              return word !== '';
            });
            if (splitWords[leadingSpaces] === 'export') {
              isExport = true;
            }

            let addedLine = '';
            for (let space = 0; space <= leadingSpaces - 2; space+=2) {
              let ind = _.findLastIndex(nsWithSpaceLen, {space: space});
              if (nsWithSpaceLen[ind].name === 'Co3' || nsWithSpaceLen[ind].name === 'Co3M') {
                addedLine += nsWithSpaceLen[ind].name;
              }
              else {
                addedLine += `['${nsWithSpaceLen[ind].name}']`;
              }
            }

            addedLine += `['${splitWords[++fnInd].split('(')[0]}'] = ${splitWords[fnInd].split('(')[0]};`;
            classNames.push(addedLine);
            splitWords.splice(0, leadingSpaces);
            dataLines[i] = splitWords.join(' ');
          }
          else {
            // find leading spaces
            let curLeadingSpaces = splitWords.findIndex((word) => {
              return word !== '';
            });
            if (splitWords[curLeadingSpaces] === 'export') {
              isExport = true;
            }
            curLeadingSpaces >= leadingSpaces ?
              splitWords.splice(0, leadingSpaces) : splitWords.splice(0, curLeadingSpaces);
            dataLines[i] = splitWords.join(' ');
          }
        }

        // remove ending '}'
        let nameSpaceHierarchyLen = nameSpaceLeadingSpace/2;

        for (let i = dataLines.length-1, total = nameSpaceHierarchyLen; i >=0 && total >=0; i--) {
          let preSplitWords;
          if (dataLines[i] !== undefined) {
            preSplitWords = dataLines[i].split(' ');
            let filteredResult = preSplitWords.filter((item) => {
              return item !== '' && item !== '}';
            });
            // means this line only contains } and ' '
            if (filteredResult.length === 0) {
              if (dataLines[i] && dataLines[i].indexOf('}') >= 0) {
                delete dataLines[i];
                total--;
              }
            }
          }
        }
        let removeEmpty = dataLines.filter(line => {
          if (line !== undefined) return true;
          return false;
        });
        data = removeEmpty.join('\n');

        // add `Co3M['AutomaticTaskApp']['Edit']['Views']['Layout'] = Layout;`
        let isNext = false;
        for (let className of classNames) {
          data += `\n${className}`;
        }
        if (!isExport) {
          data += `\nexport {};`;
        }

        fs.writeFileSync(path, data);
      }
    })();
    break;


}


// ---Co3AjaxOptions --

//
// const fs = require('fs');
// const _ = require('underscore');
//
// let data = fs.readFileSync('../../tsc_error.txt', 'utf8');
// let lineByline = data.split('\n');
//
// let locations = [];
// let classNames = [];
// let targetNames = [];
// let keyNames = [];
// let lineNumbers = [];
// let lineStarts = [];
// let lines = [];
// const stringToInserted = "import { Co3AjaxOptions } from 'globals/ajax';\n";
//
// for (let ind in lineByline) {
//   const line = lineByline[ind];
//   if (line.match(/Cannot find name 'Co3AjaxOptions'/)) {
//     // keyName will be 'Collection'
//     let [, keyName] = line.split("'");
//
//     // lineNum will be 63, linestart will be 28
//     let [, lineNum, lineStart] = line.split(":");
//     lineStart = lineStart.match(/\d+/)[0];
//
//     const pathEnd = line.indexOf('.ts');
//     locations.push(line.substring(0, pathEnd + 3));
//     lineStarts.push(lineStart);
//     lineNumbers.push(lineNum);
//     lines.push(line);
//     keyNames.push(keyName);
//   }
// }
//
//
// console.log(lines);
//
//
// for (let ind in locations) {
//   const path = locations[ind];
//   const keyName = keyNames[ind];
//   const lineNum = lineNumbers[ind];
//   const lineStart = lineStarts[ind];
//
//
//   data = fs.readFileSync(path, 'utf8'); //read existing contents into data
//
//   if (data.indexOf(stringToInserted) >= 0) continue;
//   data = stringToInserted + data;
//
//   fs.writeFileSync(path, data);
// }

