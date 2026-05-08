'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

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
  { value: 'deja_quelquun', label: 'Déjà quelqu\'un' },
  { value: 'conjoint', label: 'Parler au conjoint' },
  { value: 'a_rappeler', label: 'À rappeler' },
  { value: 'reflechir', label: 'Veut réfléchir' },
  { value: 'autre', label: 'Autre' },
]

type Step = 'repondu' | 'close' | 'vente' | 'objection'

interface Props {
  coords: { lat: number; lng: number }
  profile: any
  onSave: (data: any) => void
  onClose: () => void
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

function FocusInput({ type = 'text', placeholder, value, onChange, className }: {
  type?: string; placeholder?: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; className?: string
}) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={fieldInput}
      onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
      onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
    />
  )
}

export default function DoorForm({ coords, onSave, onClose }: Props) {
  const [step, setStep] = useState<Step>('repondu')
  const [service, setService] = useState('')
  const [amount, setAmount] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [objection, setObjection] = useState('')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState('')
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [showOptional, setShowOptional] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async (overrideData?: any) => {
    setSaving(true)
    await onSave({
      service_type: service || null,
      contract_value: amount ? parseFloat(amount) : null,
      scheduled_date: scheduledDate || null,
      objection: objection || null,
      notes: notes || null,
      follow_up_needed: followUp,
      follow_up_date: followUpDate || null,
      client_name: clientName || null,
      phone: phone || null,
      ...overrideData,
    })
    setSaving(false)
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 9999 }}>
      <div style={{ background: '#FFFFFF', width: '100%', borderRadius: '20px 20px 0 0', maxHeight: '92vh', overflowY: 'auto', fontFamily: 'Inter, sans-serif' }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px 14px', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: 0 }}>Nouvelle porte</p>
            <p style={{ color: '#9CA3AF', fontSize: 12, margin: '2px 0 0' }}>
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '20px 20px 40px' }}>

          {/* Étape 1 — Répondu ? */}
          {step === 'repondu' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>
                Quelqu'un a répondu ?
              </p>
              <button
                onClick={() => save({ status: 'pas_repondu' })}
                disabled={saving}
                style={{ width: '100%', background: '#F1F2F2', color: '#1F2937', fontWeight: 500, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: '1.5px solid #E5E7EB', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                <span>Non — Personne</span>
                <span style={{ color: '#9CA3AF', fontSize: 13 }}>Enregistrer →</span>
              </button>
              <button
                onClick={() => setStep('close')}
                style={{ width: '100%', background: '#69C9CA', color: '#000000', fontWeight: 600, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                <span>Oui — Quelqu'un a répondu</span>
                <span>›</span>
              </button>
            </div>
          )}

          {/* Étape 2 — Closé ? */}
          {step === 'close' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>C'est closé ?</p>
              <button
                onClick={() => setStep('vente')}
                style={{ width: '100%', background: '#10B981', color: '#FFFFFF', fontWeight: 600, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                <span>Oui — Vendu !</span>
                <span>›</span>
              </button>
              <button
                onClick={() => setStep('objection')}
                style={{ width: '100%', background: '#F1F2F2', color: '#1F2937', fontWeight: 500, padding: '16px 20px', borderRadius: 12, fontSize: 15, border: '1.5px solid #E5E7EB', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 56, fontFamily: 'Inter, sans-serif' }}>
                <span>Non — Pas closé</span>
                <span>›</span>
              </button>
            </div>
          )}

          {/* Étape 3 — Vente */}
          {step === 'vente' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                <p style={{ color: '#10B981', fontWeight: 700, fontSize: 18, margin: 0 }}>Vente !</p>
              </div>

              <Field label="Service vendu">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SERVICES.map(s => (
                    <button key={s.value} onClick={() => setService(s.value)} style={{
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
                <textarea placeholder="Particularités..." value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  style={{ ...fieldInput, resize: 'none' }}
                  onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
                />
              </Field>

              <button onClick={() => setShowOptional(!showOptional)}
                style={{ color: '#69C9CA', fontSize: 13, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, fontFamily: 'Inter, sans-serif' }}>
                {showOptional ? '− Masquer infos client' : '+ Infos client (optionnel)'}
              </button>

              {showOptional && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <FocusInput placeholder="Nom du client" value={clientName} onChange={e => setClientName(e.target.value)} />
                  <FocusInput type="tel" placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              )}

              <button onClick={() => save({ status: 'vendu' })} disabled={saving}
                style={{ background: saving ? '#E5E7EB' : '#10B981', color: saving ? '#9CA3AF' : '#FFFFFF', fontWeight: 600, padding: '14px', borderRadius: 10, fontSize: 15, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', minHeight: 48, fontFamily: 'Inter, sans-serif', transition: 'background 150ms' }}>
                {saving ? 'Enregistrement...' : '✓ Enregistrer la vente'}
              </button>
            </div>
          )}

          {/* Étape 4 — Objection */}
          {step === 'objection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: '#111827', fontWeight: 600, fontSize: 17, margin: '0 0 6px' }}>Raison / Objection</p>

              {OBJECTIONS.map(o => (
                <button key={o.value} onClick={() => setObjection(o.value)} style={{
                  padding: '13px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                  border: `1.5px solid ${objection === o.value ? '#69C9CA' : '#E5E7EB'}`,
                  background: objection === o.value ? '#E8F8F8' : '#FFFFFF',
                  color: objection === o.value ? '#0D6E6F' : '#374151',
                  cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'Inter, sans-serif',
                  transition: 'all 150ms ease',
                }}>
                  {o.label}
                </button>
              ))}

              <textarea placeholder="Notes (optionnel)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                style={{ ...fieldInput, resize: 'none', marginTop: 4 }}
                onFocus={e => { e.target.style.borderColor = '#69C9CA'; e.target.style.boxShadow = '0 0 0 3px rgba(105,201,202,0.2)' }}
                onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none' }}
              />

              {/* Toggle suivi */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
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

              <button
                onClick={() => save({ status: objection === 'a_rappeler' ? 'a_rappeler' : 'pas_interesse' })}
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
        </div>
      </div>
    </div>
  )
}
