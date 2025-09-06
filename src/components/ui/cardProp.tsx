import * as React from "react"
import FavIcon from '@assets/FavIcon.svg'
import Image from 'next/image';


function CardProp({ className, ...props }: React.ComponentProps<"div">) {
    return (
<div className="w-[175px] h-[167px] bg-[#D9D9D9] grid p-1.5 rounded-[10px] relative ">{/*Coisinho*/}
    <Image src={FavIcon} alt="FavoriteIcon" className="absolute right-2 top-3 h-[12px]"></Image>
    <div className="bg-white w-[163px] h-[107px] rounded-[10px] flex items-center justify-center"></div>
    <div className="bg-white w-[163px] h-[11px] rounded-[5px] text-[10px] flex items-center justify-start pl-1 mt-1.5 mb-1"></div>
    <div className="bg-white w-[95px] h-[11px] rounded-[5px] text-[10px] flex items-center justify-start pl-1 mb-1"></div>
    <div className="bg-white w-[95px] h-[11px] rounded-[5px] text-[10px] flex items-center justify-start pl-1 mb-1"></div>

</div>
    )
}

export{CardProp}