package handler

import (
	"net/mail"
	"regexp"
	"strings"
	"unicode/utf8"
)

var (
	usernamePattern = regexp.MustCompile(`^[A-Za-z0-9._-]{3,64}$`)
	rolePattern     = regexp.MustCompile(`^[A-Za-z0-9:_-]{1,64}$`)
)

type userMutationRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
	Password string `json:"password"`
}

func validateUserMutation(req *userMutationRequest, passwordRequired bool) string {
	req.Username = strings.TrimSpace(req.Username)
	req.Email = strings.TrimSpace(req.Email)
	req.FullName = strings.TrimSpace(req.FullName)
	req.Role = strings.TrimSpace(req.Role)

	if !usernamePattern.MatchString(req.Username) {
		return "Username must contain 3-64 letters, numbers, dots, underscores, or hyphens"
	}
	if len(req.Email) > 254 {
		return "Invalid email address"
	}
	parsedEmail, err := mail.ParseAddress(req.Email)
	if err != nil || parsedEmail.Address != req.Email {
		return "Invalid email address"
	}
	nameLength := utf8.RuneCountInString(req.FullName)
	if nameLength < 2 || nameLength > 120 {
		return "Full name must contain 2-120 characters"
	}
	if !rolePattern.MatchString(req.Role) {
		return "Invalid role"
	}
	if passwordRequired || req.Password != "" {
		if len(req.Password) < 12 || len(req.Password) > 128 {
			return "Password must contain 12-128 characters"
		}
	}
	return ""
}
