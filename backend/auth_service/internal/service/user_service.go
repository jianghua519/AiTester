package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/aicd/auth_service/internal/repository"
	"github.com/aicd/auth_service/pkg/jwt"
	"github.com/aicd/auth_service/pkg/models"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	userRepo       *repository.UserRepository
	jwtMgr         *jwt.JWTManager
	refreshTokenMgr *models.RefreshTokenService
}

func NewUserService(jwtSecret string, tokenDuration time.Duration) *UserService {
	// In a real implementation, you would inject the refresh token repository
	// For now, we'll create a placeholder
	return &UserService{
		userRepo:       repository.NewUserRepository(),
		jwtMgr:         jwt.NewJWTManager(jwtSecret, tokenDuration),
		refreshTokenMgr: models.NewRefreshTokenService(nil), // Placeholder
	}
}

// Register creates a new user with proper validation and password hashing
func (s *UserService) Register(ctx context.Context, userCreate *models.UserCreate) (*models.UserResponse, error) {
	// Check if email already exists
	emailExists, err := s.userRepo.EmailExists(ctx, userCreate.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check email existence: %w", err)
	}
	if emailExists {
		return nil, fmt.Errorf("email already registered")
	}

	// Check if username already exists
	usernameExists, err := s.userRepo.UsernameExists(ctx, userCreate.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to check username existence: %w", err)
	}
	if usernameExists {
		return nil, fmt.Errorf("username already taken")
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(userCreate.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user entity
	user := &models.User{
		Username:     userCreate.Username,
		Email:        userCreate.Email,
		PasswordHash: string(passwordHash),
		FullName:     userCreate.FullName,
		AvatarURL:    userCreate.AvatarURL,
		IsActive:     true,
	}

	// Save user to database
	createdUser, err := s.userRepo.Create(ctx, userCreate)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Convert to response format (excluding sensitive data)
	return s.toUserResponse(createdUser), nil
}

// Login authenticates a user and returns a JWT token
func (s *UserService) Login(ctx context.Context, login *models.UserLogin) (*models.UserResponse, string, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, login.Email)
	if err != nil {
		return nil, "", fmt.Errorf("invalid credentials")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, "", fmt.Errorf("account is inactive")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(login.Password))
	if err != nil {
		return nil, "", fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	token, err := s.generateJWTToken(user)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}

	// Convert to response format (excluding sensitive data)
	return s.toUserResponse(user), token, nil
}

// GetByID retrieves a user by ID
func (s *UserService) GetByID(ctx context.Context, id int) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return s.toUserResponse(user), nil
}

// toUserResponse converts a User model to UserResponse (excluding sensitive data)
func (s *UserService) toUserResponse(user *models.User) *models.UserResponse {
	return &models.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Email:     user.Email,
		FullName:  user.FullName,
		AvatarURL: user.AvatarURL,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
	}
}

// Login authenticates a user and returns a JWT token and refresh token
func (s *UserService) Login(ctx context.Context, login *models.UserLogin) (*models.UserResponse, string, string, error) {
	// Find user by email
	user, err := s.userRepo.FindByEmail(ctx, login.Email)
	if err != nil {
		return nil, "", "", fmt.Errorf("invalid credentials")
	}

	// Check if user is active
	if !user.IsActive {
		return nil, "", "", fmt.Errorf("account is inactive")
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(login.Password))
	if err != nil {
		return nil, "", "", fmt.Errorf("invalid credentials")
	}

	// Generate JWT token
	accessToken, err := s.jwtMgr.GenerateToken(user.ID, user.Username, user.Email)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := s.generateRefreshToken(user.ID)
	if err != nil {
		return nil, "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Convert to response format (excluding sensitive data)
	return s.toUserResponse(user), accessToken, refreshToken, nil
}

// generateRefreshToken generates a secure refresh token
func (s *UserService) generateRefreshToken(userID int) (string, error) {
	// Generate a random refresh token
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate refresh token: %w", err)
	}
	
	token := hex.EncodeToString(bytes)
	
	// In a real implementation, you would store this refresh token in the database
	// For now, we'll just return it
	
	return token, nil
}

// VerifyToken verifies a JWT token and returns the user claims
func (s *UserService) VerifyToken(tokenString string) (*jwt.Claims, error) {
	return s.jwtMgr.VerifyToken(tokenString)
}

// GetUserIDFromToken extracts user ID from a token
func (s *UserService) GetUserIDFromToken(tokenString string) (int, error) {
	return s.jwtMgr.GetUserIDFromToken(tokenString)
}

// GenerateNewToken generates a new JWT token for an existing user
func (s *UserService) GenerateNewToken(userID int, username, email string) (string, error) {
	return s.jwtMgr.GenerateToken(userID, username, email)
}

// ValidateRefreshToken validates a refresh token
func (s *UserService) ValidateRefreshToken(ctx context.Context, refreshToken string) (bool, int, error) {
	if s.refreshTokenMgr == nil {
		// For demo purposes, accept any refresh token that's not empty
		if refreshToken != "" {
			return true, 1, nil // Return placeholder user ID
		}
		return false, 0, nil
	}
	
	return s.refreshTokenMgr.ValidateRefreshToken(ctx, refreshToken)
}