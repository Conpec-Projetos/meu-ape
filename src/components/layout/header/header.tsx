"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import {
    CircleUserRound,
    Heart,
    LogOut,
    Menu,
    Search,
    Settings,
    Users,
    Home,
    Calendar,
    Book,
    BarChart
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Variant = "guest" | "client" | "agent" | "admin";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
};

const navConfig: Record<Variant, NavItem[]> = {
    guest: [
        { label: "Buscar Imóveis", href: "/search", icon: Search },
    ],
    client: [
        { label: "Buscar Imóveis", href: "/search", icon: Search },
        { label: "Meus Favoritos", href: "/my-favorites", icon: Heart },
        { label: "Minhas Requisições", href: "/my-requests", icon: Book },
    ],
    agent: [
        { label: "Minha Agenda", href: "/my-schedule", icon: Calendar },
        { label: "Reservas Associadas", href: "/associated-bookings", icon: Book },
    ],
    admin: [
        { label: "Dashboard", href: "/admin/dashboard", icon: BarChart },
        { label: "Imóveis", href: "/admin/properties", icon: Home },
        { label: "Usuários", href: "/admin/users", icon: Users },
        { label: "Requisições", href: "/admin/requests", icon: Book },
    ],
};

interface HeaderProps {
    variant: Variant;
}

function Header({ variant }: HeaderProps) {
    const links = navConfig[variant];
    const router = useRouter();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    return (
        <header className={`w-full h-[80px] py-4 px-6 bg-primary flex justify-between items-center ${variant === 'admin' ? 'bg-gray-800' : 'bg-primary'}`}>
            <div className="flex items-center gap-4">
                <Image
                    src="/logo.png"
                    alt="Meu Apê Logo"
                    width={60}
                    height={60}
                    className="cursor-pointer"
                    onClick={() => router.push("/")}
                />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex justify-end items-center w-full gap-10">
                <div className="flex gap-6">
                    {links.map((link) => (
                        <a
                            key={link.label}
                            className="text-primary-foreground cursor-pointer font-bold relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-primary-foreground after:transition-all after:duration-500 hover:after:w-full"
                            onClick={() => router.push(link.href)}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div>
                    {variant === "guest" ? (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => router.push("/login")}
                            >
                                <span className="font-semibold">Entrar</span>
                            </Button>
                            <Button
                                className="cursor-pointer bg-secondary hover:bg-secondary/90"
                                onClick={() => router.push("/signup")}
                            >
                                <span className="font-semibold">Cadastrar</span>
                            </Button>
                        </div>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <CircleUserRound className="mr-2" />
                                    <span className="font-semibold">{user?.fullName || "Conta"}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 mr-4">
                                <DropdownMenuLabel>Meu Perfil</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push("/settings")}>
                                    <Settings className="mr-2" />
                                    Configurações
                                </DropdownMenuItem>
                                {variant === "client" && (
                                    <DropdownMenuItem onClick={() => router.push("/my-favorites")}>
                                        <Heart className="mr-2" />
                                        Favoritos
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout}>
                                    <LogOut className="mr-2 text-destructive" />
                                    <span className="text-destructive">Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <div className="flex flex-col gap-6 mt-8">
                            {links.map((link) => (
                                <a
                                    key={link.label}
                                    className="text-foreground cursor-pointer font-bold flex items-center gap-2"
                                    onClick={() => router.push(link.href)}
                                >
                                    <link.icon className="h-5 w-5" />
                                    {link.label}
                                </a>
                            ))}
                            <DropdownMenuSeparator />
                             {variant === "guest" ? (
                                <div className="flex flex-col gap-4">
                                    <Button
                                        variant="outline"
                                        className="cursor-pointer"
                                        onClick={() => router.push("/login")}
                                    >
                                        <span className="font-semibold">Entrar</span>
                                    </Button>
                                    <Button
                                        className="cursor-pointer bg-secondary hover:bg-secondary/90"
                                        onClick={() => router.push("/signup")}
                                    >
                                        <span className="font-semibold">Cadastrar</span>
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <a
                                        className="text-foreground cursor-pointer font-bold flex items-center gap-2"
                                        onClick={() => router.push("/settings")}
                                    >
                                        <Settings className="h-5 w-5" />
                                        Configurações
                                    </a>
                                    <a
                                        className="text-destructive cursor-pointer font-bold flex items-center gap-2"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        Sair
                                    </a>
                                </>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}

export default Header;