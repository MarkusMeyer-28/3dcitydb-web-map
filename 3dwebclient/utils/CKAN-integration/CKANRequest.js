const getBtn = document.getElementById('ckan_get_btn');
//const url = 'https://catalog.gis.lrg.tum.de/dataset?q=&sort=score+desc%2C+metadata_modified+desc&ext_bbox=10.079956054687502%2C48.60113322190171%2C12.661743164062502%2C49.60092047614837&ext_prev_extent=9.777832031250002%2C48.378145469762444%2C12.974853515625002%2C49.816720843571765';
//const url ='https://catalog.gis.lrg.tum.de/dataset?sort=score+desc%2C+metadata_modified+desc&ext_bbox=10.079956054687502%2C48.60113322190171%2C12.661743164062502%2C49.60092047614837&ext_prev_extent=9.777832031250002%2C48.378145469762444%2C12.974853515625002%2C49.816720843571765&q=&organization=bayerische-vermessungsverwaltung'




const getDatasets = function () {

  const url = document.getElementById('urlCKAN').value;
  // const packageUrl=url+"/api/3/action/current_package_list_with_resources";
  const packageUrl = url + "/api/3/action/package_list";

  sendHttpRequest('GET', packageUrl).then(responseData => {

    //result= parseResponse(responseData);
    console.log(responseData.result);
    for (let index = 0; index < responseData.result.length; index++) {
      const tempUrl = url + "/api/3/action/package_show?id=" + responseData.result[index];
      
      sendHttpRequest('GET', tempUrl).then(responseData => {
        
        console.log(responseData.result);
      });
    }
  });






};
const sendHttpRequest = (method, url, data) => {
  const promise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    xhr.responseType = 'json';

    if (data) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    xhr.onload = () => {
      if (xhr.status >= 400) {
        reject(xhr.response);
      } else {
        resolve(xhr.response);
      }
    };

    xhr.onerror = () => {
      reject('Something went wrong!');
    };

    xhr.send(JSON.stringify(data));
  });
  return promise;
};
const parseResponse = (data) => {
  //parser = new DOMParser();
  console.log(data);
  const object = JSON.parse(data);
  result = object.result;
  //result=result.resolve;
  console.log(result);

  return result;

  // document.getElementById('txt').innerHTML= title[5];
};


getBtn.addEventListener('click', getDatasets);


