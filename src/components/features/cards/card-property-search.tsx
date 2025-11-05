import calendarIcon from "@assets/calendarIcon.svg";
import clockIcon from "@assets/clockIcon.svg";
import FavIcon from "@assets/FavIcon.svg";
import mapIcon from "@assets/mapIcon.svg";
import moradiaPH from "@assets/moradia_placeholder.svg";
import Image from "next/image";
import * as React from "react";

interface cardProps {
    title: string;
    deadline: string;
    launch: string;
    address: string;
}

type Props = cardProps & React.ComponentPropsWithoutRef<"div">;

export function CardProp({ title, deadline, launch, address }: Props) {
    return (
        <div className="w-[262px] bg-white grid grid-rows-[160px_auto] p-2 rounded-xl relative shadow-lg border border-gray-100">
            {/* Icone favorito */}
            <div className="absolute right-4 top-4 bg-white/70 backdrop-blur-sm p-1.5 rounded-full cursor-pointer hover:scale-110 transition-transform z-10">
                <Image src={FavIcon} alt="Favorite Icon" className="h-4 w-4 text-gray-500" />
            </div>

            {/* IMAGEM IMOVEL, atualmente placeholder, eventualmente fazer conexão com Firebase ou sla como vai ser*/}
            <Image src={moradiaPH} alt="Moradia Placeholder" className="w-full h-full object-cover rounded-lg" />

            {/* Container dos textos */}
            <div className="flex flex-col pt-2 overflow-hidden">
                {/* Titulo */}
                <div className="text-base font-semibold leading-tight text-gray-800 truncate" title={title}>
                    {title}
                </div>

                {/* Detalhes (Prazo,lançamento e endereço) */}
                <div className="flex flex-col mt-1.5 space-y-1">
                    <div className="text-xs text-gray-500 flex gap-1.5 items-center">
                        <Image src={clockIcon} alt="Clock Icon" className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Prazo: {deadline}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1.5 items-center">
                        <Image src={calendarIcon} alt="Calendar Icon" className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Lançamento: {launch}</span>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1.5 items-start">
                        <Image src={mapIcon} alt="Map Icon" className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                        <span>{address}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
