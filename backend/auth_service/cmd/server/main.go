package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/aicd/auth_service/internal/api"
	"github.com/aicd/auth_service/pkg/config"
	"github.com/aicd/auth_service/pkg/database"
	"github.com/aicd/auth_service/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize logger
	logger.Init()
	log.Println("Starting Auth Service...")

	// Load configuration
	cfg := config.Load()

	// Connect to database
	if err := database.Connect(cfg); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Set Gin mode
	if cfg.Server.Mode == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.Default()

	// Initialize API routes with JWT configuration
	jwtSecret := cfg.JWT.Secret
	if jwtSecret == "" {
		jwtSecret = "your-secret-key-change-in-production"
		log.Println("Warning: Using default JWT secret. Please set JWT_SECRET in configuration.")
	}
	
	tokenDuration := time.Duration(cfg.JWT.Expiration) * time.Hour
	
	api.SetupRoutes(router, jwtSecret, tokenDuration)

	// Start server
	log.Printf("Auth Service listening on %s:%d", cfg.Server.Host, cfg.Server.Port)
	if err := router.Run(fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
		os.Exit(1)
	}
}
