	//This boid flocking simulation game was written by Andrew Laskey
	//The original javascript boid implementation is based on this: http://jsdo.it/tholman/eVUR
	//Upon this I have added the boid display, added predators and predator behavior, boid death, predator mitosis, mouse input, spawn locations, and kill locations
	
	//For mouse position
	function getMousePos(canvas, evt){
		// get canvas position
		var obj = canvas;
		var top = 0;
		var left = 0;
		while (obj && obj.tagName != 'BODY') {
			top += obj.offsetTop;
			left += obj.offsetLeft;
			obj = obj.offsetParent;
		}
	 
		// return relative mouse position
		var mouseX = evt.clientX - left + window.pageXOffset;
		var mouseY = evt.clientY - top + window.pageYOffset;
		return {
			x: mouseX,
			y: mouseY
		};
	}
	
	var width = 1200;
	var height = 600;
	
	var speed = 6;
	var size = 5;
	var boids = [];
	var totalBoids = 300;
	
	var predSize = 6;
	var predSpeed = 4;
	var mitosis = 10;
	var startRed = 230;
	var predators = [];
	var totalPred = 4;
	
	var boidDeaths = [];
	var explodeRad = 12;
	
	var spawnPoints = [];
	var spawnFreq = 5;
	var spawnLife = 300;
	
	var killHole = [];
	var killFreq = 2;
	var killLife = 225;
	
	var windowxy; 
	var mousePos;
		
	
	var init = function(){
	
		//init canvas
		a_can = document.getElementById("a");
		a_con = a_can.getContext("2d");
		a_can.style.border = "black 1px solid";
		a_con.globalCompositeOperation = "darker";
		
		a_can.addEventListener('mousemove', function(evt)
		{
			mousePos = getMousePos(a_can, evt);
		});
		
		//initialize all the boids---------------------
		for (var i = 0; i < totalBoids; i++) {
		
			boids.push({
				x: Math.random() * width,
				y: Math.random() * height,
				v: {
					x: Math.random() * 2 - 1,
					y: Math.random() * 2 - 1
				},
				c: Math.floor(Math.random() * 253 + 2) + ',' + Math.floor(Math.random() * 253 + 2) + ',' + Math.floor(Math.random() * 253 + 2)
			});
		}
		//---------------------------------------------
		
		//initialize all the predators-----------------
		for (var i = 0; i < totalPred; i++) {
		
			predators.push({
				x: Math.random() * width,
				y: Math.random() * height,
				v: {
					x: Math.random() * 2 - 1,
					y: Math.random() * 2 - 1
				},
				r: startRed,
				c: startRed + ',25,29',
				m: 0
			});
		}
		//---------------------------------------------
		
		//run the simulation---------------------------
		setInterval(update, 40);
		//---------------------------------------------
	}
	
	var calculateDistance = function(v1, v2){
		x = Math.abs(v1.x - v2.x);
		y = Math.abs(v1.y - v2.y);
		
		return Math.sqrt((x * x) + (y * y));
	}
	
	var checkWallCollisions = function(animal, index){
		//each side of the screen becomes an object that to be avoided factored into the birds movement
		wallLeft = {
			x: 0,
			y: animal.y
		};
		wallTop = {
			x: animal.x,
			y: 0
		};
		wallRight = {
			x: width,
			y: animal.y
		};
		wallBottom = {
			x: animal.x,
			y: height
		};
		wallAvoid = {
			x: 0,
			y: 0
		};
		
		if (calculateDistance(wallLeft, animal) < 20) {
						wallAvoid.x -= (wallLeft.x - animal.x);
						wallAvoid.y -= (wallLeft.y - animal.y);
		}
		if (calculateDistance(wallTop, animal) < 20) {
						wallAvoid.x -= (wallTop.x - animal.x);
						wallAvoid.y -= (wallTop.y - animal.y);
		}
		if (calculateDistance(wallRight, animal) < 20) {
						wallAvoid.x -= (wallRight.x - animal.x);
						wallAvoid.y -= (wallRight.y - animal.y);
		}
		if (calculateDistance(wallBottom, animal) < 20) {
						wallAvoid.x -= (wallBottom.x - animal.x);
						wallAvoid.y -= (wallBottom.y - animal.y);
		}
		animal.v = addForce(animal, wallAvoid);
		
		return animal.v
	}
	
	var addForce = function(animal, force){
	
		animal.v.x += force.x;
		animal.v.y += force.y;
		
		magnitude = calculateDistance({
			x: 0,
			y: 0
		}, {
			x: animal.v.x,
			y: animal.v.y
		});
		
		animal.v.x = animal.v.x / magnitude;
		animal.v.y = animal.v.y / magnitude;
		
		return v = {x: animal.v.x, y: animal.v.y}
	}
	
	//BOID FUNCTIONS+++++++++++++++++++++++++++++
	var applyForces = function(index){
		percievedCenter = {
			x: 0,
			y: 0
		};
		flockCenter = {
			x: 0,
			y: 0
		};
		percievedVelocity = {
			x: 0,
			y: 0
		};
		mousePredator = {
			x: 0,
			y: 0
		};
		count = 0;
		for (var i = 0; i < boids.length; i++) {
			if (i != index) {
			
				//Allignment
				dist = calculateDistance(boids[index], boids[i]);
				
				//console.log(dist);
				if (dist > 0 && dist < 50) {
					count++;
					
					//Alignment
					percievedCenter.x += boids[i].x;
					percievedCenter.y += boids[i].y;
					
					//Cohesion
					percievedVelocity.x += boids[i].v.x;
					percievedVelocity.y += boids[i].v.y;
					//Seperation
					if (calculateDistance(boids[i], boids[index]) < 12) {
						flockCenter.x -= (boids[i].x - boids[index].x);
						flockCenter.y -= (boids[i].y - boids[index].y);
					}
				}
			}
		}
		if (count > 0) {
			percievedCenter.x = percievedCenter.x / count;
			percievedCenter.y = percievedCenter.y / count;
			
			percievedCenter.x = (percievedCenter.x - boids[index].x) / 150;
			percievedCenter.y = (percievedCenter.y - boids[index].y) / 150;
			
			percievedVelocity.x = percievedVelocity.x / count;
			percievedVelocity.y = percievedVelocity.y / count;
			
			flockCenter.x /= count;
			flockCenter.y /= count;
		}
		
		//avoid the mouse predator
		if (calculateDistance(mousePos, boids[index]) < 60) {
			mousePredator.x -= (mousePos.x - boids[index].x);
			mousePredator.y -= (mousePos.y - boids[index].y);
		}
		
		boids[index].v = addForce(boids[index], percievedCenter);
		boids[index].v = addForce(boids[index], percievedVelocity);
		boids[index].v = addForce(boids[index], flockCenter);
		avoidPredators(index);
		boids[index].v = addForce(boids[index], mousePredator);
	}
	
	var avoidPredators = function(index) {
		closePredator = {
			x: 0,
			y: 0
		};
		count = 0;
		for (var i = 0; i < predators.length; i++) {
			if (calculateDistance(predators[i], boids[index]) < 60) {
				count++;
				closePredator.x -= (predators[i].x - boids[index].x);
				closePredator.y -= (predators[i].y - boids[index].y);
			}//close if
			
			
		}//end for loop
		
		if (count > 0) {
			closePredator.x /= count;
			closePredator.y /= count;
			
			boids[index].v = addForce(boids[index], closePredator);
		}
	}
	//END BOID FUNCTIONS+++++++++++++++++++++++++++++
	
	//PREDATOR FUNCTIONS+++++++++++++++++++++++++++++++++
	var predatorForces = function(index) {
		percievedCenter = {
			x: 0,
			y: 0
		};
		flockCenter = {
			x: 0,
			y: 0
		};
		percievedVelocity = {
			x: 0,
			y: 0
		};
		mousePredator = {
			x: 0,
			y: 0
		};
		count = 0;
		active = 0;
		for (var i = 0; i < predators.length; i++) {
			if (i != index) {
			
				//Allignment
				dist = calculateDistance(predators[index], predators[i]);
				
				//console.log(dist);
				if (dist > 0 && dist < 50) {
					count++;
					
					//Alignment
					percievedCenter.x += predators[i].x;
					percievedCenter.y += predators[i].y;
					
					//Cohesion
					percievedVelocity.x += predators[i].v.x;
					percievedVelocity.y += predators[i].v.y;
					//Seperation
					if (calculateDistance(predators[i], predators[index]) < 12) {
						flockCenter.x -= (predators[i].x - predators[index].x);
						flockCenter.y -= (predators[i].y - predators[index].y);
					}
				}
			}
		}
		if (count > 0) {
			active++;
			percievedCenter.x = percievedCenter.x / count;
			percievedCenter.y = percievedCenter.y / count;
			
			percievedCenter.x = (percievedCenter.x - predators[index].x) / 55;
			percievedCenter.y = (percievedCenter.y - predators[index].y) / 55;
			
			percievedVelocity.x = percievedVelocity.x / count;
			percievedVelocity.y = percievedVelocity.y / count;
			
			flockCenter.x /= count;
			flockCenter.y /= count;
		}
		
		//avoid the mouse predator
		if (calculateDistance(mousePos, predators[index]) < 60) {
			active++;
			mousePredator.x -= (mousePos.x - predators[index].x);
			mousePredator.y -= (mousePos.y - predators[index].y);
		}
		
		predators[index].v = addForce(predators[index], percievedCenter);
		predators[index].v = addForce(predators[index], percievedVelocity);
		predatorChase(index);
		predators[index].v = addForce(predators[index], flockCenter);
		predators[index].v = addForce(predators[index], mousePredator);
		
	}
	
	var predatorChase = function(index) {
		closePrey = {
			x: 0,
			y: 0
		};
		dist = 80;
		active = 0;
		for (var i = 0; i < boids.length; i++) {
			tDist = calculateDistance(predators[index], boids[i]);
			if (tDist < dist) {
				dist = tDist;
				if (dist < 80) {
					active++;
					closePredator.x = (boids[i].x - predators[index].x);
					closePredator.y = (boids[i].y - predators[index].y);
				}
			}

		}//end for loop
		
		if (active > 0) {
			predators[index].v = addForce(predators[index], closePredator);
		}
		
	}
	
	var predatorEatPrey = function(index) {
		for (var i = 0; i < boids.length; i++) {
			dist = calculateDistance(predators[index], boids[i]);
			if (dist < 6) {
				//add boid to boidDeath array. this is for drawing a boid explosion
				boidDeaths.push({
					x: boids[i].x,
					y: boids[i].y,
					c: boids[i].c,
					r: 5,
					a: 8
				});
				//kill boid
				boids.splice(i,1);
				
				//predator fills up, if reaches mitosis level, spawns new predator
				predators[index].m += 1;
				predators[index].r -= 12;
				predators[index].c = predators[index].r + ',25,29';
				
				if (predators[index].m > mitosis) {
					//reset original predator
					predators[index].c = startRed + ',25,29';
					predators[index].r = startRed;
					predators[index].m = 0;
					
					//create the new one
					predators.push({
						x: predators[index].x + Math.random() * 4,
						y: predators[index].y + Math.random() * 4,
						v: {
							x: Math.random() * 2 - 1,
							y: Math.random() * 2 - 1
						},
						r: startRed,
						c: startRed + ',25,29',
						m: 0
					});
				}
			}
		}
	}
	//END PREDATOR FUNCTIONS+++++++++++++++++++++++++++++
	
	//SPAWN FUNCTION+++++++++++++++++++++++++++++++++++++
	var checkMouseOnSpawn = function(index) {
		
		if (calculateDistance(mousePos, spawnPoints[index]) < 40) {
		
			var frequency = Math.random() * 100;
			
			if (frequency < 10) {
				boids.push({
					x: spawnPoints[index].x + Math.random() * 100 - 50,
					y: spawnPoints[index].y + Math.random() * 100 - 50,
					v: {
						x: Math.random() * 2 - 1,
						y: Math.random() * 2 - 1
					},
					c: Math.floor(Math.random() * 253 + 2) + ',' + Math.floor(Math.random() * 253 + 2) + ',' + Math.floor(Math.random() * 253 + 2)
				});
			}
		}
		
	}
	
	var pulseSpawnPoints = function(index) {
		if (spawnPoints[index].g === 1) {
			spawnPoints[index].r += 0.02;
			if (spawnPoints[index].r >= 0.6) {spawnPoints[index].g = 0;}
		}
		else {
			spawnPoints[index].r -= 0.05;
			if (spawnPoints[index].r <= 0.3) {spawnPoints[index].g = 1;}
		}
	}
	//END SPAWN FUNCTIONS++++++++++++++++++++++++++++++++
	
	//KILL HOLE FUNCTIONS++++++++++++++++++++++++++++++++
	var checkAnimalsInHole = function(index) {
	
		//check boids
		for (var i = 0; i < boids.length; i++) {
			dist = calculateDistance(killHole[index], boids[i]);
			if (dist < 20) {
				boids.splice(i,1);
			}
		}
		
		for (var i = 0; i < predators.length; i++) {
			dist = calculateDistance(killHole[index], predators[i]);
			if (dist < 20) {
				predators.splice(i,1);
			}
		}
	}
	
	var pulseKillHole = function(index) {
		if (killHole[index].g === 1) {
			killHole[index].r += 0.5;
			if (killHole[index].r >= 40) {killHole[index].g = 0;}
		}
		else {
			killHole[index].r -= 0.5;
			if (killHole[index].r <= 30) {killHole[index].g = 1;}
		}
	}
	//END KILL HOLE FUNCTIONS++++++++++++++++++++++++++++
	
	
	//MAIN GAME LOOP+++++++++++++++++++++++++++++++++++++
	var update = function(){
		
		//clear the canvas
		a_con.clearRect(0, 0, width, height);
		
		a_con.fillStyle = '#000';
		a_con.fillText(boids.length, 30,580);
		
		//draw and move the boids------------------------
		for (var i = 0; i < boids.length; i++) {
		
			//Draw boid
			a_con.fillStyle = 'rgba(' + boids[i].c + ', 0.2)'; 
			a_con.fillRect(boids[i].x - boids[i].v.x * speed, boids[i].y - boids[i].v.y * speed, size, size);
			
			a_con.fillStyle = 'rgba(' + boids[i].c + ', 0.4)'; 
			a_con.fillRect(boids[i].x, boids[i].y, size, size);
			boids[i].x += boids[i].v.x * speed;
			boids[i].y += boids[i].v.y * speed;
			applyForces(i);
			//avoidPredators(i);
			
			boids[i].v = checkWallCollisions(boids[i],i);	
			
			a_con.fillStyle = 'rgba(' + boids[i].c + ', 1.0)'; 
			a_con.fillRect(boids[i].x, boids[i].y, size, size);
			
		}
		//-----------------------------------------------
		
		//draw and move the predators------------------------
		for (var i = 0; i < predators.length; i++) {
		
			//Draw predators
			a_con.fillStyle = 'rgba(' + predators[i].c + ', 0.2)'; 
			a_con.fillRect(predators[i].x - predators[i].v.x * speed, predators[i].y - predators[i].v.y * speed, predSize, predSize);
			
			a_con.fillStyle = 'rgba(' + predators[i].c + ', 0.4)'; 
			a_con.fillRect(predators[i].x, predators[i].y, predSize, predSize);
			predators[i].x += predators[i].v.x * predSpeed;
			predators[i].y += predators[i].v.y * predSpeed;
			predatorForces(i);
			//predatorChase(i);
			predators[i].v = checkWallCollisions(predators[i],i);

			predatorEatPrey(i);
			
			a_con.fillStyle = 'rgba(' + predators[i].c + ', 1.0)'; 
			a_con.fillRect(predators[i].x, predators[i].y, predSize, predSize);
			
		}
		//-----------------------------------------------
		
		//draw boid deaths-------------------------------
		for (var i = 0; i < boidDeaths.length; i++) {
			
			//draws a growing/fading circle for each dead boid until that circle is bigger than the max radius
			a_con.strokeStyle = 'rgba(' + boidDeaths[i].c + ', 0.' + boidDeaths[i].a + ')';
			a_con.beginPath();
			a_con.arc(boidDeaths[i].x,boidDeaths[i].y,boidDeaths[i].r,0,Math.PI*2,true);
			a_con.stroke();
			
			boidDeaths[i].a -= 1;
			boidDeaths[i].r += 1;
			
			if (boidDeaths[i].r > explodeRad) {
				boidDeaths.splice(i,1);
			}
			
		}
		//-----------------------------------------------
		
		//draw spawn points------------------------------
		var checkFrequency = Math.random() * 5000;
		
		if (checkFrequency < spawnFreq) {
			spawnPoints.push({
						x: Math.random() * (width - 140) + 70,
						y: Math.random() * (height - 140) + 70,
						l: 0,
						r: 0.3,
						g: 1
					});
		}
		
		for (var i = 0; i < spawnPoints.length; i++) {
			//draw
			var grad = a_con.createRadialGradient(spawnPoints[i].x, spawnPoints[i].y, 20, spawnPoints[i].x, spawnPoints[i].y, 40);
			grad.addColorStop(0, 'rgba(35,207,67,1.0)');
			grad.addColorStop(spawnPoints[i].r, 'rgba(24,143,46,0.7)');
			grad.addColorStop(0.8, 'rgba(24,143,46,0.2)');
			grad.addColorStop(1, 'rgba(24,143,46,0)');
			a_con.fillStyle = grad;
			a_con.beginPath();
			a_con.arc(spawnPoints[i].x, spawnPoints[i].y,40,0,Math.PI*2,true);
			a_con.fill();
			
			//pulse
			pulseSpawnPoints(i);
			
			//life cycle
			spawnPoints[i].l += 1;
			if (spawnPoints[i].l > spawnLife) {
				spawnPoints.splice(i,1);
			}
			//checkMousePos
			checkMouseOnSpawn(i);
		}
		//---------------------------------------------
		
		//draw kill holes------------------------------
		var checkFrequency = Math.random() * 5000;
		
		if (checkFrequency < killFreq) {
			killHole.push({
						x: Math.random() * (width - 140) + 70,
						y: Math.random() * (height - 140) + 70,
						l: 0,
						r: 30,
						g: 1
					});
		}
		
		for (var i = 0; i < killHole.length; i++) {
			//draw
			var grad = a_con.createRadialGradient(killHole[i].x, killHole[i].y, 20, killHole[i].x, killHole[i].y, killHole[i].r);
			grad.addColorStop(0, 'rgba(30,30,30,1.0)');
			grad.addColorStop(1, 'rgba(100,100,100,0)');
			a_con.fillStyle = grad;
			a_con.beginPath();
			a_con.arc(killHole[i].x, killHole[i].y,40,0,Math.PI*2,true);
			a_con.fill();

			//pulse
			pulseKillHole(i);
			
			//life cycle
			killHole[i].l += 1;
			if (killHole[i].l > killLife) {
				killHole.splice(i,1);
			}
			
			//check if animals in kill hole
			checkAnimalsInHole(i);
		}
		//---------------------------------------------
		
	}
	//+++++++++++++++++++++++++++++++++++++++++++++++++++
	
	
	//Gui uses this to clear the canvas
	 var clearCanvas = function(){
		ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
		ctx.beginPath();
		ctx.rect(0, 0, width, height);
		ctx.closePath();
		ctx.fill();
	}
	
    
    init();