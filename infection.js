class Infection {
    constructor( options = {} ) {
        this.speed = options.speed || 1
        this.day = options.day || 400
        this.env_speed = this.day / this.speed

        this.time_contageous = options.time_contageous || 1
        this.time_symptoms   = options.time_symptoms || 1
        this.time_severity   = options.time_severity || 3
        this.time_recovery   = options.time_recovery || 6

        this.chance_infection  = options.chance_infection || 0.01
        this.chance_symtomatic = options.chance_symtomatic || 0.01
        this.chance_severity   = options.chance_severity || 0.01
        this.chance_recovery   = options.chance_recovery || 0.01

        this.timer = this.timer || this.time( this.time_contageous )
        
        this.stage = 1
        this.stages = ['deceased','infected','contageous','symptomatic','asymptomatic','sick','severe','immune']
    }
    
    updateEnv( options ) {
        if( !options ) return
        if( options.speed ) {
            this.env.speed = options.speed || this.env.speed
            var newSpeed = this.env.day / this.env.speed
            var delta = this.env_speed / newSpeed
            this.env_speed = newSpeed
            if( this.timer ) {
                //adjust rest time
                this.timer *= delta
            }
        }
        
        this.time_contageous = options.time_contageous || this.time_contageous
        this.time_symptoms   = options.time_symptoms || this.time_symptoms
        this.time_severity   = options.time_severity || this.time_severity
        this.time_recovery   = options.time_recovery || this.time_recovery
        this.chance_infection  = options.chance_infection || this.chance_infection
        this.chance_symtomatic = options.chance_symtomatic || this.chance_symtomatic
        this.chance_severity   = options.chance_severity || this.chance_severity
        this.chance_recovery   = options.chance_recovery || this.chance_recovery
    }
    
    time( seed ) {
        return Math.floor(random( seed*10, seed*50 ) * this.env_speed)
    }
    
    status () { 
        return this.stages[this.stage]
    }
    
    properties () {
        return {
            speed:this.speed,
            day:this.day,
            time_contageous:this.time_contageous,
            time_symptoms:this.time_symptoms,
            time_severity:this.time_severity,
            time_recovery:this.time_recovery,
            chance_infection:this.chance_infection,
            chance_symtomatic:this.chance_symtomatic,
            chance_severity:this.chance_severity,
            chance_recovery:this.chance_recovery
        }
    }
    
    tick () {
        if( this.timer ) --this.timer
        if( this.timer && this.timer > 0 ) return
        if( !this.stage || this.stage == 7 ) return
        
        ++this.stage
        
        switch( this.stage ) {
            case 1: //Infected
                this.timer = this.time( this.time_contageous )
                break
            case 2: //Contageous
                this.timer = this.time( this.time_symptoms )
                break
            case 3: //Symptomatic
                if( !this.chance( this.chance_symtomatic ) ) ++this.stage
                this.timer = this.time( this.time_severity )
                break
            case 4: //Symptomatic++
                if( this.chance( this.chance_severity ) ) {
                    ++this.stage
                    this.timer = this.time( this.time_recovery )
                } else if( this.chance( this.chance_recovery ) ) this.stage = 7
                break
            case 5: //Sick
                if( this.chance( this.chance_recovery ) ) {
                    if( this.chance( this.chance_recovery ) ) this.stage = 7
                    else return this.disinfect()
                    //recovered - no timer
                } else {
                    if( this.chance( this.chance_severity ) ) ++this.stage
                    this.timer = this.time( this.time_severity )
                }
                break
            case 6: //Severe
                //Death
                if( this.chance( this.chance_severity ) ) this.stage = 0
                else {
                    --this.stage
                    this.timer = this.time( this.time_recovery )
                }
                break
            case 7: //Immune
                this.timer = 0
                this.stage = 7
            default:
        }            
    }

    chance ( rate ) {
        rate = rate < 0 ? 0 : Number(rate)
        rate = rate > 1 ? rate / Number(`10e${rate.toString().length}`) : rate
        return Math.random() < rate
    }
    
    disinfect ( ) {
        return delete this
    }
    
    infect ( force ) {
        return force || this.chance( this.chance_infection )
            ? new Infection( this.properties() ) 
            : null
    }
    
    
    
}
