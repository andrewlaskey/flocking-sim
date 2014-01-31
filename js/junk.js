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
            y: random(-1, 1)
        };

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
                        if (dist < this.personalSpace + this.radius + this.health) {
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
        this.setUnitVector();
    },
    setUnitVector: function() {
        var magnitude = calcMagnitude(this.v.x, this.v.y);
        this.v.x = this.v.x / magnitude;
        this.v.y = this.v.y / magnitude;
    },
    avoidOrAttract: function(action, other, modifier) {
        newVector = {x: 0, y: 0};
        var direction = ((action === "avoid") ? -1 : 1);

        newVector.x += ( (other.x - this.x) * modifier ) * direction;
        newVector.y += ( (other.y - this.y) * modifier ) * direction;
        this.v = calcVectorAdd(this.v, newVector);
    },
    move: function() {
        this.x += this.v.x * this.speed;
        this.y += this.v.y * this.speed;
        this.hunger += calcMagnitude(this.v.x * this.speed, this.v.y * this.speed);
    },
    eat: function(other) {
        if (other.type === "plant") {
            other.health--;
            this.health++;
            this.hunger = 0;
        }
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

Predator.prototype = new Boid();
Predator.prototype.constructor = Predator;
Predator.constructor = Boid.prototype.constructor;

function Predator(x, y) {
    this.init(x, y);

    this.type = "predator";

    //body
    this.maturity = 6;
    this.speed = 5.5;
    this.hungerLimit = 800;
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
}

Predator.prototype.handleOther = function(other) {
    if (other.type === "boid") {
        this.avoidOrAttract("attract", other);
    }
}



/***********************
PLANTS
***********************/
function Plant(x, y) {
    this.init(x, y);
}

Plant.prototype = {
    init: function(x, y) {
        this.alive = true;
        this.x = x;
        this.y = y;

        this.food = ~~random(1, 15);
        this.size = 20 + this.food;
        this.color = 'rgb(' + ~~random(130,210)  + ',' + ~~random(40,140) + ',' + ~~random(160,220) + ')';
    },
    draw: function(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 40;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.size, this.y + this.size, this.size, this.size);
    }
};