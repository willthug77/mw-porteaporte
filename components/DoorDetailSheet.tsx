'use client'
import { X, Edit2, MapPin, Phone, User, Calendar, FileText, Bell } from 'lucide-react'
import AddressDisplay from '@/components/AddressDisplay'

export interface DoorDetail {
  id: string
  user_id: string
  latitude: number
  longitude: number
  address?: string
  status: string
  service_type?: string | null
  contract_value?: number | null
  scheduled_date?: string | null
  objection?: string | null
  notes?: string | null
  follow_up_needed?: boolean
  follow_up_date?: string | null
  client_name?: string | null
  phone?: string | null
  created_at: string
  updated_at?: string
  profiles?: { full_name: string; color: string }
}

interface Props {
  door: DoorDetail
  onClose: () => void
  onEdit: () => void
}

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pas_repondu:   { label: 'Sans réponse',   bg: '#F3F4F6', color: '#374151' },
  pas_interesse: { label: 'Pas intéressé',  bg: '#FEE2E2', color: '#991B1B' },
  interesse:     { label: 'Intéressé',      bg: '#FEF3C7', color: '#92400E' },
  a_rappeler:    { label: 'À rappeler',     bg: '#FEF3C7', color: '#92400E' },
  soumission:    { label: 'Soumission',     bg: '#E8F8F8', color: '#0D6E6F' },
  vendu:         { label: '✓ Vendu',        bg: '#D1FAE5', color: '#065F46' },
}

const SERVICE_LABELS: Record<string, string> = {
  vitres_ext:     'Lavage vitres ext.',
  vitres_int_ext: 'Lavage int./ext.',
  gouttières:     'Gouttières',
  paysager:       'Entretien paysager',
  pave_uni:       'Pavé uni',
  tourbe:         'Pose de tourbe',
  plates_bandes:  'Plates-bandes',
  autre:          'Autre',
}

const OBJECTION_LABELS: Record<string, string> = {
  pas_interesse: 'Pas intéressé',
  trop_cher:     'Trop cher',
  deja_quelquun: "Déjà quelqu'un",
  conjoint:      'Parler au conjoint',
  a_rappeler:    'À rappeler',
  reflechir:     'Veut réfléchir',
  autre:         'Autre',
}

function formatDateFr(dateStr: string): string {
  const d = new Date(dateStr)
  const datePart = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${datePart} à ${h}h${m}`
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
      <span style={{ color: '#69C9CA' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
      <span style={{ fontSize: 14, color: '#111827', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

function Badge({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg, color, borderRadius: 20,
      padding: '4px 12px', fontSize: 13, fontWeight: 600,
    }}>
      {label}
    </span>
  )
}

function Separator() {
  return <div style={{ height: 1, background: '#F3F4F6', margin: '16px 0' }} />
}

export default function DoorDetailSheet({ door, onClose, onEdit }: Props) {
  const status = STATUS_META[door.status] || { label: door.status, bg: '#F3F4F6', color: '#374151' }
  const repondu = door.status !== 'pas_repondu'
  const vendu = door.status === 'vendu'
  const hasClient = !!(door.client_name || door.phone)
  const hasNotes = !!(door.notes?.trim())
  const hasFollowUp = !!(door.follow_up_needed)

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 9999 }}>
      <div style={{
        background: '#FFFFFF',
        width: '100%',
        borderRadius: '16px 16px 0 0',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: 'Inter, sans-serif',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
          {/* Status badge + actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Badge label={status.label} bg={status.bg} color={status.color} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onEdit}
                style={{
                  background: '#69C9CA', color: '#000000', fontWeight: 600,
                  border: 'none', borderRadius: 8, padding: '8px 16px',
                  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Edit2 size={14} />
                Modifier
              </button>
              <button
                onClick={onClose}
                style={{
                  background: '#F3F4F6', border: 'none', borderRadius: '50%',
                  width: 34, height: 34, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={16} color="#6B7280" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 40px' }}>

          {/* Localisation */}
          <SectionTitle icon={<MapPin size={14} />} label="Localisation" />
          <AddressDisplay lat={door.latitude} lng={door.longitude} />

          <Separator />

          {/* Statut de la visite */}
          <SectionTitle icon={<FileText size={14} />} label="Statut de la visite" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#6B7280' }}>Répondu</span>
              <Badge
                label={repondu ? 'Oui' : 'Non'}
                bg={repondu ? '#D1FAE5' : '#F3F4F6'}
                color={repondu ? '#065F46' : '#374151'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, color: '#6B7280' }}>Vendu</span>
              <Badge
                label={vendu ? 'Oui' : 'Non'}
                bg={vendu ? '#D1FAE5' : '#F3F4F6'}
                color={vendu ? '#065F46' : '#374151'}
              />
            </div>
          </div>
          {door.service_type && (
            <InfoRow label="Service">{SERVICE_LABELS[door.service_type] || door.service_type}</InfoRow>
          )}
          {door.contract_value != null && (
            <InfoRow label="Montant">{door.contract_value.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}</InfoRow>
          )}
          {door.scheduled_date && (
            <InfoRow label="Date prévue">{formatDateShort(door.scheduled_date)}</InfoRow>
          )}
          {door.objection && (
            <InfoRow label="Objection">{OBJECTION_LABELS[door.objection] || door.objection}</InfoRow>
          )}

          {/* Informations client (conditional) */}
          {hasClient && (
            <>
              <Separator />
              <SectionTitle icon={<User size={14} />} label="Informations client" />
              {door.client_name && (
                <InfoRow label="Nom complet">{door.client_name}</InfoRow>
              )}
              {door.phone && (
                <InfoRow label="Téléphone">
                  <a href={`tel:${door.phone}`} style={{ color: '#69C9CA', textDecoration: 'none', fontWeight: 600 }}>
                    {door.phone}
                  </a>
                </InfoRow>
              )}
            </>
          )}

          <Separator />

          {/* Vendeur et date */}
          <SectionTitle icon={<Calendar size={14} />} label="Vendeur et date" />
          {door.profiles?.full_name && (
            <InfoRow label="Vendeur">{door.profiles.full_name}</InfoRow>
          )}
          <InfoRow label="Créé le">{formatDateFr(door.created_at)}</InfoRow>

          {/* Notes (conditional) */}
          {hasNotes && (
            <>
              <Separator />
              <SectionTitle icon={<FileText size={14} />} label="Notes" />
              <div style={{
                background: '#F9FAFB', borderRadius: 8, padding: '12px 14px',
                fontSize: 14, color: '#374151', lineHeight: 1.6,
              }}>
                {door.notes}
              </div>
            </>
          )}

          {/* Suivi (conditional) */}
          {hasFollowUp && (
            <>
              <Separator />
              <SectionTitle icon={<Bell size={14} />} label="Suivi" />
              {door.follow_up_date && (
                <InfoRow label="Date de suivi">{formatDateShort(door.follow_up_date)}</InfoRow>
              )}
              <InfoRow label="Statut">
                <Badge label="Suivi planifié" bg="#FEF3C7" color="#92400E" />
              </InfoRow>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
