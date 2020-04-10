class Person {
    constructor( options = {} ) {
        this.infection = null

        this.env = options
        this.env_speed = this.env.day / this.env.speed
        
        this.home = options.home || [ random(0, this.env.width), random(0, this.env.height) ]
        this.home_x = this.home[0]
        this.home_y = this.home[1]
        this.work = this.randomItem(options.work||[]) || []
        this.shops = options.shops || []
        this.destinations = new Array().concat([ this.work ]).concat( this.shops )
        this.environment = options.environment || [0,0,this.env.width,this.env.height]        
        this.time_rest_start = options.time_rest || 1
        this.time_rest = this.time_rest_start        
        this.colors = options.colors || [
            `rgba(100,100,100,0.1)`, [
                `rgba(200,200,200,1)`,
                `rgba(250,50,50,0.5)`,
                `rgba(250,50,50,1)`,
                `rgba(250,50,250,1)`,
                `rgba(250,50,50,1)`,
                `rgba(250,150,50,1)`,
                `rgba(250,250,50,1)`,
                `rgba(0,250,0,0.2)`,
            ]
        ]
        
        this.state = 1
        this.states = ["Dead","Alive"]
        this.xSpeed = 0
        this.ySpeed = 0
        this.x = this.home_x
        this.y = this.home_y
        this.start_r = 2
        this.r = this.start_r
        
        this.speed = 0
        this.dest = [this.x,this.y]
        this.goto( this.randomItem( this.destinations ) )
        this.stop(this.time_rest*2)
    }

    updateEnv ( options ) {
        if( options ) return
        if( options.speed ) {
            this.env.speed = options.speed || this.env.speed
            var newSpeed = this.env.day / this.env.speed
            var delta = this.env_speed / newSpeed
            this.env_speed = newSpeed
            if( this.resting() ) {
                //adjust rest time
                this.rest *= delta
            } else {
                //adjust speed
                this.speed *= delta
                this.xSpeed *= delta
                this.ySpeed *= delta
            }
        }
        if( this.infection ) 
            this.infection.updateEnv( options )
    }
   
    color () {
        var colors = []
        if( !Array.isArray(this.colors) ) return this.colors
        return Array.isArray(this.colors[this.state])
            ? this.colors[this.state][(this.infection||{}).stage||0]
            : this.colors[this.state]
    }
    
    resting () {
        return Boolean(this.rest && this.rest > 0)
    }
    
    randomItem( list ) {
        var i = Math.floor(random(0, list.length))
        return list[i]
    }

    goto ( coords, seed ) {
        if( !coords || !coords.length ) return
        if( coords.length == 4 ) {
            //If square, go to center of square
            coords = [
                coords[0]+coords[2]/2,
                coords[1]+coords[3]/2,
            ]
        }
        this.dest = coords
        this.speed = random(1,4) 
        this.xSpeed = (this.dest[0] - this.x) / (this.speed * this.env_speed)
        this.ySpeed = (this.dest[1] - this.y) / (this.speed * this.env_speed)
    }
    
    stop ( seed = 0 ) {
        this.rest = Math.floor(random( seed, seed*10 ) * this.env_speed)
    }

    draw ( people ) {
        noStroke()
        fill(this.color())
        circle(this.x,this.y,this.r)
        this.tick( people )
    }
    
    contact ( people ) {
        if( this.infected && !this.resting() ) return
        const filter = ( person ) => {
            //Ignore if moving
            if( !person.resting() ) return false
            //Ignore if not going to same distination
            if( !(person.dest[0] == person.home[0] && person.dest[1] == person.home[1]) ) return false
            //Ignore if not infected and contageous
            if( !(person.state && person.infection && person.infection.stage > 1 && person.infection.stage < 7) ) return false
            return true
        }
        
        people.filter(filter).forEach(person => {
            if( this.infection || !person.infection ) return
            let dest = dist(this.x,this.y,person.x,person.y)
            if( dest <= 20 ) {                        
                this.infection = person.infection.infect()
                if( this.infection ) {
                    stroke(this.colors[1][2])
                    person.r += 1
                } else 
                    stroke(this.colors[0])                        
                line(this.x,this.y,person.x,person.y)
            }
        })
    }
    
    tick ( people ) {
        if( !this.state ) return
        if( this.infection && this.infection.stage == 7 ) return
        if( this.infection && !this.infection.stage ) {
            this.state = 0
            return
        }
        if( this.infection ) this.infection.tick()
        let dest = dist(this.x,this.y,...this.dest)
        //console.log('resting', this.resting(), this.rest)
        if( !this.resting() && dest <= 40 ) {
            //If home...
            if( this.dest[0] == this.home[0] && this.dest[1] == this.home[1] ) {
                this.x = this.home_x
                this.y = this.home_y
                this.stop( this.time_rest )
                this.goto( this.randomItem( this.destinations ) )
            } else {
                this.contact( people )
                this.stop( 0.05 )
                this.goto( this.home )
            }
        } else {        
            //console.log( this.resting() ) 
            if( this.resting() ) --this.rest
            if( !this.resting() && this.xSpeed && this.ySpeed ) {
                const bounce = ( x, y, w, h ) => {
                    if(this.x < x || this.x > x+w) this.xSpeed*=-1
                    if(this.y < y || this.y > y+h) this.ySpeed*=-1    
                }
                bounce(...this.environment)
                this.x += this.xSpeed
                this.y += this.ySpeed
            }
        }
        
        //if( this.infection ) {
        //    if( this.infection.stage == 5 ) {
        //        //If sick - stay home longer
        //        if( this.time_rest !== this.time_rest_start*2 ) 
        //            this.time_rest = this.time_rest_start*2
        //    } else if( this.infection.stage == 6 ) {
        //        //If severe - stay home longer
        //        if( this.time_rest !== this.time_rest_start*4 ) 
        //            this.time_rest = this.time_rest_start*4
        //    } else {
        //        if( this.time_rest !== this.time_rest_start ) 
        //            this.time_rest = this.time_rest_start
        //    }
        //}
        
    }
    

}
