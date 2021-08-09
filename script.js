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
  
  for(let i = 0; i < response.length; i++) {
    const name = response[i].object.name
    const value = kv.get(name)

    if(!value) {
      kv.set(name, response[i])
      continue
    }
    
    if(response[i].amount > value.amount) {
      kv.set(name, response[i])
    }
  }

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


const conf = async () => {
 let progress = await getProgress()
 let transactions = await getTransanctions()

  // merge
  for(i in transactions) {
    for(j in progress) {
      if(transactions[i].object.name === progress[j].object.name) {
         projects.push({
          name:      progress[j].object.name,
          createdAt: progress[j].createdAt,
          amount:    transactions[i].amount
        })

        break
      }
    }
  }

 let sum = 0
 projects.forEach(e => sum += e.amount)
 console.log(sum)
}

conf()