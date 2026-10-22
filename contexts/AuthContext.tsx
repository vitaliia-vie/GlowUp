import { auth, db } from "@/services/firebaseConfig";
import { UserProfile, UserRole } from "@/types";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  // Why the user was signed out automatically (shown on the login screen)
  authNotice: string | null;
  clearAuthNotice: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // True while signUp is creating the account and writing the profile.
  // Firebase reports "signed in" before the profile document exists, so
  // without this flag we would sign the new user out by mistake.
  const isSigningUp = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      // signUp sets the profile itself
      if (isSigningUp.current) {
        setIsLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
          setAuthNotice(null);
        } else {
          // Signed in, but there is no profile (e.g. it was deleted from
          // Firestore). Without one the app can't pick client or master
          // screens, so explain it and sign out instead of hanging silently.
          setProfile(null);
          setAuthNotice(
            "This account has no profile any more. Please create a new account with Sign up.",
          );
          await firebaseSignOut(auth);
        }
      } catch (error: any) {
        setProfile(null);
        setAuthNotice(
          error?.message ?? "Could not load your profile. Please try again.",
        );
        await firebaseSignOut(auth);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const clearAuthNotice = () => setAuthNotice(null);

  const signIn = async (email: string, password: string) => {
    setAuthNotice(null);
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) => {
    setAuthNotice(null);
    isSigningUp.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const newProfile: UserProfile = {
        uid: credential.user.uid,
        email,
        role,
        displayName,
        createdAt: Date.now(),
      };

      try {
        await setDoc(doc(db, "users", credential.user.uid), newProfile);
      } catch (error) {
        // Don't leave a half-created account behind: it could sign in but
        // would have no profile.
        try {
          await deleteUser(credential.user);
        } catch {
          await firebaseSignOut(auth);
        }
        throw error;
      }

      setProfile(newProfile);
    } finally {
      isSigningUp.current = false;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        isLoading,
        authNotice,
        clearAuthNotice,
        signIn,
        signUp,
        signOut,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}