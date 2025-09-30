"use client"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React from "react";
import { PasswordModal } from "@/components/passwordModal/passwordModal";
import {
        Dialog,
        DialogClose,
        DialogContent,
        DialogDescription,
        DialogFooter,
        DialogHeader,
        DialogOverlay,
        DialogPortal,
        DialogTitle,
        DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DownloadIcon } from "lucide-react";


export default function UserConfig() {
        const [activeTab, setActiveTab] = React.useState("conta");

        return (

                <main className="flex-grow bg-gray-50">
                        <div className="flex flex-col pt-15">

                                <div className="">
                                        <Button
                                                className={`rounded-b-none cursor-pointer w-[120px] h-[29px] ${activeTab === "conta" ? "rounded-t-[8px]  shadow-[0px_4px_3px_rgba(0,0,0,0.45)] bg-[#DEDEDE] text-black" : "bg-background text-gray-500"}`}
                                                onClick={() => setActiveTab("conta")}
                                        >
                                                Conta
                                        </Button>
                                        <Button
                                                className={`rounded-b-none cursor-pointer w-[120px] h-[29px] ${activeTab === "documentos" ? "rounded-t-[8px]  shadow-[0px_4px_3px_rgba(0,0,0,0.45)] bg-[#DEDEDE] text-black" : "bg-background text-gray-500"}`}
                                                onClick={() => setActiveTab("documentos")}
                                        >
                                                Documentos
                                        </Button>
                                </div>
                                <div className="w-screen h-[1px] bg-[#DEDEDE]"></div>

                        </div>

                        <div className="flex flex-col justify-center items-center pt-2">
                                {activeTab === "conta" && (
                                        <>
                                                <div className="">
                                                        <div className="pl-15 pt-6">
                                                                <div className="flex flex-col items-start pt-2">
                                                                        <h1 className="text-[#4D4D4D] text-[12px]">Nome Completo</h1>
                                                                        <Input className=" border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"></Input>
                                                                </div>
                                                                <div className="flex flex-col items-start pt-4">
                                                                        <h1 className="text-[#4D4D4D] text-[12px]">Email</h1>
                                                                        <Input className=" border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"></Input>
                                                                </div>
                                                                <div className="flex flex-col items-start pt-4">
                                                                        <h1 className="text-[#4D4D4D] text-[12px]">Endereço</h1>
                                                                        <Input className=" border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"></Input>
                                                                </div>
                                                                <div className="flex flex-col items-start pt-4">
                                                                        <h1 className="text-[#4D4D4D] text-[12px]">CPF</h1>
                                                                        <Input className=" border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"></Input>
                                                                </div>
                                                                <div className="flex flex-col items-start pt-4">
                                                                        <h1 className="text-[#4D4D4D] text-[12px]">Telefone</h1>
                                                                        <Input className=" border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"></Input>
                                                                </div>
                                                        </div>
                                                        <div className="pl-15 pt-5">
                                                                <Dialog>
                                                                        <VisuallyHidden>
                                                                                <DialogTitle>Alterar Senha</DialogTitle>
                                                                        </VisuallyHidden>
                                                                        <DialogTrigger className="underline cursor-pointer">Alterar Senha</DialogTrigger>
                                                                        <DialogOverlay></DialogOverlay>
                                                                        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-[468px] h-[401px] max-w-md -translate-x-[50%] -translate-y-2/3 rounded-xl bg-blend-hard-light p-6 shadow-accent-foreground">
                                                                                <div className="mt-4 flex flex-col gap-y-4 items-center">
                                                                                        <div>
                                                                                                <h1 className=" text-[#4D4D4D] mb-1">Senha atual</h1>
                                                                                                <Input className="border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]" type="password" />
                                                                                        </div>
                                                                                        <div>
                                                                                                <h1 className="text-[#4D4D4D] mb-1">Senha nova</h1>
                                                                                                <Input className="border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]" type="password" />
                                                                                        </div>
                                                                                        <div>
                                                                                                <h1 className="text-[#4D4D4D] mb-1">Confirmar senha nova</h1>
                                                                                                <Input className="border-1 border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]" type="password" />
                                                                                        </div>
                                                                                        <div className="flex justify-center mt-4">
                                                                                                <Button className="mt-2 mb-3 bg-black w-[340px] h-[50px] hover:bg-blend-color-burn cursor-pointer rounded-full">Salvar Nova Senha</Button>
                                                                                        </div>
                                                                                </div>
                                                                        </DialogContent>
                                                                </Dialog>
                                                        </div>
                                                        <div className="pl-15 flex items-center justify-start flex-col">
                                                                <Button className="mt-2 mb-3 bg-black w-[340px] h-[50px] hover:bg-blend-color-burn cursor-pointer rounded-full">Salvar</Button>
                                                                <Button className="bg-red-400 text-red-900 w-[340px] h-[50px] border-2 hover:bg-red-500 border-red-00 cursor-pointer rounded-full">Excluir Conta</Button>
                                                        </div>
                                                </div>
                                        </>
                                )}
                                {activeTab === "documentos" && (
                                        <div className="flex flex-col gap-5 pl-20 items-start justify-center h-full w-full">
                                                <div className="relative">
                                                        <h1 className="pb-1 text-2xl text-[#4D4D4D]">RG ou CIN:</h1>
                                                        <DownloadIcon className="cursor-pointer ml-10 p-6 pt-1 text-gray-400 border-gray-400 border-3 border-dashed rounded-[10px] h-27 w-27" />
                                                        <h2 className="cursor-pointer absolute text-gray-600 text-[12px] bottom-[14px] right-6">RG ou CIN</h2>
                                                </div>
                                                <div className="relative">
                                                        <h1 className="pb-1 text-2xl text-[#4D4D4D]">Comprovante de endereço:</h1>
                                                        <DownloadIcon className="cursor-pointer ml-10 p-6 pt-1 text-gray-400 border-gray-400 border-3 border-dashed rounded-[10px] h-27 w-27" />
                                                        <h2 className="cursor-pointer absolute text-gray-600 text-[12px] bottom-[5px] left-[50px]">Comprovante de<span className="flex justify-center">endereço</span></h2>
                                                </div>

                                                <div className="relative">
                                                        <h1 className="pb-1 text-2xl text-[#4D4D4D]">Comprovante de renda:</h1>
                                                        <DownloadIcon className="cursor-pointer ml-10 p-6 pt-1 text-gray-400 border-gray-400 border-3 border-dashed rounded-[10px] h-27 w-27" />
                                                        <h2 className="cursor-pointer absolute text-gray-600 text-[12px] bottom-[5px] left-[50px]">Comprovante de <span className="flex justify-center">renda</span></h2>

                                                </div>
                                                <div className="relative ">
                                                        <h1 className="pb-1 text-2xl text-[#4D4D4D]">Certidão de casamento:</h1>
                                                        <DownloadIcon className="cursor-pointer ml-10 p-6 pt-1 text-gray-400 border-gray-400 border-3 border-dashed rounded-[10px] h-27 w-27" />
                                                        <h2 className="cursor-pointer   absolute text-gray-600 text-[12px] bottom-[5px] left-[65px]">Certidão de<span className="flex justify-center">casamento</span></h2>

                                                </div>
                                                <div className="flex items-center justify-center w-screen h-auto pb-2">
                                                <Button className="bg-black w-[100px] hover:bg-blend-color-burn cursor-pointer ">Salvar</Button>

                                                </div>




                                        </div>
                                )}
                        </div>

                </main>

        );
}