console.log("Server is live!")
let api = 'https://01.alem.school/api/graphql-engine/v1/graphql'

const getProgress = async(url) => {
  let query = `{
    progress(where: {user:{login:{_eq:"Kemalelee"}}}, offset:48){
        object{
        name
      }
      createdAt
      grade
    }
  }`

 let result = await fetch(`${api}`,{
  method: 'POST',
  headers: {'Content-Type' : 'application/json'},
  body: JSON.stringify({query: query})
  })
  .then(resp => resp.json())
  .catch(err=>{console.log('err:', err)})

  return result.data
}

const init = async () => {
  console.log(await getProgress(api))
}

init()
