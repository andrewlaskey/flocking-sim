var calculateDistance = function(object1, object2){
        x = abs(object1.x - object2.x);
        y = abs(object1.y - object2.y);
        
        return sqrt((x * x) + (y * y));
    }

var calcMagnitude = function(x, y) {
    return sqrt((x * x) + (y * y));
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
    //body
    boid.maturity = 6;
    boid.speed = 5.5;
    boid.color = 'rgb(' + ~~random(100,250) + ',' + ~~random(10,30) + ',' + ~~random(10,30) + ')';

    //brains
    boid.predator = true;
    boid.eyesight = 150;
    boid.flockDistance = 300;

    return boid;
}

Boid.prototype = {
    init: function(x, y, predator) {
        //body
        this.alive = true;
        this.health = 1;
        this.maturity = 3;
        this.speed = 6;
        this.radius = 5;
        this.color = 'rgb(' + ~~random(0,100) + ',' + ~~random(50,220) + ',' + ~~random(50,220) + ')';

        //brains
        this.predator = predator || false;
        this.eyesight = 100; //range for object dectection
        this.personalSpace = 20; //distance to avoid safe objects
        this.flightDistance = 60; //distance to avoid scary objects
        this.flockDistance = 200; //factor that determines how attracted the boid is to the center of the flock
        this.matchVelFactor = 4; //factor that determines how much the flock velocity affects the boid

        this.x = x || 0.0;
        this.y = y || 0.0;

        this.v = {
            x: random(-1, 1),
            y: random(-1, 1)
        };

        this.distanceTraveled = 0;

    },
    wallAvoid: function(ctx) {
        wallModifier = 30;
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

        if (calculateDistance(wallLeft, this) < this.personalSpace + this.radius) {
                        wallAvoid.x -= (wallLeft.x - this.x) * wallModifier;
                        wallAvoid.y -= (wallLeft.y - this.y) * wallModifier;
        }
        if (calculateDistance(wallTop, this) < this.personalSpace + this.radius) {
                        wallAvoid.x -= (wallTop.x - this.x) * wallModifier;
                        wallAvoid.y -= (wallTop.y - this.y) * wallModifier;
        }
        if (calculateDistance(wallRight, this) < this.personalSpace + this.radius) {
                        wallAvoid.x -= (wallRight.x - this.x) * wallModifier;
                        wallAvoid.y -= (wallRight.y - this.y) * wallModifier;
        }
        if (calculateDistance(wallBottom, this) < this.personalSpace + this.radius) {
                        wallAvoid.x -= (wallBottom.x - this.x) * wallModifier;
                        wallAvoid.y -= (wallBottom.y - this.y) * wallModifier;
        }
        this.v = calcVectorAdd(this.v, wallAvoid);
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
            x: ((typeof ctx.touches[0] === "undefined") ? 0 : ctx.touches[0].x),
            y: ((typeof ctx.touches[0] === "undefined") ? 0 : ctx.touches[0].y)
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

                        //Separation
                        if (calculateDistance(boids[i], this) < this.personalSpace + this.radius + this.health) {
                            repellCenter.x -= (boids[i].x - this.x) * this.personalSpace;
                            repellCenter.y -= (boids[i].y - this.y) * this.personalSpace;
                            this.v = calcVectorAdd(this.v, repellCenter);
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
                        this.v = calcVectorAdd(this.v, fleeOrHuntVector);
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
    move: function() {
        this.x += this.v.x * this.speed;
        this.y += this.v.y * this.speed;
        this.distanceTraveled = calcMagnitude(this.v.x * this.speed, this.v.y * this.speed);
    },
    eat: function(boids, index) {
        if (this.predator) {
            for ( var k = boids.length - 1; k >= 0; k-- ) {
                if (index !== k && !boids[k].predator) {

                    dist = calculateDistance(this, boids[k]);

                    if (dist < this.radius + this.radius) {
                        //kill boid k
                        boids[k].alive = false;
                        this.health++;
                    }
                }
            }
        }
    },
    mitosis: function(boids) {
        if (this.health >= this.maturity) {
            //reset old boid
            this.health = 1;

            birthedBoid = new Boid();
            birthedBoid.init(
                this.x + random(-this.personalSpace, this.personalSpace),
                this.y + random(-this.personalSpace, this.personalSpace),
                this.predator);
            birthedBoid.color = this.color;

            boids.push(birthedBoid);
        }
    },
    draw: function( ctx ) {

        drawSize = this.radius + this.health;

        ctx.beginPath();
        ctx.moveTo( this.x + ( this.v.x * drawSize ), this.y + ( this.v.y * drawSize ));
        ctx.lineTo( this.x + ( this.v.y * drawSize ), this.y - ( this.v.x * drawSize ));
        ctx.lineTo( this.x - ( this.v.x * drawSize * 2 ), this.y - ( this.v.y * drawSize * 2 ));
        ctx.lineTo( this.x - ( this.v.y * drawSize ), this.y + ( this.v.x * drawSize ));
        ctx.lineTo( this.x + ( this.v.x * drawSize ), this.y + ( this.v.y * drawSize ));
        //ctx.arc( this.x, this.y, this.radius + this.health, 0, TWO_PI );
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
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
    };

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
                boids[i].move();
                boids[i].eat(boids,i);
                boids[i].mitosis(boids);

            } else {
                //remove dead boid
                boids.splice(i,1);
            }
        }
};

sim.draw = function() {

        sim.globalCompositeOperation  = 'lighter';

        for ( var i = boids.length - 1; i >= 0; i-- ) {
            boids[i].draw( sim );
        }
    };