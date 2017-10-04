var fs = require('fs')

read_binvox('./models/model_normalized.solid.binvox')

function read_binvox(filename) {
  fs.readFile(filename, function(err, buf) {
    if (err) {
      console.error(err);
    }
    
    // read header
    var lines = []
    var line
    while (line != 'data') {
      var pos = buf.indexOf('\n')
      line = buf.toString('utf-8', 0, pos)
      lines.push(line)
      buf = buf.slice(pos+1)
    }
    
    console.log("...reading binvox version");
    var line = lines[0].slice(0, 7)
    if (line != '#binvox') {
      console.error(`Error: first line reads ${line} instead of #binvox`)
      return -1
    } 
    var version = parseInt(lines[0].slice(8), 10)
    
    console.log("...reading binvox version");
    var depth, height, width;
    for(var i=1; i<lines.length-1; i++) {
      line = lines[i]
      if (line.slice(0, line.indexOf(' ')) == 'dim') {
        line = line.slice(line.indexOf(' ')+1)
        var pos = line.indexOf(' ')
        depth = parseInt(line.slice(0, pos), 10)

        line = line.slice(pos+1)
        pos = line.indexOf(' ')
        height = parseInt(line.slice(0, pos), 10)

        line = line.slice(pos+1)
        width = parseInt(line, 10)
        break

      } else {
        console.warn(`...unrecognized keyword ${line}, skipping`)
      }
    }
    if (depth === void 0) {
      if (height === void 0 || width === void 0) {
        console.error("error reading header")
      } else {
        console.error("missing dimensions in header")
      }
      return -1
    }

    // read voxel data
    
  })
}
