package handler

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

type nomorTandingReference struct {
	ID             string `json:"id"`
	CaborID        string `json:"cabor_id"`
	Name           string `json:"name"`
	GenderCategory string `json:"gender_category"`
	MatchType      string `json:"match_type"`
}

type caborReference struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	IconURL string `json:"icon_url"`
}

type kontingenReference struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	LogoURL string `json:"logo_url"`
}

type venueReference struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Address     string `json:"address"`
	MapRouteURL string `json:"map_route_url"`
}

type enrichedParticipant struct {
	ID            string `json:"id"`
	KontingenID   string `json:"kontingen_id"`
	KontingenName string `json:"kontingen_name"`
	KontingenLogo string `json:"kontingen_logo_url"`
	AthleteName   string `json:"athlete_name"`
	DisplayName   string `json:"display_name"`
}

type enrichedMatch struct {
	ID               string                `json:"id"`
	NomorTandingID   string                `json:"nomor_tanding_id"`
	NomorTandingName string                `json:"nomor_tanding_name"`
	CaborID          string                `json:"cabor_id"`
	CaborName        string                `json:"cabor_name"`
	CaborIconURL     string                `json:"cabor_icon_url"`
	GenderCategory   string                `json:"gender_category"`
	MatchType        string                `json:"match_type"`
	VenueID          string                `json:"venue_id"`
	VenueName        string                `json:"venue_name"`
	VenueAddress     string                `json:"venue_address"`
	VenueMapRouteURL string                `json:"venue_map_route_url"`
	MatchDate        string                `json:"match_date"`
	Status           string                `json:"status"`
	Round            string                `json:"round"`
	Participants     []enrichedParticipant `json:"participants"`
}

func uuidString(value pgtype.UUID) string {
	if !value.Valid {
		return ""
	}
	hexValue := hex.EncodeToString(value.Bytes[:])
	return fmt.Sprintf("%s-%s-%s-%s-%s", hexValue[0:8], hexValue[8:12], hexValue[12:16], hexValue[16:20], hexValue[20:32])
}

func fetchReferenceCollection[T any](ctx context.Context, client *http.Client, endpoint string) ([]T, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Accept", "application/json")

	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("%s returned HTTP %d", endpoint, response.StatusCode)
	}

	items := make([]T, 0)
	if err := json.NewDecoder(response.Body).Decode(&items); err != nil {
		return nil, err
	}
	return items, nil
}

func (h *MatchHandler) ListEnrichedMatches(w http.ResponseWriter, r *http.Request) {
	matches, err := h.queries.ListMatches(r.Context())
	if err != nil {
		http.Error(w, "Gagal membaca jadwal aktif", http.StatusInternalServerError)
		return
	}
	participants, err := h.queries.ListAllActiveMatchParticipants(r.Context())
	if err != nil {
		http.Error(w, "Gagal membaca peserta jadwal aktif", http.StatusInternalServerError)
		return
	}

	var (
		nomorTandings []nomorTandingReference
		cabors        []caborReference
		kontingens    []kontingenReference
		venues        []venueReference
		waitGroup     sync.WaitGroup
		errorChannel  = make(chan error, 4)
	)

	waitGroup.Add(4)
	go func() {
		defer waitGroup.Done()
		items, fetchErr := fetchReferenceCollection[nomorTandingReference](r.Context(), h.httpClient, h.masterDataURL+"/nomor-tandings")
		if fetchErr != nil {
			errorChannel <- fetchErr
			return
		}
		nomorTandings = items
	}()
	go func() {
		defer waitGroup.Done()
		items, fetchErr := fetchReferenceCollection[caborReference](r.Context(), h.httpClient, h.masterDataURL+"/cabors")
		if fetchErr != nil {
			errorChannel <- fetchErr
			return
		}
		cabors = items
	}()
	go func() {
		defer waitGroup.Done()
		items, fetchErr := fetchReferenceCollection[kontingenReference](r.Context(), h.httpClient, h.masterDataURL+"/kontingens")
		if fetchErr != nil {
			errorChannel <- fetchErr
			return
		}
		kontingens = items
	}()
	go func() {
		defer waitGroup.Done()
		items, fetchErr := fetchReferenceCollection[venueReference](r.Context(), h.httpClient, h.venueURL)
		if fetchErr != nil {
			errorChannel <- fetchErr
			return
		}
		venues = items
	}()
	waitGroup.Wait()
	close(errorChannel)
	if fetchErr := <-errorChannel; fetchErr != nil {
		http.Error(w, "Service referensi belum tersedia untuk enrichment jadwal", http.StatusServiceUnavailable)
		return
	}

	nomorMap := make(map[string]nomorTandingReference, len(nomorTandings))
	for _, item := range nomorTandings {
		nomorMap[item.ID] = item
	}
	caborMap := make(map[string]caborReference, len(cabors))
	for _, item := range cabors {
		caborMap[item.ID] = item
	}
	kontingenMap := make(map[string]kontingenReference, len(kontingens))
	for _, item := range kontingens {
		kontingenMap[item.ID] = item
	}
	venueMap := make(map[string]venueReference, len(venues))
	for _, item := range venues {
		venueMap[item.ID] = item
	}

	participantsByMatch := make(map[string][]enrichedParticipant)
	for _, participant := range participants {
		matchID := uuidString(participant.MatchID)
		kontingenID := uuidString(participant.KontingenID)
		kontingen := kontingenMap[kontingenID]
		athleteName := strings.TrimSpace(participant.AthleteName.String)
		displayName := athleteName
		if displayName == "" {
			displayName = kontingen.Name
		}
		if displayName == "" {
			displayName = "Peserta menunggu konfirmasi"
		}
		participantsByMatch[matchID] = append(participantsByMatch[matchID], enrichedParticipant{
			ID:            uuidString(participant.ID),
			KontingenID:   kontingenID,
			KontingenName: kontingen.Name,
			KontingenLogo: kontingen.LogoURL,
			AthleteName:   athleteName,
			DisplayName:   displayName,
		})
	}

	result := make([]enrichedMatch, 0, len(matches))
	for _, match := range matches {
		id := uuidString(match.ID)
		nomorID := uuidString(match.NomorTandingID)
		venueID := uuidString(match.VenueID)
		nomor := nomorMap[nomorID]
		cabor := caborMap[nomor.CaborID]
		venue := venueMap[venueID]
		matchDate := ""
		if match.MatchDate.Valid {
			matchDate = match.MatchDate.Time.Format(time.RFC3339)
		}
		matchParticipants := participantsByMatch[id]
		if matchParticipants == nil {
			matchParticipants = []enrichedParticipant{}
		}
		result = append(result, enrichedMatch{
			ID:               id,
			NomorTandingID:   nomorID,
			NomorTandingName: nomor.Name,
			CaborID:          nomor.CaborID,
			CaborName:        cabor.Name,
			CaborIconURL:     cabor.IconURL,
			GenderCategory:   nomor.GenderCategory,
			MatchType:        nomor.MatchType,
			VenueID:          venueID,
			VenueName:        venue.Name,
			VenueAddress:     venue.Address,
			VenueMapRouteURL: venue.MapRouteURL,
			MatchDate:        matchDate,
			Status:           match.Status,
			Round:            match.Round,
			Participants:     matchParticipants,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
