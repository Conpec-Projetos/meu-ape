"use client";

import { Button } from "@/components/features/buttons/default-button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, BadgeCheck, Building2, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";

const lifestyleHighlights = [
    {
        icon: Sparkles,
        title: "Curadoria humana",
        description: "Consultores que conhecem cada bairro e negociam condições reais pensando em você.",
    },
    {
        icon: ShieldCheck,
        title: "Processo seguro",
        description: "Integração direta com construtoras e assinatura digital com compliance completo.",
    },
    {
        icon: Building2,
        title: "Experiências guiadas",
        description: "Agende visitas privadas ou reuniões no empreendimento em minutos.",
    },
];

export default function Home() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const shouldShowSignupCTA = !loading && !user;

    return (
        <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div
                className="pointer-events-none absolute inset-0 -z-10 opacity-80"
                aria-hidden="true"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.35), transparent 45%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.25), transparent 50%)",
                }}
            />

            <section className="min-h-screen px-6 pt-42 pb-24 sm:px-10 lg:px-16">
                <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-secondary/80">Meu Apê</p>
                        <h1 className="mt-6 text-4xl font-semibold leading-tight text-white/80 sm:text-5xl lg:text-6xl">
                            Encontre o imóvel que traduz
                            <span className="text-secondary font-extrabold"> sua melhor versão</span>
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-slate-200">
                            Nossa equipe conecta você aos empreendimentos mais desejados de Campinas e região, com
                            análises personalizadas, visitas exclusivas e negociação conduzida do início ao fim.
                        </p>
                        <div className="mt-10 flex flex-wrap gap-4">
                            <Button
                                size="lg"
                                className="cursor-pointer text-2xl"
                                onClick={() => router.push("/property-search")}
                            >
                                Explorar empreendimentos
                                <ArrowRight className="size-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 rounded-4xl bg-linear-to-br from-primary/30 via-transparent to-pink-500/20 blur-2xl" />
                        <div className="relative rounded-4xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
                            <div className="relative h-80 overflow-hidden rounded-3xl">
                                <iframe
                                    src="https://my.matterport.com/show/?m=EmsYeDcMSPu"
                                    title="Tour imersivo"
                                    allowFullScreen
                                    loading="lazy"
                                    className="h-full w-full border-0"
                                />
                                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent" />
                                <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-semibold">Tour imersivo</p>
                                        <span className="text-slate-200">Experimente o empreendimento agora</span>
                                    </div>
                                    <BadgeCheck className="size-6 text-primary" />
                                </div>
                            </div>
                            <div className="mt-6 rounded-2xl bg-slate-900/60 p-5">
                                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Experiência guiada</p>
                                <p className="mt-3 text-xl font-semibold text-white">
                                    Visita privada em poucos cliques
                                </p>
                                <p className="mt-2 text-sm text-slate-300">
                                    Escolha o horário, defina preferências e receba um corretor dedicado.
                                </p>
                                <div className="mt-4 flex items-center gap-3 text-sm text-slate-200">
                                    <Star className="size-4 text-amber-300" />
                                    4.9/5 na experiência de visitação
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white px-6 py-20 text-slate-900 sm:px-10 lg:px-16">
                <div className="mx-auto max-w-5xl">
                    <p className="text-sm uppercase tracking-[0.3em] text-primary">Lifestyle hub</p>
                    <h2 className="mt-3 text-3xl font-semibold text-slate-900">
                        Mais do que comprar, desenhar a vida que você quer viver
                    </h2>
                    <p className="mt-3 text-base text-slate-600">
                        Cada jornada começa com uma imersão guiada: entendemos sua rotina, desejos e possibilidades
                        financeiras para montar um portfólio sob medida.
                    </p>
                    <div className="mt-10 grid gap-6 md:grid-cols-2">
                        {lifestyleHighlights.map(item => (
                            <div
                                key={item.title}
                                className="flex gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
                            >
                                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">{item.title}</p>
                                    <p className="text-sm text-slate-500">{item.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-6 py-24 sm:px-10 lg:px-16">
                <div className="mx-auto max-w-5xl rounded-4xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur">
                    <p className="text-sm uppercase tracking-[0.3em] text-primary/80">Próximo passo</p>
                    <h2 className="mt-4 text-3xl font-semibold text-white">Prepare-se para a próxima visita</h2>
                    <p className="mt-3 text-base text-slate-200">
                        Busque seus interesses, convide membros da família para acompanharem a plataforma e sincronize
                        sua agenda com nossos especialistas.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button
                            size="lg"
                            className="cursor-pointer text-base"
                            onClick={() => router.push("/property-search")}
                        >
                            Explorar portfólio completo
                        </Button>
                        {shouldShowSignupCTA && (
                            <Button
                                variant="secondary"
                                size="lg"
                                className="cursor-pointer bg-white/10 text-white hover:bg-white/20"
                                onClick={() => router.push("/signup")}
                            >
                                Cadastre-se
                            </Button>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
