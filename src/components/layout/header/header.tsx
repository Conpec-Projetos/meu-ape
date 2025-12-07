"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    Book,
    Building,
    Calendar,
    CircleUserRound,
    Heart,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Variant = "guest" | "client" | "agent" | "admin";

type NavItem = {
    label: string;
    href: string;
    icon: React.ElementType;
};

const navConfig: Record<Variant, NavItem[]> = {
    guest: [{ label: "Buscar Imóveis", href: "/property-search", icon: Search }],
    client: [
        { label: "Buscar Imóveis", href: "/property-search", icon: Search },
        { label: "Meus Favoritos", href: "/favorites", icon: Heart },
        { label: "Solicitações", href: "/dashboard", icon: Calendar },
    ],
    agent: [
        { label: "Imóveis", href: "/property-search", icon: Building },
        { label: "Meus Favoritos", href: "/favorites", icon: Heart },
        { label: "Minha Agenda", href: "/agent/dashboard", icon: Calendar },
    ],
    admin: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Imóveis", href: "/admin/property", icon: Home },
        { label: "Usuários", href: "/admin/users", icon: Users },
        { label: "Solicitações", href: "/admin/requests", icon: Book },
        { label: "Construtoras", href: "/admin/developers", icon: Building },
    ],
};

interface HeaderProps {
    variant: Variant;
}

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();
};

function Header({ variant }: HeaderProps) {
    const links = navConfig[variant];
    const router = useRouter();
    const pathname = usePathname();
    const { logout, user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const sheetHistoryRef = useRef(false);
    const pendingNavigationRef = useRef<string | null>(null);
    const isHome = pathname === "/";

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 15;
            setScrolled(isScrolled);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const closeSheet = useCallback((options?: { skipHistoryPop?: boolean }) => {
        setIsSheetOpen(false);
        if (typeof window === "undefined") return;
        if (!sheetHistoryRef.current) return;
        if (options?.skipHistoryPop) {
            sheetHistoryRef.current = false;
            return;
        }
        sheetHistoryRef.current = false;
        window.history.back();
    }, []);

    const openSheet = useCallback(() => {
        setIsSheetOpen(true);
        if (typeof window === "undefined") return;
        if (sheetHistoryRef.current) return;
        window.history.pushState({ sheet: true }, "", window.location.href);
        sheetHistoryRef.current = true;
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handlePopState = () => {
            if (sheetHistoryRef.current) {
                sheetHistoryRef.current = false;
                setIsSheetOpen(false);
            }
            if (pendingNavigationRef.current) {
                const nextHref = pendingNavigationRef.current;
                pendingNavigationRef.current = null;
                router.push(nextHref);
            }
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [router]);

    useEffect(() => {
        if (isSheetOpen) {
            closeSheet({ skipHistoryPop: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const handleNavigation = (href: string) => {
        if (isSheetOpen && sheetHistoryRef.current) {
            pendingNavigationRef.current = href;
            closeSheet();
        } else {
            router.push(href);
        }
    };

    const handleLogout = async () => {
        await logout();
        handleNavigation("/login");
    };

    // Define styles based on scroll state
    const isTransparent = !scrolled;
    const headerBaseStyle =
        "fixed top-0 left-0 w-full h-15 py-4 px-6 flex justify-between items-center z-50 transition-all duration-300";

    const headerStyle = `${headerBaseStyle} ${isTransparent ? "bg-transparent" : "bg-primary shadow-md"}`;

    const navLinkColor = isTransparent ? (isHome ? "text-white" : "text-primary") : "text-primary-foreground";
    const navLinkHover = isTransparent ? (isHome ? "hover:bg-white/10" : "hover:bg-primary/5") : "hover:bg-white/10";
    const menuButtonColor = isTransparent
        ? isHome
            ? "bg-transparent hover:bg-white/10"
            : "bg-transparent hover:bg-secondary/20"
        : "bg-transparent hover:bg-secondary/10";
    const menuTriggerText = isTransparent && isHome ? "text-white" : "text-foreground";
    const menuColor = isTransparent ? (isHome ? "text-white" : "") : "text-primary-foreground";
    const profileButtonText = isTransparent ? (isHome ? "text-white" : "text-primary") : "text-primary-foreground";

    return (
        <header className={headerStyle}>
            <div className="flex items-center gap-4">
                <Image
                    src={isTransparent ? (isHome ? "/invlogo.png" : "/logo.png") : "/invlogo.png"}
                    alt="Meu Apê Logo"
                    width={120}
                    height={120}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => router.push("/")}
                />
                {variant === "admin" && <Badge variant="secondary">Admin</Badge>}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex justify-end items-center w-full gap-4">
                <div className="flex items-center gap-2">
                    {links.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.label}
                                href={link.href}
                                className={`flex items-center gap-2 font-medium px-3 py-2 rounded-md transition-colors ${navLinkColor} ${navLinkHover} ${
                                    isActive ? "font-bold" : ""
                                }`}
                            >
                                <link.icon className="h-5 w-5" />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <div>
                    {variant === "guest" ? (
                        <div className="flex">
                            <Button
                                className={`cursor-pointer text-md bg-transparent hover:bg-primary/90 transition-colors ${navLinkColor} ${navLinkHover}`}
                                onClick={() => router.push("/login")}
                            >
                                Login
                            </Button>
                            <Button
                                className={`cursor-pointer text-md bg-transparent hover:bg-primary/90 transition-colors ${navLinkColor} ${navLinkHover}`}
                                onClick={() => router.push("/signup")}
                            >
                                Cadastre-se
                            </Button>
                        </div>
                    ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={`flex cursor-pointer items-center gap-2 focus-visible:ring-0 focus-visible:ring-offset-0 ${profileButtonText}`}
                                >
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user?.photoUrl} alt={user?.fullName} />
                                        <AvatarFallback>
                                            {user?.fullName ? getInitials(user.fullName) : <CircleUserRound />}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64 mr-4" align="end">
                                {user && (
                                    <>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">{user.fullName}</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Perfil</span>
                                </DropdownMenuItem>
                                {variant === "client" && (
                                    <DropdownMenuItem onClick={() => router.push("/favorites")}>
                                        <Heart className="mr-2 h-4 w-4" />
                                        <span>Favoritos</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sair</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </nav>

            {/* Mobile Navigation */}
            <div className="lg:hidden">
                <Sheet open={isSheetOpen} onOpenChange={open => (open ? openSheet() : closeSheet())}>
                    <SheetTrigger asChild>
                        <Button
                            size="icon"
                            className={`${menuButtonColor} ${menuTriggerText} cursor-pointer rounded-full`}
                        >
                            <Menu className={`h-6 w-6 ${menuColor}`} />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="flex flex-col p-4 w-full sm:max-w-sm" side="right">
                        <div className="flex items-center gap-4 border-b pb-4">
                            {user ? (
                                <>
                                    <Avatar
                                        className="cursor-pointer h-12 w-12"
                                        onClick={() => handleNavigation("/profile")}
                                    >
                                        <AvatarImage src={user.photoUrl} alt={user.fullName} />
                                        <AvatarFallback className="text-lg">
                                            {getInitials(user.fullName)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{user.fullName}</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col w-full gap-2 mt-5">
                                    <Button
                                        variant="outline"
                                        className="w-full cursor-pointer"
                                        onClick={() => handleNavigation("/login")}
                                    >
                                        Entrar
                                    </Button>
                                    <Button
                                        className="w-full sm:w-auto bg-foreground hover:bg-foreground/70 cursor-pointer"
                                        onClick={() => handleNavigation("/signup")}
                                    >
                                        Cadastre-se
                                    </Button>
                                </div>
                            )}
                        </div>

                        <nav className="grow mt-6">
                            <ul className="flex flex-col gap-4">
                                {links.map(link => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            onClick={event => {
                                                event.preventDefault();
                                                handleNavigation(link.href);
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-md text-lg font-medium hover:bg-muted"
                                        >
                                            <link.icon className="h-6 w-6" />
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {user && (
                            <div className="mt-auto border-t pt-4">
                                <ul className="flex flex-col gap-2">
                                    <li>
                                        <Link
                                            href="/profile"
                                            onClick={event => {
                                                event.preventDefault();
                                                handleNavigation("/profile");
                                            }}
                                            className="flex items-center gap-3 p-2 rounded-md font-medium hover:bg-muted"
                                        >
                                            <Settings className="h-5 w-5" />
                                            Perfil
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 p-2 rounded-md font-medium text-destructive hover:bg-muted"
                                        >
                                            <LogOut className="h-5 w-5" />
                                            Sair
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}

export default Header;
