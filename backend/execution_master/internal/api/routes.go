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
		// Agent management
		agents := v1.Group("/agents")
		{
			agents.GET("", listAgents)
			agents.GET("/:id", getAgent)
			agents.DELETE("/:id", deleteAgent)
		}

		// Task management
		tasks := v1.Group("/tasks")
		{
			tasks.POST("", createTask)
			tasks.GET("/:id", getTask)
		}
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":  "ok",
		"service": "execution_master",
	})
}

func listAgents(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "list agents endpoint - to be implemented",
	})
}

func getAgent(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "get agent endpoint - to be implemented",
	})
}

func deleteAgent(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "delete agent endpoint - to be implemented",
	})
}

func createTask(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "create task endpoint - to be implemented",
	})
}

func getTask(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "get task endpoint - to be implemented",
	})
}
