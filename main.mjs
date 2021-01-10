//work on a lightweight javascript toolkit
//name ideas - hami

import ansi from 'node-ansi'
import fs from 'fs'
//import readline from 'readline'
//import {Writable} from 'stream'


/*
const ask = (()=>{
  var mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
      if (!this.muted)
        process.stdout.write(chunk, encoding);
      callback();
    }
  });

  var rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  return (question) => new Promise((res) => {
    mutableStdout.muted = false;
    rl.question(question, async function(input) {
      res(input)
      console.log('')
    });
  //mutableStdout.muted = true;
  })
})()
*/


let parse = line => {
  if (line.match(/^\s*\#/gim)) return undefined
  let [time, ...rest] = line.split(' ')
  let data = rest.join(' ')

  let num = parseFloat(time)
  let isMinutes = time.match(/m/)
  let isHM = time.match(':')
  if (isMinutes) {
    num = num/60
  }
  if (isHM) {
    let [hours,minutes] = time.split(':').map(v => parseFloat(v))
    num = hours+minutes/60
  }
  return {num, time, data}
}
let log_txt = fs.readFileSync('log').toString()
let log = fs.createWriteStream("log", {flags:'a'})

let report = async () => {

  console.log('Terminal size: ' + process.stdout.columns + 'x' + process.stdout.rows);
  ansi.gotoxy(31,41)
  ansi.write('CHARACTERS')
  ansi.gotoxy(42,42)
  ansi.write('CHARACTERS')
  ansi.gotoxy(1,process.stdout.rows)
  let input = await ask('> ')
  //let parsed = parse(input)
}

let buffer = ''
let consume = (out=buffer) => (buffer = '', out)

let main_loop = key => {
  //ctrl+c
  if ( key === '\u0003' ) {
    process.exit();
  }
  //enter
  if ( key.charCodeAt(0) === 13 ) {
    let input = consume()
    process.stdout.write('oh this is why')
    console.log("WHAT THE FUUUUCCCKKK")
    let lines = log_txt.split('\n').filter(a=>a)
    let parsed = lines.map(parse).filter(a=>a)

    let total = 4
    parsed.forEach(datum => {
      let {num,time,data} = datum
      let totalH = (total%24)
      let h = (''+(totalH|0)).padStart(2, '0')
      let m = '0'+Math.round((totalH%1)*60)
      console.log(`${h}:${m.slice(-2)} ${num.toFixed(1)}h ${data}`)
      total += num
    })
    let newHours = (4+parsed.map(v => v.num).reduce((a,b) => a+b))

    let start = new Date('1-1-2021')
    let time = new Date()
    let actualHours = (time-start)/(1000*60*60)
    let missing = actualHours-newHours
    console.log(`
hours:   ${actualHours.toFixed(2)}
logged:  ${newHours.toFixed(2)}
missing: ${missing.toFixed(2)}`
    )

    if (input.trim()) {
      log_txt += input+'\n'
      log.write(input+'\n')
    }
  }

  if ( key.charCodeAt(0) === 127 ) {
    buffer = buffer.slice(0,-1)
  } else {
    buffer += key
  }

  //ansi.gotoxy(1,process.stdout.rows)
  process.stdout.write(`
${key}  ${key.charCodeAt(0)}
> ${buffer}`)
  //control

}

let stdin = process.openStdin()
stdin.setRawMode(true)
stdin.resume()
stdin.setEncoding('utf8')

stdin.on('data', main_loop)

/*
(async ()=> {
  while (true) {
    await report()
  }
})()
*/
