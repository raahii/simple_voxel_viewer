var THREE = require('three');
// var fs = window.require('fs');
var fs = require('browserify-fs');
var OrbitControls = require('three-orbit-controls')(THREE);
var $ = require("jquery");

var renderer, scene, camera, grid, voxel=[];
var voxel_mesh, voxel_geo, voxel_mat;
var grid_size = 128; var cube_size = 10;
var origin = {
  x: -0.5*cube_size*(grid_size-1),
  y: -cube_size / 2,
  z: -0.5*cube_size*(grid_size-1),
};
var reader = new FileReader();

//
// read voxel data
//
function read_binvox(array_buffer) {
  buf = Buffer.from(array_buffer, 'hex')
  array_buffer = null;
  
  // read header
  var lines = [], line='', c=0;
  while (line != 'data') {
    var pos = buf.indexOf('\n');
    if (c++ > 1000 || pos === -1) return Promise.reject("error reading header");
    line = buf.toString('utf-8', 0, pos);
    lines.push(line);
    buf = buf.slice(pos+1);
  }

  
  var line = lines[0].slice(0, 7);
  if (line != '#binvox') {
    return Promise.reject(`first line reads ${line} instead of #binvox`)
  }
  var version = parseInt(lines[0].slice(8), 10);
  console.log("binvox version: " + version);
  
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
      return Promise.reject(`unrecognized keyword ${line}, skipping`)
    }
  }
  if (depth === void 0) {
    if (height === void 0 || width === void 0) {
      return Promise.reject("error reading header");
    } else {
      return Promise.reject("missing dimensions in header");
    }
    return -1;
  }
  
  // should be depth === width === height
  console.log('size: '+`(${depth}, ${width}, ${height})`);
  $('#list > .alert').append(`(${depth}, ${width}, ${height})`);

  // read voxel data
  voxel = [];
  var idx = 0;
  var i=0, j=0, k=0;
  var gs = grid_size;
  for ( var c=0; c<buf.byteLength/2; c++) {
    var value = buf.readUInt8(2*c);
    var count = buf.readUInt8(2*c+1);
    if (value == 1) {
      for ( var _=0; _<count; _++) {
        i = Math.floor(idx/(gs*gs))
        j = Math.floor((idx - i*gs*gs)/gs)
        k = idx - i*gs*gs - j*gs
        voxel.push([i, k, j]);
        idx++;
      }
    } else {
      idx += count;
    }
  }
  buf = null;

  return Promise.resolve();
}

function fileLoad() { 
  read_binvox(reader.result).then(() => {
    plot_voxel();
  }).catch((err) => {
    $('#list > .alert').remove();
    $('#list').append(
      `<div class="alert alert-danger" role="alert"> <strong>Error</strong>: ${err}</div>`
    )
  });
}

//
// plotting functions
//
function plot_voxel() {
  voxel_geo = new THREE.Geometry;
  var mesh_item = new THREE.Mesh(new THREE.BoxGeometry(cube_size, cube_size, cube_size));

  console.time('loading time');
  for (var i=0; i<voxel.length; i++) {
    var norm_x = origin.x + cube_size * voxel[i][0];
    var norm_y = origin.y + cube_size * voxel[i][1];
    var norm_z = origin.z + cube_size * voxel[i][2];
    mesh_item.position.set(norm_x, norm_y, norm_z);
    voxel_geo.mergeMesh(mesh_item);
  }

  voxel_mat = new THREE.MeshPhongMaterial({color: 0x65C87A});
  voxel_mesh = new THREE.Mesh(voxel_geo, voxel_mat);
  scene.add(voxel_mesh)
  console.timeEnd('loading time');

  mesh_item = null;
  voxel = null;
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

//
// Event Listener
//
function handleDragLeave(evt) {
  evt.stopPropagation();
  evt.preventDefault();
  evt.dataTransfer.dropEffect='copy';
  $('#drop_zone').css('background', 'rgb(255,255,255)')
}

function handleFileSelect(evt) {
  evt.stopPropagation();
  evt.preventDefault();

  if ( voxel_mesh ) {
    scene.remove( voxel_mesh );
    voxel_geo.dispose();
    voxel_mat.dispose();
    console.log('removed!')
  }
  
  var files = evt.dataTransfer.files; // FileList object.
  var output = [];

  $('#list > .alert').remove();
  for (var i = 0, f; f = files[i]; i++) {
    output.push(`<div class="alert alert-success" role="alert"> <strong>${f.name}</strong>: </div>`)
  }

  $('#list').append(output.join(''));
  
  var ext = files[0].name.split('.').pop()
  if (ext == 'binvox') {
    // fileLoad() will be called after read file
    // reader.readAsBinaryString(files[0]);
    reader.readAsArrayBuffer(files[0]);
  }
}

//
// Init function
//
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
  camera.position.set(-2000, 700, 2000);
  controls = new OrbitControls(camera);

  // 光源
  var ambientLight = new THREE.AmbientLight( 0x606060 );
  scene.add( ambientLight );
  var directionalLight = new THREE.DirectionalLight( 0xffffff );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  // グリッド
  grid = new THREE.GridHelper(grid_size*cube_size, grid_size);
  grid.position.set( 0, -cube_size/2, 0 );
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
