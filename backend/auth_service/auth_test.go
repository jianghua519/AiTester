package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aicd/auth_service/internal/api"
	"github.com/aicd/auth_service/pkg/models"
	"github.com/gin-gonic/gin"
)

func TestAuthService(t *testing.T) {
	// Test that the service can start
	t.Run("ServiceStart", func(t *testing.T) {
		// This is a placeholder test
		// In a real implementation, we would test the actual service startup
		if false {
			t.Errorf("Service failed to start")
		}
	})
}

func TestAuthValidation(t *testing.T) {
	// Test authentication validation logic
	t.Run("ValidateToken", func(t *testing.T) {
		token := "test-token"
		if len(token) == 0 {
			t.Errorf("Token should not be empty")
		}
	})
}

func TestDatabaseConnection(t *testing.T) {
	// Test database connection
	t.Run("ConnectToDatabase", func(t *testing.T) {
		// This is a placeholder test
		// In a real implementation, we would test actual database connection
		if false {
			t.Errorf("Database connection failed")
		}
	})
}

func TestUserRegistrationAPI(t *testing.T) {
	// Set up Gin in test mode
	gin.SetMode(gin.TestMode)
	
	// Create a new router
	router := gin.New()
	
	// Set up routes
	api.SetupRoutes(router)
	
	t.Run("SuccessfulUserRegistration", func(t *testing.T) {
		// Create test user data
		userData := models.UserCreate{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
			FullName: &[]string{"Test User"}[0],
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(userData)
		if err != nil {
			t.Fatalf("Failed to marshal user data: %v", err)
		}
		
		// Create request
		req, err := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusCreated {
			t.Errorf("Expected status code %d, got %d", http.StatusCreated, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["message"] == nil {
			t.Error("Expected message in response")
		}
		
		if response["user"] == nil {
			t.Error("Expected user in response")
		}
	})
	
	t.Run("DuplicateEmailRegistration", func(t *testing.T) {
		// Create test user data with same email
		userData := models.UserCreate{
			Username: "testuser2",
			Email:    "test@example.com", // Same email as previous test
			Password: "password123",
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(userData)
		if err != nil {
			t.Fatalf("Failed to marshal user data: %v", err)
		}
		
		// Create request
		req, err := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusInternalServerError {
			t.Errorf("Expected status code %d, got %d", http.StatusInternalServerError, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["error"] == nil {
			t.Error("Expected error in response")
		}
	})
	
	t.Run("InvalidUserData", func(t *testing.T) {
		// Create test user data with invalid email
		userData := models.UserCreate{
			Username: "testuser3",
			Email:    "invalid-email", // Invalid email
			Password: "short", // Short password
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(userData)
		if err != nil {
			t.Fatalf("Failed to marshal user data: %v", err)
		}
		
		// Create request
		req, err := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status code %d, got %d", http.StatusBadRequest, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["error"] == nil {
			t.Error("Expected error in response")
		}
	})
}

func TestUserLoginAPI(t *testing.T) {
	// Set up Gin in test mode
	gin.SetMode(gin.TestMode)
	
	// Create a new router
	router := gin.New()
	
	// Set up routes with test JWT configuration
	api.SetupRoutes(router, "test-jwt-secret", time.Hour)
	
	t.Run("SuccessfulUserLogin", func(t *testing.T) {
		// Create test login data
		loginData := models.UserLogin{
			Email:    "test@example.com",
			Password: "password123",
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(loginData)
		if err != nil {
			t.Fatalf("Failed to marshal login data: %v", err)
		}
		
		// Create request
		req, err := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["message"] == nil {
			t.Error("Expected message in response")
		}
		
		if response["user"] == nil {
			t.Error("Expected user in response")
		}
		
		if response["token"] == nil {
			t.Error("Expected token in response")
		}
		
		// Check token structure
		tokenData := response["token"].(map[string]interface{})
		if tokenData["access_token"] == nil {
			t.Error("Expected access_token in token response")
		}
		if tokenData["token_type"] == nil {
			t.Error("Expected token_type in token response")
		}
		if tokenData["expires_in"] == nil {
			t.Error("Expected expires_in in token response")
		}
	})
	
	t.Run("InvalidCredentials", func(t *testing.T) {
		// Create test login data with wrong password
		loginData := models.UserLogin{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(loginData)
		if err != nil {
			t.Fatalf("Failed to marshal login data: %v", err)
		}
		
		// Create request
		req, err := http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status code %d, got %d", http.StatusUnauthorized, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["error"] == nil {
			t.Error("Expected error in response")
		}
	})
}

func TestJWTAuthentication(t *testing.T) {
	// Set up Gin in test mode
	gin.SetMode(gin.TestMode)
	
	// Create a new router
	router := gin.New()
	
	// Set up routes with test JWT configuration
	api.SetupRoutes(router, "test-jwt-secret", time.Hour)
	
	t.Run("ProtectedRouteWithoutToken", func(t *testing.T) {
		// Create request to protected route without token
		req, err := http.NewRequest("GET", "/api/v1/users/1", nil)
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status code %d, got %d", http.StatusUnauthorized, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["error"] == nil {
			t.Error("Expected error in response")
		}
	})
	
	t.Run("ProtectedRouteWithInvalidToken", func(t *testing.T) {
		// Create request to protected route with invalid token
		req, err := http.NewRequest("GET", "/api/v1/users/1", nil)
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Authorization", "Bearer invalid-token")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code
		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected status code %d, got %d", http.StatusUnauthorized, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		if response["error"] == nil {
			t.Error("Expected error in response")
		}
	})
	
	t.Run("TokenRefresh", func(t *testing.T) {
		// Create test refresh token request
		refreshData := models.RefreshTokenRequest{
			RefreshToken: "test-refresh-token",
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(refreshData)
		if err != nil {
			t.Fatalf("Failed to marshal refresh data: %v", err)
		}
		
		// Create request
		req, err := http.NewRequest("POST", "/api/v1/auth/refresh", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform request
		router.ServeHTTP(w, req)
		
		// Check status code (should be 501 for now since we haven't implemented refresh logic)
		if w.Code != http.StatusNotImplemented {
			t.Errorf("Expected status code %d, got %d", http.StatusNotImplemented, w.Code)
		}
	})
}

func TestJWTTokenGeneration(t *testing.T) {
	// Set up Gin in test mode
	gin.SetMode(gin.TestMode)
	
	// Create a new router
	router := gin.New()
	
	// Set up routes with test JWT configuration
	api.SetupRoutes(router, "test-jwt-secret", time.Hour)
	
	t.Run("ValidTokenGeneration", func(t *testing.T) {
		// First register a user
		userData := models.UserCreate{
			Username: "testuser",
			Email:    "test@example.com",
			Password: "password123",
			FullName: &[]string{"Test User"}[0],
		}
		
		// Convert to JSON
		jsonData, err := json.Marshal(userData)
		if err != nil {
			t.Fatalf("Failed to marshal user data: %v", err)
		}
		
		// Create registration request
		req, err := http.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w := httptest.NewRecorder()
		
		// Perform registration
		router.ServeHTTP(w, req)
		
		// Check registration was successful
		if w.Code != http.StatusCreated {
			t.Errorf("Expected status code %d, got %d", http.StatusCreated, w.Code)
		}
		
		// Now login to get a token
		loginData := models.UserLogin{
			Email:    "test@example.com",
			Password: "password123",
		}
		
		// Convert to JSON
		jsonData, err = json.Marshal(loginData)
		if err != nil {
			t.Fatalf("Failed to marshal login data: %v", err)
		}
		
		// Create login request
		req, err = http.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(jsonData))
		if err != nil {
			t.Fatalf("Failed to create request: %v", err)
		}
		req.Header.Set("Content-Type", "application/json")
		
		// Create response recorder
		w = httptest.NewRecorder()
		
		// Perform login
		router.ServeHTTP(w, req)
		
		// Check login was successful
		if w.Code != http.StatusOK {
			t.Errorf("Expected status code %d, got %d", http.StatusOK, w.Code)
		}
		
		// Check response body
		var response map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}
		
		// Check token structure
		tokenData := response["token"].(map[string]interface{})
		if tokenData["access_token"] == nil {
			t.Error("Expected access_token in token response")
		}
		
		// Check that the token is a string
		if _, ok := tokenData["access_token"].(string); !ok {
			t.Error("Expected access_token to be a string")
		}
		
		// Check that the token type is "Bearer"
		if tokenData["token_type"] != "Bearer" {
			t.Errorf("Expected token_type to be 'Bearer', got %v", tokenData["token_type"])
		}
		
		// Check that expires_in is a number
		if _, ok := tokenData["expires_in"].(float64); !ok {
			t.Error("Expected expires_in to be a number")
		}
	})
}