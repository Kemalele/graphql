const LOWEST_X = 13, LOWEST_Y = 390 
let projects = []

const fetchQuery = async(query) => {
 const response = await fetch('https://01.alem.school/api/graphql-engine/v1/graphql', {
    method: 'POST',
    body: JSON.stringify({query: query})
  })
  const convertedRes = await response.json()

  return convertedRes.data
}

const removeProgressDuplicates = (response) => {
  let result = []
  for(let i = 0; i < response.length; i++) {
    let found = false

    for(let j = 0; j < result.length; j++) {
      if (response[i].object.name === result[j].object.name) {
        found = true
      }
    }

    if(!found) { 
      result.push(response[i])
    }
  }

  return result
}

const removeTransanctionDuplicates = (response) => {
  const kv = new Map()
  
  response.forEach((e) => {
    const value = kv.get(e.object.name)

    if(!value) {
      kv.set(e.object.name, e)
      return
    }
    
    if(e.amount > value.amount) {
      kv.set(e.object.name, e)
    }
  })

  return Array.from(kv.values())
}

const getProgress = async() => {
  const query = `{
    progress(where: {user:{login: {_eq: "Kemalelee"}}, object: {type: {_eq: "project"}}, isDone: {_eq: true}}) {
      object {
        name
      }
      createdAt
    }
  }`

  let progress = await fetchQuery(query)
  progress = removeProgressDuplicates(progress.progress)
   
  return progress
}

// getTransanctions
const getTransanctions = async() => {
  const LIMIT = 50
  let transactions = []
  let offset = 0

  while(true) {
    const query = `{
      transaction(where: {user:{login:{_eq:"Kemalelee"}}, type: {_eq: "xp"},object: {type: {_eq: "project"}}}, offset: ${offset}) {
        object {
          name
        }
        amount
        createdAt
      }
    }`

    const response = await fetchQuery(query)
    transactions.push(...response.transaction)
    offset += LIMIT

    if(response.transaction.length < LIMIT)  break
  }

  transactions = removeTransanctionDuplicates(transactions)
  return transactions
}

// const drawCircle = 

const drawDot = (x,y,text,graph) => {
  const svgns = "http://www.w3.org/2000/svg"
  let dot = document.createElementNS(svgns, "circle" )

  dot.setAttributeNS(null,"cx", `${x}`)
  dot.setAttributeNS(null,"cy", `${y}`)
  dot.setAttributeNS(null,"r", "5")
  dot.setAttributeNS(null,"stroke", "black")
  dot.setAttributeNS(null,"stroke-width", "4")
  dot.setAttributeNS(null,"fill", "blue")

  dot.textContent = text
  dot.id = text

  graph.appendChild(dot)
}

const drawDates = (graph) => {
  const kv = new Map()

  projects.forEach(e => {
    let date = new Date(e.createdAt)
    let year = date.getFullYear().toString().substr(-2)
    let month = `0${date.getMonth() + 1}`
    let monthYear = `${month}/${year}`

    if(!kv.get(monthYear)) {
      let circleX = graph.querySelector('#' + e.name).getBoundingClientRect().left
      let dateElem = document.createElement("div")

      dateElem.setAttribute("class", "date")
      dateElem.innerText = monthYear
      dateElem.style.left = Math.floor(circleX).toString() + 'px'

      document.body.appendChild(dateElem)
      kv.set(monthYear,true)
    }
  })
}

const drawXP = (graph) => {
  let sum = 0
  let prev = 0
  let XP_DIFF = 10000
  // console.log(graph.id)
  projects.forEach(e => {
    prev = sum
    sum += e.amount

    if (sum - prev < XP_DIFF) return
    // console.log()
    let circleY = graph.querySelector('#' + e.name).getBoundingClientRect().top
    let circleX = graph.querySelector('#' + 'vertical').getBoundingClientRect().left

    let xpElem = document.createElement("div")
    // return
    xpElem.setAttribute("class", "xp")
    xpElem.style.top = Math.round(circleY).toString() + 'px'
    xpElem.style.left = Math.round(circleX + 15).toString() + 'px'

    xpElem.innerText = sum

    document.body.appendChild(xpElem)
  })
  
}

const drawXPProject = () => {
  let xpTimeProject = document.getElementById("xpproject")
  console.log('here')

  drawDots(xpTimeProject)
  drawXP(xpTimeProject)
  drawDates(xpTimeProject)
}

const drawDots = (graph) => {
  let sumXP = 0

  projects.forEach(e => {
    // difference between first done and current project
    let diff = diffInDays(e.createdAt, projects[0].createdAt)
    let xpInKB = sumXP / 1024
    sumXP += e.amount
    
    drawDot(LOWEST_X + diff, LOWEST_Y - xpInKB, e.name, graph)
  })
}

const drawXPTime = () => {
  let xpTimeGraph = document.getElementById("xptime")
  
  drawDots(xpTimeGraph)
  drawXP(xpTimeGraph)
  drawDates(xpTimeGraph)
}

// returns difference in days between two timeStamps
const diffInDays = (a,b) => {
  let diffInTime = new Date(a) - new Date(b)
  return diffInTime / (1000 * 3600 * 24)
}

const conf = async () => {
  let progress = await getProgress()
  let transactions = await getTransanctions()

  // merge
  transactions.forEach((t) => {
    progress.forEach((p) => {
      if (t.object.name === p.object.name) {
        projects.push({
          name:      p.object.name,
          createdAt: p.createdAt,
          amount:    t.amount
        })
        return
      }
    })
  })

  projects.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))
  
  drawXPTime()
  drawXPProject()
}

document.addEventListener("DOMContentLoaded", () => {
  conf()
});