package models

import "time"

type Log struct {
	Timestamp time.Time
	Level     string // e.g., "INFO", "HIGH", "CRITICAL"
	Source    string
	Message   string
	LogFile   string
	Raw       string
}
