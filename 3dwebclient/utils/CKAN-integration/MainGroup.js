class MainGroup{
    constructor(name, datasetArray){
        this.name=name;
        this.datasetArray=datasetArray;
        this.expanded=true;
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
    setExpanded(expanded){
        this.expanded=expanded;
    }
}