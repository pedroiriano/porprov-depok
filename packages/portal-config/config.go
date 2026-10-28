package portal

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"regexp"
	"strings"
)

//go:embed baseline.json
var baseline []byte

type Module struct {
	ID            string `json:"id"`
	Label         string `json:"label"`
	Mode          string `json:"mode"`
	PublicEnabled bool   `json:"public_enabled"`
	AdminEnabled  bool   `json:"admin_enabled"`
	ExternalURL   string `json:"external_url"`
}

type Feature struct {
	ID            string `json:"id"`
	ModuleID      string `json:"module_id"`
	Label         string `json:"label"`
	PublicEnabled bool   `json:"public_enabled"`
	AdminEnabled  bool   `json:"admin_enabled"`
}
type Section struct {
	ID       string `json:"id"`
	Type     string `json:"type"`
	Enabled  bool   `json:"enabled"`
	Variant  string `json:"variant"`
	Heading  string `json:"heading"`
	Body     string `json:"body"`
	Href     string `json:"href"`
	ImageURL string `json:"image_url"`
}
type Page struct {
	ID          string    `json:"id"`
	Path        string    `json:"path"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	ModuleID    string    `json:"module_id"`
	Sections    []Section `json:"sections"`
}
type Menu struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Location string `json:"location"`
	Target   string `json:"target"`
	ParentID string `json:"parent_id"`
	Enabled  bool   `json:"enabled"`
}
type Document struct {
	SchemaVersion int       `json:"schema_version"`
	Version       int64     `json:"version"`
	Modules       []Module  `json:"modules"`
	Features      []Feature `json:"features"`
	Pages         []Page    `json:"pages"`
	Menus         []Menu    `json:"menus"`
}

func Default() Document {
	var d Document
	_ = json.Unmarshal(baseline, &d)
	for i := range d.Pages {
		if d.Pages[i].ID != "home" && len(d.Pages[i].Sections) == 0 {
			d.Pages[i].Sections = []Section{{ID: "native", Type: "content", Enabled: true, Variant: "standard"}}
		}
	}
	return d
}

// INFO: Legacy publication is adapted on read without changing stored JSON, version or history.
func (d *Document) NormalizeLegacy() {
	if d.Features == nil {
		d.Features = Default().Features
	}
	for i := range d.Pages {
		page := &d.Pages[i]
		if page.ID != "jadwal" {
			continue
		}
		var defaults []Section
		for _, original := range Default().Pages {
			if original.ID == "jadwal" {
				defaults = original.Sections
			}
		}
		used := map[string]bool{}
		for _, section := range page.Sections {
			if section.Type != "content" {
				used[section.ID] = true
			}
		}
		converted := []Section{}
		for _, section := range page.Sections {
			if section.Type != "content" {
				converted = append(converted, section)
				continue
			}
			for _, template := range defaults {
				next := template
				next.Enabled = section.Enabled
				next.Variant = section.Variant
				for n := 1; used[next.ID]; n++ {
					next.ID = fmt.Sprintf("%s-%d", template.ID, n)
				}
				used[next.ID] = true
				converted = append(converted, next)
			}
		}
		// SECURITY: An empty legacy page stays hidden, rather than enabling content implicitly.
		if len(page.Sections) == 0 {
			for _, template := range defaults {
				template.Enabled = false
				converted = append(converted, template)
			}
		}
		page.Sections = converted
	}
}

func (d Document) Feature(id string) *Feature {
	for _, feature := range d.Features {
		if feature.ID == id {
			value := feature
			return &value
		}
	}
	return nil
}
func (d Document) LocalFeature(id string, admin bool) bool {
	feature := d.Feature(id)
	if feature == nil || !d.Local(feature.ModuleID, admin) {
		return false
	}
	if admin {
		return feature.AdminEnabled
	}
	return feature.PublicEnabled
}
func SectionFeature(kind string) string {
	if kind == "schedule_periods" || kind == "schedule_matches" {
		return kind
	}
	return ""
}

func Decode(data []byte) (Document, error) {
	var d Document
	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&d); err != nil {
		return d, errors.New("format konfigurasi tidak valid")
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF {
		return d, errors.New("hanya satu dokumen JSON diizinkan")
	}
	if err := d.Validate(); err != nil {
		return d, err
	}
	return d, nil
}

var identifier = regexp.MustCompile(`^[a-z0-9][a-z0-9_-]{0,63}$`)
var customPath = regexp.MustCompile(`^/informasi/[a-z0-9]+(?:-[a-z0-9]+)*$`)
var uploadPath = regexp.MustCompile(`^/uploads/[a-zA-Z0-9_-]+\.(?:png|jpg|jpeg|webp|avif|gif)$`)

// SECURITY: External links are government HTTPS destinations, never arbitrary redirects or server-side fetch targets.
func SafeTarget(value string) bool {
	if value == "" {
		return true
	}
	if len(value) > 2048 || strings.ContainsAny(value, "\\\r\n\t") || strings.Contains(value, "%") {
		return false
	}
	u, err := url.Parse(value)
	if err != nil || u.User != nil || u.Opaque != "" {
		return false
	}
	if u.Scheme == "" && u.Host == "" {
		return strings.HasPrefix(value, "/") && !strings.HasPrefix(value, "//") && !strings.Contains(u.Path, "..") && u.RawQuery == ""
	}
	host := strings.ToLower(u.Hostname())
	return u.Scheme == "https" && u.Port() == "" && (host == "depok.go.id" || strings.HasSuffix(host, ".depok.go.id") || host == "jabarprov.go.id" || strings.HasSuffix(host, ".jabarprov.go.id"))
}
func (d Document) Module(id string) *Module {
	for _, m := range d.Modules {
		if m.ID == id {
			return &m
		}
	}
	return nil
}
func (d Document) Local(id string, admin bool) bool {
	m := d.Module(id)
	if m == nil || m.Mode != "local" {
		return false
	}
	if admin {
		return m.AdminEnabled
	}
	return m.PublicEnabled
}
func (d Document) PageFor(path string) *Page {
	var found *Page
	for _, p := range d.Pages {
		if p.Path == path || p.Path != "/" && strings.HasPrefix(path, p.Path+"/") {
			if found == nil || len(p.Path) > len(found.Path) {
				copy := p
				found = &copy
			}
		}
	}
	return found
}
func (d Document) Validate() error {
	if d.SchemaVersion != 1 || len(d.Modules) != len(Default().Modules) || len(d.Pages) < 8 || len(d.Pages) > 60 || len(d.Menus) > 100 {
		return errors.New("limitan atau versi konfigurasi tidak valid")
	}
	modules := map[string]bool{}
	for _, m := range d.Modules {
		if Default().Module(m.ID) == nil || modules[m.ID] || len([]rune(strings.TrimSpace(m.Label))) < 1 || len([]rune(m.Label)) > 100 {
			return errors.New("identitas modul tidak valid atau ganda")
		}
		modules[m.ID] = true
		if m.Mode != "local" && m.Mode != "external" && m.Mode != "disabled" {
			return errors.New("mode modul tidak valid")
		}
		if !SafeTarget(m.ExternalURL) || m.ExternalURL != "" && !strings.HasPrefix(m.ExternalURL, "https://") || m.Mode == "external" && m.ExternalURL == "" {
			return errors.New("tautan modul harus URL HTTPS resmi Depok atau Jawa Barat")
		}
		if m.ID == "home" && (m.Mode != "local" || !m.PublicEnabled || !m.AdminEnabled) {
			return errors.New("Beranda dan akses pengelolaan tidak boleh dinonaktifkan")
		}
	}
	paths := map[string]bool{}
	if len(d.Features) != len(Default().Features) {
		return errors.New("daftar fitur tidak lengkap")
	}
	featureIDs := map[string]bool{}
	for _, feature := range d.Features {
		original := Default().Feature(feature.ID)
		if original == nil || original.ModuleID != feature.ModuleID || featureIDs[feature.ID] || len([]rune(strings.TrimSpace(feature.Label))) < 1 || len([]rune(feature.Label)) > 100 {
			return errors.New("identitas, induk, atau nama fitur tidak valid")
		}
		featureIDs[feature.ID] = true
	}
	ids := map[string]bool{}
	for _, p := range d.Pages {
		if !identifier.MatchString(p.ID) || ids[p.ID] || paths[p.Path] || len([]rune(strings.TrimSpace(p.Title))) < 1 || len([]rune(p.Title)) > 180 || len([]rune(p.Description)) > 500 || len(p.Sections) > 30 {
			return errors.New("halaman tidak valid, terlalu panjang, atau ganda")
		}
		ids[p.ID] = true
		paths[p.Path] = true
		builtIn := false
		for _, b := range Default().Pages {
			if b.ID == p.ID {
				builtIn = true
				if b.Path != p.Path || b.ModuleID != p.ModuleID {
					return errors.New("alamat dan modul halaman bawaan tidak dapat diubah")
				}
			}
		}
		if !builtIn && !customPath.MatchString(p.Path) {
			return errors.New("halaman baru harus memakai /informasi/slug")
		}
		if p.ModuleID != "" && !modules[p.ModuleID] {
			return errors.New("modul halaman tidak dikenal")
		}
		if p.Status != "published" && p.Status != "draft" && p.Status != "archived" {
			return errors.New("status halaman tidak valid")
		}
		if p.ID == "home" && p.Status != "published" {
			return errors.New("Beranda wajib tetap dipublikasikan")
		}
		sections := map[string]bool{}
		nativeTypes := map[string]bool{}
		for _, s := range p.Sections {
			if !identifier.MatchString(s.ID) || sections[s.ID] {
				return errors.New("identitas bagian tidak valid atau ganda")
			}
			sections[s.ID] = true
			native := false
			for _, original := range Default().Pages {
				if original.ID == p.ID {
					for _, slot := range original.Sections {
						if slot.Type == s.Type {
							native = true
						}
					}
				}
			}
			if !native && s.Type != "text" && s.Type != "cta" && s.Type != "image" {
				return errors.New("jenis bagian tidak diizinkan untuk halaman ini")
			}
			if native {
				if nativeTypes[s.Type] {
					return errors.New("bagian bawaan tidak boleh digandakan")
				}
				nativeTypes[s.Type] = true
			}
			if s.Variant != "standard" && s.Variant != "compact" {
				return errors.New("variasi tata letak tidak valid")
			}
			if len([]rune(s.Heading)) > 180 || len([]rune(s.Body)) > 10000 || !SafeTarget(s.Href) || s.ImageURL != "" && !uploadPath.MatchString(s.ImageURL) {
				return errors.New("isi, tautan, atau gambar bagian tidak valid")
			}
			if s.Type == "image" && s.ImageURL == "" {
				return errors.New("pilih gambar bagian dari Pustaka Media")
			}
		}
		if builtIn {
			for _, original := range Default().Pages {
				if original.ID == p.ID {
					for _, slot := range original.Sections {
						if !nativeTypes[slot.Type] {
							return errors.New("bagian bawaan harus dipertahankan; nonaktifkan tanpa menghapusnya")
						}
					}
				}
			}
		}
	}
	for _, p := range Default().Pages {
		if !paths[p.Path] {
			return fmt.Errorf("halaman bawaan %s harus dipertahankan; gunakan status arsip", p.Title)
		}
	}
	menus := map[string]Menu{}
	for _, m := range d.Menus {
		if !identifier.MatchString(m.ID) || len([]rune(strings.TrimSpace(m.Label))) < 1 || len([]rune(m.Label)) > 100 || m.Target == "" || !SafeTarget(m.Target) || m.Location != "header" && m.Location != "footer-primary" && m.Location != "footer-info" {
			return errors.New("menu atau tujuan tautan tidak valid")
		}
		if _, ok := menus[m.ID]; ok {
			return errors.New("identitas menu ganda")
		}
		menus[m.ID] = m
		if strings.HasPrefix(m.Target, "/") {
			u, _ := url.Parse(m.Target)
			if d.PageFor(u.Path) == nil {
				return errors.New("menu harus menuju halaman yang terdaftar")
			}
		}
	}
	for _, m := range d.Menus {
		if m.ParentID != "" {
			p, ok := menus[m.ParentID]
			if !ok || p.ID == m.ID || p.ParentID != "" || p.Location != m.Location {
				return errors.New("submenu maksimal satu tingkat dan harus satu lokasi")
			}
		}
	}
	return nil
}

// SECURITY: Unpublished pages and their content never leave the public projection.
func (d Document) Public() Document {
	result := d
	result.Pages = []Page{}
	for _, p := range d.Pages {
		if p.Status == "published" {
			copy := p
			copy.Sections = []Section{}
			module := d.Module(p.ModuleID)
			visible := module == nil || module.PublicEnabled && module.Mode == "local"
			for _, s := range p.Sections {
				featureID := SectionFeature(s.Type)
				if s.Enabled && visible && (featureID == "" || d.LocalFeature(featureID, false)) {
					copy.Sections = append(copy.Sections, s)
				}
			}
			result.Pages = append(result.Pages, copy)
		}
	}
	result.Menus = []Menu{}
	for _, m := range d.Menus {
		if !m.Enabled {
			continue
		}
		if strings.HasPrefix(m.Target, "/") {
			u, err := url.Parse(m.Target)
			if err != nil {
				continue
			}
			p := d.PageFor(u.Path)
			if p == nil || p.Status != "published" {
				continue
			}
			module := d.Module(p.ModuleID)
			if module != nil && (!module.PublicEnabled || module.Mode == "disabled") {
				continue
			}
		}
		result.Menus = append(result.Menus, m)
	}
	return result
}
