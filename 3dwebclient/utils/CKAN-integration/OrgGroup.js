class OrgGroup{
    constructor(orga, datasetArray){
        this.organization=orga;
        this.datasetArray=datasetArray;
    }

    getDataset(id){
        for (let index = 0; index < this.datasetArray.length; index++) {
            const dataset = this.datasetArray[index];
            if(dataset.id==id){
                return dataset
            }
            
        }
        return -1;
    }
    
}