'use client'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pas_repondu: { label: 'Sans réponse', color: '#64748B' },
  pas_interesse: { label: 'Pas intéressé', color: '#EF4444' },
  interesse: { label: 'Intéressé', color: '#F97316' },
  a_rappeler: { label: 'À rappeler', color: '#EAB308' },
  soumission: { label: 'Soumission', color: '#3B82F6' },
  vendu: { label: '✓ Vendu', color: '#10B981' },
}

const SERVICE_LABELS: Record<string, string> = {
  vitres_ext: 'Lavage vitres ext.',
  vitres_int_ext: 'Lavage vitres int./ext.',
  gouttières: 'Lavage gouttières',
  paysager: 'Entretien paysager',
  pave_uni: 'Pavé uni',
  tourbe: 'Pose de tourbe',
  plates_bandes: 'Plates-bandes',
  autre: 'Autre',
}

export default function PinPopup({ door, onClose }: { door: any; onClose: () => void }) {
  const statusInfo = STATUS_LABELS[door.status] || { label: door.status, color: '#fff' }
  const date = new Date(door.created_at)
  const dateStr = date.toLocaleDateString('fr-CA') + ' à ' + date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 9999 }}>
      <div style={{ background: '#0F172A', width: '100%', borderRadius: '24px 24px 0 0', maxHeight: '70vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#334155', borderRadius: 2 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px 12px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: door.profiles?.color || '#3B82F6', flexShrink: 0 }} />
            <div>
              <p style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{door.profiles?.full_name}</p>
              <p style={{ color: '#64748B', fontSize: 11 }}>{dateStr}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: '#64748B', fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'inline-flex', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: statusInfo.color + '25', color: statusInfo.color, alignSelf: 'flex-start'
          }}>
            {statusInfo.label}
          </div>

          {door.client_name && <Row label="Client" value={door.client_name} />}
          {door.phone && (
            <Row label="Téléphone" value={
              <a href={`tel:${door.phone}`} style={{ color: '#60A5FA' }}>{door.phone}</a>
            } />
          )}
          {door.service_type && <Row label="Service" value={SERVICE_LABELS[door.service_type] || door.service_type} />}
          {door.contract_value && (
            <Row label="Montant" value={
              <span style={{ color: '#34D399', fontWeight: 700 }}>
                {Number(door.contract_value).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })}
              </span>
            } />
          )}
          {door.scheduled_date && <Row label="Date prévue" value={new Date(door.scheduled_date).toLocaleDateString('fr-CA')} />}
          {door.objection && <Row label="Objection" value={door.objection.replace(/_/g, ' ')} />}
          {door.follow_up_needed && door.follow_up_date && (
            <Row label="Suivi" value={new Date(door.follow_up_date).toLocaleDateString('fr-CA')} />
          )}
          {door.notes && (
            <div>
              <p style={{ color: '#64748B', fontSize: 12, marginBottom: 4 }}>Notes</p>
              <p style={{ color: 'white', fontSize: 14, background: '#1E293B', padding: '10px 12px', borderRadius: 10 }}>{door.notes}</p>
            </div>
          )}
          <p style={{ color: '#475569', fontSize: 11 }}>
            GPS: {door.latitude.toFixed(5)}, {door.longitude.toFixed(5)}
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <span style={{ color: '#64748B', fontSize: 13, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'white', fontSize: 13, textAlign: 'right' }}>{value}</span>
    </div>
  )
}