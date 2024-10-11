const base_url = 'https://as-siteit-pru.azurewebsites.net/api'

function get(url) {
    return fetch( `${base_url}${url}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json;charset=UTF-8",
        "cli": "Web",
        "companyId": 917,
        "uid": 36,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjM2LCJuYW1lIjoiSmhvbiBSYW1vcyIsImlhdCI6MTY1NjYwMzc1MX0.J5mzfCQX-M2iNj6gou877-sR7hUtc_d8eZY0JVsM03E",
        "longitude": 0,
        "latitude": 0,
        "dataListPrizesArAround": true
      }
    })
}

function patch(url, data) {
    return fetch( `${base_url}${url}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json;charset=UTF-8",
        "cli": "Web",
        "companyId": 917,
        "uid": 770,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOjc3MCwibmFtZSI6IkFkaWRhcyIsImlhdCI6MTY1Njk2MTc1NH0.M__ntC_cKkDol59JNdLGhHRe-yY588IqK_Nfptaxc0Q",
        "longitude": 0,
        "latitude": 0,
        "dataCapturePrizeArAround": true
      }
    })
}

function getPrizes() {

  return new Promise((result, reject) => {

    get('/gaming/prizes/ar')
    .then(response => response.json())
    .then(json => result(json.data.list_prizes_ar))
    .catch(error => reject(error))

  })

}

function capturePrize(prize) {
  
  let data = {
    id: prize.id,
    state_id: 1,
    date_captured: new Date().getTime()
  }
  console.log(data);
  return new Promise((result, reject) => {

    patch('/gaming/prizes/ar', data)
      .then(response => response.json())
      .then(json => result(json))
      .catch(error => reject(error))

  })

}