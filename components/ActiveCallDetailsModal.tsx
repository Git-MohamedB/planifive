"use client";

import { useState, useEffect } from "react";
import { X, Check, XCircle, MapPin, Clock, User as UserIcon, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { createPortal } from "react-dom";

interface ActiveCallDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    call: any; // The call object from PlanningGrid
    onResponseUpdate?: () => void; // Callback to refresh grid/call data
    implicitAttendees?: any[]; // Users present in the 4h slots
}

export default function ActiveCallDetailsModal({ isOpen, onClose, call, onResponseUpdate, implicitAttendees = [] }: ActiveCallDetailsModalProps) {
    // Forced update to trigger hot reload
    if (isOpen) console.log("🟣 [MODAL] Render ActiveCallDetailsModal. IsOpen:", isOpen, "Call:", call?.id);
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [responses, setResponses] = useState<{ accepted: any[], declined: any[] }>({ accepted: [], declined: [] });
    const [myStatus, setMyStatus] = useState<string | null>(null);

    // Fetch responses when modal opens
    useEffect(() => {
        if (isOpen && call?.id) {
            fetchResponses();
        }
    }, [isOpen, call]);

    const fetchResponses = async () => {
        try {
            // We assume PlanningGrid might pass responses if available, 
            // but fetching fresh data is safer. 
            // Or we can create a GET route, OR just rely on what is passed?
            // "PlanningGrid" fetches calls. Does it fetch responses?
            // The current "GET /api/calls" likely doesn't include responses. 
            // We need to either update GET /api/calls or fetch here.
            // Let's create a quick fetch inside this component or assume we update GET /api/calls later.
            // For now, let's fetch specific call details (?) 
            // actually, let's assume valid data flows in or we fetch.
            // I'll implement a simple fetch to a new endpoint or query param?
            // Let's use `GET /api/calls?id=...` which implies obtaining details.
            // I'll update GET /api/calls later to include responses.
            // For now, let's pretend `call` has `responses`.
            // If not, we might need to fetch.

            // Temporary: Fetch fresh call data with responses
            const res = await fetch(`/api/calls?id=${call.id}`);
            if (res.ok) {
                const fullCall = await res.json();
                processResponses(fullCall.responses || []);
            }
        } catch (e) { console.error(e); }
    };

    const processResponses = (responsesList: any[]) => {
        // 1. Identify Explicit Actions
        const explicitAccepted = responsesList.filter((r: any) => r.status === "ACCEPTED");
        const explicitDeclined = responsesList.filter((r: any) => r.status === "DECLINED");
        const declinedIds = new Set(explicitDeclined.map((r: any) => r.userId));
        const acceptedIds = new Set(explicitAccepted.map((r: any) => r.userId));

        // 2. Build Final Accepted List
        // Start with Explicit Accepted
        let finalAccepted = explicitAccepted.map((r: any) => r.user);

        // Add Implicit Attendees (if not explicitly declined AND not already added)
        implicitAttendees?.forEach(user => {
            if (!declinedIds.has(user.id) && !acceptedIds.has(user.id)) {
                finalAccepted.push({ ...user, isImplicit: true });
            }
        });

        // 3. Build Final Declined List (Just explicit declines)
        const finalDeclined = explicitDeclined.map((r: any) => r.user);

        setResponses({ accepted: finalAccepted, declined: finalDeclined });

        if (session?.user?.id) {
            const myResp = responsesList.find((r: any) => r.userId === session.user.id);
            setMyStatus(myResp ? myResp.status : null);
        }
    };

    const handleRespond = async (status: "ACCEPTED" | "DECLINED") => {
        setLoading(true);
        try {
            // 1. Send Response Status
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

    // Use Portal to ensure it sits on top of everything
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !call || !mounted) return null;
    if (typeof window === 'undefined') return null;

    const modalContent = (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                zIndex: 9999999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #1A1A1A, #0F0F0F)',
                    borderRadius: '32px',
                    border: '1px solid #333',
                    maxWidth: '50rem', // Wider than confirm modal to fit 2 cols
                    width: '90%',
                    maxHeight: '85vh',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.9)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(to bottom right, #222, #181818)',
                    padding: '1.5rem',
                    borderBottom: '1px solid #333',
                }}>
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-3">
                            {/* 1. Time */}
                            <div className="flex items-center gap-3 text-sm font-bold text-gray-300">
                                <Clock size={16} />
                                <span>{call.hour}H - {call.hour + (call.duration === 90 ? 5 : 4)}H00</span>
                            </div>

                            {/* 2. Creator */}

                            return createPortal(modalContent, document.body);
}
