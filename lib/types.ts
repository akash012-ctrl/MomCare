export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
    created_at?: string;
    email_verified?: boolean;
}

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    authError: string | null;
    signUp: (params: SignUpParams) => Promise<void>;
    signIn: (params: SignInParams) => Promise<void>;
    signOut: () => Promise<void>;
    clearError: () => void;
    resetPassword: (email: string) => Promise<string>;
    preferredLanguage: "en" | "hi";
    updateLanguagePreference: (language: "en" | "hi") => Promise<void>;
    resendVerificationEmail: () => Promise<void>;
}

export interface SignUpParams {
    name: string;
    email: string;
    password: string;
}

export interface SignInParams {
    email: string;
    password: string;
}
