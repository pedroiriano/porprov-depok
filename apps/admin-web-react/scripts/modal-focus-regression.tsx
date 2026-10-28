import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthContext, type AuthContextProps } from 'react-oidc-context';
import Modal from '../src/components/Modal';
import ModalForm from '../src/components/common/ModalForm';

// TEST: Browser-only fixture using the real shared components; no credentials, API requests or persisted drafts.
const fixtureAuth = { user: undefined, isAuthenticated: false, isLoading: false } as AuthContextProps;

function ModalFocusRegression() {
  const [kind, setKind] = useState<'form' | 'modal' | null>(null);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nested, setNested] = useState(false);
  const [closedFrom, setClosedFrom] = useState('');
  const close = () => { setClosedFrom(name); setKind(null); };
  const fields = <>
    <label>Nama uji<input aria-label="Nama uji" value={name} onChange={event => setName(event.target.value)}/></label>
    <label>Catatan uji<textarea aria-label="Catatan uji" value={notes} onChange={event => setNotes(event.target.value)}/></label>
    <label><input type="checkbox" checked={submitting} onChange={event => setSubmitting(event.target.checked)}/>Kunci penutupan</label>
    <button type="button" onClick={() => setNested(true)}>Buka modal bertingkat</button>
  </>;
  return <AuthContext.Provider value={fixtureAuth}>
    <main><h1>Regresi fokus modal bersama</h1><p>Fixture lokal, tanpa penyimpanan data.</p>
      <button onClick={() => setKind('form')}>Buka formulir uji</button>
      <button onClick={() => setKind('modal')}>Buka modal uji</button>
      <output aria-label="Nilai saat ditutup">{closedFrom}</output>
    </main>
    <ModalForm isOpen={kind === 'form'} onClose={() => close()} title="Formulir uji" submitting={submitting} submitText="Simpan uji" onSubmit={event => event.preventDefault()}>{fields}</ModalForm>
    <Modal isOpen={kind === 'modal'} onClose={() => close()} title="Modal uji" closeDisabled={submitting}>{fields}</Modal>
    <Modal isOpen={nested} onClose={() => setNested(false)} title="Modal bertingkat"><label>Nama bertingkat<input aria-label="Nama bertingkat" value={notes} onChange={event => setNotes(event.target.value)}/></label></Modal>
  </AuthContext.Provider>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><ModalFocusRegression/></StrictMode>);
