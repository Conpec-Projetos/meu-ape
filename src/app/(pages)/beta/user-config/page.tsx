import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { PasswordModal } from "@/components/passwordModal/passwordModal";

export default function UserConfig(){
    return(
        
            <main className="flex flex-col h-max">
        <div className="flex flex-col pt-1">

                <div >
                        <Button className="cursor-pointer text-black w-[120px] h-[29px] bg-[#DEDEDE] rounded-t-[8px] rounded-b-none shadow-[0px_4px_3px_rgba(0,0,0,0.45)] ">Conta</Button>

                </div>
                <div className="w-screen h-[1px] bg-[#DEDEDE]"></div>
        
        </div>

        <div className="flex flex-col justify-center items-center pt-1.5">

        <div className="h-[567px] w-[510px] bg-[#D9D9D9] rounded-[20px] shadow-[0px_4px_3px_rgba(0,0,0,0.45)] ">
        
        <div className="pl-15 pt-6">

                <div className="flex flex-col items-start pt-2">
                        <h1 className="text-[#4D4D4D] text-[15px]">Nome Completo</h1>
                        <Input className=" pl-5 rounded-[10px] bg-white w-[390px] h-[43px]"></Input>
                </div>
                
                <div className="flex flex-col items-start pt-4">
                        <h1 className="text-[#4D4D4D] text-[15px]">Email</h1>
                        <Input className="pl-5 rounded-[10px] bg-white w-[390px] h-[43px] "></Input>
                </div>
                
                <div className="flex flex-col items-start pt-4">
                        <h1 className="text-[#4D4D4D] text-[15px]">Endereço</h1>
                        <Input className="pl-5 rounded-[10px] bg-white w-[390px] h-[43px] "></Input>
                </div>
                <div className="flex flex-col items-start pt-4">
                        <h1 className="text-[#4D4D4D] text-[15px]">CPF</h1>
                        <Input className="pl-5 rounded-[10px] bg-white w-[390px] h-[43px] "></Input>
                </div>
                <div className="flex flex-col items-start pt-4">
                        <h1 className="text-[#4D4D4D] text-[15px]">Telefone</h1>
                        <Input className="pl-5 rounded-[10px] bg-white w-[390px] h-[43px] "></Input>
                </div>
        </div>



        <div className="pl-15 pt-5">    
                <PasswordModal></PasswordModal>
        
        </div>
      
        <div className="flex justify-evenly pt-8">
                <Button className="bg-[#6049C7] w-[100px]  cursor-pointer">Excluir Conta</Button>
                <Button className="bg-[#6049C7] w-[100px]  cursor-pointer">Salvar</Button>
      
          </div>
      
        </div>



        </div>

            </main>

    );
}