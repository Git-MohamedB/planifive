"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Plus, Save, Trophy, Users, Lock, X, Edit, Trash2, MapPin, LogOut, History as HistoryIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

interface User {
    id: string;
    name: string | null;
    image: string | null;
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
}

export default function HistoryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [matches, setMatches] = useState<Match[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [location, setLocation] = useState("");
    const [scoreTeam1, setScoreTeam1] = useState("");
    const [scoreTeam2, setScoreTeam2] = useState("");
    const [team1Players, setTeam1Players] = useState<string[]>(["", "", "", "", "", ""]);
    const [team2Players, setTeam2Players] = useState<string[]>(["", "", "", "", "", ""]);
    const [submitting, setSubmitting] = useState(false);
    const [editingMatch, setEditingMatch] = useState<Match | null>(null);

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
    }, []);

    const fetchData = async () => {
        try {
            const [matchesRes, usersRes] = await Promise.all([
                fetch("/api/matches"),
                fetch("/api/users"),
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

    const handleDelete = async (matchId: string) => {
        if (!isAdmin) return;
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) return;

        try {
            const res = await fetch(`/api/matches/${matchId}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (res.ok) {
                await fetchData();
            } else {
                console.error("Error deleting match:", data);
                alert(`Erreur lors de la suppression du match: ${data.error || 'Erreur inconnue'}`);
            }
        } catch (error: any) {
            console.error("Error deleting match:", error);
            alert(`Erreur lors de la suppression du match: ${error?.message || 'Erreur réseau'}`);
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
        <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#0a0a0a] text-white p-4 md:p-8 pb-24">
            {/* Navbar Style Header */}
            {/* Navbar Style Header */}
            {/* Navbar Style Header */}
            <Navbar
                title="HISTORIQUE"
                icon={<HistoryIcon size={20} className="text-green-500" color="#22C55E" />}
            />

            <div className="max-w-[1600px] mx-auto">
                {/* Add Match Button */}
                {isAdmin && (
                    <div className="flex justify-end mb-8 px-4">
                        <button
                            onClick={openAddModal}
                            className="bg-white text-black font-bold py-2 px-4 rounded-full shadow-lg hover:bg-gray-200 transition-all duration-300 flex items-center gap-2 transform hover:scale-105 text-sm"
                        >
                            <Plus size={16} />
                            NOUVEAU MATCH
                        </button>
                    </div>
                )}

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
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                zIndex: 999999,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '1rem',
                            }}
                            onClick={() => setShowForm(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                style={{
                                    background: 'linear-gradient(to bottom right, #1A1A1A, #0F0F0F)',
                                    borderRadius: '32px',
                                    border: '1px solid #333',
                                    maxWidth: '65rem',
                                    width: '95%',
                                    maxHeight: '95vh',
                                    overflowY: 'auto',
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header */}
                                <div style={{
                                    background: 'linear-gradient(to bottom right, #222, #181818)',
                                    padding: '2rem 1.5rem',
                                    borderBottom: '1px solid #333',
                                    position: 'relative',
                                    borderTopLeftRadius: '32px',
                                    borderTopRightRadius: '32px',
                                }}>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="absolute top-4 right-4 p-3 rounded-full bg-transparent border-none text-[#B3B3B3] cursor-pointer transition-all duration-300 hover:bg-white/10 hover:text-white flex items-center justify-center"
                                    >
                                        <X size={18} />
                                    </button>

                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            padding: '1rem',
                                            borderRadius: '1rem',
                                            background: 'rgba(30, 215, 96, 0.1)',
                                            border: '1px solid rgba(30, 215, 96, 0.3)',
                                        }}>
                                            <Trophy size={32} color="#1ED760" />
                                        </div>
                                        <h2 style={{
                                            fontSize: '1.5rem',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            textAlign: 'center',
                                        }}>
                                            {editingMatch ? "Modifier le Match" : "Nouveau Match"}
                                        </h2>
                                    </div>
                                </div>

                                {/* Form Content */}
                                <div style={{ padding: '1.5rem 3rem 0 3rem' }}>

                                    <form
                                        onSubmit={handleSubmit}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                                    >
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '0.5rem' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <label className="block text-gray-400 text-sm font-medium" style={{ marginBottom: '0.25rem' }}>Date</label>
                                                <div className="relative w-full">
                                                    <input
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => setDate(e.target.value)}
                                                        className="w-full bg-[#2A2A2A] text-white focus:outline-none focus:bg-[#1a1a1a] transition-all duration-300 shadow-lg border-none ring-0"
                                                        style={{ borderRadius: '12px', padding: '0 1rem', height: '38px', width: '100%', boxSizing: 'border-box' }}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <label className="block text-gray-400 text-sm font-medium" style={{ marginBottom: '0.25rem' }}>Lieu</label>
                                                <div className="relative w-full">
                                                    <input
                                                        type="text"
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
                                                        placeholder="Terrain, Stade..."
                                                        className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 focus:outline-none focus:bg-[#1a1a1a] transition-all duration-300 shadow-lg border-none ring-0"
                                                        style={{ borderRadius: '12px', padding: '0 1rem 0 2rem', height: '38px', width: '100%', boxSizing: 'border-box' }}
                                                    />
                                                    <MapPin size={16} className="absolute text-gray-400 pointer-events-none" style={{ left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '0.5rem' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <label className="block text-gray-400 text-sm font-medium" style={{ marginBottom: '0.25rem' }}>Score Équipe 1</label>
                                                <input
                                                    type="number"
                                                    value={scoreTeam1}
                                                    onChange={(e) => setScoreTeam1(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-[#2A2A2A] text-white focus:outline-none focus:bg-[#1a1a1a] transition-all duration-300 shadow-lg border-none ring-0"
                                                    style={{ borderRadius: '12px', padding: '0 1rem', height: '38px', width: '100%', boxSizing: 'border-box' }}
                                                    min="0"
                                                />
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <label className="block text-gray-400 text-sm font-medium" style={{ marginBottom: '0.25rem' }}>Score Équipe 2</label>
                                                <input
                                                    type="number"
                                                    value={scoreTeam2}
                                                    onChange={(e) => setScoreTeam2(e.target.value)}
                                                    placeholder="0"
                                                    className="w-full bg-[#2A2A2A] text-white focus:outline-none focus:bg-[#1a1a1a] transition-all duration-300 shadow-lg border-none ring-0"
                                                    style={{ borderRadius: '12px', padding: '0 1rem', height: '38px', width: '100%', boxSizing: 'border-box' }}
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '0' }}>
                                            {/* Team 1 Players */}
                                            <div style={{ minWidth: 0 }}>
                                                <h3 className="font-bold mb-2 text-[#22C55E] text-left text-sm flex items-center gap-2">
                                                    <Users size={16} />
                                                    Équipe 1
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {team1Players.map((player, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            value={player}
                                                            onChange={(e) => updatePlayerName(1, index, e.target.value)}
                                                            placeholder={`Joueur ${index + 1}${index === 5 ? ' (optionnel)' : ''}`}
                                                            className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 focus:outline-none focus:bg-[#1a1a1a] transition-all duration-300 border-none ring-0"
                                                            style={{ borderRadius: '12px', padding: '0 1rem', height: '38px', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Team 2 Players */}
                                            <div style={{ minWidth: 0 }}>
                                                <h3 className="font-bold mb-2 text-blue-500 text-left text-sm flex items-center gap-2">
                                                    <Users size={16} />
                                                    Équipe 2
                                                </h3>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    {team2Players.map((player, index) => (
                                                        <input
                                                            key={index}
                                                            type="text"
                                                            value={player}
                                                            onChange={(e) => updatePlayerName(2, index, e.target.value)}
                                                            placeholder={`Joueur ${index + 1}${index === 5 ? ' (optionnel)' : ''}`}
                                                            className="w-full bg-[#2A2A2A] text-white placeholder:text-gray-500 focus:outline-none focus:bg-[#1a1a1a] transition-all duration-300 border-none ring-0"
                                                            style={{ borderRadius: '12px', padding: '0 1rem', height: '38px', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem' }}
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
                                <div className="flex justify-center" style={{ padding: '1.5rem 2rem 2rem 2rem', gap: '1.5rem' }}>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="btn-secondary text-xs uppercase tracking-wider font-bold"
                                        style={{ padding: '0.8rem 3rem', borderRadius: '12px', fontSize: '0.8rem' }}
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
                                        className="btn-primary text-xs uppercase tracking-wider font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ padding: '0.8rem 3rem', borderRadius: '12px', fontSize: '0.8rem' }}
                                    >
                                        {submitting ? "Enregistrement..." : "Confirmer"}
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
                                        {/* Actions (Absolute Positioned) */}
                                        {isAdmin && (
                                            <div className="absolute top-4 right-4 flex gap-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openEditModal(match); }}
                                                    className="p-2 text-white/80 bg-white/10 hover:bg-blue-500 hover:text-white rounded-full transition-all duration-300 backdrop-blur-md shadow-lg"
                                                    title="Modifier"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(match.id); }}
                                                    className="p-2 text-white/80 bg-white/10 hover:bg-red-600 hover:text-white rounded-full transition-all duration-300 backdrop-blur-md shadow-lg"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
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
                                            <div className="flex justify-between w-full mb-4">
                                                <div className="text-left w-[45%]">
                                                    <p className="text-sm font-bold text-sky-400 truncate mb-2 border-b border-white/20 pb-1">Équipe 1</p>
                                                    <div className="flex flex-col gap-1">
                                                        {(match.team1Names || match.team1.map(p => p.name || "")).filter(name => name.trim()).map((playerName, index) => (
                                                            <span key={index} className="text-xs text-gray-300">
                                                                {playerName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-right w-[45%]">
                                                    <p className="text-sm font-bold text-sky-400 truncate mb-2 border-b border-white/20 pb-1">Équipe 2</p>
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {(match.team2Names || match.team2.map(p => p.name || "")).filter(name => name.trim()).map((playerName, index) => (
                                                            <span key={index} className="text-xs text-gray-300">
                                                                {playerName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
