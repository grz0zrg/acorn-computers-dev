/*
landscape viewer with data generator targeted at Acorn Archimedes ARM hardware

this is not raycasting but simple dots positioned as a grid with weak perspective
dots are then expanded as blocks (16xN) and shaded according to a colormap
dots Y position is modulated by a heightmap

total visible points and total visible points divided by 3 is shown in top left corner,
those parameters are important for the ARM2 landscape code,
total points should be divisible by 3 for it to work on the Archie

there is many parameters to adjust to gain performance / quality

heightmap and colormap needs to be of the same size, ideally power of two

to get correct data the steps is to wait a bit for points to accumulate / stabilize
then do a left click to generate and then do a right click to download
basically just do many left click and download once total points are stable (and divisible by 3)

LEFT CLICK = generate points data
RIGHT CLICK = download points data

note: number of cycles on 1987 ARM2 is about 160000, ~120000 in this tool amount for 50Hz framerate

benchmark for different machines:
 50Hz:
   ~88000 at  8MHz (1987 HW MEMC1A)      <- ok @ ~1104pts 16x8 6x6 steps 6 pitch 2 skip
  ~120000 at  8MHz (1987 HW MEMC1A 8Mhz) <- ok @ ~1100pts 16x11 6x6 steps 6 pitch 2 skip
  ~190000 at 12MHz                       <- ok @ ~2670pts 12x10 3x5 steps 6 pitch 2 skip
  ~270000 at 16MHz                       <- ok @ ~2781pts  8x16 3x4 steps 6 pitch 2 skip
   
 25Hz:
  ~460000 at 16MHz                       <- ok @ ~6582pts 12x12 2x3 steps 6 pitch 2 skip
*/

let heightmap = null
let colormap = null
function preload() {
  heightmap = loadImage('D17.png');
  colormap = loadImage('C17W.png');
}

function setup() {
  createCanvas(320, 256);
  
  heightmap.loadPixels();
  colormap.loadPixels();
  
  pixelDensity(1)
  
  background(255)
}

let vt = []
let points = 0
let binData = []
let twoBanksOverflow = false

let bytePx = 4

// used for specific optimizations (computed automatically)
let backgroundClearStart = Infinity
let backgroundClearEnd = Infinity
let landscapeStart = Infinity
let landscapeEnd = 0

// ===== LANDSCAPE PARAMETERS =====
// = adjusting parameters here affect perfomances / visual (viewer and generator)
// NOTE : should be even most of the time if blockHeightStep > 1 (crash on Archimedes otherwise)
let blockHeight = 11
// NOTE : Archie code was made for up to 16px width blocks (4, 8, 12, 16), going further may cause issues with clipping
let blockWidth = 16
// how much lines we skip (they will get copied)
let blockHeightStep = 2
// =

function draw() {
  noFill()
  noStroke()
  
  rectMode(CORNER)
  
  // sky gradient / clearing the top part
  for (let y = 0; y < height / 2.25; y += 1) {
    let b = 255 * (y / (height / 4))
    fill(b,b,b)
    rect(0, y, width, 1)
  }
  
  fill(255)
  rect(0, backgroundClearStart, width, backgroundClearEnd-backgroundClearStart)
    
  // landscape viewer params
  let my = -64 + frameCount / 4 // landscape scroll Y position (viewer)
  
  // ===== LANDSCAPE PARAMETERS =====
  // = adjusting parameters here affect perfomances / visual (viewer and generator)
  let mx = 0 // landscape scroll X position (viewer and generator)
  // = landscape camera Y position (generator)
  let ly = 0
  
  // adjust for higher height
  let heightFactor = 0.75
  
  // landscape resolution
  let stepx = 6
  let stepy = 5

  // UV scale, can be used to fake higher res, higher fov etc (it is map pixels density basically)
  let su = 1
  let sv = 1
  // 'pitch' factor (higher = closer to the ground)
  let pf = 2
  // how much pixels should the landscape be offseted in Y
  // if you use high pitch factor you may needs to increase this (and dst)
  // so that there is no holes near the bottom of the screen
  let yOffset = 48
  
  // the landscape Z distance (shouldn't be <= 0)
  let dst = height/1.75
  
  // ===== STATS =====
  let culled = 0
  let clipped = 0
  let pointsVisible = 0
  let archieCycles = 0

  // ===== VIEWER / GENERATOR =====
  loadPixels()
  for (let y = 0; y < dst; y += stepy) {
    for (let x = -width; x < width; x += stepx) {
      // colormap/heightmap lookup (this also take care of wraparound)
      let heightmapIndex = (floor((x + width) / stepx / su + mx) % heightmap.width + (floor(heightmap.height + (((y / stepy) / sv - my) % heightmap.height)) % heightmap.height) * heightmap.width) * 4
      let hc = heightmap.pixels[heightmapIndex + 0]
      
      let z = 1//1 - y / (y + height / 2)
      
      // get point colors
      let r = colormap.pixels[heightmapIndex + 0] * z
      let g = colormap.pixels[heightmapIndex + 1] * z
      let b = colormap.pixels[heightmapIndex + 2] * z
      let h = hc * heightFactor // compute height
    
      // center the grid and elevate points (+ do perspective tweaking for things like pitch)
      let xx = width / 2 + x / (height - y) * height
      let yy = height / 2 + y / (height - y) * height / pf - h
      yy += yOffset // landscape vertical offset 
      
      // fix y position to a grid in case of block stepping
      yy = floor(yy / blockHeightStep) * blockHeightStep
      
      if ((xx + yy * width) >= (width * height * 2-width*blockHeight)) twoBanksOverflow = true
      
      // filter points; used to tweak final points count so that total number of points are divisible by 3
      // some points should be left overflowing to avoid gaps on the sides, they will be clamped
      // clipping offset is touchy and may result in a crash if too low (probably due to blockWidth)
      if (xx > -4 && xx < width-bytePx) {
        if (yy > height) {
          culled += 1
        } else {
          pointsVisible += 1
        }
  
        if (yy > height - blockHeight && yy < height) clipped += 1

        //xx = Math.min(xx, width-bytePx)
        
        // for clipping we make the overflowing points fixed to a 4px grid to simplify it
        if (xx >= width-blockWidth) xx = floor(xx / bytePx) * bytePx
        if (xx< 0) xx = floor(xx / bytePx) * bytePx
        
        // this part is the points generator (for Archimedes version)
        // this part accumulate all visible points in a visibility table, this filter out points that will never be visible
        let v = vt[(width + x) + floor(y) * width]
        if (!v) {
          if (yy >= height-1) { // point will never be visible so don't bother
           vt[(width + x) + floor(y) * width] = 0
          } else {
            vt[(width + x) + floor(y) * width] = {
               // compute the screen position, we just want the flat plane (not the elevated one) so also undo the elevation
              xy: floor(Math.max(xx, 0)) + (floor((yy + h) / blockHeightStep) * blockHeightStep) * width,
              // compute U/V for the point (as a maps data address)
              uv: (floor((x + width)/ stepx / su + mx) % heightmap.width + (floor(heightmap.height + (floor(y / stepy / sv + ly)%heightmap.height)) % heightmap.height) * heightmap.width)*8, // 8 because map data is 2 words (height,color), see the associated sketch
              x: xx
            }
          }
        }
        
        if (xx >= 0 && xx < width-12 && blockHeightStep > 1) {
          for (let by = 0; by < blockHeight; by += blockHeightStep) {
            for (let bx = 0; bx < blockWidth; bx += 1) {
              let index = floor(xx + bx + (yy+by) * width)*4
              //rect(xx, yy+b,blockWidth, 1)
              pixels[index+0] = r
              pixels[index+1] = g
              pixels[index+2] = b
            }
          }
        }
        
        backgroundClearStart = min(yy, backgroundClearStart)
        backgroundClearEnd = min(round(yy + h), backgroundClearEnd)
        
        landscapeStart = backgroundClearStart
        landscapeEnd = min(max(yy, landscapeEnd), height-1)
        
        if (blockHeightStep <= 1) {
          fill(r, g, b)
          rectMode(CENTER)
          rect(xx, yy,blockWidth, blockHeight)
        }
      }
    }
  }
  
  if (blockHeightStep > 1) {
    for (let y = 0; y < height; y += blockHeightStep) {
      for (let x = 0; x < width*4; x += 1) {
        for (let bs = 1; bs < blockHeightStep; bs += 1) {
          pixels[x + (y+bs) * width * 4] = pixels[x + y * width * 4]
        }
      }
    }
    updatePixels()
  }
  
  // ===== PRINT STATS =====
  // compute number of cycles on 1987 archimedes (very rough estimate)
  let blockCycles = 9
  if (blockWidth <= 4) blockCycles = 5
  if (blockWidth <= 8) blockCycles = 6.5
  if (blockWidth <= 12) blockCycles = 7.75
  // block cycles
  let blockDrawCycles = (blockCycles * (blockHeight / blockHeightStep) - 1) + (8 * (blockHeight / blockHeightStep) - 4) / 16
  let clipBlockDrawCycles = 6
  // point cycles
  let fullpoint_cycles = 13.5
  if (blockWidth <= 8) fullpoint_cycles += 1
  if (blockWidth <= 12) fullpoint_cycles += 2
  if (blockWidth <= 16) fullpoint_cycles += 3
  let cullpoint_cycles = 16.5
  let clippoint_cycles = 20.5
  if (blockWidth <= 8) clippoint_cycles += 1
  if (blockWidth <= 12) clippoint_cycles += 2
  if (blockWidth <= 16) clippoint_cycles += 3
  archieCycles = pointsVisible * (blockDrawCycles + fullpoint_cycles)
  archieCycles += culled * cullpoint_cycles
  archieCycles += clipped * (blockDrawCycles / 2 + clipBlockDrawCycles + clippoint_cycles)
  // points cycles
  archieCycles += points/3 * 10.5
  
  if (blockHeightStep > 1) {
    let copyLen = 8 * ((landscapeEnd - landscapeStart) / (blockHeightStep-1))
    archieCycles += 16 * copyLen
  }
  
  let backClearCycles = (320 * (backgroundClearEnd - backgroundClearStart)) % 52 * 38.5
  
  archieCycles += backClearCycles
  
  archieCycles = floor(archieCycles)

  fill(255)
  textSize(16)
  textAlign(LEFT)
  text("  total points: " + points, 16, 16)
  if (!Number.isInteger(points/3)) fill(255,0,0)
  text("     points / 3: " + points/3, 16, 32)
  fill(255)
  text("    rects culled: ~" + culled, 4, 48)
  text("  rects clipped: ~" + clipped, 4, 64)
  text("visibles: ~" + pointsVisible, 170, 16)
  text(" cycles: ~" + archieCycles, 170, 48)
  if (twoBanksOverflow) {
    fill(255, 0, 0)
    textAlign(CENTER)
    text("/!\\ Overflow two banks /!\\", width / 2, height / 2)
  }
  
  fill(255)
  textAlign(CENTER)
  //text("Right click to download points data", width / 2, height - 2)

/*
  // debug background clear position / length and landscape copy opti in case of steps
  stroke(255, 0, 0)
  strokeWeight(1)
  line(0, backgroundClearStart, width, backgroundClearStart)
  line(0, backgroundClearEnd, width, backgroundClearEnd)
  stroke(0, 255, 0)
  strokeWeight(1)
  line(0, landscapeStart, width, landscapeStart)
  line(0, landscapeEnd, width, landscapeEnd)
  noStroke()
*/
}

let pointsClip = []

// generate / download Archimedes points data on click
function mouseReleased() {
  // generate points data (interleaved x/y/u/v + 4-bit clipping word)
  if (mouseButton === LEFT) {
    binData = []
    pointsClip = []
    points = 0

    let xStack = []
    for (let i = 0; i < vt.length; i += 1) {
      if (vt[i]) {
        points += 1
        binData.push(vt[i].xy)
        binData.push(vt[i].uv)
        xStack.push(vt[i].x)
        
        if (points % 3 === 0) {
          // clipping left & right (4-bit value which indicate which block width to use)
          let nBlocks1 = 4 - blockWidth / 4
          let nBlocks2 = 4 - blockWidth / 4
          let nBlocks3 = 4 - blockWidth / 4
          if (xStack[0] < 0) {
            nBlocks1 = 4 - min(floor((xStack[0] + blockWidth) / bytePx), 3)
          }
          if (xStack[1] < 0) {
            nBlocks2 = 4 - min(floor((xStack[1] + blockWidth) / bytePx), 3)
          }
          if (xStack[2] < 0) {
            nBlocks3 = 4 - min(floor((xStack[2] + blockWidth) / bytePx), 3)
          }
          if (xStack[0] > width-blockWidth) {
            nBlocks1 = 4 - min(floor((xStack[0] + blockWidth) % width / bytePx), 3)
          }
          if (xStack[1] > width-blockWidth) {
            nBlocks2 = 4 - min(floor((xStack[1] + blockWidth) % width / bytePx), 3)
          }
          if (xStack[2] > width-blockWidth) {
            nBlocks3 = 4 - min(floor((xStack[2] + blockWidth) % width / bytePx), 3)
          }
          
          //let nBlocks = nBlocks1 | (nBlocks2 << 2) | (nBlocks3 << 4)
          //binData.push(nBlocks)
          
          pointsClip.push(nBlocks1)
          pointsClip.push(nBlocks2)
          pointsClip.push(nBlocks3)

          xStack = []
        }
      }
    }
  }

  if (mouseButton === RIGHT && Number.isInteger(points / 3) && points > 0) {
    let mapConfigStr = ""
    mapConfigStr+='REM src.landConf (generated points clip data and config)\n'
    mapConfigStr+='DEF PROCinitializeLandConf\n'
    mapConfigStr+='landConfBlockHeight%=' + blockHeight + '\n'
    mapConfigStr+='landConfBlockStep%=' + blockHeightStep + '\n'
    mapConfigStr+='landConfPoints%=' + points + '\n'
    mapConfigStr+='landConfBackClearStart%=' + (backgroundClearStart-2) + '\n'
    mapConfigStr+='landConfBackClearLen%=' + (backgroundClearEnd - backgroundClearStart) + '\n'
    mapConfigStr+='landConfStart%=' + landscapeStart + '\n'
    mapConfigStr+='landConfLen%=' + (landscapeEnd - landscapeStart+1) + '\n'
    mapConfigStr+='landConfMapWidth%=' + colormap.width + '\n'
    mapConfigStr+='landConfMapHeight%=' + colormap.height + '\n'
    mapConfigStr+='landConfMapDataSize%=' + 8 + '\n'
    mapConfigStr+='ENDPROC\n'
    mapConfigStr+='DEF PROCinitializeClipData\n'
    mapConfigStr+='IF bassPass% = bassAsmOptSecondPass% THEN\n'
    mapConfigStr+='ENDPROC\n'
    mapConfigStr+='ENDIF\n'
    mapConfigStr+='DIM clipData%(' + pointsClip.length + ')\n'
    for (let i = 0; i < pointsClip.length; i += 1) {
      if (pointsClip[i]) {
        mapConfigStr+='clipData%(' + i + ') = '+ pointsClip[i] + '\n'
      }
    }
    mapConfigStr+='ENDPROC\n'
    
    // download stuff
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
    link.download = 'points,ffd';

    link.click();  
    
    const mapConfigBlob = new Blob( Array.from(mapConfigStr), { type: "application/octet-stream" } );	
    const mapConfigObjectURL = URL.createObjectURL( blob );

    link.href = mapConfigObjectURL;
    link.href = URL.createObjectURL( mapConfigBlob );
    link.download = 'landConf,ffb';
    link.click();
  } else if (mouseButton === RIGHT) {
    if (!Number.isInteger(points / 3)) {
      console.log('Warning: points / 3 is not an integer (total points should be divisible by 3)');
    }
    
    if (points <= 0) {
      console.log('Warning: Must generate accumulated points data with a left click');
    }
  }
}


