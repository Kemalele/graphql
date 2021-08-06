const infoQuery = () => {
  return  `{
    progress(where: {user:{login: {_eq: "Kemalelee"}}, object: {type: {_eq: "project"}}, isDone: {_eq: true}}) {
      user {
        login
      }
      id
      grade
      object {
        type
        name
      }
  
       createdAt

    }
  }`
}


const  fetchInfo = async(query) => {
  const response = await fetch('https://01.alem.school/api/graphql-engine/v1/graphql', {
    method: 'POST',
    body: JSON.stringify({query: query})
  })
  const convertedRes = await response.json()
  return convertedRes.data.progress
}


const getInfo = async() => {
  const query = infoQuery()
  const response = await fetchInfo(query)

  return response
}

const removeInfoDuplicates = (response) => {
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


const conf = async () => {
  console.log(removeInfoDuplicates(await getInfo()))
}

conf()


console.log("Server is live!")
