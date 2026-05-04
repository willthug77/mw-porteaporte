'use client'
import { useState } from 'react'

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

  const inputStyle = "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
  const btnDark = "w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-5 rounded-2xl text-base flex items-center justify-between px-5 active:scale-95 transition-transform mb-3"
  const btnBlue = "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-5 rounded-2xl text-base flex items-center justify-between px-5 active:scale-95 transition-transform"
  const btnGreen = "w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-5 rounded-2xl text-base flex items-center justify-between px-5 active:scale-95 transition-transform mb-3"

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 9999 }}>
      <div style={{ background: '#0F172A', width: '100%', borderRadius: '24px 24px 0 0', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#334155', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px 12px', borderBottom: '1px solid #1E293B' }}>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Nouvelle porte</p>
            <p style={{ color: '#64748B', fontSize: 11 }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</p>
          </div>
          <button onClick={onClose} style={{ color: '#64748B', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px 32px' }}>

          {step === 'repondu' && (
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>
                Quelqu'un a répondu ?
              </p>
              <button className={btnDark} onClick={() => save({ status: 'pas_repondu' })} disabled={saving}>
                <span>Non — Personne</span>
                <span style={{ color: '#3B82F6', fontSize: 13 }}>Enregistrer →</span>
              </button>
              <button className={btnBlue} onClick={() => setStep('close')}>
                <span>Oui — Quelqu'un a répondu</span>
                <span>›</span>
              </button>
            </div>
          )}

          {step === 'close' && (
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>C'est closé ?</p>
              <button className={btnGreen} onClick={() => setStep('vente')}>
                <span>✓ Oui — Vendu !</span>
                <span>›</span>
              </button>
              <button className={btnDark} onClick={() => setStep('objection')}>
                <span>Non — Pas closé</span>
                <span>›</span>
              </button>
            </div>
          )}

          {step === 'vente' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: '#34D399', fontWeight: 700, fontSize: 20 }}>Vente !</p>

              <div>
                <p style={{ color: '#CBD5E1', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Service vendu</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SERVICES.map(s => (
                    <button key={s.value} onClick={() => setService(s.value)}
                      style={{
                        padding: '10px 12px', borderRadius: 12, fontSize: 13, fontWeight: 500,
                        border: `1px solid ${service === s.value ? '#2563EB' : '#334155'}`,
                        background: service === s.value ? '#2563EB' : '#1E293B',
                        color: 'white', cursor: 'pointer', textAlign: 'left'
                      }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ color: '#CBD5E1', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Montant ($)</p>
                <input type="number" placeholder="Ex: 250" value={amount}
                  onChange={e => setAmount(e.target.value)} className={inputStyle} />
              </div>

              <div>
                <p style={{ color: '#CBD5E1', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Date prévue</p>
                <input type="date" value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)} className={inputStyle} />
              </div>

              <div>
                <p style={{ color: '#CBD5E1', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>Notes</p>
                <textarea placeholder="Particularités..." value={notes}
                  onChange={e => setNotes(e.target.value)} rows={2} className={inputStyle}
                  style={{ resize: 'none' }} />
              </div>

              <button onClick={() => setShowOptional(!showOptional)}
                style={{ color: '#64748B', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline' }}>
                {showOptional ? 'Masquer' : '+ Infos client (optionnel)'}
              </button>

              {showOptional && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" placeholder="Nom du client" value={clientName}
                    onChange={e => setClientName(e.target.value)} className={inputStyle} />
                  <input type="tel" placeholder="Téléphone" value={phone}
                    onChange={e => setPhone(e.target.value)} className={inputStyle} />
                </div>
              )}

              <button onClick={() => save({ status: 'vendu' })} disabled={saving}
                style={{ background: '#059669', color: 'white', fontWeight: 700, padding: '18px', borderRadius: 16, fontSize: 16, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                {saving ? 'Enregistrement...' : '✓ Enregistrer la vente'}
              </button>
            </div>
          )}

          {step === 'objection' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Raison / Objection</p>

              {OBJECTIONS.map(o => (
                <button key={o.value} onClick={() => setObjection(o.value)}
                  style={{
                    padding: '14px 16px', borderRadius: 12, fontSize: 14, fontWeight: 500,
                    border: `1px solid ${objection === o.value ? '#2563EB' : '#334155'}`,
                    background: objection === o.value ? '#2563EB' : '#1E293B',
                    color: 'white', cursor: 'pointer', textAlign: 'left'
                  }}>
                  {o.label}
                </button>
              ))}

              <textarea placeholder="Notes (optionnel)" value={notes}
                onChange={e => setNotes(e.target.value)} rows={2} className={inputStyle}
                style={{ resize: 'none' }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setFollowUp(!followUp)}
                  style={{ width: 48, height: 28, borderRadius: 14, background: followUp ? '#2563EB' : '#334155', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 4, left: followUp ? 24 : 4, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                </button>
                <span style={{ color: '#CBD5E1', fontSize: 14 }}>Suivi nécessaire</span>
              </div>

              {followUp && (
                <input type="date" value={followUpDate}
                  onChange={e => setFollowUpDate(e.target.value)} className={inputStyle} />
              )}

              <button onClick={() => save({ status: objection === 'a_rappeler' ? 'a_rappeler' : 'pas_interesse' })}
                disabled={saving || !objection}
                style={{ background: '#334155', color: 'white', fontWeight: 700, padding: '18px', borderRadius: 16, fontSize: 16, border: 'none', cursor: 'pointer', opacity: (saving || !objection) ? 0.5 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}