package main

import (
	"log"
	"os"

	"github.com/aicd/execution_master/internal/api"
	"github.com/aicd/execution_master/internal/scheduler"
	"github.com/aicd/execution_master/pkg/config"
	"github.com/aicd/execution_master/pkg/logger"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize logger
	logger.Init()
	log.Println("Starting Execution Master...")

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

	// Start scheduler
	go scheduler.Start(cfg.Redis.URL)

	// Start server
	log.Printf("Execution Master listening on %s:%d", cfg.Server.Host, cfg.Server.Port)
	if err := router.Run(fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
		os.Exit(1)
	}
}
