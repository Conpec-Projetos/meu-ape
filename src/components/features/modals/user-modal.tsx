"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AgentRegistrationRequest } from "@/interfaces/agentRegistrationRequest";
import { User } from "@/interfaces/user";
import { userSchema } from "@/schemas/userSchema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Define a unified schema for the form that includes all possible fields
const formSchema = userSchema.extend({
  adminMsg: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit" | "review" | "view";
  userData?: User;
  requestData?: AgentRegistrationRequest;
  onSave: (data: FormValues) => void;
  onApprove?: (request: AgentRegistrationRequest) => void;
  onDeny?: (request: AgentRegistrationRequest, reason: string) => void;
}

const reviewSchema = z.object({
  adminMsg: z.string().min(1, "Motivo da recusa é obrigatório"),
});

export function UserModal({
  isOpen,
  onClose,
  mode,
  userData,
  requestData,
  onSave,
  onApprove,
  onDeny,
}: UserModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
      cpf: "",
      phone: "",
      address: "",
      role: "client",
      agentProfile: {
        creci: "",
        city: "",
      },
      adminMsg: "",
    },
  });
  const [showDenialReason, setShowDenialReason] = useState(false);

  useEffect(() => {
    if (isOpen) {
      let defaultValues: Partial<FormValues> = { role: "client" };
      if (mode === "edit" || mode === "view") {
        defaultValues = userData || {};
      } else if (mode === "review" && requestData?.applicantData) {
        const { creci, city, ...rest } = requestData.applicantData;
        defaultValues = {
          ...rest,
          role: "agent",
          agentProfile: { creci: creci || "", city: city || "" },
        };
      }
      form.reset(defaultValues);
      setShowDenialReason(false);
    }
  }, [isOpen, mode, userData, requestData, form]);

  const role = form.watch("role");

  const onSubmit = (data: FormValues) => {
    onSave(data);
  };

  const handleDenyClick = () => {
    setShowDenialReason(true);
  };

  const handleConfirmDeny = async () => {
    const adminMsg = form.getValues("adminMsg");
    const validation = reviewSchema.safeParse({ adminMsg });

    if (validation.success) {
      if (onDeny && requestData && adminMsg) {
        onDeny(requestData, adminMsg);
      }
    } else {
      form.setError("adminMsg", {
        message: validation.error.errors[0].message,
      });
    }
  };

  const renderFields = () => {
    const disabled = mode === "view" || mode === "review";

    return (
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={disabled || mode === "edit"}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CPF</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input {...field} disabled={disabled} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {(role === "agent" || mode === "review") && (
          <FormField
            control={form.control}
            name="agentProfile.creci"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CRECI</FormLabel>
                <FormControl>
                  <Input {...field} disabled={disabled} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Adicionar Novo Usuário"}
            {mode === "edit" && "Editar Usuário"}
            {mode === "review" && "Analisar Solicitação de Cadastro"}
            {mode === "view" && "Visualizar Usuário"}
          </DialogTitle>
          {mode !== "review" && mode !== "view" && (
            <DialogDescription>Preencha os campos abaixo.</DialogDescription>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode !== "review" && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Usuário</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={mode !== "add"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="agent">Corretor</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {renderFields()}
            {showDenialReason && (
              <FormField
                control={form.control}
                name="adminMsg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Recusa</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explique o motivo da recusa..."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              {mode === "review" && !showDenialReason && (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDenyClick}
                  >
                    Recusar
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      onApprove && requestData && onApprove(requestData)
                    }
                  >
                    Aprovar
                  </Button>
                </>
              )}
              {showDenialReason && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleConfirmDeny}
                >
                  Confirmar Recusa
                </Button>
              )}
              {(mode === "add" || mode === "edit") && (
                <Button type="submit" className="cursor-pointer">Salvar</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
