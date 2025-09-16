'use client';

import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Header from '@/components/header/header';
import Footer from '@/components/footer/footer';
import { AppSidebar } from '@/components/header/app-sidebar';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className='min-h-screen flex flex-col'>
        <AppSidebar variant="guest" />
        <Header variant="guest" />
        <main className='flex-grow'>{children}</main>
        <Footer />
    </SidebarProvider>
  );
}
