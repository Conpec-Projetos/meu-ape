import { Input } from "@/components/ui/input"
import Image from 'next/image';
import SearchIcon from '@assets/SearchIcon.svg'
import { DropdownCheckboxes } from "@/components/features/dropdowns/dropdown-checkbox";
import MapVector from '@assets/MapVector.svg'

import { CardProp } from "@/components/features/cards/card-property-search";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import React from "react";

export default function PropertySearch(){

{/*MUDANÇAS A FAZER:

    -Organização do codigo

    FUNCIONAIS:
    1-Select com estado inicial correto, atualmente o placeholder não é igual ao selecionado
    2-DropDown com nome que reflete a quantidade de filtros ativos
    3- Filtros funcionais**

    DESIGN:
    1-Ajustar tamanhos e posições
    2-Fidelidade visual (design igual e etc)
    
    
    */}


    return(
    
        
        <main className="bg-[#F2F2F2] overflow-hidden flex flex-col h-screen">
            <header className="w-screen h-20 bg-gray-500 flex justify-center items-center">HEADER PLACEHOLDER</header>

            <body>
               {/*
               Adicionar a logica de filtro e pesquisa
               */}
                <div className="flex p-3 pl-10 gap-10">
                    <div className="relative">
                    <Image src={SearchIcon} alt="SearchIcon" className="absolute w-6 h-6 top-1.5 left-2"/>
                    <Input/>
                    </div>
                        {/*
                        Implementar toda a logica de filtro
                        Adicionar Dinamismo pro name Filtros com Typescript
                        Possivelmente só fechar quando o usuario clica fora?
                        */}
                        <DropdownCheckboxes label="Selecione seus filtros: " Name="Filtros (0)"/>
                            {/*
                            Implementar toda a logica de filtro
                            Iniciar com o Mais Relevantes selecionado
                            */}
                         <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Mais relevantes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                <SelectLabel>Filtros</SelectLabel>
                                <SelectItem value="apple">Mais relevantes</SelectItem>
                                <SelectItem value="banana">...</SelectItem>
                                <SelectItem value="blueberry">....</SelectItem>
                                <SelectItem value="grapes">.....</SelectItem>
                                <SelectItem value="pineapple">......</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                    </Select>

                </div>
                            

    


                <div className="flex p-5 flex-grow overflow-hidden">{/*
                Todo o body não relacionado a filtros e pesquisa abaixo:
                Colocar a logica de imagem e pá, nem sei exatamente oq é pra aparecer aqui, perguntar*/}
                <div className="h-[502px] w-[502px] bg-[#D9D9D9] rounded-[15px] flex justify-center items-center">
                    <Image src={MapVector} alt="MapVector" className="h-[62px]"></Image></div>
                            {/*
                            Fazer um scroll funcional nékkkkkk
                            */}
                <div className="w-[16px] h-[556px] bg-[#D9D9D9] rounded-[7px] flex justify-center items-start pt-2 m-1"> 
                    <div className="h-[123px] w-[12px] bg-white rounded-[7px]">


                    </div>
                </div>
                

                <div className="h-full overflow-y-auto">

                <div className="grid grid-cols-2 grid-rows-3 gap-1.5">
                    {/*
                    Criar um componente melhor, com mais dinamismo.
                    Ex: Props de Nome, imagem, descrição e etc. */}
                    {Array.from({ length: 12 }).map((_, index) => (
                        <CardProp 
                        key={index}
                        title={`Moradia estudantil - Bloco ${index + 1}`}
                        deadline="10/09/2028"
                        launch="10/09/2025"
                        address="Av. Santa Isabel, 1125 - Vila Santa Isabel - Campinas"
                        />
                    ))}
                    </div>

                </div>

                    
                </div>
            </body>

        </main>

);}