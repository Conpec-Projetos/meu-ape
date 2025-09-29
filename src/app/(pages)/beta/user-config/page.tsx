"use client"

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { PasswordModal } from "@/components/passwordModal/passwordModal";
import {
        InputModal,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogOverlay,
        DialogPortal,
        DialogTitle,
        DialogTrigger,
} from "@/components/ui/user-config/InputModal";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DownloadIcon } from "lucide-react";


export default function UserConfig() {
        const [activeTab, setActiveTab] = React.useState("conta");

        return (

                <main className="flex flex-col h-max">
                        <div className="flex flex-col pt-1">

                                <div>
                                        <Button
                                                className={`cursor-pointer w-[120px] h-[29px] rounded-t-[8px] rounded-b-none shadow-[0px_4px_3px_rgba(0,0,0,0.45)] ${activeTab === "conta" ? "bg-[#DEDEDE] text-black" : "bg-gray-200 text-gray-500"}`}
                                                onClick={() => setActiveTab("conta")}
                                        >
                                                Conta
                                        </Button>
                                        <Button
                                                className={`cursor-pointer w-[120px] h-[29px] rounded-t-[8px] rounded-b-none shadow-[0px_4px_3px_rgba(0,0,0,0.45)] ${activeTab === "documentos" ? "bg-[#DEDEDE] text-black" : "bg-gray-200 text-gray-500"}`}
                                                onClick={() => setActiveTab("documentos")}
                                        >
                                                Documentos
                                        </Button>
                                </div>
                                <div className="w-screen h-[1px] bg-[#DEDEDE]"></div>

                        </div>

                        <div className="flex flex-col justify-center items-center pt-1.5">
                                        {activeTab === "conta" && (
                                                <>
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
                                                                <InputModal>
                                                                        <VisuallyHidden>
                                                                                <DialogTitle>Alterar Senha</DialogTitle>
                                                                        </VisuallyHidden>
                                                                        <DialogTrigger>Editar Senha</DialogTrigger>
                                                                        <DialogOverlay></DialogOverlay>
                                                                        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-[468px] h-[401px] max-w-md -translate-x-[51%] -translate-y-2/3 rounded-xl bg-[#B0B0B0] p-6 shadow-[0px_5px_2px_rgba(0,0,0,0.45)]">
                                                                                <div className="mt-4 flex flex-col gap-y-4 items-center">
                                                                                        <div>
                                                                                                <h1 className=" text-black mb-1">Senha atual</h1>
                                                                                                <Input className="w-[395px] rounded-lg bg-white" type="password" />
                                                                                        </div>
                                                                                        <div>
                                                                                                <h1 className="text-black mb-1">Senha nova</h1>
                                                                                                <Input className="w-[395px] rounded-lg bg-white" type="password" />
                                                                                        </div>
                                                                                        <div>
                                                                                                <h1 className="text-black mb-1">Confirmar senha nova</h1>
                                                                                                <Input className="w-[395px] rounded-lg bg-white" type="password" />
                                                                                        </div>
                                                                                        <div className="flex justify-center mt-4">
                                                                                                <Button className=" w-[100px] cursor-pointer bg-[#332475] hover:bg-[#422d94]">Salvar</Button>
                                                                                        </div>
                                                                                </div>
                                                                        </DialogContent>
                                                                </InputModal>
                                                        </div>
                                                        <div className="flex justify-evenly pt-8">
                                                                <Button className="bg-[#6049C7] w-[100px] hover:bg-[#4f39a8] cursor-pointer">Excluir Conta</Button>
                                                                <Button className="bg-[#6049C7] w-[100px] hover:bg-[#4f39a8] cursor-pointer">Salvar</Button>
                                                        </div>
                                </div>
                                                </>
                                        )}
                                        {activeTab === "documentos" && (
                                                <div className="flex flex-col gap-5 pl-20 items-start justify-center h-full w-full">
                                                        <h1 className="text-2xl text-[#4D4D4D]">RG ou CIN:</h1>
                                                        <DownloadIcon className="ml-10 text-[#4D4D4D] border-[#4D4D4D] border-3 border-dashed rounded-[10px] h-25 w-25"></DownloadIcon>
                                                        <h1 className="text-2xl text-[#4D4D4D]">Comprovante de endereço:</h1>
                                                        <DownloadIcon className="ml-10 text-[#4D4D4D] border-[#4D4D4D] border-3 border-dashed rounded-[10px] h-25 w-25"></DownloadIcon>

                                                        <h1 className="text-2xl text-[#4D4D4D]">Comprovante de renda:</h1>
                                                        <DownloadIcon className="ml-10 text-[#4D4D4D] border-[#4D4D4D] border-3 border-dashed rounded-[10px] h-25 w-25"></DownloadIcon>

                                                        <h1 className="text-2xl text-[#4D4D4D]">Certidão de casamento:</h1>
                                                        <DownloadIcon className="ml-10 text-[#4D4D4D] border-[#4D4D4D] border-3 border-dashed rounded-[10px] h-25 w-25"></DownloadIcon>
                                                        <Button className="bg-[#6049C7] w-[100px] hover:bg-[#4f39a8] cursor-pointer flex justify-center items-center">Salvar</Button>




                                                </div>
                                        )}
                        </div>

                </main>

        );
}