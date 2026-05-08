'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AddressDisplay from '@/components/AddressDisplay'

// TODO: ajouter permissions par rôle (vendeur ne peut modifier que ses propres portes)

const SERVICES = [
  { value: 'vitres_ext', label: 'Lavage vitres ext.' },
  { value: 'vitres_int_ext', label: 'Lavage int./ext.' },
  { value: 'gouttières', label: 'Gouttières' },
  { value: 'paysager', label: 'Entretien paysager' },
  { value: 'pave_uni', label: 'Pavé uni' },
  { value: 'tourbe', label: 'Pose de tourbe' },
  { value: 'plates_bandes', label: 'Plates-bandes' },
  { value: 'autre', label: 'Autre' },
]

const OBJECTIONS = [
  { value: 'pas_interesse', label: 'Pas intéressé' },
  { value: 'trop_cher', label: 'Trop cher' },
  { value: 'deja_quelquun', label: "Déjà quelqu'un" },
  { value: 'conjoint', label: 'Parler au conjoint' },
  { value: 'a_rappeler', label: 'À rappeler' },
  { value: 'reflechir', label: 'Veut réfléchir' },
  { value: 'autre', label: 'Autre' },
]

const STATUSES = [
  { value: 'pas_repondu',   label: 'Sans réponse',   bg: '#F3F4F6', color: '#374151', activeBg: '#1F2937', activeColor: '#FFFFFF' },
  { value: 'pas_interesse', label: 'Pas intéressé',  bg: '#FEE2E2', color: '#991B1B', activeBg: '#EF4444', activeColor: '#FFFFFF' },
  { value: 'interesse',     label: 'Intéressé',      bg: '#FEF3C7', color: '#92400E', activeBg: '#F59E0B', activeColor: '#FFFFFF' },
  { value: 'a_rappeler',    label: 'À rappeler',     bg: '#FEF3C7', color: '#92400E', activeBg: '#F59E0B', activeColor: '#FFFFFF' },
  { value: 'soumission',    label: 'Soumission',     bg: '#E8F8F8', color: '#0D6E6F', activeBg: '#69C9CA', activeColor: '#000000' },
  { value: 'vendu',         label: '✓ Vendu',        bg: '#D1FAE5', color: '#065F46', activeBg: '#10B981', activeColor: '#FFFFFF' },
]

export interface Door {
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
  created_at?: string
  profiles?: { full_name: string; color: string }
}

type Step = 'repondu' | 'close' | 'vente' | 'objection'

interface Props {
  coords: { lat: number; lng: number; address?: string }
  profile: any
  onSave: (data: any) => void
  onClose: () => void
  mode?: 'create' | 'edit'
  initialData?: Door
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 15,
  color: '#1F2937',
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  background: '#FFFFFF',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function FocusInput({ type = 'text', placeholder, value, onChange, autoFocus }: {
  type?: string; placeholder?: string; value: string; autoFocus?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      autoFocus={autoFocus}
      style={fieldInput}
      onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function FocusTextarea({ placeholder, value, onChange, rows = 2 }: {
  placeholder?: string; value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number
}) {
  return (
    <textarea
      placeholder={placeholder} value={value} onChange={onChange} rows={rows}
      style={{ ...fieldInput, resize: 'none' }}
      onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function isPhoneValid(value: string): boolean {
  return value.replace(/\D/g, '').length >= 10
}

export default function DoorForm({ coords, onSave, onClose, mode = 'create', initialData }: Props) {
  const isEdit = mode === 'edit'

  const [step, setStep] = useState<Step>('repondu')
  const [editStatus, setEditStatus] = useState(initialData?.status || 'pas_repondu')
  const [service, setService] = useState(initialData?.service_type || '')
  const [amount, setAmount] = useState(initialData?.contract_value?.toString() || '')
  const [scheduledDate, setScheduledDate] = useState(initialData?.scheduled_date || '')
  const [objection, setObjection] = useState(initialData?.objection || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [followUp, setFollowUp] = useState(initialData?.follow_up_needed || false)
  const [followUpDate, setFollowUpDate] = useState(initialData?.follow_up_date || '')
  const [clientName, setClientName] = useState(initialData?.client_name || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [venteSubmitAttempted, setVenteSubmitAttempted] = useState(false)

  // Editable address — only shown (and required) in create mode
  const [address, setAddress] = useState(coords.address || '')
  const [addressError, setAddressError] = useState('')

  const isEditVendu = isEdit && editStatus === 'vendu'
  const isEditClientValid = !isEditVendu || (clientName.trim().length > 0 && isPhoneValid(phone))

  const buildPayload = (overrideData?: any) => {
    const base: Record<string, any> = {
      service_type: service || null,
      contract_value: amount ? parseFloat(amount) : null,
      scheduled_date: scheduledDate || null,
      objection: objection || null,
      notes: notes || null,
      follow_up_needed: followUp,
      follow_up_date: followUpDate || null,
      client_name: clientName || null,
      phone: phone || null,
    }
    // Only include address in the create payload (edit keeps the address from DB unless explicitly changed)
    if (!isEdit) {
      base.address = address.trim() || null
    }
    return { ...base, ...overrideData }
  }

  // Create mode: validate address then delegate to parent
  const save = async (overrideData?: any) => {
    if (!address.trim()) {
      setAddressError("L'adresse est obligatoire.")
      return
    }
    setAddressError('')
    setSaving(true)
    await onSave(buildPayload(overrideData))
    setSaving(false)
  }

  // Edit mode: update directly in Supabase, then notify parent to refetch
  const saveEdit = async () => {
    if (!initialData) return
    if (!isEditClientValid) {
      setError('Veuillez entrer le nom et le téléphone du client pour enregistrer une vente.')
      return
    }
    setSaving(true)
    setError('')
    const { error: supaErr } = await supabase
      .from('doors')
      .update(buildPayload({ status: editStatus }))
      .eq('id', initialData.id)
    if (supaErr) {
      setError('Erreur lors de la mise à jour. Veuillez réessayer.')
      setSaving(false)
      return
    }
    setSaving(false)
    onSave({}) // trigger refetch in parent
    onClose()
  }

  const title = isEdit ? 'Modifier la porte' : 'Nouvelle porte'

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 9999 }}>
      <style>{`
        @keyframes mw-client-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <div style={{ background: '#FFFFFF', width: '100%', borderRadius: '20px 20px 0 0', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 20px 14px', borderBottom: '1px solid #F3F4F6', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>{title}</p>

            {/* Create mode: editable address field */}
            {!isEdit && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  Adresse *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => { setAddress(e.target.value); setAddressError('') }}
                  placeholder={coords.address ? '' : 'Récupération de l\'adresse...'}
                  style={{
                    ...fieldInput,
                    fontSize: 13,
                    padding: '8px 12px',
                    borderColor: addressError ? '#EF4444' : '#E5E7EB',
                  }}
                  onFocus={e => { e.target.style.borderColor = addressError ? '#EF4444' : '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                  onBlur={e => { e.target.style.borderColor = addressError ? '#EF4444' : '#E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
                {addressError && (
                  <p style={{ color: '#EF4444', fontSize: 12, margin: '4px 0 0' }}>{addressError}</p>
                )}
              </div>
            )}

            {/* Edit mode: read-only address display */}
            {isEdit && (
              <div style={{ marginTop: 2 }}>
                <AddressDisplay lat={coords.lat} lng={coords.lng} />
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '20px 20px 40px' }}>

          {/* ──────────── MODE ÉDITION ──────────── */}
          {isEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Statut */}
              <Field label="Statut">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {STATUSES.map(s => {
                    const active = editStatus === s.value
                    return (
                      <button key={s.value} onClick={() => { setEditStatus(s.value); setError('') }} style={{
                        padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                        border: `1.5px solid ${active ? 'transparent' : '#E5E7EB'}`,
                        background: active ? s.activeBg : s.bg,
                        color: active ? s.activeColor : s.color,
                        cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                        transition: 'all 150ms ease',
                      }}>
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </Field>

              {/* Infos client — optionnelles ou obligatoires selon statut vendu */}
              <div style={{
                borderLeft: isEditVendu ? '3px solid #69C9CA' : '3px solid transparent',
                background: isEditVendu ? '#E8F8F8' : 'transparent',
                padding: isEditVendu ? '16px' : '0',
                borderRadius: isEditVendu ? 8 : 0,
                transition: 'background 200ms ease, padding 200ms ease, border-color 200ms ease',
              }}>
                {isEditVendu && (
                  <p style={{
                    color: '#0D6E6F', fontWeight: 700, fontSize: 14,
                    margin: '0 0 12px',
                    animation: 'mw-client-in 200ms ease both',
                  }}>
                    Informations client requises
                  </p>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label={isEditVendu ? 'Nom complet *' : 'Nom client'}>
                    <FocusInput placeholder="Jean Tremblay" value={clientName} onChange={e => setClientName(e.target.value)} />
                  </Field>
                  <Field label={isEditVendu ? 'Téléphone *' : 'Téléphone'}>
                    <FocusInput type="tel" placeholder="(514) 555-1234" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                  </Field>
                </div>
              </div>

              {/* Service */}
              <Field label="Service">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SERVICES.map(s => (
                    <button key={s.value} onClick={() => setService(service === s.value ? '' : s.value)} style={{
                      padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      border: `1.5px solid ${service === s.value ? '#69C9CA' : '#E5E7EB'}`,
                      background: service === s.value ? '#E8F8F8' : '#FFFFFF',
                      color: service === s.value ? '#0D6E6F' : '#374151',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      transition: 'all 150ms ease',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Montant + Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Montant ($)">
                  <FocusInput type="number" placeholder="250" value={amount} onChange={e => setAmount(e.target.value)} />
                </Field>
                <Field label="Date prévue">
                  <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                    style={fieldInput}
                    onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
                  />
                </Field>
              </div>

              {/* Objection */}
              <Field label="Objection">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {OBJECTIONS.map(o => (
                    <button key={o.value} onClick={() => setObjection(objection === o.value ? '' : o.value)} style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                      border: `1.5px solid ${objection === o.value ? '#69C9CA' : '#E5E7EB'}`,
                      background: objection === o.value ? '#E8F8F8' : '#FFFFFF',
                      color: objection === o.value ? '#0D6E6F' : '#374151',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 150ms ease',
                    }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Notes */}
              <Field label="Notes">
                <FocusTextarea placeholder="Particularités, remarques..." value={notes} onChange={e => setNotes(e.target.value)} />
              </Field>

              {/* Suivi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setFollowUp(!followUp)} style={{
                    width: 44, height: 26, borderRadius: 13,
                    background: followUp ? '#69C9CA' : '#E5E7EB',
                    border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                    transition: 'background 200ms ease',
                  }}>
                    <div style={{
                      position: 'absolute', top: 3, left: followUp ? 21 : 3,
                      width: 20, height: 20, borderRadius: '50%', background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      transition: 'left 200ms ease',
                    }} />
                  </button>
                  <span style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>Suivi nécessaire</span>
                </div>
                {followUp && (
                  <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                    style={fieldInput}
                    onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                    onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
                  />
                )}
              </div>

              {/* Erreur */}
              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#991B1B', fontSize: 14 }}>
                  {error}
                </div>
              )}

              {/* Bouton mise à jour */}
              <button onClick={saveEdit} disabled={saving || !isEditClientValid} style={{
                background: saving || !isEditClientValid ? '#E5E7EB' : '#69C9CA',
                color: saving || !isEditClientValid ? '#9CA3AF' : '#000000',
                fontWeight: 600, padding: '14px', borderRadius: 10, fontSize: 15,
                border: 'none', cursor: saving || !isEditClientValid ? 'not-allowed' : 'pointer',
                minHeight: 48, fontFamily: 'Inter, sans-serif', transition: 'background 150ms',
              }}>
                {saving ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
              {isEditVendu && !isEditClientValid && (
                <p style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', margin: 0 }}>
                  Veuillez entrer le nom et le téléphone du client pour enregistrer une vente.
                </p>
              )}
            </div>
          )}

          {/* ──────────── MODE CRÉATION ──────────── */}
          {!isEdit && (
            <>
              {step === 'repondu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>Quelqu'un a répondu ?</p>
                  <button onClick={() => save({ status: 'pas_repondu' })} disabled={saving}
                    style={{ width: '100%', background: '#F1F2F2', color: '#1F2937', fontWeight: 500, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: '1.5px solid #E5E7EB', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                    <span>Non — Personne</span>
                    <span style={{ color: '#374151', fontSize: 13 }}>Enregistrer →</span>
                  </button>
                  <button onClick={() => { if (!address.trim()) { setAddressError("L'adresse est obligatoire."); return } setStep('close') }}
                    style={{ width: '100%', background: '#69C9CA', color: '#000000', fontWeight: 600, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                    <span>Oui — Quelqu'un a répondu</span>
                    <span>›</span>
                  </button>
                </div>
              )}

              {step === 'close' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>C'est closé ?</p>
                  <button onClick={() => setStep('vente')}
                    style={{ width: '100%', background: '#10B981', color: '#FFFFFF', fontWeight: 600, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                    <span>Oui — Vendu !</span><span>›</span>
                  </button>
                  <button onClick={() => setStep('objection')}
                    style={{ width: '100%', background: '#F1F2F2', color: '#1F2937', fontWeight: 500, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: '1.5px solid #E5E7EB', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                    <span>Non — Pas closé</span><span>›</span>
                  </button>
                </div>
              )}

              {step === 'vente' && (() => {
                const venteClientValid = clientName.trim().length > 0 && isPhoneValid(phone)
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                      <p style={{ color: '#10B981', fontWeight: 700, fontSize: 18, margin: 0 }}>Vente !</p>
                    </div>

                    {/* Section client requise */}
                    <div style={{ borderLeft: '3px solid #69C9CA', background: '#E8F8F8', padding: 16, borderRadius: 8 }}>
                      <p style={{ color: '#0D6E6F', fontWeight: 700, fontSize: 14, margin: '0 0 12px' }}>
                        Informations client requises
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <Field label="Nom complet *">
                          <FocusInput placeholder="Jean Tremblay" value={clientName} onChange={e => setClientName(e.target.value)} />
                        </Field>
                        <Field label="Téléphone *">
                          <FocusInput type="tel" placeholder="(514) 555-1234" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                        </Field>
                      </div>
                    </div>

                    <Field label="Service vendu">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {SERVICES.map(s => (
                          <button key={s.value} onClick={() => setService(s.value)} style={{
                            padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                            border: `1.5px solid ${service === s.value ? '#69C9CA' : '#E5E7EB'}`,
                            background: service === s.value ? '#E8F8F8' : '#FFFFFF',
                            color: service === s.value ? '#0D6E6F' : '#374151',
                            cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif', transition: 'all 150ms ease',
                          }}>{s.label}</button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Montant ($)">
                      <FocusInput type="number" placeholder="Ex: 250" value={amount} onChange={e => setAmount(e.target.value)} />
                    </Field>
                    <Field label="Date prévue">
                      <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                        style={fieldInput}
                        onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                        onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
                      />
                    </Field>
                    <Field label="Notes">
                      <FocusTextarea placeholder="Particularités..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </Field>

                    {venteSubmitAttempted && !venteClientValid && (
                      <div style={{ background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', color: '#991B1B', fontSize: 14 }}>
                        Veuillez entrer le nom et le téléphone du client pour enregistrer une vente.
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setVenteSubmitAttempted(true)
                        if (!venteClientValid) return
                        save({ status: 'vendu' })
                      }}
                      disabled={saving}
                      style={{
                        background: saving ? '#E5E7EB' : !venteClientValid ? '#D1D5DB' : '#10B981',
                        color: saving || !venteClientValid ? '#9CA3AF' : '#FFFFFF',
                        fontWeight: 600, padding: '14px', borderRadius: 10, fontSize: 15,
                        border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                        minHeight: 48, fontFamily: 'Inter, sans-serif', transition: 'background 150ms',
                      }}
                    >
                      {saving ? 'Enregistrement...' : '✓ Enregistrer la vente'}
                    </button>
                  </div>
                )
              })()}

              {step === 'objection' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>Raison / Objection</p>
                  {OBJECTIONS.map(o => (
                    <button key={o.value} onClick={() => setObjection(o.value)} style={{
                      padding: '13px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                      border: `1.5px solid ${objection === o.value ? '#69C9CA' : '#E5E7EB'}`,
                      background: objection === o.value ? '#E8F8F8' : '#FFFFFF',
                      color: objection === o.value ? '#0D6E6F' : '#374151',
                      cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Inter, sans-serif', transition: 'all 150ms ease',
                    }}>{o.label}</button>
                  ))}
                  <FocusTextarea placeholder="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                    <button onClick={() => setFollowUp(!followUp)} style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: followUp ? '#69C9CA' : '#E5E7EB',
                      border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
                      transition: 'background 200ms ease',
                    }}>
                      <div style={{ position: 'absolute', top: 3, left: followUp ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 200ms ease' }} />
                    </button>
                    <span style={{ color: '#374151', fontSize: 14, fontWeight: 500 }}>Suivi nécessaire</span>
                  </div>
                  {followUp && (
                    <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                      style={fieldInput}
                      onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
                    />
                  )}
                  <button onClick={() => save({ status: objection === 'a_rappeler' ? 'a_rappeler' : 'pas_interesse' })}
                    disabled={saving || !objection}
                    style={{
                      background: saving || !objection ? '#E5E7EB' : '#69C9CA',
                      color: saving || !objection ? '#9CA3AF' : '#000000',
                      fontWeight: 600, padding: '14px', borderRadius: 10, fontSize: 15,
                      border: 'none', cursor: saving || !objection ? 'not-allowed' : 'pointer',
                      minHeight: 48, marginTop: 4, fontFamily: 'Inter, sans-serif', transition: 'background 150ms',
                    }}>
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
