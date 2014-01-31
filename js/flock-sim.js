var calculateDistance = function(object1, object2){
    x = Math.abs(object1.x - object2.x);
    y = Math.abs(object1.y - object2.y);

    return Math.sqrt((x * x) + (y * y));
};

var calcMagnitude = function(x, y) {
    return Math.sqrt((x * x) + (y * y));
};

var calcVectorAdd = function(v1, v2) {
    return {x: v1.x + v2.x, y: v1.y + v2.y};
};

var random = function( min, max ) {

    return min + Math.random() * ( max - min );
};

/***********************
BOID
***********************/
function Boid(x, y) {
    this.init(x, y);
}

Boid.prototype = {
    init: function(x, y) {
        //body
        this.type = "boid";
        this.alive = true;
        this.health = 1;
        this.maturity = 3;
        this.speed = 6;
        this.size = 5;
        this.hungerLimit = 20000;
        this.hunger = 0;
        this.color = 'rgb(' + ~~random(0,100) + ',' + ~~random(50,220) + ',' + ~~random(50,220) + ')';

        //brains
        this.eyesight = 100; //range for object dectection
        this.personalSpace = 20; //distance to avoid safe objects
        this.flightDistance = 60; //distance to avoid scary objects
        this.flockDistance = 200; //factor that determines how attracted the boid is to the center of the flock
        this.matchVelFactor = 4; //factor that determines how much the flock velocity affects the boid

        this.x = x || 0.0;
        this.y = y || 0.0;

        this.v = {
            x: random(-1, 1),
            y: random(-1, 1),
            mag: 0
        };

        this.unitV = {
            x: 0,
            y: 0
        };

    },
    wallAvoid: function(ctx) {
        var wallPad = 10;
        if (this.x < wallPad) {
            this.v.x = this.speed;
        } else if (this.x > ctx.width - wallPad) {
            this.v.x = -this.speed;
        }
        if (this.y < wallPad) {
            this.v.y = this.speed;
        } else if (this.y > ctx.height - wallPad) {
            this.v.y = -this.speed;
        }
    },
    ai: function(boids, index, ctx) {
        percievedCenter = {
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

        for (var i = 0; i < boids.length; i++) {
            if (i != index) {

                dist = calculateDistance(this, boids[i]);

                //Find all other boids close to it
                if (dist < this.eyesight) {
                    //if the same species then flock
                    if (boids[i].type == this.type) {

                        //Alignment
                        percievedCenter.x += boids[i].x;
                        percievedCenter.y += boids[i].y;
                        percievedCenter.count++;

                        //Cohesion
                        percievedVelocity.x += boids[i].v.x;
                        percievedVelocity.y += boids[i].v.y;
                        percievedVelocity.count++;

                        //Separation
                        if (dist < this.personalSpace + this.size + this.health) {
                            this.avoidOrAttract("avoid", boids[i], this.personalSpace);
                        }
                    } else {
                        //if other species fight or flight
                        if (dist < this.size + boids[i].size) {
                            this.eat(boids[i]);
                        } else {
                            this.handleOther(boids[i]);
                        }
                    }
                }//if close enough
            }//dont check itself
        }//Loop through boids

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

        //Avoid Mouse
        if (calculateDistance(mousePredator, this) < this.eyesight) {
            var mouseModifier = 20;
            this.avoidOrAttract("avoid", mousePredator, mouseModifier);
        }

        this.wallAvoid(ctx);
        this.limitVelocity();
    },
    setUnitVector: function() {
        var magnitude = calcMagnitude(this.v.x, this.v.y);
        this.v.x = this.v.x / magnitude;
        this.v.y = this.v.y / magnitude;
    },
    limitVelocity: function() {
        this.v.mag = calcMagnitude(this.v.x, this.v.y);
        this.unitV.x = (this.v.x / this.v.mag);
        this.unitV.y = (this.v.y / this.v.mag);

        if (this.v.mag > this.speed) {
            this.v.x = this.unitV.x * this.speed;
            this.v.y = this.unitV.y * this.speed;
        }
    },
    avoidOrAttract: function(action, other, modifier) {
        var newVector = {x: 0, y: 0};
        var direction = ((action === "avoid") ? -1 : 1);
        var vModifier = modifier || 1;
        newVector.x += ( (other.x - this.x) * vModifier ) * direction;
        newVector.y += ( (other.y - this.y) * vModifier ) * direction;
        this.v = calcVectorAdd(this.v, newVector);
    },
    move: function() {
        this.x += this.v.x;
        this.y += this.v.y;
        this.hunger += this.v.mag;
    },
    eat: function(other) {
        if (other.type === "plant") {
            other.health--;
            this.health++;
            this.hunger = 0;
        }
        this.metabolism();
    },
    handleOther: function(other) {
        if (other.type === "predator") {
            this.avoidOrAttract("avoid", other);
        }
    },
    metabolism: function() {
        if (this.hunger >= this.hungerLimit) {
            this.health--;
            this.hunger = 0;
        }

        if (this.health <= 0) {
            this.alive = false;
        }
    },
    mitosis: function(boids) {
        if (this.health >= this.maturity) {
            //reset old boid
            this.health = 1;

            birthedBoid = new Boid(
                this.x + random(-this.personalSpace, this.personalSpace),
                this.y + random(-this.personalSpace, this.personalSpace)
            );
            birthedBoid.color = this.color;

            boids.push(birthedBoid);
        }
    },
    draw: function( ctx ) {

        drawSize = this.size + this.health;

        ctx.beginPath();
        ctx.moveTo( this.x + ( this.unitV.x * drawSize ), this.y + ( this.unitV.y * drawSize ));
        ctx.lineTo( this.x + ( this.unitV.y * drawSize ), this.y - ( this.unitV.x * drawSize ));
        ctx.lineTo( this.x - ( this.unitV.x * drawSize * 2 ), this.y - ( this.unitV.y * drawSize * 2 ));
        ctx.lineTo( this.x - ( this.unitV.y * drawSize ), this.y + ( this.unitV.x * drawSize ));
        ctx.lineTo( this.x + ( this.unitV.x * drawSize ), this.y + ( this.unitV.y * drawSize ));
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.fill();
    }
};

Predator.prototype = new Boid();
Predator.prototype.constructor = Predator;
Predator.constructor = Boid.prototype.constructor;

function Predator(x, y) {
    this.init(x, y);

    this.type = "predator";

    //body
    this.maturity = 6;
    this.speed = 5.5;
    this.hungerLimit = 12000;
    this.color = 'rgb(' + ~~random(100,250) + ',' + ~~random(10,30) + ',' + ~~random(10,30) + ')';

    //brains
    this.eyesight = 150;
    this.flockDistance = 300;
}

Predator.prototype.eat = function(other) {
    if (other.type === "boid") {
        other.health--;
        this.health++;
        this.hunger = 0;
    }
    this.metabolism();
};

Predator.prototype.handleOther = function(other) {
    if (other.type === "boid") {
        this.avoidOrAttract("attract", other);
    }
};

Predator.prototype.mitosis = function() {
    if (this.health >= this.maturity) {
        //reset old boid
        this.health = 1;

        birthedBoid = new Predator(
            this.x + random(-this.personalSpace, this.personalSpace),
            this.y + random(-this.personalSpace, this.personalSpace)
        );
        birthedBoid.color = this.color;

        boids.push(birthedBoid);
    }
};

/***********************
SIM
***********************/
var boids = [];

var sim = Sketch.create({
        container: document.getElementById( 'container' )
    });

sim.setup = function() {
        for ( i = 0; i < 50; i++ ) {
            x = ( sim.width * 0.5 ) + random( -300, 300 );
            y = ( sim.height * 0.5 ) + random( -300, 300 );
            sim.spawn( x, y);
        }
    };

sim.spawn = function( x, y) {
        var predatorProbability = 5;

        if (random(0,100) <= predatorProbability) {
            boid = new Predator(x, y);
        } else {
            boid = new Boid(x, y);
        }
        boids.push( boid );
    };

sim.update = function() {

        for ( i = boids.length - 1; i >= 0; i-- ) {
            if (boids[i].alive) {

                boids[i].ai(boids, i, sim);
                boids[i].move();
                boids[i].mitosis();

            } else {
                //remove dead boid
                boids.splice(i,1);
            }
        }
};

sim.draw = function() {

        sim.globalCompositeOperation  = 'lighter';

        for ( i = boids.length - 1; i >= 0; i-- ) {
            boids[i].draw( sim );
        }
    };