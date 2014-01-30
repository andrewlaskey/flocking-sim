var calculateDistance = function(object1, object2){
        x = Math.abs(object1.x - object2.x);
        y = Math.abs(object1.y - object2.y);
        
        return Math.sqrt((x * x) + (y * y));
    }

var calcMagnitude = function(x, y) {
    return Math.sqrt((x * x) + (y * y));
}

var calcVectorAdd = function(v1, v2) {
    return {x: v1.x + v2.x, y: v1.y + v2.y};
}

/***********************
BOID
***********************/
function Boid(x, y, predator) {
    this.init(x, y, predator);
}

function isPredator(boid) {
    boid.predator = true;
    boid.color = 'rgb(230,25,29)';
    boid.speed = 5.5;
    boid.eyesight = 150;
    return boid;
}

Boid.prototype = {
    init: function(x, y, predator) {
        this.alive = true;
        this.health = 1;

        this.predator = predator || false;

        this.radius = 5;
        this.color = 'rgb(' + ~~random(0,50) + ',' + ~~random(50,200) + ',' + ~~random(50,200) + ')';

        this.x = x || 0.0;
        this.y = y || 0.0;

        this.v = {
            x: random(-1, 1),
            y: random(-1, 1)
        }

        this.speed = 6;
        this.eyesight = 100; //range for object dectection
        this.personalSpace = 12; //distance to avoid safe objects
        this.flightDistance = 60; //distance to avoid scary objects
        this.flockDistance = 200; //factor that determines how attracted the boid is to the center of the flock
        this.matchVelFactor = 4; //factor that determines how much the flock velocity affects the boid
        
    },
    wallAvoid: function(ctx) {
        var boundAdjust = 20;
        if (this.x > ctx.width - boundAdjust) {
            this.v.x = -this.speedLimit;
        } else if (this.x < boundAdjust) {
            this.v.x = this.speedLimit;
        }
        if (this.y > ctx.height - boundAdjust) {
            this.v.y = -this.speedLimit;
        } else if (this.y < boundAdjust) {
            this.v.y = this.speedLimit;
        }
    },
    ai: function(boids, index, ctx) {
        percievedCenter = {
            x: 0,
            y: 0,
            count: 0
        };
        repellCenter = {
            x: 0,
            y: 0,
            count: 0
        };
        percievedVelocity = {
            x: 0,
            y: 0,
            count: 0
        };
        mousePredator = {
            x: ctx.touches[0].x || 0,
            y: ctx.touches[0].y || 0
        };
        fleeOrHuntVector = {
            x: 0,
            y: 0,
            count: 0
        };

        for (var i = 0; i < boids.length; i++) {
            if (i != index) {

                dist = calculateDistance(this, boids[i]);

                //Find all other boids close to it
                if (dist < this.eyesight) {
                    //if the same species then flock
                    if (boids[i].predator == this.predator) {

                        //Alignment
                        percievedCenter.x += boids[i].x;
                        percievedCenter.y += boids[i].y;
                        percievedCenter.count++;

                        //Cohesion
                        percievedVelocity.x += boids[i].v.x;
                        percievedVelocity.y += boids[i].v.y;
                        percievedVelocity.count++;

                        //Seperation
                        if (calculateDistance(boids[i], this) < this.personalSpace + this.radius) {
                            repellCenter.x -= (boids[i].x - this.x);
                            repellCenter.y -= (boids[i].y - this.y);
                            repellCenter.count++;
                        }
                    } else {
                        //avoid or hunt
                        if (this.predator) {
                            fleeOrHuntVector.x += boids[i].x - this.x;
                            fleeOrHuntVector.y += boids[i].y - this.y;
                        } else {
                            fleeOrHuntVector.x -= boids[i].x - this.x;
                            fleeOrHuntVector.y -= boids[i].y - this.y;
                        }
                        fleeOrHuntVector.count++;

                    }

                }
            }
        }
        //Get the average for all near boids
        if (percievedCenter.count > 0) {
            percievedCenter.x = ((percievedCenter.x / percievedCenter.count) - this.x) / this.flockDistance;
            percievedCenter.y = ((percievedCenter.y / percievedCenter.count) - this.y) / this.flockDistance;
            this.v = calcVectorAdd(this.v, percievedCenter);
        }
        if (percievedVelocity.count > 0) {
            percievedVelocity.x = ((percievedVelocity.x / percievedVelocity.count) - this.v.x) / this.matchVelFactor;
            percievedVelocity.y = ((percievedVelocity.y / percievedVelocity.count) - this.v.y) / this.matchVelFactor;
            this.v = calcVectorAdd(this.v, percievedVelocity);
        }
        if (repellCenter.count > 0) {
            this.v = calcVectorAdd(this.v, repellCenter);
        }
        if (fleeOrHuntVector.count > 0) {
            this.v = calcVectorAdd(this.v, fleeOrHuntVector);
        }

        //avoid mouse
        if (calculateDistance(mousePredator, this) < this.eyesight) {
            var mouseModifier = 20;
            mousePredator.x -= (mousePredator.x - this.x) * mouseModifier;
            mousePredator.y -= (mousePredator.y - this.y) * mouseModifier;
            this.v = calcVectorAdd(this.v, mousePredator);
        }
        this.wallAvoid(ctx);
        this.setUnitVector();
    },
    setUnitVector: function() {
        var magnitude = calcMagnitude(this.v.x, this.v.y);
        this.v.x = this.v.x / magnitude;
        this.v.y = this.v.y / magnitude;
    },
    draw: function( ctx ) {

        ctx.beginPath();
        ctx.arc( this.x, this.y, this.radius + this.health, 0, TWO_PI );
        ctx.fillStyle = this.color;
        ctx.fill();
    }
};

var boids = [];

/***********************
SIM
***********************/

var sim = Sketch.create({
        container: document.getElementById( 'container' )
    });

sim.setup = function() {
        for ( i = 0; i < 50; i++ ) {
            x = ( sim.width * 0.5 ) + random( -100, 100 );
            y = ( sim.height * 0.5 ) + random( -100, 100 );
            sim.spawn( x, y, false );
        }
        for ( i = 0; i < 5; i++ ) {
            x = ( sim.width * 0.5 ) + random( -100, 100 );
            y = ( sim.height * 0.5 ) + random( -100, 100 );
            sim.spawn( x, y, true );
        }
    }

sim.spawn = function( x, y, predator ) {

        boid = new Boid();

        boid.init( x, y, predator );
        if (predator) {
            boid = isPredator(boid);
        }
        boids.push( boid );
    };

sim.update = function() {
        
        for ( var i = boids.length - 1; i >= 0; i-- ) {
            if (boids[i].alive) {
                boids[i].ai(boids, i, sim);
                boids[i].x += boids[i].v.x * boids[i].speed;
                boids[i].y += boids[i].v.y * boids[i].speed;

                //collision and eating check
                if (boids[i].predator) {
                    for ( var k = boids.length - 1; k >= 0; k-- ) {
                        if (i !== k && !boids[k].predator) {
                            
                            dist = calculateDistance(boids[i], boids[k]);

                            if (dist < boids[i].radius + boids[k].radius) {
                                //kill boid k
                                boids[k].alive = false;
                                boids[i].health++;
                            }
                        }
                    }
                }//end predator eating check
            } else {
                //remove dead boid
                boids.splice(i,1);
            }
        }
}

sim.draw = function() {

        sim.globalCompositeOperation  = 'lighter';

        for ( var i = boids.length - 1; i >= 0; i-- ) {
            boids[i].draw( sim );
        }
    }