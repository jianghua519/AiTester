package main

import (
	"log"
	"os"

	"github.com/aicd/notification_service/internal/api"
	"github.com/aicd/notification_service/pkg/config"
	"github.com/aicd/notification_service/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize logger
	logger.Init()
	log.Println("Starting Notification Service...")

	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	if cfg.Server.Mode == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.Default()

	// Initialize API routes
	api.SetupRoutes(router)

	// Start server
	log.Printf("Notification Service listening on %s:%d", cfg.Server.Host, cfg.Server.Port)
	if err := router.Run(fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
		os.Exit(1)
	}
}
