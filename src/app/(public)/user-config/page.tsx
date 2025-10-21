"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { profileUpdateSchema } from "@/schemas/profileUpdateSchema";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DownloadIcon } from "lucide-react";
import React, { useEffect } from "react";

export default function UserConfig() {
    const [activeTab, setActiveTab] = React.useState("conta");
    const [name, setName] = React.useState<string>("");
    const [email, setEmail] = React.useState<string>("");
    const [address, setAddress] = React.useState<string>("");
    const [cpf, setCpf] = React.useState<string>("");
    const [phone, setPhone] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(true);
    const [, setError] = React.useState<string | null>(null);
    const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
    const [uploading, setUploading] = React.useState(false);
    const [uploadedUrls, setUploadedUrls] = React.useState<Record<string, string[]>>({});
    const [pendingFiles, setPendingFiles] = React.useState<Record<string, File | null>>({});

    const onlyDigits = (v: string) => (v || "").toString().replace(/\D/g, "");

    const formatCPF = React.useCallback((v: string) => {
        const d = onlyDigits(v).slice(0, 11);
        if (!d) return "";
        return d.replace(/(\d{1,3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d2) => {
            let out = `${a}.${b}.${c}`;
            if (d2) out += `-${d2}`;
            return out;
        });
    }, []);

    const formatPhone = React.useCallback((v: string) => {
        const d = onlyDigits(v);
        if (!d) return "";
        if (d.length <= 2) return `(${d}`;
        if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
        if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
        return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
    }, []);

    const uploadDocument = async (file: File | null, documentType: string) => {
        if (!file) return;
        setUploading(true);
        setError(null);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("documentType", documentType);

            const res = await fetch("/api/user/documents/upload", { method: "POST", body: form });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            const url = data.url as string;
            setUploadedUrls(prev => ({ ...prev, [documentType]: [url] }));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Erro ao enviar documento");
        } finally {
            setUploading(false);
        }
    };

    const DocumentRow: React.FC<{
        label: string;
        typeKey: string;
        uploadedUrls: string[];
        pendingFile?: File | null;
        setPendingFile: (f: File | null) => void;
    }> = ({ label, typeKey, uploadedUrls, pendingFile, setPendingFile }) => {
        const inputId = `doc-${typeKey}`;
        return (
            <div className="gap-4">
                <h1 className="flex flex-row pb-1 text-2xl text-[#4D4D4D]">
                    {label}:
                    <div className="ml-2">
                        {uploadedUrls.map((u, i) => (
                            <a
                                key={i}
                                href={u}
                                target="_blank"
                                rel="noreferrer"
                                className=" text-sm text-blue-600 underline"
                            >
                                Ver {label}
                            </a>
                        ))}
                        {pendingFile && (
                            <span className="text-sm text-gray-600">
                                Arquivo pronto para upload: {pendingFile.name}
                            </span>
                        )}
                    </div>
                </h1>
                <label
                    htmlFor={inputId}
                    className="relative cursor-pointer ml-4 p-6 pt-1 text-gray-400 border-gray-400 border-3 border-dashed rounded-[10px] h-27 w-27 flex items-center justify-center"
                >
                    <DownloadIcon className="absolute top-1/3" />
                </label>
                <input
                    id={inputId}
                    type="file"
                    className="hidden"
                    onChange={e => setPendingFile(e.target.files ? e.target.files[0] : null)}
                />
            </div>
        );
    };

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;

        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/user/profile", { signal });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}) as unknown);
                    const bodyJson = body as { error?: unknown };
                    const errMsg = typeof bodyJson.error === "string" ? bodyJson.error : `HTTP ${res.status}`;
                    throw new Error(errMsg);
                }
                const data = await res.json();
                const user = data.user || {};
                setName(user.fullName || "");
                setEmail(user.email || "");
                setAddress(user.address || "");
                setCpf(user.cpf ? formatCPF(user.cpf as string) : "");
                setPhone(user.phone ? formatPhone(user.phone as string) : "");
                if (user.documents && typeof user.documents === "object") {
                    setUploadedUrls(user.documents as Record<string, string[]>);
                }
            } catch (err: unknown) {
                if (err && (err as { name?: string }).name === "AbortError") return;
                const message = err instanceof Error ? err.message : String(err);
                setError(message || "Erro ao buscar perfil");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
        return () => controller.abort();
    }, [formatCPF, formatPhone]);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const payload = { fullName: name, address, phone, cpf };

            const parsed = profileUpdateSchema.safeParse(payload);
            if (!parsed.success) {
                const issues: Record<string, string> = {};
                parsed.error.errors.forEach(e => {
                    const field = e.path.join(".") || "_";
                    issues[field] = e.message;
                });
                setFormErrors(issues);
                throw new Error("Invalid input");
            }
            setFormErrors({});
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}) as unknown);
                const bodyJson = body as { issues?: unknown; error?: unknown };
                if (bodyJson && Array.isArray(bodyJson.issues)) {
                    type Issue = { field?: string; message?: string; error?: string };
                    const issuesArr = bodyJson.issues as Issue[];
                    const issues: Record<string, string> = {};
                    issuesArr.forEach(it => {
                        if (it && it.field) issues[it.field] = it.message || it.error || "Inválido";
                    });
                    setFormErrors(issues);
                }
                const errMsg = typeof bodyJson.error === "string" ? bodyJson.error : `HTTP ${res.status}`;
                throw new Error(errMsg);
            }
            const data = await res.json();
            const user = data?.user || {};
            setName(user.fullName || "");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Erro ao salvar perfil");
        } finally {
            setLoading(false);
        }
    };

    const setPendingFile = (documentType: string, file: File | null) => {
        setPendingFiles(p => ({ ...p, [documentType]: file }));
    };

    const handleSaveDocuments = async () => {
        setUploading(true);
        setError(null);
        try {
            const entries = Object.entries(pendingFiles).filter(([, f]) => f) as [string, File][];
            for (const [docType, file] of entries) {
                await uploadDocument(file, docType);
                setPendingFiles(p => ({ ...p, [docType]: null }));
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(message || "Erro ao salvar documentos");
        } finally {
            setUploading(false);
        }
    };

    return (
        <main className="grow bg-gray-50">
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
                <div className="w-screen h-px bg-[#DEDEDE]"></div>
            </div>

            <div className="flex flex-col justify-center items-center pt-2">
                {activeTab === "conta" && (
                    <>
                        <div className="">
                            <div className="pl-15 pt-6">
                                <div className="flex flex-col items-start pt-2">
                                    <h1 className="text-[#4D4D4D] text-[12px]">Nome Completo</h1>
                                    <Input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.currentTarget.value)}
                                        className=" border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                    ></Input>
                                    {formErrors.fullName && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-start pt-4">
                                    <h1 className="text-[#4D4D4D] text-[12px]">Endereço</h1>
                                    <Input
                                        value={address}
                                        onChange={e => setAddress(e.currentTarget.value)}
                                        className=" border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                    ></Input>
                                    {formErrors.address && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.address}</p>
                                    )}
                                </div>
                                <div className="flex flex-col items-start pt-4">
                                    <h1 className="text-[#4D4D4D] text-[12px]">Email</h1>
                                    <Input
                                        value={email}
                                        onChange={e => setEmail(e.currentTarget.value)}
                                        className=" border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                    ></Input>
                                </div>
                                <div className="flex flex-col items-start pt-4">
                                    <h1 className="text-[#4D4D4D] text-[12px]">CPF</h1>
                                    <Input
                                        value={cpf}
                                        onChange={e => setCpf(formatCPF(e.currentTarget.value))}
                                        className=" border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                    ></Input>
                                    {formErrors.cpf && <p className="text-red-500 text-sm mt-1">{formErrors.cpf}</p>}
                                </div>
                                <div className="flex flex-col items-start pt-4">
                                    <h1 className="text-[#4D4D4D] text-[12px]">Telefone</h1>
                                    <Input
                                        value={phone}
                                        onChange={e => setPhone(formatPhone(e.currentTarget.value))}
                                        className=" border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                    ></Input>
                                    {formErrors.phone && (
                                        <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                                    )}
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
                                                <Input
                                                    className="border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                                    type="password"
                                                />
                                            </div>
                                            <div>
                                                <h1 className="text-[#4D4D4D] mb-1">Senha nova</h1>
                                                <Input
                                                    className="border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                                    type="password"
                                                />
                                            </div>
                                            <div>
                                                <h1 className="text-[#4D4D4D] mb-1">Confirmar senha nova</h1>
                                                <Input
                                                    className="border border-gray-400 pl-5 rounded-[10px] bg-white w-[340px] h-[43px]"
                                                    type="password"
                                                />
                                            </div>
                                            <div className="flex justify-center mt-4">
                                                <Button className="mt-2 mb-3 bg-black w-[340px] h-[50px] hover:bg-blend-color-burn cursor-pointer rounded-full">
                                                    Salvar Nova Senha
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="pl-15 flex items-center justify-start flex-col">
                                <Button
                                    disabled={loading}
                                    onClick={handleSave}
                                    className="mt-2 mb-3 bg-black w-[340px] h-[50px] hover:bg-blend-color-burn cursor-pointer rounded-full"
                                >
                                    {loading ? "Carregando..." : "Salvar"}
                                </Button>
                                <Button className="bg-red-400 text-red-900 w-[340px] h-[50px] border-2 hover:bg-red-500 border-red-00 cursor-pointer rounded-full">
                                    Excluir Conta
                                </Button>
                            </div>
                        </div>
                    </>
                )}
                {activeTab === "documentos" && (
                    <div className="flex flex-col gap-5 pl-20 items-start justify-center h-full w-full">
                        <DocumentRow
                            label="RG ou CIN"
                            typeKey="rg"
                            uploadedUrls={uploadedUrls["rg"] || []}
                            pendingFile={pendingFiles["rg"] || null}
                            setPendingFile={f => setPendingFile("rg", f)}
                        />
                        <DocumentRow
                            label="Comprovante de endereço"
                            typeKey="addressProof"
                            uploadedUrls={uploadedUrls["addressProof"] || []}
                            pendingFile={pendingFiles["addressProof"] || null}
                            setPendingFile={f => setPendingFile("addressProof", f)}
                        />
                        <DocumentRow
                            label="Comprovante de renda"
                            typeKey="incomeProof"
                            uploadedUrls={uploadedUrls["incomeProof"] || []}
                            pendingFile={pendingFiles["incomeProof"] || null}
                            setPendingFile={f => setPendingFile("incomeProof", f)}
                        />
                        <DocumentRow
                            label="Certidão de casamento"
                            typeKey="marriageCert"
                            uploadedUrls={uploadedUrls["marriageCert"] || []}
                            pendingFile={pendingFiles["marriageCert"] || null}
                            setPendingFile={f => setPendingFile("marriageCert", f)}
                        />
                        <div className="flex items-center justify-center w-screen h-auto pb-2">
                            <Button
                                disabled={uploading}
                                onClick={handleSaveDocuments}
                                className="bg-black w-[100px] hover:bg-blend-color-burn cursor-pointer "
                            >
                                {uploading ? "Enviando..." : "Salvar"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
