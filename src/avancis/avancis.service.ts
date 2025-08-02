
class AvancisService {
    private static instance: AvancisService;

    /**************************************************************************************************
     *Singleton de Servicio de Avancis 
      
    ***************************************************************************************************/
    constructor() {

    }
    public static getInstance(): AvancisService {
        if (!AvancisService.instance) {
            AvancisService.instance = new AvancisService();

        }
        return AvancisService.instance;
    }


    async sendHello(payload: any,) {
        const message = onSomethingMethod2(payload,)
        return message
    }

}


export default AvancisService;

function onSomethingMethod2(payload: any) {
    console.log(`enviaron ${payload}`)
    return payload
}
