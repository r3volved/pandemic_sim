const menus = document.getElementsByTagName('section')
var offset = 0
for( var s of menus ) { 
    offset += s.clientHeight 
}

const input_elements = document.getElementsByTagName("input")
const elVal = ( id ) => Number((document.getElementById(id)||{}).value) || 0
const inputs = Object.keys(input_elements).map(i => input_elements[i].id)
// ['population','shops','work','speed']
const config = () => inputs.reduce((acc,k) => {
    acc[k] = elVal(k)
    return acc
},{})

var env = null
var infection = null

function setup () {   
    if( env && env.paused ) document.getElementById("pause").click()
    
    var options = config()
    infection = new Infection(options)
    env = new Environment(Object.assign(options, { infection }))
}

function draw () {
    env.draw()    
}


//DOM handlers
document.getElementById("pause").onclick = function(ev) {
    this.classList.toggle('paused')
    env.pause()
}

document.getElementById("infect").onclick = function(ev) {
    var i = (Math.round(Math.random() * (+env.people.length - +1) + +1) ) -1
    env.people[i].infection = infection.infect( true )
}

document.getElementById("restart").onclick = setup
for( var i in input_elements ) {
    input_elements[i].onchange = function() {
        var option = {}
        option[this.id] = this.value
        env.updateEnv( option )
    }
}
