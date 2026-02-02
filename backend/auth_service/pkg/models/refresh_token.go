package models

import (
	"context"
	"time"
)

// RefreshToken represents a refresh token stored in the database
type RefreshToken struct {
	ID           string    `json:"id" db:"id"`
	UserID       int       `json:"user_id" db:"user_id"`
	Token        string    `json:"-" db:"token"`
	ExpiresAt    time.Time `json:"expires_at" db:"expires_at"`
	Revoked      bool      `json:"revoked" db:"revoked"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// RefreshTokenCreate represents the data required to create a new refresh token
type RefreshTokenCreate struct {
	UserID   int       `json:"user_id"`
	Token    string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

// RefreshTokenRepository handles refresh token database operations
type RefreshTokenRepository interface {
	Create(ctx context.Context, token *RefreshTokenCreate) (*RefreshToken, error)
	FindByToken(ctx context.Context, token string) (*RefreshToken, error)
	Revoke(ctx context.Context, token string) error
	IsRevoked(ctx context.Context, token string) (bool, error)
	CleanupExpiredTokens(ctx context.Context) error
}

// RefreshTokenService handles refresh token business logic
type RefreshTokenService struct {
	repo RefreshTokenRepository
}

// NewRefreshTokenService creates a new refresh token service
func NewRefreshTokenService(repo RefreshTokenRepository) *RefreshTokenService {
	return &RefreshTokenService{
		repo: repo,
	}
}

// CreateRefreshToken creates a new refresh token for a user
func (s *RefreshTokenService) CreateRefreshToken(ctx context.Context, userID int, token string, expiresAt time.Time) (*RefreshToken, error) {
	tokenCreate := &RefreshTokenCreate{
		UserID:   userID,
		Token:    token,
		ExpiresAt: expiresAt,
	}

	return s.repo.Create(ctx, tokenCreate)
}

// ValidateRefreshToken validates a refresh token
func (s *RefreshTokenService) ValidateRefreshToken(ctx context.Context, token string) (bool, int, error) {
	// Find the token
	tokenEntity, err := s.repo.FindByToken(ctx, token)
	if err != nil {
		return false, 0, err
	}

	// Check if token is revoked
	revoked, err := s.repo.IsRevoked(ctx, token)
	if err != nil {
		return false, 0, err
	}

	if revoked {
		return false, tokenEntity.UserID, nil
	}

	// Check if token is expired
	if time.Now().After(tokenEntity.ExpiresAt) {
		return false, tokenEntity.UserID, nil
	}

	return true, tokenEntity.UserID, nil
}

// RevokeRefreshToken revokes a refresh token
func (s *RefreshTokenService) RevokeRefreshToken(ctx context.Context, token string) error {
	return s.repo.Revoke(ctx, token)
}

// CleanupExpiredTokens removes expired refresh tokens
func (s *RefreshTokenService) CleanupExpiredTokens(ctx context.Context) error {
	return s.repo.CleanupExpiredTokens(ctx)
}