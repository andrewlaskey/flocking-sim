var calculateDistance = function(object1, object2){
        x = Math.abs(object1.x - object2.x);
        y = Math.abs(object1.y - object2.y);
        
        return Math.sqrt((x * x) + (y * y));
    }

/***********************
BOID
***********************/
function Boid(x, y) {
    this.init(x, y);
}

Boid.prototype = {
    init: function(x, y) {
        this.alive = true;

        this.radius = 5;
        this.color = 'rgb(' + ~~random(0,255) + ',' + ~~random(0,255) + ',' + ~~random(0,255) + ')';

        this.x = x || 0.0;
        this.y = y || 0.0;

        this.v = {
            x: random(-1, 1),
            y: random(-1, 1)
        }

        this.speed = 6;
        this.personalSpace = 12;
        this.flockDistance = 200;
        this.flightDistance = 60;
    },
    wallAvoid: function(ctx) {
        //each side of the screen becomes an object that to be avoided factored into the birds movement
        wallLeft = {
            x: 0,
            y: this.y
        };
        wallTop = {
            x: this.x,
            y: 0
        };
        wallRight = {
            x: ctx.width,
            y: this.y
        };
        wallBottom = {
            x: this.x,
            y: ctx.height
        };
        wallAvoid = {
            x: 0,
            y: 0
        };
        
        if (calculateDistance(wallLeft, this) < 20) {
                        wallAvoid.x -= (wallLeft.x - this.x);
                        wallAvoid.y -= (wallLeft.y - this.y);
        }
        if (calculateDistance(wallTop, this) < 20) {
                        wallAvoid.x -= (wallTop.x - this.x);
                        wallAvoid.y -= (wallTop.y - this.y);
        }
        if (calculateDistance(wallRight, this) < 20) {
                        wallAvoid.x -= (wallRight.x - this.x);
                        wallAvoid.y -= (wallRight.y - this.y);
        }
        if (calculateDistance(wallBottom, this) < 20) {
                        wallAvoid.x -= (wallBottom.x - this.x);
                        wallAvoid.y -= (wallBottom.y - this.y);
        }
        this.addForce(wallAvoid);
    },
    ai: function(boids, index) {
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
                dist = calculateDistance(this, boids[i]);

                //Find all other boids close to it
                if (dist > 0 && dist < this.flockDistance) {
                    count++;

                    //Alignment
                    percievedCenter.x += boids[i].x;
                    percievedCenter.y += boids[i].y;

                    //Cohesion
                    percievedVelocity.x += boids[i].v.x;
                    percievedVelocity.y += boids[i].v.y;

                    //Seperation
                    if (calculateDistance(boids[i], this) < this.personalSpace) {
                        flockCenter.x -= (boids[i].x - this.x);
                        flockCenter.y -= (boids[i].y - this.y);
                    }
                }
            }
        }
        //Get the average for all near boids
        if (count > 0) {
            percievedCenter.x = percievedCenter.x / count;
            percievedCenter.y = percievedCenter.y / count;

            percievedCenter.x = (percievedCenter.x - this.x)/300;
            percievedCenter.y = (percievedCenter.y - this.y)/300;

            percievedVelocity.x = percievedVelocity.x / count;
            percievedVelocity.y = percievedVelocity.y / count;

            flockCenter.x /= count;
            flockCenter.y /= count;
        }
        this.addForce(percievedCenter);
        this.addForce(percievedVelocity);
        this.addForce(flockCenter);
    },
    addForce: function(force) {
        this.v.x += force.x;
        this.v.y += force.y;
        
        magnitude = calculateDistance({
            x: 0,
            y: 0
        }, {
            x: this.v.x,
            y: this.v.y
        });
        
        this.v.x = this.v.x / magnitude;
        this.v.y = this.v.y / magnitude;
    },
    draw: function( ctx ) {

        ctx.beginPath();
        ctx.arc( this.x, this.y, this.radius, 0, TWO_PI );
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

var boids = [];

/***********************
SIM
***********************/

var sim = Sketch.create({
        container: document.getElementById( 'container' )
    });

sim.setup = function() {
        for ( i = 0; i < 20; i++ ) {
            x = ( sim.width * 0.5 ) + random( -100, 100 );
            y = ( sim.height * 0.5 ) + random( -100, 100 );
            sim.spawn( x, y );
        }
    }

sim.spawn = function( x, y ) {

        boid = new Boid();

        boid.init( x, y );
        boids.push( boid );
    };

sim.update = function() {

        for ( var i = boids.length - 1; i >= 0; i-- ) {
            boids[i].ai(boids, i);
            boids[i].x += boids[i].v.x * boids[i].speed;
            boids[i].y += boids[i].v.y * boids[i].speed;
            boids[i].wallAvoid(sim);
        }  
}

sim.draw = function() {

        sim.globalCompositeOperation  = 'lighter';

        for ( var i = boids.length - 1; i >= 0; i-- ) {
            boids[i].draw( sim );
        }
    }