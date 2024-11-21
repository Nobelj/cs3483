let video;
let handPose;
let hands = [];
let bodyPose;
let bodies = [];
let img;
let mode = "normal"; // normal, view, zoom, persons
let blurredImg;
let indexFinger = { x: 0, y: 0 };
let thumb = { x: 0, y: 0 };
let viewRadius = 100;
let zoomFactor = 1;
function preload() {
  img = loadImage("people.jpg");
  handPose = ml5.handPose();
  bodyPose = ml5.bodyPose();
}

function setup() {
  createCanvas(1280, 480);
  img.resize(0, height);
  img = img.get(0, 0, width / 2, height);
  // Setup video
  video = createCapture(VIDEO);
  video.size(width / 2, height);
  video.hide();

  // Setup handpose
  handPose.detectStart(video, gotHands);

  // Setup bodyPose
  bodyPose.detectStart(img, gotBodies);

  // Create blurred version of the image
  blurredImg = createGraphics(width / 2, height);
  blurredImg.image(img, 0, 0, width / 2, height);
  blurredImg.filter(BLUR, 10);
}

function gotHands(results) {
  hands = results;
}

function gotBodies(results) {
  // Save the output to the bodies variable
  bodies = results;
}

function modelReady() {
  console.log("Model Ready!");
}

function draw() {
  background(0);

  // Draw image on the right side
  if (mode == "view") {
    image(blurredImg, width / 2, 0, width / 2, height);
  } else {
    image(img, width / 2, 0, width / 2, height);
  }

  // Draw hand keypoints
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    indexFinger["x"] = lerp(indexFinger["x"], hand.keypoints[8].x, 0.3);
    indexFinger["y"] = lerp(indexFinger["y"], hand.keypoints[8].y, 0.3);
    thumb["x"] = lerp(thumb["x"], hand.keypoints[4].x, 0.3);
    thumb["y"] = lerp(thumb["y"], hand.keypoints[4].y, 0.3);

    // Handle different modes
    switch (mode) {
      case "view":
        handleViewMode(indexFinger);
        break;
      case "zoom":
        handleZoomMode(indexFinger, thumb);
        break;
      case "persons":
        handlePersonsMode(indexFinger);
        break;
      case "normal":
        break;
    }
  }
  // Draw video on the left side
  image(video, 0, 0, width / 2, height);
  // Draw circle on video
  fill(255, 255, 255);
  noStroke();
  circle(indexFinger["x"], indexFinger["y"], 10);
  circle(
    map(indexFinger["x"], 0, width / 2, width / 2, width),
    indexFinger["y"],
    10
  );
  if (mode == "zoom") {
    fill(100, 100, 100);
    circle(thumb["x"], thumb["y"], 10);
    circle(map(thumb["x"], 0, width / 2, width / 2, width), thumb["y"], 10);
  }
}

function handleViewMode(indexFinger) {
  // Draw clear circle around finger position
  let x = map(indexFinger["x"], 0, width / 2, width / 2, width);
  let y = indexFinger["y"];
  fill(255, 0, 0);
  circle(x, y, 10);
  image(img, width / 2, 0, width / 2, height);
  let clearRegion = get(width / 2, 0, width / 2, height);
  // Create mask
  let mask = createGraphics(width / 2, height);
  mask.fill(255);
  mask.noStroke();
  mask.circle(x - width / 2, y, viewRadius);
  clearRegion.mask(mask);
  image(blurredImg, width / 2, 0, width / 2, height);
  image(clearRegion, width / 2, 0);
}

function handleZoomMode(indexFinger, thumb) {
  let d = dist(indexFinger["x"], indexFinger["y"], thumb["x"], thumb["y"]);
  zoomFactor = lerp(zoomFactor, map(max(40, d), 40, 300, 1, 10), 0.3);
  let midX = (indexFinger["x"] + thumb["x"]) / 2;
  let midY = (indexFinger["y"] + thumb["y"]) / 2;
  resizedImg = img.get(0, 0, width / 2, height);
  resizedImg.resize((zoomFactor * width) / 2, 0);
  image(
    resizedImg,
    width / 2 - midX * (zoomFactor - 1),
    -midY * (zoomFactor - 1)
  );
}

function handlePersonsMode(indexFinger) {
  let x = indexFinger["x"];
  let y = indexFinger["y"];
  fill(255, 0, 0);
  circle(x, y, 10);
  console.log(bodies);
  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    if (
      x >= body.box.xMin &&
      x <= body.box.xMax &&
      y >= body.box.yMin &&
      y <= body.box.yMax
    ) {
      // Highlight person
      let personWidth = body.box.xMax - body.box.xMin;
      let personHeight = body.box.yMax - body.box.yMin;
      let scaleFactor = 1.2;
      image(
        img,
        body.box.xMin + width / 2 - (personWidth * (scaleFactor - 1)) / 2,
        body.box.yMin - (personHeight * (scaleFactor - 1)) / 2,
        personWidth * scaleFactor,
        personHeight * scaleFactor,
        body.box.xMin,
        body.box.yMin,
        personWidth,
        personHeight
      );
    }
  }
}

function keyPressed() {
  switch (key) {
    case "v":
      mode = "view";
      break;
    case "z":
      mode = "zoom";
      break;
    case "p":
      mode = "persons";
      break;
    case "e":
      mode = "normal";
      break;
  }
}
