"use client";

import { AuthContext } from "@/contexts/auth-context";
import { auth } from "@/firebase/firebase-config";
import { User } from "@/interfaces/user";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<"client" | "agent" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
            if (firebaseUser) {
                try {
                    const response = await fetch("/api/user/profile", {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store",
                    });

                    if (response.ok) {
                        const payload = await response.json();
                        const profile = payload?.user as User | undefined;
                        if (profile) {
                            setUser(profile);
                            setRole(profile.role);
                        } else {
                            setUser(null);
                            setRole(null);
                        }
                    } else if (response.status === 401) {
                        await auth.signOut();
                        setUser(null);
                        setRole(null);
                    } else {
                        const errorData = await response.json().catch(() => null);
                        console.error("Failed to load user profile", errorData);
                        setUser(null);
                        setRole(null);
                    }
                } catch (error) {
                    console.error("Error fetching user profile", error);
                    setUser(null);
                    setRole(null);
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            await auth.signOut();
            router.push("/login");
        } catch (error) {
            console.error("Error logging out:", error);
            router.push("/login");
        }
    };

    return <AuthContext.Provider value={{ user, role, loading, logout }}>{children}</AuthContext.Provider>;
}
