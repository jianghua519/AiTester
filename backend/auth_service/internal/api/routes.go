package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/aicd/auth_service/internal/middleware"
	"github.com/aicd/auth_service/internal/service"
	"github.com/aicd/auth_service/pkg/models"
	"github.com/gin-gonic/gin"
)

var (
	userService *service.UserService
)

// SetupRoutes sets up the API routes
func SetupRoutes(router *gin.Engine, jwtSecret string, tokenDuration time.Duration) {
	// Initialize user service with JWT configuration
	userService = service.NewUserService(jwtSecret, tokenDuration)

	// Health check
	router.GET("/health", healthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (no authentication required)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", register)
			auth.POST("/login", login)
			auth.POST("/refresh", refresh)
		}

		// User routes (protected - require authentication)
		users := v1.Group("/users")
		users.Use(middleware.RequireAuth(userService))
		{
			users.GET("/:id", getUser)
			users.PUT("/:id", updateUser)
			users.DELETE("/:id", deleteUser)
		}
	}
}

// Health check handler
func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status": "ok",
		"service": "auth_service",
	})
}

// Register handler creates a new user
func register(c *gin.Context) {
	var userCreate models.UserCreate
	
	// Bind JSON request to UserCreate struct
	if err := c.ShouldBindJSON(&userCreate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate input
	if err := validateUserCreate(&userCreate); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Validation failed",
			"details": err.Error(),
		})
		return
	}

	// Create user
	user, err := userService.Register(c.Request.Context(), &userCreate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user": user,
	})
}

// Login handler authenticates a user and returns JWT tokens
func login(c *gin.Context) {
	var login models.UserLogin
	
	// Bind JSON request to UserLogin struct
	if err := c.ShouldBindJSON(&login); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Authenticate user
	user, accessToken, refreshToken, err := userService.Login(c.Request.Context(), &login)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication failed",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"user": user,
		"tokens": gin.H{
			"access_token": accessToken,
			"refresh_token": refreshToken,
			"token_type":   "Bearer",
			"expires_in":   86400, // 24 hours in seconds
		},
	})
}

// Refresh handler refreshes a JWT token using a refresh token
func refresh(c *gin.Context) {
	var refreshReq models.RefreshTokenRequest
	
	// Bind JSON request to RefreshTokenRequest struct
	if err := c.ShouldBindJSON(&refreshReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
			"details": err.Error(),
		})
		return
	}

	// Validate the refresh token
	valid, userID, err := userService.ValidateRefreshToken(c.Request.Context(), refreshReq.RefreshToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to validate refresh token",
			"details": err.Error(),
		})
		return
	}

	if !valid {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired refresh token",
		})
		return
	}

	// Get user information (in a real implementation, you would fetch from database)
	// For now, we'll use placeholder data
	accessToken, err := userService.GenerateNewToken(userID, "placeholder", "placeholder@example.com")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate new token",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Token refreshed successfully",
		"tokens": gin.H{
			"access_token": accessToken,
			"token_type":   "Bearer",
			"expires_in":   86400, // 24 hours in seconds
		},
	})
}

// Get user handler retrieves a user by ID (protected route)
func getUser(c *gin.Context) {
	// Get the requested user ID from the path parameter
	requestedUserID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// Get the current authenticated user from the context
	currentUserID, _, _ := middleware.GetCurrentUser(c)

	// In a real implementation, you might want to add authorization checks
	// For now, we'll allow users to access their own profile data
	if currentUserID != requestedUserID {
		c.JSON(http.StatusForbidden, gin.H{
			"error": "You can only access your own profile",
		})
		return
	}

	user, err := userService.GetByID(c.Request.Context(), requestedUserID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "User not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// Update user handler (placeholder - to be implemented)
func updateUser(c *gin.Context) {
	c.JSON(501, gin.H{
		"error": "Not implemented",
		"message": "User update functionality will be implemented in future versions",
	})
}

// Delete user handler (placeholder - to be implemented)
func deleteUser(c *gin.Context) {
	c.JSON(501, gin.H{
		"error": "Not implemented",
		"message": "User delete functionality will be implemented in future versions",
	})
}

// validateUserCreate validates the user creation request
func validateUserCreate(userCreate *models.UserCreate) error {
	if userCreate.Username == "" {
		return errors.New("username is required")
	}
	if len(userCreate.Username) < 3 || len(userCreate.Username) > 50 {
		return errors.New("username must be between 3 and 50 characters")
	}
	if userCreate.Email == "" {
		return errors.New("email is required")
	}
	// Email validation would be done by the binding tags
	if userCreate.Password == "" {
		return errors.New("password is required")
	}
	if len(userCreate.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	return nil
}
