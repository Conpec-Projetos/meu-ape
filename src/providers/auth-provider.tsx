"use client";

import { AuthContext } from "@/contexts/auth-context";
import { auth, db } from "@/firebase/firebase-config";
import { User } from "@/interfaces/user";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const userData = userDoc.data() as User;
                    // Ensure the context user carries its Firebase UID as `id`
                    // so consumers relying on `user.id` (e.g., /dashboard) work correctly
                    setUser({ ...userData, id: firebaseUser.uid });
                    setRole(userData.role);
                } else {
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
