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

  if(response.transaction.length < LIMIT) {
    break
  }
}

  transactions = removeTransanctionDuplicates(transactions)
  return transactions
}

const drawDot = (x,y,text) => {
  const svgns = "http://www.w3.org/2000/svg"
  let xpTimeGraph = document.getElementById("xptime")
  let dot = document.createElementNS(svgns, "circle" )

  dot.setAttributeNS(null,"cx", `${x}`)
  dot.setAttributeNS(null,"cy", `${y}`)
  dot.setAttributeNS(null,"r", "5")
  dot.setAttributeNS(null,"stroke", "black")
  dot.setAttributeNS(null,"stroke-width", "4")
  dot.setAttributeNS(null,"fill", "blue")

  dot.textContent = text
  xpTimeGraph.appendChild(dot)
}

const drawXPTime = () => {
  const LOWEST_X = 13, LOWEST_Y = 390 
  const FIRST_STAMP = new Date(projects[0].createdAt).getTime()
  let sumXP = 0

  // console.log(lastStamp - firstStamp)
  projects.forEach(e => {
    sumXP += e.amount
    let date = new Date(e.createdAt).getTime()
    let x = LOWEST_X + (date - FIRST_STAMP) / 100000000
    let y = LOWEST_Y - sumXP / 1500
    
    drawDot(x,y, e.name)
  })

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
}

document.addEventListener("DOMContentLoaded", () => {
  conf()
});

