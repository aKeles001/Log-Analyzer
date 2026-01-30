package engine

import (
	"fmt"
	"log-analyzer/internal/models"
	"log-analyzer/internal/reader"
)

func Evaluate(entry models.Log) (models.Log, error) {
	rules, err := reader.LoadRules()
	if err != nil {
		return entry, fmt.Errorf("failed to load rules: %w", err)
	}
	for _, rule := range rules {
		if rule.CompiledPattern.MatchString(entry.Message) {
			entry.Level = rule.Severity
			break
		}
	}
	return entry, nil
}
