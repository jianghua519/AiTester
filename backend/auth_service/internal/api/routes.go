package api

import (
	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
	// Health check
	router.GET("/health", healthCheck)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", register)
			auth.POST("/login", login)
			auth.POST("/refresh", refresh)
		}

		// User routes (protected)
		users := v1.Group("/users")
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

// Register handler (placeholder)
func register(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "register endpoint - to be implemented",
	})
}

// Login handler (placeholder)
func login(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "login endpoint - to be implemented",
	})
}

// Refresh handler (placeholder)
func refresh(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "refresh endpoint - to be implemented",
	})
}

// Get user handler (placeholder)
func getUser(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "get user endpoint - to be implemented",
	})
}

// Update user handler (placeholder)
func updateUser(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "update user endpoint - to be implemented",
	})
}

// Delete user handler (placeholder)
func deleteUser(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "delete user endpoint - to be implemented",
	})
}
