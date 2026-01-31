package exporter

import (
	"encoding/csv"
	"fmt"
	"os"
	"time"

	"log-analyzer/internal/models"
)

func ExportToCSV(logs []models.Log, filePath string) error {
	if len(logs) == 0 {
		return fmt.Errorf("no logs to export")
	}
	file, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to create CSV file: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	header := []string{"Timestamp", "Level", "Source", "Message", "LogFile"}
	if err := writer.Write(header); err != nil {
		return fmt.Errorf("failed to write header: %w", err)
	}

	for _, log := range logs {
		row := []string{
			log.Timestamp.Format(time.RFC3339),
			log.Level,
			log.Source,
			log.Message,
			log.LogFile,
		}
		if err := writer.Write(row); err != nil {
			return fmt.Errorf("failed to write row: %w", err)
		}
	}

	return nil
}

func ExportToCSVByLogFile(logs []models.Log, logFile string, outputPath string) error {
	var filteredLogs []models.Log
	for _, log := range logs {
		if log.LogFile == logFile {
			filteredLogs = append(filteredLogs, log)
		}
	}
	if len(filteredLogs) == 0 {
		return fmt.Errorf("no logs found for file: %s", logFile)
	}
	return ExportToCSV(filteredLogs, outputPath)
}
