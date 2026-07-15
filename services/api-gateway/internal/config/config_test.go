package config

import "testing"

func TestValidateRejectsWeakProductionStreamToken(t *testing.T) {
	config := &AppConfig{
		Env:                 "production",
		KeycloakIssuer:      "https://sso.example.test/realms/porprov",
		JWTAllowedClients:   []string{"porprov-admin-web"},
		AllowedOrigins:      []string{"https://admin.example.test"},
		InternalStreamToken: "local-development-stream-token",
	}
	if err := config.Validate(); err == nil {
		t.Fatal("expected weak production stream token to be rejected")
	}
}

func TestValidateAllowsExplicitDevelopmentConfiguration(t *testing.T) {
	config := &AppConfig{
		Env:                 "development",
		KeycloakIssuer:      "http://localhost:8080/realms/porprov",
		JWTAllowedClients:   []string{"porprov-admin-web"},
		AllowedOrigins:      []string{"http://localhost:5174"},
		InternalStreamToken: "local-development-stream-token",
	}
	if err := config.Validate(); err != nil {
		t.Fatalf("expected development configuration to pass: %v", err)
	}
}
