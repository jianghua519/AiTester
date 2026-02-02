package config

import (
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server     ServerConfig
	NATS       NATSConfig
	Slack      SlackConfig
	Email      EmailConfig
}

type ServerConfig struct {
	Host string
	Port int
	Mode string
}

type NATSConfig struct {
	URL string
}

type SlackConfig struct {
	WebhookURL string
}

type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	From         string
}

func Load() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./configs")
	viper.AddConfigPath(".")

	// Set defaults
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 8005)
	viper.SetDefault("server.mode", "debug")
	viper.SetDefault("nats.url", "nats://localhost:4222")

	// Read environment variables
	viper.AutomaticEnv()

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatalf("Failed to unmarshal config: %v", err)
	}

	return &cfg
}
