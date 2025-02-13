const base_url = 'https://as-ws-siteit-test.azurewebsites.net/api'

function get(url: string, userId: string, placeId: string, isAround: boolean) {
  if (isAround) {
    return fetch(`${base_url}${url}`, {
      method: "GET",
      headers: {
        "cli": "PUnity",
        "dataListPrizesArAround": "true",
        "uid": userId,
        "companyId": placeId
      }
    })
  } else {
    return fetch(`${base_url}${url}`, {
      method: "GET",
      headers: {
        "cli": "PUnity",
        "dataListPrizesArGS": "true",
        "uid": userId,
        "companyId": placeId
      }
    })
  }
}

function patch(url: string, data: any, userId: string, placeId: string, isAround: boolean) {
  if (isAround) {
    return fetch(`${base_url}${url}`, {
      method: "PATCH",
      body: data,
      headers: {
        "cli": "PUnity",
        "companyId": placeId,
        "uid": userId,
        "dataCapturePrizeArAround": "true"
      }
    })
  } else {
    return fetch(`${base_url}${url}`, {
      method: "PATCH",
      body: data,
      headers: {
        "cli": "PUnity",
        "companyId": placeId,
        "uid": userId
      }
    })
  }
}

function GetPrizesAround(uid: string, companyId: string, isAround: boolean): Promise<Prizes> {
  return new Promise((result, reject) => {
    get('/gaming/prizes/ar', uid, companyId, isAround)
      .then(response => response.json())
      .then(json => result(json.data))
      .catch(error => reject(error))
  })
}

function GetPrizesGS(uid: string, companyId: string, isAround: boolean): Promise<Prizes> {
  return new Promise((result, reject) => {
    get('/gaming/prizes/ar-gs', uid, companyId, isAround)
      .then(response => response.json())
      .then(json => result(json.data))
      .catch(error => reject(error))
  })
}

function CapturePrizeAround(userId: string, placeId: string, prize: ListPrizesAr, isAround: boolean): Promise<any> {
  let bodyCapturePrize: BodyCapturePrizeAround = { 
    id: prize.id.toString(), 
    state_id: 1,
    uuid_event: prize.uuid_event
  };

  return new Promise((result, reject) => {
    patch('/gaming/prizes/ar', JSON.stringify(bodyCapturePrize), userId, placeId, isAround)
      .then(response => response.json())
      .then(json => result(json))
      .catch(error => reject(error))
  })
}

function CapturePrizeGS(userId: string, placeId: string, prize: ListPrizesAr, isAround: boolean): Promise<any> {
  let bodyCapturePrize: BodyCapturePrizeGS = { 
    uuid_event: prize.uuid_event, 
    prizeId: prize.id.toString(), 
    action: 1, 
    companyId: parseInt(placeId)
  };

  return new Promise((result, reject) => {
    patch('/gaming/prizes/ar-gs', JSON.stringify(bodyCapturePrize), userId, placeId, isAround)
      .then(response => response.json())
      .then(json => result(json))
      .catch(error => reject(error))
  })
}

interface BodyCapturePrizeAround {
  id: string, //id prize for around
  state_id: number, //state capture 1 for around
  uuid_event: string,
}

interface BodyCapturePrizeGS {
  prizeId: string, //id prize for GS
  companyId: number,
  action: number, //state capture 1 for GS
  uuid_event: string,
}

export interface ListPrizesAr {
  id: number,
  company_id: number,
  radio: number,
  object_class: number,
  object_type: number,
  title: string,
  title_captured: string,
  latitude: number,
  longitude: number,
  state_id: number,
  fake: number,
  active: boolean,
  url: string,
  url3d: string,
  uuid_event: string,
  value_score: number,
}

export interface DetailsEvent {
  descriptionEvent: string,
  idEvent: string,
  prizeLimit: number,
}

export interface PrizesAndPoints {
  mensajePremio: string,
  idEvent: string,
  puntosPremio: number,
  fechaCapturadoPremio: string,
  fechaRedimidoPremio: string,
  nombrePremio: string,
}

export interface Brand {
  name: string,
  color: string,
  logo: string,
}

export interface Prizes {
  list_prizes_ar: ListPrizesAr[],
  list_prizes_ar_gs: ListPrizesAr[],
  detailsEvent: DetailsEvent[],
  prizesAndPoints: PrizesAndPoints[],
  brand: Brand,
}

export { GetPrizesAround, GetPrizesGS, CapturePrizeAround, CapturePrizeGS }