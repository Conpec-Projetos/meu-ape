import React from "react"

type CardReservationProps = {
    status: string;
    empreendimento: string;
    nome: string;
};

export default function CardReservation({ status, empreendimento, nome }: CardReservationProps) {
    let statusclass = ""
    if (status==="Aguardo") statusclass = 'bg-yellow-200';
    else if (status==="Confirmado") statusclass = 'bg-green-300'
    else if (status==='Recusado') statusclass = 'bg-red-400'

    return (
        <div className="h-40 w-[75%] flex flex-row bg-[#F2F2F2] rounded-lg mt-3 mb-3"> 
            <div className="h-full w-[25%] relative">
                <span className={`${statusclass} rounded-xl px-3 py-1 absolute mt-4 ml-4 font-medium`}> {status} </span>
            </div>
            <div className="h-full w-[75%] flex flex-row justify-center gap-20">
                <div className="flex flex-col"> 
                <span className="mt-22 font-medium"> Empreendimento: </span>
                <div className="mt-auto mb-4 h-7 w-80 bg-white rounded-lg flex items-center"> <span className="ml-3">{empreendimento}</span> </div>
                </div>
            
                <div className="flex flex-col">
                    <span className="mt-22 font-medium"> Solicitante: </span>
                    <div className="mt-auto mb-4 h-7 w-80 bg-white rounded-lg justify-center items-center"> <span className="ml-3">{nome}</span> </div>
                </div>
            
            </div>
        </div>
    )
}