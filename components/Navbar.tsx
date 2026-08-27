import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Megaphone, Trophy, History, Shield, LogOut, Menu, X, LayoutDashboard, Calendar, User } from "lucide-react";
import PlayerCardModal from "@/components/PlayerCardModal";

export interface SlotStats {
  max1h: number;
  max2h: number;
  slots1h: any[];
  slots2h: any[];
}

interface NavbarProps {
  stats?: SlotStats;
  title?: string;
  icon?: React.ReactNode;
  onOpenCallModal?: () => void;
}

export default function Navbar({ stats, title, icon, onOpenCallModal }: NavbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const hideCallButton = ["/admin", "/history", "/leaderboard"].includes(pathname);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const ADMIN_EMAILS = ["sheizeracc@gmail.com"];
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  if (!session) return null;

  const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || "Utilisateur";
  const displayImage = session?.user?.image;
  const userId = session?.user?.id;

  return (
    <>
      <div style={{
        height: '62px',
        width: '100%',
        boxSizing: 'border-box',
        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(14, 16, 20, 0.92) 30%, rgba(8, 10, 12, 0.98) 100%)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        border: '1px solid rgba(255, 255, 255, 0.10)',
        borderRadius: '22px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
        position: 'relative',
        zIndex: 2000
      }}>

        {/* Left: Logo */}
        <Link href="/" className="nav-logo-hover" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit', zIndex: 10 }}>
          <div style={{ width: '40px', height: '40px' }}>
            <img
              src="/logo-five.png"
              alt="Planifive Logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: 'white' }}>Planifive</span>
        </Link>

        {/* Center: Title OR Stats (Centered Liquid Glass Badge) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 15,
        }}>
          {title ? (
            // Sub-page Title Mode (Dashboard, Admin, History, Leaderboard)
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              padding: '6px 16px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            }}>
              {icon}
              <span style={{
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'white'
              }}>
                {title}
              </span>
            </div>
          ) : (
            // Home Page Stats Mode (1h & 1h30)
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '6px 14px',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(prev => !prev)}
            >
              {/* 1H Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>1H</span>
                <span style={{ fontWeight: 800, fontSize: '13px', color: (stats?.max1h || 0) >= 10 ? '#22C55E' : 'white' }}>
                  {stats?.max1h || 0}/10
                </span>
              </div>

              {/* Divider */}
              <div style={{ width: '1px', height: '14px', background: 'rgba(255, 255, 255, 0.15)' }} />

              {/* 1H30 Counter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.55)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>1H30</span>
                <span style={{ fontWeight: 800, fontSize: '13px', color: (stats?.max2h || 0) >= 10 ? '#22C55E' : 'white' }}>
                  {stats?.max2h || 0}/10
                </span>
              </div>

              {/* Tooltip Liquid Glass */}
              {showTooltip && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  marginTop: '10px',
                  background: 'rgba(8, 10, 12, 0.98)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '20px',
                  padding: '16px',
                  minWidth: '290px',
                  zIndex: 1000,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
                }}>
                  {/* Section 1H */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créneaux 1h (60 min)</span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: (stats?.max1h || 0) >= 10 ? '#22C55E' : 'rgba(255,255,255,0.6)' }}>Max: {stats?.max1h || 0}/10</span>
                    </div>
                    {stats?.slots1h && stats.slots1h.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {stats.slots1h.slice(0, 4).map((slot: any, idx: number) => {
                          const isFull = slot.count >= 10;
                          return (
                            <div key={idx} style={{
                              fontSize: '11px',
                              color: isFull ? '#22C55E' : '#4ADE80',
                              fontWeight: '700',
                              background: isFull ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isFull ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.20)',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span>{slot.day} • {slot.hour}h-{slot.hour + 1}h</span>
                              <span>{slot.count}/10</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', padding: '2px 0' }}>Aucune disponibilité</div>
                    )}
                  </div>

                  {/* Section 1H30 */}
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Créneaux 1h30 (2h dispo)</span>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: (stats?.max2h || 0) >= 10 ? '#22C55E' : 'rgba(255,255,255,0.6)' }}>Max: {stats?.max2h || 0}/10</span>
                    </div>
                    {stats?.slots2h && stats.slots2h.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {stats.slots2h.slice(0, 4).map((slot: any, idx: number) => {
                          const isFull = slot.count >= 10;
                          return (
                            <div key={idx} style={{
                              fontSize: '11px',
                              color: isFull ? '#22C55E' : '#4ADE80',
                              fontWeight: '700',
                              background: isFull ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: isFull ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid rgba(34, 197, 94, 0.20)',
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span>{slot.day} • {slot.hour}h-{slot.hour + 2}h</span>
                              <span>{slot.count}/10</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.35)', fontStyle: 'italic', padding: '2px 0' }}>Aucune disponibilité sur 2h</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: User & Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>

          {/* Call Button - Liquid Glass */}
          {!hideCallButton && (
            <button
              onClick={() => onOpenCallModal?.()}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '21px',
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.26) 0%, rgba(56, 189, 248, 0.18) 35%, rgba(14, 165, 233, 0.08) 100%)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25), inset 0 1.5px 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 1px 0 rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                flexShrink: 0,
              }}
              className="hover:scale-105 active:scale-95"
              title="Lancer un appel"
            >
              <Megaphone size={19} color="#38BDF8" />
            </button>
          )}

          {/* User Profile Info (Clickable -> Opens FUT Card Modal) */}
          <div
            onClick={() => setProfileModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '16px',
              transition: 'all 0.2s ease',
            }}
            className="hover:bg-white/[0.06] active:scale-95"
            title="Voir ma Carte FUT & Profil"
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: '#333', border: '2px solid rgba(255,255,255,0.2)' }}>
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#030905', fontWeight: 'bold' }}>
                  {displayName.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', lineHeight: '1.2' }}>
                {displayName}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (session?.user as any)?.isDemo ? '#38BDF8' : '#22C55E' }} />
                <span style={{ fontSize: '10px', color: (session?.user as any)?.isDemo ? '#38BDF8' : '#22C55E', fontWeight: '700' }}>
                  {(session?.user as any)?.isDemo ? 'Mode Démo' : 'Connecté'}
                </span>
              </div>
            </div>
          </div>

          {/* Glassy Sliding Menu */}
          <div
            style={{
              position: 'relative',
              height: '42px',
              borderRadius: '21px',
              background: isMenuOpen ? 'rgba(6, 18, 12, 0.94)' : 'linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.05) 100%)',
              backdropFilter: 'blur(24px) saturate(180%)',
              WebkitBackdropFilter: 'blur(24px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0.5px rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden',
              padding: '0 3px',
              zIndex: 30,
            }}
          >
            {/* Toggle Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isMenuOpen ? 'rgba(255, 255, 255, 0.10)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              title={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Sliding Icons Container */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                width: isMenuOpen ? (isAdmin ? '240px' : '200px') : '0px',
                opacity: isMenuOpen ? 1 : 0,
                transform: isMenuOpen ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden',
              }}
            >
              <Link
                href="/"
                title="Dashboard"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: '#38BDF8',
                  background: pathname === '/' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-white/10 hover:scale-110"
              >
                <LayoutDashboard size={18} />
              </Link>

              <Link
                href="/planning"
                title="Planning"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: pathname === '/planning' ? '#22C55E' : '#22C55E',
                  background: pathname === '/planning' ? 'rgba(34, 197, 94, 0.15)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-white/10 hover:scale-110"
              >
                <Calendar size={18} />
              </Link>

              <Link
                href="/leaderboard"
                title="Classement"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: pathname === '/leaderboard' ? '#EAB308' : '#EAB308',
                  background: pathname === '/leaderboard' ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-white/10 hover:scale-110"
              >
                <Trophy size={18} />
              </Link>

              <Link
                href="/history"
                title="Historique"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  color: pathname === '/history' ? '#A855F7' : '#A855F7',
                  background: pathname === '/history' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-white/10 hover:scale-110"
              >
                <History size={18} />
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  title="Administration"
                  style={{
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px',
                    color: pathname === '/admin' ? '#8B5CF6' : '#8B5CF6',
                    background: pathname === '/admin' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  className="hover:bg-white/10 hover:scale-110"
                >
                  <Shield size={18} />
                </Link>
              )}

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                title="Se déconnecter"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#EF4444',
                  transition: 'all 0.2s ease',
                }}
                className="hover:bg-white/10 hover:scale-110"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Player Profile & FUT Card Modal */}
      <PlayerCardModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        userId={userId}
      />
    </>
  );
}
