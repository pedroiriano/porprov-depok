package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/porprov-xv/porprov-depok/services/schedule-service/internal/db"
)

type participantRequest struct {
	ParticipantType string `json:"participant_type"`
	KontingenID     string `json:"kontingen_id"`
	AthleteName     string `json:"athlete_name"`
	TeamName        string `json:"team_name"`
	Slot            int16  `json:"slot"`
}

type matchRequest struct {
	NomorTandingID string                `json:"nomor_tanding_id"`
	VenueID        string                `json:"venue_id"`
	MatchDate      string                `json:"match_date"`
	Status         string                `json:"status"`
	Round          string                `json:"round"`
	Participants   *[]participantRequest `json:"participants"`
}

type preparedParticipant struct {
	ParticipantType string
	KontingenID     pgtype.UUID
	KontingenIDText string
	AthleteName     string
	TeamName        string
	Slot            int16
}

func normalizeParticipantType(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "individual", "individu":
		return "individual"
	case "team", "tim":
		return "team"
	case "contingent", "kontingen":
		return "contingent"
	default:
		return ""
	}
}

func validateParticipantRequests(requests []participantRequest) ([]preparedParticipant, error) {
	// INFO: LiveScore saat ini memakai kontrak skor A/B. Setiap pertandingan
	// yang masuk workspace LiveScore karena itu harus mempunyai tepat dua sisi.
	if len(requests) != 2 {
		return nil, fmt.Errorf("peserta pertandingan wajib tepat 2 sisi (Peserta A dan Peserta B)")
	}

	prepared := make([]preparedParticipant, 0, len(requests))
	usedSlots := make(map[int16]struct{}, len(requests))
	usedIdentities := make(map[string]struct{}, len(requests))
	for index, item := range requests {
		participantType := normalizeParticipantType(item.ParticipantType)
		if participantType == "" {
			return nil, fmt.Errorf("jenis Peserta %c harus individual, team, atau contingent", 'A'+rune(index))
		}
		kontingenIDText := strings.TrimSpace(item.KontingenID)
		var kontingenID pgtype.UUID
		if err := kontingenID.Scan(kontingenIDText); err != nil {
			return nil, fmt.Errorf("kontingen Peserta %c tidak valid", 'A'+rune(index))
		}

		athleteName := strings.TrimSpace(item.AthleteName)
		teamName := strings.TrimSpace(item.TeamName)
		if utf8.RuneCountInString(athleteName) > 100 || utf8.RuneCountInString(teamName) > 150 {
			return nil, fmt.Errorf("nama Peserta %c melebihi batas karakter", 'A'+rune(index))
		}
		switch participantType {
		case "individual":
			if athleteName == "" {
				return nil, fmt.Errorf("nama atlet Peserta %c wajib diisi", 'A'+rune(index))
			}
			teamName = ""
		case "team":
			if teamName == "" {
				return nil, fmt.Errorf("nama tim Peserta %c wajib diisi", 'A'+rune(index))
			}
			athleteName = ""
		case "contingent":
			athleteName = ""
			teamName = ""
		}

		slot := item.Slot
		if slot == 0 {
			slot = int16(index + 1)
		}
		if slot < 1 || slot > 2 {
			return nil, fmt.Errorf("slot peserta hanya boleh 1 (A) atau 2 (B)")
		}
		if _, exists := usedSlots[slot]; exists {
			return nil, fmt.Errorf("slot peserta tidak boleh duplikat")
		}
		usedSlots[slot] = struct{}{}

		identity := strings.ToLower(strings.Join([]string{participantType, kontingenIDText, athleteName, teamName}, "|"))
		if _, exists := usedIdentities[identity]; exists {
			return nil, fmt.Errorf("Peserta A dan Peserta B tidak boleh identik")
		}
		usedIdentities[identity] = struct{}{}

		prepared = append(prepared, preparedParticipant{
			ParticipantType: participantType,
			KontingenID:     kontingenID,
			KontingenIDText: kontingenIDText,
			AthleteName:     athleteName,
			TeamName:        teamName,
			Slot:            slot,
		})
	}
	if prepared[0].ParticipantType != prepared[1].ParticipantType {
		return nil, fmt.Errorf("Peserta A dan Peserta B wajib memakai jenis peserta yang sama")
	}
	return prepared, nil
}

func (h *MatchHandler) prepareParticipants(ctx context.Context, requests *[]participantRequest) ([]preparedParticipant, error) {
	if requests == nil {
		return nil, nil
	}
	prepared, err := validateParticipantRequests(*requests)
	if err != nil {
		return nil, err
	}
	checkedKontingens := make(map[string]struct{}, len(prepared))
	for _, participant := range prepared {
		if _, checked := checkedKontingens[participant.KontingenIDText]; checked {
			continue
		}
		exists, checkErr := h.referenceExists(ctx, h.masterDataURL+"/kontingens/"+participant.KontingenIDText)
		if checkErr != nil {
			return nil, fmt.Errorf("Master Data Service tidak tersedia saat memvalidasi kontingen")
		}
		if !exists {
			return nil, fmt.Errorf("kontingen peserta tidak ditemukan atau sudah diarsipkan")
		}
		checkedKontingens[participant.KontingenIDText] = struct{}{}
	}
	return prepared, nil
}

func actorID(r *http.Request) string {
	actor := strings.TrimSpace(r.Header.Get("X-Actor-ID"))
	if actor == "" {
		return "authenticated-user"
	}
	return actor
}

func replaceMatchParticipants(ctx context.Context, queries *db.Queries, matchID pgtype.UUID, participants []preparedParticipant, actor string) error {
	if err := queries.SoftDeleteMatchParticipants(ctx, db.SoftDeleteMatchParticipantsParams{
		DeletedBy:    pgtype.Text{String: actor, Valid: true},
		DeleteReason: pgtype.Text{String: "Susunan peserta pertandingan diperbarui", Valid: true},
		MatchID:      matchID,
	}); err != nil {
		return err
	}
	for _, participant := range participants {
		if _, err := queries.AddMatchParticipant(ctx, db.AddMatchParticipantParams{
			MatchID:         matchID,
			KontingenID:     participant.KontingenID,
			ParticipantType: participant.ParticipantType,
			AthleteName:     participant.AthleteName,
			TeamName:        participant.TeamName,
			Slot:            participant.Slot,
		}); err != nil {
			return err
		}
	}
	return nil
}

func (h *MatchHandler) ListMatchParticipants(w http.ResponseWriter, r *http.Request) {
	idText := chi.URLParam(r, "id")
	var matchID pgtype.UUID
	if err := matchID.Scan(idText); err != nil {
		http.Error(w, "ID jadwal tidak valid", http.StatusBadRequest)
		return
	}
	if _, err := h.queries.GetMatchByID(r.Context(), matchID); err != nil {
		http.Error(w, "Jadwal tidak ditemukan", http.StatusNotFound)
		return
	}
	participants, err := h.queries.ListMatchParticipants(r.Context(), matchID)
	if err != nil {
		http.Error(w, "Gagal membaca peserta pertandingan", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(participants)
}
