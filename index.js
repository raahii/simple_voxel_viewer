var THREE = require('three');
// var fs = window.require('fs');
var fs = require('browserify-fs');
var OrbitControls = require('three-orbit-controls')(THREE);
var $ = require("jquery");

var renderer, scene, camera, grid, voxel=[];
var grid_size = 128; var cube_size = 10;
var origin = {
  x: -0.5*cube_size*(grid_size-1),
  y: -cube_size*grid_size / 2,
  z: -0.5*cube_size*(grid_size-1),
};
var reader = new FileReader();

function read_binvox(array_buffer) {
  buf = Buffer.from(array_buffer, 'hex')
  
  // read header
  var lines = [], line='', c=0;
  while (line != 'data') {
    var pos = buf.indexOf('\n');
    line = buf.toString('utf-8', 0, pos);
    lines.push(line);
    buf = buf.slice(pos+1);
    if (c++ > 1000) return -1;
  }
  
  console.log("...reading binvox version: ");
  var line = lines[0].slice(0, 7);
  if (line != '#binvox') {
    console.error(`Error: first line reads ${line} instead of #binvox`);
    return -1;
  }
  var version = parseInt(lines[0].slice(8), 10);
  console.log(version)
  
  console.log('...reading depth(x), width(z), height(y) : ');
  var depth, height, width;
  for(var i=1; i<lines.length-1; i++) {
    line = lines[i];
    if (line.slice(0, line.indexOf(' ')) == 'dim') {
      line = line.slice(line.indexOf(' ')+1);
      var pos = line.indexOf(' ');
      depth = parseInt(line.slice(0, pos), 10);

      line = line.slice(pos+1);
      pos = line.indexOf(' ');
      height = parseInt(line.slice(0, pos), 10);

      line = line.slice(pos+1);
      width = parseInt(line, 10);
      break;

    } else {
      console.warn(`...unrecognized keyword ${line}, skipping`);
    }
  }
  if (depth === void 0) {
    if (height === void 0 || width === void 0) {
      console.error("error reading header");
    } else {
      console.error("missing dimensions in header");
    }
    return -1;
  }
  // should be depth === width === height
  console.log(`(${depth}, ${width}, ${height})`);
  
  // read voxel data
  data = [];
  for ( var i=0; i<buf.byteLength/2; i++) {
    value = buf.readUInt8(2*i) == 1;
    data.push(value);
  }
  console.log(data);

  // reshape to voxel
  voxel = [];
  for (var i=0; i<width; i++){
    voxel.push([]);
    for (var j=0; j<depth; j++){
      voxel[i].push([]);
      for (var k=0; k<height; k++){
        var v = data.shift();
        if (v === void 0) {
          voxel[i][j].push(false);
        } else {
          voxel[i][j].push(v);
        }
      }
    }
  }

  return new Promise(function(resolve, reject) {
    resolve();
  });
}

function plot_cube(x, y, z) {
  var g = new THREE.BoxGeometry(cube_size, cube_size, cube_size);
  var m = new THREE.MeshPhongMaterial({color: 0x65C87A});
  var box = new THREE.Mesh(g, m);
  _x = origin.x + cube_size * x;
  _y = origin.y + cube_size * y;
  _z = origin.z + cube_size * z;
  box.position.set(_x, _y, _z);
  scene.add(box);
}

function plot_voxel() {
  console.log(voxel);
  for (var i=0; i<grid_size; i++){
    for (var j=0; j<grid_size; j++){
      for (var k=0; k<grid_size; k++){
        if (voxel[i][j][k] == true) {
          plot_cube(i, k, j);
        }
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function handleDragOver(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect='copy';
  $('#drop_zone').css('background', 'rgb(232, 232, 232)')
}

function handleDragLeave(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect='copy';
  $('#drop_zone').css('background', 'rgb(255,255,255)')
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  var files = evt.dataTransfer.files; // FileList object.

  var output = [];
  for (var i = 0, f; f = files[i]; i++) {
    output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
                f.size, ' bytes, last modified: ',
                f.lastModifiedDate.toLocaleDateString(), '</li>');
  }

  $('#list').html('<ul>' + output.join('') + '</ul>');
  
  var ext = files[0].name.split('.').pop()
  if (ext == 'binvox') {
    // reader.readAsBinaryString(files[0]);
    reader.readAsArrayBuffer(files[0]);
  }
}
function fileLoad() {
  read_binvox(reader.result).then(function() {
    plot_voxel();
  });
}

function init() {
  // レンダラー
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias:true});
  var width  = $('.container').width();
  var height = $('.container').height();
  renderer.setSize(width, height);
  renderer.setClearColor( new THREE.Color(0xffffff),0.0);
  $('.container').append(renderer.domElement);

  // シーン
  scene = new THREE.Scene();

  // カメラ
  camera = new THREE.PerspectiveCamera( 40, width / height, 1, 10000 );
  camera.position.set(700, 1200, 1000);
  controls = new OrbitControls(camera);

  // 光源
  var ambientLight = new THREE.AmbientLight( 0x606060 );
  scene.add( ambientLight );
  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  // グリッド
  grid = new THREE.GridHelper(grid_size*cube_size, grid_size);
  grid.position.set( 0, -grid_size*cube_size/2, 0 );
  grid.material.color = new THREE.Color(0x000000);
  grid.material.opacity= 0.2;
  scene.add(grid);

  var dropZone = document.getElementById('drop_zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('dragleave', handleDragLeave, false);
  dropZone.addEventListener('drop', handleFileSelect, false);
  reader.addEventListener('load', fileLoad, false);
  
  // 初回実行
  animate();
}

init();
