"use client";

import { User } from "@/interfaces/user";
import { createContext } from "react";

interface AuthContextType {
    user: User | null;
    role: "client" | "agent" | "admin" | null;
    loading: boolean;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
