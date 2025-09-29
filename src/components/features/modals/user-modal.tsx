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
import { Eye, EyeOff } from "lucide-react"; // ADDED Eye and EyeOff imports

// Define a schema for adding a new user with required password fields.
const addSchema = userSchema.extend({
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."), // Password is required for ADD
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória."), // Confirm Password is required for ADD
  adminMsg: z.string().optional(),
})
.refine(data => data.password === data.confirmPassword, {
    message: "As senhas não correspondem.",
    path: ["confirmPassword"],
});

// Define a schema for editing a user, omitting the password fields.
const editSchema = userSchema.omit({ password: true }).extend({
    adminMsg: z.string().optional(),
});

// Define a schema for reviewing a user, omitting the password fields.
const reviewSchema = z.object({
  adminMsg: z.string().min(1, "Motivo da recusa é obrigatório"),
});

// A base type for form values (use the most inclusive schema type for hooks)
type FormValues = z.infer<typeof addSchema>;

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
  const [passwordVisible, setPasswordVisible] = useState(false); // ADDED state
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); // ADDED state
  const [showDenialReason, setShowDenialReason] = useState(false);

  const currentSchema = mode === "add" ? addSchema : editSchema; // Use dynamic schema

  const form = useForm<FormValues>({
    resolver: zodResolver(currentSchema as unknown as z.ZodTypeAny),
    defaultValues: {
      fullName: "",
      email: "",
      cpf: "",
      phone: "",
      address: "",
      role: "client",
      password: "", // ADDED default value
      confirmPassword: "", // ADDED default value
      agentProfile: {
        creci: "",
        city: "",
      },
      adminMsg: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      let defaultValues: Partial<FormValues> = { 
        role: "client",
        password: "", // Clear password fields
        confirmPassword: "", // Clear password fields
      };
      if (mode === "edit" || mode === "view") {
        defaultValues = userData || {};
        defaultValues.password = "";
        defaultValues.confirmPassword = "";
      } else if (mode === "review" && requestData?.applicantData) {
        const { creci, city, ...rest } = requestData.applicantData;
        defaultValues = {
          ...rest,
          role: "agent",
          agentProfile: { creci: creci || "", city: city || "" },
          password: "",
          confirmPassword: "",
        };
      }
      form.reset(defaultValues as FormValues);
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

        {mode === "add" && ( // ADDED: Password fields only for 'add' mode
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={passwordVisible ? "text" : "password"}
                        placeholder="******"
                        {...field}
                        value={field.value || ""}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                      >
                        {passwordVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={confirmPasswordVisible ? "text" : "password"}
                        placeholder="******"
                        {...field}
                        value={field.value || ""}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground"
                        onClick={() =>
                          setConfirmPasswordVisible(!confirmPasswordVisible)
                        }
                      >
                        {confirmPasswordVisible ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {(role === "agent" || (mode === "review" && requestData)) && (
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