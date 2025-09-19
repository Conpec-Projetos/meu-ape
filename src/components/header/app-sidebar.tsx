import { Calendar, Heart, Home, HousePlus, Inbox, LogIn, LogOut, Search, Settings, UserRound } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


type Variant = 'guest' | 'client' | 'agent' | 'admin';
type SidebarItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

// Profile items.
const profileSidebar: Record<Variant, SidebarItem[]> = {
  guest: [
    { label: 'Entrar', href: '/', icon: LogIn },
  ],
  client: [
    { label: 'Configurações', href: '/', icon: Settings },
    { label: 'Favoritos', href: '/', icon: Heart },
    { label: 'Sair', href: '/', icon: LogOut },
  ],
  agent: [
    { label: 'Configurações', href: '/', icon: Settings },
    { label: 'Sair', href: '/', icon: LogOut },
  ],
  admin: [
    { label: 'Configurações', href: '/', icon: Settings },
    { label: 'Sair', href: '/', icon: LogOut },
  ],
}

// Menu items.
const menuSidebar: Record<Variant, SidebarItem[]> = {
  guest: [
    { label: 'Buscar Imóveis', href: '/', icon: Home },
    { label: 'Sou corretor(a)', href: '/', icon: Search },
  ],
  client: [
    { label: 'Buscar Imóveis', href: '/', icon: Home },
    { label: 'Visitas', href: '/', icon: Calendar },
    { label: 'Reservas', href: '/', icon: Inbox },
  ],
  agent: [
    { label: 'Buscar Imóveis', href: '/', icon: Home },
    { label: 'Visitas', href: '/', icon: Calendar },
    { label: 'Reservas', href: '/', icon: Inbox },
  ],
  admin: [
    { label: 'Buscar Imóveis', href: '/', icon: Home },
    { label: 'Visitas', href: '/', icon: Calendar },
    { label: 'Reservas', href: '/', icon: Inbox },
    { label: 'Editar Imóveis', href: '/', icon: HousePlus },
    { label: 'Contas', href: '/', icon: UserRound },
  ],
}

type MenuSidebarProps = {
  variant: Variant;
};

export function AppSidebar({ variant }: MenuSidebarProps) {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Meu Perfil</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {profileSidebar[variant].map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuSidebar[variant].map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>

        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}