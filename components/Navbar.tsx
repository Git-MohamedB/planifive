"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { GoldenSlot } from "@/components/PlanningGrid";

interface NavbarProps {
  goldenSlots: GoldenSlot[];
}

export default function Navbar({ goldenSlots }: NavbarProps) {
  const { data: session } = useSession();
  const [showTooltip, setShowTooltip] = useState(false);

  // DEBUG: Log session data
  useEffect(() => {
    if (session) {
      console.log("=== SESSION DEBUG ===");
      console.log("Full session:", session);
      console.log("User name:", session?.user?.name);
      console.log("User image:", session?.user?.image);
      console.log("User email:", session?.user?.email);
    }
  }, [session]);

  if (!session) return null;

  const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || "Utilisateur";
  const displayImage = session?.user?.image;

  return (
    <div style={{ height: '48px', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #333', marginBottom: '12px' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '18px', height: '18px' }}>
          <img
            src="/favicon.ico"
            alt="Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'white' }}>Five Planner</span>
      </div>

      {/* Stats with Tooltip */}
      <div
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', background: '#1A1A1A', padding: '6px 14px', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase' }}>Matchs 3h</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Trophy size={13} color="#EAB308" />
          <span style={{ fontWeight: 'bold', fontSize: '13px', color: 'white' }}>{goldenSlots.length}</span>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '8px',
            background: '#1F1F1F',
            border: '1px solid #333',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '220px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '11px', color: '#999', marginBottom: '8px', fontWeight: '600' }}>Créneaux validés (3h consécutives)</div>
            {goldenSlots.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {goldenSlots.map((slot, idx) => (
                  <div key={idx} style={{
                    fontSize: '11px',
                    color: '#1ED760',
                    fontWeight: '600',
                    background: '#0A0A0A',
                    padding: '6px 8px',
                    borderRadius: '4px',
                    border: '1px solid #2A2A2A'
                  }}>
                    {slot.day} • {slot.hour}h-{slot.hour + 3}h
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: '#666', fontWeight: '500' }}>
                Aucun créneau pour le moment
              </div>
            )}
          </div>
        )}
      </div>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', background: '#333', border: '2px solid #555' }}>
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  console.error("Failed to load image:", displayImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px' }}>
                {displayName.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', lineHeight: '1' }}>
              {displayName}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: '10px', color: '#22C55E', fontWeight: '500' }}>Connecté</span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
          title="Se déconnecter"
        >
          <LogOut size={15} />
        </button>
      </div>

    </div>
  );
}
