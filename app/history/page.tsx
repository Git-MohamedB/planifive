"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Plus, Save, Trophy, Users, Lock, X, Edit, Trash2, MapPin, LogOut, History as HistoryIcon, Star, Crown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { haptic } from "@/lib/haptics";

interface User {
    id: string;
    name: string | null;
    image: string | null;
    customName?: string | null;
    isBanned?: boolean;
}

interface Match {
    id: string;
    date: string;
    location?: string;
    scoreTeam1: number;
    scoreTeam2: number;
    team1: User[];
    team2: User[];
    team1Names?: string[];
    team2Names?: string[];
    mvpVotes?: string;
    mvpWinner?: string;
}

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [matches, setMatches] = useState<Match[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [votingMatchId, setVotingMatchId] = useState<string | null>(null);
    const [votingSubmitting, setVotingSubmitting] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [location, setLocation] = useState("");
    const [scoreTeam1, setScoreTeam1] = useState("");
    const [scoreTeam2, setScoreTeam2] = useState("");
    const [team1Players, setTeam1Players] = useState<string[]>(["", "", "", "", "", ""]);
    const [team2Players, setTeam2Players] = useState<string[]>(["", "", "", "", "", ""]);
    const [submitting, setSubmitting] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);
    const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const ADMIN_EMAILS = ["sheizeracc@gmail.com"];
    const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

    // Vérification de l'authentification (Optionnel : on laisse tout le monde voir, mais seul l'admin peut modifier)
    /*
    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/");
            return;
        }
        fetchData();
    }, [session, status, router]);
    */

    // On charge les données pour tout le monde
    useEffect(() => {
        fetchData();
    }, [session]);

    const fetchData = async () => {
        try {
            const [matchesRes, usersRes] = await Promise.all([
                fetch("/api/matches", { cache: "no-store" }),
                fetch("/api/users", { cache: "no-store" }),
            ]);

            // Vérifier que les réponses sont OK avant de parser
            if (!matchesRes.ok) {
                console.error("Matches API error:", matchesRes.status, matchesRes.statusText);
                setMatches([]);
            } else {
                try {
                    const matchesData = await matchesRes.json();
                    setMatches(matchesData);
                } catch (jsonError) {
                    console.error("Error parsing matches JSON:", jsonError);
                    setMatches([]);
                }
            }

            if (!usersRes.ok) {
                console.error("Users API error:", usersRes.status, usersRes.statusText);
                setUsers([]);
            } else {
                try {
                    const usersData = await usersRes.json();
                    setUsers(usersData);
                } catch (jsonError) {
                    console.error("Error parsing users JSON:", jsonError);
                    setUsers([]);
                }
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setMatches([]);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (!isAdmin) return; // Sécurité supplémentaire
        e.preventDefault();
        setSubmitting(true);
        try {
            const method = editingMatch ? "PUT" : "POST";
            const url = editingMatch ? `/api/matches/${editingMatch.id}` : "/api/matches";

            const requestBody = {
                date,
                location,
                scoreTeam1: parseInt(scoreTeam1) || 0,
                scoreTeam2: parseInt(scoreTeam2) || 0,
                team1Names: team1Players.filter(name => name.trim() !== ""),
                team2Names: team2Players.filter(name => name.trim() !== ""),
            };

            console.log("Sending request:", { method, url, body: requestBody });

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            let data = null;
            try {
                const text = await res.text();
                data = text ? JSON.parse(text) : null;
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                data = { error: `Invalid response: ${res.statusText}` };
            }

            if (res.ok) {
                setShowForm(false);
                await fetchData();
                // Reset form
                setEditingMatch(null);
                setLocation("");
                setScoreTeam1("");
                setScoreTeam2("");
                setTeam1Players(["", "", "", "", "", ""]);
                setTeam2Players(["", "", "", "", "", ""]);
            } else {
                const errorMessage = data?.message || data?.error || `Erreur HTTP ${res.status}`;
                const errorDetails = data?.details ? `\n\nDétails: ${JSON.stringify(data.details)}` : '';
                console.error("Error saving match:", {
                    status: res.status,
                    statusText: res.statusText,
                    error: errorMessage,
                    code: data?.code,
                    data
                });
                alert(`Erreur lors de l'enregistrement du match:\n${errorMessage}${errorDetails}`);
            }
        } catch (error: any) {
            console.error("Error saving match (catch):", error);
            const errorMessage = error?.message || error?.toString() || 'Erreur réseau lors de l\'enregistrement';
            console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
            alert(`Erreur: ${errorMessage}`);
        } finally {
            setSubmitting(false);
        }
    };

    const updatePlayerName = (team: 1 | 2, index: number, name: string) => {
        if (team === 1) {
            setTeam1Players(prev => prev.map((player, i) => i === index ? name : player));
        } else {
            setTeam2Players(prev => prev.map((player, i) => i === index ? name : player));
        }
    };

    const openAddModal = () => {
        if (!isAdmin) return;
        setEditingMatch(null);
        setDate(new Date().toISOString().split("T")[0]);
        setLocation("");
        setScoreTeam1("");
        setScoreTeam2("");
        setTeam1Players(["", "", "", "", "", ""]);
        setTeam2Players(["", "", "", "", "", ""]);
        setShowForm(true);
    };

    const openEditModal = (match: Match) => {
        if (!isAdmin) return;
        setEditingMatch(match);
        setDate(match.date.split("T")[0]);
        setLocation(match.location || "");
        setScoreTeam1(match.scoreTeam1.toString());
        setScoreTeam2(match.scoreTeam2.toString());
        setTeam1Players(match.team1Names || match.team1.map(p => p.name || ""));
        setTeam2Players(match.team2Names || match.team2.map(p => p.name || ""));
        setShowForm(true);
    };

    const confirmDelete = async () => {
        if (!isAdmin || !deletingMatchId) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/matches/${deletingMatchId}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                setMatches(prev => prev.filter(m => m.id !== deletingMatchId));
                setDeletingMatchId(null);
            } else {
                console.error("Error deleting match:", data);
                alert(`Erreur: ${data.error || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error("Error deleting match:", error);
            alert("Erreur lors de la suppression du match");
        } finally {
            setIsDeleting(false);
            setDeletingMatchId(null);
        }
    };

    const handleVoteMvp = async (matchId: string, playerName: string) => {
        if (!session) {
            alert("Connectez-vous pour voter pour le MVP du match.");
            return;
        }
        haptic.playSelect();
        setVotingSubmitting(true);
        try {
            const res = await fetch(`/api/matches/${matchId}/vote-mvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ votedPlayerName: playerName }),
            });
            const data = await res.json();
            if (res.ok) {
                setMatches((prev) =>
                    prev.map((m) =>
                        m.id === matchId
                            ? { ...m, mvpWinner: data.mvpWinner, mvpVotes: JSON.stringify(data.mvpVotes) }
                            : m
                    )
                );
            } else {
                alert(data?.error || "Erreur lors du vote");
            }
        } catch (err) {
            console.error("Failed to vote for MVP:", err);
            alert("Erreur réseau lors du vote");
        } finally {
            setVotingSubmitting(false);
        }
    };

    // Affichage pendant le chargement de la session
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#0a0a0a] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22C55E] mx-auto mb-4"></div>
                    <p className="text-gray-400">Chargement...</p>
                </div>
            </div>
        );
    }

    // PLUS DE BLOCAGE D'ACCÈS ICI - Tout le monde peut voir

    return (
        <div className="min-h-screen bg-transparent text-white p-3 pb-24">
            {/* Navbar Style Header */}
            <div className="relative z-50 w-full max-w-[1600px] mx-auto" style={{ marginBottom: '24px' }}>
                <Navbar
                    title="HISTORIQUE"
                    icon={<HistoryIcon size={20} className="text-green-500" color="#22C55E" />}
                />
            </div>

            <div className="max-w-[1600px] mx-auto">
                {/* History Header Action Bar */}
                <div className="flex items-center justify-between px-4" style={{ marginBottom: '24px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 18px',
                        borderRadius: '14px',
                        background: 'rgba(8, 10, 12, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'white',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}>
                        <Trophy size={16} color="#22C55E" />
                        <span>{matches.length} Matchs enregistrés</span>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={openAddModal}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.20)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0.5px rgba(255,255,255,0.35)',
                                borderRadius: '14px',
                                padding: '10px 22px',
                                color: '#FFFFFF',
                                fontWeight: 800,
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.10) 100%)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.background = 'linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.06) 100%)';
                            }}
                        >
                            <Plus size={16} color="#22C55E" />
                            <span>NOUVEAU MATCH</span>
                        </button>
                    )}
                </div>

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.82)',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                zIndex: 999999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1.5rem',
                            }}
                            onClick={() => setShowForm(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                style={{
                                    background: "rgba(8, 10, 12, 0.98)",
                                    backdropFilter: 'blur(32px)',
                                    WebkitBackdropFilter: 'blur(32px)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    maxWidth: '680px',
                                    width: '100%',
                                    maxHeight: '92vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header Liquid Glass */}
                                <div style={{
                                    padding: '2.25rem 2rem 1.5rem 2rem',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        style={{
                                            position: 'absolute',
                                            top: '18px',
                                            right: '18px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'rgba(255, 255, 255, 0.5)',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                                        }}
                                    >
                                        <X size={18} />
                                    </button>

                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '14px',
                                        background: 'rgba(34, 197, 94, 0.12)',
                                        border: '1px solid rgba(34, 197, 94, 0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '4px'
                                    }}>
                                        <Trophy size={22} color="#22C55E" />
                                    </div>

                                    <h2 style={{
                                        fontSize: '1.4rem',
                                        fontWeight: 800,
                                        color: 'white',
                                        textAlign: 'center',
                                        letterSpacing: '0.01em',
                                        margin: 0,
                                    }}>
                                        {editingMatch ? "Modifier le Match" : "Nouveau Match"}
                                    </h2>
                                </div>

                                {/* Form Content */}
                                <div style={{ padding: '2rem 2.25rem 2.25rem 2.25rem' }}>

                                    <form
                                        onSubmit={handleSubmit}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', width: '100%' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Date</label>
                                                <input
                                                    type="date"
                                                    value={date}
                                                    onChange={(e) => setDate(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        height: '46px',
                                                        background: 'rgba(0, 0, 0, 0.35)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '14px',
                                                        padding: '0 16px',
                                                        fontSize: '14px',
                                                        fontFamily: 'inherit',
                                                        color: 'white',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onFocus={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Lieu</label>
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <input
                                                        type="text"
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        placeholder="Terrain, Stade..."
                                                        style={{
                                                            width: '100%',
                                                            height: '46px',
                                                            background: 'rgba(0, 0, 0, 0.35)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '14px',
                                                            padding: '0 16px 0 42px',
                                                            fontSize: '14px',
                                                            fontFamily: 'inherit',
                                                            color: 'white',
                                                            outline: 'none',
                                                            boxSizing: 'border-box',
                                                            transition: 'all 0.2s ease',
                                                        }}
                                                        onFocus={(e) => {
                                                            e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                                                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                                        }}
                                                        onBlur={(e) => {
                                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                                                        }}
                                                    />
                                                    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center' }}>
                                                        <MapPin size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', width: '100%' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Score Équipe 1</label>
                                                <input
                                                    type="number"
                                                    value={scoreTeam1}
                                                    onChange={(e) => setScoreTeam1(e.target.value)}
                                                    placeholder="0"
                                                    style={{
                                                        width: '100%',
                                                        height: '46px',
                                                        background: 'rgba(0, 0, 0, 0.35)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '14px',
                                                        padding: '0 16px',
                                                        fontSize: '14px',
                                                        fontFamily: 'inherit',
                                                        color: 'white',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onFocus={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                                                    }}
                                                    min="0"
                                                />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Score Équipe 2</label>
                                                <input
                                                    type="number"
                                                    value={scoreTeam2}
                                                    onChange={(e) => setScoreTeam2(e.target.value)}
                                                    placeholder="0"
                                                    style={{
                                                        width: '100%',
                                                        height: '46px',
                                                        background: 'rgba(0, 0, 0, 0.35)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        borderRadius: '14px',
                                                        padding: '0 16px',
                                                        fontSize: '14px',
                                                        fontFamily: 'inherit',
                                                        color: 'white',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onFocus={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                                                    }}
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '20px', width: '100%' }}>
                                            {/* Team 1 Players */}
                                            <div style={{ minWidth: 0 }}>
                                                <h3 style={{ fontWeight: 800, marginBottom: '10px', color: '#22C55E', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Users size={15} />
                                                    Équipe 1
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {team1Players.map((player, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            value={player}
                                                            onChange={(e) => updatePlayerName(1, index, e.target.value)}
                                                            placeholder={`Joueur ${index + 1}${index === 5 ? ' (optionnel)' : ''}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '40px',
                                                                background: 'rgba(0, 0, 0, 0.35)',
                                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                                borderRadius: '12px',
                                                                padding: '0 14px',
                                                                fontSize: '13px',
                                                                fontFamily: 'inherit',
                                                                color: 'white',
                                                                outline: 'none',
                                                                boxSizing: 'border-box',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            onFocus={(e) => {
                                                                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                                                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Team 2 Players */}
                                            <div style={{ minWidth: 0 }}>
                                                <h3 style={{ fontWeight: 800, marginBottom: '10px', color: '#4ADE80', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Users size={15} />
                                                    Équipe 2
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {team2Players.map((player, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            value={player}
                                                            onChange={(e) => updatePlayerName(2, index, e.target.value)}
                                                            placeholder={`Joueur ${index + 1}${index === 5 ? ' (optionnel)' : ''}`}
                                                            style={{
                                                                width: '100%',
                                                                height: '40px',
                                                                background: 'rgba(0, 0, 0, 0.35)',
                                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                                borderRadius: '12px',
                                                                padding: '0 14px',
                                                                fontSize: '13px',
                                                                fontFamily: 'inherit',
                                                                color: 'white',
                                                                outline: 'none',
                                                                boxSizing: 'border-box',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            onFocus={(e) => {
                                                                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                                                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                                            }}
                                                            onBlur={(e) => {
                                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.35)';
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            style={{ display: 'none' }}
                                        />
                                    </form>
                                </div>

                                {/* Actions */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    gap: '12px',
                                    padding: '0 2.25rem 2rem 2.25rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                    paddingTop: '20px'
                                }}>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '12px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            fontFamily: 'inherit',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                        }}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const form = document.querySelector('form');
                                            if (form) {
                                                form.requestSubmit();
                                            }
                                        }}
                                        disabled={submitting}
                                        style={{
                                            padding: '12px 28px',
                                            borderRadius: '12px',
                                            background: 'linear-gradient(135deg, #22C55E 0%, #16a34a 100%)',
                                            border: 'none',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '13px',
                                            fontFamily: 'inherit',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                                    >
                                        {submitting ? "Enregistrement..." : "Confirmer"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Delete Confirmation Modal Liquid Glass */}
                <AnimatePresence>
                    {deletingMatchId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(4, 6, 16, 0.80)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                zIndex: 999999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1rem',
                            }}
                            onClick={() => setDeletingMatchId(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                style={{
                                    background: "rgba(8, 10, 12, 0.98)",
                                    backdropFilter: 'blur(32px)',
                                    WebkitBackdropFilter: 'blur(32px)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    maxWidth: '28rem',
                                    width: '95%',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '18px',
                                    background: 'rgba(239, 68, 68, 0.10)',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 1.2rem auto',
                                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                                }}>
                                    <Trash2 size={26} color="#EF4444" />
                                </div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                                    Supprimer le Match ?
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2rem', lineHeight: '1.4' }}>
                                    Cette action est irréversible. Toutes les statistiques liées à ce match seront recalculées.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                    <button
                                        onClick={() => setDeletingMatchId(null)}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '14px',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontWeight: 700,
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        style={{
                                            padding: '10px 24px',
                                            borderRadius: '14px',
                                            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                                            border: '1px solid rgba(255, 255, 255, 0.3)',
                                            color: 'white',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            textTransform: 'uppercase',
                                            boxShadow: '0 8px 25px rgba(239, 68, 68, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {isDeleting ? "Suppression..." : "Supprimer"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* SVG Filter Definition (Hidden but referenced by CSS) */}
                <svg className="vf-svg-container">
                    <defs>
                        <filter id="turbulent-displace" x="-20%" y="-20%" width="140%" height="140%">
                            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1"></feTurbulence>
                            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1"></feOffset>
                            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1"></feTurbulence>
                            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2"></feOffset>
                            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="2"></feTurbulence>
                            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise3"></feOffset>
                            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="2"></feTurbulence>
                            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise4"></feOffset>
                            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1"></feComposite>
                            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2"></feComposite>
                            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise"></feBlend>
                            <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="30" xChannelSelector="R" yChannelSelector="B"></feDisplacementMap>
                        </filter>
                    </defs>
                </svg>

                <div className="grid grid-cols-3 gap-x-12 max-w-[1600px] mx-auto w-full px-4 pb-64" style={{ rowGap: '150px' }}>
                    {loading ? (
                        <div className="col-span-full text-center text-gray-500 py-12">Chargement...</div>
                    ) : matches.length === 0 ? (
                        <div className="col-span-full text-center text-gray-500 py-12 bg-[#1A1A1A] rounded-3xl border border-white/5">
                            Aucun match enregistré pour le moment.
                        </div>
                    ) : (
                        matches.map((match, index) => (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                className="vf-main-container group relative transition-all duration-300 hover:scale-[1.03] hover:-translate-y-2 mb-32"
                            >
                                <div className="vf-card-container">
                                    <div className="vf-inner-container">
                                        <div className="vf-border-outer">
                                            <div className="vf-main-card"></div>
                                        </div>
                                        <div className="vf-glow-layer-1"></div>
                                        <div className="vf-glow-layer-2"></div>
                                    </div>

                                    <div className="vf-overlay-1"></div>
                                    <div className="vf-overlay-2"></div>
                                    <div className="vf-background-glow"></div>

                                    <div className="vf-content-container">
                                        {/* Actions (Absolute Positioned Liquid Glass) */}
                                        {isAdmin && (
                                            <div className="absolute top-5 right-5 flex items-center gap-2 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(match); }}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(6, 18, 12, 0.80)',
                                                        backdropFilter: 'blur(16px)',
                                                        WebkitBackdropFilter: 'blur(16px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(34, 197, 94, 0.25)';
                                                        e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                                                        e.currentTarget.style.color = '#4ADE80';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(6, 18, 12, 0.80)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                                    }}
                                                    title="Modifier"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeletingMatchId(match.id); }}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '12px',
                                                        background: 'rgba(6, 18, 12, 0.80)',
                                                        backdropFilter: 'blur(16px)',
                                                        WebkitBackdropFilter: 'blur(16px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.15)',
                                                        color: 'rgba(255, 255, 255, 0.8)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                                                        e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                                                        e.currentTarget.style.color = '#F87171';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(6, 18, 12, 0.80)';
                                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                                                    }}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="vf-content-top">
                                            <div className="vf-scrollbar-glass">
                                                {match.location || "Match Amical"} • {new Date(match.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                            </div>
                                            <p className="vf-title">
                                                {match.scoreTeam1} - {match.scoreTeam2}
                                            </p>
                                        </div>

                                        <hr className="vf-divider" />

                                        <div className="vf-content-bottom">
                                            {/* MVP Winner Badge */}
                                            {match.mvpWinner && (
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 12px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.16) 0%, rgba(245, 158, 11, 0.06) 100%)', border: '1px solid rgba(251, 191, 36, 0.35)', marginBottom: '14px', width: '100%', boxSizing: 'border-box' }}>
                                                    <Crown size={14} color="#FBBF24" />
                                                    <span style={{ fontSize: '12px', fontWeight: 900, color: '#FBBF24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                        MVP : {match.mvpWinner}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between w-full mb-4">
                                                <div className="text-left w-[45%]">
                                                    <p className="text-sm font-bold text-emerald-400 truncate mb-2 border-b border-emerald-500/20 pb-1">Équipe 1</p>
                                                    <div className="flex flex-col gap-1">
                                                        {(match.team1Names || match.team1.map(p => p.name || "")).filter(name => name.trim()).map((playerName, index) => (
                                                            <span key={index} className="text-xs text-gray-300">
                                                                {playerName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right w-[45%]">
                                                    <p className="text-sm font-bold text-emerald-300 truncate mb-2 border-b border-emerald-500/20 pb-1">Équipe 2</p>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {(match.team2Names || match.team2.map(p => p.name || "")).filter(name => name.trim()).map((playerName, index) => (
                                                            <span key={index} className="text-xs text-gray-300">
                                                                {playerName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* MVP Vote Button */}
                                            {(() => {
                                                const allPlayerNames = [
                                                    ...(match.team1Names || match.team1.map(p => p.name || "")),
                                                    ...(match.team2Names || match.team2.map(p => p.name || "")),
                                                ].filter((n): n is string => Boolean(n && typeof n === "string" && n.trim()));

                                                let parsedVotes: Record<string, string> = {};
                                                try { if (match.mvpVotes) parsedVotes = JSON.parse(match.mvpVotes); } catch { }
                                                const voterKey = (session?.user?.id || session?.user?.email || session?.user?.name || "").trim();
                                                const myVotedPlayer = (voterKey && parsedVotes[voterKey])
                                                    || (session?.user?.id && parsedVotes[session.user.id])
                                                    || (session?.user?.email && parsedVotes[session.user.email])
                                                    || (session?.user?.name && parsedVotes[session.user.name]);

                                                if (allPlayerNames.length === 0) return null;

                                                return (
                                                    <div style={{ width: '100%', marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setVotingMatchId(match.id);
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                padding: '7px 12px',
                                                                borderRadius: '10px',
                                                                background: myVotedPlayer ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                                                border: myVotedPlayer ? '1px solid rgba(251, 191, 36, 0.35)' : '1px solid rgba(255, 255, 255, 0.10)',
                                                                color: myVotedPlayer ? '#FBBF24' : 'rgba(255, 255, 255, 0.85)',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.04em',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '6px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                            }}
                                                            className="hover:scale-[1.02] active:scale-[0.98]"
                                                        >
                                                            <Star size={13} color={myVotedPlayer ? "#FBBF24" : "rgba(255, 255, 255, 0.7)"} />
                                                            <span>
                                                                {myVotedPlayer ? `Mon Vote : ${myVotedPlayer} (Modifier)` : "Voter pour le MVP du match"}
                                                            </span>
                                                        </button>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* MVP VOTING MODAL */}
            <AnimatePresence>
                {votingMatchId && (() => {
                    const votingMatch = matches.find((m) => m.id === votingMatchId);
                    if (!votingMatch) return null;

                    const team1Names = (votingMatch.team1Names || votingMatch.team1.map(p => p.name || "")).filter((n): n is string => Boolean(n && typeof n === "string" && n.trim()));
                    const team2Names = (votingMatch.team2Names || votingMatch.team2.map(p => p.name || "")).filter((n): n is string => Boolean(n && typeof n === "string" && n.trim()));

                    let parsedVotes: Record<string, string> = {};
                    try { if (votingMatch.mvpVotes) parsedVotes = JSON.parse(votingMatch.mvpVotes); } catch { }
                    const voterKey = (session?.user?.id || session?.user?.email || session?.user?.name || "").trim();
                    const myVotedPlayer = (voterKey && parsedVotes[voterKey])
                        || (session?.user?.id && parsedVotes[session.user.id])
                        || (session?.user?.email && parsedVotes[session.user.email])
                        || (session?.user?.name && parsedVotes[session.user.name]);

                    // Vote counts
                    const voteCounts: Record<string, number> = {};
                    Object.values(parsedVotes).forEach((vName) => {
                        voteCounts[vName] = (voteCounts[vName] || 0) + 1;
                    });

                    const renderPlayerButton = (pName: string) => {
                        const isMyPick = myVotedPlayer === pName;
                        const votes = voteCounts[pName] || 0;
                        const cleanP = pName.trim().toLowerCase();

                        // Match against active (non-banned) users only
                        const activeUsers = users.filter((u) => !u.isBanned);
                        const matchedUser = activeUsers.find((u) => {
                            const uName = (u.name || "").trim().toLowerCase();
                            const uCustom = (u.customName || "").trim().toLowerCase();
                            return uCustom === cleanP || uName === cleanP;
                        }) || activeUsers.find((u) => {
                            const uName = (u.name || "").trim().toLowerCase();
                            const uCustom = (u.customName || "").trim().toLowerCase();
                            const firstName = uName.split(" ")[0];
                            const customFirst = uCustom.split(" ")[0];
                            return (firstName && firstName === cleanP) || (customFirst && customFirst === cleanP);
                        });
                        const playerImage = matchedUser?.image;

                        return (
                            <button
                                key={pName}
                                disabled={votingSubmitting}
                                onClick={() => handleVoteMvp(votingMatch.id, pName)}
                                style={{
                                    padding: "10px 14px",
                                    borderRadius: "14px",
                                    background: isMyPick ? "rgba(251, 191, 36, 0.16)" : "rgba(255, 255, 255, 0.03)",
                                    border: isMyPick ? "1.5px solid #FBBF24" : "1px solid rgba(255, 255, 255, 0.06)",
                                    color: isMyPick ? "#FDE68A" : "white",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    boxShadow: isMyPick ? "0 4px 16px rgba(251, 191, 36, 0.22)" : "none",
                                }}
                                className="hover:bg-white/10 active:scale-[0.98]"
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                    {playerImage ? (
                                        <img
                                            src={playerImage}
                                            alt=""
                                            referrerPolicy="no-referrer"
                                            style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                                border: isMyPick ? "1.5px solid #FBBF24" : "1px solid rgba(255, 255, 255, 0.15)",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: "28px",
                                                height: "28px",
                                                borderRadius: "50%",
                                                background: isMyPick ? "#FBBF24" : "rgba(255, 255, 255, 0.10)",
                                                color: isMyPick ? "#06080A" : "white",
                                                fontSize: "11px",
                                                fontWeight: 900,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {pName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <span style={{ fontWeight: 800, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {pName}
                                    </span>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {votes > 0 && (
                                        <span style={{ fontSize: "11px", fontWeight: 800, color: isMyPick ? "#FBBF24" : "rgba(255, 255, 255, 0.5)" }}>
                                            {votes}
                                        </span>
                                    )}
                                    {isMyPick && <Check size={16} color="#FBBF24" strokeWidth={3} />}
                                </div>
                            </button>
                        );
                    };

                    return (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setVotingMatchId(null)}
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0, 0, 0, 0.85)",
                                backdropFilter: "blur(24px)",
                                WebkitBackdropFilter: "blur(24px)",
                                zIndex: 99999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "16px",
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.94, opacity: 0, y: 12 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.94, opacity: 0, y: 12 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    width: "100%",
                                    maxWidth: "520px",
                                    background: "rgba(8, 10, 12, 0.98)",
                                    backdropFilter: "blur(24px)",
                                    WebkitBackdropFilter: "blur(24px)",
                                    borderRadius: "24px",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
                                    padding: "24px",
                                    display: "flex",
                                    flexDirection: "column",
                                    maxHeight: "90vh",
                                    overflowY: "auto",
                                }}
                            >
                                {/* Header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", paddingBottom: "14px", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "42px",
                                                height: "42px",
                                                borderRadius: "12px",
                                                background: "transparent",
                                                border: "1.5px solid #FBBF24",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "#FBBF24",
                                            }}
                                        >
                                            <Star size={20} color="#FBBF24" />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900, textTransform: "uppercase", color: "white", letterSpacing: "0.04em" }}>
                                                Élection du MVP
                                            </h3>
                                            <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "rgba(255, 255, 255, 0.55)", fontWeight: 600 }}>
                                                {votingMatch.location || "Match"} • Score : {votingMatch.scoreTeam1} - {votingMatch.scoreTeam2}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setVotingMatchId(null)}
                                        style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "10px",
                                            background: "rgba(255, 255, 255, 0.06)",
                                            border: "1px solid rgba(255, 255, 255, 0.10)",
                                            color: "rgba(255, 255, 255, 0.7)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                        }}
                                        className="hover:text-white hover:bg-white/10"
                                        title="Fermer"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {/* Team 1 Section */}
                                <div style={{ marginBottom: "16px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#22C55E", letterSpacing: "0.06em", marginBottom: "8px" }}>
                                        Équipe 1
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                        {team1Names.map((pName) => renderPlayerButton(pName))}
                                    </div>
                                </div>

                                {/* Team 2 Section */}
                                <div style={{ marginBottom: "18px" }}>
                                    <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "#22C55E", letterSpacing: "0.06em", marginBottom: "8px" }}>
                                        Équipe 2
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                        {team2Names.map((pName) => renderPlayerButton(pName))}
                                    </div>
                                </div>

                                {/* Footer Note */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "14px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
                                    <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.45)", fontWeight: 600, textAlign: "center" }}>
                                        Cliquez sur un joueur pour voter ou modifier votre choix.
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
