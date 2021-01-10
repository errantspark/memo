import ansi from 'node-ansi'
import fs from 'fs'

//console.log('Terminal size: ' + process.stdout.columns + 'x' + process.stdout.rows)

let parse = line => {
  if (line.match(/^\s*\#/gim)) return undefined
  let [time, ...rest] = line.split(' ')
  let [data, tags] = rest.join(' ').split('|')
  tags = tags?tags.split(',').map(a=>a.trim()).filter(a=>a):[]
  if (data.match(/sleep/)) tags = ['sleep']


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
  return {num, time, data, tags}
}


//check if log exists
let log_file_name = 'log'
let log_exists = fs.existsSync(log_file_name)
if (!log_exists) {
  console.error('no log file present\ncreating dummy log file at ./log\nyou may edit this file as necessary')
  fs.writeFileSync('./log', `${new Date()-1000*60*60*4}
2h wasting time
0:45 exercise
1.3 video games`)
}

let loadLog = filename => {
  let log_txt = fs.readFileSync(filename).toString()
  let log = fs.createWriteStream(filename, {flags:'a'})
  let lines = log_txt.split('\n').filter(a=>a)
  let start = new Date(lines.shift()-0)

  return {log_txt, log, lines, start}
}

let {log_txt, log, lines, start} = loadLog(log_file_name)


let buffer = ''
let consume = (out=buffer) => (buffer = '', out)
let mode = 'normal_mode'
let modes = {}

let print_log = lines => {
  let parsed = lines.map(parse).filter(a=>a)

  let total = (start-new Date(new Date(start).toDateString()))/1000/60/60

  let report = parsed.map(datum => {
    let color = ''
    let {num,time,data,tags} = datum
    if (tags.length) color = ansi.fg.yellow
    if (tags[0] === 'sleep') color = ansi.fg.lightcyan
    let totalH = (total%24)
    let h = (''+(totalH|0)).padStart(2, '0')
    let m = '0'+Math.round((totalH%1)*60)
    total += num
    return `${color}${h}:${m.slice(-2)} ${num.toFixed(1)}h ${data}${ansi.normal}\n`
  })
  report/*.slice(-process.stdout.rows)*/.forEach(v => process.stdout.write(v))
  let newHours = (parsed.map(v => v.num).reduce((a,b) => a+b))

  let time = new Date()
  let actualHours = (time-start)/(1000*60*60)
  let missing = actualHours-newHours
  console.log(`
hours:   ${actualHours.toFixed(2)}
logged:  ${newHours.toFixed(2)}
missing: ${missing.toFixed(2)}`
  )
}

modes.normal_mode = (key, char) => {
  //enter
  if ( char === 13 ) {
    let input = consume()

    if (input.trim()) {
      lines.push(input)
      log_txt += input+'\n'
      log.write(input+'\n')
    }

    print_log(lines)
  }

  ansi.gotoxy(1,process.stdout.rows)
  ansi.clear()
  process.stdout.write(`> ${buffer}`)
}

modes.command_mode = (()=> {
  return (key, char) => {
    if (char === 13) {
      let input = consume()
      if (input.match(/x+/)) {
        let num = input.length
        process.stdout.write(`delete last ${num} entries: \n${lines.slice(-num).map((l,i) => `${i}: ${l}`).join('\n')}\n\n(Y/n)`)
        mode = 'interrupt'
        modes.interrupt = (key, char) => {
          if (char === 89 || char === 121 || char === 13) { // Y
            consume()
            lines.splice(-num)
            fs.writeFileSync('log', [start-0+'', ...lines].join('\n'))
            ;({log_txt, log, lines, start} = loadLog(log_file_name))
          } else {
            consume()
          }
          mode = 'normal_mode'
          modes.interrupt = undefined
          modes.normal_mode(null,13)
        }
      } else if (char === 25) {
      }    
    } else {
      ansi.gotoxy(1,process.stdout.rows)
      ansi.clear()
      process.stdout.write(`# ${buffer}`)
    }

  }
})()

modes.debug_mode = (key, char) => {
  process.stdout.write(`\nmode: ${mode}\nDEBUG: ${key}  ${char}\n`)
}

modes.tag = (() => {
  let cursor = lines.length-1
  return (key, char) => {
    //104 106 107 109 hjkl
    if ( char === 106) {
      cursor-- 
      if (cursor < 0) cursor = lines.length-1
    } else if (char === 107) {
      cursor = (cursor+1)%lines.length
    }
    let info = JSON.stringify(parse(lines[cursor]),null,2)
    ansi.gotoxy(1,process.stdout.rows-info.split('\n').length)
    ansi.clear()
    process.stdout.write(info)
  }
})()

let main_loop = key => {
  let char = key.charCodeAt(0)

  if (char === 127 ) {
    buffer = buffer.slice(0,-1)
  } else if (31 < char && char < 127) {
    buffer += key
  }

  //ctrl+c 
  if ( key === '\u0003' ) {
    process.stdout.write('\n\0')
    process.exit();
  } else  if ( char === 1) { //switch to command mode (ctrl+a)
    mode = 'command_mode'

  } else  if ( char === 2) { //switch to debug mode (ctrl+b)
    mode = 'debug_mode'

  } else if ( char === 27) { //switch back to normal mode (esc)
    consume()
    mode = 'normal_mode'
    char = 13
  } else if ( char === 17) {// print quick summary (ctr+q)
    mode = 'summary'
  } else if ( char === 20) {// print quick summary (ctr+t)
    mode = 'tag'
  }

  modes[mode](key, char)
}

let stdin = process.openStdin()
stdin.setRawMode(true)
stdin.resume()
stdin.setEncoding('utf8')

stdin.on('SIGTSTP',() => {
  stdin.setRawMode(false)
})
stdin.on('SIGCONT',() => {
  stdin.setRawMode(true)
})
stdin.on('data', main_loop)
print_log(lines)
process.stdout.write('> ')

/*
(async ()=> {
  while (true) {
    await report()
  }
})()
*/
