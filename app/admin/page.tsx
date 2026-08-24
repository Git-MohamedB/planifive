"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, PhoneCall, Check, Trash2, Ban, RotateCcw, MapPin, Sparkles, AlertCircle, Clock, Target, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    customName: string | null;
    isBanned: boolean;
    technique: number | null;
    cardio: number | null;
}

interface Call {
    id: string;
    date: string;
    hour: number;
    location: string;
    duration: number;
    creator: {
        name: string | null;
        image: string | null;
    };
}

function UserAvatar({ src, name }: { src: string | null; name: string | null }) {
    const [imageError, setImageError] = useState(false);
    const initial = name?.charAt(0).toUpperCase() || "?";

    if (!src || imageError) {
        return (
            <div
                style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)',
                    border: '1.5px solid rgba(34, 197, 94, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ADE80',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    flexShrink: 0,
                }}
            >
                {initial}
            </div>
        );
    }

    return (
        <div
            style={{
                width: '42px',
                height: '42px',
                minWidth: '42px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '1.5px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(0, 0, 0, 0.4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                flexShrink: 0,
            }}
        >
            <img
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                }}
            />
        </div>
    );
}

export default function AdminPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"users" | "calls">("users");

    // Guest Player Creation State
    const [showAddGuestModal, setShowAddGuestModal] = useState(false);
    const [newGuestName, setNewGuestName] = useState("");
    const [newGuestTechnique, setNewGuestTechnique] = useState("3.0");
    const [newGuestCardio, setNewGuestCardio] = useState("3.0");
    const [creatingGuest, setCreatingGuest] = useState(false);

    const ADMIN_EMAILS = ["sheizeracc@gmail.com"];
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

    const handleCreateGuest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGuestName.trim()) return;
        setCreatingGuest(true);
        try {
            const res = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newGuestName.trim(),
                    technique: parseFloat(newGuestTechnique) || 3.0,
                    cardio: parseFloat(newGuestCardio) || 3.0,
                }),
            });
            if (res.ok) {
                const created = await res.json();
                setUsers(prev => [...prev, created]);
                setNewGuestName("");
                setShowAddGuestModal(false);
            } else {
                const err = await res.json();
                alert(err.error || "Erreur lors de la création du joueur");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setCreatingGuest(false);
        }
    };

    useEffect(() => {
        if (status === "loading") return;
        if (!isAdmin) {
            router.push("/");
            return;
        }
        fetchAllData();
    }, [session, status, router]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, callsRes] = await Promise.all([
                fetch("/api/users"),
                fetch("/api/calls")
            ]);

            if (usersRes.ok) setUsers(await usersRes.json());
            if (callsRes.ok) setCalls(await callsRes.json());
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async (userId: string, newName: string) => {
        setSaving(userId);
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customName: newName }),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, customName: newName } : u));
            } else {
                const errorData = await res.json();
                alert(`Erreur: ${errorData.error || "Mise à jour échouée"}`);
            }
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Erreur réseau: Vérifiez votre connexion ou la base de données.");
        } finally {
            setSaving(null);
        }
    };

    const handleUpdateSkill = async (userId: string, field: 'technique' | 'cardio', value: string) => {
        const numVal = value === '' ? null : parseFloat(value);
        if (numVal !== null && (isNaN(numVal) || numVal < 0 || numVal > 5)) return;
        
        setSaving(userId);
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [field]: numVal }),
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === userId ? { ...u, [field]: numVal } : u));
            } else {
                const errorData = await res.json();
                alert(`Erreur: ${errorData.error || "Mise à jour échouée"}`);
            }
        } catch (error) {
            console.error("Error updating skill:", error);
        } finally {
        }
    };

    const handleDeleteCall = async (callId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cet appel ?")) return;
        try {
            const res = await fetch(`/api/calls?id=${callId}`, { method: "DELETE" });
            if (res.ok) {
                setCalls(calls.filter(c => c.id !== callId));
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleBanUser = async (user: User) => {
        const isBanned = user.isBanned;
        const confirmMessage = isBanned
            ? "Voulez-vous réactiver ce joueur ? Il pourra de nouveau se connecter."
            : "ATTENTION : Vous êtes sur le point de BANNIR ce joueur.\n\nIl ne pourra plus se connecter.\n\nÊtes-vous sûr ?";

        if (!confirm(confirmMessage)) return;

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isBanned: !isBanned })
            });

            if (res.ok) {
                setUsers(users.map(u => u.id === user.id ? { ...u, isBanned: !isBanned } : u));
            } else {
                const data = await res.json();
                alert(`Erreur: ${data.error || "Action échouée"}`);
            }
        } catch (error) {
            console.error("Error updated user:", error);
            alert("Erreur réseau");
        }
    };

    if (status === "loading" || !isAdmin) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center text-white">
                <div className="flex items-center gap-3 bg-white/[0.05] backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10">
                    <ShieldAlert className="animate-spin text-emerald-400" size={24} />
                    <span className="font-semibold text-gray-300">Chargement du panneau admin...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white p-3 pb-32 flex flex-col items-center">
            {/* Header (Navbar) - Aligned Max Width 1600px */}
            <div className="relative z-50 w-full max-w-[1600px] mx-auto">
                <Navbar
                    title="ADMIN"
                    icon={<ShieldAlert size={20} className="text-emerald-400" color="#22C55E" />}
                />
            </div>

            {/* Tab Navigation - Pill Glass Selector */}
            <div className="w-full max-w-[1600px] mx-auto flex justify-center my-4">
                <div style={{
                    display: 'flex',
                    background: 'rgba(8, 10, 12, 0.95)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '4px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                }}>
                    <button
                        onClick={() => setActiveTab("users")}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 24px',
                            borderRadius: '16px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            ...(activeTab === "users" ? {
                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0.5px rgba(255, 255, 255, 0.35)',
                            } : {
                                background: 'transparent',
                                color: 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid transparent',
                            })
                        }}
                    >
                        <Users size={16} />
                        <span>Gestion Joueurs ({users.length})</span>
                    </button>
                    <button
                        onClick={() => setActiveTab("calls")}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 24px',
                            borderRadius: '16px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            ...(activeTab === "calls" ? {
                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)',
                                color: '#FFFFFF',
                                border: '1px solid rgba(255, 255, 255, 0.18)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0.5px rgba(255, 255, 255, 0.35)',
                            } : {
                                background: 'transparent',
                                color: 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid transparent',
                            })
                        }}
                    >
                        <PhoneCall size={16} />
                        <span>Gestion Appels ({calls.length})</span>
                    </button>
                </div>
            </div>

            {/* Main Admin Card Container - Width 100%, Max Width 1600px with bottom margin */}
            <div className="w-full max-w-[1600px] mx-auto mb-16">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        background: 'rgba(8, 10, 12, 0.95)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.65)',
                        overflow: 'hidden',
                        width: '100%'
                    }}
                >
                    {/* Header - Padding 20px aligned with Navbar */}
                    <div style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div>
                            <h2 style={{
                                fontSize: '17px',
                                fontWeight: 800,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                margin: '0 0 3px 0',
                                letterSpacing: '0.01em'
                            }}>
                                {activeTab === "users" ? (
                                    <>
                                        <Users size={19} className="text-emerald-400" />
                                        <span>Gestion des Joueurs</span>
                                    </>
                                ) : (
                                    <>
                                        <PhoneCall size={19} className="text-emerald-400" />
                                        <span>Gestion des Appels Actifs</span>
                                    </>
                                )}
                            </h2>
                            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                                {activeTab === "users"
                                    ? "Personnalisez les prénoms affichés sur le planning et gérez les accès"
                                    : "Supervisez et supprimez les appels de match planifiés"}
                            </p>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {activeTab === "users" && (
                                <button
                                    onClick={() => setShowAddGuestModal(true)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '7px 14px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                        color: 'white',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.04em',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                                    }}
                                    className="hover:scale-105 active:scale-95 transition-all"
                                >
                                    <span>+ Ajouter un Joueur Externe</span>
                                </button>
                            )}

                            {/* Pill Counter Badge */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '12px',
                                background: 'rgba(34, 197, 94, 0.10)',
                                border: '1px solid rgba(34, 197, 94, 0.25)',
                                color: '#4ADE80',
                                fontSize: '12px',
                                fontWeight: 600,
                            }}>
                                <Sparkles size={13} />
                                <span>{activeTab === "users" ? `${users.length} Joueurs enregistrés` : `${calls.length} Appels actifs`}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Body - Padding 20px aligned with Navbar */}
                    <div style={{ padding: '18px 20px 28px 20px' }}>
                        {loading ? (
                            <div className="text-center text-gray-400 py-16">Chargement...</div>
                        ) : activeTab === "users" ? (
                            <div>
                                {/* Table Column Headers */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1.4fr) 90px 90px 110px 120px',
                                    gap: '12px',
                                    padding: '0 14px 10px 14px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    color: 'rgba(255, 255, 255, 0.45)',
                                    alignItems: 'center'
                                }}>
                                    <div>Joueur</div>
                                    <div>Prénom (Planning)</div>
                                    <div style={{ textAlign: 'center' }}><Target size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />Tech</div>
                                    <div style={{ textAlign: 'center' }}><Zap size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />Cardio</div>
                                    <div style={{ textAlign: 'center' }}>Statut</div>
                                    <div style={{ textAlign: 'right' }}>Action</div>
                                </div>

                                {/* Floating Glass User Rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'minmax(220px, 1fr) minmax(220px, 1.4fr) 90px 90px 110px 120px',
                                                gap: '12px',
                                                alignItems: 'center',
                                                padding: '10px 14px',
                                                borderRadius: '14px',
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                                transition: 'all 0.2s ease',
                                            }}
                                            className="hover:bg-white/[0.04] hover:border-emerald-500/20"
                                        >
                                            {/* Column 1: Joueur (Avatar + Name with larger gap) */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                                                <UserAvatar src={user.image} name={user.name} />
                                                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {user.name || "Sans pseudo"}
                                                    </span>
                                                    {user.isBanned ? (
                                                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                            <AlertCircle size={10} /> Compte Banni
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            Joueur Discord
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Column 2: Prénom (Planning) Input */}
                                            <div>
                                                <input
                                                    type="text"
                                                    defaultValue={user.customName || ""}
                                                    placeholder="Prénom dans le planning..."
                                                    style={{
                                                        width: '100%',
                                                        height: '42px',
                                                        background: 'rgba(0, 0, 0, 0.35)',
                                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                                        borderRadius: '12px',
                                                        padding: '0 16px',
                                                        fontSize: '13px',
                                                        fontFamily: 'inherit',
                                                        color: 'white',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    className="focus:border-emerald-500/60 focus:bg-black/50"
                                                    onBlur={(e) => {
                                                        if (e.target.value !== (user.customName || "")) {
                                                            handleUpdateName(user.id, e.target.value);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.currentTarget.blur();
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {/* Column 3: Technique /5 */}
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="0"
                                                    max="5"
                                                    defaultValue={user.technique ?? ''}
                                                    placeholder="-"
                                                    style={{
                                                        width: '60px',
                                                        height: '36px',
                                                        background: 'rgba(0, 0, 0, 0.35)',
                                                        border: '1px solid rgba(34, 197, 94, 0.15)',
                                                        borderRadius: '10px',
                                                        padding: '0 8px',
                                                        fontSize: '13px',
                                                        fontFamily: 'inherit',
                                                        color: '#4ADE80',
                                                        fontWeight: 700,
                                                        textAlign: 'center',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    className="focus:border-emerald-500/60"
                                                    onBlur={(e) => {
                                                        const current = user.technique !== null && user.technique !== undefined ? String(user.technique) : '';
                                                        if (e.target.value !== current) {
                                                            handleUpdateSkill(user.id, 'technique', e.target.value);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                />
                                            </div>

                                            {/* Column 4: Cardio /5 */}
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                <input
                                                    type="number"
                                                    step="0.25"
                                                    min="0"
                                                    max="5"
                                                    defaultValue={user.cardio ?? ''}
                                                    placeholder="-"
                                                    style={{
                                                        width: '60px',
                                                        height: '36px',
                                                        background: 'rgba(0, 0, 0, 0.35)',
                                                        border: '1px solid rgba(245, 158, 11, 0.15)',
                                                        borderRadius: '10px',
                                                        padding: '0 8px',
                                                        fontSize: '13px',
                                                        fontFamily: 'inherit',
                                                        color: '#FBBF24',
                                                        fontWeight: 700,
                                                        textAlign: 'center',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    className="focus:border-amber-500/60"
                                                    onBlur={(e) => {
                                                        const current = user.cardio !== null && user.cardio !== undefined ? String(user.cardio) : '';
                                                        if (e.target.value !== current) {
                                                            handleUpdateSkill(user.id, 'cardio', e.target.value);
                                                        }
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                                />
                                            </div>

                                            {/* Column 5: Statut */}
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                {saving === user.id ? (
                                                    <span style={{
                                                        padding: '5px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        background: 'rgba(234, 179, 8, 0.15)',
                                                        color: '#FACC15',
                                                        border: '1px solid rgba(234, 179, 8, 0.3)',
                                                    }} className="animate-pulse">
                                                        Sauvegarde...
                                                    </span>
                                                ) : user.customName ? (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        padding: '5px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        background: 'rgba(34, 197, 94, 0.12)',
                                                        color: '#4ADE80',
                                                        border: '1px solid rgba(34, 197, 94, 0.25)',
                                                    }}>
                                                        <Check size={12} /> Prêt
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        padding: '5px 12px',
                                                        borderRadius: '8px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        background: 'rgba(255, 255, 255, 0.04)',
                                                        color: 'rgba(255, 255, 255, 0.4)',
                                                    }}>
                                                        Non défini
                                                    </span>
                                                )}
                                            </div>

                                            {/* Column 4: Action (Exact same width for Bannir and Restaurer) */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <button
                                                    onClick={() => handleBanUser(user)}
                                                    style={{
                                                        width: '115px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.06em',
                                                        cursor: 'pointer',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        transition: 'all 0.2s ease',
                                                        boxSizing: 'border-box',
                                                        ...(user.isBanned ? {
                                                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25) 0%, rgba(22, 163, 74, 0.15) 100%)',
                                                            border: '1px solid rgba(34, 197, 94, 0.4)',
                                                            color: '#4ADE80',
                                                            boxShadow: '0 2px 10px rgba(34, 197, 94, 0.2)',
                                                        } : {
                                                            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.12) 100%)',
                                                            border: '1px solid rgba(239, 68, 68, 0.35)',
                                                            color: '#F87171',
                                                            boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)',
                                                        })
                                                    }}
                                                >
                                                    {user.isBanned ? (
                                                        <>
                                                            <RotateCcw size={12} />
                                                            <span>Restaurer</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Ban size={12} />
                                                            <span>Bannir</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Calls View */
                            calls.length === 0 ? (
                                <div className="text-center text-gray-400 py-16 italic">Aucun appel actif en cours</div>
                            ) : (
                                <div>
                                    {/* Call Headers */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '150px 100px 100px 1.5fr 1.5fr 120px',
                                        gap: '16px',
                                        padding: '0 14px 10px 14px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        color: 'rgba(255, 255, 255, 0.45)',
                                        alignItems: 'center'
                                    }}>
                                        <div>Date</div>
                                        <div>Heure</div>
                                        <div>Durée</div>
                                        <div>Créateur</div>
                                        <div>Lieu</div>
                                        <div style={{ textAlign: 'right' }}>Action</div>
                                    </div>

                                    {/* Call Rows */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {calls.map((call) => {
                                            const dateObj = new Date(call.date);
                                            const dateStr = dateObj.toLocaleDateString("fr-FR", { weekday: 'short', day: 'numeric', month: 'short' });
                                            return (
                                                <div
                                                    key={call.id}
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '150px 100px 100px 1.5fr 1.5fr 120px',
                                                        gap: '16px',
                                                        alignItems: 'center',
                                                        padding: '10px 14px',
                                                        borderRadius: '14px',
                                                        background: 'rgba(255, 255, 255, 0.02)',
                                                        border: '1px solid rgba(255, 255, 255, 0.04)',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    className="hover:bg-white/[0.04] hover:border-emerald-500/20"
                                                >
                                                    <div className="text-sm font-bold capitalize text-white">{dateStr}</div>
                                                    <div className="text-sm text-emerald-400 font-bold">{call.hour}h00</div>
                                                    <div>
                                                        <span style={{
                                                            background: 'rgba(255, 255, 255, 0.06)',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            color: 'rgba(255, 255, 255, 0.8)'
                                                        }}>
                                                            {call.duration === 90 ? "1h30" : "1h"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <UserAvatar src={call.creator.image} name={call.creator.name} />
                                                        <span className="text-sm font-medium text-gray-200 truncate">{call.creator.name || "Inconnu"}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-300 truncate">
                                                        {call.location}
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => handleDeleteCall(call.id)}
                                                            style={{
                                                                padding: '6px 14px',
                                                                borderRadius: '10px',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.06em',
                                                                cursor: 'pointer',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.12) 100%)',
                                                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                                                color: '#F87171',
                                                                boxShadow: '0 2px 10px rgba(239, 68, 68, 0.15)',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                        >
                                                            <Trash2 size={12} />
                                                            <span>Supprimer</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Modal Ajout Joueur Externe */}
            {showAddGuestModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 200,
                        background: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px',
                    }}
                    onClick={() => setShowAddGuestModal(false)}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '440px',
                            background: 'rgba(8, 10, 12, 0.98)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '20px',
                            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
                            padding: '24px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Users size={20} className="text-emerald-400" />
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'white' }}>
                                    Ajouter un Joueur Externe
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowAddGuestModal(false)}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: 'none',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateGuest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                    Prénom / Pseudo du Joueur *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Thomas, Sofiane, Karim..."
                                    value={newGuestName}
                                    onChange={(e) => setNewGuestName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        outline: 'none',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Technique (0 à 5)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="5"
                                        value={newGuestTechnique}
                                        onChange={(e) => setNewGuestTechnique(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            outline: 'none',
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
                                        Cardio (0 à 5)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min="0"
                                        max="5"
                                        value={newGuestCardio}
                                        onChange={(e) => setNewGuestCardio(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)', margin: 0, lineHeight: 1.4 }}>
                                💡 Ce joueur apparaîtra dans le planning, les équipes équilibrées et le classement.
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddGuestModal(false)}
                                    style={{
                                        padding: '9px 16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.06)',
                                        border: '1px solid rgba(255, 255, 255, 0.10)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontWeight: 700,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingGuest}
                                    style={{
                                        padding: '9px 20px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                                    }}
                                >
                                    {creatingGuest ? "Création..." : "Créer le Joueur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


