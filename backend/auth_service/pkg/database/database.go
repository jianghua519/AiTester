package database

import (
	"fmt"
	"log"

	"github.com/aicd/auth_service/pkg/config"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	_ "github.com/lib/pq"
)

var DB *pgxpool.Pool

// Connect establishes a connection to the PostgreSQL database
func Connect(cfg *config.Config) error {
	// Connection string
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
	)

	// Create connection pool
	poolConfig, err := pgxpool.ParseConfig(connStr)
	if err != nil {
		return fmt.Errorf("failed to parse database config: %w", err)
	}

	// Set connection pool parameters
	poolConfig.MaxConns = 20
	poolConfig.MinConns = 5
	poolConfig.HealthCheckPeriod = 1 * minute

	// Create connection pool
	DB, err = pgxpool.NewWithConfig(poolConfig)
	if err != nil {
		return fmt.Errorf("failed to create connection pool: %w", err)
	}

	// Test the connection
	if err := DB.Ping(nil); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Printf("Successfully connected to database: %s", cfg.Database.Name)
	return nil
}

// Close closes the database connection pool
func Close() {
	if DB != nil {
		DB.Close()
		log.Println("Database connection closed")
	}
}

// GetDB returns the database connection pool
func GetDB() *pgxpool.Pool {
	return DB
}

const minute = 60