"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bell, Megaphone, Swords, Flame, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
        setUnreadCount(json.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClickNotification = async (item: NotificationItem) => {
    if (!item.read) {
      try {
        await fetch("/api/notifications", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: item.id }),
        });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
        );
      } catch (e) {
        console.error(e);
      }
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CALL_CREATED":
        return <Megaphone size={13} color="#F59E0B" />;
      case "SLOT_FULL":
        return <Flame size={13} color="#22C55E" />;
      case "MATCH_RECORDED":
        return <Swords size={13} color="#38BDF8" />;
      default:
        return <Calendar size={13} color="#22C55E" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "21px",
          background: isOpen ? "rgba(34, 197, 94, 0.18)" : "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: isOpen ? "1px solid rgba(34, 197, 94, 0.45)" : "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
        }}
        className="hover:scale-105"
        title="Notifications"
      >
        <Bell size={18} color={isOpen ? "#4ADE80" : "white"} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "4px",
              right: "4px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#EF4444",
              boxShadow: "0 0 8px rgba(239, 68, 68, 0.9)",
            }}
          />
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "12px",
              width: "300px",
              background: "rgba(6, 18, 12, 0.98)",
              backdropFilter: "blur(32px) saturate(200%)",
              WebkitBackdropFilter: "blur(32px) saturate(200%)",
              border: "1px solid rgba(34, 197, 94, 0.25)",
              borderRadius: "22px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.95), 0 0 20px rgba(34, 197, 94, 0.10)",
              padding: "16px",
              zIndex: 99999,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/15">
              <div className="flex items-center gap-2">
                <Bell size={13} color="#22C55E" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Notifications
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-[#22C55E] hover:underline cursor-pointer"
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto pr-1">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleClickNotification(item)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "12px",
                      background: item.read ? "rgba(255, 255, 255, 0.02)" : "rgba(34, 197, 94, 0.10)",
                      border: item.read
                        ? "1px solid rgba(255, 255, 255, 0.04)"
                        : "1px solid rgba(34, 197, 94, 0.25)",
                      cursor: "pointer",
                      display: "flex",
                      gap: "8px",
                      alignItems: "flex-start",
                    }}
                    className="hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="p-1.5 rounded-lg bg-black/40 flex-shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-white leading-tight">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-white/60 leading-tight mt-0.5 line-clamp-2">
                        {item.message}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-white/40 text-xs italic">
                  Aucune nouvelle notification
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
