package db

import (
	"database/sql"
	"fmt"
	"log-analyzer/internal/models"

	_ "github.com/mattn/go-sqlite3"
)

// InitDB initializes the database and creates tables if they don't exist
func InitDB() error {
	db, err := sql.Open("sqlite3", "./db/database.db")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	// Create log_entries table if it doesn't exist
	query := `CREATE TABLE if not exists log_entries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp TIMESTAMP NOT NULL,
		level VARCHAR(10) NOT NULL,
		message TEXT NOT NULL,
		source VARCHAR(255),
		log_file VARCHAR(255),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	_, err = db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to create table: %w", err)
	}

	return nil
}

func InsertLogEntry(logEntry models.Log) error {
	db, err := sql.Open("sqlite3", "./db/database.db")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	query := `INSERT INTO log_entries (timestamp, level, message, source, log_file) VALUES (?, ?, ?, ?, ?)`
	result, err := db.Exec(query, logEntry.Timestamp, logEntry.Level, logEntry.Message, logEntry.Source, logEntry.LogFile)
	if err != nil {
		return fmt.Errorf("failed to insert log entry: %w", err)
	}

	// Verify insertion
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return fmt.Errorf("no rows affected during insert")
	}

	return nil
}

// GetAllLogs retrieves all log entries from the database
func GetAllLogs() ([]models.Log, error) {
	db, err := sql.Open("sqlite3", "./db/database.db")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	query := `SELECT timestamp, level, message, source, log_file FROM log_entries ORDER BY timestamp DESC`
	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	var logs []models.Log
	for rows.Next() {
		var log models.Log
		err := rows.Scan(&log.Timestamp, &log.Level, &log.Message, &log.Source, &log.LogFile)
		if err != nil {
			return nil, fmt.Errorf("failed to scan log row: %w", err)
		}
		logs = append(logs, log)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return logs, nil
}

// GetLogsByFile retrieves all log entries for a specific log file
func GetLogsByFile(logFile string) ([]models.Log, error) {
	db, err := sql.Open("sqlite3", "./db/database.db")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	query := `SELECT timestamp, level, message, source, log_file FROM log_entries WHERE log_file = ? ORDER BY timestamp DESC`
	rows, err := db.Query(query, logFile)
	if err != nil {
		return nil, fmt.Errorf("failed to query logs: %w", err)
	}
	defer rows.Close()

	var logs []models.Log
	for rows.Next() {
		var log models.Log
		err := rows.Scan(&log.Timestamp, &log.Level, &log.Message, &log.Source, &log.LogFile)
		if err != nil {
			return nil, fmt.Errorf("failed to scan log row: %w", err)
		}
		logs = append(logs, log)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return logs, nil
}
