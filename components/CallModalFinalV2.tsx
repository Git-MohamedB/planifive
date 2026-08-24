"use client";

import { useState, useEffect } from "react";
import { X, Megaphone, Clock, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CallModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDate?: string;
    initialHour?: string;
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];

export default function CallModal({ isOpen, onClose, initialDate, initialHour }: CallModalProps) {
    const [date, setDate] = useState(initialDate || "");
    const [hour, setHour] = useState(initialHour || "20");
    const [location, setLocation] = useState("");
    const [duration, setDuration] = useState(60); // 60 or 90
    const [price, setPrice] = useState("");
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset/Update state when modal opens or props change
    useEffect(() => {
        if (isOpen) {
            setDate(initialDate || "");
            setHour(initialHour || "20");
            setDuration(60);
            setPrice("");
            setComment("");
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, initialDate, initialHour]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/calls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ date, hour, location, duration, price, comment }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    onClose();
                    setDate("");
                    setLocation("");
                    setPrice("");
                    setComment("");
                    setDuration(60);
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error("Error sending call:", error);
            setError("Erreur de connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        zIndex: 999999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '620px',
                            background: 'linear-gradient(145deg, rgba(8, 16, 11, 0.96) 0%, rgba(4, 8, 6, 0.98) 100%)',
                            backdropFilter: 'blur(30px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 30px 80px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            zIndex: 10,
                            maxHeight: '92vh'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
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
                                onClick={onClose}
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
                                <Megaphone size={22} color="#22C55E" />
                            </div>
                            
                            <h2 style={{
                                fontSize: '1.4rem',
                                fontWeight: 800,
                                color: 'white',
                                textAlign: 'center',
                                letterSpacing: '0.01em',
                                margin: 0,
                            }}>
                                Lancer un Appel
                            </h2>
                        </div>

                        {/* Body */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem 2.25rem 2.25rem 2.25rem', overflowY: 'auto' }}>
                            {success ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', textAlign: 'center' }}>
                                    <div style={{
                                        width: '72px',
                                        height: '72px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '20px',
                                        background: 'rgba(34, 197, 94, 0.15)',
                                        border: '1px solid rgba(34, 197, 94, 0.3)'
                                    }}>
                                        <Megaphone size={34} color="#22C55E" />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: '0 0 8px 0' }}>Appel Envoyé !</h3>
                                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px', margin: 0 }}>La notification est partie sur Discord.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    {error && (
                                        <div style={{
                                            padding: '12px 16px',
                                            background: 'rgba(239, 68, 68, 0.12)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '12px',
                                            color: '#F87171',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            marginBottom: '20px',
                                            backdropFilter: 'blur(8px)'
                                        }}>
                                            {error}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                                        {/* Date */}
                                        <div style={{ width: '100%' }}>
                                            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                required
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
                                            />
                                        </div>

                                        {/* Heure & Durée */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', width: '100%' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                    Heure
                                                </label>
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <select
                                                        value={hour}
                                                        onChange={(e) => setHour(e.target.value)}
                                                        style={{
                                                            width: '100%',
                                                            height: '46px',
                                                            background: 'rgba(0, 0, 0, 0.35)',
                                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                                            borderRadius: '14px',
                                                            padding: '0 40px 0 16px',
                                                            fontSize: '14px',
                                                            fontFamily: 'inherit',
                                                            color: 'white',
                                                            outline: 'none',
                                                            boxSizing: 'border-box',
                                                            cursor: 'pointer',
                                                            appearance: 'none',
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
                                                    >
                                                        {HOURS.map((h) => (
                                                            <option key={h} value={h} style={{ background: '#08120a', color: 'white' }}>{h}h00</option>
                                                        ))}
                                                    </select>
                                                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'rgba(255, 255, 255, 0.4)', display: 'flex', alignItems: 'center' }}>
                                                        <Clock size={16} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                    Durée
                                                </label>
                                                <div style={{
                                                    display: 'flex',
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.35)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '14px',
                                                    padding: '4px',
                                                    height: '46px',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDuration(60)}
                                                        style={{
                                                            flex: 1,
                                                            borderRadius: '10px',
                                                            fontWeight: 700,
                                                            fontSize: '13px',
                                                            fontFamily: 'inherit',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            ...(duration === 60 ? {
                                                                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                                                color: 'white',
                                                                boxShadow: '0 2px 10px rgba(34, 197, 94, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                                                            } : {
                                                                background: 'transparent',
                                                                color: 'rgba(255, 255, 255, 0.6)',
                                                            })
                                                        }}
                                                    >
                                                        1h
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDuration(90)}
                                                        style={{
                                                            flex: 1,
                                                            borderRadius: '10px',
                                                            fontWeight: 700,
                                                            fontSize: '13px',
                                                            fontFamily: 'inherit',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            ...(duration === 90 ? {
                                                                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                                                color: 'white',
                                                                boxShadow: '0 2px 10px rgba(34, 197, 94, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                                                            } : {
                                                                background: 'transparent',
                                                                color: 'rgba(255, 255, 255, 0.6)',
                                                            })
                                                        }}
                                                    >
                                                        1h30
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lieu & Prix */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', width: '100%' }}>
                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                    Lieu
                                                </label>
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Ex: Urban Soccer..."
                                                        value={location}
                                                        onChange={(e) => setLocation(e.target.value)}
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
                                                {/* Quick Le Five Suggestions */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                                    {["La Courneuve", "Bobigny", "Bezons", "Paris 17", "Paris 18", "Créteil"].map((center) => (
                                                        <button
                                                            key={center}
                                                            type="button"
                                                            onClick={() => setLocation(`LE FIVE ${center}`)}
                                                            style={{
                                                                background: location === `LE FIVE ${center}` ? 'rgba(56, 189, 248, 0.20)' : 'rgba(255, 255, 255, 0.05)',
                                                                border: location === `LE FIVE ${center}` ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.10)',
                                                                color: location === `LE FIVE ${center}` ? '#38BDF8' : 'rgba(255, 255, 255, 0.65)',
                                                                padding: '3px 8px',
                                                                borderRadius: '8px',
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s ease',
                                                            }}
                                                            className="hover:border-[#38BDF8] hover:text-[#38BDF8]"
                                                        >
                                                            {center}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ minWidth: 0 }}>
                                                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                    Prix (Optionnel)
                                                </label>
                                                <div style={{ position: 'relative', width: '100%' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Ex: 10€"
                                                        value={price}
                                                        onChange={(e) => setPrice(e.target.value)}
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
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Commentaire */}
                                        <div style={{ width: '100%' }}>
                                            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
                                                Commentaire (Optionnel)
                                            </label>
                                            <textarea
                                                placeholder="Infos supplémentaires..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    minHeight: '85px',
                                                    background: 'rgba(0, 0, 0, 0.35)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '14px',
                                                    padding: '12px 16px',
                                                    fontSize: '14px',
                                                    fontFamily: 'inherit',
                                                    color: 'white',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    transition: 'all 0.2s ease',
                                                    resize: 'vertical'
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
                                        </div>
                                    </div>

                                    {/* Footer Action Buttons */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        gap: '12px',
                                        marginTop: '28px',
                                        paddingTop: '20px',
                                        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                                    }}>
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            style={{
                                                padding: '12px 24px',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontFamily: 'inherit',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
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
                                            type="submit"
                                            disabled={loading}
                                            style={{
                                                padding: '12px 28px',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontFamily: 'inherit',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                                color: 'white',
                                                border: 'none',
                                                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.3)',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s ease',
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                                            <span>Envoyer l'appel</span>
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
