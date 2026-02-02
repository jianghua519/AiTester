package middleware

import (
	"net/http"
	"strings"

	"github.com/aicd/auth_service/internal/service"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware creates a middleware to authenticate requests using JWT
func AuthMiddleware(userService *service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		// Extract the token from the header
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			// No "Bearer " prefix found
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		// Verify the token
		claims, err := userService.VerifyToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
				"details": err.Error(),
			})
			c.Abort()
			return
		}

		// Store the user information in the context
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Set("claims", claims)

		// Continue to the next handler
		c.Next()
	}
}

// GetCurrentUser extracts the current user from the context
func GetCurrentUser(c *gin.Context) (int, string, string) {
	userID, _ := c.Get("user_id")
	username, _ := c.Get("username")
	email, _ := c.Get("email")
	
	return userID.(int), username.(string), email.(string)
}

// RequireAuth is a middleware that requires authentication
func RequireAuth(userService *service.UserService) gin.HandlerFunc {
	return AuthMiddleware(userService)
}

// OptionalAuth is a middleware that allows optional authentication
func OptionalAuth(userService *service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No token provided, continue without authentication
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			// Invalid format, continue without authentication
			c.Next()
			return
		}

		// Verify the token if provided
		claims, err := userService.VerifyToken(tokenString)
		if err == nil {
			// Token is valid, store user info in context
			c.Set("user_id", claims.UserID)
			c.Set("username", claims.Username)
			c.Set("email", claims.Email)
			c.Set("claims", claims)
		}

		// Continue to the next handler regardless of token validity
		c.Next()
	}
}