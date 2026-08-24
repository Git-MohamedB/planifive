"use client";

import { useState, useEffect } from "react";
import { X, Check, XCircle, MapPin, Clock, User as UserIcon, Trash2, ExternalLink } from "lucide-react";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";

import ConfirmModal from "./ConfirmModal";
import { getLeFiveBookingInfo } from "@/lib/lefive";

interface ActiveCallDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    call: any; // The call object from PlanningGrid
    onResponseUpdate?: () => void; // Callback to refresh grid/call data
    implicitAttendees?: any[]; // Users present in the slots
}

export default function ActiveCallDetailsModal({ isOpen, onClose, call, onResponseUpdate, implicitAttendees = [] }: ActiveCallDetailsModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [responses, setResponses] = useState<{ accepted: any[], declined: any[] }>({ accepted: [], declined: [] });
    const [myStatus, setMyStatus] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch responses when modal opens
    useEffect(() => {
        if (isOpen && call?.id) {
            fetchResponses();
        }
    }, [isOpen, call]);

    const fetchResponses = async () => {
        try {
            const res = await fetch(`/api/calls?id=${call.id}`);
            if (res.ok) {
                const fullCall = await res.json();
                processResponses(fullCall.responses || []);
            }
        } catch (e) { console.error(e); }
    };

    const processResponses = (responsesList: any[]) => {
        const explicitAccepted = responsesList.filter((r: any) => r.status === "ACCEPTED");
        const explicitDeclined = responsesList.filter((r: any) => r.status === "DECLINED");
        const declinedIds = new Set(explicitDeclined.map((r: any) => r.userId));
        const acceptedIds = new Set(explicitAccepted.map((r: any) => r.userId));

        let finalAccepted = explicitAccepted.map((r: any) => r.user);

        implicitAttendees?.forEach(user => {
            if (!declinedIds.has(user.id) && !acceptedIds.has(user.id)) {
                finalAccepted.push({ ...user, isImplicit: true });
            }
        });

        const finalDeclined = explicitDeclined.map((r: any) => r.user);

        setResponses({ accepted: finalAccepted, declined: finalDeclined });

        if (session?.user?.id) {
            const myResp = responsesList.find((r: any) => r.userId === session.user.id);
            setMyStatus(myResp ? myResp.status : null);
        }
    };

    const isCreator = session?.user?.id && call?.creatorId ? String(session.user.id) === String(call.creatorId) : false;

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            await fetch(`/api/calls?id=${call.id}`, { method: "DELETE" });
            if (onResponseUpdate) onResponseUpdate();
            onClose();
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
        setShowDeleteConfirm(false);
    };

    const handleRespond = async (status: "ACCEPTED" | "DECLINED") => {
        if (status === "DECLINED" && isCreator) {
            handleDeleteClick();
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/calls/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callId: call.id, status })
            });

            if (res.ok) {
                await fetchResponses();
                if (onResponseUpdate) onResponseUpdate();
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !call || !mounted) return null;
    if (typeof window === 'undefined') return null;

    const formatCallTimeRange = () => {
        const start = call.hour;
        if (call.duration === 90) {
            return `${start}h00 - ${start + 1}h30`;
        }
        return `${start}h00 - ${start + 1}h00`;
    };

    const modalContent = (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.82)',
                    zIndex: 9999999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    padding: '1rem',
                }}
                onClick={onClose}
            >
                <div
                    style={{
                        background: "#121212",
                        borderRadius: '20px',
                        border: '1px solid #282828',
                        maxWidth: '48rem',
                        width: '95%',
                        maxHeight: '85vh',
                        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        position: 'relative'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid #222222',
                        background: '#121212'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* 1. Time */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#FFFFFF', fontWeight: 700 }}>
                                    <Clock size={15} color="#38BDF8" />
                                    <span>{formatCallTimeRange()}</span>
                                </div>

                                {/* 2. Creator */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#FFFFFF', fontWeight: 600 }}>
                                    <UserIcon size={15} color="#94A3B8" />
                                    <span>Lancé par <strong style={{ color: '#FFFFFF' }}>{call.creator?.name || "???"}</strong></span>
                                </div>

                                {/* 3. Location */}
                                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', fontSize: '13px', color: '#FFFFFF', fontWeight: 600 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <MapPin size={15} color="#94A3B8" />
                                        <span>{call.location}</span>
                                    </div>
                                    {(() => {
                                        const bookingInfo = getLeFiveBookingInfo(call.location);
                                        return (
                                            <a
                                                href={bookingInfo.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    padding: '3px 9px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(56, 189, 248, 0.12)',
                                                    border: '1px solid rgba(56, 189, 248, 0.28)',
                                                    color: '#38BDF8',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    textDecoration: 'none',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                className="hover:bg-[#38BDF8]/20"
                                                title="Ouvrir la réservation sur le site officiel Le Five"
                                            >
                                                <span>Réserver sur Le Five</span>
                                                <ExternalLink size={11} />
                                            </a>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Actions Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {isCreator && (
                                    <button
                                        onClick={handleDeleteClick}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.12)',
                                            border: '1px solid rgba(239, 68, 68, 0.30)',
                                            color: '#EF4444',
                                            padding: '8px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s ease'
                                        }}
                                        title="Supprimer l'appel"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    style={{
                                        background: '#1a1a1a',
                                        border: '1px solid #2e2e2e',
                                        color: '#A1A1AA',
                                        padding: '8px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#FFFFFF';
                                        e.currentTarget.style.background = '#282828';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#A1A1AA';
                                        e.currentTarget.style.background = '#1a1a1a';
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content: 2 Columns */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.25rem 1.5rem',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        background: '#121212'
                    }}>

                        {/* Left: ACCEPTS */}
                        <div style={{
                            background: '#181818',
                            borderRadius: '16px',
                            padding: '14px',
                            border: '1px solid #282828',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '220px'
                        }}>
                            <div style={{
                                marginBottom: '12px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #242424',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Check size={14} color="#22C55E" />
                                <span style={{
                                    color: '#22C55E',
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    Présents ({responses.accepted.length})
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '260px' }} className="custom-scrollbar">
                                {responses.accepted.map((u: any, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '7px 10px',
                                        borderRadius: '10px',
                                        background: '#202020',
                                        border: '1px solid #2a2a2a'
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            minWidth: '32px',
                                            borderRadius: '50%',
                                            background: '#282828',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            border: '1px solid #383838'
                                        }}>
                                            {u.image ? (
                                                <img src={u.image} alt={u.name || "Joueur"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ color: '#FFFFFF', fontSize: '12px', fontWeight: 800 }}>
                                                    {u.name ? u.name[0].toUpperCase() : "?"}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {u.name}
                                        </span>
                                        {u.isImplicit && (
                                            <span style={{
                                                fontSize: '9px',
                                                color: '#22C55E',
                                                fontWeight: 800,
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                background: 'rgba(34, 197, 94, 0.12)',
                                                border: '1px solid rgba(34, 197, 94, 0.25)',
                                                letterSpacing: '0.05em'
                                            }}>
                                                DISPO
                                            </span>
                                        )}
                                    </div>
                                ))}
                                {responses.accepted.length === 0 && (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', fontSize: '11px', textAlign: 'center', padding: '30px 0' }}>
                                        En attente de réponses...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: REFUSALS */}
                        <div style={{
                            background: '#181818',
                            borderRadius: '16px',
                            padding: '14px',
                            border: '1px solid #282828',
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: '220px'
                        }}>
                            <div style={{
                                marginBottom: '12px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid #242424',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <XCircle size={14} color="#EF4444" />
                                <span style={{
                                    color: '#EF4444',
                                    fontWeight: 800,
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em'
                                }}>
                                    Absents ({responses.declined.length})
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '260px' }} className="custom-scrollbar">
                                {responses.declined.map((u: any, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '7px 10px',
                                        borderRadius: '10px',
                                        background: '#202020',
                                        border: '1px solid #2a2a2a',
                                        opacity: 0.65
                                    }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            minWidth: '32px',
                                            borderRadius: '50%',
                                            background: '#282828',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            border: '1px solid #383838'
                                        }}>
                                            {u.image ? (
                                                <img src={u.image} alt={u.name || "Joueur"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', fontWeight: 800 }}>
                                                    {u.name ? u.name[0].toUpperCase() : "?"}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', fontWeight: 600, textDecoration: 'line-through', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {u.name}
                                        </span>
                                    </div>
                                ))}
                                {responses.declined.length === 0 && (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', fontSize: '11px', textAlign: 'center', padding: '30px 0' }}>
                                        Aucun refus
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer: Actions */}
                    <div style={{
                        padding: '1.25rem 1.5rem',
                        borderTop: '1px solid #222222',
                        background: '#121212',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <button
                            onClick={() => handleRespond("ACCEPTED")}
                            disabled={loading}
                            style={{
                                width: '160px',
                                height: '42px',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '12px',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.15s ease',
                                background: myStatus === "ACCEPTED" ? 'rgba(34, 197, 94, 0.20)' : '#22C55E',
                                color: myStatus === "ACCEPTED" ? '#22C55E' : '#000000',
                                border: myStatus === "ACCEPTED" ? '1px solid rgba(34, 197, 94, 0.50)' : 'none',
                                boxShadow: myStatus === "ACCEPTED" ? 'none' : '0 4px 16px rgba(34, 197, 94, 0.30)'
                            }}
                        >
                            <Check size={16} strokeWidth={3} />
                            <span>{myStatus === "ACCEPTED" ? "PRÉSENT" : "ACCEPTER"}</span>
                        </button>

                        <button
                            onClick={() => handleRespond("DECLINED")}
                            disabled={loading}
                            style={{
                                width: '160px',
                                height: '42px',
                                borderRadius: '12px',
                                fontWeight: 800,
                                fontSize: '12px',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                transition: 'all 0.15s ease',
                                background: myStatus === "DECLINED" ? 'rgba(239, 68, 68, 0.20)' : '#1a1a1a',
                                color: myStatus === "DECLINED" ? '#EF4444' : '#F87171',
                                border: myStatus === "DECLINED" ? '1px solid rgba(239, 68, 68, 0.50)' : '1px solid #2e2e2e'
                            }}
                        >
                            <X size={16} strokeWidth={3} />
                            <span>{myStatus === "DECLINED" ? "REFUSÉ" : "REFUSER"}</span>
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                title="Supprimer l'appel ?"
                message="Voulez-vous vraiment annuler cet appel ? Cela le supprimera pour tous les participants."
                type="danger"
                zIndex={10000000}
            />
        </>
    );

    return createPortal(modalContent, document.body);
}
