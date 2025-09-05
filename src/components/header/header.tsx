import { Button } from "@/components/ui/button"
import {CircleUserRound, Settings, LogOut, Heart, Calendar, Home, Inbox, Search, LogIn, UserRound} from "lucide-react"
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
  SidebarTrigger,
} from "@/components/ui/sidebar"


type Variant = 'guest' | 'client' | 'agent' | 'admin';

type NavItem = {
  label: string;
  href: string;
};


const navConfig: Record<Variant, NavItem[]> = {
  guest: [
    { label: 'Buscar Imóveis', href: '/' },
    { label: 'Sou corretor(a)', href: '/' },
  ],
  client: [
    { label: 'Buscar Imóveis', href: '/' },
    { label: 'Visitas', href: '/' },
    { label: 'Reservas', href: '/' },
  ],
  agent: [
    { label: 'Buscar Imóveis', href: '/' },
    { label: 'Visitas', href: '/' },
    { label: 'Reservas', href: '/' },
  ],
  admin: [
    { label: 'Buscar Imóveis', href: '/' },
    { label: 'Visitas', href: '/' },
    { label: 'Reservas', href: '/' },
    { label: 'Editar Imóveis', href: '/' },
    { label: 'Contas', href: '/' },
  ],
};


interface HeaderProps {
  variant: Variant;
}


function Header({variant}: HeaderProps) {
    const links = navConfig[variant];
    const router = useRouter();


  return (

      

      <header className="w-full h-[80px] py-4 px-6 bg-[#332475] flex justify-start gap-1.5 lg:gap-0 lg:justify-between items-center">

        <SidebarTrigger className="lg:hidden text-white" />

        <div>
            <h1 className="text-3xl text-white select-none w-[200px]">Meu Apê</h1>
        </div>

        <div className="justify-end items-center w-full gap-10 hidden lg:flex">
            <div className="flex gap-6">
                {links.map((link) => (
                    <a 
                        key={link.label}
                        className="text-white cursor-pointer font-bold relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-white after:transition-all after:duration-500 hover:after:w-full"
                        onClick={() => router.push(link.href)}>
                        {link.label}
                    </a>
                ))}
            </div>

            <div>
              {variant === 'guest'? 
              (
                <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => router.push('/')} // Navigate to login page
                >
                    <CircleUserRound className="mr-1" />
                    <span className="font-semibold">Entrar</span>
                </Button>

              ) : ( 
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <CircleUserRound className="mr-1" />
                      <span className="font-semibold">Conta</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mr-4" >
                    <DropdownMenuLabel>Meu Perfil</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      onClick={() => router.push('/')}
                    >
                      <Settings className="mr-1" />
                      Configurações
                    </DropdownMenuCheckboxItem>
                    {
                      variant === 'client' && (
                        <DropdownMenuCheckboxItem
                          onClick={() => router.push('/')}
                        >
                          <Heart className="mr-1" />
                          Favoritos
                        </DropdownMenuCheckboxItem>
                      )
                    }
                    
                    <DropdownMenuCheckboxItem
                      onClick={() => router.push('/')}
                    >
                      <LogOut className="mr-1 text-red-500" />
                      <span className="text-red-500">Sair</span>
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                

              )}
            </div>
        </div>

      </header>
    
  )
}

export default Header