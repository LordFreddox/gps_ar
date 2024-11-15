const base_url = 'https://as-siteit-pru.azurewebsites.net/api'

function get(url: string, uid: string, companyId: string) {
    return fetch( `${base_url}${url}`, {
      method: "GET",
      headers: {
        "Content-type": "application/json;charset=UTF-8",
        "cli": "PUnity",
        "companyId": companyId,
        "uid": uid,
        "dataListPrizesArAround": "true"
      }
    })
}

function patch(url: string, uid: string, companyId: string, data: any) {
    return fetch( `${base_url}${url}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-type": "application/json;charset=UTF-8",
        "cli": "PUnity",
        "companyId": companyId,
        "uid": uid,
        "dataCapturePrizeArAround": "true"
      }
    })
}

function GetPrizes(uid: string, companyId: string): Promise<Prizes> {
  return new Promise((result, reject) => {
    get('/gaming/prizes/ar', uid, companyId)
    .then(response => response.json())
    .then(json => result(json.data))
    .catch(error => reject(error))
  })
}

function CapturePrize(uid: string, companyId: string, prize: ListPrizesAr) {
  let data = {
    id: prize.id,
    state_id: 1,
    date_captured: prize.uuid_event
  }
  return new Promise((result, reject) => {
    patch('/gaming/prizes/ar', uid, companyId, data)
      .then(response => response.json())
      .then(json => result(json))
      .catch(error => reject(error))
  })
}

export interface ListPrizesAr {  
  id: number,
  company_id: number,
  object_class: number,
  object_type: number,
  title: string,
  title_captured: string,
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

export interface PrizesAndPoints{
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
  detailsEvent: DetailsEvent[],
  prizesAndPoints: PrizesAndPoints[],
  brand: Brand,
}

export { GetPrizes, CapturePrize }