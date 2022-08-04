/*
 landscape maps data generator targeted at Acorn Archimedes ARM2 8mhz hardware (256 colors mode)
 let you download a precomputed binary containing heightmap/colormap data interleaved (colormap is 256 colors palette index and is 1 word)

 WARNING: the colormap and heightmap should be of the same size
 note : colormap should have matching colors 
        so already converted to the palette format
        can be done easily in Gimp (Image -> Mode -> indexed)
        but must have the suitable Acorn palette imported
*/

// ===== PARAMETERS =====
// adjust landscape height value here
// must match the one in points generator for same result as viewer
let heightFactor = 0.75
// adjust if using another screen mode
let screenWidth = 320
// must match blockHeightStep of the points generator for same result as viewer
let blockHeightStep = 2
// ======================

let heightmap = null
let colormap = null
function preload() {
  heightmap = loadImage('D17.png')
  colormap = loadImage('C17W.png')
}

// palette data was exported from The Gimp
let acornPalette = [[  0,  0,  0],
	[ 16, 18, 15],
	[ 33, 35, 32],
	[ 50, 51, 49],
	[ 68,  1,  2],
	[ 84, 17, 15],
	[102, 34, 34],
	[119, 50, 53],
	[  0,  0, 68],
	[ 15, 17, 88],
	[ 36, 33,101],
	[ 49, 51,120],
	[ 68,  0, 69],
	[ 85, 18, 85],
	[102, 36,101],
	[118, 51,117],
	[137,  0,  0],
	[154, 11, 18],
	[170, 33, 34],
	[186, 51, 52],
	[205,  0,  0],
	[223, 14, 13],
	[240, 28, 33],
	[255, 50, 50],
	[138,  0, 69],
	[155,  9, 86],
	[169, 34,103],
	[190, 47,118],
	[203,  4, 70],
	[223,  0, 85],
	[238, 36,102],
	[255, 48,119],
	[  0, 68,  2],
	[  9, 85, 19],
	[ 32,102, 35],
	[ 51,119, 50],
	[ 66, 68,  0],
	[ 85, 86, 17],
	[101,102, 34],
	[119,119, 51],
	[  6, 67, 67],
	[ 15, 85, 83],
	[ 37,102,100],
	[ 51,119,122],
	[ 67, 69, 66],
	[ 83, 85, 83],
	[100,102,100],
	[118,120,117],
	[137, 67,  3],
	[152, 85, 10],
	[171,101, 30],
	[186,119, 46],
	[206, 66,  0],
	[223, 82, 13],
	[238,102, 31],
	[255,118, 47],
	[137, 66, 67],
	[152, 85, 83],
	[169,102,104],
	[188,119,121],
	[204, 68, 65],
	[222, 85, 84],
	[239,101,104],
	[255,117,118],
	[  0,136,  0],
	[  0,153, 16],
	[ 21,171, 27],
	[ 51,187, 46],
	[ 63,137,  0],
	[ 82,153, 12],
	[100,170, 25],
	[117,187, 46],
	[  0,136, 68],
	[  6,154, 83],
	[ 34,170,104],
	[ 40,187,118],
	[ 69,136, 66],
	[ 86,153, 82],
	[101,170,104],
	[117,188,120],
	[136,136,  0],
	[154,153, 10],
	[171,169, 37],
	[185,188, 46],
	[207,135,  0],
	[221,153,  3],
	[240,170, 35],
	[254,188, 43],
	[137,136, 67],
	[154,153, 83],
	[172,170, 99],
	[187,186,120],
	[203,136, 68],
	[222,152, 84],
	[241,169,100],
	[254,187,115],
	[  0,205,  0],
	[  0,221,  8],
	[ 17,238, 20],
	[ 29,255, 46],
	[ 69,204,  0],
	[ 78,222, 21],
	[100,239, 33],
	[120,255, 42],
	[  0,205, 68],
	[  0,222, 83],
	[ 42,238, 98],
	[ 39,255,120],
	[ 72,204, 63],
	[ 77,222, 87],
	[ 97,239,103],
	[115,255,118],
	[132,205,  0],
	[150,221,  0],
	[167,238, 36],
	[185,255, 46],
	[204,204,  6],
	[223,220,  0],
	[235,238, 34],
	[254,255, 45],
	[135,205, 65],
	[151,221, 81],
	[168,238, 97],
	[185,255,114],
	[203,205, 65],
	[220,221, 82],
	[237,238, 98],
	[255,255,114],
	[  0,  2,140],
	[ 21, 14,153],
	[ 38, 33,170],
	[ 53, 51,187],
	[ 70,  0,137],
	[ 85, 17,152],
	[101, 35,168],
	[119, 52,185],
	[  0,  1,204],
	[  7, 20,222],
	[ 24, 34,240],
	[ 45, 53,255],
	[ 67,  1,206],
	[ 83, 14,225],
	[101, 33,240],
	[118, 50,255],
	[138,  0,135],
	[155, 11,154],
	[168, 36,173],
	[188, 49,188],
	[206,  0,135],
	[223,  9,153],
	[239, 27,170],
	[255, 44,189],
	[136,  0,205],
	[156, 10,220],
	[172, 27,240],
	[188, 50,255],
	[205,  0,207],
	[223, 10,221],
	[238, 29,239],
	[255, 45,254],
	[ 13, 68,136],
	[ 27, 85,153],
	[ 37,101,170],
	[ 48,119,188],
	[ 68, 68,139],
	[ 85, 86,152],
	[102,102,170],
	[119,118,189],
	[ 12, 68,203],
	[ 32, 84,220],
	[ 29,103,238],
	[ 44,119,255],
	[ 66, 68,205],
	[ 79, 86,224],
	[105,101,236],
	[117,119,255],
	[136, 68,134],
	[154, 85,151],
	[172,101,169],
	[189,118,186],
	[205, 65,137],
	[223, 82,152],
	[241, 99,168],
	[253,120,189],
	[136, 68,203],
	[154, 84,221],
	[172,100,239],
	[185,120,255],
	[205, 68,205],
	[221, 84,220],
	[239,101,237],
	[255,118,254],
	[  0,137,134],
	[  9,153,155],
	[ 19,171,172],
	[ 51,187,188],
	[ 68,135,138],
	[ 86,153,155],
	[103,170,172],
	[119,187,189],
	[  0,136,202],
	[ 13,153,219],
	[ 24,170,236],
	[ 58,186,253],
	[ 69,135,206],
	[ 79,154,225],
	[104,169,236],
	[122,186,254],
	[135,137,134],
	[151,153,150],
	[169,171,168],
	[185,187,184],
	[206,135,137],
	[220,154,153],
	[237,170,169],
	[255,187,186],
	[137,135,207],
	[151,153,219],
	[168,170,237],
	[185,187,255],
	[202,137,204],
	[220,153,221],
	[238,170,239],
	[255,187,255],
	[  0,205,138],
	[  0,222,153],
	[ 42,238,167],
	[ 31,255,188],
	[ 65,205,134],
	[ 85,222,150],
	[ 99,239,172],
	[116,255,187],
	[ 43,204,203],
	[  0,222,224],
	[  0,239,240],
	[ 52,255,255],
	[ 43,204,203],
	[ 79,221,221],
	[ 99,238,237],
	[118,255,254],
	[133,204,135],
	[150,222,152],
	[167,239,168],
	[190,254,184],
	[204,204,137],
	[222,221,153],
	[239,238,169],
	[255,255,185],
	[136,204,206],
	[153,221,223],
	[169,237,240],
	[187,255,255],
	[202,204,201],
	[220,222,219],
	[236,239,235],
	[253,255,252]]

let binData = []

let failed = false

function setup() {
  createCanvas(512, 512)
  
  image(heightmap, 0, 0)
  
  heightmap.loadPixels()
  colormap.loadPixels()
  for (let y = 0; y < heightmap.height; y += 1) {
    for (let x = 0; x < heightmap.width; x += 1) {
      let cmap_index = (x + y * heightmap.width) * 4
  
      let r = colormap.pixels[cmap_index + 0]
      let g = colormap.pixels[cmap_index + 1]
      let b = colormap.pixels[cmap_index + 2]
      
      let c1 = null
      for (let c = 0; c < acornPalette.length; c += 1) {
        if (acornPalette[c][0] === r && acornPalette[c][1] === g && acornPalette[c][2] === b) {
          c1 = c
          break
        }
      }
      
      if (c1 === null) {
        failed = true
        console.log('aborting: color do not match Archimedes palette at ' + x + ',' + y)
        break
      }
      
      c1 = (c1 | (c1 << 8))
      c1 = (c1 | (c1 << 16))
      let h = heightmap.pixels[x * 4 + y * heightmap.width * 4]
      h = round(h*heightFactor)
      h = floor(h/blockHeightStep)*blockHeightStep
      
      binData.push(h*screenWidth)
      binData.push(c1);
      //binData.push(c1);
      //binData.push(c1);
      //binData.push(c1);
    }
        
    if (failed) break
  }
    
  if (!failed && heightmap.pixels.length && colormap.pixels.length) {
    const buffer = new ArrayBuffer(binData.length * 4);
    const vue32 = new Int32Array(buffer);
    vue32.set(binData);

    const link = document.createElement( 'a' );
    link.style.display = 'none';
    document.body.appendChild( link );


    const blob = new Blob( [ buffer ], { type: "application/octet-stream" } );	
    const objectURL = URL.createObjectURL( blob );

    link.href = objectURL;
    link.href = URL.createObjectURL( blob );
    link.download = 'map,ffd';
    link.click();
  }
}

function draw() {

}
