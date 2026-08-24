"use client";

import { Save, Copy, X, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type: "save" | "apply" | "danger";
    zIndex?: number;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type,
    zIndex = 999999,
}: ConfirmModalProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    if (!isOpen) return null;
    if (typeof window === 'undefined') return null;

    const isDanger = type === "danger";

    const modalContent = (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(2, 8, 4, 0.75)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    zIndex: zIndex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 15 }}
                    transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                    style={{
                        background: "rgba(8, 10, 12, 0.98)",
                        backdropFilter: 'blur(32px)',
                        WebkitBackdropFilter: 'blur(32px)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
                        maxWidth: '430px',
                        width: '100%',
                        position: 'relative',
                        padding: '32px 28px 26px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button - Liquid Glass Capsule */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '18px',
                            right: '18px',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.06)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255, 255, 255, 0.10)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255, 255, 255, 0.6)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)';
                            e.currentTarget.style.color = 'white';
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Fermer"
                    >
                        <X size={16} />
                    </button>

                    {/* Emblem Icon - Clean Liquid Glass */}
                    <div
                        style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: isDanger ? 'rgba(239, 68, 68, 0.10)' : 'rgba(34, 197, 94, 0.10)',
                            border: isDanger ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(34, 197, 94, 0.25)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                        }}
                    >
                        {type === "save" ? (
                            <Save size={28} color="#22C55E" />
                        ) : type === "danger" ? (
                            <Trash2 size={28} color="#EF4444" />
                        ) : (
                            <Copy size={28} color="#22C55E" />
                        )}
                    </div>

                    {/* Title */}
                    <h2
                        style={{
                            fontSize: '20px',
                            fontWeight: 800,
                            color: 'white',
                            textAlign: 'center',
                            letterSpacing: '0.01em',
                            margin: '0 0 8px 0',
                        }}
                    >
                        {title}
                    </h2>

                    {/* Message Description */}
                    <p
                        style={{
                            color: 'rgba(255, 255, 255, 0.65)',
                            textAlign: 'center',
                            fontSize: '13.5px',
                            lineHeight: '1.55',
                            margin: '0 0 24px 0',
                            maxWidth: '340px',
                        }}
                    >
                        {message}
                    </p>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1,
                                height: '44px',
                                borderRadius: '14px',
                                background: 'rgba(255, 255, 255, 0.06)',
                                backdropFilter: 'blur(16px)',
                                WebkitBackdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.10)',
                                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                                color: 'rgba(255, 255, 255, 0.75)',
                                fontWeight: 700,
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.75)';
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            style={{
                                flex: 1,
                                height: '44px',
                                borderRadius: '14px',
                                background: isDanger
                                    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                                    : 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                boxShadow: isDanger
                                    ? '0 6px 20px rgba(239, 68, 68, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)'
                                    : '0 6px 20px rgba(34, 197, 94, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35)',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '12px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.filter = 'brightness(1.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.filter = 'brightness(1)';
                            }}
                        >
                            Confirmer
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
