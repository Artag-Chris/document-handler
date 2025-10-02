



class ModuloService {
    private static instance: ModuloService;

    /**************************************************************************************************
      ejemplo de servicio
      
    ***************************************************************************************************/
    constructor() {

    }
    public static getInstance(): ModuloService {
        if (!ModuloService.instance) {
            ModuloService.instance = new ModuloService();

        }
        return ModuloService.instance;
    }


    async onSomething(payload: any) {
        const message = onSomethingMethod2(payload)
        return message
    }

}


export default ModuloService;

function onSomethingMethod2(payload: any) {
    console.log(`enviaron ${payload}`)
    return payload
}
