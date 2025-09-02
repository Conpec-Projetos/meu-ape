import { Oi } from "next/font/google";
import { Input } from "@/components/ui/input"
import Image from 'next/image';
import SearchIcon from '@assets/SearchIcon.svg'
import { DropdownCheckboxes } from "@/components/ui/dropdown-checkbox";
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
    
        
        <main>
            <header className="w-screen h-20 bg-gray-500 flex justify-center items-center">HEADER</header>

            <body>
               {/*Componentes de filtro (Search Input, Drop down de filtros*/}
                <div className="flex">
                    <div className="relative">
                    <Image src={SearchIcon} alt="SearchIcon" className="absolute w-6 h-6 top-1.5 left-2"/>
                    <Input/>
                    </div>
                        <DropdownCheckboxes label="Selecione seus filtros: " Name="Filtros (0)"/>
                         <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a fruit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                <SelectLabel>Filtros</SelectLabel>
                                <SelectItem value="apple">Apple</SelectItem>
                                <SelectItem value="banana">Banana</SelectItem>
                                <SelectItem value="blueberry">Blueberry</SelectItem>
                                <SelectItem value="grapes">Grapes</SelectItem>
                                <SelectItem value="pineapple">Pineapple</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                    </Select>

                </div>

            </body>

        </main>

);}