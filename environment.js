class Environment {
    constructor( options = {} ) {
        this.infection = options.infection || new Infection(options)
        this.population = options.population || 1000
        this.width  = windowWidth
        this.height = windowHeight - (options.offset||0)
        this.hud = {
            top:[0,0,this.width,100],
            bottom:[0,this.height-100,this.width,100],
        }

        this.work = new Array(0)
        var work = options.work || 1
        for( var i = 0; i < work; ++i ) {
            this.work.push( this.rndPos( this.work, 60 ) )
        }
        
        this.shops = new Array(0)
        var shops = options.shops || 1
        for( var i = 0; i < shops; ++i ) {
            this.shops.push( this.rndPos( this.work.concat( this.shops ), 60 ) )
        }

        this.people = new Array()
        for( var i = 0; i < this.population; ++i ) {
            this.people.push(new Person(Object.assign(options, {
                width:this.width,
                height:this.height,
                speed:options.speed || 1,
                day:options.day || 2400,
                home:this.rndPos( this.work.concat( this.shops ), 60 ),
                environment:[0,0,this.width,this.height],
                shops:this.shops,
                work:this.work,
            })))
        }
        
        this.snapshots = new Array()
        this.snapshot_cadence = options.snapshot || 10
        this.snapshotter = 0
        if( this.people.length )
            this.people[0].infection = this.infection.infect( true )
        
        this.pandemic = 0
        
        createCanvas( this.width, this.height )
        this.paused = false
        if( !this.paused ) loop()        
    }
    
    updateEnv ( options ) {
        if( options ) return
        if( options.infection ) this.infection = options.infection
        this.env = Object.assign(this.env || {}, options)
        for( var person of this.people ) {
            person.updateEnv( this.env )
        }        
    }

    rndPos ( blocking = [], r ) {
        let next = true
        let result = [ 0, 0 ]
        while( next ) {
            //Pick random pos
            result[0] = random(5, this.width-5)
            result[1] = random(this.hud.top[0]+this.hud.top[3], this.hud.bottom[1])
            next = blocking.find(d => {
                if( !Array.isArray(d) ) console.log(blocking)
                let [x,y,w = 0,h = 0] = d
                if( w && h ) {
                    w = Number(w) ? Number(w)/2 : 0
                    h = Number(h) ? Number(h)/2 : 0                                        
                } 
                let dis = dist(result[0],result[1],x+w,y+h)
                return dis < (w || r)
            })
        }
        return result
    }
    
    pause () {
        this.paused = !this.paused
        return this.paused ? noLoop() : loop()
    }

    draw () {
        --this.snapshotter

        background('#000')
        this.drawDestinations()
        this.drawPeople()
        
        if( !this.snapshotter || this.snapshotter < 0 ) {
            this.snapshots.push(this.people.reduce((sum,p) => {
                ++sum[Object.keys(sum)[p.state]]
                if( !p.state ) return sum                
                if( !p.infection ) ++sum.susceptible
                if( p.infection && p.infection.stage ) ++sum.infected
                if( p.infection && p.infection.stage > 2 ) {
                    ++sum[Object.keys(sum)[2+p.infection.stage]]
                    if( p.infection.stage < 7 ) ++sum.contageous
                }
                return sum
            },{
                dead:0,
                alive:0,
                susceptible:0,
                infected:0,
                contageous:0,
                symptomatic:0,
                asymptomatic:0,
                sick:0,
                severe:0,
                immune:0,
                pandemic:this.pandemic
            }))
            this.snapshotter = this.snapshot_cadence            
        }
        
        this.drawHud()
    }
    
    drawDestinations () {
        strokeWeight(3)
        for( var work of this.work ) {
            noFill()
            stroke(`rgba(30,20,60,0.8)`)
            circle(work[0],work[1],80)
        }
        for( var shop of this.shops ) {
            noFill()
            stroke(`rgba(30,60,20,0.8)`)
            circle(shop[0],shop[1],80)
        }
    }

    drawPeople () {
        strokeWeight(1)
        var snap = this.snapshots[this.snapshots.length-1] || {}
        var pandemic = ((snap.symptomatic||0) + (snap.sick||0) + (snap.severe||0) + (snap.dead||0)) / this.population * 100
        for( var p = 0; p < this.people.length; ++p ) {
            var person = this.people[p]
            person.draw( this.people )

            if( Math.floor(pandemic/10) > this.pandemic ) {
                person.time_rest *= pandemic
                ++this.pandemic
                if( pandemic > 30 ) 
                    person.goto( person.home )
            } else {
                if( !person.infection ) continue
                if( person.infection.stage == 3 ) {
                    //this.rest = 0
                    person.time_rest = infection.time_severity
                } else if( person.infection.stage == 5 ) {
                    //this.rest = 0
                    person.time_rest = infection.time_severity
                    person.goto( person.home )
                } else if( person.infection.stage == 6 ) {
                    //this.rest = 0
                    person.time_rest = infection.time_severity + infection.time_recovery
                    person.goto( person.home )
                }
            }
        }
    }
    
    drawHud () {
        textSize(14)
        strokeWeight(1)
        //top
        stroke(`rgba(250,200,0,1)`)
        fill(`rgba(0,0,0,0.7)`)
        rect(...this.hud.top)
        noStroke()
        fill(`rgba(250,250,250,1)`)
        var last = this.snapshots[this.snapshots.length-1]
        if( last ) {
            fill(`rgba(250,250,250,1)`)
            text([
                `Population: ${this.population - last.dead}`,
                `Susceptible: ${last.susceptible}`,
                `Contageous ${last.contageous}`,
                `Infected: ${last.infected}`,
                `Infection: ${(last.infected / (this.population - last.dead) * 100).toFixed(2)} %`,
            ].join("\n"), 10, 20)
            
            if( this.pandemic ) {
                textSize(64)
                fill(`rgba(250,200,0,0.${this.pandemic})`)
                text('!',320,70)
                textSize(14)
            }
            
            fill(`rgba(250,250,250,1)`)
            text([
                `Immune: ${last.immune}`,
                `Symptomatic: ${last.symptomatic}`,
                `Asymptomatic: ${last.asymptomatic}`,
                `Sick: ${last.sick}`,
                `Severe: ${last.severe}`,
            ].join("\n"), 180, 20)            
            fill(`rgba(50,200,50,1)`)
            circle(170, 16, 5)
            fill(`rgba(250,50,250,1)`)
            circle(170, 34, 5)
            fill(`rgba(250,50,50,1)`)
            circle(170, 50, 5)
            fill(`rgba(250,150,50,1)`)
            circle(170, 68, 5)
            fill(`rgba(250,250,50,1)`)
            circle(170, 86, 5)
            
            var ss = this.people.filter(s => s.infection).sort((a,b) => b.r - a.r)
            var x = 360
            var done = false
            ss.forEach((s,si) => {
                if( done ) return
                if( x + (s.r*2) > this.width - 30 ) done = true
                fill(s.color())
                x += s.r / 2
                circle(x, 45, s.r)
                var infected = s.r - s.start_r
                if( infected >= 10 ) {
                    fill(`rgba(250,250,250,0.5)`)
                    text(infected, x-(s.r/4), 80)
                }
                x += s.r / 2 + 5
            })
            fill(`rgba(250,250,250,1)`)
            text(`Top spreaders`, 360, 20)
            
        }
        //bottom
        noStroke()
        fill(`rgba(0,0,0,0.7)`)
        rect(...this.hud.bottom)
        if( this.snapshots.length ) {
            var xstep = this.hud.bottom[2] / (this.snapshots.length-1||1)
            var ystep = this.hud.bottom[3] / this.population
            var yoffset = this.hud.bottom[1] + this.hud.bottom[3]
            var xoffset = this.hud.bottom[0]

            var pandemic = 0
            for(let i = 1; i < this.snapshots.length; ++i){
                if( this.snapshots[i].pandemic !== pandemic ) {
                    ++pandemic
                    stroke(`rgba(0,250,0,1)`)
                    line(xoffset+(xstep*i), this.hud.bottom[1], xoffset+(xstep*i), this.hud.bottom[1] + this.hud.bottom[3])
                }
                const doType = ( type, color ) => {
                    var rev = type.charAt(0) == '-'
                    type = rev ? type.slice(1) : type
                    var yo = rev ? this.hud.bottom[1] : yoffset
                    var last_x = xoffset+(xstep*(i-1))
                    var last_y = rev
                        ? yo+(ystep*((this.snapshots[i-1]||{})[type]||0))
                        : yoffset-(ystep*((this.snapshots[i-1]||{})[type]||0))
                    var now_x  = xoffset+(xstep*i)
                    var now_y  = rev
                        ? yo+(ystep*((this.snapshots[i]||{})[type]||0))
                        : yoffset-(ystep*((this.snapshots[i]||{})[type]||0))
                    stroke(color)
                    line(last_x, last_y, now_x, now_y)
                }
                doType('-dead', `rgba(200,200,200,0.5)`)
                doType('susceptible', `rgba(250,250,250,1)`)
                doType('infected', `rgba(250,0,0,0.5)`)
                doType('contageous', `rgba(250,0,0,1)`)
                doType('sick', `rgba(250,250,0,0.5)`)
                doType('severe', `rgba(250,250,0,1)`)
            }
        }        
        noFill()
        stroke(`rgba(250,200,0,1)`)
        rect(...this.hud.bottom)
        
        if( last.immune + last.susceptible == this.population - last.dead ) noLoop()
    }
    
}
