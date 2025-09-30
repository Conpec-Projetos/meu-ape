"use client"; // This line is crucial!

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function PasswordModal() {
  return (
    <Dialog.Root>

      <Dialog.Trigger asChild>
        <Button className="w-[112px] h-[33px] cursor-pointer">Editar Senha</Button>
      </Dialog.Trigger>
      
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
      
      <Dialog.Content 
        className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-9/12 rounded-xl bg-[#B0B0B0] p-6 shadow-[0px_5px_2px_rgba(0,0,0,0.45)]"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <Dialog.Title className="flex items-center justify-center text-lg font-medium text-slate-900">
          Alterar Senha
        </Dialog.Title>

        <div className="mt-4 flex flex-col gap-y-4">
          <div>
            <h1 className="text-black mb-1">Senha atual</h1>
            <Input className="rounded-lg bg-white" type="password" />
          </div>
          <div>
            <h1 className="text-black mb-1">Senha nova</h1>
            <Input className="rounded-lg bg-white" type="password" />
          </div>
          <div>
            <h1 className="text-black mb-1">Confirmar senha nova</h1>
            <Input className="rounded-lg bg-white" type="password" />
          </div>
          <div className="flex justify-center mt-4">
            <Button className="cursor-pointer bg-[#6049C7] hover:bg-[#503aa7]">Salvar</Button>
          </div>
        </div>

        <Dialog.Close asChild>
          <button className="cursor-pointer absolute top-3 right-3 p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-300">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  );
}