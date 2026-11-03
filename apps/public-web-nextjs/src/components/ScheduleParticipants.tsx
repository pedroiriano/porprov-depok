import type {EnrichedParticipant} from '../lib/public-models';
import styles from './SchedulePresentation.module.css';

// INFO: Preserve participant order and affiliation from the public projection without inventing opponents.
export function scheduleParticipantViews(participants: EnrichedParticipant[]) {
  const ordered = [...participants].sort((a, b) => a.slot - b.slot);
  const sides = ordered.length
    ? ordered.length === 1 && ordered[0].slot === 2 ? [null, ...ordered] : [...ordered]
    : [null, null];
  if (sides.length === 1) sides.push(null);
  return sides.map((participant, index) => {
    const label = participant?.participant_type === 'contingent' ? 'Kontingen'
      : participant?.participant_type === 'team' ? 'Tim'
      : participant?.participant_type === 'individual' ? 'Individu' : 'Peserta';
    const specificName = participant?.participant_type === 'contingent' ? participant.kontingen_name
      : participant?.participant_type === 'team' ? participant.team_name
      : participant?.participant_type === 'individual' ? participant.athlete_name : '';
    const name = specificName?.trim() || participant?.display_name?.trim() || 'Menunggu konfirmasi';
    const contingent = participant?.kontingen_name?.trim() || '';
    return {
      side: index === 0 ? 'A' : index === 1 ? 'B' : String(index + 1),
      label, name,
      affiliation: participant?.participant_type !== 'contingent' && contingent && contingent !== name ? contingent : '',
    };
  });
}

export function scheduleParticipantSummary(participants: EnrichedParticipant[]) {
  return scheduleParticipantViews(participants).map(item => `${item.label}: ${item.name}${item.affiliation ? ` (${item.affiliation})` : ''}`).join(' melawan ');
}

// ACCESSIBILITY: Text-only rows can be used inside a full-card button without nested controls or raw HTML.
export function ScheduleParticipants({participants}: {participants: EnrichedParticipant[]}) {
  return <span className={styles.participants} role="list" aria-label="Pihak yang bertanding">
    {scheduleParticipantViews(participants).map(item => <span key={item.side} className={styles.participant} role="listitem">
      <span className={styles.initial} aria-hidden="true">{item.side}</span>
      <span className={styles.participantInfo}><span className={styles.participantKind}>{item.label}</span><strong>{item.name}</strong>{item.affiliation && <span className={styles.participantAffiliation}>{item.affiliation}</span>}</span>
    </span>)}
  </span>;
}
