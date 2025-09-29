"use client";
import {
    ban,
    bed,
    fulls,
    heart,
    heart2,
    i3d,
    imv1,
    imv2,
    imv3,
    mapa,
    photo,
    setadir,
    setaesq,
    size,
    suite,
} from "@/assets";
import Unidade from "@/components/features/specifics/view-property-block";
import Image from "next/image";
import { useState } from "react";

const slides = [imv1, imv2, imv3];

const units = 9;

const fav = [heart, heart2];

export default function ViewPropertyPage() {
    const [current, setCurrent] = useState(0);
    const [expanded, setExpanded] = useState(false);
    const [favorite, setFavorite] = useState(false);


    return (
        <main className="min-h-screen w-full bg-white flex flex-col items-center gap-12 px-4 py-6">
            {/* Carrossel */}
            <div className="flex flex-col md:flex-row justify-center items-center w-full max-w-7xl gap-4 relative">
                {/* Central card */}
                <div className="relative bg-secondary h-72 sm:h-96 w-[90%] md:w-[80%] lg:w-[72%] rounded-2xl overflow-hidden">
                    <div
                        className="flex transition-transform duration-700 ease-in-out h-full"
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {slides.map((slide, index) => (
                            <div key={index} className="relative flex-shrink-0 w-full h-full">
                                <Image src={slide} alt={`slide ${index}`} fill className="object-cover rounded-2xl" />
                            </div>
                        ))}
                    </div>

                    {/* Arrows */}
                    <button
                        onClick={() => setCurrent((current - 1 + slides.length) % slides.length)}
                        className="absolute top-1/2 left-3 -translate-y-1/2 z-10"
                    >
                        <div className=" h-10 w-10 md:w-15 md:h-15 bg-white/30 rounded-full">
                            <Image src={setaesq} alt="seta esquerda" width={60} height={40} />
                        </div>
                    </button>
                    <button
                        onClick={() => setCurrent((current + 1) % slides.length)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 z-10"
                    >
                        <div className=" h-10 w-10 md:w-15 md:h-15 bg-white/30 rounded-full">
                            <Image src={setadir} alt="seta direita" width={60} height={40} />
                        </div>
                    </button>

                    {/* Botão de fotos */}
                    <button className="h-8 w-1/4 sm:h-10 px-3 sm:px-4 bg-primary text-white rounded-md flex justify-center items-center border border-white relative ml-2 mb-2 overflow-hidden text-xs sm:text-sm">
                        <Image src={photo} alt="photo" fill className="object-contain absolute top-0 left-0" />
                        <span className="relative z-10">{slides.length} fotos</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center w-full max-w-7xl gap-8">
                <div className="flex flex-col w-full lg:w-3/5 gap-8">
                    {/* Units */}
                    <div className="w-full flex flex-col justify-center items-center">
                        {Array.from({ length: Math.min(units, 5) }).map((_, index) => (
                            <Unidade key={index} tipo={index === 0 ? "top" : "middle"} />
                        ))}

                        {/* Expanded units*/}
                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out w-full flex flex-col items-center`}
                            style={{ maxHeight: expanded ? `${(units - 5) * 64}px` : "0px" }}
                        >
                            {Array.from({ length: Math.max(units - 5, 0) }).map((_, index) => (
                                <Unidade key={index + 5} tipo="middle" />
                            ))}
                        </div>

                        {units > 5 && (
                            <div className="h-10 w-full bg-secondary flex justify-center items-center border-white rounded-b-lg border-1">
                                <button
                                    className="w-[40%] h-4 border-2 border-white rounded-3xl bg-primary"
                                    onClick={() => setExpanded(!expanded)}
                                ></button>
                            </div>
                        )}
                    </div>

                    {/* Specifications */}
                    <div className="w-full bg-secondary rounded-lg flex flex-col p-4">
                        <div className="w-fit px-3 py-1 border border-white rounded-4xl bg-primary text-white font-bold mb-4">
                            Especificações
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 place-items-center">
                            <div className="h-10 w-24 bg-transparent rounded-md border-primary border-[3px] flex justify-center items-center relative ">
                                <Image src={size} alt="size" fill className=" object-contain absolute inset-0" />
                                <span className="z-10">XX m²</span>
                            </div>
                            <div className="h-10 w-24 bg-transparent rounded-md border-primary border-[3px] flex justify-center items-center relative ">
                                <Image src={ban} alt="banheiro" fill className="object-contain absolute inset-0" />
                                <span>X banheiros</span>
                            </div>
                            <div className="h-10 w-24 bg-transparent rounded-md border-primary border-[3px] flex justify-center items-center relative ">
                                <Image src={bed} alt="quartos" fill className="object-contain absolute inset-0" />
                                <span>X quartos</span>
                            </div>
                            <div className="h-10 w-24 bg-transparent rounded-md border-primary border-[3px] flex justify-center items-center relative ">
                                <Image src={suite} alt="suite" fill className="object-contain absolute inset-0" />
                                <span>X suítes</span>
                            </div>
                            <div className="h-10 w-24 bg-transparent rounded-md border-primary border-[3px] flex justify-center items-center relative ">
                                <Image src={suite} alt="suite" fill className="object-contain absolute inset-0" />
                                <span>X suítes</span>
                            </div>
                            <div className="h-10 w-24 bg-transparent rounded-md border-primary border-[3px] flex justify-center items-center relative ">
                                <Image src={suite} alt="suite" fill className="object-contain absolute inset-0" />
                                <span>X suítes</span>
                            </div>
                        </div>
                        <span className="w-fit py-1 font-bold border-1 rounded-xl mt-15 text-white px-4 border-white bg-primary">
                            {" "}
                            Descrição do imóvel
                        </span>
                        <span className="mt-4">
                            {" "}
                            &nbsp; Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor
                            in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
                            sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                            laborum.
                        </span>
                    </div>
                </div>

                {/* Right card */}
                <div className="w-full lg:w-2/5 flex flex-col gap-4 h-fit justify-center items-center bg-secondary rounded-xl p-4">
                    <button
                        className={`h-10 w-10 rounded-full ml-auto flex mb-auto justify-center items-center bg-white transition-colors duration-400 ${
                            favorite ? "border-2 border-primary" : "border border-transparent"
                        }`}
                        onClick={() => setFavorite(!favorite)}
                    >
                        <Image
                            src={favorite ? fav[1] : fav[0]}
                            alt="coração"
                            width={24}
                            height={24}
                            className={`transition-transform duration-300 ${
                                favorite ? "scale-110" : "scale-100"
                            } transition-opacity duration-300
            ${favorite ? "opacity-100" : "opacity-50"}`}
                        />
                    </button>
                    <div className="rounded-4xl bg-white h-5 w-[95%]"></div>
                    <div className="rounded-4xl bg-white h-5 w-[95%]"></div>
                    <div className="rounded-4xl bg-white h-5 w-[95%]"></div>
                    <div className="rounded-4xl w-[95%] h-[2px] bg-gray-400"></div>
                    <button className="rounded-xl py-2 px-4 w-[40%] lg:w-[80%]  bg-primary text-white font-semibold">
                        A partir de R$XXX,XX
                    </button>
                    <button className="rounded-xl py-3 w-[40%] lg:w-[80%] bg-primary text-white font-bold mt-4">
                        Reserva
                    </button>
                    <button className="rounded-xl py-2 w-[30%] lg:w-[70%] bg-primary text-white font-semibold mt-2">
                        Visita
                    </button>
                    <Image src={mapa} alt="mapa" className="w-70 lg:w-80 rounded-xl border-2 border-primary"></Image>
                </div>
            </div>

            {/* 3D */}
            <div className="w-full max-w-5xl flex flex-row aspect-video bg-secondary rounded-lg relative">
                <Image src={i3d} alt="3d" fill className="rounded-lg object-cover" />
                <div className="absolute inset-0 flex justify-between items-end p-2">
                    <Image src={fulls} alt="fullscreen" width={30} height={30} className="bg-secondary rounded-lg" />
                    <div className="h-12 w-7 bg-secondary rounded-sm flex flex-col justify-center items-center relative">
                        <button className="h-1/2 w-full flex justify-center items-center text-xl font-bold text-primary">
                            +
                        </button>
                        <div className="w-[80%] h-0.5 rounded-full opacity-30 absolute top-1/2 bg-black"></div>
                        <button className="h-1/2 w-full flex justify-center items-center text-2xl font-bold text-primary">
                            -
                        </button>
                    </div>
                </div>
            </div>

            {/* Final images */}
            <div className="w-full h-auto max-w-5xl bg-secondary rounded-lg flex flex-col sm:flex-row justify-evenly items-center gap-4 relative p-4">
                <span className="absolute top-3 left-5 bg-primary text-white px-4 py-1 rounded-xl border border-white font-medium">
                    Imóveis relevantes
                </span>

                {/* Imagem 1 */}
                <div className="flex flex-col mt-12 items-center">
                    <Image src={imv2} alt="imv2" width={230} height={120} className="rounded-md object-cover" />
                    <span className="mt-2 text-sm text-black font-medium text-center">
                        Imóvel XXXXXXXXXX - R$500.000,00
                    </span>
                </div>

                {/* Imagem 2 */}
                <div className="flex flex-col mt-12 items-center">
                    <Image src={imv3} alt="imv3" width={230} height={120} className="rounded-md object-cover" />
                    <span className="mt-2 text-sm text-black font-medium text-center">
                        Imóvel YYYYYYYYYY - R$650.000,00
                    </span>
                </div>

                {/* Imagem 3 */}
                <div className="flex flex-col mt-12 items-center">
                    <Image src={imv2} alt="imv2" width={230} height={120} className="rounded-md object-cover" />
                    <span className="mt-2 text-sm text-black font-medium text-center">
                        Imóvel ZZZZZZZZZZ - R$700.000,00
                    </span>
                </div>
            </div>
        </main>
    );
}
